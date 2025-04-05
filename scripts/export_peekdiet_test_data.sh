#!/bin/bash

# Firebase Test User Data Export Script
# This script exports data for the test@peekdiet.com user from Firebase

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PeekDiet Test User Data Export Tool${NC}"
echo "This script exports data for test@peekdiet.com from Firebase"
echo "------------------------------------------------------------"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI is not installed.${NC}"
    echo "Please install it first using: npm install -g firebase-tools"
    exit 1
fi

# Check if logged into Firebase
echo "Checking Firebase login status..."
FIREBASE_LOGIN_STATUS=$(firebase login:list 2>&1)
if [[ $FIREBASE_LOGIN_STATUS == *"No users"* ]]; then
    echo -e "${RED}You are not logged into Firebase. Please login first.${NC}"
    firebase login
fi

# Prompt for project selection
echo -e "${YELLOW}Select your Firebase project:${NC}"
firebase projects:list
echo -n "Enter the project ID: "
read PROJECT_ID

# Set the project
echo "Setting project to $PROJECT_ID..."
firebase use $PROJECT_ID

# Create output directory
OUTPUT_DIR="peekdiet_test_data_$(date +%Y%m%d_%H%M%S)"
mkdir -p $OUTPUT_DIR
echo "Created output directory: $OUTPUT_DIR"

# Get test user's UID from email
echo "Fetching UID for test@peekdiet.com..."
# Note: This requires proper admin SDK setup, which is beyond a simple bash script
# You would typically need to use the Firebase Admin SDK in a Node.js script for this
echo -e "${YELLOW}Manual step required:${NC} Please enter the UID for test@peekdiet.com"
echo "You can find this in the Firebase Console > Authentication > Users"
echo -n "Enter the user UID: "
read USER_UID

if [ -z "$USER_UID" ]; then
    echo -e "${RED}No UID provided. Exiting.${NC}"
    exit 1
fi

echo "UID: $USER_UID"

# Export Firestore data for this user
echo "Exporting Firestore data for user $USER_UID..."
echo "This will use the Firebase Console's Firestore Data Export feature"
echo "or the Firestore API to query data for this specific user ID."

# Create a Node.js script for data export
cat > $OUTPUT_DIR/export_data.js << EOF
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// You need to download your service account key from
// Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function exportData() {
  try {
    // Get user details
    const userRecord = await auth.getUser('$USER_UID');
    fs.writeFileSync(
      path.join(__dirname, 'user_profile.json'), 
      JSON.stringify(userRecord.toJSON(), null, 2)
    );
    console.log('User profile exported');
    
    // Get meal cycles
    const mealCyclesSnapshot = await db.collection('mealCycles')
      .where('userId', '==', '$USER_UID')
      .get();
    
    const mealCycles = [];
    mealCyclesSnapshot.forEach(doc => {
      mealCycles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    fs.writeFileSync(
      path.join(__dirname, 'meal_cycles.json'), 
      JSON.stringify(mealCycles, null, 2)
    );
    console.log('Meal cycles exported: ' + mealCycles.length + ' records');
    
    // Get any other collections where userId matches
    // Add more collection queries as needed
    
    console.log('Export complete');
  } catch (error) {
    console.error('Export error:', error);
  } finally {
    process.exit();
  }
}

exportData();
EOF

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Download your Firebase Admin SDK service account key from:"
echo "   Firebase Console > Project Settings > Service Accounts"
echo "2. Save the key as 'serviceAccountKey.json' in the $OUTPUT_DIR directory"
echo "3. Install the firebase-admin package: npm install firebase-admin"
echo "4. Run the export script: node $OUTPUT_DIR/export_data.js"

echo -e "${GREEN}Setup complete!${NC}"
echo "Once you complete the steps above, your data will be exported to:"
echo "- $OUTPUT_DIR/user_profile.json (user details)"
echo "- $OUTPUT_DIR/meal_cycles.json (meal cycle data)"

echo -e "${YELLOW}Note:${NC} This script provides a framework for exporting the data."
echo "Due to Firebase's security model, a full automated export requires"
echo "Firebase Admin SDK with proper authentication via a service account key." 