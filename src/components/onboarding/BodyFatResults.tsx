import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BodyFatResult } from '../../types/bodyFat';
import { getCategoryDescription } from '../../utils/bodyFat';
import { ArrowLeft } from 'lucide-react';

interface BodyFatResultsProps {
  result: BodyFatResult;
  onBack: () => void;
}

const BodyFatResults: React.FC<BodyFatResultsProps> = ({ result, onBack }) => {
  const categoryDescription = getCategoryDescription(result.category);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-bold">Your Results</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Body Fat Analysis</CardTitle>
            <CardDescription>Based on your measurements and age group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Body Fat Percentage</span>
                <span className="font-semibold">{result.bodyFatPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BMI</span>
                <span className="font-semibold">{result.bmi.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-semibold capitalize">{result.category}</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold mb-2">What This Means</h3>
              <p className="text-sm text-muted-foreground">{categoryDescription}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Body Fat Ranges</CardTitle>
            <CardDescription>Reference chart for your age group</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img 
                src="/assets/images/body-fat-ranges.jpg" 
                alt="Body Fat Ranges Chart" 
                className="w-full rounded-lg border"
              />
              <div className="text-sm text-muted-foreground">
                <p>This chart shows the healthy ranges for body fat percentage based on age and gender.</p>
                <p className="mt-2">Your result of {result.bodyFatPercentage.toFixed(1)}% falls in the {result.category} range.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={onBack}>
          Back to Calculator
        </Button>
      </div>
    </div>
  );
};

export default BodyFatResults; 