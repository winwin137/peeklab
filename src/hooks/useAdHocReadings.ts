import { useState, useEffect } from 'react';
import { GlucoseReading } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, where, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

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

  return { adHocReadings, loading, error, createAdHocReading };
}; 