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
      // Avoid re-fetching if user is already loaded
      if (this.userLoaded) return;

      const storeAuth = useStoreAuth();
      if (!storeAuth.user?.uid) {
        console.error("No logged-in user found");
        return;
      }

      const userDocRef = doc(db, "users", storeAuth.user.uid);
      await this.getUser(userDocRef);
    },
    //--------------------------------------------------------------
    async getUser(userDocRef) {
      this.userLoaded = false;

      try {
        console.log("Fetching user data from Firestore for:", userDocRef.id);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          this.user = {
            id: userDocSnapshot.id,
            ...userDocSnapshot.data(), // Includes the role field
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
        this.userLoaded = true; // Mark user data as loaded Tqtc37XTx9N1Yr1pUzeelmAdUmw1
      }
    },

    async getAllUsers() {
      if (this.user?.role === "admin") {
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

    //--------------------------------------------------------------------
    clearUsers() {
      this.user = null;
      this.userLoaded = false;
      LocalStorage.remove("user"); // Clear LocalStorage on logout
      console.log("Cleared user data from storeUsers and LocalStorage.");
    },
  },
});
