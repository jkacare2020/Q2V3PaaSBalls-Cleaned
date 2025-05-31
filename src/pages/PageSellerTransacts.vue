<template>
  <!--PageSellerTransacts.vue -->
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
        placeholder="Search Merchant transactions..."
        class="q-ml-sm"
      />
    </div>
  </div>

  <!-- <q-input
    v-model="startDate"
    label="Start Date"
    type="date"
    dense
    filled
    class="q-mb-sm"
  />
  <q-input
    v-model="endDate"
    label="End Date"
    type="date"
    dense
    filled
    class="q-mb-sm"
  />
  <q-btn label="Filter" color="primary" @click="getTransactionsBySeller" /> -->

  <!-- Transactions Table -->
  <q-markup-table
    dark
    class="bg-indigo-8 q-mt-xl q-p-md q-ml-sm q-mr-sm"
    v-if="sellerTransacts.length > 0"
  >
    <thead>
      <tr>
        <th class="text-left">TranNumber</th>
        <th class="text-left">FirstName</th>
        <th class="text-left">LastName</th>
        <th class="text-left">Phone No.</th>
        <th class="text-left">Email</th>
        <th class="text-left">Description</th>
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
        <td class="text-left">{{ transact.description }}</td>
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
  <div v-if="sellerTransacts.length > 0" class="q-mt-md q-ml-sm">
    <strong> Total Transaction Amount:</strong>
    {{ formatCurrency(totalAmount) }}
  </div>
  <div class="row q-gutter-sm items-center q-mb-md q-mt-md q-ml-sm">
    <q-btn
      label="Export CSV "
      style="font-size: 12px"
      icon="download"
      color="primary"
      @click="exportToCSV"
    />
    <q-btn
      label="Export Excel"
      style="font-size: 12px"
      icon="table_view"
      color="green"
      @click="exportToExcel"
    />
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
import * as XLSX from "xlsx";

function exportToExcel() {
  const rows = filteredTransacts.value;
  if (!rows.length) return;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

  XLSX.writeFile(workbook, "transactions.xlsx");
}

const $q = useQuasar();
const router = useRouter();
const storeAuth = useStoreAuth();

const avatarUrl = ref(defaultAvatar);
const username = ref("User Name");
const email = ref("user@example.com");
const isAuthenticated = ref(false);
const transacts = ref([]);
const isLoading = ref(false);
const sellerTransacts = ref([]); // 👈 Declare it
const searchQuery = ref("");

const startDate = ref("");
const endDate = ref("");

function formatDateOnly(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString().split("T")[0];
}

function formatInclusiveEndDate(dateStr) {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

//---------------------------------------------------
function exportToCSV() {
  const rows = filteredTransacts.value;

  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","), // header row
    ...rows.map((row) => headers.map((key) => `"${row[key] ?? ""}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "transactions.csv");
  link.click();
}

//-------------------------------------------------
const downloadInvoice = async (transactId) => {
  const user = auth.currentUser;
  if (!user) {
    $q.notify({ color: "negative", message: "Please log in first." });
    return;
  }

  const token = await user.getIdToken();

  // 🔹 This is the line you're asking about
  const url = `${nodeApiBaseURL}/api/transactions/invoice/${transactId}`;

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
async function getSellerTransactions() {
  console.log("endpoint backend", nodeApiBaseURL);
  try {
    const idToken = await storeAuth.user?.getIdToken();
    const response = await apiNode.get("/api/transactions/seller", {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    console.log("🟢 Seller Transactions Response:", response.data);
    transacts.value = response.data;
    if (response.data && response.data.length > 0) {
      sellerTransacts.value = response.data;
      $q.notify({
        color: "positive",
        message: "My Transactions fetched successfully!",
        icon: "check",
        position: "top",
      });
      isLoading.value = false;
    } else {
      sellerTransacts.value = [];
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
      await getSellerTransactions();
      await getTransactionsBySeller();
    } else {
      console.log("User not logged in.");
      isAuthenticated.value = false;
      sellerTransacts.value = [];
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
  return filteredTransacts.value.reduce(
    (sum, t) => sum + (t.transact_amount || 0),
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

  const keywords = searchQuery.value.toLowerCase().split(" ");

  return transacts.value.filter((t) => {
    const combinedText = [
      t.transact_number,
      t.First_Name,
      t.Last_Name,
      t.User_Email,
      t.tran_status,
      t.req_date,
      t.Phone_Number,
      t.transact_number,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return keywords.every((kw) => combinedText.includes(kw));
  });
});

//---------------------------------------------------------------------------
// ✅ Unified and final version
const getTransactionsBySeller = async () => {
  try {
    const idToken = await storeAuth.user?.getIdToken();

    const params = {};
    if (startDate.value && endDate.value) {
      params.startDate = formatDateOnly(startDate.value);
      params.endDate = formatInclusiveEndDate(endDate.value);
    }

    const response = await apiNode.get("/api/transactions/seller/date", {
      headers: { Authorization: `Bearer ${idToken}` },
      params,
    });

    transacts.value = response.data;
    sellerTransacts.value = response.data;
  } catch (error) {
    console.error("❌ Fetch error:", error);
  }
};
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
