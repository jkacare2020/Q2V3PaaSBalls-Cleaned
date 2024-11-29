<template>
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
            v-model="credentials.companyName"
            filled
            label="Company Name"
            :rules="[(value) => !!value || 'Company name is required']"
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

const authStore = useStoreAuth();
const router = useRouter();

const credentials = ref({
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNo: "",
  companyName: "",
});

const { formattedPhone, normalizePhone } = usePhoneFormat();

const loading = ref(false);

const registerUser = async () => {
  loading.value = true;
  try {
    credentials.value.phoneNo = normalizePhone(formattedPhone.value); // Normalize phone before submission
    await authStore.registerUser(credentials.value, {
      firstName: credentials.value.firstName,
      lastName: credentials.value.lastName,
      phoneNo: credentials.value.phoneNo,
      companyName: credentials.value.companyName,
    });
    // Navigate to home page or dashboard after successful registration
    router.push("/");
  } catch (error) {
    console.error("Error during registration:", error.message);
  } finally {
    loading.value = false;
  }
};
</script>
