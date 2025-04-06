import { AgeGroup, BodyFatCategory, BodyFatResult, UserMeasurements } from '@/types/bodyFat';
import { BODY_FAT_RANGES } from '@/types/bodyFat';

export const getAgeGroup = (age: number): AgeGroup => {
  if (age >= 20 && age <= 39) return '20-39';
  if (age >= 40 && age <= 59) return '40-59';
  if (age >= 60 && age <= 79) return '60-79';
  throw new Error('Age must be between 20 and 79');
};

export const convertToMetric = (measurements: UserMeasurements): UserMeasurements => {
  if (measurements.unit === 'metric') return measurements;

  return {
    ...measurements,
    unit: 'metric',
    height: measurements.height * 2.54, // inches to cm
    weight: measurements.weight * 0.453592 // lbs to kg
  };
};

export const calculateBMI = (height: number, weight: number): number => {
  // Height is in cm, weight is in kg
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const calculateBodyFatPercentage = (bmi: number, age: number, gender: 'male' | 'female'): number => {
  // Using the U.S. Navy Body Fat Calculator formula
  if (gender === 'male') {
    return (1.20 * bmi) + (0.23 * age) - 16.2;
  } else {
    return (1.20 * bmi) + (0.23 * age) - 5.4;
  }
};

export const getBodyFatCategory = (
  bodyFatPercentage: number,
  ageGroup: AgeGroup,
  gender: 'male' | 'female'
): BodyFatCategory => {
  const ranges = BODY_FAT_RANGES[gender][ageGroup];

  if (bodyFatPercentage < ranges.underfat) return 'underfat';
  if (bodyFatPercentage < ranges.healthy) return 'healthy';
  if (bodyFatPercentage < ranges.overfat) return 'overfat';
  return 'obese';
};

export const calculateBodyFat = (measurements: UserMeasurements): BodyFatResult => {
  // Convert to metric if necessary
  const metricMeasurements = convertToMetric(measurements);
  
  // Calculate BMI
  const bmi = calculateBMI(metricMeasurements.height, metricMeasurements.weight);
  
  // Calculate body fat percentage
  const bodyFatPercentage = calculateBodyFatPercentage(
    bmi,
    metricMeasurements.age,
    metricMeasurements.gender
  );
  
  // Determine age group
  const ageGroup = getAgeGroup(metricMeasurements.age);
  
  // Get body fat category
  const category = getBodyFatCategory(
    bodyFatPercentage,
    ageGroup,
    metricMeasurements.gender
  );
  
  // Get reference ranges
  const ranges = BODY_FAT_RANGES[metricMeasurements.gender][ageGroup];

  return {
    bmi,
    bodyFatPercentage,
    category,
    ranges
  };
};

export const getCategoryDescription = (category: BodyFatCategory): string => {
  switch (category) {
    case 'underfat':
      return "Your body fat percentage is below the healthy range. Consider consulting a healthcare professional to ensure you're getting adequate nutrition and maintaining a healthy weight.";
    case 'healthy':
      return 'Your body fat percentage is within the healthy range. This is associated with lower risk of chronic diseases and better overall health.';
    case 'overfat':
      return 'Your body fat percentage is above the healthy range but below obesity. Consider lifestyle changes to improve your body composition and reduce health risks.';
    case 'obese':
      return 'Your body fat percentage is in the obese range. This increases the risk of various health conditions. Consider consulting a healthcare professional for guidance on weight management.';
    default:
      return '';
  }
}; 