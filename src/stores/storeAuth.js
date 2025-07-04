//----storeAuth.js--------------------
import { defineStore } from "pinia";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/init";

//-----------------------------Add user Profile Data retrieve -------------------------------
export const useStoreUsers = defineStore("storeUsers", {
  state: () => ({
    profile: null,
    avatarUrl: null,
  }),
  actions: {
    async fetchUserProfile(uid) {
      let tries = 0;
      while (tries < 3) {
        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            this.profile = userDoc.data();
            console.log("✅ Profile loaded:", this.profile);
            return;
          }
        } catch (error) {
          console.error("❌ Error loading user profile:", error);
          break;
        }
        tries++;
        await new Promise((r) => setTimeout(r, 300));
      }
      console.warn("⚠️ No user profile found in Firestore after retry.");
    },

    async getUser(userDocRef) {
      this.userLoaded = false;

      let tries = 0;
      while (tries < 3) {
        try {
          console.log("Fetching user data from Firestore for:", userDocRef.id);
          const userDocSnapshot = await getDoc(userDocRef);
          if (userDocSnapshot.exists()) {
            this.user = {
              id: userDocSnapshot.id,
              ...userDocSnapshot.data(),
            };
            console.log("Fetched user data:", this.user);
            return;
          }
        } catch (error) {
          console.error("Error getting user:", error);
          break;
        }
        tries++;
        await new Promise((r) => setTimeout(r, 300));
      }
      console.warn("No user found with the given reference:", userDocRef.id);
      this.user = null;
    },

    async fetchAvatar(uid) {
      try {
        const snapshot = await getDoc(doc(db, "users", uid, "avatar", "meta"));
        if (snapshot.exists()) {
          this.avatarUrl = snapshot.data().imageUrl;
          console.log("✅ Avatar URL loaded:", this.avatarUrl);
        } else {
          this.avatarUrl = null;
          if (!this.profile) {
            console.warn("⚠️ No avatar found.");
          }
        }
      } catch (error) {
        console.error("❌ Error loading avatar:", error);
      }
    },
  },
});
//-----------------------------------------------------------

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
    //----------------------------------------------------
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
        this.ready = false;
        console.log("User logged out successfully.");
      } catch (error) {
        console.error("Logout failed:", error.message);
        throw new Error("Failed to log out.");
      }
    },

    //--------------------------------------------------------------
    async registerUser(credentials, additionalUserInfo) {
      try {
        const randomId = Math.floor(10000 + Math.random() * 90000);
        const userName = `${credentials.firstName.toLowerCase()}${randomId}`;

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
          userName,
          role: additionalUserInfo.role || "user",
          registrationDate: new Date(),
          trialLimit: 5, // ✅ instead of trialTimes
          trialUsed: 0, // ✅ always initialize
        });

        // Optional: wait for consistency
        await new Promise((resolve) => setTimeout(resolve, 200));

        this.user = user; // Ensure user state is updated

        // ✅ Load user profile into storeUsers
        const storeUsers = useStoreUsers();
        await storeUsers.init();

        console.log("Registration successful:", user);
        return true;
      } catch (error) {
        console.error("Registration failed:", error.message);
        throw error;
      }
    },
  },
});
