<template>
  <q-page class="flex flex-center">
    <q-card style="width: 300px">
      <q-card-section>
        <div class="text-h6">Login</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="login">
          <q-input filled v-model="email" label="Email" type="email" />
          <q-input filled v-model="password" label="Password" type="password" />
          <div class="q-mt-md">
            <q-btn
              label="Login"
              type="submit"
              color="primary"
              class="full-width"
            />
          </div>
        </q-form>

        <!-- Add "Not registered yet?" link for signup -->
        <div class="q-mt-md text-center">
          <span>Not registered yet?</span>
          <q-btn flat label="Sign Up" color="primary" @click="goToSignup" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useStoreAuth } from "../stores/storeAuth";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const storeAuth = useStoreAuth();
const router = useRouter();

function login() {
  storeAuth
    .loginUser({ email: email.value, password: password.value })
    .then(() => {
      router.push("/"); // Redirect after login
    })
    .catch((error) => {
      console.error(error);
      alert(error.message); // Simple error feedback
    });
}

function goToSignup() {
  router.push("/signup"); // Redirect to the signup page
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
