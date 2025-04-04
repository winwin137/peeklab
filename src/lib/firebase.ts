
import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
export const db = getFirestore(app);
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
export { analytics };

export default app;
