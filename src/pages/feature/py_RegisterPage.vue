<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-lg shadow-2" style="width: 400px">
      <q-card-section>
        <div class="text-h6">Register with FastAPI</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="username" label="Username" filled />
        <q-input v-model="email" label="Email" type="email" filled />
        <q-input v-model="first_name" label="First Name" filled />
        <q-input v-model="last_name" label="Last Name" filled />
        <q-input v-model="phone_number" label="Phone Number" filled />
        <q-select
          v-model="role"
          label="Role"
          :options="['user', 'admin']"
          filled
        />
        <q-input v-model="password" label="Password" type="password" filled />
        <q-input
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          filled
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="Register" color="primary" @click="register" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { apiFastAPI } from "boot/apiFastAPI";

const router = useRouter();
const $q = useQuasar();

const username = ref("");
const email = ref("");
const first_name = ref("");
const last_name = ref("");
const phone_number = ref("");
const role = ref("user"); // Default role
const password = ref("");
const confirmPassword = ref("");

const register = async () => {
  if (password.value !== confirmPassword.value) {
    $q.notify({ type: "negative", message: "Passwords do not match!" });
    return;
  }

  try {
    const response = await apiFastAPI.post(
      "/auth/",
      {
        username: username.value,
        email: email.value,
        first_name: first_name.value,
        last_name: last_name.value,
        phone_number: phone_number.value,
        role: role.value,
        password: password.value,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 201) {
      $q.notify({ type: "positive", message: "Registration successful!" });
      router.push("/py_loginPage"); // Redirect to login
    } else {
      $q.notify({ type: "negative", message: "Registration failed!" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    $q.notify({
      type: "negative",
      message: error.response?.data?.detail || "Unknown error",
    });
  }
};
</script>
