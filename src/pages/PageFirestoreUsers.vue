<template>
  <!--ViewUserList.vue  -->
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6">Users List</div>
      </q-card-section>

      <q-card-section>
        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          class="q-mt-md"
          flat
          bordered
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                dense
                flat
                icon="edit"
                color="primary"
                @click="openUserProfile(props.row.id)"
                aria-label="Edit Profile"
              /><q-tooltip>Edit User</q-tooltip>

              <q-btn
                flat
                round
                dense
                icon="delete"
                color="red"
                @click="deleteUser(props.row.id)"
              >
                <q-tooltip>Delete User</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useStoreUsers } from "src/stores/storeUsers";
import { useRouter } from "vue-router";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "src/firebase/init";
import { useQuasar } from "quasar";

const $q = useQuasar();
const storeUsers = useStoreUsers();
const router = useRouter();
const isAdmin = computed(() => storeUsers.user?.role === "admin");

// Fetch all users if the logged-in user is an admin
onMounted(() => {
  console.log("Admin Status:", isAdmin.value); // Check if the user is detected as an admin

  if (isAdmin.value) {
    storeUsers.getAllUsers(); // Fetch all users for admin
  } else {
    console.warn("User is not an admin, cannot fetch users list.");
  }
});

// Computed list of users for the table
const users = computed(() => {
  const usersData = isAdmin.value ? storeUsers.usersList : [];
  console.log("Computed users list:", usersData);
  return usersData;
});

const columns = [
  {
    name: "firstName",
    label: "First Name",
    align: "left",
    field: "firstName",
  },
  {
    name: "lastName",
    label: "Last Name",
    align: "left",
    field: "lastName",
  },
  {
    name: "email",
    label: "Email Address",
    align: "left",
    field: "email",
  },
  {
    name: "phoneNo",
    label: "Phone Number",
    align: "left",
    field: "phoneNo",
  },
  {
    name: "companyName",
    label: "Company Name",
    align: "left",
    field: "companyName",
  },
  {
    name: "UserName",
    label: "User Name",
    align: "left",
    field: "userName",
  },
  {
    name: "actions",
    label: "Actions",
    align: "left",
    field: "actions",
    align: "center",
  },
];

function openUserProfile(userId) {
  router.push(`/profile/edit/${userId}`); // Navigate to UserProfile page with the user's ID
}

const deleteUser = async (userId) => {
  $q.dialog({
    title: "Delete User",
    message: "Are you sure you want to delete this user?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const userRef = doc(db, "users", userId);
      await deleteDoc(userRef);
      $q.notify({ type: "positive", message: "🗑️ User deleted successfully" });

      // Optionally re-fetch user list if you're admin
      await storeUsers.getAllUsers();
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      $q.notify({
        type: "negative",
        message: "Failed to delete user. Check permissions.",
      });
    }
  });
};
</script>
