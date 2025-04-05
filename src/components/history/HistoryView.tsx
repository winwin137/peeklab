import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MealCycle, GlucoseReading } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import GlucoseGraph from '../meal/GlucoseGraph';
import AdHocReadingCard from './AdHocReadingCard';
import { calculateAverageGlucose, calculatePeakGlucose } from '@/utils/glucose';
import { convertFirebaseTime } from '@/utils/date';

interface HistoryViewProps {
  mealCycles: MealCycle[];
  adHocReadings: GlucoseReading[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ mealCycles, adHocReadings }) => {
  // Group readings by day
  const groupedReadings = useMemo(() => {
    const groups: { [key: string]: { 
      date: Date; 
      mealCycles: MealCycle[]; 
      adHocReadings: GlucoseReading[];
      dailyAverage: number | null;
    } } = {};

    // Process meal cycles
    mealCycles.forEach(cycle => {
      const dateKey = format(new Date(cycle.startTime), 'yyyy-MM-dd');
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
      const dateKey = format(new Date(reading.timestamp), 'yyyy-MM-dd');
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

    return groups;
  }, [mealCycles, adHocReadings]);

  // Sort days in descending order
  const sortedDays = useMemo(() => {
    return Object.values(groupedReadings)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [groupedReadings]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="adhoc">Ad Hoc Readings</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
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
                      <Card key={cycle.id}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {convertFirebaseTime(cycle.startTime)}
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
                              <GlucoseGraph mealCycle={cycle} />
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
                  
                  {adHocReadings.map(reading => (
                    <AdHocReadingCard key={reading.id} reading={reading} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="adhoc">
          <div className="space-y-8">
            {sortedDays.map(({ date, adHocReadings }) => (
              adHocReadings.length > 0 && (
                <div key={date.toISOString()} className="space-y-4">
                  <h2 className="text-xl font-semibold">
                    {format(date, 'PPP')}
                  </h2>
                  <div className="space-y-4">
                    {adHocReadings.map(reading => (
                      <AdHocReadingCard key={reading.id} reading={reading} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </TabsContent>
        <TabsContent value="calendar">
          <div className="text-center p-4 text-muted-foreground">
            Calendar view coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryView; 