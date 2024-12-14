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

import { db, auth } from "../firebase/init"; // Adjust the import path as necessary
import { doc, setDoc } from "firebase/firestore";
import { LocalStorage } from "quasar";

export const useStoreAuth = defineStore("storeAuth", {
  state: () => ({
    user: LocalStorage.getItem("user") || null, // Initialize with user data from LocalStorage if available
  }),
  actions: {
    // Initialize Firebase Authentication State Persistence
    async init() {
      const auth = getAuth();

      await setPersistence(auth, browserLocalPersistence);

      // Check the current authentication state
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.user = user;
          LocalStorage.set("user", user); // Persist user data to LocalStorage
          console.log("User is logged in:", user);
        } else {
          this.user = null;
          LocalStorage.remove("user"); // Remove user data from LocalStorage when logged out
          console.log("No user is logged in.");
        }
      });
    },

    // Login User Action
    async loginUser({ email, password }) {
      const auth = getAuth();
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.user = userCredential.user; // Set user state
        LocalStorage.set("user", this.user); // Persist user data to LocalStorage
        console.log("Login successful:", this.user);
      } catch (error) {
        throw new Error("Failed to login: " + error.message);
      }
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

    //-------------------------------Signup-------------------------
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
          // displayName: `${additionalUserInfo.firstName} ${additionalUserInfo.lastName}`,

          displayName: additionalUserInfo.displayName,
        });

        // Create a reference for the Firestore document
        const userRef = doc(db, "users", user.uid);
        const registrationDate = new Date();
        const trialPeriodDays = 10;
        const trialEndDate = new Date(
          registrationDate.getTime() + trialPeriodDays * 24 * 60 * 60 * 1000
        );

        // Add email to the Firestore document
        await setDoc(userRef, {
          email: credentials.email, // Include the email
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
