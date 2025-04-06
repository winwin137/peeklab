export type Gender = 'male' | 'female';

export type MeasurementUnit = 'metric' | 'imperial';

export type AgeGroup = '20-39' | '40-59' | '60-79';

export type BodyFatCategory = 'underfat' | 'healthy' | 'overfat' | 'obese';

export interface BodyFatRanges {
  underfat: number;
  healthy: number;
  overfat: number;
  obese: number;
}

export interface BodyFatResult {
  bmi: number;
  bodyFatPercentage: number;
  category: BodyFatCategory;
  ranges: BodyFatRanges;
}

export interface UserMeasurements {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  unit: MeasurementUnit;
}

export const BODY_FAT_RANGES: Record<Gender, Record<AgeGroup, BodyFatRanges>> = {
  male: {
    '20-39': {
      underfat: 8,
      healthy: 19,
      overfat: 25,
      obese: 30
    },
    '40-59': {
      underfat: 11,
      healthy: 22,
      overfat: 28,
      obese: 33
    },
    '60-79': {
      underfat: 13,
      healthy: 25,
      overfat: 30,
      obese: 35
    }
  },
  female: {
    '20-39': {
      underfat: 21,
      healthy: 33,
      overfat: 39,
      obese: 45
    },
    '40-59': {
      underfat: 23,
      healthy: 35,
      overfat: 40,
      obese: 46
    },
    '60-79': {
      underfat: 24,
      healthy: 36,
      overfat: 42,
      obese: 48
    }
  }
}; 