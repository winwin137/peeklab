import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MealCycle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { calculateAverageGlucose, calculatePeakGlucose } from '@/utils/glucose';
import { convertFirebaseTime } from '@/utils/date';
import { useMealCycles } from '@/hooks/useMealCycles';
import { getCurrentCycleTimeout } from '@/config';
import { Clock } from 'lucide-react';

interface MealCycleListProps {
  mealCycles: MealCycle[];
  onSelect?: (mealCycleId: string) => void;
}

const MealCycleList: React.FC<MealCycleListProps> = ({ mealCycles, onSelect }) => {
  const { activeMealCycle } = useMealCycles();
  const [timeRemaining, setTimeRemaining] = React.useState<number | null>(null);

  // Update time remaining every second
  React.useEffect(() => {
    if (!activeMealCycle?.startTime) {
      setTimeRemaining(null);
      return;
    }

    const cycleTimeout = getCurrentCycleTimeout() * 60 * 1000; // Convert to milliseconds
    const endTime = activeMealCycle.startTime + cycleTimeout;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = endTime - now;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [activeMealCycle?.startTime]);

  const formatTimeRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  if (mealCycles.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No meal cycles recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timeRemaining !== null && (
        <div className="flex items-center justify-center text-amber-500">
          <Clock className="h-4 w-4 mr-1" />
          <span>Cycle ends in {formatTimeRemaining(timeRemaining)}</span>
        </div>
      )}
      <h2 className="text-xl font-semibold">Recent Meal Cycles</h2>
      
      {mealCycles.slice(0, 5).map(cycle => {
        const averageGlucose = calculateAverageGlucose(cycle);
        const peakGlucose = calculatePeakGlucose(cycle);
        
        return (
          <Card 
            key={cycle.id} 
            className="meal-card cursor-pointer"
            onClick={() => onSelect && onSelect(cycle.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {cycle.preprandialReading 
                      ? convertFirebaseTime(cycle.preprandialReading.timestamp)
                      : 'No preprandial reading'}
                  </CardTitle>
                  <CardDescription>
                    ID: {cycle.uniqueId}
                    {averageGlucose !== null && (
                      <span className="ml-2 font-semibold">
                        Average: {averageGlucose} mg/dL
                      </span>
                    )}
                  </CardDescription>
                </div>
                <Badge 
                  variant={
                    cycle.status === 'completed' ? 'default' : 
                    cycle.status === 'active' ? 'outline' : 'secondary'
                  }
                >
                  {cycle.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(cycle.status === 'completed' || 
                cycle.status === 'abandoned' ||
                Object.keys(cycle.postprandialReadings).length > 0) && (
                <div className="h-32 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: 'Pre', glucose: cycle.preprandialReading?.value },
                        ...Object.entries(cycle.postprandialReadings)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([minutes, reading]) => ({
                            name: `${minutes}m`,
                            glucose: reading.value
                          }))
                      ]}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 10 }} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} mg/dL`, 'Glucose']}
                        labelFormatter={(label) => label}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="glucose" 
                        stroke="#8B5CF6" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-1 text-xs mt-3">
                <div className="text-muted-foreground text-right">Pre:</div>
                <div className="font-semibold">
                  {cycle.preprandialReading 
                    ? `${cycle.preprandialReading.value} mg/dL` 
                    : '—'}
                </div>
                
                <div className="text-muted-foreground text-right">Peak:</div>
                <div className="font-semibold">
                  {peakGlucose ? `${peakGlucose} mg/dL` : '—'}
                </div>
                
                <div className="text-muted-foreground text-right">Readings:</div>
                <div className="font-semibold">
                  {Object.keys(cycle.postprandialReadings).length + 
                    (cycle.preprandialReading ? 1 : 0)}
                </div>
                
                <div className="text-muted-foreground text-right">Status:</div>
                <div className="font-semibold capitalize">
                  {cycle.status}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MealCycleList;
