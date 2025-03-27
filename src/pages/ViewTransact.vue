<template>
  <q-page class="q-pa-md">
    <q-card class="bg-light q-py-md q-px-lg">
      <q-card-section>
        <q-form @submit.prevent="updateTransact">
          <q-input
            v-model="transactInfo.transact_number"
            label="Transaction Number"
            outlined
            dense
            class="q-mb-md"
            type="number"
          />
          <q-input
            v-model="transactInfo.First_Name"
            label="Customer First Name"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Last_Name"
            label="Customer Last Name"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Payer_address"
            label="Address"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Payer_address_city"
            label="City"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Payer_address_state"
            label="State"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Payer_address_zip"
            label="Zip Code"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Payer_address_country"
            label="Country"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.Phone_Number"
            label="Phone Number"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.User_Email"
            label="Email"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.transact_amount"
            label="Transaction Amount"
            outlined
            dense
            class="q-mb-md"
            type="number"
            :step="0.01"
          />
          <q-input
            v-model="transactInfo.description"
            label="Description"
            outlined
            dense
            class="q-mb-md"
          />
          <q-input
            v-model="transactInfo.tran_status"
            label="Transaction Status"
            outlined
            dense
            class="q-mb-md"
            type="text"
          />

          <q-btn
            label="Update"
            color="primary"
            type="submit"
            class="q-mt-md"
            unelevated
            rounded
          />
          <q-btn
            label="Cancel"
            color="secondary"
            class="q-ml-sm q-mt-md"
            outline
            rounded
            @click="cancelUpdate"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import axios from "axios";
import { apiNode, nodeApiBaseURL } from "boot/apiNode"; // ✅ Make sure to import it

import { watch } from "vue";

const router = useRouter();
const $q = useQuasar();

const transactInfo = reactive({
  First_Name: "",
  Last_Name: "",
  Payer_address: "",
  Payer_address_city: "",
  Payer_address_state: "",
  Payer_address_zip: "",
  Payer_address_country: "",
  Phone_Number: "",
  User_Email: "",
  transact_amount: 0.0,
  transact_number: 0,
  description: "",
  tran_status: "",
});

watch(
  () => transactInfo,
  (newValue) => {
    console.log("transactInfo updated:", newValue);
  },
  { deep: true },

  () => transactInfo.transact_amount,
  (newValue) => {
    console.log("Transaction Amount Updated:", newValue);
  }
);

const transactId = router.currentRoute.value.params.transactId;

console.log("ViewTransact.vue: The transactId  is ", transactId);
console.log(
  "ViewTransact.vue: Current route object:",
  router.currentRoute.value
);

onMounted(() => {
  console.log(
    "ViewTransact.vue: Mounted. Current route object:",
    router.currentRoute.value
  );

  if (transactId) {
    fetchTransactInfo(); // Only call it once
  } else {
    console.error("transactId is undefined.");
  }
});

async function fetchTransactInfo() {
  try {
    console.log("ViewTransact Fetching transaction info for ID:", transactId);
    const response = await apiNode.get(`/api/transactions/${transactId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("idToken")}` },
    });
    console.log("Transaction data fetched successfully:", response.data);

    Object.assign(transactInfo, response.data);
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Failed to fetch transaction details.",
    });
    console.error("Error fetching transaction info:", error);
  }
}

//------------------------------------------

async function updateTransact() {
  try {
    console.log("ViewTransact UPDATING transaction info for ID:", transactId);
    await apiNode.put(
      `/api/transactions/${transactId}`,
      { ...transactInfo },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("idToken")}` },
      }
    );
    $q.notify({
      type: "positive",
      message: "Transaction updated successfully!",
      position: "center",
    });
    // router.push("/mongo-transacts");
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Failed to update transaction.",
      position: "center",
    });
    console.error(error);
  }
}

function cancelUpdate() {
  router.push("/mongo-transacts");
}
</script>

<style scoped>
.q-card {
  max-width: 600px;
  margin: auto;
}
</style>
