const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createMockMealCycle() {
  try {
    // Get test user
    const user = await auth.getUserByEmail('test@peekdiet.com');
    console.log('Found test user:', user.uid);

    // Calculate timestamps for yesterday
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Set meal start time to yesterday at 12:00 PM
    const startTime = new Date(yesterday);
    startTime.setHours(12, 0, 0, 0);

    // Generate mock glucose readings
    const preprandialReading = {
      id: 'pre_' + startTime.getTime(),
      value: 95, // mg/dL
      timestamp: startTime.getTime() - (30 * 60 * 1000), // 30 minutes before meal
      type: 'preprandial',
      notes: 'Before lunch'
    };

    // Generate postprandial readings at 20, 40, 60, 90, 120, and 180 minutes
    const postprandialReadings = {
      20: {
        id: 'post_20_' + startTime.getTime(),
        value: 145,
        timestamp: startTime.getTime() + (20 * 60 * 1000),
        type: 'postprandial',
        minutesMark: 20,
        notes: '20 minutes after meal'
      },
      40: {
        id: 'post_40_' + startTime.getTime(),
        value: 160,
        timestamp: startTime.getTime() + (40 * 60 * 1000),
        type: 'postprandial',
        minutesMark: 40,
        notes: '40 minutes after meal'
      },
      60: {
        id: 'post_60_' + startTime.getTime(),
        value: 155,
        timestamp: startTime.getTime() + (60 * 60 * 1000),
        type: 'postprandial',
        minutesMark: 60,
        notes: '60 minutes after meal'
      },
      90: {
        id: 'post_90_' + startTime.getTime(),
        value: 140,
        timestamp: startTime.getTime() + (90 * 60 * 1000),
        type: 'postprandial',
        minutesMark: 90,
        notes: '90 minutes after meal'
      },
      120: {
        id: 'post_120_' + startTime.getTime(),
        value: 130,
        timestamp: startTime.getTime() + (120 * 60 * 1000),
        type: 'postprandial',
        minutesMark: 120,
        notes: '120 minutes after meal'
      },
      180: {
        id: 'post_180_' + startTime.getTime(),
        value: 110,
        timestamp: startTime.getTime() + (180 * 60 * 1000),
        type: 'postprandial',
        minutesMark: 180,
        notes: '180 minutes after meal'
      }
    };

    // Create meal cycle document
    const mealCycle = {
      userId: user.uid,
      uniqueId: 'mock_' + startTime.getTime(),
      startTime: startTime.getTime(),
      preprandialReading,
      postprandialReadings,
      status: 'completed',
      createdAt: startTime.getTime() - (30 * 60 * 1000), // 30 minutes before meal
      updatedAt: startTime.getTime() + (180 * 60 * 1000), // After last reading
      notes: 'Mock meal cycle for testing'
    };

    // Add to Firestore
    const docRef = await db.collection('mealCycles').add(mealCycle);
    console.log('Created mock meal cycle with ID:', docRef.id);
    console.log('Meal cycle data:', JSON.stringify(mealCycle, null, 2));

  } catch (error) {
    console.error('Error creating mock meal cycle:', error);
  } finally {
    process.exit();
  }
}

createMockMealCycle(); 