<template>
  <div class="q-pa-md">
    <q-input
      v-model="formattedPhone"
      label="Search by Phone (Auto Format: (xxx) xxx-xxxx)"
      outlined
      @input="formatPhone"
      @keyup.enter="fetchTransactions"
    />
    <q-btn label="Search" color="primary" @click="fetchTransactions" />

    <q-markup-table dark class="bg-indigo-8" v-if="transacts.length > 0">
      <thead>
        <tr>
          <th class="text-left">FirstName</th>
          <th class="text-right">LastName</th>
          <th class="text-right">Phone No.</th>
          <th class="text-right">TranNumber</th>
          <th class="text-right">TranAmount</th>
          <th class="text-right">TranStatus</th>
          <th class="text-right">Request Date</th>
          <th class="text-left">Email</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(transact, index) in transacts" :key="index">
          <td class="text-left">{{ transact.First_Name }}</td>
          <td class="text-right">{{ transact.Last_Name }}</td>
          <td class="text-right">{{ transact.Phone_Number }}</td>
          <td class="text-right">{{ transact.transact_number }}</td>
          <td class="text-right">$ {{ transact.transact_amount }}</td>
          <td class="text-right">{{ transact.tran_status }}</td>
          <td class="text-right">{{ formatDate(transact.req_date) }}</td>
          <td class="text-left">{{ transact.User_Email }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <!-- Total Amount -->
    <div v-if="transacts.length > 0" class="q-mt-md">
      <strong>Total Transaction Amount:</strong> $
      {{ formatCurrency(totalAmount) }}
    </div>

    <div v-else>No transactions found for the phone number.</div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import axios from "axios";
import { auth } from "src/firebase/init"; // Import Firebase auth

export default {
  setup() {
    const formattedPhone = ref(""); // Store formatted phone number
    const transacts = ref([]); // Store transactions

    // Function to auto-format the phone number
    const formatPhone = () => {
      const cleaned = formattedPhone.value.replace(/\D/g, ""); // Remove all non-numeric characters
      if (cleaned.length >= 10) {
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          formattedPhone.value = `(${match[1]}) ${match[2]}-${match[3]}`;
        }
      }
    };

    // Normalize the phone input for querying the backend
    const normalizePhone = (phoneInput) => {
      return phoneInput.replace(/\D/g, ""); // Remove all non-numeric characters
    };

    // --- Fetch transactions from MongoDB by phone number ---

    // --- Fetch transactions from MongoDB by phone number ---
    const fetchTransactions = async () => {
      const normalizedPhone = normalizePhone(formattedPhone.value); // Use normalized phone number for search

      if (normalizedPhone.length === 10) {
        try {
          // Get Firebase ID token
          const idToken = await auth.currentUser.getIdToken();

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
    };

    //--------------------------------------------------------------------------------------------------
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

    return {
      formattedPhone,
      transacts,
      fetchTransactions,
      formatPhone,
      formatDate,
      formatCurrency,
      totalAmount,
    };
  },
};
</script>
