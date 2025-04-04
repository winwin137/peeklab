
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface GlucoseInputProps {
  title: string;
  description: string;
  onSubmit: (value: number) => void;
  onCancel?: () => void;
  defaultValue?: number;
}

const GlucoseInput: React.FC<GlucoseInputProps> = ({
  title,
  description,
  onSubmit,
  onCancel,
  defaultValue = 100
}) => {
  const [value, setValue] = useState(defaultValue.toString());
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setValue(inputValue);
    
    // Validate input
    if (inputValue === '') {
      setError('Please enter a value');
    } else if (isNaN(Number(inputValue))) {
      setError('Please enter a valid number');
    } else if (Number(inputValue) < 20 || Number(inputValue) > 600) {
      setError('Value must be between 20 and 600');
    } else {
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numValue = Number(value);
    if (!error && !isNaN(numValue)) {
      onSubmit(numValue);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                className="glucose-input text-2xl"
                type="number"
                inputMode="decimal"
                value={value}
                onChange={handleChange}
                autoFocus
              />
              {error && <p className="text-destructive text-sm mt-1">{error}</p>}
              <p className="text-muted-foreground text-sm mt-1">
                Enter value in mg/dL
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={!!error || value === ''}
            className="ml-auto"
          >
            Submit
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GlucoseInput;
