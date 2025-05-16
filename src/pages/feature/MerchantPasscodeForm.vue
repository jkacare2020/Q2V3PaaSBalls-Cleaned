<template>
  <!--MerchantPasscodeForm.vue -->
  <q-form @submit.prevent="submitPasscode">
    <q-input v-model="passcode" label="Set Passcode" outlined />
    <q-btn label="Save" type="submit" color="primary" />
  </q-form>
</template>

<script setup>
import { ref } from "vue";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";
import { auth } from "src/firebase/init";

const $q = useQuasar();
const passcode = ref("");

async function submitPasscode() {
  try {
    const token = await auth.currentUser.getIdToken();
    await apiNode.post(
      "/api/access/set-passcode",
      { passcode: passcode.value },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    $q.notify({ message: "Passcode saved", color: "positive" });
  } catch (err) {
    console.error("Failed to save passcode:", err);
    $q.notify({ message: "Error saving passcode", color: "negative" });
  }
}
</script>
