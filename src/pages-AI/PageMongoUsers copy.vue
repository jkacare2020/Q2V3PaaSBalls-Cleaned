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
import { ref, computed, onMounted } from "vue";
import { useStoreAuth } from "stores/storeAuth";
import { useQuasar } from "quasar";

const users = ref([]);
const pagination = ref({
  page: 1,
  rowsPerPage: 5, // Default rows per page
  rowsNumber: 0, // Will be set after fetching data
});
const $q = useQuasar();
const storeAuth = useStoreAuth();

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

// Fetch users from MongoDB backend
async function fetchUsers() {
  try {
    console.log(
      "Fetching users from:",
      `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api"
      }/mongo-users`
    );
    const response = await this.$api.get("/mongo-users");
    users.value = response.data;
    pagination.value.rowsNumber = users.value.length; // Set the total number of rows for pagination

    // Display a success notification for admin
    $q.notify({
      color: "positive",
      message: "You’re logged in as an administrator.",
      icon: "check",
    });
  } catch (error) {
    console.error("Error fetching users from backend:", error);

    // Display an error notification if non-admin or fetch error
    $q.notify({
      color: "negative",
      message: "Error fetching users.",
      icon: "warning",
    });
  }
}

// Format the date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
}

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
/* Add any component-specific styles here */
</style>
