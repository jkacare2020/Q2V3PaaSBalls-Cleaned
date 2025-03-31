<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <q-card-section>
        <div class="text-h6 text-center">User List</div>
      </q-card-section>

      <q-card-section>
        <q-table
          flat
          bordered
          title="Registered Users"
          :rows="users"
          :columns="columns"
          row-key="id"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                color="primary"
                label="View"
                dense
                @click="viewUser(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
  <q-dialog v-model="isModalOpen" persistent>
    <q-card style="min-width: 400px">
      <q-card-section class="text-h6">User Details</q-card-section>

      <q-card-section>
        <div><strong>ID:</strong> {{ selectedUser.id }}</div>
        <div><strong>Username:</strong> {{ selectedUser.username }}</div>
        <div><strong>Email:</strong> {{ selectedUser.email }}</div>
        <div><strong>First Name:</strong> {{ selectedUser.first_name }}</div>
        <div><strong>Last Name:</strong> {{ selectedUser.last_name }}</div>
        <div><strong>Role:</strong> {{ selectedUser.role }}</div>
        <div><strong>Phone:</strong> {{ selectedUser.phone_number }}</div>
        <div>
          <strong>Status:</strong>
          {{ selectedUser.is_active ? "Active" : "Inactive" }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { apiFastAPI } from "boot/apiFastAPI";
import { useQuasar } from "quasar";

const isModalOpen = ref(false);
const selectedUser = ref({});

const router = useRouter();
const $q = useQuasar();
const users = ref([]);

const columns = [
  { name: "id", label: "#", field: "id", align: "left", sortable: true },
  {
    name: "username",
    label: "Username",
    field: "username",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: "Email",
    field: "email",
    align: "left",
    sortable: true,
  },
  { name: "role", label: "Role", field: "role", align: "left", sortable: true },
  {
    name: "phone_number",
    label: "Phone",
    field: "phone_number",
    align: "left",
    sortable: true,
  },
  { name: "actions", label: "Actions", align: "center" },
];

// Fetch Users from FastAPI
const fetchUsers = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    // ✅ Fetch the logged-in user's data first to determine their role
    const userResponse = await apiFastAPI.get("/user/userMe", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const loggedInUser = userResponse.data;
    console.log("✅ Logged-in User Data:", loggedInUser);

    if (loggedInUser.role === "admin") {
      // ✅ If admin, fetch all users
      const response = await apiFastAPI.get("/user/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      users.value = response.data;
    } else {
      // ✅ If regular user, only show their own data
      users.value = [loggedInUser]; // Store the logged-in user as a single array item
    }
  } catch (error) {
    console.error("🔥 Error fetching users:", error);
    $q.notify({
      type: "negative",
      message: "Failed to load users",
      position: "center",
    });
  }
};

// Update this function to show modal instead of router push
const viewUser = async (userId) => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await apiFastAPI.get(`/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    selectedUser.value = response.data;
    isModalOpen.value = true;
  } catch (err) {
    console.error("Error loading user detail:", err);
    $q.notify({
      type: "negative",
      message: "Could not load user details",
      position: "center",
    });
  }
};

onMounted(fetchUsers);
</script>
