import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { getCurrentTimeout } from '@/config';

interface GlucoseInputProps {
  title: string;
  description: string;
  onSubmit: (value: number) => void;
  onCancel: () => void;
  isLoading?: boolean;
  minutesMark?: number; // Optional - only provided for postprandial readings
}

const GlucoseInput: React.FC<GlucoseInputProps> = ({
  title,
  description,
  onSubmit,
  onCancel,
  isLoading = false,
  minutesMark
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isPostprandial = minutesMark !== undefined;
  const timeoutMinutes = isPostprandial ? getCurrentTimeout() : 0; // No timeout for preprandial
  const [timeLeft, setTimeLeft] = useState<number>(timeoutMinutes * 60);
  const [isEnabled, setIsEnabled] = useState(!isPostprandial); // Always enabled for preprandial

  useEffect(() => {
    if (!isPostprandial) return; // No timeout for preprandial

    // Calculate when to enable the input form
    const enableTime = minutesMark - timeoutMinutes;
    const now = Date.now();
    const startTime = now - (now % (60 * 1000)); // Round down to nearest minute
    
    if (startTime >= enableTime * 60 * 1000) {
      setIsEnabled(true);
    } else {
      setIsEnabled(false);
      const timeUntilEnable = (enableTime * 60 * 1000) - startTime;
      const timer = setTimeout(() => {
        setIsEnabled(true);
      }, timeUntilEnable);
      return () => clearTimeout(timer);
    }
  }, [minutesMark, timeoutMinutes, isPostprandial]);

  useEffect(() => {
    if (!isPostprandial) return; // No timeout for preprandial

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCancel, isPostprandial]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (numericValue < 0 || numericValue > 500) {
      setError('Please enter a value between 0 and 500');
      return;
    }
    
    setError(null);
    onSubmit(numericValue);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">{title}</CardTitle>
        <CardDescription className="text-center">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter glucose value"
              className="text-center text-2xl h-16 w-32"
              disabled={isLoading || (isPostprandial && !isEnabled)}
            />
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
            {isPostprandial && (
              <div className="mt-4 flex flex-col items-center">
                <div className="text-sm font-medium text-muted-foreground">Input Form Timeout</div>
                <div className="text-2xl font-bold mt-1">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {timeoutMinutes === 2 ? '2-minute timeout (Testing)' : '7-minute timeout (Normal)'}
                </div>
                {!isEnabled && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Input form will be enabled {timeoutMinutes} minutes before reading time
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={isLoading || (isPostprandial && !isEnabled)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
          disabled={isLoading}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GlucoseInput;
