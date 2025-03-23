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
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { apiFastAPI } from "boot/apiFastAPI";
import { useQuasar } from "quasar";

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
    $q.notify({ type: "negative", message: "Failed to load users" });
  }
};

onMounted(fetchUsers);
</script>
