
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface StartMealCycleProps {
  onStartAdhoc: () => void;
  onStartMeal: () => void;
}

const StartMealCycle: React.FC<StartMealCycleProps> = ({ 
  onStartAdhoc,
  onStartMeal
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Track Your Glucose</CardTitle>
        <CardDescription className="text-center">
          Monitor your blood glucose response to meals
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="flex justify-center mb-4">
          <div className="h-32 w-32 rounded-full bg-peekdiet-secondary flex items-center justify-center">
            <Plus className="h-16 w-16 text-peekdiet-primary" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={onStartMeal} className="w-full">
          Start Meal Cycle
        </Button>
        <Button variant="outline" onClick={onStartAdhoc} className="w-full">
          Ad-hoc Reading
        </Button>
      </CardFooter>
    </Card>
  );
};

export default StartMealCycle;
