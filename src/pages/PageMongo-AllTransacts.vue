<template>
  <!--PageMongoMyTransacts-->
  <div class="q-gutter-md row q-mt-md">
    <div class="col-4 large-screen-only">
      <q-item>
        <q-item-section>
          <q-item-label class="text-bold">{{ username }}</q-item-label>
          <q-item-label caption> {{ email }} </q-item-label>
        </q-item-section>
      </q-item>
    </div>

    <div class="col-8">
      <q-input
        v-model="searchQuery"
        filled
        dense
        debounce="300"
        placeholder="Search All transactions..."
        class="q-ml-sm"
      />
    </div>

    <div>
      <!-- Loading spinner -->
      <q-spinner
        v-if="isLoading"
        color="primary"
        size="3em"
        class="q-mt-lg q-ml-md"
      />
    </div>
  </div>

  <!-- Transactions Table -->
  <q-markup-table
    dark
    class="bg-indigo-8 q-mt-xl q-p-md q-ml-sm q-mr-sm"
    v-if="transacts.length > 0"
  >
    <thead>
      <tr>
        <th class="text-left">TranNumber</th>
        <th class="text-left">FirstName</th>
        <th class="text-left">LastName</th>
        <th class="text-left">Phone No.</th>
        <th class="text-left">Email</th>
        <th class="text-left">TranAmount</th>
        <th class="text-left">TranStatus</th>
        <th class="text-left">RequestDate</th>
        <th class="text-left">Edit</th>
        <th class="text-left">Delete</th>
      </tr>
    </thead>
    <tbody>
      <!-- <tr v-for="(transact, index) in transacts" :key="index"> -->
      <tr v-for="(transact, index) in filteredTransacts" :key="index">
        <td class="text-left">{{ transact.transact_number }}</td>
        <td class="text-left">{{ transact.First_Name }}</td>
        <td class="text-left">{{ transact.Last_Name }}</td>
        <td class="text-left">{{ transact.Phone_Number }}</td>
        <td class="text-left">{{ transact.User_Email }}</td>
        <td class="text-left">
          {{ formatCurrency(transact.transact_amount) }}
        </td>
        <td class="text-left">{{ transact.tran_status }}</td>
        <td class="text-left">{{ formatDate(transact.req_date) }}</td>

        <td class="text-left">
          <q-btn
            dense
            flat
            icon="edit"
            color="primary"
            @click="
              () => {
                console.log('Edit button clicked');
                openEditForm(transact._id);
              }
            "
            aria-label="Edit Transaction"
          />
        </td>
        <td class="text-left">
          <q-btn
            dense
            flat
            icon="delete"
            color="warning"
            @click="
              () => {
                console.log('Delete button clicked');
                openDeleteForm(transact._id);
              }
            "
            aria-label="Delete Transaction"
          />
        </td>
      </tr>
    </tbody>
  </q-markup-table>
  <div v-else-if="!isLoading" class="q-mt-md q-ml-sm"></div>
  <!-- Total Amount -->
  <div v-if="transacts.length > 0" class="q-mt-md q-ml-sm">
    <strong> Total Transaction Amount:</strong>
    {{ formatCurrency(totalAmount) }}
  </div>
</template>

<script setup>
import { useStoreAuth } from "src/stores/storeAuth";
import { ref, computed, onMounted } from "vue";
import { db, auth } from "src/firebase/init"; // Import Firestore
import { collection, getDocs } from "firebase/firestore";
import defaultAvatar from "src/assets/avatar.jpg";
import { useRouter } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";
import { useQuasar } from "quasar";
import { apiNode } from "boot/apiNode";

const $q = useQuasar();
const router = useRouter();
const storeAuth = useStoreAuth();

const avatarUrl = ref(defaultAvatar);
const username = ref("User Name");
const email = ref("user@example.com");
const isAuthenticated = ref(false);
const transacts = ref([]);
const isLoading = ref(false);
const searchQuery = ref("");

// Fetch avatar
async function fetchAvatar(userId) {
  try {
    const avatarCollectionRef = collection(db, `users/${userId}/avatar`);
    const avatarSnapshot = await getDocs(avatarCollectionRef);
    if (!avatarSnapshot.empty) {
      const avatarDoc = avatarSnapshot.docs[0];
      avatarUrl.value = avatarDoc.data().imageUrl;
    }
  } catch (error) {
    console.error("Error fetching avatar: ", error);
  }
}

