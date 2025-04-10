/**
 * ⚠️ CRITICAL: MEAL CYCLE CORE LOGIC ⚠️
 * 
 * DO NOT MODIFY THE FOLLOWING:
 * - Meal cycle state management
 * - Data structure and flow
 * - Core timing logic
 * - Firebase integration
 * - Offline sync logic
 * 
 * ALLOWED MODIFICATIONS:
 * - UI/UX improvements
 * - Bug fixes
 * - Performance optimizations
 * - Testing configurations (via config.ts)
 * 
 * VIOLATING THESE RULES MAY RESULT IN:
 * - Data corruption
 * - Sync failures
 * - User data loss
 * - System instability
 */

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
  deleteDoc,
  Timestamp,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  getDoc,
  setDoc,
  batch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { MealCycle, GlucoseReading } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getCurrentTimeout, getCurrentIntervals, getCurrentCycleTimeout } from '@/config';

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

export const useMealCycles = (mode: 'original' | 'testing' = 'original') => {
  const { user } = useAuth();
  const [mealCycles, setMealCycles] = useState<MealCycle[]>([]);
  const [activeMealCycle, setActiveMealCycle] = useState<MealCycle | null>(null);
  const [pendingMealCycle, setPendingMealCycle] = useState<MealCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { toast } = useToast();
  const networkListenerAdded = useRef(false);
  const [isStartingMealCycle, setIsStartingMealCycle] = useState(false);
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (networkListenerAdded.current) return;
    
    const handleOnline = async () => {
      setIsOffline(false);
      try {
        await enableNetwork(db);
        toast({ 
          title: "You're back online",
          description: "Your data will now sync with the server."
        });
        // Retry any pending actions
        retryPendingActions();
      } catch (err) {
        console.error("Error enabling network:", err);
        toast({
          title: "Connection Error",
          description: "Failed to reconnect to the server. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    const handleOffline = async () => {
      setIsOffline(true);
      try {
        await disableNetwork(db);
        toast({ 
          title: "You're offline",
          description: "The app will continue to work, but changes won't be saved to the server until you're back online.",
          variant: "destructive"
        });
      } catch (err) {
        console.error("Error disabling network:", err);
      }
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

  const retryPendingActions = async () => {
    if (pendingActions.length === 0) return;
    
    const actions = [...pendingActions];
    setPendingActions([]);
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'start':
            await startMealCycle(action.data.preprandialValue);
            break;
          case 'firstBite':
            await recordFirstBite();
            break;
          case 'reading':
            await recordPostprandialReading(action.data.minutesMark, action.data.value);
            break;
          case 'abandon':
            await abandonMealCycle();
            break;
        }
      } catch (err) {
        console.error(`Failed to retry ${action.type} action:`, err);
        // Add back to pending actions if it failed
        setPendingActions(prev => [...prev, action]);
      }
    }
  };

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
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const cycles: MealCycle[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert Firestore Timestamps to milliseconds
          const createdAt = data.createdAt instanceof Timestamp 
            ? data.createdAt.toMillis() 
            : data.createdAt;
          const updatedAt = data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toMillis() 
            : data.updatedAt;
          const startTime = data.startTime instanceof Timestamp 
            ? data.startTime.toMillis() 
            : data.startTime;
            
          // Convert preprandial reading timestamp
          const preprandialReading = data.preprandialReading ? {
            ...data.preprandialReading,
            timestamp: data.preprandialReading.timestamp instanceof Timestamp
              ? data.preprandialReading.timestamp.toMillis()
              : data.preprandialReading.timestamp,
            createdAt: data.preprandialReading.createdAt instanceof Timestamp
              ? data.preprandialReading.createdAt.toMillis()
              : data.preprandialReading.createdAt,
            updatedAt: data.preprandialReading.updatedAt instanceof Timestamp
              ? data.preprandialReading.updatedAt.toMillis()
              : data.preprandialReading.updatedAt
          } : undefined;
          
          // Convert postprandial readings timestamps
          const postprandialReadings = data.postprandialReadings ? 
            Object.entries(data.postprandialReadings).reduce((acc, [key, reading]: [string, any]) => {
              acc[key] = {
                ...reading,
                timestamp: reading.timestamp instanceof Timestamp
                  ? reading.timestamp.toMillis()
                  : reading.timestamp
              };
              return acc;
            }, {} as Record<number, GlucoseReading>) : {};
          
          const cycle = { 
            id: doc.id, 
            ...data,
            status: data.archived ? 'abandoned' : data.status,
            createdAt,
            updatedAt,
            startTime,
            preprandialReading,
            postprandialReadings
          } as MealCycle;
          cycles.push(cycle);
        });
        
        // Sort cycles by createdAt in descending order
        cycles.sort((a, b) => b.createdAt - a.createdAt);
        
        setMealCycles(cycles);
        
        // Find active cycle in the fetched cycles
        const activeCycle = cycles.find(cycle => 
          cycle.status === 'active' && !cycle.archived
        );
        
        // Only update activeMealCycle if:
        // 1. We don't have an active cycle currently, or
        // 2. The current active cycle is no longer in the fetched cycles, or
        // 3. The current active cycle is no longer active
        if (!activeMealCycle || 
            !cycles.find(c => c.id === activeMealCycle.id) || 
            activeMealCycle.status !== 'active' || 
            activeMealCycle.archived) {
          setActiveMealCycle(activeCycle || null);
        }
        
        setPendingMealCycle(null);
      } catch (err) {
        console.error("Error fetching meal cycles:", err);
        if (isOffline || !navigator.onLine) {
          setError("You're currently offline. Your data will sync when you're back online.");
        } else {
          setError("Could not connect to the database. Please try again later.");
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
    setIsStartingMealCycle(true);
    
    try {
      const now = Timestamp.now();
      const nowMillis = now.toMillis();
      const uniqueCycleId = generateUniqueId();
      
      const preprandialReading: Omit<GlucoseReading, 'id'> = {
        userId: user.uid,
        value: preprandialValue,
        timestamp: now,
        type: 'preprandial',
        createdAt: now,
        updatedAt: now
      };
      
      const tempCycle: Partial<MealCycle> = {
        userId: user.uid,
        startTime: 0, // Keep this as 0 until first bite
        preprandialReading: { 
          id: 'temp_' + nowMillis, 
          ...preprandialReading 
        },
        postprandialReadings: {},
        status: 'active',
        createdAt: now,
        updatedAt: now,
        uniqueId: uniqueCycleId
      };
      
      // Immediately set the pending meal cycle for local state
      setPendingMealCycle(tempCycle as MealCycle);
      
      if (isOffline || !navigator.onLine) {
        toast({
          title: "Preprandial reading saved",
          description: "You're offline, but you can continue with your meal cycle. Your data will sync when you're back online.",
        });
        setPendingActions(prev => [...prev, { type: 'start', data: { preprandialValue }, timestamp: nowMillis }]);
        setIsStartingMealCycle(false);
        return tempCycle;
      }
      
      // Try to save to Firestore in the background
      const saveToFirestore = async () => {
        try {
          const docRef = await addDoc(collection(db, 'mealCycles'), tempCycle);
          const createdCycle: MealCycle = {
            id: docRef.id,
            ...tempCycle,
            preprandialReading: { id: docRef.id + '_pre', ...preprandialReading }
          } as MealCycle;
          
          setMealCycles(prev => [createdCycle, ...prev]);
          setActiveMealCycle(createdCycle);
          setPendingMealCycle(null);
          
          toast({
            title: "Meal cycle started",
            description: `Your preprandial reading has been recorded (ID: ${uniqueCycleId.substring(0, 8)}). Press 'First Bite' when you start eating.`,
          });
        } catch (err) {
          console.error("Error saving to Firestore:", err);
          setPendingActions(prev => [...prev, { type: 'start', data: { preprandialValue }, timestamp: nowMillis }]);
          toast({
            title: "Offline Mode",
            description: "Your data will sync when you're back online.",
            variant: "destructive"
          });
        }
      };
      
      // Start the Firestore save in the background
      saveToFirestore().catch(console.error);
      
      setIsStartingMealCycle(false);
      return tempCycle;
      
    } catch (error) {
      console.error("Error starting meal cycle:", error);
      toast({
        title: "Error starting meal cycle",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      setError("Failed to start meal cycle. Please try again.");
      setIsStartingMealCycle(false);
      return null;
    }
  };

  const recordFirstBite = async () => {
    if (!user) return null;
    setError(null);
    
    try {
      const now = Timestamp.now();
      const nowMillis = now.toMillis();
      
      if (pendingMealCycle) {
        const updatedCycle = {
          ...pendingMealCycle,
          startTime: nowMillis,
          updatedAt: nowMillis
        };
        
        // Update both pending and active states
        setPendingMealCycle(null);
        setActiveMealCycle(updatedCycle);
        setMealCycles(prev => [updatedCycle, ...prev]);
        
        toast({
          title: "First bite recorded",
          description: "Your meal cycle timer has started. You'll receive notifications for glucose readings.",
        });
        
        if (isOffline || !navigator.onLine) {
          setPendingActions(prev => [...prev, { type: 'firstBite', data: {}, timestamp: nowMillis }]);
          return updatedCycle;
        }
        
        try {
          const docRef = doc(db, 'mealCycles', updatedCycle.id);
          await updateDoc(docRef, {
            startTime: now,
            updatedAt: now
          });
        } catch (err) {
          console.error("Error saving first bite to Firestore:", err);
          setPendingActions(prev => [...prev, { type: 'firstBite', data: {}, timestamp: nowMillis }]);
        }
        
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
      
      const updatedCycle = {
        ...activeMealCycle,
        startTime: nowMillis,
        updatedAt: nowMillis
      };
      
      // Update local state immediately
      setActiveMealCycle(updatedCycle);
      setMealCycles(prev => prev.map(cycle => 
        cycle.id === updatedCycle.id ? updatedCycle : cycle
      ));
      
      toast({
        title: "First bite recorded",
        description: "Your meal cycle timer has started. You'll receive notifications for glucose readings.",
      });
      
      if (isOffline || !navigator.onLine) {
        setPendingActions(prev => [...prev, { type: 'firstBite', data: {}, timestamp: nowMillis }]);
        return updatedCycle;
      }
      
      try {
        await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
          startTime: now,
          updatedAt: now
        });
      } catch (err) {
        console.error("Error saving first bite to Firestore:", err);
        setPendingActions(prev => [...prev, { type: 'firstBite', data: {}, timestamp: nowMillis }]);
      }
      
      return updatedCycle;
    } catch (error) {
      console.error("Error recording first bite:", error);
      toast({
        title: "Error recording first bite",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
      return null;
    }
  };

  const recordPostprandialReading = async (minutesMark: number, value: number) => {
    if (!activeMealCycle || !user) return null;
    
    try {
      const now = Timestamp.now();
      const nowMillis = now.toMillis();
      const expectedTime = activeMealCycle.startTime + (minutesMark * 60 * 1000);
      const timeoutMinutes = getCurrentTimeout(mode);
      const isLate = nowMillis > (expectedTime + (timeoutMinutes * 60 * 1000));
      
      if (isLate) {
        toast({
          title: "Reading too late",
          description: `You're more than ${timeoutMinutes} minutes late for the ${minutesMark}-minute reading. This reading will not be counted.`,
          variant: "destructive",
        });
        return null;
      }
      
      const reading: Omit<GlucoseReading, 'id'> = {
        userId: user.uid,
        value,
        timestamp: now,
        type: 'postprandial',
        minutesMark,
        createdAt: now,
        updatedAt: now
      };

      console.log(`📊 Glucose Reading Submitted:
  - Time Mark: ${minutesMark} minutes
  - Value: ${value} mg/dL
  - Readings Count: ${Object.keys(activeMealCycle.postprandialReadings).length + 1}/6`);

      const updatedReadings = {
        ...activeMealCycle.postprandialReadings,
        [minutesMark]: reading
      };
      
      const isComplete = minutesMark === 180;
      const updatedStatus = isComplete ? 'completed' : 'active';
      
      await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
        [`postprandialReadings.${minutesMark}`]: reading,
        status: updatedStatus,
        updatedAt: now
      });
      
      const updatedCycle = {
        ...activeMealCycle,
        postprandialReadings: updatedReadings,
        status: updatedStatus as ('active' | 'completed'),
        updatedAt: nowMillis
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

  const abandonMealCycle = async (options?: { 
    userInitiated?: boolean;
    status?: 'abandoned' | 'canceled' | 'completed';
  }) => {
    if (!activeMealCycle || !user) return false;
    
    try {
      console.log('Updating meal cycle status:', activeMealCycle.id);
      
      // Prevent changing status if already in a final state
      if (['completed', 'canceled'].includes(activeMealCycle.status)) {
        toast({
          title: "Cannot change meal cycle status",
          description: `This meal cycle is already ${activeMealCycle.status}.`,
          variant: "destructive",
        });
        return false;
      }
      
      const lastInterval = getCurrentIntervals(mode).readings[5]; // 30 minutes
      const isLastReading = activeMealCycle.postprandialReadings && 
        activeMealCycle.postprandialReadings[lastInterval] !== undefined;

      if (isLastReading) {
        options = { status: 'completed' };
      }
      
      // Automatically set to completed if all readings are present
      const intervals = getCurrentIntervals(mode).readings;
      const allReadingsSubmitted = intervals.every(interval => 
        activeMealCycle.postprandialReadings && 
        activeMealCycle.postprandialReadings[interval] !== undefined
      );
      
      if (isLastReading) {
        options = { status: 'completed' };
      }
      
      const cycleStatus = options?.status || 
        (options?.userInitiated ? 'canceled' : 'abandoned');
      
      // Handle offline mode
      if (isOffline || !navigator.onLine) {
        console.log('Updating meal cycle status offline');
        
        if (activeMealCycle.id.startsWith('temp_') || !activeMealCycle.id) {
          setMealCycles(prev => prev.filter(cycle => cycle.id !== activeMealCycle.id));
        } else {
          const now = Timestamp.now();
          const nowMillis = now.toMillis();
          setMealCycles(prev => prev.map(cycle => 
            cycle.id === activeMealCycle.id 
              ? { 
                  ...cycle, 
                  status: cycleStatus, 
                  updatedAt: nowMillis 
                } 
              : cycle
          ));
        }
        
        setActiveMealCycle(null);
        
        toast({
          title: `Meal Cycle ${cycleStatus.charAt(0).toUpperCase() + cycleStatus.slice(1)}`,
          description: `Your current meal cycle has been ${cycleStatus}.`,
        });
        
        return true;
      }
      
      // Handle online mode
      try {
        console.log(`Marking meal cycle status: ${activeMealCycle.id}`);
        const now = Timestamp.now();
        const nowMillis = now.toMillis();
        
        // Update Firestore document
        await updateDoc(doc(db, 'mealCycles', activeMealCycle.id), {
          status: cycleStatus,
          updatedAt: now
        });
        
        // Update local state
        setMealCycles(prev => prev.map(cycle => 
          cycle.id === activeMealCycle.id 
            ? { 
                ...cycle, 
                status: cycleStatus, 
                updatedAt: nowMillis 
              } 
            : cycle
        ));
        
        // Clear active meal cycle
        setActiveMealCycle(null);
        
        toast({
          title: `Meal Cycle ${cycleStatus.charAt(0).toUpperCase() + cycleStatus.slice(1)}`,
          description: `Your current meal cycle has been ${cycleStatus}.`,
        });
        
        return true;
      } catch (error) {
        console.error('Error marking meal cycle status:', error);
        return false;
      }
    } catch (error) {
      console.error('Error in abandonMealCycle:', error);
      return false;
    }
  };

  const deleteMealCycle = async (mealCycleId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete meal cycles.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      await deleteDoc(doc(db, 'mealCycles', mealCycleId));

      // Remove the deleted meal cycle from local state
      setMealCycles(prev => prev.filter(cycle => cycle.id !== mealCycleId));

      toast({
        title: 'Success',
        description: 'Meal cycle deleted successfully.',
        variant: 'default'
      });

      return true;
    } catch (error) {
      console.error('Error deleting meal cycle:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete meal cycle.',
        variant: 'destructive'
      });
      return false;
    }
  };

  const clearAllSessions = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to clear sessions.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      // Batch delete all meal cycles for the user
      const batch = batch(db);
      const mealCyclesRef = collection(db, 'mealCycles');
      const q = query(mealCyclesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));

      await batch.commit();

      // Clear local state
      setMealCycles([]);
      setActiveMealCycle(null);

      toast({
        title: 'Success',
        description: 'All meal cycles have been deleted.',
        variant: 'default'
      });

      return true;
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear all sessions.',
        variant: 'destructive'
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
    isStartingMealCycle,
    startMealCycle,
    recordFirstBite,
    recordPostprandialReading,
    abandonMealCycle,
    deleteMealCycle,
    clearAllSessions
  };
};
