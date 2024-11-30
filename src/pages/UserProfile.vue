<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md q-mx-auto" style="max-width: 600px">
      <q-card-section>
        <div class="text-h6">Edit User Profile</div>
      </q-card-section>
      <q-card-section v-if="editableUser">
        <q-form @submit.prevent="saveProfile">
          <q-list>
            <q-item>
              <q-item-section side>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="editableUser.firstName"
                  outlined
                  dense
                  label="First Name"
                  required
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="editableUser.lastName"
                  outlined
                  dense
                  label="Last Name"
                  required
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                <q-icon name="email" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="editableUser.email"
                  outlined
                  dense
                  label="Email"
                  disabled
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                <q-icon name="phone" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="editableUser.phoneNo"
                  outlined
                  dense
                  label="Phone Number"
                  @blur="formatPhone"
                  required
                />
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                <q-icon name="business" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="editableUser.companyName"
                  outlined
                  dense
                  label="Company Name"
                  required
                />
              </q-item-section>
            </q-item>
          </q-list>
          <q-btn
            label="Save"
            color="primary"
            class="q-mt-lg full-width"
            type="submit"
          />
        </q-form>
      </q-card-section>
      <!-- Show loading text if data is not yet loaded -->
      <q-card-section v-else>
        <div class="text-center">Loading user data...</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

//
<script setup>
// import { ref, onMounted } from "vue";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { db } from "src/firebase/init";
// import { formatPhoneNumber } from "src/use/formatPhoneNumber";
// import { useStoreAuth } from "src/stores/storeAuth";

// const storeAuth = useStoreAuth();
// const userId = storeAuth.user?.uid; // Declare userId here to make it available globally within the component
// const editableUser = ref(null);
// //------------------------------------Phone Format-------------------------
// const formatPhone = () => {
//   if (editableUser.value && editableUser.value.phoneNo) {
//     editableUser.value.phoneNo = formatPhoneNumber(editableUser.value.phoneNo);
//   }
// };

// // ---------------------------Fetch user data on component mount --------------------------------------
// onMounted(async () => {
//   // const userId = storeAuth.user?.uid; // Get the logged-in user's UID from storeAuth
//   if (userId) {
//     try {
//       const userDoc = await getDoc(doc(db, "users", userId));
//       if (userDoc.exists()) {
//         editableUser.value = userDoc.data(); // Populate editableUser
//       } else {
//         console.error("User not found");
//       }
//     } catch (error) {
//       console.error("Error fetching user:", error);
//     }
//   } else {
//     console.error("User ID not found");
//   }
// });

// // Save updated profile
// const saveProfile = async () => {
//   if (!editableUser.value) return;

//   try {
//     const userRef = doc(db, "users", userId);
//     await updateDoc(userRef, {
//       firstName: editableUser.value.firstName,
//       lastName: editableUser.value.lastName,
//       phoneNo: editableUser.value.phoneNo,
//       companyName: editableUser.value.companyName,
//       email: editableUser.value.email, // Include email update
//     });
//     console.log("Profile updated successfully");
//     alert("Profile updated successfully!"); // Notify user
//   } catch (error) {
//     console.error("Error saving profile:", error);
//     alert("Error updating profile.");
//   }
// };
//

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "src/firebase/init";
import { useStoreAuth } from "src/stores/storeAuth";
import { useStoreUsers } from "src/stores/storeUsers";

const route = useRoute();
const storeAuth = useStoreAuth();
const storeUsers = useStoreUsers();

const editableUser = ref(null);

// Use `let` instead of `const` for `userId` to allow reassignment.
let userId = null; // Allow reassignment

// Determine User ID to Fetch
// If the route has an id parameter, it means the admin is trying to edit another user's profile.
if (route.params.id) {
  userId = route.params.id; // Admin editing another user's profile.
} else {
  // Otherwise, use the logged-in user's UID for a regular user editing their own profile.
  userId = storeAuth.user?.uid;
}

// ------------------------------------Phone Format-------------------------
const formatPhone = () => {
  if (editableUser.value && editableUser.value.phoneNo) {
    editableUser.value.phoneNo = formatPhoneNumber(editableUser.value.phoneNo);
  }
};

// ---------------------------Fetch user data on component mount -----------------------------
onMounted(async () => {
  if (userId) {
    try {
      console.log("Fetching user data for:", userId);
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        editableUser.value = userDoc.data(); // Populate editableUser with fetched data
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  } else {
    console.error("User ID not found");
  }
});

// ---------------------------Save updated profile -------------------------------------------
const saveProfile = async () => {
  if (!editableUser.value) return;

  try {
    const userRef = doc(db, "users", userId); // Use the correct userId to update
    await updateDoc(userRef, {
      firstName: editableUser.value.firstName,
      lastName: editableUser.value.lastName,
      phoneNo: editableUser.value.phoneNo,
      companyName: editableUser.value.companyName,
      email: editableUser.value.email,
    });
    console.log("Profile updated successfully");
    alert("Profile updated successfully!"); // Notify user
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Error updating profile.");
  }
};
</script>

<style scoped>
.q-item-section[side] {
  max-width: 150px; /* Adjust label width */
}
.q-item-label {
  font-weight: bold;
}
</style>
