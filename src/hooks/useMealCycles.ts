
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { MealCycle, GlucoseReading } from '@/types';
import { useToast } from '@/components/ui/toast';

export const useMealCycles = () => {
  const { user } = useAuth();
  const [mealCycles, setMealCycles] = useState<MealCycle[]>([]);
  const [activeMealCycle, setActiveMealCycle] = useState<MealCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user's meal cycles
  useEffect(() => {
    if (!user) {
      setMealCycles([]);
      setActiveMealCycle(null);
      setLoading(false);
      return;
    }

    const fetchMealCycles = async () => {
      try {
        setLoading(true);
        
        const q = query(
          collection(db, 'mealCycles'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const cycles: MealCycle[] = [];
        let active = null;
        
        querySnapshot.forEach((doc) => {
          const cycle = { 
            id: doc.id, 
            ...doc.data() 
          } as MealCycle;
          
          cycles.push(cycle);
          
          // Check if any cycle is active
          if (cycle.status === 'active') {
            active = cycle;
          }
        });
        
        setMealCycles(cycles);
        setActiveMealCycle(active);
      } catch (error) {
        toast({
          title: "Error fetching meal cycles",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMealCycles();
  }, [user, toast]);

  // Start a new meal cycle with preprandial reading
  const startMealCycle = async (preprandialValue: number) => {
    if (!user) return null;
    
    try {
      const now = Date.now();
      
      const preprandialReading: Omit<GlucoseReading, 'id'> = {
        value: preprandialValue,
        timestamp: now,
        type: 'preprandial'
      };
      
      const newCycle: Omit<MealCycle, 'id'> = {
        userId: user.uid,
        startTime: 0, // Will be set when first bite is recorded
        preprandialReading: { id: 'temp', ...preprandialReading },
        postprandialReadings: {},
        status: 'active',
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(collection(db, 'mealCycles'), newCycle);
      
      // Update the reading with proper ID
      const readingWithId: GlucoseReading = {
        id: `${docRef.id}_pre`,
        ...preprandialReading
      };
      
      // Update the document with the reading ID
      await updateDoc(doc(db, 'mealCycles', docRef.id), {
        preprandialReading: readingWithId
      });
      
      const createdCycle: MealCycle = {
        id: docRef.id,
        ...newCycle,
        preprandialReading: readingWithId
      };
      
      setMealCycles(prev => [createdCycle, ...prev]);
      setActiveMealCycle(createdCycle);
      
      toast({
        title: "Meal cycle started",
        description: "Your preprandial reading has been recorded. Press 'First Bite' when you start eating.",
      });
      
      return createdCycle;
    } catch (error) {
      toast({
        title: "Error starting meal cycle",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  };

  // Record first bite and start the timer
  const recordFirstBite = async () => {
    if (!activeMealCycle || !user) return null;
    
    try {
      const now = Date.now();
      
      await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
        startTime: now,
        updatedAt: now
      });
      
      const updatedCycle = {
        ...activeMealCycle,
        startTime: now,
        updatedAt: now
      };
      
      setActiveMealCycle(updatedCycle);
      setMealCycles(prev => prev.map(cycle => 
        cycle.id === updatedCycle.id ? updatedCycle : cycle
      ));
      
      toast({
        title: "First bite recorded",
        description: "Your meal cycle timer has started. You'll receive notifications for glucose readings.",
      });
      
      // Schedule notifications here in a real app
      
      return updatedCycle;
    } catch (error) {
      toast({
        title: "Error recording first bite",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  };

  // Record a postprandial reading
  const recordPostprandialReading = async (minutesMark: number, value: number) => {
    if (!activeMealCycle || !user) return null;
    
    try {
      const now = Date.now();
      // Check if the reading is too late (7+ minutes after scheduled time)
      const expectedTime = activeMealCycle.startTime + (minutesMark * 60 * 1000);
      const isLate = now > (expectedTime + (7 * 60 * 1000));
      
      if (isLate) {
        toast({
          title: "Reading too late",
          description: `You're more than 7 minutes late for the ${minutesMark}-minute reading. This reading will not be counted.`,
          variant: "destructive",
        });
        return null;
      }
      
      const newReading: GlucoseReading = {
        id: `${activeMealCycle.id}_${minutesMark}`,
        value,
        timestamp: now,
        type: 'postprandial',
        minutesMark
      };
      
      // Update the meal cycle with the new reading
      const updatedReadings = {
        ...activeMealCycle.postprandialReadings,
        [minutesMark]: newReading
      };
      
      // Check if this is the final reading (180 minutes)
      const isComplete = minutesMark === 180;
      const updatedStatus = isComplete ? 'completed' : 'active';
      
      await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
        [`postprandialReadings.${minutesMark}`]: newReading,
        status: updatedStatus,
        updatedAt: now
      });
      
      const updatedCycle = {
        ...activeMealCycle,
        postprandialReadings: updatedReadings,
        status: updatedStatus as ('active' | 'completed'),
        updatedAt: now
      };
      
      setMealCycles(prev => prev.map(cycle => 
        cycle.id === updatedCycle.id ? updatedCycle : cycle
      ));
      
      if (isComplete) {
        setActiveMealCycle(null);
        toast({
          title: "Meal cycle completed",
          description: "Your 3-hour meal cycle is now complete. You can view the results in your history.",
        });
      } else {
        setActiveMealCycle(updatedCycle);
        toast({
          title: "Reading recorded",
          description: `Your ${minutesMark}-minute reading has been saved successfully.`,
        });
      }
      
      return updatedCycle;
    } catch (error) {
      toast({
        title: "Error recording reading",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  };

  // Abandon current meal cycle
  const abandonMealCycle = async () => {
    if (!activeMealCycle || !user) return false;
    
    try {
      await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
        status: 'abandoned',
        updatedAt: Date.now()
      });
      
      setMealCycles(prev => prev.map(cycle => 
        cycle.id === activeMealCycle.id 
          ? { ...cycle, status: 'abandoned', updatedAt: Date.now() } 
          : cycle
      ));
      
      setActiveMealCycle(null);
      
      toast({
        title: "Meal cycle abandoned",
        description: "Your current meal cycle has been abandoned. You can start a new one.",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Error abandoning meal cycle",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    mealCycles,
    activeMealCycle,
    loading,
    startMealCycle,
    recordFirstBite,
    recordPostprandialReading,
    abandonMealCycle
  };
};
