
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';
import { MealCycle } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { XCircle, Clock, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MealCycleTimerProps {
  mealCycle: MealCycle;
  onTakeReading: (minutesMark: number) => void;
  onAbandon: () => void;
}

const INTERVALS = [20, 40, 60, 90, 120, 180];

const MealCycleTimer: React.FC<MealCycleTimerProps> = ({ 
  mealCycle,
  onTakeReading,
  onAbandon
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nextReading, setNextReading] = useState<{minutesMark: number, timeRemaining: number} | null>(null);
  const { getNotificationStatus } = useNotifications(mealCycle);
  
  // Update elapsed time every second
  useEffect(() => {
    if (!mealCycle.startTime) return;
    
    const updateElapsedTime = () => {
      const now = Date.now();
      const elapsed = now - mealCycle.startTime;
      setElapsedTime(elapsed);
      
      // Find the next reading
      const nextReadingData = findNextReading();
      setNextReading(nextReadingData);
    };
    
    // Find the next upcoming reading
    const findNextReading = () => {
      // Sort intervals that haven't been completed
      const pendingIntervals = INTERVALS.filter(
        interval => !mealCycle.postprandialReadings[interval]
      ).sort((a, b) => a - b);
      
      if (pendingIntervals.length === 0) return null;
      
      for (const minutesMark of pendingIntervals) {
        const status = getNotificationStatus(minutesMark);
        if (!status.due) {
          // This reading is in the future
          return {
            minutesMark,
            timeRemaining: status.timeUntil || 0
          };
        }
      }
      
      // If all readings are due/overdue, return the first one
      const firstPending = pendingIntervals[0];
      const status = getNotificationStatus(firstPending);
      return {
        minutesMark: firstPending,
        timeRemaining: 0
      };
    };
    
    // Update immediately
    updateElapsedTime();
    
    // Then update every second
    const interval = setInterval(updateElapsedTime, 1000);
    
    return () => clearInterval(interval);
  }, [mealCycle.startTime, mealCycle.postprandialReadings, getNotificationStatus]);
  
  // Formatted elapsed time (mm:ss)
  const formatElapsedTime = () => {
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format countdown time (mm:ss)
  const formatCountdown = (milliseconds: number) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Formatted start time
  const formatStartTime = () => {
    if (!mealCycle.startTime) return 'Not started';
    
    const date = new Date(mealCycle.startTime);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };
  
  // Calculate progress
  const calculateProgress = () => {
    if (!mealCycle.startTime) return 0;
    
    const elapsed = elapsedTime / 1000 / 60; // minutes
    return Math.min((elapsed / 180) * 100, 100); // 180 mins is the full cycle
  };
  
  // Calculate countdown progress
  const calculateCountdownProgress = () => {
    if (!nextReading || nextReading.timeRemaining <= 0) return 100;
    
    const minutesMark = nextReading.minutesMark;
    const totalDuration = minutesMark * 60 * 1000 - (minutesMark > 20 ? (minutesMark - 20) * 60 * 1000 : 0);
    const progress = ((totalDuration - nextReading.timeRemaining) / totalDuration) * 100;
    return Math.min(progress, 100);
  };
  
  // Check which intervals need readings
  const needsReading = (minutesMark: number) => {
    // If the reading exists in postprandialReadings, it's been done
    if (mealCycle.postprandialReadings[minutesMark]) return false;
    
    // Check if it's due based on elapsed time
    const status = getNotificationStatus(minutesMark);
    
    return status.due && !status.overdue;
  };
  
  // Check which intervals are missed
  const isMissed = (minutesMark: number) => {
    // If the reading exists, it wasn't missed
    if (mealCycle.postprandialReadings[minutesMark]) return false;
    
    // Check if it's overdue
    const status = getNotificationStatus(minutesMark);
    return status.overdue;
  };
  
  // Check which intervals are completed
  const isCompleted = (minutesMark: number) => {
    return !!mealCycle.postprandialReadings[minutesMark];
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Active Meal Cycle</CardTitle>
            <CardDescription>
              Started {mealCycle.startTime ? formatDistanceToNow(mealCycle.startTime, { addSuffix: true }) : 'a moment ago'}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:bg-destructive/10" 
            onClick={onAbandon}
            title="Cancel for testing"
          >
            <XCircle className="h-6 w-6" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          <div className="timer-circle h-24 w-24 mb-2">
            <div className="text-2xl font-semibold text-foreground">
              {mealCycle.startTime ? formatElapsedTime() : '--:--'}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {mealCycle.startTime 
              ? `First bite: ${formatStartTime()}`
              : 'Awaiting first bite'
            }
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2.5">
          <div 
            className="bg-peekdiet-primary h-2.5 rounded-full" 
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>

        {nextReading && (
          <div className="mt-4 bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {nextReading.timeRemaining > 0 
                    ? `Next reading in ${formatCountdown(nextReading.timeRemaining)}`
                    : `${nextReading.minutesMark}-minute reading due now!`
                  }
                </span>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {nextReading.minutesMark} min
              </span>
            </div>
            <Progress value={calculateCountdownProgress()} className="h-1.5" />
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-2 pt-4">
          {INTERVALS.map(minutes => {
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
                onClick={() => onTakeReading(minutes)}
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
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full text-destructive" 
          onClick={onAbandon}
        >
          Abandon Cycle
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MealCycleTimer;
