// import { defineStore } from "pinia";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "../firebase/init";
// import { useStoreAuth } from "src/stores/storeAuth";

// export const useStoreUsers = defineStore("storeUsers", {
//   state: () => {
//     return {
//       user: null,
//       userLoaded: false,
//     };
//   },
//   actions: {
//     async init() {
//       const storeAuth = useStoreAuth();

//       // Ensure the user is authenticated
//       if (!storeAuth.user) {
//         console.error("No authenticated user found");
//         this.userLoaded = true; // Stop spinner
//         return;
//       }

//       // Use 'uid' for the user document reference
//       const userDocRef = doc(db, "users", storeAuth.user.uid);
//       console.log("Fetching data for UID:", storeAuth.user.uid);
//       this.getUser(userDocRef);
//     },

//     async getUser(userDocRef) {
//       this.userLoaded = false;

//       try {
//         const userDocSnapshot = await getDoc(userDocRef);
//         if (userDocSnapshot.exists()) {
//           this.user = {
//             id: userDocSnapshot.id,
//             email: userDocSnapshot.data().email, // Ensure email is retrieved
//             firstName: userDocSnapshot.data().firstName,
//             lastName: userDocSnapshot.data().lastName,
//             role: userDocSnapshot.data().role,
//             phoneNo: userDocSnapshot.data().phoneNo,
//             companyName: userDocSnapshot.data().companyName,
//             registrationDate: userDocSnapshot.data().registrationDate,
//             trialEndDate: userDocSnapshot.data().trialEndDate,
//           };
//         } else {
//           console.warn("User document not found in Firestore");
//           this.user = null;
//         }
//       } catch (error) {
//         console.error("Error getting user data:", error);
//         this.user = null;
//       } finally {
//         this.userLoaded = true;
//       }
//     },

//     async updateUserProfile(updatedProfile) {
//       try {
//         const userDocRef = doc(db, "users", updatedProfile.id);
//         await setDoc(userDocRef, updatedProfile, { merge: true }); // Merge updates into existing document
//         console.log("User profile updated successfully.");
//       } catch (error) {
//         console.error("Error updating user profile:", error);
//         throw error;
//       }
//     },
//     clearUsers() {
//       this.user = null;
//       this.userLoaded = false;
//     },
//   },
// });
import { defineStore } from "pinia";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/init";
import { useStoreAuth } from "src/stores/storeAuth";
import { LocalStorage } from "quasar"; // Import Quasar LocalStorage

export const useStoreUsers = defineStore("storeUsers", {
  state: () => ({
    user: LocalStorage.getItem("user") || null, // Initialize with saved user or null
    userLoaded: !!LocalStorage.getItem("user"), // Check if user exists in LocalStorage
  }),
  actions: {
    async init() {
      const storeAuth = useStoreAuth();
      const userDocRef = doc(db, "users", storeAuth.user.uid);
      this.getUser(userDocRef);
    },
    async getUser(userDocRef) {
      this.userLoaded = false;

      try {
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          this.user = {
            id: userDocSnapshot.id,
            firstName: userDocSnapshot.data().firstName,
            lastName: userDocSnapshot.data().lastName,
            role: userDocSnapshot.data().role,
            phoneNo: userDocSnapshot.data().phoneNo,
            companyName: userDocSnapshot.data().companyName,
            registrationDate: userDocSnapshot.data().registrationDate,
            trialEndDate: userDocSnapshot.data().trialEndDate,
          };

          // Save the user data in LocalStorage
          LocalStorage.set("user", this.user);
        } else {
          this.user = null;
          LocalStorage.remove("user"); // Clear LocalStorage if user not found
        }
        this.userLoaded = true;
      } catch (error) {
        console.error("Error getting user:", error);
        this.user = null;
        this.userLoaded = true;
        LocalStorage.remove("user"); // Clear LocalStorage on error
      }
    },
    clearUsers() {
      this.user = null;
      this.userLoaded = false;
      LocalStorage.remove("user"); // Clear LocalStorage on logout
    },
  },
});
