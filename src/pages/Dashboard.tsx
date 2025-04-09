import React, { useState, useEffect, useMemo } from 'react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/layout/Footer';
import StartMealCycle from '@/components/meal/StartMealCycle';
import GlucoseInput from '@/components/glucose/GlucoseInput';
import FirstBiteButton from '@/components/meal/FirstBiteButton';
import MealCycleTimer from '@/components/meal/MealCycleTimer';
import MealCycleList from '@/components/meal/MealCycleList';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CloudOff, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdHocReadings } from '@/hooks/useAdHocReadings';
import { toast } from '@/components/ui/use-toast';
import { getCurrentIntervals } from '@/utils/cycleConfig';

type InputMode = 'idle' | 'preprandial' | 'postprandial' | 'adhoc';

const Dashboard: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { 
    mealCycles, 
    activeMealCycle, 
    startMealCycle, 
    recordFirstBite, 
    recordPostprandialReading, 
    abandonMealCycle,
    isOffline,
    pendingMealCycle,
    error,
    isStartingMealCycle
  } = useMealCycles();
  
  const { notifications } = useNotifications(activeMealCycle);
  const { createAdHocReading } = useAdHocReadings();
  
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [currentMinutesMark, setCurrentMinutesMark] = useState<number | null>(null);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  useEffect(() => {
    console.error('Dashboard mounted at:', new Date().toISOString());
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

    return () => {
      console.error('Dashboard unmounted at:', new Date().toISOString());
    };
  }, [activeMealCycle, pendingMealCycle]);
  
  useEffect(() => {
    const cycleToUse = activeMealCycle || pendingMealCycle;
    
    if (cycleToUse) {
      try {
        const intervals = getCurrentIntervals('testing').readings;
        const postprandialReadings = cycleToUse.postprandialReadings || {};
        const shouldAbandon = intervals.every(interval => 
          postprandialReadings[interval] !== undefined
        );

        console.error('🚨 ABANDONMENT DEBUG', {
          activeMealCycle: !!cycleToUse,
          onAbandonCycle: typeof setShowAbandonConfirm,
          shouldAbandon,
          postprandialReadings: Object.keys(postprandialReadings),
          expectedIntervals: intervals,
          cycleStatus: cycleToUse.status,
          readingsDetails: intervals.map(interval => ({
            interval,
            hasReading: postprandialReadings[interval] !== undefined,
            reading: postprandialReadings[interval]
          }))
        });
      } catch (error) {
        console.error('Error in abandonment debug:', error);
      }
    }
  }, [activeMealCycle, pendingMealCycle]);
  
  const handleStartMeal = () => {
    setInputMode('preprandial');
  };
  
  const handleStartAdhoc = () => {
    setInputMode('adhoc');
  };
  
  const handlePreprandialSubmit = async (value: number) => {
    console.log('Starting meal cycle with preprandial value:', value);
    await startMealCycle(value);
    setInputMode('idle');
    console.log('Input mode reset to idle after starting meal cycle');
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
  
  const handleAdhocSubmit = async (value: number) => {
    try {
      await createAdHocReading(value);
      toast({
        title: "Ad-hoc reading saved",
        description: "Your blood glucose reading has been recorded.",
      });
      setInputMode('idle');
    } catch (error) {
      console.error('Error saving ad-hoc reading:', error);
      toast({
        title: "Error saving reading",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };
  
  const handleAbandonConfirm = async () => {
    const success = await abandonMealCycle({ status: 'canceled' });
    if (success) {
      setShowAbandonConfirm(false);
    }
  };

  const handleCompleteMealCycle = async () => {
    const success = await abandonMealCycle({ status: 'completed' });
    if (success) {
      setShowAbandonConfirm(false);
    }
  };
  
  const getDialogTitle = (status?: string) => {
    switch (status) {
      case 'abandoned':
        return 'Session Abandoned';
      case 'completed':
        return 'Meal Cycle Completed';
      case 'canceled':
        return 'Meal Cycle Canceled';
      default:
        return 'Unexpected';
    }
  };

  const getMessage = (status?: string) => {
    switch (status) {
      case 'abandoned':
        return 'Please press Continue.';
      case 'completed':
        return 'Your meal cycle tracking is complete.';
      case 'canceled':
        return 'This will mark your current meal cycle as canceled. You cannot undo this action.';
      default:
        return 'oops';
    }
  };

  const renderModalButtons = (status?: string) => {
    switch (status) {
      case 'abandoned':
        return (
          <div className="flex justify-center mt-4">
            <Button 
              variant="default" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              Continue
            </Button>
          </div>
        );
      case 'completed':
        return (
          <div className="flex justify-center mt-4">
            <Button 
              variant="default" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              OK
            </Button>
          </div>
        );
      case 'canceled':
        return (
          <div className="flex justify-center mt-4">
            <Button 
              variant="default" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              Dismiss
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex space-x-2 justify-center mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              ?
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleAbandonConfirm();
                setShowAbandonConfirm(false);
              }}
            >
              ??
            </Button>
          </div>
        );
    }
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
          isLoading={isStartingMealCycle}
          onAbandonCycle={() => setShowAbandonConfirm(true)}
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
          onAbandonCycle={() => setShowAbandonConfirm(true)}
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
          onAbandonCycle={() => setShowAbandonConfirm(true)}
        />
      );
    }
    
    const cycleToUse = activeMealCycle || pendingMealCycle;
    
    if (cycleToUse) {
      if (!cycleToUse.startTime || cycleToUse.startTime === 0) {
        return (
          <div className="w-full">
            <FirstBiteButton
              onFirstBite={handleFirstBite}
              preprandialValue={cycleToUse.preprandialReading?.value}
              uniqueId={cycleToUse.uniqueId}
            />
          </div>
        );
      } else {
        return (
          <div className="w-full">
            <MealCycleTimer
              mealCycle={cycleToUse}
              onTakeReading={handleTakeReading}
              onAbandon={() => setShowAbandonConfirm(true)}
              onComplete={handleCompleteMealCycle} // Add onComplete prop
              onAbandonConfirm={() => setShowAbandonConfirm(true)} 
            />
          </div>
        );
      }
    }
    
    return (
      <StartMealCycle
        onStartAdhoc={handleStartAdhoc}
        onStartMeal={handleStartMeal}
      />
    );
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <DialogTitle className="text-center">
            {getDialogTitle(activeMealCycle?.status)}
          </DialogTitle>
          <DialogDescription className="text-center">
            {getMessage(activeMealCycle?.status)}
          </DialogDescription>
          
          <div className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
            </div>
            
            {renderModalButtons(activeMealCycle?.status)}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
