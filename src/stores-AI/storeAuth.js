import { defineStore } from "pinia";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import { db } from "../firebase/init"; // Adjust the import path as necessary
import { doc, setDoc } from "firebase/firestore";
import { LocalStorage } from "quasar";

export const useStoreAuth = defineStore("storeAuth", {
  state: () => ({
    user: null,
    ready: false, // Track if auth initialization is complete
  }),
  getters: {
    isAuthenticated: (state) => {
      console.log("Checking isAuthenticated. User state:", state.user);
      return state.user !== null; // It should return `true` if a user exists
    },
  },

  actions: {
    async init() {
      console.log("Initializing auth...");
      const auth = getAuth();

      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          this.user = user || null;
          this.ready = true; // Mark auth initialization as complete
          console.log("Auth initialized. User:", this.user);
          resolve();
        });
      });
    },

    // Logout User Action
    async logoutUser() {
      const auth = getAuth();
      try {
        await auth.signOut(); // Sign out the user
        this.user = null; // Clear user state
        LocalStorage.remove("user"); // Remove user data from LocalStorage
        console.log("User logged out successfully");
      } catch (error) {
        throw new Error("Failed to log out: " + error.message);
      }
    },

    // Signup User Action
    async registerUser(credentials, additionalUserInfo) {
      const auth = getAuth();
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
        const user = userCredential.user;

        // Update the Firebase user profile with a display name
        await updateProfile(user, {
          displayName: additionalUserInfo.displayName,
        });

        // Create a reference for the Firestore document
        const userRef = doc(db, "users", user.uid);
        const registrationDate = new Date();
        const trialPeriodDays = 10;
        const trialEndDate = new Date(
          registrationDate.getTime() + trialPeriodDays * 24 * 60 * 60 * 1000
        );

        // Add email and other details to Firestore
        await setDoc(userRef, {
          email: credentials.email,
          ...additionalUserInfo,
          role: "user",
          registrationDate: registrationDate,
          trialEndDate: trialEndDate,
        });

        return true; // Indicate successful registration
      } catch (error) {
        console.error("Registration error:", error.message);
        throw error; // Rethrow the error to be handled in the component
      }
    },
  },
});
