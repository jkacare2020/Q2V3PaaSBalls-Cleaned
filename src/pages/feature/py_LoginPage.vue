<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-lg shadow-2" style="width: 350px">
      <q-card-section>
        <div class="text-h6">HR User Authentication</div>
      </q-card-section>

      <q-card-section v-if="!isAuthenticated">
        <q-input v-model="username" label="Username" filled />
        <q-input v-model="password" label="Password" type="password" filled />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          v-if="!isAuthenticated"
          label="Login"
          color="primary"
          @click="login"
        />
        <q-btn v-else label="Logout" color="negative" @click="logout" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { apiFastAPI } from "boot/apiFastAPI";
import { jwtDecode } from "jwt-decode";
// ✅ Import decoder

const router = useRouter();
const $q = useQuasar();

const username = ref("");
const password = ref("");

// ✅ Check if the user is logged in
const isAuthenticated = computed(() => !!localStorage.getItem("access_token"));

// ✅ Login function
const login = async () => {
  try {
    const payload = new URLSearchParams();
    payload.append("grant_type", "password");
    payload.append("username", username.value);
    payload.append("password", password.value);

    const response = await apiFastAPI.post("/auth/token", payload, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const token = response.data.access_token;
    const decoded = jwtDecode(token); // ✅ Decode the JWT
    const userId = decoded.id; // ✅ Grab `id` from the payload
    const role = decoded.role; // (optional) Get role if needed

    localStorage.setItem("access_token", token);

    localStorage.setItem("user_id", userId); //✅Local Save Extract user_id from response

    localStorage.setItem("user_role", role); // Optional

    console.log("🔑 Stored Token:", token);
    console.log("🆔 Stored User ID:", userId);
    $q.notify({ type: "positive", message: "Login successful!" });

    router.push("/py_PageTodos"); // Redirect after login
  } catch (error) {
    $q.notify({
      type: "negative",
      message: "Login failed! Check your credentials.",
    });
  }
};

// ✅ Logout function
const logout = async () => {
  try {
    await apiFastAPI.post("/auth/logout"); // Notify backend

    localStorage.removeItem("access_token"); // Clear token
    $q.notify({ type: "positive", message: "Logged out successfully!" });

    router.push("/"); // Redirect to login page
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
</script>
