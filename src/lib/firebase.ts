
import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXo8aHR1FdhUeJDiH-eIseAue5SAgcTfI",
  authDomain: "newpeekwind.firebaseapp.com",
  projectId: "newpeekwind",
  storageBucket: "newpeekwind.appspot.com",
  messagingSenderId: "403242235671",
  appId: "1:403242235671:web:f204cbb8ab9c605dd12952",
  measurementId: "G-NLP2TN948M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for offline use
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Persistence could not be enabled: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the features required for persistence
      console.warn('Persistence not supported by this browser');
    } else {
      console.error('Error enabling persistence:', err);
    }
  });
} catch (error) {
  console.warn('Error with persistence setup:', error);
}

// Get Firebase services
export const auth = getAuth(app);

// Configure auth providers
export const githubProvider = new GithubAuthProvider();
export const googleProvider = new GoogleAuthProvider();

// Add scopes for Google provider
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Set custom parameters for providers to ensure popups work correctly
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

githubProvider.setCustomParameters({
  prompt: 'consent'
});

// Export other Firebase services
export const storage = getStorage(app);

// Initialize analytics only in browser environment
let analytics = null;
try {
  // Check if we're in a browser environment where analytics is supported
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn("Analytics failed to initialize:", error);
}

export { analytics, db };
export default app;
