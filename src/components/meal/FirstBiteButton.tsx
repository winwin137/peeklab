
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Utensils } from 'lucide-react';

interface FirstBiteButtonProps {
  onFirstBite: () => void;
  preprandialValue?: number;
}

const FirstBiteButton: React.FC<FirstBiteButtonProps> = ({ 
  onFirstBite,
  preprandialValue
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Ready to Eat?</CardTitle>
        <CardDescription className="text-center">
          We've recorded your preprandial reading of{' '}
          <span className="font-semibold">{preprandialValue} mg/dL</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="h-32 w-32 rounded-full bg-peekdiet-secondary flex items-center justify-center">
          <Utensils className="h-16 w-16 text-peekdiet-primary" />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onFirstBite}
          className="w-full text-lg py-6"
          size="lg"
        >
          First Bite
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FirstBiteButton;
