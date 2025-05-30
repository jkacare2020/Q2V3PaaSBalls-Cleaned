<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md q-mx-auto" style="max-width: 600px">
      <q-card-section>
        <div class="text-h6">Public User Profile</div>
      </q-card-section>
      <q-card-section v-if="editableUser">
        <q-list>
          <q-item>
            <q-item-section side>
              <q-icon name="laptop" />
            </q-item-section>
            <q-item-section>
              <q-input
                v-model="editableUser.displayName"
                outlined
                dense
                label="Display Name"
                readonly
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section side>
              <q-icon name="person" />
            </q-item-section>
            <q-item-section>
              <q-input
                v-model="editableUser.userName"
                outlined
                dense
                label="Username"
                readonly
              />
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section side>
              <q-icon name="description" />
            </q-item-section>
            <q-item-section>
              <q-input
                v-model="editableUser.bio"
                outlined
                dense
                label="Biography"
                readonly
                type="textarea"
                autogrow
              />
            </q-item-section>
          </q-item>
          <q-item v-if="editableUser.registrationDate">
            <q-item-section side>
              <q-icon name="event" />
            </q-item-section>
            <q-item-section>
              <q-input
                :model-value="
                  new Date(
                    editableUser.registrationDate.seconds * 1000
                  ).toLocaleDateString()
                "
                outlined
                dense
                label="Registered On"
                readonly
              />
            </q-item-section>
          </q-item>
          <div class="q-pa-md flex flex-center">
            <div v-if="editableUser?.bioFileUrl">
              <q-btn
                label="Preview Bio"
                @click="openBioPreview"
                icon="visibility"
                color="primary"
              />
            </div>
          </div>
          <q-dialog v-model="showBioPreview" persistent>
            <q-card style="min-width: 80vw; min-height: 80vh">
              <q-card-section>
                <iframe
                  :src="editableUser?.bioFileUrl || ''"
                  width="100%"
                  height="600"
                  style="border: none"
                ></iframe>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Close" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </q-list>
      </q-card-section>
      <q-card-section v-else>
        <div class="text-center">Loading user data...</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
} from "firebase/firestore";
import { db } from "src/firebase/init";
import { useStoreAuth } from "src/stores/storeAuth";
import { useStoreUsers } from "src/stores/storeUsers";
import { formatPhoneNumber, isValidPhoneNumber } from "src/utils/phoneUtils";

const route = useRoute();
const storeAuth = useStoreAuth();
const storeUsers = useStoreUsers();

// const editableUser = ref(null);

const editableUser = ref({
  bioFileUrl: null, // or ""
});

// Check if the logged-in user is an admin
const isAdmin = computed(() => {
  const roleField = storeUsers.user?.role;
  const roles = Array.isArray(roleField) ? roleField : [roleField];
  return roles.includes("admin");
});

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
  // Wait for the storeAuth to initialize
  await storeAuth.init();

  // After initialization, check if userId is available
  if (route.params.id) {
    userId = route.params.id; // Admin editing another user's profile
  } else {
    userId = storeAuth.user?.uid; // Regular user editing their own profile
  }

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

const saveProfile = async () => {
  if (!editableUser.value) return;

  const userRef = doc(db, "users", userId); // current user's Firestore doc
  const proposedUserName = editableUser.value.userName?.trim();

  try {
    // ✅ Check for duplicate userName only if it's changed
    if (proposedUserName) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("userName", "==", proposedUserName));
      const snapshot = await getDocs(q);

      const isTakenByAnother =
        !snapshot.empty && snapshot.docs.some((doc) => doc.id !== userId);

      if (isTakenByAnother) {
        alert(
          "Username is already taken by another user. Please choose a different one."
        );
        return;
      }
    }

    // ✅ Proceed to update
    await updateDoc(userRef, {
      // firstName: editableUser.value.firstName,
      // lastName: editableUser.value.lastName,
      // phoneNo: editableUser.value.phoneNo,
      companyName: editableUser.value.companyName,
      displayName: editableUser.value.displayName,
      userName: proposedUserName || "", // Save empty string if blank
      bio: editableUser.value.bio || "", // default to empty string if not filled,
      registrationDate: editableUser.value.Timestamp,
      // role: editableUser.value.role,
      // email: editableUser.value.email,
    });

    console.log("✅ Profile updated successfully");
    alert("Profile updated successfully!");
  } catch (error) {
    console.error("❌ Error saving profile:", error);
    alert("Error updating profile. Insuficient Permission.");
  }
};

//--------------------------Preview Bio--------------
const showBioPreview = ref(false);
const openBioPreview = () => {
  showBioPreview.value = true;
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
