<template>
  <!---PageTenantList.vue--->
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
import { useRouter } from "vue-router";
import { apiNode } from "boot/apiNode";
import { getAuth } from "firebase/auth";

import { useQuasar } from "quasar";
const $q = useQuasar();

import { onAuthStateChanged } from "firebase/auth";
const auth = getAuth();

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
//----------------------------------------------
const fetchTenants = async () => {
  try {
    if (!auth.currentUser) {
      console.warn("❌ No user is currently logged in.");
      return;
    }

    const token = await auth.currentUser.getIdToken();

    const response = await apiNode.get(`/api/tenants`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    tenants.value = response.data;
  } catch (error) {
    console.error("Error fetching tenants:", error);
  }
};
//-----------------------------------------------------

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
    await apiNode.delete(`/api/tenants/${tenant._id}`);
    fetchTenants();
  } catch (error) {
    console.error("Error deleting tenant:", error);
  }
};

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("User not logged in");
      return;
    }

    const token = await user.getIdTokenResult();
    const roles = Array.isArray(token.claims.role)
      ? token.claims.role
      : [token.claims.role];

    if (roles.includes("admin")) {
      fetchTenants();
    } else {
      console.warn("❌ Access denied: Not an admin.");
      $q.notify({
        type: "warning",
        message: "Access denied. Admins only.",
        icon: "lock",
        position: "top",
      });
    }
  });
});
</script>
