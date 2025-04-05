import React, { useEffect } from 'react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { useAdHocReadings } from '@/hooks/useAdHocReadings';
import HistoryView from '@/components/history/HistoryView';

const History: React.FC = () => {
  const { mealCycles, loading: mealCyclesLoading, error: mealCyclesError } = useMealCycles();
  const { adHocReadings, loading: adHocReadingsLoading, error: adHocError } = useAdHocReadings();

  useEffect(() => {
    console.error('History mounted at:', new Date().toISOString());
    return () => {
      console.error('History unmounted at:', new Date().toISOString());
    };
  }, []);

  if (mealCyclesLoading || adHocReadingsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-peekdiet-secondary"></div>
            <div className="mt-4 h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (mealCyclesError || adHocError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4">
          <div className="flex items-center gap-2 text-destructive">
            <p className="text-sm">{mealCyclesError || adHocError?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter out any active meal cycles to prevent state conflicts
  const completedCycles = mealCycles.filter(cycle => 
    cycle.status === 'completed' || cycle.status === 'abandoned'
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto p-4">
        <HistoryView 
          mealCycles={completedCycles}
          adHocReadings={adHocReadings}
        />
      </main>
    </div>
  );
};

export default History; 