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

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "src/firebase/init";
import { formatPhoneNumber } from "src/use/formatPhoneNumber";

const route = useRoute();
const userId = route.params.id;
const editableUser = ref(null);

const formatPhone = () => {
  if (editableUser.value && editableUser.value.phoneNo) {
    editableUser.value.phoneNo = formatPhoneNumber(editableUser.value.phoneNo);
  }
};

// Fetch user data on component mount
onMounted(async () => {
  if (userId) {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        editableUser.value = userDoc.data(); // Populate editableUser
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }
});

// Save updated profile
const saveProfile = async () => {
  if (!editableUser.value) return;

  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      firstName: editableUser.value.firstName,
      lastName: editableUser.value.lastName,
      phoneNo: editableUser.value.phoneNo,
      companyName: editableUser.value.companyName,
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
