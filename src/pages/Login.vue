<template>
  <!--Login.vue -->
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
import { auth, dbRealtime } from "src/firebase/init";
import { ref as dbRef, set, onDisconnect } from "firebase/database";
import { ref } from "vue";
import { useStoreAuth } from "../stores/storeAuth";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { apiNode } from "boot/apiNode";
import { useStoreUsers } from "src/stores/storeUsers"; // ⬅️ Add this line

const email = ref("");
const password = ref("");
const storeAuth = useStoreAuth();
const router = useRouter();
const $q = useQuasar();

// Firebase error message mapping function
function getFriendlyErrorMessage(errorCode) {
  const errorMessages = {
    "auth/invalid-email":
      "The email address is invalid. Please check and try again.",
    "auth/user-disabled":
      "This user account has been disabled. Contact support for help.",
    "auth/user-not-found":
      "No account found with this email. Please check or sign up.",
    "auth/wrong-password":
      "The password you entered is incorrect. Please try again.",
    "auth/too-many-requests":
      "Too many failed attempts. Please wait and try again later.",
  };

  return (
    errorMessages[errorCode] ||
    "Failed to login. Please check your credentials."
  );
}
//---------------------------------
async function login() {
  try {
    await storeAuth.loginUser({ email: email.value, password: password.value });

    const storeUsers = useStoreUsers(); // Inject user store
    await storeUsers.init(); // ⬅️ Load latest user document

    // ✅ Mark online in Realtime Database
    const userId = storeAuth.user.uid;
    const userPresenceRef = dbRef(dbRealtime, `usersPresence/${userId}`);
    await set(userPresenceRef, {
      online: true,
      lastSeen: Date.now(),
    });
    await apiNode.post(
      "/api/comments/markOnline",
      {},
      {
        headers: {
          Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
        },
      }
    );
    onDisconnect(userPresenceRef).set({
      online: false,
      lastSeen: Date.now(),
    });

    // ✅ Conditional redirect
    if (storeUsers.user?.pendingInvite?.merchantId) {
      router.push("/pending-invite");
    } else {
      router.push("/front-page");
    }

    $q.notify({
      color: "positive",
      message: "Login successful! Welcome back.",
      icon: "check",
      position: "top",
    });
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error.code);
    console.error("Login error:", error);
    $q.notify({
      color: "negative",
      message: friendlyMessage,
      icon: "error",
      position: "top",
    });
  }
}

// Go to profile page of the logged-in user
function goToSignup() {
  if (!storeAuth.user) {
    router.push("/signup"); // Redirects to the User Profile page
    // dropdownOpen.value = false; // Ensure dropdown closes
  } else {
    console.error("User is logged in");
    router.push("/profile"); // Redirect to login if the user is not logged in
  }
}
</script>

<style scoped>
.full-width {
  width: 100%;
}
</style>
