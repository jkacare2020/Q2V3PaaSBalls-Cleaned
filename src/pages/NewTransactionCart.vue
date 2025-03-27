<template>
  <q-page>
    <q-card>
      <q-card-section>
        <h4>Transaction Details</h4>
        <q-form>
          <q-input
            v-model="transactionData.First_Name"
            label="First Name"
            outlined
          />
          <q-input
            v-model="transactionData.Last_Name"
            label="Last Name"
            outlined
          />
          <q-input
            v-model="transactionData.Phone_Number"
            label="Phone Number"
            outlined
          />
          <q-input
            v-model="transactionData.User_Email"
            label="Email Address"
            outlined
          />
          <q-input
            v-model="transactionData.Payer_address"
            label="Shipping Address Street"
            outlined
          />
          <q-input
            v-model="transactionData.Payer_address_city"
            label="Shipping Address City"
            outlined
          />
          <q-input
            v-model="transactionData.Payer_address_state"
            label="Shipping Address State"
            outlined
          />
          <q-input
            v-model="transactionData.transact_amount"
            label="Transaction Amount"
            outlined
            type="number"
          />
          <q-input
            v-model="transactionData.check_type"
            label="Payment Method"
            outlined
            type="text"
          />
          <q-input
            v-model="transactionData.req_date"
            label="Transaction Request Date"
            outlined
            type="text"
          />
          <q-btn label="Submit Transaction" @click="submitTransaction" />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useQuasar } from "quasar";
import { getAuth } from "firebase/auth";
import { useRouter } from "vue-router";
import { apiNode } from "boot/apiNode";
const router = useRouter();

const auth = getAuth();

const $q = useQuasar();
const route = useRoute();
// const transactionData = ref({});

const transactionData = ref({
  req_date: "", // Initialize as empty
});

function formatDate(date) {
  // Format the date as yyyy-mm-dd
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Add leading zero
  const day = String(d.getDate()).padStart(2, "0"); // Add leading zero
  return `${year}-${month}-${day}`;
}

onMounted(() => {
  const queryData = route.query.transaction;
  if (queryData) {
    transactionData.value = JSON.parse(queryData);
    console.log("Loaded transaction data:", transactionData.value);
  } else {
    console.error("No transaction data passed to cart.");
  }

  transactionData.value.req_date = formatDate(new Date());
});

const isSubmitting = ref(false);

async function submitTransaction() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    // Retrieve the Firebase token
    const token = await auth.currentUser.getIdToken();

    await apiNode.post("/api/transactions/new", transactionData.value, {
      headers: { Authorization: `Bearer ${token}` },
    });

    $q.notify({
      color: "positive",
      message: "Transaction submitted successfully!",
      icon: "check",
      position: "center",
    });
    console.log("Transaction submitted successfully!");
    router.push("/mongo-mytransacts");
  } catch (error) {
    console.error("Error submitting transaction:", error);
    $q.notify({
      color: "negative",
      message: "Failed to submit transaction.",
      icon: "error",
      position: "center",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
