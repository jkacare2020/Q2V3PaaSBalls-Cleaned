<template>
  <div class="col-4 large-screen-only">
    <q-item class="fixed">
      <!-- <q-item-section avatar>
        <q-avatar size="48px">
          <img :src="avatarUrl" :alt="username" />
        </q-avatar>
      </q-item-section> -->

      <q-item-section>
        <q-item-label class="text-bold">{{ username }}</q-item-label>
        <q-item-label caption> {{ email }} </q-item-label>
      </q-item-section>
    </q-item>
    <div v-if="!isAuthenticated" class="q-pa-md q-mt-lg">
      <!-- <q-btn
        @click="goToSignup"
        label="Sign Up"
        color="primary"
        class="q-mt-md full-width"
      /> -->
    </div>
  </div>

  <!-- Search transactions by phone number -->
  <div class="q-mt-xl q-ml-sm q-mr-sm">
    <q-input
      v-model="formattedPhone"
      label="Search by Phone (Auto Format: (xxx) xxx-xxxx)"
      outlined
      @input="formatPhone"
      @keyup.enter="fetchTransactions"
    />
    <q-btn
      label="Search"
      color="primary"
      class="q-mt-sm"
      @click="fetchTransactions"
    />
  </div>

  <!-- Transactions Table -->
  <q-markup-table
    dark
    class="bg-indigo-8 q-mt-lg q-p-md q-ml-sm q-mr-sm"
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
        <th class="text-left">Request Date</th>
        <th class="text-left">Edit</th>
        <th class="text-left">Delete</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(transact, index) in transacts" :key="index">
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

  <!-- Total Amount -->
  <div v-if="transacts.length > 0" class="q-mt-md q-ml-sm">
    <strong> Total Transaction Amount:</strong>
    {{ formatCurrency(totalAmount) }}
  </div>

  <div v-else>No transactions found for the phone number.</div>
</template>

<script setup>
import { useStoreAuth } from "src/stores/storeAuth";
import { ref, onMounted, computed, watch } from "vue";
import axios from "axios";
import { db, storage } from "src/firebase/init"; // Import Firestore and Storage instances
import { collection, getDocs } from "firebase/firestore"; // Import Firestore functions
import defaultAvatar from "src/assets/avatar.jpg"; // Import default avatar
import { useRouter } from "vue-router";
import { auth } from "src/firebase/init"; // Adjust the path as needed
import { useQuasar } from "quasar";
import { apiNode, nodeApiBaseURL } from "boot/apiNode"; // ✅ Make sure to import it
const $q = useQuasar();

const router = useRouter();

const storeAuth = useStoreAuth();
const avatarUrl = ref(defaultAvatar);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");
const isAuthenticated = ref(false);
const formattedPhone = ref("");
const transacts = ref([]);

const editForm = ref({});
const editDialog = ref(false);

onMounted(async () => {
  if (storeAuth.user) {
    username.value = storeAuth.user.displayName;
    email.value = storeAuth.user.email;
    isAuthenticated.value = true;

    // Fetch avatar from users collection's avatar subcollection
    try {
      const avatarCollectionRef = collection(
        db,
        `users/${storeAuth.user.uid}/avatar`
      );
      const avatarSnapshot = await getDocs(avatarCollectionRef);
      if (!avatarSnapshot.empty) {
        const avatarDoc = avatarSnapshot.docs[0]; // Assume there is only one avatar
        avatarUrl.value = avatarDoc.data().imageUrl;
      }
    } catch (error) {
      console.error("Error fetching avatar: ", error);
    }
  }
});

// Watch the phone number input and auto-format it
watch(formattedPhone, (newPhone) => {
  formatPhone(newPhone);
});

function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, ""); // Remove all non-numeric characters
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      formattedPhone.value = `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
}

async function fetchTransactions() {
  const normalizedPhone = formattedPhone.value.replace(/\D/g, ""); // Use normalized phone number for search

  if (normalizedPhone.length === 10) {
    try {
      // Get Firebase ID token
      const idToken = await storeAuth.user.getIdToken();

      // Make the request with the Authorization header
      const response = await apiNode.get(
        `/api/mongo-transacts?phone=${normalizedPhone}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`, // Include token in Authorization header
          },
        }
      );

      console.log("Transact Backend URL:", nodeApiBaseURL);

      // Handle response data
      if (response.data && response.data.length > 0) {
        transacts.value = response.data;
        $q.notify({
          color: "positive",
          message: "Transactions fetched successfully!",
          icon: "check",
          position: "top",
        });
      } else {
        transacts.value = []; // Clear the table if no records are found
        $q.notify({
          color: "warning",
          message: "No transactions found for this phone number.",
          icon: "warning",
          position: "top",
        });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      $q.notify({
        color: "negative",
        message: "Failed to fetch transactions.",
        icon: "error",
        position: "center",
      });
    }
  } else {
    $q.notify({
      color: "warning",
      message: "Please enter a valid 10-digit phone number.",
      icon: "warning",
      position: "center",
    });
  }
}

//------------------------------------------------------
const isLoading = ref(false);

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
    const response = await apiNode.get(`api/transactions/${transactId}`, {
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

  try {
    // Show confirmation dialog
    const result = await $q
      .dialog({
        title: "Confirm",
        message: "Are you sure you want to delete this transaction?",
        cancel: true,
        persistent: true,
      })
      .onOk();

    // if (!result) {
    //   console.log("Delete action canceled by the user.");
    //   return; // User canceled the action
    // }

    // Make the delete request
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
    fetchTransactions();
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
