import { useState, useEffect } from 'react';
import { GlucoseReading } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, where, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export const useAdHocReadings = () => {
  const { user } = useAuth();
  const [adHocReadings, setAdHocReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('Setting up ad hoc readings listener...');
    const q = query(
      collection(db, 'adHocReadings'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('Received ad hoc readings snapshot:', snapshot.size, 'documents');
        const readings: GlucoseReading[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Convert Firestore Timestamp to milliseconds
          const timestamp = data.timestamp instanceof Timestamp 
            ? data.timestamp.toMillis() 
            : data.timestamp;
          
          console.log('Reading data:', {
            id: doc.id,
            ...data,
            timestamp
          });
          readings.push({
            id: doc.id,
            ...data,
            timestamp
          } as GlucoseReading);
        });
        // Sort readings by timestamp in descending order
        readings.sort((a, b) => b.timestamp - a.timestamp);
        console.log('Processed readings:', readings);
        setAdHocReadings(readings);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching ad hoc readings:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      console.log('Cleaning up ad hoc readings listener');
      unsubscribe();
    };
  }, [user]);

  const createAdHocReading = async (value: number) => {
    if (!user) {
      throw new Error('User must be authenticated to create ad hoc readings');
    }

    try {
      const now = Timestamp.now();
      const reading = {
        userId: user.uid,
        value,
        timestamp: now,
        type: 'adhoc',
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'adHocReadings'), reading);
      return { 
        id: docRef.id, 
        ...reading,
        timestamp: now.toMillis()
      };
    } catch (error) {
      console.error('Error creating ad hoc reading:', error);
      throw error;
    }
  };

  const deleteAdHocReading = async (readingId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete readings.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      await deleteDoc(doc(db, 'adHocReadings', readingId));

      // Remove the deleted reading from local state
      setAdHocReadings(prev => prev.filter(reading => reading.id !== readingId));

      toast({
        title: 'Success',
        description: 'Ad hoc reading deleted successfully.',
        variant: 'default'
      });

      return true;
    } catch (error) {
      console.error('Error deleting ad hoc reading:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete ad hoc reading.',
        variant: 'destructive'
      });
      return false;
    }
  };

  return { 
    adHocReadings, 
    loading, 
    error, 
    createAdHocReading,
    deleteAdHocReading 
  }; 
};