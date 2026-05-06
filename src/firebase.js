// 🔥 Firebase Imports
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔑 Tumhara Firebase Config (YAHAN APNA DALNA HAI)
const firebaseConfig = {
  apiKey: "AIzaSyAwPxh4LWHkmoV9DNpUm6HvF4Wa8xe0LoA",
  authDomain: "executive-bank-dashboard.firebaseapp.com",
  databaseURL: "https://executive-bank-dashboard-default-rtdb.firebaseio.com",
  projectId: "executive-bank-dashboard",
  storageBucket: "executive-bank-dashboard.firebasestorage.app",
  messagingSenderId: "542594445081",
  appId: "1:542594445081:web:f5bc7a12c26603045f9f88"
};

// 🚀 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔐 Auth
export const auth = getAuth(app);

// 🔥 Firestore DB
export const db = getFirestore(app);