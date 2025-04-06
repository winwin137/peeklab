import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { MealCycle } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { XCircle, Clock, AlertCircle, Timer } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { getCurrentIntervals, getCurrentCycleTimeout, getCurrentTimeout } from '@/config';
import GlucoseGraph from './GlucoseGraph';
import { calculateAverageGlucose, calculatePeakGlucose } from '@/utils/glucose';
import { convertFirebaseTime } from '@/utils/date';

interface MealCycleTimerProps {
  mealCycle: MealCycle | null;
  onTakeReading: (minutesMark: number) => void;
  onAbandon: () => void;
}

const MealCycleTimer: React.FC<MealCycleTimerProps> = ({ 
  mealCycle,
  onTakeReading,
  onAbandon
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nextReading, setNextReading] = useState<{minutesMark: number, timeRemaining: number, clockTime: string} | null>(null);
  const { getNotificationStatus, alertState } = useNotifications(mealCycle);
  
  // Get current intervals based on environment
  const intervals = getCurrentIntervals().readings;
  const maxTime = intervals[intervals.length - 1];
  
  useEffect(() => {
    if (!mealCycle?.startTime) return;
    
    // Check if the last reading has been taken
    const lastReading = getCurrentIntervals().readings[getCurrentIntervals().readings.length - 1];
    const lastReadingTaken = mealCycle.postprandialReadings?.[lastReading];
    
    // If cycle is completed, abandoned, or the last reading is taken, set the final elapsed time and stop the timer
    if (mealCycle.status === 'completed' || mealCycle.status === 'abandoned' || lastReadingTaken) {
      const finalElapsed = Date.now() - mealCycle.startTime;
      setElapsedTime(finalElapsed);
      setNextReading(null);
      return;
    }
    
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
      if (!mealCycle?.postprandialReadings) return null;
      
      const now = Date.now();
      const elapsedMinutes = (now - mealCycle.startTime) / (1000 * 60);
      
      // Find the next reading that hasn't been taken yet
      const nextReading = getCurrentIntervals().readings.find(interval => {
        // If we've already taken this reading, skip it
        if (mealCycle.postprandialReadings[interval]) return false;
        // If we're past this interval's timeout, skip it
        if (elapsedMinutes > interval + getCurrentTimeout()) return false;
        // This is the next reading we need
        return true;
      });
      
      if (nextReading) {
        const timeRemaining = Math.max(0, nextReading - elapsedMinutes);
        const nextReadingTime = new Date(mealCycle.startTime + nextReading * 60 * 1000);
        return {
          minutesMark: nextReading,
          timeRemaining: timeRemaining * 60 * 1000,
          clockTime: nextReadingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      
      return null;
    };
    
    updateElapsedTime();
    
    const interval = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(interval);
  }, [mealCycle?.startTime, mealCycle?.postprandialReadings, mealCycle?.status, getNotificationStatus, intervals]);
  
  const formatElapsedTime = () => {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTimeElapsed = () => {
    if (!mealCycle?.startTime) return '00:00';
    
    const now = Date.now();
    const elapsed = now - mealCycle.startTime;
    const totalMinutes = Math.floor(elapsed / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
    if (!nextReading || !mealCycle?.startTime) return 0;
    
    const now = Date.now();
    const elapsedMinutes = (now - mealCycle.startTime) / (1000 * 60);
    
    // Find the last scheduled reading (whether taken or not)
    const lastScheduledReading = getCurrentIntervals().readings
      .filter(interval => interval < nextReading.minutesMark)
      .sort((a, b) => b - a)[0] || 0;
    
    // Calculate total duration between last scheduled reading and next reading
    const totalDuration = nextReading.minutesMark - lastScheduledReading;
    // Calculate elapsed time since last scheduled reading
    const elapsedSinceLast = Math.max(0, elapsedMinutes - lastScheduledReading);
    
    const progress = (elapsedSinceLast / totalDuration) * 100;
    return Math.min(progress, 100);
  };
  
  const getReadingStatus = (minutesMark: number) => {
    if (!mealCycle?.startTime) return { due: false, overdue: false };
    
    const now = Date.now();
    const elapsedMinutes = (now - mealCycle.startTime) / (1000 * 60);
    const timeoutMinutes = getCurrentCycleTimeout();
    
    const isDue = elapsedMinutes >= minutesMark && elapsedMinutes < minutesMark + timeoutMinutes;
    const isOverdue = elapsedMinutes >= minutesMark + timeoutMinutes;
    
    return {
      due: isDue,
      overdue: isOverdue
    };
  };
  
  const isMissed = (minutesMark: number) => {
    if (!mealCycle?.postprandialReadings) return false;
    if (mealCycle.postprandialReadings[minutesMark]) return false;
    
    const status = getReadingStatus(minutesMark);
    const isOverdue = status?.overdue;
    
    // A reading is missed if:
    // 1. It's overdue (past its timeout period)
    // 2. The current time is past its reading window
    const now = Date.now();
    const elapsedMinutes = (now - mealCycle.startTime) / (1000 * 60);
    const isPastReadingWindow = elapsedMinutes > minutesMark + getCurrentTimeout();
    
    return isOverdue || isPastReadingWindow;
  };
  
  const needsReading = (minutesMark: number) => {
    if (!mealCycle?.postprandialReadings) return false;
    if (mealCycle.postprandialReadings[minutesMark]) return false;
    
    const status = getReadingStatus(minutesMark);
    const isDue = status?.due;
    const isOverdue = status?.overdue;
    const isMissedReading = isMissed(minutesMark);
    
    // Enable button 2 minutes before the scheduled reading time
    const now = Date.now();
    const elapsedMinutes = (now - mealCycle.startTime) / (1000 * 60);
    const isEarlyInput = elapsedMinutes >= minutesMark - 2 && elapsedMinutes < minutesMark;
    
    return (isDue && !isOverdue && !isMissedReading) || isEarlyInput;
  };
  
  const isCompleted = (minutesMark: number) => {
    if (!mealCycle?.postprandialReadings) return false;
    return !!mealCycle.postprandialReadings[minutesMark];
  };
  
  const handleTakeReading = (minutesMark: number) => {
    onTakeReading(minutesMark);
    
    // Check if this is the last reading
    const lastReading = getCurrentIntervals().readings[getCurrentIntervals().readings.length - 1];
    if (minutesMark === lastReading) {
      // Mark the cycle as completed
      if (mealCycle && mealCycle.status === 'active') {
        console.log('Marking cycle as completed after last reading');
        mealCycle.status = 'completed';
        // Force a re-render by updating the elapsed time
        setElapsedTime(Date.now() - mealCycle.startTime);
        setNextReading(null);
      }
    }
  };
  
  const handleAbandon = () => {
    if (mealCycle && mealCycle.status === 'active') {
      mealCycle.status = 'abandoned';
      onAbandon();
    }
  };

  // Add a check to prevent rendering if cycle is past the configured timeout
  if (mealCycle && mealCycle.startTime) {
    const elapsed = Date.now() - mealCycle.startTime;
    const minutesElapsed = elapsed / (60 * 1000);
    const cycleTimeout = getCurrentCycleTimeout();
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
              <span>3:00</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>

          {nextReading && (
            <div className="mt-4 bg-accent/30 p-4 rounded-lg border border-accent">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-muted-foreground" />
                  {nextReading && (
                    <span className="text-sm font-medium text-muted-foreground">
                      Next reading at {nextReading.clockTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatTimeRemaining(nextReading.timeRemaining)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>
                  {getCurrentIntervals().readings
                    .filter(interval => interval < nextReading.minutesMark)
                    .sort((a, b) => b - a)[0] || 0}:00
                </span>
                <span>{nextReading.minutesMark}:00</span>
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
        <CardFooter className="flex flex-col space-y-4">
          {/* Abandon Button */}
          <Button
            variant="destructive"
            onClick={handleAbandon}
            className="w-full"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Abandon Meal Cycle
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default MealCycleTimer;
