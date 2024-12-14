<template>
  <div class="q-pa-md">
    <!-- Rows per page selection at the top left -->
    <div class="q-mb-md">
      <q-select
        v-model="pagination.rowsPerPage"
        :options="[5, 10, 25, 50, 100]"
        label="Records per page"
        outlined
        dense
        style="max-width: 120px"
      />
    </div>

    <q-markup-table dark class="bg-indigo-8">
      <thead>
        <tr>
          <th class="text-left">User Number</th>
          <th class="text-left">First Name</th>
          <th class="text-left">Last Name</th>
          <th class="text-left">Company</th>
          <th class="text-left">Phone No.</th>
          <th class="text-left">Email</th>
          <th class="text-left">Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in paginatedUsers" :key="index">
          <td class="text-left">{{ user.user_number }}</td>
          <td class="text-left">{{ user.First_Name }}</td>
          <td class="text-left">{{ user.Last_Name }}</td>
          <td class="text-left truncate" :title="user.company_name">
            {{ user.company_name }}
          </td>
          <td class="text-left">{{ user.Phone_Number }}</td>
          <td class="text-left">{{ user.email }}</td>
          <td class="text-left">{{ formatDate(user.app_date) }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <!-- Page Navigation at the bottom -->
    <div class="q-mt-lg">
      <q-pagination
        v-model="pagination.page"
        :max="pageCount"
        color="primary"
        boundary-numbers
        direction-links
        icon-prev="chevron_left"
        icon-next="chevron_right"
      />
    </div>
  </div>
</template>

<script setup>
import { getCurrentInstance } from "vue";

const { proxy } = getCurrentInstance();
const $api = proxy.$api;
console.log("Axios instance:", $api);

import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { auth, db } from "src/firebase/init"; // Ensure db is correctly imported for Firestore checks
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useQuasar } from "quasar";
import { useStoreAuth } from "stores/storeAuth";
const storeAuth = useStoreAuth();

const users = ref([]);
const pagination = ref({
  page: 1,
  rowsPerPage: 5, // Default rows per page
  rowsNumber: 0, // Will be set after fetching data
});
const $q = useQuasar();

// Calculate the maximum number of pages for pagination
const pageCount = computed(() => {
  return Math.ceil(users.value.length / pagination.value.rowsPerPage);
});

// Paginated users for the current page
const paginatedUsers = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  const end = start + pagination.value.rowsPerPage;
  return users.value.slice(start, end);
});

// Function to check if the current user is an admin
async function checkAdmin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const docSnapshot = await getDoc(userRef);
    return docSnapshot.exists() && docSnapshot.data().role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

// Fetch users from MongoDB backend
async function fetchUsers() {
  loading.value = true;
  try {
    const response = await $api.get("/mongo-users");
    users.value = response.data;
    pagination.value.rowsNumber = users.value.length;
    console.log("API response:", response.data);

    // Success notification
    $q.notify({
      color: "positive",
      message: "You’re logged in as an administrator.",
      icon: "check",
    });
  } catch (error) {
    console.error("Error fetching users from backend:", error);

    // Error notification
    $q.notify({
      color: "negative",
      message: "Error fetching users.",
      icon: "warning",
    });
  } finally {
    loading.value = false;
  }
}

// Format the date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
}

// Check authentication state and admin status when component mounts
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkAdmin(user.uid);
      if (isAdmin) {
        console.log("User is admin, fetching users.");
        await fetchUsers(); // Use await to ensure data is ready before pagination updates
      } else {
        console.warn("User is not admin, restricting access.");
        $q.notify({
          color: "negative",
          message: "User is not authorized as admin, limiting access.",
          icon: "warning",
        });
      }
    } else {
      console.warn("User is not authenticated.");
    }
  });
});

// Check authentication state and admin status when component mounts
onMounted(() => {
  if (storeAuth.user) {
    fetchUsers();
  } else {
    console.warn("User is not authenticated.");
  }
});
</script>

<style scoped>
.truncate {
  max-width: 150px; /* Adjust as needed */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
