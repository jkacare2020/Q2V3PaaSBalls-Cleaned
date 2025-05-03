<template>
  <!---PageTenantAdd.vue--->
  <q-page class="q-pa-md">
    <q-form @submit.prevent="submitTenant">
      <q-input v-model="tenant.First_Name" label="First Name" />
      <q-input v-model="tenant.Last_Name" label="Last Name" />
      <q-input v-model="tenant.tenant_email" label="Email" readonly />
      <q-input v-model="tenant.Phone_Number" label="Phone Number" />
      <q-select
        v-model="tenant.tenant_plan"
        label="Plan"
        :options="['Basic', 'Premium']"
      />
      <q-btn label="Submit" type="submit" color="primary" class="q-mt-md" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "src/firebase/init";

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const selectedRole = route.query.role || "buyer"; // fallback

const tenant = ref({
  First_Name: "",
  Last_Name: "",
  Phone_Number: "",
  tenant_email: "",
  payment_amount: 0,
  tenant_plan: "Basic",
  tenant_role: selectedRole, // 👈 include this
});

// 🔄 Load current user data from Firestore
const loadUserData = async () => {
  const user = auth.currentUser;
  console.log(user.phoneNo);
  if (!user) return;

  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    tenant.value.First_Name = data.firstName || "";
    tenant.value.Last_Name = data.lastName || "";
    tenant.value.tenant_email = user.email;
    tenant.value.Phone_Number = data.phoneNo || "";
  }
};

// ✅ Submit + Error handling
const submitTenant = async () => {
  const token = await auth.currentUser.getIdToken();

  try {
    await apiNode.post("/api/tenants/add", tenant.value, {
      headers: { Authorization: `Bearer ${token}` },
    });

    $q.notify({ type: "positive", message: "Tenant profile created!" });
    router.push("/post-product");
  } catch (error) {
    console.error("Error adding tenant:", error);

    if (error.response && error.response.status === 400) {
      const message = error.response.data?.message;

      if (message === "Tenant already exists.") {
        $q.notify({
          type: "negative",
          message: "A tenant is already registered with your account.",
          position: "center",
        });
        router.push("/post-product");
      } else {
        $q.notify({
          type: "negative",
          message: message || "Failed to add tenant.",
          position: "center",
        });
      }
    } else {
      $q.notify({
        type: "negative",
        message: "Server error. Please try again later.",
        position: "center",
      });
    }
  }
};

// 🔁 Call loadUserData when component mounts
onMounted(() => {
  loadUserData();
});
</script>
