<template>
  <div class="q-pa-md">
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
        <tr v-for="(user, index) in users" :key="index">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { auth, db } from "src/firebase/init";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { apiNode } from "boot/apiNode";

const $q = useQuasar();
const users = ref([]);

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

async function checkAdmin(userId) {
  try {
    const userRef = doc(db, "users", userId);
    const docSnapshot = await getDoc(userRef);
    const roleField = docSnapshot.data()?.role;
    const roles = Array.isArray(roleField) ? roleField : [roleField];
    return roles.includes("admin");
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

async function fetchUsers() {
  try {
    const idToken = await auth.currentUser.getIdToken();

    const response = await apiNode.get("/api/mongo-users", {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    users.value = response.data;
    console.log("✅ Users fetched:", users.value);

    $q.notify({
      color: "positive",
      message: "You’re logged in as an administrator.",
      icon: "check",
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    $q.notify({
      color: "negative",
      message: "Error fetching users.",
      icon: "warning",
    });
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const isAdmin = await checkAdmin(user.uid);
      if (isAdmin) {
        fetchUsers();
      } else {
        $q.notify({
          color: "negative",
          message: "User is not authorized as admin.",
          icon: "warning",
        });
      }
    } else {
      $q.notify({
        color: "negative",
        message: "Please log in to access this page.",
        icon: "warning",
      });
    }
  });
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
