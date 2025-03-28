<template>
  <q-page>
    <q-card>
      <q-card-section>
        <q-spinner v-if="loading" size="lg" color="primary" />
        <q-form v-else>
          <q-input
            v-model="transactionForm.First_Name"
            label="First Name"
            outlined
          />
          <q-input
            v-model="transactionForm.Last_Name"
            label="Last Name"
            outlined
          />
          <q-input
            v-model="transactionForm.Phone_Number"
            label="Phone Number (Auto Format: (xxx) xxx-xxxx)"
            outlined
            @input="formatPhone"
          />
          <q-input
            v-model="transactionForm.User_Email"
            label="Email Address"
            outlined
          />
          <q-input
            v-model="transactionForm.Payer_address"
            label="Shipping Address Street"
            outlined
          />
          <q-input
            v-model="transactionForm.Payer_address_city"
            label="Shipping Address City"
            outlined
          />
          <q-input
            v-model="transactionForm.Payer_address_state"
            label="Shipping Address State"
            outlined
          />
          <q-input
            v-model="transactionForm.check_type"
            label="Payment Method"
            outlined
          />
          <q-btn label="Yes, Proceed to Cart" @click="proceedToCart" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "src/firebase/init";
import { useStoreAuth } from "src/stores/storeAuth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "vue-router";
import { apiNode } from "boot/apiNode";
import { nodeApiBaseURL } from "boot/apiNode"; // ✅ Add at top

const router = useRouter();

onAuthStateChanged(auth, (user) => {
  if (user) {
    storeAuth.user = user; // Restore user state in the store
    console.log("User is logged in:", user);
  } else {
    console.log("User is not logged in.");
    router.push("/login"); // Redirect to login page if unauthenticated
  }
});

const loading = ref(false); // Loading state
const storeAuth = useStoreAuth();
const userProfile = reactive({
  phoneNo: "",
  email: "",
  shippingAddress: "",
});
const transactionForm = reactive({
  First_name: "",
  Last_Name: "",
  Phone_Number: "",
  Payer_address: "",
  Payer_address_city: "",
  Payer_address_state: "",
  check_type: "",
  transact_amount: 0,
  tran_status: "",
  User_Email: "",
  date: new Date(),
});

function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, ""); // Remove all non-numeric characters
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      transactionForm.Phone_Number = `(${match[1]}) ${match[2]}-${match[3]}`;
    } else {
      transactionForm.Phone_Number = cleaned; // Keep partially typed numbers
    }
  } else {
    transactionForm.Phone_Number = cleaned;
  }
}

// Watcher for auto-formatting the phone number in real-time
watch(
  () => transactionForm.Phone_Number,
  (newPhone) => {
    formatPhone(newPhone);
  }
);

onMounted(async () => {
  loading.value = true; // Start loading
  const userId = storeAuth.user?.uid;

  if (!userId) {
    console.error("User is not logged in.");
    loading.value = false;
    return;
  }

  try {
    // Fetch the user's full profile from Firestore
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      Object.assign(userProfile, userDoc.data());
      console.log("User profile loaded:", userProfile);
      console.log("user phone #", userProfile.phoneNo);
      console.log("✅ Backend API Base URL:", nodeApiBaseURL);

      // Use phoneNo to fetch transaction history
      const response = await apiNode.get(
        `/api/transactions/history/${userProfile.phoneNo}`
      );
      if (response.data.lastTransaction) {
        Object.assign(transactionForm, response.data.lastTransaction);
      } else {
        console.log("No previous transactions found for this user.");
      }
    } else {
      console.error("User profile not found in Firestore.");
    }
  } catch (error) {
    console.error("Error fetching user profile or transactions:", error);
  } finally {
    loading.value = false; // Stop loading
  }
});

function proceedToCart() {
  router.push({
    name: "CartPage",
    query: { transaction: JSON.stringify(transactionForm) },
  });
}
</script>
