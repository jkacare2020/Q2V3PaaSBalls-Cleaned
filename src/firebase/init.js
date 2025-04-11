import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database"; // ✅ Add this realtime DB

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  // databaseURL: `https://${
  //   import.meta.env.VITE_FIREBASE_PROJECT_ID
  // }.firebaseio.com`, // ✅ Realtime DB URL
  databaseURL: "https://q2v3paasapp-default-rtdb.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication instance
const auth = getAuth(app);
// Initialize Firestore service
const db = getFirestore(app);
// Initialize Firebase Storage service
const storage = getStorage(app);
const dbRealtime = getDatabase(app); // ✅ Add this

// Export the Firebase Authentication and Firestore instances
export { app, auth, db, storage, dbRealtime }; // ✅ Ensure it's exported
