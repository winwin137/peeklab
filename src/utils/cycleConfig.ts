type IntervalConfig = {
  firstBite: number;
  readings: number[];
};

type TimeoutConfig = {
  original: number;
  testing: number;
};

const INTERVALS: Record<string, IntervalConfig> = {
  original: {
    firstBite: 0,
    readings: [20, 40, 60, 90, 120, 180]
  },
  testing: {
    firstBite: 0,
    readings: [5, 10, 15, 20, 25, 30]
  }
};

const TIMEOUTS: TimeoutConfig = {
  original: 7,
  testing: 2
};

const CYCLE_TIMEOUTS: TimeoutConfig = {
  original: 190,
  testing: 40
};

export function getCurrentIntervals(mode: 'original' | 'testing' = 'testing'): IntervalConfig {
  return INTERVALS[mode];
}

export function getCurrentTimeout(mode: 'original' | 'testing' = 'testing'): number {
  return TIMEOUTS[mode];
}

export function getCurrentCycleTimeout(mode: 'original' | 'testing' = 'testing'): number {
  return CYCLE_TIMEOUTS[mode];
}

export function isEarly(nowMillis: number, expectedTime: number, mode: 'original' | 'testing' = 'testing'): boolean {
  const earlyTimeoutMinutes = TIMEOUTS[mode];
  return nowMillis < (expectedTime - (earlyTimeoutMinutes * 60 * 1000));
}

export function isLate(nowMillis: number, expectedTime: number, mode: 'original' | 'testing' = 'testing'): boolean {
  const lateTimeoutMinutes = TIMEOUTS[mode];
  return nowMillis > (expectedTime + (lateTimeoutMinutes * 60 * 1000));
}
