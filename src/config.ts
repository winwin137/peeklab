export const useNotifications = (
  mealCycle: MealCycle | null, 
  mode: 'original' | 'testing' = 'testing'
) => {
  // Use mode in interval calculations
  const intervals = getCurrentIntervals(mode).readings;

  // Rest of the existing implementation
};const MealCycleTimer: React.FC<MealCycleTimerProps> = ({ 
  mealCycle, 
  onTakeReading, 
  onAbandon,
  mode = 'testing'  // Explicitly default to testing
}) => {
  // Use mode in all interval and timeout calculations
  const intervals = getCurrentIntervals(mode).readings;
  const maxTime = intervals[intervals.length - 1];
  const cycleTimeout = getCurrentCycleTimeout(mode);

  // Rest of the existing implementation
};export const useMealCycles = (mode: 'original' | 'testing' = 'testing') => {
  // Existing logic, but use mode for interval and timeout calculations
  const intervals = getCurrentIntervals(mode);
  const timeout = getCurrentTimeout(mode);
  const cycleTimeout = getCurrentCycleTimeout(mode);

  // Rest of the existing implementation
};/**
 * Testing Configuration
 * 
 * This file contains configurable values for testing purposes.
 * These values can be modified without affecting core logic.
 * 
 * ⚠️ DO NOT MODIFY IN PRODUCTION ⚠️
 */

export const TESTING_CONFIG = {
  // Timeout settings (in minutes)
  timeout: {
    // Original timeout (7 minutes after scheduled time)
    original: 7,
    // Testing timeout (2 minutes after scheduled time)
    testing: 2
  },

  // Cycle timeout for noncompliance (in minutes)
  cycleTimeout: {
    // Original cycle timeout (190 minutes from first bite)
    original: 190,
    // Testing cycle timeout (40 minutes from first bite)
    testing: 21
  },
  
  // Reading intervals (in minutes)
  intervals: {
    // Original intervals (for reference)
    original: {
      firstBite: 0,
      readings: [20, 40, 60, 90, 120, 180]
    },
    
    // Testing intervals (can be modified)
    testing: {
      firstBite: 0,
      readings: [3, 6, 9, 12, 15, 18]
    }
  }
};

// Helper function to get current intervals
export const getCurrentIntervals = (mode: 'original' | 'testing' = 'testing') => {
  return mode === 'testing' 
    ? TESTING_CONFIG.intervals.testing 
    : TESTING_CONFIG.intervals.original;
};

// Helper function to get current timeout
export const getCurrentTimeout = (mode: 'original' | 'testing' = 'testing') => {
  return mode === 'testing' 
    ? TESTING_CONFIG.timeout.testing 
    : TESTING_CONFIG.timeout.original;
};

// Helper function to get current cycle timeout
export const getCurrentCycleTimeout = (mode: 'original' | 'testing' = 'testing') => {
  return mode === 'testing' 
    ? TESTING_CONFIG.cycleTimeout.testing 
    : TESTING_CONFIG.cycleTimeout.original;
};