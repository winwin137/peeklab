import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useMealCycles } from '../hooks/useMealCycles';
import { MealCycle as MealCycleType } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { format } from 'date-fns';
import { Activity, Clock, AlertCircle } from 'lucide-react';

const MealCycle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { mealCycles, loading, error } = useMealCycles();
  const [mealCycle, setMealCycle] = useState<MealCycleType | null>(null);

  useEffect(() => {
    if (id && mealCycles.length > 0) {
      const cycle = mealCycles.find(cycle => cycle.id === id);
      setMealCycle(cycle || null);
    }
  }, [id, mealCycles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!mealCycle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Meal Cycle Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">The requested meal cycle could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Meal Cycle Details
          </CardTitle>
          <CardDescription>
            Started on {format(mealCycle.startTime, 'PPP p')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{mealCycle.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unique ID</p>
                <p className="font-medium">{mealCycle.uniqueId}</p>
              </div>
            </div>

            {mealCycle.preprandialReading && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Preprandial Reading</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Value</p>
                    <p className="font-medium">{mealCycle.preprandialReading.value} mg/dL</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {format(mealCycle.preprandialReading.timestamp, 'p')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {Object.keys(mealCycle.postprandialReadings).length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Postprandial Readings</h3>
                <div className="space-y-4">
                  {Object.entries(mealCycle.postprandialReadings)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([minutes, reading]) => (
                      <div key={reading.id} className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">{minutes} minutes</p>
                          <p className="font-medium">{reading.value} mg/dL</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-medium">
                            {format(reading.timestamp, 'p')}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default MealCycle; 