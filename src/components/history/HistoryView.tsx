import React from 'react';
import { 
  Accordion, 
  AccordionItem, 
  AccordionItemHeading, 
  AccordionItemButton, 
  AccordionItemPanel 
} from 'react-accessible-accordion';
import 'react-accessible-accordion/dist/fancy-example.css';

import { MealCycle, GlucoseReading } from '@/types';
import GlucoseGraph from '../meal/GlucoseGraph';
import { calculateAverageGlucose } from '@/utils/glucose';
import { convertFirebaseTime } from '@/utils/date';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface HistoryViewProps {
  mealCycles: MealCycle[];
  adHocReadings?: GlucoseReading[];
}

const getCardColor = (value: number) => {
  if (value < 65) return 'text-blue-600';
  if (value <= 90) return 'text-green-600';
  if (value <= 105) return 'text-yellow-600';
  if (value <= 140) return 'text-orange-600';
  if (value <= 180) return 'text-red-600';
  return 'text-purple-600';
};

const HistoryView: React.FC<HistoryViewProps> = ({ mealCycles, adHocReadings = [] }) => {
  // Group meal cycles by date
  const groupedMealCycles = React.useMemo(() => {
    const groups: { [date: string]: MealCycle[] } = {};
    
    mealCycles.forEach(cycle => {
      if (cycle.preprandialReading) {
        const date = new Date(cycle.preprandialReading.timestamp).toDateString();
        if (!groups[date]) groups[date] = [];
        groups[date].push(cycle);
      }
    });

    return groups;
  }, [mealCycles]);

  const calculateDailyAverageGlucose = (cycles: MealCycle[]) => {
    const averages = cycles
      .map(calculateAverageGlucose)
      .filter(avg => avg !== null) as number[];
    
    return averages.length > 0 
      ? averages.reduce((a, b) => a + b, 0) / averages.length 
      : null;
  };

  // Prepare data for daily averages graph
  const dailyAveragesData = React.useMemo(() => {
    return Object.entries(groupedMealCycles)
      .map(([date, cycles]) => {
        const dailyAverage = calculateDailyAverageGlucose(cycles);
        return {
          name: format(new Date(date), 'MM/dd'),
          glucose: dailyAverage !== null ? Number(dailyAverage.toFixed(1)) : null
        };
      })
      .filter(item => item.glucose !== null)
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [groupedMealCycles]);

  // Calculate running average of daily averages
  const runningAverage = React.useMemo(() => {
    const dailyAverages = Object.entries(groupedMealCycles)
      .map(([_, cycles]) => calculateDailyAverageGlucose(cycles))
      .filter(avg => avg !== null) as number[];

    return dailyAverages.length > 0 
      ? dailyAverages.reduce((a, b) => a + b, 0) / dailyAverages.length 
      : null;
  }, [groupedMealCycles]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Glucose History</h1>
      
      {/* Running Average Accordion Card */}
      <Accordion allowZeroExpanded>
        <AccordionItem uuid="running-average">
          <AccordionItemHeading>
            <AccordionItemButton className="bg-white p-4 border-b hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Running Average</span>
                {runningAverage !== null && (
                  <span className={`font-bold ${getCardColor(runningAverage)}`}>
                    {runningAverage.toFixed(1)} mg/dL
                  </span>
                )}
              </div>
            </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel className="p-4 bg-gray-50">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyAveragesData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis 
                    domain={['dataMin - 10', 'dataMax + 10']} 
                    label={{ value: 'Glucose (mg/dL)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value} mg/dL`, 'Daily Average']}
                    labelFormatter={(label) => `Date: ${label}`}
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
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>

      {/* Existing Accordion for Daily Cycles */}
      <Accordion allowZeroExpanded>
        {Object.entries(groupedMealCycles).map(([date, cycles]) => {
          const dailyAverage = calculateDailyAverageGlucose(cycles);
          
          return (
            <AccordionItem key={date} uuid={date}>
              <AccordionItemHeading>
                <AccordionItemButton className="bg-white p-4 border-b hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{date}</span>
                    {dailyAverage !== null && (
                      <span className={`font-bold ${getCardColor(dailyAverage)}`}>
                        {dailyAverage.toFixed(1)} mg/dL
                      </span>
                    )}
                  </div>
                </AccordionItemButton>
              </AccordionItemHeading>
              <AccordionItemPanel className="p-4 bg-gray-50">
                <div className="space-y-4">
                  {cycles.map(cycle => (
                    <div key={cycle.id} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span>{convertFirebaseTime(cycle.preprandialReading?.timestamp)}</span>
                        {calculateAverageGlucose(cycle) !== null && (
                          <span className="font-semibold">
                            Avg: {calculateAverageGlucose(cycle)?.toFixed(1)} mg/dL
                          </span>
                        )}
                      </div>
                      <div className="h-40 w-full">
                        <GlucoseGraph mealCycle={cycle} />
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionItemPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default HistoryView;