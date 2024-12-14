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
import { db, auth } from "../firebase/init";
import { doc, setDoc } from "firebase/firestore";
import { LocalStorage } from "quasar";

export const useStoreAuth = defineStore("storeAuth", {
  state: () => ({
    user: null,
    ready: false,
  }),
  getters: {
    isAuthenticated: (state) => state.ready && state.user !== null,
  },
  actions: {
    async init() {
      console.log("Initializing auth...");
      const auth = getAuth();

      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this.user = user;
            console.log("User is logged in:", this.user);
          } else {
            console.log("No user is logged in.");
            this.user = null;
          }
          this.ready = true;
          resolve();
        });
      });
    },
    async loginUser({ email, password }) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        this.user = userCredential.user;
        console.log("Login successful:", this.user);
      } catch (error) {
        console.error("Login failed:", error.message);
        throw new Error("Failed to login.");
      }
    },
    async logoutUser() {
      try {
        await auth.signOut();
        this.user = null;
        this.ready = false; // Optional: Mark ready as false during logout
        console.log("User logged out successfully.");
      } catch (error) {
        console.error("Logout failed:", error.message);
        throw new Error("Failed to log out.");
      }
    },
    async registerUser(credentials, additionalUserInfo) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
        const user = userCredential.user;
        await updateProfile(user, {
          displayName: additionalUserInfo.displayName,
        });
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          email: credentials.email,
          ...additionalUserInfo,
          role: "user",
          registrationDate: new Date(),
        });
        console.log("Registration successful:", user);
        return true;
      } catch (error) {
        console.error("Registration failed:", error.message);
        throw error;
      }
    },
  },
});
