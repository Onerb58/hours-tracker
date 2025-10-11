// Firebase Configuration
// Replace these values with your actual Firebase project credentials

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > General > Your apps > Web app
const firebaseConfig = {
  apiKey: "AIzaSyCsnoIlJx5gnlIkbSHWp2vLOJ2tv2LR6Z8",
  authDomain: "work-hours-tracker-b5d0f.firebaseapp.com",
  projectId: "work-hours-tracker-b5d0f",
  storageBucket: "work-hours-tracker-b5d0f.firebasestorage.app",
  messagingSenderId: "122609352189",
  appId: "1:122609352189:web:9ad0479871cec52857ed94"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth (for anonymous authentication)
const auth = getAuth(app);

// Sign in anonymously when the app loads
let currentUser = null;

const initAuth = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    currentUser = userCredential.user;
    console.log('Signed in anonymously with UID:', currentUser.uid);
    return currentUser;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
};

// Get current user ID (use this for Firestore paths)
const getUserId = () => {
  return currentUser ? currentUser.uid : 'default-user';
};

export { db, auth, initAuth, getUserId };
