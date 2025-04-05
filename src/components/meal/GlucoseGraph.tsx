import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MealCycle } from '@/types';

interface GlucoseGraphProps {
  mealCycle: MealCycle;
}

const GlucoseGraph: React.FC<GlucoseGraphProps> = ({ mealCycle }) => {
  console.log('[GlucoseGraph] Rendering with meal cycle:', {
    id: mealCycle.id,
    preprandial: mealCycle.preprandialReading,
    postprandial: mealCycle.postprandialReadings
  });

  const prepareGraphData = () => {
    const data = [];
    
    // Add preprandial reading if it exists
    if (mealCycle.preprandialReading) {
      console.log('[GlucoseGraph] Adding preprandial reading:', mealCycle.preprandialReading);
      data.push({
        name: 'Pre',
        glucose: mealCycle.preprandialReading.value,
        time: 0
      });
    }

    // Add postprandial readings
    const sortedReadings = Object.entries(mealCycle.postprandialReadings)
      .sort(([a], [b]) => Number(a) - Number(b));

    console.log('[GlucoseGraph] Sorted postprandial readings:', sortedReadings);

    sortedReadings.forEach(([minutes, reading]) => {
      if (reading && reading.value !== null && reading.value !== undefined) {
        console.log(`[GlucoseGraph] Adding ${minutes}m reading:`, reading);
        data.push({
          name: `${minutes}m`,
          glucose: reading.value,
          time: Number(minutes)
        });
      }
    });

    console.log('[GlucoseGraph] Final data array:', data);
    return data;
  };

  const data = prepareGraphData();
  
  if (data.length === 0) {
    console.log('[GlucoseGraph] No data to display');
    return null;
  }

  // Calculate Y-axis domain
  const minGlucose = Math.min(...data.map(d => d.glucose));
  const maxGlucose = Math.max(...data.map(d => d.glucose));
  const padding = 10;
  const yDomain = [Math.max(0, minGlucose - padding), maxGlucose + padding];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 10 }}
        />
        <YAxis 
          domain={yDomain}
          tick={{ fontSize: 10 }}
        />
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
          connectNulls={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default GlucoseGraph; 