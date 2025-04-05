const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found. Please download it from Firebase Console and place it in the root directory.');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
console.log('Using project:', serviceAccount.project_id);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const USER_EMAIL = 'test@peekdiet.com';

async function dumpUserData() {
  try {
    // Create output directory
    const outputDir = path.join(__dirname, 'user_data_dumps');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get user by email
    const user = await admin.auth().getUserByEmail(USER_EMAIL);
    console.log(`Found user: ${user.uid}`);
    console.log('User details:', {
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime
    });

    // Get all collections
    const db = admin.firestore();
    const collections = await db.listCollections();
    const results = {
      user: {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.metadata.creationTime,
        lastSignIn: user.metadata.lastSignInTime
      },
      collections: {}
    };

    // Check each collection for user data
    for (const collection of collections) {
      console.log(`\nChecking collection: ${collection.id}`);
      const snapshot = await collection
        .where('userId', '==', user.uid)
        .get();

      if (!snapshot.empty) {
        console.log(`Found ${snapshot.size} documents in ${collection.id}`);
        results.collections[collection.id] = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          console.log(`Document ${doc.id}:`, {
            id: doc.id,
            createdAt: data.createdAt,
            status: data.status
          });
          
          results.collections[collection.id].push({
            id: doc.id,
            ...data
          });
        });
      } else {
        console.log(`No documents found in ${collection.id}`);
      }
    }

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `user_data_${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

    console.log(`\nData exported to: ${outputFile}`);
    console.log('\nSummary of found data:');
    for (const [collection, docs] of Object.entries(results.collections)) {
      console.log(`${collection}: ${docs.length} documents`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dumpUserData(); 