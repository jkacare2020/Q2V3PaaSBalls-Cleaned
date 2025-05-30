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
                  v-if="storeAuth.user"
                  v-model="editableUser.companyName"
                  outlined
                  dense
                  label="Company Name"
                  required
                />
                <!-- Set field as readonly if not admin -->
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                <q-icon name="business" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-if="storeAuth.user"
                  v-model="editableUser.displayName"
                  outlined
                  dense
                  label="Display Name"
                  required
                />
                <!-- Set field as readonly if not admin -->
              </q-item-section>
              <q-item-section>
                <q-input
                  v-if="storeAuth.user"
                  v-model="editableUser.userName"
                  outlined
                  dense
                  label="UserName"
                  required
                />
                <!-- Set field as readonly if not admin -->
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section side>
                <q-icon name="business" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-if="storeAuth.user"
                  v-model="editableUser.role"
                  outlined
                  dense
                  label="Role Name"
                  required
                  :readonly="!isAdmin"
                />
                <!-- Set field as readonly if not admin -->
              </q-item-section>
            </q-item>
            <q-card-section>
              <div class="text-h6">
                <q-badge
                  v-if="editableUser?.role === 'admin'"
                  color="red"
                  label="Protected Admin !"
                  class="q-ml-md"
                />
              </div>
            </q-card-section>
            <q-item>
              <q-item-section side>
                <q-icon name="description" />
              </q-item-section>
              <q-item-section>
                <q-input
                  v-model="editableUser.bio"
                  type="textarea"
                  outlined
                  dense
                  label="Bio"
                  autogrow
                  :counter="300"
                />
              </q-item-section>
            </q-item>
            <div class="q-pa-md flex flex-center">
              <q-uploader
                label="Upload Bio File (PDF/TXT)"
                accept=".pdf,.txt"
                :auto-upload="false"
                :hide-upload-btn="true"
                @added="handleBioFileUpload"
              />
            </div>
            <!------------- Preview Bio  --------------->
            <div class="q-pa-md flex flex-center">
              <div v-if="editableUser.bioFileUrl">
                <q-btn
                  label="Preview Bio"
                  @click="openBioPreview"
                  icon="visibility"
                  color="primary"
                />
              </div>
              <q-btn
                class="q-ml-sm"
                v-if="editableUser.bioFileUrl"
                label="Delete Bio"
                icon="delete"
                color="negative"
                @click="deleteBioFile"
              />
            </div>
            <q-dialog v-model="showBioPreview" persistent>
              <q-card style="min-width: 80vw; min-height: 80vh">
                <q-card-section>
                  <iframe
                    :src="editableUser.bioFileUrl"
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
          <q-btn
            label="Save"
            color="primary"
            class="q-mt-xm full-width"
            type="submit"
          />
          <q-btn
            label="Assign Client"
            icon="person_add"
            color="primary"
            @click="router.push('/assign-client')"
            class="q-mt-md"
            v-if="canAssignClient"
          />
        </q-form>
      </q-card-section>
      <!-- Show loading text if data is not yet loaded -->
      <q-card-section v-else>
        <div class="text-center">Loading user data...</div>
      </q-card-section>
      <q-btn
        label="Delete My Account"
        color="negative"
        flat
        class="q-mt-md"
        @click="confirmDeleteAccount"
      />

      <q-dialog v-model="showDeleteDialog" persistent>
        <q-card>
          <q-card-section>
            <div class="text-h6 text-negative">Confirm Deletion</div>
            <div class="text-subtitle2">
              Are you sure you want to delete your account?
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn
              v-if="editableUser && editableUser.role !== 'admin'"
              label="Delete Account"
              color="negative"
              class="q-mt-md"
              @click="confirmDeleteAccount"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
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
import { useQuasar } from "quasar";
// import { useRouter } from "vue-router";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";

//-------------------------------------------------------
const canAssignClient = computed(() => {
  const roleField = storeUsers.user?.role;
  const roles = Array.isArray(roleField) ? roleField : [roleField];
  return roles.includes("merchant") || roles.includes("admin");
});
//------------------------------------------
const router = useRouter();
const $q = useQuasar();

