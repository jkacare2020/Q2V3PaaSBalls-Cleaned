<template>
  <q-layout view="hHh lpR lFf">
    <q-header :elevated="useLightOrDark(true, false)">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <div class="absolute-center">
            <div class="toolbar-title-text">
              <q-icon name="savings" />
              PaaS-Balls
            </div>
          </div>
        </q-toolbar-title>

        <div>
          <!-- Avatar and Dropdown only render if the user is logged in -->
          <div v-if="user">
            <q-btn flat round @click.stop="toggleDropdown" class="q-ml-md">
              <q-avatar>
                <img :src="userAvatar || 'default-avatar.png'" />
              </q-avatar>
            </q-btn>
            <q-menu v-model="dropdownOpen">
              <q-list>
                <q-item clickable @click="goToProfile">
                  <q-item-section>Profile</q-item-section>
                </q-item>
                <q-item clickable @click="logout">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>

          <!-- Login button is shown only if the user is not logged in -->
          <div v-else>
            <q-btn flat round @click="$router.push('/login')" class="q-ml-md">
              Login
            </q-btn>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      class="bg-primary"
      :width="250"
      :breakpoint="767"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label class="text-white" header>Navigation</q-item-label>

        <NavLink
          v-for="link in navLinks"
          :key="link.title"
          :title="link.title"
          :icon="link.icon"
          :link="link.link"
          @closeDrawer="leftDrawerOpen = false"
        />

        <q-item
          v-if="$q.platform.is.electron"
          @click="quitApp"
          clickable
          class="text-white absolute-bottom"
          tag="a"
        >
          <q-item-section avatar>
            <q-icon name="power_settings_new" />
          </q-item-section>

          <q-item-section>
            <q-item-label>Quit</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";
import { useStoreAuth } from "src/stores/storeAuth"; // Import your auth store
import { useLightOrDark } from "src/use/useLightOrDark";
import NavLink from "components/Nav/NavLink.vue";
import { useRouter } from "vue-router";
import { useStoreUsers } from "src/stores/storeUsers";
const storeUsers = useStoreUsers();

const router = useRouter();
const $q = useQuasar();
const storeAuth = useStoreAuth(); // Use auth store
const user = computed(() => storeAuth.user); // Reactive user data
const userAvatar = ref("src/assets/avatar.jpg");
const leftDrawerOpen = ref(false);
const dropdownOpen = ref(false); // Define this to manage dropdown visibility
function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

const navLinks = [
  { title: "Entries", icon: "savings", link: "/" },
  { title: "Settings", icon: "settings", link: "/settings" },
  { title: "Login", icon: "login", link: "/login" },
  { title: "Signup", icon: "person_add", link: "/signup" },
];

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function quitApp() {
  $q.dialog({
    title: "Confirm",
    message: "Really quit PaaS-Balls?",
    cancel: true,
    persistent: true,
    html: true,
    ok: { label: "Quit", color: "negative", noCaps: true },
    cancel: { color: "primary", noCaps: true },
  }).onOk(() => {
    if ($q.platform.is.electron) ipcRenderer.send("quit-app");
  });
}

function goToProfile() {
  if (storeAuth.user) {
    router.push("/profile"); // Redirects to the User Profile page
    dropdownOpen.value = false; // Ensure dropdown closes
  } else {
    console.error("User is not logged in");
    router.push("/login"); // Redirect to login if the user is not logged in
  }
}

function logout() {
  // Perform the logout action
  storeAuth.logoutUser();

  storeUsers.clearUsers(); // Clear the user data from storeUsers and LocalStorage

  // Close the dropdown if it's open
  dropdownOpen.value = false;

  // Notify the user
  $q.notify({
    type: "negative",
    message: "Logged out successfully",
    timeout: 1500, // Show the notification for 1.5 seconds
  });

  // Redirect to the homepage or login page after the notification
  setTimeout(() => {
    router.push("/login"); // Redirect to the homepage (or use "/login" if needed)
  }, 1500); // Wait until notification is shown before redirecting
}
</script>
