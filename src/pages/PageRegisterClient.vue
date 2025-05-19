// src/pages/PageRegisterClient.vue
<template>
  <q-page class="q-pa-md">
    <q-form @submit.prevent="submitClientRegistration">
      <q-card class="q-pa-md q-mx-auto" style="max-width: 500px">
        <q-card-section>
          <div class="text-h6">Register New Client</div>
          <q-input
            v-model="form.email"
            label="Client Email"
            filled
            class="q-mt-md"
          />
          <q-input
            v-model="form.password"
            label="Temporary Password"
            filled
            type="password"
            class="q-mt-md"
          />
          <q-input
            v-model="form.firstName"
            label="First Name"
            filled
            class="q-mt-md"
          />
          <q-input
            v-model="form.lastName"
            label="Last Name"
            filled
            class="q-mt-md"
          />
          <q-input
            v-model="form.phoneNo"
            label="Phone Number"
            filled
            class="q-mt-md"
          />
          <q-input
            v-model="form.displayName"
            label="Display Name"
            filled
            class="q-mt-md"
          />
          <q-input
            v-model="form.companyName"
            label="Company Name"
            filled
            class="q-mt-md"
          />
          <q-input
            v-model="form.userName"
            label="Username"
            filled
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn type="submit" label="Register Client" color="primary" />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { apiNode } from "boot/apiNode";
import { auth } from "src/firebase/init";
import { useQuasar } from "quasar";

const $q = useQuasar();

const form = ref({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNo: "",
  displayName: "",
  companyName: "",
  userName: "",
});

async function submitClientRegistration() {
  const token = await auth.currentUser.getIdToken();
  try {
    await apiNode.post("/api/register-client", form.value, {
      headers: { Authorization: `Bearer ${token}` },
    });

    $q.notify({ type: "positive", message: "Client registered successfully" });
    Object.keys(form.value).forEach((key) => (form.value[key] = ""));
  } catch (err) {
    console.error("Client registration failed:", err);
    $q.notify({ type: "negative", message: "Failed to register client" });
  }
}
</script>
