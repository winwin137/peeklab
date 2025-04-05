/**
 * Testing Configuration
 * 
 * This file contains configurable values for testing purposes.
 * These values can be modified without affecting core logic.
 * 
 * ⚠️ DO NOT MODIFY IN PRODUCTION ⚠️
 */

export const TESTING_CONFIG = {
  // Set to true to enable testing mode
  isTesting: process.env.NODE_ENV === 'development',
  
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
    testing: 40
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
      readings: [20, 40, 60, 90, 120, 180]
    }
  }
};

// Helper function to get current intervals
export const getCurrentIntervals = () => {
  return TESTING_CONFIG.isTesting 
    ? TESTING_CONFIG.intervals.testing 
    : TESTING_CONFIG.intervals.original;
};

// Helper function to get current timeout
export const getCurrentTimeout = () => {
  return TESTING_CONFIG.isTesting 
    ? TESTING_CONFIG.timeout.testing 
    : TESTING_CONFIG.timeout.original;
};

// Helper function to get current cycle timeout
export const getCurrentCycleTimeout = () => {
  return TESTING_CONFIG.cycleTimeout.original;
}; 