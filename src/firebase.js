// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBXo8aHR1FdhUeJDiH-eIseAue5SAgcTfI",
  authDomain: "newpeekwind.firebaseapp.com",
  projectId: "newpeekwind",
  storageBucket: "newpeekwind.firebasestorage.app",
  messagingSenderId: "403242235671",
  appId: "1:403242235671:web:f204cbb8ab9c605dd12952",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };

