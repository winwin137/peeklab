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

  // Debug information rendering
  const renderDebugInfo = () => {
    if (!mealCycle) return null;

    const postprandialReadings = mealCycle.postprandialReadings || {};

    // Explicitly count completed readings
    const completedReadings = intervals.filter(interval => 
      postprandialReadings[interval] !== undefined
    );

    const upcomingIntervals = intervals.filter(interval => 
      !postprandialReadings[interval] && interval > Math.max(...completedReadings)
    );

    const isLastReading = Object.keys(postprandialReadings).includes(Math.max(...intervals).toString());
    const isLastReadingCompleted = isLastReading ? true : false;

    // Detailed logging of completed intervals
    console.error('🔍 DETAILED READING DEBUG', {
      expectedIntervals: intervals,
      completedReadings,
      completedReadingsData: completedReadings.map(interval => ({
        interval,
        reading: postprandialReadings[interval]
      })),
      upcomingIntervals
    });

    return (
      <div className="bg-yellow-100 p-2 mb-4 rounded-lg text-xs">
        <h3 className="font-bold mb-2">🐞 Abandonment Debug</h3>
        <div className="debug-row">
          <span>isLastReading:</span>
          <span className={isLastReading ? 'text-green-500' : 'text-red-500'}>
            {isLastReading.toString()}
          </span>
        </div>
        <div className="debug-row">
          <span>isLastReadingCompleted:</span>
          <span className={isLastReadingCompleted ? 'text-green-500' : 'text-red-500'}>
            {isLastReadingCompleted.toString()}
          </span>
        </div>
        <div className="debug-row">
          <span>Last Reading:</span>
          <span className={isLastReading ? 'text-green-500' : 'text-gray-500'}>
            {isLastReading ? '✓' : `✗ (${completedReadings.length}/${intervals.length})`}
          </span>
        </div>
        <div className="debug-row">
          <span>Readings Completed:</span>
          <span className={isLastReadingCompleted ? 'text-green-500' : 'text-gray-500'}>
            {isLastReadingCompleted ? '✓' : `✗ (${completedReadings.length}/${intervals.length})`}
          </span>
        </div>
        <div>Upcoming Intervals: {upcomingIntervals.join(', ')}</div>
        <div>activeMealCycle: {JSON.stringify(!!mealCycle)}</div>
        <div>onAbandon: {typeof onAbandon}</div>
        <div>shouldAbandon: {JSON.stringify(isLastReadingCompleted)}</div>
        <div>postprandialReadings: {JSON.stringify(Object.keys(postprandialReadings))}</div>
        <div>expectedIntervals: {JSON.stringify(intervals)}</div>
        <div>cycleStatus: {mealCycle.status}</div>
      </div>
    );
  };

  useEffect(() => {
    if (mealCycle) {
      const postprandialReadings = mealCycle.postprandialReadings || {};

      // Convert postprandial readings to actual interval numbers
      const completedReadings = intervals.filter(interval => 
        postprandialReadings[interval] !== undefined
      );

      const upcomingIntervals = intervals.filter(interval => 
        !postprandialReadings[interval] && interval > Math.max(...completedReadings)
      );

      const isLastReading = Object.keys(postprandialReadings).includes(Math.max(...intervals).toString());
      const isLastReadingCompleted = isLastReading ? true : false;

      // Debug logging to understand the state
      console.error('🔍 LAST READING DEBUG', {
        intervals,
        completedReadings,
        postprandialReadings: Object.keys(postprandialReadings),
        isLastReading,
        isLastReadingCompleted,
        lastInterval: intervals[intervals.length - 1],
        expectedIntervals: intervals
      });

      const debugData = {
        activeMealCycle: !!mealCycle,
        onAbandon: typeof onAbandon,
        shouldAbandon: isLastReadingCompleted,
        postprandialReadings: Object.keys(postprandialReadings),
        expectedIntervals: intervals,
        cycleStatus: mealCycle.status,
        isLastReading,
        isLastReadingCompleted
      };

      console.log(debugData);
    }
  }, [mealCycle, mode]);

  useEffect(() => {
    if (!mealCycle || !mealCycle.startTime) return;

    const checkCycleCompletion = () => {
      if (!mealCycle) return;

      const elapsed = Date.now() - mealCycle.startTime;
      const minutesElapsed = elapsed / (60 * 1000);

      // Convert postprandial readings to actual interval numbers
      const completedReadings = intervals.filter(interval => 
        mealCycle.postprandialReadings && 
        mealCycle.postprandialReadings[interval] !== undefined
      );

      const upcomingIntervals = intervals.filter(interval => 
        !mealCycle.postprandialReadings[interval] && interval > Math.max(...completedReadings)
      );

      const isLastReading = Object.keys(mealCycle.postprandialReadings).includes(Math.max(...intervals).toString());
      const isLastReadingCompleted = isLastReading ? true : false;

      // Debug logging to understand the state
      console.error('🔍 LAST READING DEBUG', {
        intervals,
        completedReadings,
        postprandialReadings: Object.keys(mealCycle.postprandialReadings),
        isLastReading,
        isLastReadingCompleted,
        lastInterval: intervals[intervals.length - 1],
        expectedIntervals: intervals
      });

      console.warn('🏁 Cycle Completion Check:', {
        intervals,
        isLastReading,
        isLastReadingCompleted,
        minutesElapsed,
        postprandialReadings: mealCycle.postprandialReadings
      });

      // Trigger abandonment if last reading is completed or timeout exceeded
      if (isLastReadingCompleted || minutesElapsed >= cycleTimeout) {
        console.warn('🏁 Cycle completed or timed out. Signaling abandonment.');
        onAbandon();
      }
    };

    // Check cycle completion immediately and set up interval
    checkCycleCompletion();
    const completionInterval = setInterval(checkCycleCompletion, 5000); // Check every 5 seconds

    return () => clearInterval(completionInterval);
  }, [mealCycle, intervals, cycleTimeout, onAbandon]);

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
  }, [mealCycle?.startTime, mealCycle?.postprandialReadings, mealCycle?.status, getNotificationStatus, intervals, mode]);
  
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

  const renderAbandonmentDiagnostic = () => {
    if (!mealCycle || !mealCycle.startTime) return null;

    const elapsed = Date.now() - mealCycle.startTime;
    const minutesElapsed = elapsed / (60 * 1000);

    const postprandialReadings = mealCycle.postprandialReadings || {};

    // Convert postprandial readings to actual interval numbers
    const completedReadings = intervals.filter(interval => 
      postprandialReadings[interval] !== undefined
    );

    const upcomingIntervals = intervals.filter(interval => 
      !postprandialReadings[interval] && interval > Math.max(...completedReadings)
    );

    const isLastReading = Object.keys(postprandialReadings).includes(Math.max(...intervals).toString());
    const isLastReadingCompleted = isLastReading ? true : false;

    return (
      <div className="bg-yellow-100 p-2 mb-4 rounded-lg text-xs">
        <h3 className="font-bold mb-2">🐞 Abandonment Debug</h3>
        {(isLastReadingCompleted || minutesElapsed >= cycleTimeout) && (
          <div className="abandonment-diagnostic">
            <div className="debug-row">
              <span>Last Reading Completed:</span>
              <span>{isLastReadingCompleted.toString()}</span>
            </div>
            <div className="debug-row">
              <span>Minutes Elapsed:</span>
              <span>{minutesElapsed.toFixed(2)}</span>
            </div>
            <div className="debug-row">
              <span>Cycle Timeout:</span>
              <span>{cycleTimeout}</span>
            </div>
            <div className="debug-row">
              <span>Completed Readings:</span>
              <span>{completedReadings.length}/{intervals.length}</span>
            </div>
            <div className="debug-row">
              <span>Postprandial Readings:</span>
              <span>{JSON.stringify(Object.keys(mealCycle.postprandialReadings || {}))}</span>
            </div>
            <div className="debug-row">
              <span>Should Abandon:</span>
              <span>true</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderDebugInfo()}
      {renderAbandonmentDiagnostic()}
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
                  className="text-destructive hover:bg-destructive/10" 
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
                variant="destructive" 
                onClick={() => onAbandon({ status: 'canceled' })}
                className="w-full"
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
