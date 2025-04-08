import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { getCurrentIntervals, getCurrentCycleTimeout } from '@/config';
import { MealCycle } from '@/types';

interface GlucoseInputProps {
  timePoint: number;
  onSubmit: (value: number) => void;
  onAbandonCycle?: () => void;
  onCompleteCycle?: () => void;
  activeMealCycle?: MealCycle | null;
  mode?: 'original' | 'testing';
}

const GlucoseInput: React.FC<GlucoseInputProps> = ({ 
  timePoint, 
  onSubmit, 
  onAbandonCycle, 
  onCompleteCycle, 
  activeMealCycle = null, 
  mode = 'testing' 
}) => {
  const [value, setValue] = useState<number>(120);
  const { toast } = useToast();
  const { abandonMealCycle } = useMealCycles();

  const isLastReadingCompleted = () => {
    const intervals = getCurrentIntervals(mode).readings;
    const lastInterval = intervals[intervals.length - 1];
    
    return Object.keys(activeMealCycle?.postprandialReadings || {})
      .some(mark => parseInt(mark) === lastInterval);
  };

  const handleChange = (val: number[]) => {
    setValue(val[0]);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue) && newValue >= 50 && newValue <= 300) {
      setValue(newValue);
    }
  };
  
  const handleIncrease = () => {
    setValue(Math.min(300, value + 1));
  };
  
  const handleDecrease = () => {
    setValue(Math.max(50, value - 1));
  };
  
  const handleSubmit = () => {
    if (value < 50 || value > 300) {
      toast({
        title: "Invalid Value",
        description: "Please enter a glucose value between 50 and 300 mg/dL",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit(value);
    toast({
      title: "Reading Recorded",
      description: `${value} mg/dL at ${timePoint} minutes recorded successfully`,
    });
  };
  
  const handleSaveReading = () => {
    // Extensive logging for debugging
    const expectedTime = activeMealCycle 
      ? activeMealCycle.startTime + (timePoint * 60 * 1000) 
      : 0;
    const nowMillis = Date.now();
    const isEarly = nowMillis < (expectedTime - (getCurrentCycleTimeout(mode) * 60 * 1000));
    const isLate = nowMillis > (expectedTime + (getCurrentCycleTimeout(mode) * 60 * 1000));

    console.error('🩺 SAVE READING DEBUG', {
      value,
      timePoint,
      activeMealCycle: !!activeMealCycle,
      postprandialReadings: activeMealCycle?.postprandialReadings,
      expectedIntervals: getCurrentIntervals(mode).readings,
      cycleStatus: activeMealCycle?.status,
      onSubmitType: typeof onSubmit,
      onAbandonCycleType: typeof onAbandonCycle,
      isEarly,
      isLate,
      expectedTime,
      nowMillis
    });

    // Validate and submit the reading
    if (value < 50 || value > 300) {
      toast({
        title: "Invalid Value",
        description: "Please enter a glucose value between 50 and 300 mg/dL",
        variant: "destructive"
      });
      return;
    }

    // Diagnostic check for onSubmit
    if (!onSubmit) {
      console.error('❌ CRITICAL: onSubmit is not defined!', {
        onSubmitFunction: onSubmit,
        componentProps: { value, timePoint, mode }
      });
      toast({
        title: "Submission Error",
        description: "Unable to save reading. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    // Check for cycle completion
    if (activeMealCycle) {
      const intervals = getCurrentIntervals(mode).readings;
      const lastInterval = intervals[intervals.length - 1];
      const elapsed = Date.now() - activeMealCycle.startTime;
      const minutesElapsed = elapsed / (60 * 1000);
      const cycleTimeout = getCurrentCycleTimeout(mode);

      // Comprehensive completion verification
      const debugCompletionInfo = {
        currentTimePoint: timePoint,
        lastInterval,
        intervals,
        postprandialReadings: activeMealCycle.postprandialReadings || {},
        isLastIntervalReading: timePoint === lastInterval,
        hasAllReadings: intervals.every(interval => 
          activeMealCycle.postprandialReadings && 
          activeMealCycle.postprandialReadings[interval] !== undefined
        ),
        minutesElapsed,
        cycleTimeout
      };

      console.error('🚨 COMPLETION VERIFICATION:', JSON.stringify(debugCompletionInfo, null, 2));

      // Detailed breakdown of readings
      console.error('🔍 READING DETAILS:', 
        intervals.map(interval => ({
          interval,
          hasReading: !!activeMealCycle.postprandialReadings?.[interval],
          reading: activeMealCycle.postprandialReadings?.[interval]
        }))
      );

      // Trigger completion conditions
      const isLastReading = timePoint === lastInterval;
      const allReadingsCompleted = intervals.every(interval => 
        activeMealCycle.postprandialReadings && 
        activeMealCycle.postprandialReadings[interval] !== undefined
      );

      if (isLastReading || allReadingsCompleted) {
        console.warn('🏁 Meal Cycle Completion Triggered:', {
          reason: isLastReading 
            ? 'Last interval reading' 
            : 'All readings completed'
        });
        
        // Optional: Add a toast for user feedback
        toast({
          title: "Meal Cycle Completed",
          description: "Your glucose tracking for this meal is now complete.",
          variant: "default"
        });

        // Signal completion instead of abandonment
        onCompleteCycle?.();
        return;
      }
    }

    // Modify onSubmit to ensure correct reading storage
    const submitReading = () => {
      console.error('📝 READING SUBMISSION ATTEMPT', {
        timePoint,
        value,
        expectedIntervals: getCurrentIntervals(mode).readings,
        onSubmitFunction: !!onSubmit
      });

      const result = onSubmit(value);
      
      console.error('📝 READING SUBMISSION RESULT', {
        timePoint,
        value,
        submissionResult: result
      });
    };

    submitReading();
    
    toast({
      title: "Reading Recorded",
      description: `${value} mg/dL at ${timePoint} minutes recorded successfully`,
    });
  };
  
  // Get color based on value
  const getValueColor = () => {
    if (value < 65) return 'text-blue-600';
    if (value <= 90) return 'text-green-600';
    if (value <= 105) return 'text-yellow-600';
    if (value <= 140) return 'text-orange-600';
    if (value <= 180) return 'text-red-600';
    return 'text-purple-600';
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {/* Title */}
      <h3 className="text-center text-[3rem] font-bold mb-6 text-gray-800">Glucose Reading</h3>
      
      {/* Glucose Level Description */}
      <div className="text-center mb-4">
        <div className="text-[2rem] text-center text-gray-600">
          {value < 65 ? (
            <span className="text-blue-600">Extreme Weight Loss</span>
          ) : value <= 90 ? (
            <span className="text-green-600">Weight Loss Range</span>
          ) : value <= 110 ? (
            <span className="text-yellow-600">Maintain Weight</span>
          ) : value <= 140 ? (
            <span className="text-orange-600">Weight Gain Range</span>
          ) : value <= 180 ? (
            <span className="text-red-600">Extreme Weight Gain</span>
          ) : (
            <span className="text-purple-600">Extreme Weight Gain</span>
          )}
        </div>
      </div>
      
      {/* Glucose Value Display */}
      <div className="text-center mb-4">
        <span className={`text-4xl font-bold ${getValueColor()}`}>
          {value} mg/dL
        </span>
      </div>
      
      {/* Slider and controls */}
      <div className="flex items-center gap-4 mb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleDecrease}
          className="h-10 w-10 rounded-full"
        >
          <span className="text-[2.5rem]">-</span>
        </Button>
        
        <div className="flex-1">
          <Slider 
            value={[value]} 
            min={50} 
            max={300} 
            step={1}
            onValueChange={handleChange}
            className="flex-1"
            trackColor={
              value < 65 ? 'bg-blue-500' :
              value <= 90 ? 'bg-green-500' :
              value <= 110 ? 'bg-yellow-500' :
              value <= 140 ? 'bg-orange-500' :
              value <= 180 ? 'bg-red-500' :
              'bg-purple-500'
            }
          />
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleIncrease}
          className="h-10 w-10 rounded-full"
        >
          <span className="text-[2.5rem]">+</span>
        </Button>
      </div>
      
      {/* Save button centered */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSaveReading} 
          size="lg"
          className="mx-auto"
        >
          Save Reading
        </Button>
      </div>
    </div>
  );
};

export default GlucoseInput;
