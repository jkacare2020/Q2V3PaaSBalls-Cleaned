<template>
  <q-page class="q-pa-md">
    <q-form @submit.prevent="editTenant">
      <q-input v-model="tenant.First_Name" label="First Name" required />
      <q-input v-model="tenant.Last_Name" label="Last Name" required />
      <q-input v-model="tenant.tenant_plan" label="Service Plan" required />
      <q-input v-model="tenant.payment_amount" label="Monthly Fee" required />
      <q-input
        v-model="tenant.Phone_Number"
        label="Phone Number"
        mask="(###) ###-####"
        required
      />
      <q-input v-model="tenant.tenant_email" label="Email" type="email" />
      <q-btn label="Save Changes" type="submit" color="primary" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router"; // Use Vue Router hooks
import axios from "axios";
import { apiNode } from "boot/apiNode";

const tenant = ref({});
const route = useRoute(); // Access the route parameters
const router = useRouter(); // Navigate to other pages

const fetchTenant = async () => {
  try {
    const response = await apiNode.get(
      `/api/tenants/${route.params.id}` // Fetch tenant by ID
    );
    tenant.value = response.data;
  } catch (error) {
    console.error("Error fetching tenant:", error);
  }
};

const editTenant = async () => {
  try {
    await apiNode.put(
      `/api/tenants/${route.params.id}`, // Update tenant by ID
      tenant.value
    );
    router.push("/tenants"); // Navigate back to the tenant list
  } catch (error) {
    console.error("Error editing tenant:", error);
  }
};

onMounted(fetchTenant); // Fetch tenant data on component mount
</script>
