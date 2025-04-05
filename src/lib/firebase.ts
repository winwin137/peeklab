import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

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

let app;
let db;
let auth;
let storage;
let analytics = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firestore
  db = getFirestore(app);

  // Initialize Auth
  auth = getAuth(app);

  // Initialize other services
  storage = getStorage(app);
  
  // Initialize analytics only if supported
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(console.error);
} catch (error) {
  console.error('Error initializing Firebase:', error);
  // Don't throw the error, just log it and continue
  console.error('Firebase initialization error:', error);
}

// Auth providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Configure auth providers
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Set custom parameters for providers to ensure popups work correctly
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

githubProvider.setCustomParameters({
  prompt: 'consent'
});

export { 
  app, 
  db, 
  auth, 
  storage, 
  analytics, 
  googleProvider, 
  githubProvider 
};
