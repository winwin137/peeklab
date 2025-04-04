
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
  storageBucket: "newpeekwind.firebasestorage.app",
  messagingSenderId: "403242235671",
  appId: "1:403242235671:web:f204cbb8ab9c605dd12952",
  measurementId: "G-NLP2TN948M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;
