import { useState, useEffect, useRef } from 'react';
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
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { MealCycle, GlucoseReading } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface PendingAction {
  type: 'start' | 'firstBite' | 'reading' | 'abandon';
  data: any;
  timestamp: number;
}

const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `mc-${timestamp}-${randomStr}`;
};

export const useMealCycles = () => {
  const { user } = useAuth();
  const [mealCycles, setMealCycles] = useState<MealCycle[]>([]);
  const [activeMealCycle, setActiveMealCycle] = useState<MealCycle | null>(null);
  const [pendingMealCycle, setPendingMealCycle] = useState<Partial<MealCycle> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { toast } = useToast();
  const networkListenerAdded = useRef(false);

  useEffect(() => {
    if (networkListenerAdded.current) return;
    
    const handleOnline = () => {
      setIsOffline(false);
      enableNetwork(db).catch(console.error);
      toast({ 
        title: "You're back online",
        description: "Your data will now sync with the server."
      });
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      disableNetwork(db).catch(console.error);
      toast({ 
        title: "You're offline",
        description: "The app will continue to work, but changes won't be saved to the server until you're back online.",
        variant: "destructive"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setIsOffline(!navigator.onLine);
    
    networkListenerAdded.current = true;
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  useEffect(() => {
    if (!user) {
      setMealCycles([]);
      setActiveMealCycle(null);
      setPendingMealCycle(null);
      setLoading(false);
      return;
    }

    const fetchMealCycles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const q = query(
          collection(db, 'mealCycles'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        try {
          const querySnapshot = await getDocs(q);
          const cycles: MealCycle[] = [];
          let active = null;
          
          querySnapshot.forEach((doc) => {
            const cycle = { 
              id: doc.id, 
              ...doc.data() 
            } as MealCycle;
            
            cycles.push(cycle);
            
            if (cycle.status === 'active') {
              active = cycle;
            }
          });
          
          setMealCycles(cycles);
          setActiveMealCycle(active);
        } catch (err) {
          console.error("Error fetching meal cycles:", err);
          if (isOffline || !navigator.onLine) {
            setError("You're currently offline. Your data will sync when you're back online.");
          } else {
            setError("Could not connect to the database. Please try again later.");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMealCycles();
  }, [user, isOffline, toast]);

  const startMealCycle = async (preprandialValue: number) => {
    if (!user) return null;
    setError(null);
    
    try {
      const now = Date.now();
      const uniqueCycleId = generateUniqueId();
      
      const preprandialReading: Omit<GlucoseReading, 'id'> = {
        value: preprandialValue,
        timestamp: now,
        type: 'preprandial'
      };
      
      const tempCycle: Partial<MealCycle> = {
        userId: user.uid,
        startTime: 0,
        preprandialReading: { 
          id: 'temp_' + now, 
          ...preprandialReading 
        },
        postprandialReadings: {},
        status: 'active',
        createdAt: now,
        updatedAt: now,
        uniqueId: uniqueCycleId
      };
      
      if (isOffline || !navigator.onLine) {
        setPendingMealCycle(tempCycle);
        toast({
          title: "Preprandial reading saved",
          description: "You're offline, but you can continue with your meal cycle. Your data will sync when you're back online.",
        });
        return tempCycle;
      }
      
      const newCycle: Omit<MealCycle, 'id'> = {
        userId: user.uid,
        startTime: 0,
        preprandialReading: { id: 'temp', ...preprandialReading },
        postprandialReadings: {},
        status: 'active',
        createdAt: now,
        updatedAt: now,
        uniqueId: uniqueCycleId
      };
      
      try {
        const docRef = await addDoc(collection(db, 'mealCycles'), newCycle);
        
        const readingWithId: GlucoseReading = {
          id: `${docRef.id}_pre`,
          ...preprandialReading
        };
        
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
        setPendingMealCycle(null);
        
        toast({
          title: "Meal cycle started",
          description: `Your preprandial reading has been recorded (ID: ${uniqueCycleId.substring(0, 8)}). Press 'First Bite' when you start eating.`,
        });
        
        return createdCycle;
      } catch (err) {
        console.error("Error with Firestore, using local storage instead:", err);
        setPendingMealCycle(tempCycle);
        setError("Could not save to database. Working in offline mode now.");
        return tempCycle;
      }
    } catch (error) {
      console.error("Error starting meal cycle:", error);
      toast({
        title: "Error starting meal cycle",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setError("Failed to start meal cycle. Please try again.");
      return null;
    }
  };

  const recordFirstBite = async () => {
    if (!user) return null;
    setError(null);
    
    try {
      const now = Date.now();
      
      if (pendingMealCycle) {
        const updatedCycle = {
          ...pendingMealCycle,
          startTime: now,
          updatedAt: now
        };
        
        setPendingMealCycle(updatedCycle);
        
        toast({
          title: "First bite recorded",
          description: "Your meal cycle timer has started. You'll receive notifications for glucose readings.",
        });
        
        return updatedCycle;
      }
      
      if (!activeMealCycle) {
        toast({
          title: "No active meal cycle",
          description: "Please start a meal cycle first.",
          variant: "destructive",
        });
        return null;
      }
      
      try {
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
        
        return updatedCycle;
      } catch (err) {
        console.error("Error recording first bite:", err);
        setError("Could not save to database. Working in offline mode now.");
        
        if (activeMealCycle) {
          const updatedCycle = {
            ...activeMealCycle,
            startTime: now,
            updatedAt: now
          };
          
          setActiveMealCycle(updatedCycle);
          
          toast({
            title: "First bite recorded locally",
            description: "Your data will sync when you're back online.",
          });
          
          return updatedCycle;
        }
      }
    } catch (error) {
      toast({
        title: "Error recording first bite",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setError("Failed to record first bite. Please try again.");
      return null;
    }
  };

  const recordPostprandialReading = async (minutesMark: number, value: number) => {
    if (!activeMealCycle || !user) return null;
    
    try {
      const now = Date.now();
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
      
      const updatedReadings = {
        ...activeMealCycle.postprandialReadings,
        [minutesMark]: newReading
      };
      
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

  const abandonMealCycle = async () => {
    if (!activeMealCycle || !user) return false;
    
    try {
      console.log('Abandoning meal cycle:', activeMealCycle.id);
      
      if (isOffline || !navigator.onLine) {
        console.log('Abandoning meal cycle offline');
        if (pendingMealCycle) {
          setPendingMealCycle(null);
        }
        
        // Update state locally
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
      }
      
      await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
        status: 'abandoned',
        updatedAt: Date.now()
      });
      
      console.log('Updated meal cycle in Firestore to abandoned status');
      
      // Update local state
      setMealCycles(prev => prev.map(cycle => 
        cycle.id === activeMealCycle.id 
          ? { ...cycle, status: 'abandoned', updatedAt: Date.now() } 
          : cycle
      ));
      
      // Clear the active meal cycle
      setActiveMealCycle(null);
      
      toast({
        title: "Meal cycle abandoned",
        description: "Your current meal cycle has been abandoned. You can start a new one.",
      });
      
      return true;
    } catch (error) {
      console.error("Error abandoning meal cycle:", error);
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
    pendingMealCycle,
    loading,
    isOffline,
    error,
    startMealCycle,
    recordFirstBite,
    recordPostprandialReading,
    abandonMealCycle
  };
};
