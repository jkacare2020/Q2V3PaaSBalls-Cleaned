<template>
  <div class="q-pa-md">
    <q-markup-table dark class="bg-indigo-8">
      <thead>
        <tr>
          <th class="text-left">First Name</th>
          <th class="text-left">Last Name</th>
          <th class="text-left">Company</th>
          <th class="text-left">Phone No.</th>
          <th class="text-left">Email</th>
          <th class="text-left">User Number</th>
          <th class="text-left">Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in users" :key="index">
          <td class="text-left">{{ user.First_Name }}</td>
          <td class="text-left">{{ user.Last_Name }}</td>
          <td class="text-left truncate" :title="user.company_name">
            {{ user.company_name }}
          </td>
          <td class="text-left">{{ user.Phone_Number }}</td>
          <td class="text-left">{{ user.email }}</td>
          <td class="text-left">{{ user.user_number }}</td>
          <td class="text-left">{{ formatDate(user.app_date) }}</td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script>
import axios from "axios";
import { auth, db } from "src/firebase/init"; // Ensure db is correctly imported for Firestore checks
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { apiNode, nodeApiBaseURL } from "boot/apiNode";

export default {
  data() {
    return {
      users: [],
    };
  },
  methods: {
    // Function to check if the current user is an admin
    async checkAdmin(userId) {
      try {
        const userRef = doc(db, "users", userId);
        const docSnapshot = await getDoc(userRef);
        return docSnapshot.exists() && docSnapshot.data().role === "admin";
      } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
    },

    // Fetch users from MongoDB backend
    async fetchUsers() {
      try {
        // Get the Firebase ID token
        const idToken = await auth.currentUser.getIdToken();

        console.log("Fetching users from:", `${nodeApiBaseURL}/mongo-users`);
        const response = await apiNode.get(`/mongo-users`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        this.users = response.data;
        console.log("Users fetched from MongoDB:", this.users);

        // Display a success notification for admin
        this.$q.notify({
          color: "positive",
          message: "You’re logged in as an administrator.",
          icon: "check",
        });
      } catch (error) {
        console.error("Error fetching users from backend:", error);

        // Display an error notification if non-admin or fetch error
        this.$q.notify({
          color: "negative",
          message: "Error fetching users.",
          icon: "warning",
        });
      }
    },

    // Format the date for display
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
    },
  },
  mounted() {
    // Check authentication state and admin status when component mounts
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAdmin = await this.checkAdmin(user.uid);
        if (isAdmin) {
          console.log("User is admin, fetching users.");
          this.fetchUsers();
        } else {
          console.warn("User is not admin, restricting access.");
          this.$q.notify({
            color: "negative",
            message: "User is not authorized as admin, limiting access.",
            icon: "warning",
          });
        }
      } else {
        console.warn("User is not authenticated.");
      }
    });
  },
};
</script>

<style scoped>
.truncate {
  max-width: 150px; /* Adjust as needed */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
