<template>
  <q-page class="q-pa-md">
    <q-table
      title="Tenants"
      :rows="tenants"
      :columns="columns"
      row-key="tenant_number"
      flat
      bordered
    >
      <template v-slot:body-cell-actions="props">
        <q-btn
          flat
          icon="edit"
          @click="editTenant(props.row)"
          color="primary"
        />
        <q-btn
          flat
          icon="delete"
          @click="deleteTenant(props.row)"
          color="negative"
        />
      </template>
    </q-table>
    <q-btn
      label="Add Tenant"
      color="primary"
      @click="addTenant"
      class="q-mt-md"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter(); // Access the Vue Router instance

const tenants = ref([]);
const columns = [
  {
    name: "tenant_number",
    label: "Tenant #",
    field: "tenant_number",
    align: "left",
  },
  {
    name: "First_Name",
    label: "First Name",
    field: "First_Name",
    align: "left",
  },
  { name: "Last_Name", label: "Last Name", field: "Last_Name", align: "left" },
  {
    name: "Phone_Number",
    label: "Phone Number",
    field: "Phone_Number",
    align: "left",
  },
  {
    name: "Service Plan",
    label: "Service Plan",
    field: "tenant_plan",
    align: "left",
  },
  {
    name: "Monthly Payment",
    label: "Monthly Payment",
    field: "payment_amount",
    align: "left",
  },
  { name: "actions", label: "Actions", field: "actions", align: "left" },
];

const fetchTenants = async () => {
  try {
    const response = await axios.get(`${process.env.API}/api/tenants`);
    tenants.value = response.data;
  } catch (error) {
    console.error("Error fetching tenants:", error);
  }
};

const addTenant = () => {
  // Navigate to the add tenant form
  router.push("/tenants/add");
};

const editTenant = (tenant) => {
  // Navigate to the edit tenant form with tenant data
  router.push({
    path: `/tenants/edit/${tenant._id}`, // Use the _id field instead of tenant_number
    state: { tenant },
  });
};

const deleteTenant = async (tenant) => {
  try {
    await axios.delete(`${process.env.API}/api/tenants/${tenant._id}`);
    fetchTenants();
  } catch (error) {
    console.error("Error deleting tenant:", error);
  }
};

onMounted(fetchTenants);
</script>
