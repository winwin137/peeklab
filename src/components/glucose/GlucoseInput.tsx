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
}

const GlucoseInput: React.FC<GlucoseInputProps> = ({
  title,
  description,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(getCurrentTimeout() * 60); // Convert minutes to seconds

  useEffect(() => {
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
  }, [onCancel]);

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
              disabled={isLoading}
            />
            {error && (
              <p className="text-destructive text-sm mt-2">{error}</p>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Time remaining: {formatTime(timeLeft)}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={isLoading}
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
