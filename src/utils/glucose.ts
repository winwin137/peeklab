import { MealCycle } from '../types';

export const calculateAverageGlucose = (mealCycle: MealCycle): number | null => {
  // Get all readings (preprandial and postprandial)
  const readings = [
    mealCycle.preprandialReading,
    ...Object.values(mealCycle.postprandialReadings)
  ].filter(reading => 
    reading && 
    reading.value !== null && 
    reading.value !== undefined && 
    reading.value > 0
  );

  console.log('[calculateAverageGlucose] Valid readings:', readings);
  console.log('[calculateAverageGlucose] Reading values:', readings.map(r => r.value));

  if (readings.length === 0) return null;
  
  const sum = readings.reduce((acc, reading) => acc + reading.value, 0);
  const average = Math.round(sum / readings.length);
  
  console.log('[calculateAverageGlucose] Sum:', sum);
  console.log('[calculateAverageGlucose] Count:', readings.length);
  console.log('[calculateAverageGlucose] Average:', average);
  
  return average;
};

export const calculatePeakGlucose = (mealCycle: MealCycle): number | null => {
  const readings = [
    mealCycle.preprandialReading,
    ...Object.values(mealCycle.postprandialReadings)
  ].filter(reading => 
    reading && 
    reading.value !== null && 
    reading.value !== undefined && 
    reading.value > 0
  );

  if (readings.length === 0) return null;
  return Math.max(...readings.map(reading => reading.value));
}; 