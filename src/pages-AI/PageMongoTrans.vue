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
      <q-btn
        @click="goToSignup"
        label="Sign Up"
        color="primary"
        class="q-mt-md full-width"
      />
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

const storeAuth = useStoreAuth();
const avatarUrl = ref(defaultAvatar);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");
const isAuthenticated = ref(false);
const formattedPhone = ref("");
const transacts = ref([]);

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
      const response = await axios.get(
        `${process.env.API}/mongo-transacts?phone=${normalizedPhone}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`, // Include token in Authorization header
          },
        }
      );

      console.log("Transact Backend URL:", process.env.API);
      transacts.value = response.data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  } else {
    alert("Please enter a valid 10-digit phone number.");
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
