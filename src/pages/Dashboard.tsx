
import React, { useState } from 'react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { useNotifications } from '@/hooks/useNotifications';
import Header from '@/components/layout/Header';
import StartMealCycle from '@/components/meal/StartMealCycle';
import GlucoseInput from '@/components/glucose/GlucoseInput';
import FirstBiteButton from '@/components/meal/FirstBiteButton';
import MealCycleTimer from '@/components/meal/MealCycleTimer';
import MealCycleList from '@/components/meal/MealCycleList';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

type InputMode = 'idle' | 'preprandial' | 'postprandial' | 'adhoc';

const Dashboard: React.FC = () => {
  const { 
    mealCycles, 
    activeMealCycle, 
    startMealCycle, 
    recordFirstBite, 
    recordPostprandialReading, 
    abandonMealCycle 
  } = useMealCycles();
  
  const { notifications } = useNotifications(activeMealCycle);
  
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [currentMinutesMark, setCurrentMinutesMark] = useState<number | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  
  // Handlers for starting meal cycle
  const handleStartMeal = () => {
    setInputMode('preprandial');
  };
  
  const handleStartAdhoc = () => {
    setInputMode('adhoc');
  };
  
  // Handler for submitting preprandial reading
  const handlePreprandialSubmit = (value: number) => {
    startMealCycle(value);
    setInputMode('idle');
  };
  
  // Handler for first bite button
  const handleFirstBite = () => {
    recordFirstBite();
  };
  
  // Handler for taking a reading at a specific minute mark
  const handleTakeReading = (minutesMark: number) => {
    setCurrentMinutesMark(minutesMark);
    setInputMode('postprandial');
  };
  
  // Handler for submitting postprandial reading
  const handlePostprandialSubmit = (value: number) => {
    if (currentMinutesMark !== null) {
      recordPostprandialReading(currentMinutesMark, value);
    }
    setInputMode('idle');
    setCurrentMinutesMark(null);
  };
  
  // Handler for adhoc reading
  const handleAdhocSubmit = (value: number) => {
    // In a real app, would store adhoc readings separately
    console.log('Adhoc reading:', value);
    setInputMode('idle');
  };
  
  // Handler for abandoning meal cycle
  const handleAbandonConfirm = () => {
    abandonMealCycle();
    setShowAbandonConfirm(false);
  };
  
  // Content based on current state
  const renderContent = () => {
    // Input modes
    if (inputMode === 'preprandial') {
      return (
        <GlucoseInput
          title="Preprandial Reading"
          description="Enter your blood glucose before eating"
          onSubmit={handlePreprandialSubmit}
          onCancel={() => setInputMode('idle')}
        />
      );
    }
    
    if (inputMode === 'postprandial') {
      return (
        <GlucoseInput
          title={`${currentMinutesMark}-Minute Reading`}
          description={`Enter your blood glucose ${currentMinutesMark} minutes after first bite`}
          onSubmit={handlePostprandialSubmit}
          onCancel={() => setInputMode('idle')}
        />
      );
    }
    
    if (inputMode === 'adhoc') {
      return (
        <GlucoseInput
          title="Ad-hoc Reading"
          description="Enter your current blood glucose"
          onSubmit={handleAdhocSubmit}
          onCancel={() => setInputMode('idle')}
        />
      );
    }
    
    // Normal view modes
    if (activeMealCycle) {
      if (!activeMealCycle.startTime) {
        // Show first bite button if meal cycle started but first bite not recorded
        return (
          <FirstBiteButton
            onFirstBite={handleFirstBite}
            preprandialValue={activeMealCycle.preprandialReading?.value}
          />
        );
      } else {
        // Show the meal cycle timer
        return (
          <MealCycleTimer
            mealCycle={activeMealCycle}
            onTakeReading={handleTakeReading}
            onAbandon={() => setShowAbandonConfirm(true)}
          />
        );
      }
    }
    
    // Default view
    return (
      <StartMealCycle
        onStartAdhoc={handleStartAdhoc}
        onStartMeal={handleStartMeal}
      />
    );
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-md mx-auto p-4">
        <div className="space-y-6">
          {renderContent()}
          
          {mealCycles.length > 0 && inputMode === 'idle' && (
            <MealCycleList mealCycles={mealCycles} />
          )}
        </div>
      </main>
      
      {/* Abandon confirmation dialog */}
      <Dialog open={showAbandonConfirm} onOpenChange={setShowAbandonConfirm}>
        <DialogContent>
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium">Abandon Meal Cycle?</h3>
            <p className="text-sm text-muted-foreground">
              This will end your current meal cycle and all data will be marked as abandoned.
              You cannot undo this action.
            </p>
            
            <div className="flex space-x-2 justify-center mt-4">
              <Button variant="outline" onClick={() => setShowAbandonConfirm(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleAbandonConfirm}>
                Abandon
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
