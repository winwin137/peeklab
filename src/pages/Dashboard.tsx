import React, { useState, useEffect } from 'react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { useNotifications } from '@/hooks/useNotifications';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import StartMealCycle from '@/components/meal/StartMealCycle';
import GlucoseInput from '@/components/glucose/GlucoseInput';
import FirstBiteButton from '@/components/meal/FirstBiteButton';
import MealCycleTimer from '@/components/meal/MealCycleTimer';
import MealCycleList from '@/components/meal/MealCycleList';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CloudOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type InputMode = 'idle' | 'preprandial' | 'postprandial' | 'adhoc';

const Dashboard: React.FC = () => {
  const { 
    mealCycles, 
    activeMealCycle, 
    startMealCycle, 
    recordFirstBite, 
    recordPostprandialReading, 
    abandonMealCycle,
    isOffline,
    pendingMealCycle,
    error
  } = useMealCycles();
  
  const { notifications } = useNotifications(activeMealCycle);
  
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [currentMinutesMark, setCurrentMinutesMark] = useState<number | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  
  useEffect(() => {
    if (activeMealCycle) {
      console.log('Active meal cycle:', {
        id: activeMealCycle.id,
        startTime: activeMealCycle.startTime,
        preprandial: activeMealCycle.preprandialReading,
        status: activeMealCycle.status
      });
    } else {
      console.log('No active meal cycle');
    }

    if (pendingMealCycle) {
      console.log('Pending meal cycle:', pendingMealCycle);
    }
  }, [activeMealCycle, pendingMealCycle]);
  
  const handleStartMeal = () => {
    setInputMode('preprandial');
  };
  
  const handleStartAdhoc = () => {
    setInputMode('adhoc');
  };
  
  const handlePreprandialSubmit = (value: number) => {
    console.log('Starting meal cycle with preprandial value:', value);
    const result = startMealCycle(value);
    console.log('Started meal cycle with result:', result);
    setInputMode('idle');
  };
  
  const handleFirstBite = () => {
    console.log('Recording first bite');
    recordFirstBite();
  };
  
  const handleTakeReading = (minutesMark: number) => {
    setCurrentMinutesMark(minutesMark);
    setInputMode('postprandial');
  };
  
  const handlePostprandialSubmit = (value: number) => {
    if (currentMinutesMark !== null) {
      recordPostprandialReading(currentMinutesMark, value);
    }
    setInputMode('idle');
    setCurrentMinutesMark(null);
  };
  
  const handleAdhocSubmit = (value: number) => {
    console.log('Adhoc reading:', value);
    setInputMode('idle');
  };
  
  const handleAbandonConfirm = () => {
    abandonMealCycle();
    setShowAbandonConfirm(false);
  };

  const renderOfflineWarning = () => {
    if (!isOffline) return null;
    
    return (
      <Card className="mb-4 border-destructive bg-destructive/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CloudOff className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base text-destructive">Offline Mode</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-destructive/90">
            You're currently offline. Some features will be limited until your connection is restored.
            Your data will sync when you're back online.
          </CardDescription>
        </CardContent>
      </Card>
    );
  };
  
  const renderContent = () => {
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
    
    // Check for pending meal cycle first (this handles the offline scenario)
    if (pendingMealCycle) {
      console.log('Showing FirstBiteButton for pending meal cycle');
      return (
        <div className="w-full">
          <FirstBiteButton
            onFirstBite={handleFirstBite}
            preprandialValue={pendingMealCycle.preprandialReading?.value}
            uniqueId={pendingMealCycle.uniqueId}
          />
        </div>
      );
    }
    
    if (activeMealCycle) {
      console.log('Rendering for active meal cycle with startTime:', activeMealCycle.startTime);
      
      if (!activeMealCycle.startTime || activeMealCycle.startTime === 0) {
        console.log('Showing FirstBiteButton');
        return (
          <div className="w-full">
            <FirstBiteButton
              onFirstBite={handleFirstBite}
              preprandialValue={activeMealCycle.preprandialReading?.value}
              uniqueId={activeMealCycle.uniqueId}
            />
          </div>
        );
      } else {
        console.log('Showing MealCycleTimer');
        return (
          <div className="w-full">
            <MealCycleTimer
              mealCycle={activeMealCycle}
              onTakeReading={handleTakeReading}
              onAbandon={() => setShowAbandonConfirm(true)}
            />
          </div>
        );
      }
    }
    
    console.log('Showing StartMealCycle');
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
          {renderOfflineWarning()}
          {renderContent()}
          
          {error && (
            <Card className="border-destructive bg-destructive/10 mt-4">
              <CardContent className="pt-4">
                <p className="text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {error}
                </p>
              </CardContent>
            </Card>
          )}
          
          {mealCycles.length > 0 && inputMode === 'idle' && (
            <MealCycleList mealCycles={mealCycles} />
          )}
        </div>
      </main>
      
      <Footer />
      
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
