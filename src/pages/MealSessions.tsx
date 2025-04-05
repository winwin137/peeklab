import React, { useEffect } from 'react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Activity, AlertTriangle } from 'lucide-react';

const MealSessions: React.FC = () => {
  const { mealCycles, loading, error } = useMealCycles();

  useEffect(() => {
    console.error('MealSessions mounted at:', new Date().toISOString());
    return () => {
      console.error('MealSessions unmounted at:', new Date().toISOString());
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-peekdiet-secondary"></div>
            <div className="mt-4 h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Meal Sessions
            </CardTitle>
            <CardDescription>
              Detailed view of your meal tracking sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mealCycles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No meal sessions recorded yet
              </p>
            ) : (
              <div className="space-y-6">
                {mealCycles.map((cycle) => (
                  <Card key={cycle.id} className="hover:bg-accent/5 transition-colors">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(cycle.startTime, 'PPP p')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ID</p>
                          <p className="font-medium">{cycle.uniqueId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Preprandial</p>
                          <p className="font-medium">
                            {cycle.preprandialReading?.value ?? 'N/A'} mg/dL
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className={`font-medium capitalize ${
                            cycle.status === 'abandoned' ? 'text-destructive' : ''
                          }`}>
                            {cycle.status}
                          </p>
                        </div>
                      </div>

                      {Object.keys(cycle.postprandialReadings).length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">Postprandial Readings</p>
                          <div className="grid grid-cols-3 gap-2">
                            {Object.entries(cycle.postprandialReadings)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([minutes, reading]) => (
                                <div key={reading.id} className="text-center">
                                  <p className="text-xs text-muted-foreground">{minutes}m</p>
                                  <p className="font-medium">{reading.value} mg/dL</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Readings</p>
                          <p className="font-medium">
                            {Object.keys(cycle.postprandialReadings).length + (cycle.preprandialReading ? 1 : 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Peak</p>
                          <p className="font-medium">
                            {Math.max(
                              cycle.preprandialReading?.value || 0,
                              ...Object.values(cycle.postprandialReadings).map(r => r.value)
                            )} mg/dL
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MealSessions; 