<template>
  <!--Signup.vue--->
  <q-page class="q-pa-md">
    <q-card class="q-pa-md q-mx-auto" style="max-width: 400px">
      <q-card-section>
        <div class="text-h6">Sign Up</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="registerUser">
          <q-input
            v-model="credentials.email"
            filled
            label="Email"
            type="email"
            :rules="[(value) => !!value || 'Email is required']"
          />

          <q-input
            v-model="credentials.password"
            filled
            label="Password"
            type="password"
            :rules="[(value) => !!value || 'Password is required']"
          />

          <q-input
            v-model="credentials.firstName"
            filled
            label="First Name"
            :rules="[(value) => !!value || 'First name is required']"
          />

          <q-input
            v-model="credentials.lastName"
            filled
            label="Last Name"
            :rules="[(value) => !!value || 'Last name is required']"
          />

          <q-input
            v-model="formattedPhone"
            filled
            label="Phone Number"
            :rules="[
              (value) => !!normalizePhone(value) || 'Phone number is required',
            ]"
          />

          <q-input
            v-model="credentials.displayName"
            filled
            label="Display Name"
            :rules="[(value) => !!value || 'Display name is required']"
          />
          <q-input
            v-model="credentials.companyName"
            filled
            label="Company Name"
            :rules="[(value) => !!value || 'Display name is required']"
          />
          <q-input
            v-model="credentials.userName"
            filled
            label="Username"
            :rules="[(value) => !!value || 'Username is required']"
          />

          <q-btn
            label="Sign Up"
            type="submit"
            color="primary"
            class="q-mt-md full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useStoreAuth } from "src/stores/storeAuth";
import { useRouter } from "vue-router";
import { usePhoneFormat } from "src/use/formatPhone";
import { useQuasar } from "quasar"; // Import Quasar Notify
// import { collection, query, where, getDocs } from "firebase/firestore";
// import { db } from "src/firebase/init";

const authStore = useStoreAuth();
const router = useRouter();
const $q = useQuasar(); // Quasar instance for notifications

const credentials = ref({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNo: "",
  displayName: "",
  userName: "", // ✅ New field
  companyName: "",
});

const { formattedPhone, normalizePhone } = usePhoneFormat();

const loading = ref(false);

const registerUser = async () => {
  loading.value = true;
  try {
    // credentials.value.phoneNo = normalizePhone(formattedPhone.value); // Normalize phone before submission
    credentials.value.phoneNo = formattedPhone.value; // Save formatted phone number
    await authStore.registerUser(credentials.value, {
      firstName: credentials.value.firstName,
      lastName: credentials.value.lastName,
      phoneNo: credentials.value.phoneNo,
      displayName: credentials.value.displayName,
      email: credentials.value.email,
      companyName: credentials.value.companyName,
      userName: credentials.value.userName,
    });
    // Navigate to home page or dashboard after successful registration
    $q.notify({
      type: "positive",
      message: "Registration successful!",
      icon: "check_circle",
      position: "top",
    });
    router.push("/");
  } catch (error) {
    console.error("Error during registration:", error.message);
    const errorCode = error.code || "unknown";
    // Show user-friendly error message
    const errorMessage = getFirebaseErrorMessage(errorCode);
    $q.notify({
      type: "negative",
      message: errorMessage,
      position: "top",
      icon: "error",
    });
  } finally {
    loading.value = false;
  }
  // Function to handle Firebase error codes and return user-friendly messages
  function getFirebaseErrorMessage(errorCode) {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "This email is already in use. Please try another one.";
      case "auth/invalid-email":
        return "The email address is invalid. Please check and try again.";
      case "auth/weak-password":
        return "The password is too weak. Please choose a stronger password.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/operation-not-allowed":
        return "Operation not allowed. Contact support.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }
};
</script>
