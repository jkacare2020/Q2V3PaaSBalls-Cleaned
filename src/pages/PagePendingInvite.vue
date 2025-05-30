<template>
  <q-page class="q-pa-md">
    <div v-if="pendingMerchant">
      <q-banner class="bg-primary text-white q-mb-md">
        You have a pending invitation from
        <strong>{{ pendingMerchant.displayName }}</strong
        >.
      </q-banner>
      <q-btn label="Accept" color="positive" @click="acceptInvite" />
      <q-btn label="Decline" color="negative" flat @click="declineInvite" />
    </div>
    <div v-else>No pending invitations.</div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";
import { useStoreUsers } from "src/stores/storeUsers";
import { doc, getDoc } from "firebase/firestore";
import { db } from "src/firebase/init";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();
const storeUsers = useStoreUsers();
const pendingMerchant = ref(null);

onMounted(async () => {
  const merchantId = storeUsers.user?.pendingInvite?.merchantId;
  if (!merchantId) return;

  try {
    const merchantDoc = await getDoc(doc(db, "users", merchantId));
    if (merchantDoc.exists()) {
      pendingMerchant.value = merchantDoc.data();
    } else {
      console.warn("❌ Merchant document not found:", merchantId);
    }
  } catch (err) {
    console.error("🔥 Error loading merchant invite:", err);
    $q.notify({ type: "negative", message: "Failed to load merchant info." });
  }
});

async function acceptInvite() {
  try {
    const token = await auth.currentUser.getIdToken();
    await apiNode.post(
      "/api/invites/accept",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    $q.notify({ type: "positive", message: "You are now connected!" });
    // pendingMerchant.value = null;
    // ⬇️ Reload user data and navigate away
    const storeUsers = useStoreUsers();
    await storeUsers.init(); // Reload to clear pendingInvite from store
    router.push("/"); // Go to homepage
  } catch (err) {
    console.error("Failed to accept invite", err);
    $q.notify({ type: "negative", message: "Failed to accept invitation." });
  }
}

async function declineInvite() {
  try {
    const token = await auth.currentUser.getIdToken();
    await apiNode.post(
      "/api/invites/decline",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    $q.notify({ type: "info", message: "Invitation declined." });

    const storeUsers = useStoreUsers();
    await storeUsers.init(); // Reload updated user state
    router.push("/");
  } catch (err) {
    console.error("Failed to decline invite", err);
    $q.notify({ type: "negative", message: "Failed to decline invitation." });
  }
}
</script>
