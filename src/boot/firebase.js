// src/boot/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDXImtDLTo5sZz_N8tIVyDQiCB-gV3WHuE",
  authDomain: "q2v3paasapp.firebaseapp.com",
  databaseURL: "https://q2v3paasapp-default-rtdb.firebaseio.com",
  projectId: "q2v3paasapp",
  storageBucket: "q2v3paasapp.firebasestorage.app",
  messagingSenderId: "360690875355",
  appId: "1:360690875355:web:dae8060e410338a820c5fe",
  measurementId: "G-HTP3ENLX48",
};

// ✅ Only initialize Firebase once
const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Only run analytics in browser
if (typeof window !== "undefined") {
  getAnalytics(firebaseApp);
}
