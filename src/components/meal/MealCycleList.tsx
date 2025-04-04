
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MealCycle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MealCycleListProps {
  mealCycles: MealCycle[];
  onSelect?: (mealCycleId: string) => void;
}

const MealCycleList: React.FC<MealCycleListProps> = ({ mealCycles, onSelect }) => {
  if (mealCycles.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No meal cycles recorded yet.</p>
      </div>
    );
  }

  // Create a formatted data object for the chart
  const getChartData = (cycle: MealCycle) => {
    const data = [];
    
    // Add preprandial reading if it exists
    if (cycle.preprandialReading) {
      data.push({
        name: 'Pre',
        glucose: cycle.preprandialReading.value,
        time: 'Pre-meal'
      });
    }
    
    // Add all postprandial readings
    if (cycle.postprandialReadings) {
      const intervals = [20, 40, 60, 90, 120, 180];
      
      intervals.forEach(minutes => {
        if (cycle.postprandialReadings[minutes]) {
          data.push({
            name: `${minutes}m`,
            glucose: cycle.postprandialReadings[minutes].value,
            time: `${minutes} min`
          });
        }
      });
    }
    
    return data;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Recent Meal Cycles</h2>
      
      {mealCycles.slice(0, 5).map(cycle => (
        <Card 
          key={cycle.id} 
          className="meal-card cursor-pointer"
          onClick={() => onSelect && onSelect(cycle.id)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">
                  {cycle.startTime 
                    ? format(cycle.startTime, 'PPP') 
                    : format(cycle.createdAt, 'PPP')}
                </CardTitle>
                <CardDescription>
                  {cycle.startTime 
                    ? format(cycle.startTime, 'p') 
                    : 'Not started'}
                  {cycle.uniqueId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ID: {cycle.uniqueId.substring(0, 8)}
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
              Object.keys(cycle.postprandialReadings).length > 0) && (
              <div className="h-32 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData(cycle)}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 10 }} />
                    <Tooltip />
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
                {Object.keys(cycle.postprandialReadings).length > 0
                  ? `${Math.max(...Object.values(cycle.postprandialReadings).map(r => r.value))} mg/dL`
                  : '—'}
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
      ))}
    </div>
  );
};

export default MealCycleList;
