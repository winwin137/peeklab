#!/bin/bash

# Non-interactive script to export test@peekdiet.com data from Firebase
# Uses service account key to access authentication and Firestore data

# Configuration
PROJECT_ID="newpeekwind"
TEST_EMAIL="test@peekdiet.com"
OUTPUT_DIR="peekdiet_test_data_$(date +%Y%m%d_%H%M%S)"
GCLOUD_PATH="/Users/winstonjordan/peekdiet-glucose-flow/y/google-cloud-sdk/bin/gcloud"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PeekDiet Test User Data Export Tool${NC}"
echo "Exporting data for test@peekdiet.com from Firebase"
echo "------------------------------------------------------------"

# Check if gcloud exists
if [ ! -f "$GCLOUD_PATH" ]; then
  echo -e "${RED}Error: gcloud not found at $GCLOUD_PATH${NC}"
  exit 1
fi

# Create output directory
mkdir -p $OUTPUT_DIR
echo "Created output directory: $OUTPUT_DIR"

# Create a Node.js script for data export
cat > $OUTPUT_DIR/export_data.js << 'EOF'
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Get arguments
const projectId = process.argv[2];
const testEmail = process.argv[3];
const outputDir = process.argv[4];

// Initialize Firebase Admin SDK with application default credentials
admin.initializeApp({
  projectId: projectId,
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();
const auth = admin.auth();

async function exportData() {
  try {
    console.log(`Searching for user with email: ${testEmail}`);
    
    // Get user by email
    const userList = await auth.listUsers(1000);
    let testUser = null;
    
    for (const user of userList.users) {
      if (user.email === testEmail) {
        testUser = user;
        break;
      }
    }
    
    if (!testUser) {
      console.error(`User with email ${testEmail} not found!`);
      process.exit(1);
    }
    
    const userId = testUser.uid;
    console.log(`Found user with ID: ${userId}`);
    
    // Save user profile data
    fs.writeFileSync(
      path.join(outputDir, 'user_profile.json'), 
      JSON.stringify(testUser.toJSON(), null, 2)
    );
    console.log('User profile exported');
    
    // Get meal cycles
    const mealCyclesSnapshot = await db.collection('mealCycles')
      .where('userId', '==', userId)
      .get();
    
    const mealCycles = [];
    mealCyclesSnapshot.forEach(doc => {
      mealCycles.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    fs.writeFileSync(
      path.join(outputDir, 'meal_cycles.json'), 
      JSON.stringify(mealCycles, null, 2)
    );
    console.log(`Meal cycles exported: ${mealCycles.length} records`);
    
    // Get any user documents directly from the users collection if it exists
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        fs.writeFileSync(
          path.join(outputDir, 'user_document.json'), 
          JSON.stringify({id: userDoc.id, ...userDoc.data()}, null, 2)
        );
        console.log('User document exported');
      } else {
        console.log('No dedicated user document found in users collection');
      }
    } catch (err) {
      console.log('No users collection or error accessing it:', err.message);
    }
    
    // Attempt to find any other collections where this user ID might appear
    const collections = await db.listCollections();
    
    for (const collection of collections) {
      const collName = collection.id;
      
      // Skip the ones we've already handled
      if (collName === 'mealCycles' || collName === 'users') continue;
      
      try {
        const userDocsSnapshot = await db.collection(collName)
          .where('userId', '==', userId)
          .get();
        
        if (!userDocsSnapshot.empty) {
          const docs = [];
          userDocsSnapshot.forEach(doc => {
            docs.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          fs.writeFileSync(
            path.join(outputDir, `${collName}.json`), 
            JSON.stringify(docs, null, 2)
          );
          console.log(`${collName} collection exported: ${docs.length} records`);
        }
      } catch (err) {
        console.log(`Skipping collection ${collName}, no userId field or error:`, err.message);
      }
    }
    
    console.log('Export complete');
  } catch (error) {
    console.error('Export error:', error);
  } finally {
    process.exit();
  }
}

exportData();
EOF

# Install necessary dependencies if they don't exist
if [ ! -d "$OUTPUT_DIR/node_modules" ]; then
  cd $OUTPUT_DIR
  echo "Installing dependencies..."
  npm init -y > /dev/null
  npm install firebase-admin > /dev/null
  cd ..
fi

# Authenticate with gcloud and set up application default credentials
echo "Authenticating with Google Cloud..."
"$GCLOUD_PATH" auth application-default login

# Set the project
echo "Setting project to $PROJECT_ID..."
"$GCLOUD_PATH" config set project $PROJECT_ID

# Run the export script
echo "Running data export..."
node $OUTPUT_DIR/export_data.js $PROJECT_ID $TEST_EMAIL $OUTPUT_DIR

# Check if export was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Export completed successfully!${NC}"
  echo "Data has been exported to:"
  echo "- $OUTPUT_DIR/user_profile.json (user details)"
  echo "- $OUTPUT_DIR/meal_cycles.json (meal cycle data)"
  echo "- $OUTPUT_DIR/ (any other collections found)"
else
  echo -e "${RED}Export failed. Please check the error messages above.${NC}"
fi

# Create a summary file
echo "Creating export summary..."
echo "PeekDiet Test User Data Export Summary" > $OUTPUT_DIR/summary.txt
echo "Date: $(date)" >> $OUTPUT_DIR/summary.txt
echo "Project: $PROJECT_ID" >> $OUTPUT_DIR/summary.txt
echo "Test Email: $TEST_EMAIL" >> $OUTPUT_DIR/summary.txt
echo "Files Exported:" >> $OUTPUT_DIR/summary.txt
find $OUTPUT_DIR -name "*.json" | sort | while read file; do
  filesize=$(du -h "$file" | cut -f1)
  filename=$(basename "$file")
  echo "- $filename ($filesize)" >> $OUTPUT_DIR/summary.txt
done

echo -e "${GREEN}Export process completed. Check the $OUTPUT_DIR directory for the exported data.${NC}" 