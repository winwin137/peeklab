import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { MealCycle } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { XCircle, Clock, AlertCircle, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getCurrentIntervals, getCurrentCycleTimeout } from '@/config';
import GlucoseGraph from './GlucoseGraph';
import { calculateAverageGlucose, calculatePeakGlucose } from '@/utils/glucose';
import { convertFirebaseTime } from '@/utils/date';

interface MealCycleTimerProps {
  mealCycle: MealCycle | null;
  onTakeReading: (minutesMark: number) => void;
  onAbandon: (options?: {
    status?: 'completed' | 'abandoned' | 'canceled';
    modalTitle?: string;
    confirmButtonText?: string;
  }) => void;
  mode: string; // Add mode prop
}

const MealCycleTimer: React.FC<MealCycleTimerProps> = ({ 
  mealCycle,
  onTakeReading,
  onAbandon,
  mode = 'testing' // Add mode prop
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nextReading, setNextReading] = useState<{minutesMark: number, timeRemaining: number} | null>(null);
  const { getNotificationStatus, alertState } = useNotifications(mealCycle, mode);
  
  // Get current intervals based on environment
  const intervals = getCurrentIntervals(mode).readings;
  const maxTime = intervals[intervals.length - 1];
  const cycleTimeout = getCurrentCycleTimeout(mode);

  useEffect(() => {
    if (!mealCycle?.startTime) return;
    
    console.log('MealCycleTimer: Setting up timer with startTime', mealCycle.startTime);
    
    const updateElapsedTime = () => {
      const now = Date.now();
      const elapsed = now - mealCycle.startTime;
      const minutesElapsed = elapsed / (60 * 1000);
      
      setElapsedTime(elapsed);
      const nextReadingData = findNextReading();
      setNextReading(nextReadingData);

      // Check if the final (6th) reading is completed
      const finalReadingInterval = intervals[intervals.length - 1];
      const hasFinalReading = !!mealCycle.postprandialReadings[finalReadingInterval];

      // Only complete the cycle if final reading exists
      if (hasFinalReading && mealCycle.status !== 'completed' && onAbandon) {
        console.log('Final reading completed. Automatically completing meal cycle.');
        onAbandon({ status: 'completed' });
      }
    };
    
    const findNextReading = () => {
      // Get all intervals that haven't been completed yet
      const pendingIntervals = intervals.filter(
        interval => !mealCycle.postprandialReadings[interval]
      ).sort((a, b) => a - b);
      
      if (pendingIntervals.length === 0) return null;
      
      // Find the first interval that isn't due yet and isn't overdue
      for (const minutesMark of pendingIntervals) {
        const status = getNotificationStatus(minutesMark);
        if (!status.due && !status.overdue) {
          return {
            minutesMark,
            timeRemaining: status.timeUntil || 0
          };
        }
      }
      
      // If all pending intervals are due or overdue, return null
      return null;
    };
    
    updateElapsedTime();
    
    const interval = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(interval);
  }, [mealCycle?.startTime, mealCycle?.postprandialReadings, mealCycle?.status, getNotificationStatus, intervals, mode, onAbandon]);
  
  const formatElapsedTime = () => {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatCountdown = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatStartTime = () => {
    if (!mealCycle?.startTime) return 'Not started';
    
    const date = new Date(mealCycle.startTime);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  const calculateProgress = () => {
    if (!mealCycle?.startTime) return 0;
    
    const elapsed = elapsedTime / 1000 / 60;
    return Math.min((elapsed / maxTime) * 100, 100);
  };
  
  const calculateCountdownProgress = () => {
    if (!nextReading || nextReading.timeRemaining <= 0) return 100;
    
    const minutesMark = nextReading.minutesMark;
    const totalDuration = minutesMark * 60 * 1000 - (minutesMark > intervals[0] ? (minutesMark - intervals[0]) * 60 * 1000 : 0);
    const progress = ((totalDuration - nextReading.timeRemaining) / totalDuration) * 100;
    return Math.min(progress, 100);
  };
  
  const needsReading = (minutesMark: number) => {
    if (!mealCycle?.postprandialReadings) return false;
    if (mealCycle.postprandialReadings[minutesMark]) return false;
    
    const status = getNotificationStatus(minutesMark);
    return status.due && !status.overdue;
  };
  
  const isMissed = (minutesMark: number) => {
    if (!mealCycle?.postprandialReadings) return false;
    if (mealCycle.postprandialReadings[minutesMark]) return false;
    
    const status = getNotificationStatus(minutesMark);
    return status.overdue;
  };
  
  const isCompleted = (minutesMark: number) => {
    if (!mealCycle?.postprandialReadings) return false;
    return !!mealCycle.postprandialReadings[minutesMark];
  };
  
  const handleTakeReading = (minutesMark: number) => {
    onTakeReading(minutesMark);
  };
  
  const handleAbandon = () => {
    if (!mealCycle || mealCycle.status === 'abandoned') {
      return; // Prevent double abandonment
    }
    console.log('MealCycleTimer: Abandoning meal cycle');
    onAbandon({ status: 'canceled' });
  };

  // Add a check to prevent rendering if cycle is past the configured timeout
  if (mealCycle && mealCycle.startTime) {
    const elapsed = Date.now() - mealCycle.startTime;
    const minutesElapsed = elapsed / (60 * 1000);
    if (minutesElapsed >= cycleTimeout) {
      // Force abandon the cycle if it's past the timeout
      if (mealCycle.status !== 'abandoned') {
        handleAbandon();
      }
      return null; // Don't render anything if cycle is past the timeout
    }
  }

  if (!mealCycle) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Active Meal Cycle</CardTitle>
          <CardDescription>Start a new meal cycle to begin tracking your glucose readings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const averageGlucose = calculateAverageGlucose(mealCycle);
  const peakGlucose = calculatePeakGlucose(mealCycle);

  return (
    <>
      <div className="w-full">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Active Meal Cycle</CardTitle>
                <CardDescription>
                  {mealCycle.preprandialReading 
                    ? `Preprandial reading taken at ${convertFirebaseTime(mealCycle.preprandialReading.timestamp)}`
                    : 'No preprandial reading'}
                  {mealCycle.status === 'abandoned' && (
                    <span className="text-destructive ml-2">(Abandoned)</span>
                  )}
                </CardDescription>
                <div className="mt-2 text-sm text-muted-foreground">
                  {averageGlucose && (
                    <span>Average: {averageGlucose} mg/dL</span>
                  )}
                  {peakGlucose && (
                    <span className="ml-4">Peak: {peakGlucose} mg/dL</span>
                  )}
                </div>
              </div>
              {mealCycle.status !== 'abandoned' && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-destructive hover:text-destructive/80" 
                  onClick={handleAbandon}
                  title="Cancel meal cycle"
                >
                  <XCircle className="h-6 w-6" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center">
              <div className="timer-circle h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-2">
                <div className="text-2xl font-semibold text-foreground">
                  {mealCycle.startTime ? formatElapsedTime() : '--:--'}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {mealCycle.startTime 
                  ? `First bite: ${convertFirebaseTime(mealCycle.startTime)}`
                  : 'Awaiting first bite'
                }
              </div>
            </div>
            
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span>{Math.floor(maxTime / 60)}:00</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-peekdiet-primary h-2.5 rounded-full" 
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>

            {nextReading && (
              <div className="mt-4 bg-accent/30 p-4 rounded-lg border border-accent">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-accent-foreground" />
                    <span className="text-base font-medium">
                      {nextReading.timeRemaining > 0 
                        ? `Next reading in ${formatCountdown(nextReading.timeRemaining)}`
                        : `${nextReading.minutesMark}-minute reading due now!`
                      }
                    </span>
                  </div>
                  <span className="text-sm font-medium text-accent-foreground">
                    {nextReading.minutesMark} min
                  </span>
                </div>
                <Progress value={calculateCountdownProgress()} className="h-2" />
              </div>
            )}

            {/* Add Glucose Graph */}
            {(mealCycle.preprandialReading || Object.keys(mealCycle.postprandialReadings).length > 0) && (
              <div className="h-32 w-full mt-4">
                <GlucoseGraph mealCycle={mealCycle} />
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 pt-4">
              {intervals.map(minutes => {
                let buttonVariant: 'default' | 'outline' | 'ghost' = 'outline';
                let buttonText = `${minutes} min`;
                let disabled = !needsReading(minutes);
                
                if (isCompleted(minutes)) {
                  buttonVariant = 'ghost';
                  buttonText = `${minutes} min ✓`;
                } else if (needsReading(minutes)) {
                  buttonVariant = 'default';
                  buttonText = `${minutes} min!`;
                  disabled = false;
                } else if (isMissed(minutes)) {
                  buttonVariant = 'ghost';
                  buttonText = `${minutes} min ✗`;
                }
                
                return (
                  <Button 
                    key={minutes}
                    variant={buttonVariant}
                    disabled={disabled}
                    onClick={() => handleTakeReading(minutes)}
                    className={`
                      ${isCompleted(minutes) ? 'text-muted-foreground' : ''}
                      ${isMissed(minutes) ? 'text-destructive opacity-50' : ''}
                      ${needsReading(minutes) ? 'animate-pulse' : ''}
                    `}
                  >
                    {buttonText}
                  </Button>
                );
              })}
            </div>

            {/* Stats display */}
            <div className="grid grid-cols-4 gap-1 text-xs mt-3">
              <div className="text-muted-foreground text-right">Pre:</div>
              <div className="font-semibold">
                {mealCycle.preprandialReading 
                  ? `${mealCycle.preprandialReading.value} mg/dL` 
                  : '—'}
              </div>
              
              <div className="text-muted-foreground text-right">Peak:</div>
              <div className="font-semibold">
                {peakGlucose ? `${peakGlucose} mg/dL` : '—'}
              </div>
              
              <div className="text-muted-foreground text-right">Readings:</div>
              <div className="font-semibold">
                {Object.keys(mealCycle.postprandialReadings).length + 
                  (mealCycle.preprandialReading ? 1 : 0)}
              </div>
              
              <div className="text-muted-foreground text-right">Status:</div>
              <div className="font-semibold capitalize">
                {mealCycle.status}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {mealCycle.status !== 'abandoned' && (
              <Button 
                variant="outline" 
                onClick={() => onAbandon({ status: 'canceled' })}
                className="w-full hover:bg-red-100 hover:text-red-700"
              >
                Cancel Meal Cycle
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default MealCycleTimer;
