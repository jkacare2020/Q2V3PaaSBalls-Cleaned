<template>
  <router-view />
</template>

<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useStoreSettings } from "src/stores/storeSettings";
import { useStoreEntries } from "src/stores/storeEntries";
import { useStoreAuth } from "src/stores/storeAuth"; // Ensure the path is correct
import { useStoreUsers } from "src/stores/storeUsers";
const storeUsers = useStoreUsers();

defineOptions({
  name: "App",
});

const storeSettings = useStoreSettings(),
  storeEntries = useStoreEntries(),
  storeAuth = useStoreAuth(), // Use the auth store
  $q = useQuasar(),
  router = useRouter();

onMounted(() => {
  storeSettings.loadSettings();
  storeEntries.loadEntries();
  storeAuth.init(); // Initialize authentication

  if (!storeUsers.userLoaded) {
    storeUsers.init(); // Ensure user data is fetched when the app mounts
  }

  if ($q.platform.is.electron) {
    ipcRenderer.on("show-settings", () => {
      router.push("/settings");
    });
  }
});

// window.addEventListener('contextmenu', e => {
//   e.preventDefault()
// })
</script>
