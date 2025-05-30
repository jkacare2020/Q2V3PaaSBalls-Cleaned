// This store only handles users from Firestore `users` collection.

import { defineStore } from "pinia";
import { db } from "../firebase/init";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { LocalStorage } from "quasar";
import { useStoreAuth } from "src/stores/storeAuth"; // Import the storeAuth for user ID

export const useStoreUsers = defineStore("storeUsers", {
  state: () => ({
    user: LocalStorage.getItem("user") || null, // Initialize with saved user or null
    usersList: [], // Holds list of users for admin
    userLoaded: !!LocalStorage.getItem("user"), // Check if user exists in LocalStorage
  }),
  actions: {
    async init() {
      const storeAuth = useStoreAuth();
      if (!storeAuth.user?.uid) {
        console.error("No logged-in user found");
        return;
      }

      const userDocRef = doc(db, "users", storeAuth.user.uid);

      // Always re-fetch fresh user data
      await this.getUser(userDocRef);
    },

    async beforeEnter(to, from, next) {
      const storeUsers = useStoreUsers();

      if (!storeUsers.userLoaded) {
        await storeUsers.init();
      }

      console.log("🧠 storeUsers.user =", storeUsers.user);
      console.log("🔍 Detected role:", storeUsers.user?.role);

      const roleField = storeUsers.user?.role;
      const roles = Array.isArray(roleField) ? roleField : [roleField];

      if (roles.includes("admin")) {
        next(); // ✅ Proceed if admin
      } else {
        console.warn("❌ Not admin. Redirecting...");
        next("/profile/edit");
      }
    },

    async getUser(userDocRef) {
      this.userLoaded = false;

      try {
        console.log("Fetching user data from Firestore for:", userDocRef.id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          const pendingMerchantInvite = userData.pendingMerchantInvite || null;

          this.user = {
            id: userDocSnapshot.id,
            ...userData,
            pendingInvite: pendingMerchantInvite
              ? { merchantId: pendingMerchantInvite }
              : null,
          };

          console.log("Fetched user data:", this.user);

          // Save the user data in LocalStorage for persistence
          LocalStorage.set("user", this.user);
        } else {
          console.error(
            "No user found with the given reference:",
            userDocRef.id
          );
          this.user = null;
          LocalStorage.remove("user");
        }
      } catch (error) {
        console.error("Error getting user:", error);
        this.user = null;
        LocalStorage.remove("user");
      } finally {
        this.userLoaded = true; // Mark user data as loaded
      }
    },

    async getAllUsers() {
      const roleField = this.user?.role;
      const roles = Array.isArray(roleField) ? roleField : [roleField];
      if (roles.includes("admin")) {
        try {
          console.log("Fetching all users from Firestore...");
          const usersSnapshot = await getDocs(collection(db, "users"));
          this.usersList = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("Fetched users:", this.usersList);
        } catch (error) {
          console.error("Error fetching all users:", error);
        }
      } else {
        console.warn(
          "Attempted to fetch users, but the current user is not an admin."
        );
      }
    },

    clearUsers() {
      this.user = null;
      this.userLoaded = false;
      LocalStorage.remove("user"); // Clear LocalStorage on logout
      console.log("Cleared user data from storeUsers and LocalStorage.");
    },
  },
});
