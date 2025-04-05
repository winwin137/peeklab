#!/bin/bash

# Configuration
USER_EMAIL="test@peekdiet.com"
OUTPUT_DIR="user_data_dumps"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="${OUTPUT_DIR}/user_data_${TIMESTAMP}.json"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if Firebase CLI is logged in
if ! firebase projects:list > /dev/null 2>&1; then
    echo "Error: Firebase CLI not authenticated. Please run 'firebase login' first."
    exit 1
fi

# Get current project ID
PROJECT_ID=$(firebase projects:list | grep '(current)' | awk '{print $1}')
if [ -z "$PROJECT_ID" ]; then
    echo "Error: No Firebase project selected. Please run 'firebase use <project-id>' first."
    exit 1
fi

echo "Using Firebase project: $PROJECT_ID"

# Get user ID from email using Firebase Admin SDK
echo "Getting user ID for $USER_EMAIL..."
# First, try to get the user directly
USER_ID=$(firebase auth:export --project $PROJECT_ID --format=json 2>/dev/null | jq -r --arg email "$USER_EMAIL" '.users[] | select(.email == $email) | .uid')

if [ -z "$USER_ID" ]; then
    echo "Warning: Could not find user directly. Trying alternative method..."
    # Try using the Firebase Admin SDK through a temporary Node.js script
    cat > temp_get_user.js << 'EOL'
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
admin.auth().getUserByEmail(process.argv[1])
  .then(user => {
    console.log(user.uid);
    process.exit(0);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
EOL

    USER_ID=$(node temp_get_user.js "$USER_EMAIL" 2>/dev/null)
    rm temp_get_user.js

    if [ -z "$USER_ID" ]; then
        echo "Error: User not found"
        exit 1
    fi
fi

echo "Found user ID: $USER_ID"

# Export meal cycles for the specific user
echo "Exporting meal cycles..."
firebase firestore:export --project $PROJECT_ID --collection-paths="mealCycles" --format=json > temp_export.json

# Process the data
echo "Processing data..."
jq --arg uid "$USER_ID" '
  .mealCycles | to_entries | map(
    select(.value.userId == $uid) | 
    {
      id: .key,
      uniqueId: .value.uniqueId,
      status: .value.status,
      startTime: .value.startTime,
      createdAt: .value.createdAt,
      updatedAt: .value.updatedAt,
      preprandialReading: .value.preprandialReading,
      postprandialReadings: .value.postprandialReadings,
      archived: .value.archived
    }
  ) | sort_by(.createdAt) | reverse' temp_export.json > "$OUTPUT_FILE"

# Clean up temporary file
rm temp_export.json

# Print summary
echo "Data exported to $OUTPUT_FILE"
echo "Total records: $(jq '. | length' "$OUTPUT_FILE")"

echo -e "\nSummary of exported data:"
jq -r '.[] | 
  "\(.uniqueId) | \(.status) | \(.createdAt | strftime("%Y-%m-%d %H:%M")) | Readings: \(.preprandialReading != null) + (.postprandialReadings | length)"' \
  "$OUTPUT_FILE" 