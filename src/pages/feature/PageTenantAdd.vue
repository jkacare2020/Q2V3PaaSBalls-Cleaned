<template>
  <q-page class="q-pa-md">
    <q-form @submit="addTenant">
      <q-input v-model="tenant.First_Name" label="First Name" required />
      <q-input v-model="tenant.Last_Name" label="Last Name" required />
      <q-input
        v-model="tenant.Phone_Number"
        label="Phone Number"
        mask="(###) ###-####"
        required
      />
      <q-input
        v-model="tenant.tenant_plan"
        label="Tenant Plan"
        type="text"
        required
      />
      <q-input
        v-model="tenant.payment_amount"
        label="Payment Amount"
        type="number"
        required
      />

      <q-input v-model="tenant.tenant_email" label="Email" type="email" />
      <q-btn label="Add Tenant" type="submit" color="primary" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router"; // Use Vue Router hooks
import axios from "axios";
import { getAuth } from "firebase/auth";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";
const $q = useQuasar();
const auth = getAuth();

// const route = useRoute(); // Access the route parameters
const router = useRouter(); // Navigate to other pages

const tenant = ref({
  First_Name: "",
  Last_Name: "",
  Phone_Number: "",
  tenant_email: "",
  payment_amount: "",
  tenant_plan: "",
});

const addTenant = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    await apiNode.post("/api/tenants/add", tenant.value, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    router.push("/tenants");
  } catch (error) {
    console.error("Error adding tenant:", error);

    if (error.response && error.response.status === 400) {
      const message = error.response.data?.message;

      if (message === "Tenant already exists.") {
        $q.notify({
          type: "negative",
          message: "A tenant is already registered with your account.",
          position: "center", //
        });
      } else {
        $q.notify({
          type: "negative",
          message: message || "Failed to add tenant.",
          position: "center", //
        });
      }
    } else {
      $q.notify({
        type: "negative",
        message: "Server error. Please try again later.",
        position: "center", //
      });
    }
  }
};
</script>
