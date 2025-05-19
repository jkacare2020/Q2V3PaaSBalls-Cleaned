<template>
  <!---  src/pages/PageAssignClient.vue --->
  <q-page class="q-pa-md">
    <q-form @submit.prevent="submitAssignment">
      <q-card class="q-pa-md">
        <q-card-section>
          <div class="text-h6">Assign Client</div>
          <q-input v-model="clientEmail" label="Client Email" />
          <q-input v-model="clientPhone" label="Client Phone" />
          <q-input v-model="clientUserName" label="Client Username" />
        </q-card-section>
        <q-card-actions>
          <q-btn type="submit" label="Assign" color="primary" />
        </q-card-actions>
      </q-card>
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { apiNode } from "boot/apiNode";
import { auth, dbRealtime, db } from "src/firebase/init";
import { useQuasar } from "quasar";

const $q = useQuasar();
const clientEmail = ref("");
const clientPhone = ref("");
const clientUserName = ref("");

async function submitAssignment() {
  const token = await auth.currentUser.getIdToken();

  // Determine which field was filled
  let method = "";
  let value = "";

  if (clientUserName.value) {
    method = "userName";
    value = clientUserName.value;
  } else if (clientPhone.value) {
    method = "phone";
    value = clientPhone.value;
  } else if (clientEmail.value) {
    method = "email";
    value = clientEmail.value;
  } else {
    $q.notify({
      type: "warning",
      message: "Please fill in at least one field.",
    });
    return;
  }

  try {
    await apiNode.post(
      "/api/assign",
      { method, value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    $q.notify({ type: "positive", message: "Client assigned successfully" });
    clientEmail.value = "";
    clientPhone.value = "";
    clientUserName.value = "";
  } catch (err) {
    console.error("Assignment failed:", err);
    $q.notify({ type: "negative", message: "Failed to assign client" });
  }
}
</script>