const route = useRoute();
const storeAuth = useStoreAuth();
const storeUsers = useStoreUsers();

const editableUser = ref(null);
const showDeleteDialog = ref(false);

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
      firstName: editableUser.value.firstName,
      lastName: editableUser.value.lastName,
      phoneNo: editableUser.value.phoneNo,
      companyName: editableUser.value.companyName,
      displayName: editableUser.value.displayName,
      userName: proposedUserName || "", // Save empty string if blank
      role: editableUser.value.role,
      email: editableUser.value.email,
      bio: editableUser.value.bio ?? "", // ✅ specifically fix this
    });

    console.log("✅ Profile updated successfully");
    alert("Profile updated successfully!");
    $q.notify({ type: "positive", message: "Profile updated successfully" });
  } catch (error) {
    console.error("❌ Error saving profile:", error);
    alert("Error updating profile. Insuficient Permission.");
    $q.notify({ type: "negative", message: "Error updating profile." });
  }
};
//---------------------Deletion----------------------------

const confirmDeleteAccount = () => {
  if (editableUser.value?.role === "admin") {
    $q.notify({
      type: "negative",
      message: "❌ Admin accounts are protected and cannot be deleted.",
      position: "top",
      timeout: 3000,
      icon: "block",
    });
    return; // Exit early if admin
  }
  $q.dialog({
    title: "Delete Account",
    message:
      "Are you sure you want to delete your account? This action cannot be undone.",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    deleteAccount();
  });
};
//----------------------------------------------------------------
const deleteAccount = async () => {
  if (editableUser.value?.role === "admin") {
    $q.notify({
      type: "warning",
      message: "Admin accounts cannot be deleted.",
    });
    return;
  }

  try {
    // 🧠 Example: soft delete Firestore user doc
    const userRef = doc(db, "users", storeAuth.user.uid);
    await updateDoc(userRef, {
      deleted: true,
      deletedAt: new Date().toISOString(),
    });

    // ✅ Sign out and redirect
    await storeAuth.logoutUser();
    router.push("/");

    $q.notify({
      type: "positive",
      message: "Your account was marked as deleted.",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    $q.notify({ type: "negative", message: "Failed to delete account." });
  }
};

//-------------------------Upload PDF -------------------------
const handleBioFileUpload = async (files) => {
  console.log("handleBioFileUpload triggered with:", files);
  const file = files[0];
  if (!file) return;

  try {
    $q.loading.show();

    const user = auth.currentUser;
    const idToken = await user.getIdToken();

    // ✅ Correctly instantiate FormData
    const formData = new FormData();
    formData.append("bioFile", file); // 👈 name should match backend busboy
    formData.append("uid", user.uid);

    // ✅ Optional: Log FormData contents (can't log full file in browser)
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

    const response = await apiNode.post("/api/bio/upload", formData, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "multipart/form-data", // this lets Axios auto-set boundary
      },
    });

    if (response.status === 200 && response.data.bioFileUrl) {
      editableUser.value.bioFileUrl = response.data.bioFileUrl;
      $q.notify({
        type: "positive",
        message: "Bio file uploaded successfully",
        position: "center",
        timeout: 2500,
        textColor: "white",
        color: "green-6",
        icon: "cloud_done",
      });
    }
  } catch (error) {
    console.error("Upload error:", {
      message: error.message,
      code: error.code,
      request: error.request,
      response: error.response,
    });
    $q.notify({ type: "negative", message: "Failed to upload bio file." });
  } finally {
    $q.loading.hide();
  }
};

//--------------------------Preview Bio--------------
const showBioPreview = ref(false);
const openBioPreview = () => {
  showBioPreview.value = true;
};
//-----------------------Delete Bio-------------------
const deleteBioFile = async () => {
  try {
    const user = auth.currentUser;
    const idToken = await user.getIdToken();

    await apiNode.post(
      "/api/bio/delete",
      { uid: user.uid },
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    editableUser.value.bioFileUrl = "";
    $q.notify({ type: "positive", message: "Bio file deleted successfully." });
  } catch (error) {
    console.error("Delete failed:", error);
    $q.notify({ type: "negative", message: "Failed to delete bio file." });
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
