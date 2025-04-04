
export type GlucoseReading = {
  id: string;
  value: number; // Blood glucose value
  timestamp: number; // Timestamp when the reading was taken
  type: 'preprandial' | 'postprandial'; // Before meal or after meal
  minutesMark?: number; // For postprandial readings (20, 40, 60, 90, 120, 180)
  notes?: string;
};

export type MealCycle = {
  id: string;
  userId: string;
  uniqueId: string; // Unique identifier for meal cycles
  startTime: number; // Timestamp when the cycle started (First Bite)
  preprandialReading?: GlucoseReading;
  postprandialReadings: Record<number, GlucoseReading>; // Key is minutes (20, 40, etc.)
  status: 'active' | 'completed' | 'abandoned';
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type Notification = {
  id: string;
  mealCycleId: string;
  minutesMark: number; // 20, 40, 60, 90, 120, 180
  scheduledTime: number; // When the notification should appear
  status: 'scheduled' | 'sent' | 'responded' | 'missed';
};

export type User = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  settings?: UserSettings;
};

export type UserSettings = {
  glucoseUnit: 'mg/dL' | 'mmol/L';
  notificationsEnabled: boolean;
  reminderSound: string;
  targetRanges: {
    preprandial: [number, number]; // Min and max acceptable values
    postprandial: [number, number]; // Min and max acceptable values
  };
};
