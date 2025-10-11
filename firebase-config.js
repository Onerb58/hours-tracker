// Firebase Configuration
// Replace these values with your actual Firebase project credentials

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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

// Initialize Auth (for Google Sign-In)
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Current user state
let currentUser = null;

// Sign in with Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    currentUser = result.user;
    console.log('Signed in with Google:', currentUser.email);
    return currentUser;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
const signOutUser = async () => {
  try {
    await signOut(auth);
    currentUser = null;
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Listen for auth state changes
const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    callback(user);
  });
};

// Get current user ID (use this for Firestore paths)
const getUserId = () => {
  return currentUser ? currentUser.uid : null;
};

// Get current user info
const getCurrentUser = () => {
  return currentUser;
};

export {
  db,
  auth,
  signInWithGoogle,
  signOutUser,
  onAuthStateChange,
  getUserId,
  getCurrentUser
};
