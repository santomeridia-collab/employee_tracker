// src/firebase.js 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD64p9nHnmrZVZQZoYmM1g5tcf1ECnPNUc",
  authDomain: "employee-tracker-8e0bb.firebaseapp.com",
  projectId: "employee-tracker-8e0bb",
  storageBucket: "employee-tracker-8e0bb.firebasestorage.app",
  messagingSenderId: "360932248462",
  appId: "1:360932248462:web:a39ff6e67ec78a7ba532df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const serverTs = serverTimestamp;

export default app;
