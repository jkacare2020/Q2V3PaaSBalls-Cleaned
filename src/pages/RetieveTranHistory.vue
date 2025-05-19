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

          <!-- ✅ NEW: ZIP and Country -->
          <q-input
            v-model="transactionForm.Payer_address_zip"
            label="Shipping ZIP Code"
            outlined
          />
          <q-input
            v-model="transactionForm.Payer_address_country"
            label="Shipping Country"
            outlined
          />

          <q-input
            v-model="transactionForm.check_type"
            label="Payment Method"
            outlined
          />

          <!-- ✅ NEW: Transaction Description -->
          <q-input
            v-model="transactionForm.description"
            type="textarea"
            label="Transaction Description"
            outlined
            autogrow
          />

          <q-btn label="Yes, Proceed to Cart" @click="proceedToCart" />
        </q-form>

        <q-banner class="bg-grey-3 q-mb-md" v-if="loadedFromHistory">
          Shipping and payment info pre-filled from your last transaction.
        </q-banner>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "src/firebase/init";
import { useStoreAuth } from "src/stores/storeAuth";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useRoute } from "vue-router";
import { apiNode } from "boot/apiNode";

const router = useRouter();
const route = useRoute();
const storeAuth = useStoreAuth();
const loading = ref(false);
const loadedFromHistory = ref(false);

const userProfile = reactive({
  phoneNo: "",
  email: "",
  shippingAddress: "",
});

// Define all expected fields to avoid undefined issues
const transactionForm = reactive({
  First_Name: "",
  Last_Name: "",
  Phone_Number: "",
  User_Email: "",
  Payer_address: "",
  Payer_address_city: "",
  Payer_address_state: "",
  Payer_address_zip: "",
  Payer_address_country: "",
  check_type: "",
  transact_amount: 0,
  tran_status: "",
  quantity: 1,
  description: "",
  transact_number: null,
  sellerId: "",
  sellerUserName: "",
  sellerDisplayName: "",
  assignedMerchant: "",
  owner: "",
  req_date: new Date(),
  createdAt: null,
  updatedAt: null,
});

function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      transactionForm.Phone_Number = `(${match[1]}) ${match[2]}-${match[3]}`;
    } else {
      transactionForm.Phone_Number = cleaned;
    }
  } else {
    transactionForm.Phone_Number = cleaned;
  }
}

watch(
  () => transactionForm.Phone_Number,
  (newPhone) => formatPhone(newPhone)
);

// Populate from query string (repeat order)
onMounted(() => {
  const queryData = route.query.transaction;
  if (queryData) {
    const cartParams = JSON.parse(queryData);
    Object.assign(transactionForm, cartParams);
    loadedFromHistory.value = true;
  }
});

// Auto-fetch last transaction from backend
onMounted(async () => {
  loading.value = true;
  const userId = storeAuth.user?.uid;

  if (!userId) {
    console.error("User is not logged in.");
    loading.value = false;
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      Object.assign(userProfile, userDoc.data());
      console.log("✅ User profile loaded:", userProfile);

      const response = await apiNode.get(
        `/api/transactions/history/${userProfile.phoneNo}`
      );
      if (response.data.lastTransaction) {
        const last = response.data.lastTransaction;

        // Sanitize _id from MongoDB
        delete last._id;

        // Assign to form
        Object.assign(transactionForm, last);
        loadedFromHistory.value = true;
        console.log("✅ Loaded last transaction:", last);
      } else {
        console.log("No previous transactions found.");
      }
    } else {
      console.error("User profile not found.");
    }
  } catch (error) {
    console.error("Error fetching user profile or transaction:", error);
  } finally {
    loading.value = false;
  }
});

function proceedToCart() {
  const payload = { ...transactionForm };

  // ✅ Strip _id for new creation
  delete payload._id;

  // ✅ Inject fallback seller info
  if (!payload.sellerId) {
    payload.sellerId = storeAuth.user?.uid || null;
    payload.sellerUserName = storeAuth.userProfile?.userName || "N/A";
    payload.sellerDisplayName = storeAuth.userProfile?.displayName || "N/A";
  }

  // ✅ Also inject owner (buyer)
  if (!payload.owner) {
    payload.owner = storeAuth.user?.uid || null;
  }

  router.push({
    name: "CartPage_NewTransaction",
    query: { transaction: JSON.stringify(payload) },
  });
}
</script>