// ✅ 2. Now call it inside onMounted()
// onMounted(() => {
//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       console.log("User authenticated:", user);
//       username.value = user.displayName || "User Name";
//       email.value = user.email || "user@example.com";
//       isAuthenticated.value = true;
//       isLoading.value = true;
//       await fetchAvatar(user.uid);
//       await fetchTransactions();
//     } else {
//       console.log("User not logged in.");
//       isAuthenticated.value = false;
//       transacts.value = [];
//     }
//   });
// });
// onMounted(() => {
//   onAuthStateChanged(auth, async (user) => {
//     if (user) {
//       console.log("User authenticated:", user);
//       username.value = user.displayName || "User Name";
//       email.value = user.email || "user@example.com";
//       isAuthenticated.value = true;
//       isLoading.value = true;
//       await fetchAvatar(user.uid);

//       const token = await user.getIdTokenResult();
//       const roles = token.claims.role || [];
//       if (Array.isArray(roles) && roles.includes("admin")) {
//         await fetchTransactions(); // ✅ only admin gets this
//       }
//     } else {
//       console.log("User not logged in.");
//       isAuthenticated.value = false;
//       transacts.value = [];
//     }
//   });
// });

// Fetch all transactions
async function fetchTransactions() {
  try {
    const idToken = await storeAuth.user?.getIdToken();

    const response = await apiNode.get("/api/mongo-AllTransacts", {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.data && response.data.length > 0) {
      transacts.value = response.data;
      $q.notify({
        color: "positive",
        message: "Transactions fetched successfully!",
        icon: "check",
        position: "top",
      });
      isLoading.value = false; // Stop loading spinner
    } else {
      transacts.value = [];
      $q.notify({
        color: "warning",
        message: "No transactions found.",
        icon: "warning",
        position: "top",
      });
    }
  } catch (error) {
    console.error(
      "Error fetching transactions:",
      error.response || error.message
    );

    const status = error.response?.status;
    let message = "Failed to fetch transactions.";

    if (status === 401) {
      message = "Unauthorized access. Please log in again.";
    } else if (status === 403) {
      message = "Access denied. Admin privileges required.";
    } else if (status === 500) {
      message = "Server error. Please try again later.";
    }

    $q.notify({
      color: "negative",
      message,
      icon: "error",
      position: "center",
    });

    isLoading.value = false; // Stop loading spinner
  }
}

// Handle authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User authenticated:", user);
    username.value = user.displayName || "User Name";
    email.value = user.email || "user@example.com";
    isAuthenticated.value = true;
    isLoading.value = true; // Start loading spinner
    // Fetch avatar and transactions
    await fetchAvatar(user.uid);
    await fetchTransactions();
  } else {
    console.log("User not logged in.");
    isAuthenticated.value = false;
    transacts.value = []; // Clear transactions
  }
});

//------------------------------------------------------

async function openEditForm(transactId) {
  console.log("openEditForm triggered with transactId:", transactId);

  if (!auth.currentUser) {
    console.error("User is not logged in.");
    return;
  }

  const idToken = await auth.currentUser.getIdToken(true);
  console.log("Authorization Token:", idToken);

  localStorage.setItem("idToken", idToken);

  isLoading.value = true; // Show loading spinner

  try {
    const response = await apiNode.get(`/api/transactions/${transactId}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    console.log("PageMongoTran Fetched transaction data:", response.data);
    router.push(`/view-transaction/${transactId}`);
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    if (error.response) {
      console.error("API Error Response:", error.response.data);
    }
  } finally {
    isLoading.value = false; // Hide loading spinner
  }
}

// async function openDeleteForm(transactId) {
async function openDeleteForm(transactId) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const idToken = await currentUser.getIdToken(true);

  $q.dialog({
    title: "Confirm",
    message: "Are you sure you want to delete this transaction?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await apiNode.delete(`/api/transactions/${transactId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      console.log("✅ Transaction deleted:", response.data);

      $q.notify({
        color: "positive",
        message: "Transaction deleted successfully!",
        icon: "check",
      });

      fetchTransactions(); // ✅ reload list
    } catch (error) {
      console.error("❌ Delete failed:", error);
      $q.notify({
        color: "negative",
        message: "Failed to delete transaction.",
        icon: "error",
      });
    }
  });
}

// Compute the total amount from all transactions
const totalAmount = computed(() => {
  return transacts.value.reduce(
    (sum, transact) => sum + transact.transact_amount,
    0
  );
});

// Format the date for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};

const filteredTransacts = computed(() => {
  if (!searchQuery.value) return transacts.value;
  const q = searchQuery.value.toLowerCase();
  return transacts.value.filter((t) => {
    return (
      String(t.transact_number).includes(q) ||
      (t.First_Name && t.First_Name.toLowerCase().includes(q)) ||
      (t.Last_Name && t.Last_Name.toLowerCase().includes(q)) ||
      (t.User_Email && t.User_Email.toLowerCase().includes(q)) ||
      (t.tran_status && t.tran_status.toLowerCase().includes(q))
    );
  });
});
</script>

<style scoped>
.delete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  cursor: pointer;
  color: red;
}

.delete-icon:hover {
  color: blue !important;
}
</style>
