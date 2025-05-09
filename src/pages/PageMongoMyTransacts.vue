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
        placeholder="Search Buyer transactions..."
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
        <th class="text-left">Invoice</th>
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
        <td class="text-left">
          <q-badge
            :color="transact.tran_status === 'unpaid' ? 'red' : 'green'"
            outline
          >
            {{ transact.tran_status }}
          </q-badge>
        </td>

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
        <td class="text-left">
          <q-btn
            dense
            flat
            icon="picture_as_pdf"
            color="secondary"
            @click="downloadInvoice(transact._id)"
            aria-label="Download Invoice"
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
import { apiNode, nodeApiBaseURL } from "boot/apiNode"; // ✅ Make sure to import it

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

const downloadInvoice = async (transactId) => {
  const user = auth.currentUser;
  if (!user) {
    $q.notify({ color: "negative", message: "Please log in first." });
    return;
  }

  const token = await user.getIdToken();
  const url = `${nodeApiBaseURL}/api/transactions/invoice/${transactId}`; // ✅ fixed

  try {
    const res = await apiNode.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "invoice.pdf";
    link.click();
  } catch (error) {
    console.error("❌ Failed to download invoice:", error);
    $q.notify({ color: "negative", message: "Download failed." });
  }
};

// Fetch avatar -----------------------------------------
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
// ✅ 1. Move this function OUTSIDE of onMounted()
async function getMyTransactions() {
  console.log("endpoint backend", nodeApiBaseURL);
  try {
    const idToken = await storeAuth.user?.getIdToken();
    const response = await apiNode.get("/api/mongo-AllMyTransacts", {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (response.data && response.data.length > 0) {
      transacts.value = response.data;
      $q.notify({
        color: "positive",
        message: "My Transactions fetched successfully!",
        icon: "check",
        position: "top",
      });
      isLoading.value = false;
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

    isLoading.value = false;
  }
}

// ✅ 2. Now call it inside onMounted()
onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User authenticated:", user);
      username.value = user.displayName || "User Name";
      email.value = user.email || "user@example.com";
      isAuthenticated.value = true;
      isLoading.value = true;
      await fetchAvatar(user.uid);
      await getMyTransactions();
    } else {
      console.log("User not logged in.");
      isAuthenticated.value = false;
      transacts.value = [];
    }
  });
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
  console.log("openDeleteForm triggered with transactId:", transactId);

  // Ensure the user is logged in and retrieve a fresh token if needed
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("User is not logged in.");
    return;
  }

  const idToken = await currentUser.getIdToken(true); // Get a fresh token
  console.log("Authorization Token:", idToken);
  localStorage.setItem("idToken", idToken); // Store token in localStorage

  $q.dialog({
    title: "Confirm",
    message: "Are you sure you want to delete this transaction?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const response = await apiNode.delete(`/api/transactions/${transactId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`, // Include token in request headers
        },
      });

      console.log("Transaction deleted successfully:", response.data);

      // Show success notification
      $q.notify({
        color: "positive",
        message: "Transaction deleted successfully!",
        icon: "check",
      });

      // Refresh the transaction list after successful deletion
      getMyTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);

      // Show error notification
      $q.notify({
        color: "negative",
        message: "Failed to delete transaction.",
        icon: "error",
      });

      if (error.response) {
        console.error("API Error Response:", error.response.data);
      }
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
