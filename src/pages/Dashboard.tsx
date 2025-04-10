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
  const [modalStatus, setModalStatus] = useState<string | undefined>();

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
  
  useEffect(() => {
    console.log('🚨 DASHBOARD: modalStatus changed', { modalStatus });
  }, [modalStatus]);
  
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
    console.log('🚨 Handling Abandon Confirm', {
      currentActiveMealCycle: activeMealCycle,
      currentModalStatus: modalStatus
    });

    try {
      // Set modal status before abandoning
      setModalStatus('canceled');

      const success = await abandonMealCycle({ 
        status: 'canceled', 
        newVar: "Hello World" 
      });

      if (success) {
        console.log('🚨 Meal Cycle Successfully Canceled');
        
        // Close the modal explicitly
        setShowAbandonConfirm(false);
        setModalStatus(undefined);
      } else {
        console.error('🚨 Failed to Cancel Meal Cycle');
        // Optionally handle failure scenario
      }
    } catch (error) {
      console.error('🚨 Error in Abandoning Meal Cycle:', error);
      // Handle error, potentially show an error modal
    }
  };

  const handleCompleteMealCycle = async () => {
    const success = await abandonMealCycle({ status: 'completed' });
    if (success) {
      setShowAbandonConfirm(false);
    }
  };
  
  const getDialogTitle = (status?: string) => {
    console.log('🚨 getDialogTitle called with status:', status);
    switch (status) {
      case 'active':
        return 'Confirm Cancellation';
      case 'canceled':
        return 'Meal Cycle Canceled';
      case 'completed':
        return 'Meal Cycle Completed';
      case 'abandoned':
        return 'Session Abandoned';
      default:
        return 'Unexpected';
    }
  };

  const getMessage = (status?: string) => {
    console.log('🚨 getMessage called with status:', status);
    switch (status) {
      case 'active':
        return 'Are you sure you want to cancel this meal cycle?';
      case 'canceled':
        return 'This will mark your current meal cycle as canceled. You cannot undo this action.';
      case 'completed':
        return 'Your meal cycle tracking is complete.';
      case 'abandoned':
        return 'Please press Continue.';
      default:
        return 'Oops.';
    }
  };

  const renderModalButtons = (status?: string) => {
    console.log('🚨 Rendering Modal Buttons for status:', status);
    
    const closeModal = () => {
      console.log('🚨 Closing Abandon Confirm Modal');
      setShowAbandonConfirm(false);
      setModalStatus(undefined);
    };
    
    switch (status) {
      case 'active':
        return (
          <div className="flex justify-center space-x-4">
            <Button 
              variant="destructive" 
              onClick={() => {
                console.log('🚨 Confirmed Meal Cycle Cancellation');
                handleAbandonConfirm();
              }}
              className="w-full"
            >
              Proceed with Cancellation
            </Button>
            <Button 
              variant="outline" 
              onClick={closeModal}
              className="w-full"
            >
              Close
            </Button>
          </div>
        );
      case 'canceled':
        return (
          <div className="flex justify-center">
            <Button 
              variant="default" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              OK
            </Button>
          </div>
        );
      case 'completed':
        return (
          <div className="flex justify-center">
            <Button 
              variant="default" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              OK
            </Button>
          </div>
        );
      case 'abandoned':
        return (
          <div className="flex justify-center">
            <Button 
              variant="default" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              Continue
            </Button>
          </div>
        );
      default:
        return (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowAbandonConfirm(false)}
            >
              Close
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

  const renderAbandonConfirmDialog = () => {
    console.log('🚨 Rendering Abandon Confirm Dialog', {
      showAbandonConfirm,
      modalStatus,
      activeMealCycleStatus: activeMealCycle?.status
    });

    return (
      <Dialog 
        open={showAbandonConfirm} 
        onOpenChange={(open) => {
          // Reset modal status when dialog closes
          if (!open) setModalStatus(undefined);
          setShowAbandonConfirm(open);
        }}
      >
        <DialogContent>
          <DialogTitle>{getDialogTitle(activeMealCycle?.status)}</DialogTitle>
          <DialogDescription>
            {getMessage(activeMealCycle?.status)}
          </DialogDescription>
          
          {/* Diagnostic Information */}
          <div className="bg-muted p-4 rounded-md mb-4 text-xs">
            <h3 className="font-bold mb-2">Comprehensive Diagnostic Information</h3>
            <pre>{JSON.stringify({
              'modalStatus': modalStatus,
              'activeMealCycle.status': activeMealCycle?.status,
              'showAbandonConfirm': showAbandonConfirm,
              
              // Additional Diagnostic Variables
              'activeMealCycle.id': activeMealCycle?.id,
              'activeMealCycle.startTime': activeMealCycle?.startTime 
                ? new Date(activeMealCycle.startTime).toISOString() 
                : null,
              'activeMealCycle.preprandialReading': activeMealCycle?.preprandialReading?.value,
              'mealCycles.length': mealCycles.length,
              'inputMode': inputMode,
              'currentMinutesMark': currentMinutesMark,
              
              // Timing and Performance Diagnostics
              'Timestamp': new Date().toISOString(),
              'Performance': {
                'renderTime': performance.now(),
                'memoryUsed': performance.memory 
                  ? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
                  : 'N/A'
              }
            }, null, 2)}</pre>
          </div>
          
          {renderModalButtons(activeMealCycle?.status)}
        </DialogContent>
      </Dialog>
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
      
      {renderAbandonConfirmDialog()}
    </div>
  );
};

export default Dashboard;
