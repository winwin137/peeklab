import React, { useState, useMemo } from 'react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MealCycle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, TrendingUp, Activity } from 'lucide-react';

interface HistoryViewProps {
  mealCycles: MealCycle[];
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

const HistoryView: React.FC<HistoryViewProps> = ({ mealCycles }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedCycle, setSelectedCycle] = useState<MealCycle | null>(null);

  // Filter meal cycles based on time range
  const filteredCycles = useMemo(() => {
    const now = Date.now();
    const cutoff = {
      '7d': subDays(now, 7).getTime(),
      '30d': subDays(now, 30).getTime(),
      '90d': subDays(now, 90).getTime(),
      'all': 0
    }[timeRange];

    return mealCycles
      .filter(cycle => cycle.createdAt >= cutoff)
      .sort((a, b) => (b.startTime || b.createdAt) - (a.startTime || a.createdAt));
  }, [mealCycles, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completedCycles = filteredCycles.filter(cycle => 
      cycle.status === 'completed' || cycle.status === 'abandoned'
    );
    const totalReadings = completedCycles.reduce((sum, cycle) => {
      return sum + Object.keys(cycle.postprandialReadings).length + (cycle.preprandialReading ? 1 : 0);
    }, 0);

    const avgPreprandial = completedCycles.reduce((sum, cycle) => {
      return sum + (cycle.preprandialReading?.value || 0);
    }, 0) / (completedCycles.length || 1);

    const avgPeak = completedCycles.reduce((sum, cycle) => {
      const readings = Object.values(cycle.postprandialReadings);
      const peak = readings.length > 0 ? Math.max(...readings.map(r => r.value)) : 0;
      return sum + peak;
    }, 0) / (completedCycles.length || 1);

    return {
      totalCycles: filteredCycles.length,
      completedCycles: completedCycles.length,
      totalReadings,
      avgPreprandial: Math.round(avgPreprandial),
      avgPeak: Math.round(avgPeak)
    };
  }, [filteredCycles]);

  // Format data for trend graph
  const trendData = useMemo(() => {
    return filteredCycles.map(cycle => {
      const readings = [];
      if (cycle.preprandialReading) {
        readings.push({
          time: cycle.startTime || cycle.createdAt,
          value: cycle.preprandialReading.value,
          type: 'preprandial'
        });
      }
      
      Object.values(cycle.postprandialReadings).forEach(reading => {
        readings.push({
          time: reading.timestamp,
          value: reading.value,
          type: 'postprandial'
        });
      });

      return readings;
    }).flat().sort((a, b) => a.time - b.time);
  }, [filteredCycles]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">History</h2>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cycles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCycles}</div>
            <div className="text-xs text-muted-foreground">
              {stats.completedCycles} completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReadings}</div>
            <div className="text-xs text-muted-foreground">
              Average readings per cycle
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Preprandial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPreprandial} mg/dL</div>
            <div className="text-xs text-muted-foreground">
              Before meals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Peak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPeak} mg/dL</div>
            <div className="text-xs text-muted-foreground">
              Highest reading
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Glucose Trends</CardTitle>
          <CardDescription>
            Your glucose readings over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={(time) => format(time, 'MMM d')}
                />
                <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  labelFormatter={(time) => format(time, 'MMM d, h:mm a')}
                  formatter={(value) => [`${value} mg/dL`, 'Glucose']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          {filteredCycles.map(cycle => (
            <Card 
              key={cycle.id} 
              className={`cursor-pointer transition-colors ${
                selectedCycle?.id === cycle.id ? 'border-primary' : ''
              } ${cycle.status === 'abandoned' ? 'opacity-80' : ''}`}
              onClick={() => setSelectedCycle(cycle)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {format(cycle.startTime || cycle.createdAt, 'PPP')}
                    </CardTitle>
                    <CardDescription>
                      {format(cycle.startTime || cycle.createdAt, 'p')}
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
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="glucose" 
                          stroke={cycle.status === 'abandoned' ? '#6B7280' : '#8B5CF6'} 
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