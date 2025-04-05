import React, { useEffect } from 'react';
import { useMealCycles } from '@/hooks/useMealCycles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Activity, AlertTriangle } from 'lucide-react';

const History: React.FC = () => {
  const { mealCycles, loading, error } = useMealCycles();

  useEffect(() => {
    console.error('History mounted at:', new Date().toISOString());
    return () => {
      console.error('History unmounted at:', new Date().toISOString());
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

  // Filter out any active meal cycles to prevent state conflicts
  const completedCycles = mealCycles.filter(cycle => 
    cycle.status === 'completed' || cycle.status === 'abandoned'
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-2xl mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Meal History
            </CardTitle>
            <CardDescription>
              View your completed and abandoned meal cycles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {completedCycles.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No completed meal cycles yet
              </p>
            ) : (
              <div className="space-y-4">
                {completedCycles.map((cycle) => (
                  <Card key={cycle.id} className="hover:bg-accent/5 transition-colors">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(cycle.startTime, 'PPP p')}
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
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Preprandial</p>
                          <p className="font-medium">
                            {cycle.preprandialReading?.value ?? 'N/A'} mg/dL
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Readings</p>
                          <p className="font-medium">
                            {Object.keys(cycle.postprandialReadings).length} / 6
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

export default History; 