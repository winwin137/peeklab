import React, { useState, useMemo } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MealCycle, GlucoseReading } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMealCycles } from '@/hooks/useMealCycles';
import { useAdHocReadings } from '@/hooks/useAdHocReadings';
import AdHocReadingCard from '@/components/history/AdHocReadingCard';
import { calculateAverageGlucose, calculatePeakGlucose } from '@/utils/glucose';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MealSessions: React.FC = () => {
  const { 
    mealCycles, 
    loading: mealCyclesLoading, 
    deleteMealCycle 
  } = useMealCycles();
  const { 
    adHocReadings, 
    loading: adHocReadingsLoading, 
    error: adHocError,
    deleteAdHocReading 
  } = useAdHocReadings();

  const handleDeleteMealCycle = async (mealCycleId: string) => {
    const result = await deleteMealCycle(mealCycleId);
    if (result) {
      console.log(`Meal cycle ${mealCycleId} deleted successfully`);
    }
  };

  const handleDeleteAdHocReading = async (readingId: string) => {
    const result = await deleteAdHocReading(readingId);
    if (result) {
      console.log(`Ad hoc reading ${readingId} deleted successfully`);
    }
  };

  console.log('MealSessions - Ad Hoc Readings:', {
    count: adHocReadings.length,
    readings: adHocReadings,
    loading: adHocReadingsLoading,
    error: adHocError
  });

  // Group readings by day
  const groupedReadings = useMemo(() => {
    console.log('Grouping readings...');
    const groups: { [key: string]: { 
      date: Date; 
      mealCycles: MealCycle[]; 
      adHocReadings: GlucoseReading[];
      dailyAverage: number | null;
    } } = {};

    // Process meal cycles
    mealCycles.forEach(cycle => {
      const dateKey = format(cycle.startTime, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(cycle.startTime),
          mealCycles: [],
          adHocReadings: [],
          dailyAverage: null
        };
      }
      groups[dateKey].mealCycles.push(cycle);
    });

    // Process ad hoc readings
    adHocReadings.forEach(reading => {
      console.log('Processing ad hoc reading:', reading);
      const dateKey = format(reading.timestamp, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: new Date(reading.timestamp),
          mealCycles: [],
          adHocReadings: [],
          dailyAverage: null
        };
      }
      groups[dateKey].adHocReadings.push(reading);
    });

    // Calculate daily averages
    Object.values(groups).forEach(group => {
      const allReadings = [
        ...group.mealCycles.flatMap(cycle => [
          cycle.preprandialReading,
          ...Object.values(cycle.postprandialReadings)
        ]),
        ...group.adHocReadings
      ].filter(reading => 
        reading && 
        reading.value !== null && 
        reading.value !== undefined && 
        reading.value > 0
      );

      if (allReadings.length > 0) {
        const sum = allReadings.reduce((acc, reading) => acc + reading.value, 0);
        group.dailyAverage = Math.round(sum / allReadings.length);
      }
    });

    console.log('Grouped readings:', groups);
    return groups;
  }, [mealCycles, adHocReadings]);

  // Sort days in descending order
  const sortedDays = useMemo(() => {
    return Object.values(groupedReadings)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [groupedReadings]);

  if (mealCyclesLoading || adHocReadingsLoading) {
    return <div>Loading...</div>;
  }

  if (adHocError) {
    console.error('Error with ad hoc readings:', adHocError);
    return <div>Error loading ad hoc readings: {adHocError.message}</div>;
  }

  return (
    <div className="space-y-8">
      {sortedDays.map(({ date, mealCycles, adHocReadings, dailyAverage }) => (
        <div key={date.toISOString()} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {format(date, 'PPP')}
            </h2>
            {dailyAverage !== null && (
              <span className="text-lg font-semibold">
                Daily Average: {dailyAverage} mg/dL
              </span>
            )}
          </div>
          
          <div className="space-y-4">
            {mealCycles.map(cycle => {
              const averageGlucose = calculateAverageGlucose(cycle);
              const peakGlucose = calculatePeakGlucose(cycle);
              
              return (
                <Card key={cycle.id} className="relative">
                  {/* Delete Button for Completed, Canceled, or Abandoned Cycles */}
                  {['completed', 'canceled', 'abandoned'].includes(cycle.status) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 z-10"
                      onClick={() => handleDeleteMealCycle(cycle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                  
                  <CardHeader>
                    <CardTitle>
                      {format(cycle.startTime, 'p')}
                    </CardTitle>
                    <CardDescription>
                      ID: {cycle.uniqueId}
                      {averageGlucose !== null && (
                        <span className="ml-2 font-semibold">
                          Average: {averageGlucose} mg/dL
                        </span>
                      )}
                    </CardDescription>
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

            {/* Ad Hoc Readings */}
            {adHocReadings.map(reading => (
              <Card key={reading.id} className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 z-10"
                  onClick={() => handleDeleteAdHocReading(reading.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                <AdHocReadingCard reading={reading} />
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MealSessions; 