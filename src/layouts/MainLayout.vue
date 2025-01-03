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
          <div v-if="isLoggedIn">
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
                <q-item clickable @click="$router.push('/signup')">
                  <q-item-section>Signup</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </div>

          <!-- Login button is shown only if the user is not logged in and not on signup page -->
          <div v-else-if="!isSignupPage">
            <q-btn flat round @click="$router.push('/login')" class="q-ml-md">
              Login
            </q-btn>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <!-- ------------ Drawer  ------------------ -->
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
          :active-class="'active-link'"
        />

        <!-- Transacts Submenu -->
        <q-expansion-item
          icon="folder"
          class="text-white"
          label="Transactions"
          expand-separator
          dense
        >
          <q-item clickable v-ripple @click="navigateToViewEditTransactions">
            <q-item-section avatar>
              <q-icon name="table_chart" />
            </q-item-section>
            <q-item-section>View / Edit</q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateToNewTransaction">
            <q-item-section avatar>
              <q-icon name="add" />
            </q-item-section>
            <q-item-section>Create New</q-item-section>
          </q-item>
        </q-expansion-item>

        <!-- Users link: Ensure proper styling for interactive elements -->
        <q-item
          v-if="isAdmin"
          clickable
          class="text-white q-item--clickable"
          @click="goToPage('users')"
          :class="{ 'q-router-link--exact-active': isActive('users') }"
          :active-class="'q-router-link--exact-active'"
        >
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-white">Users</q-item-label>
          </q-item-section>
        </q-item>

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
import { ref, computed, watch } from "vue";
import { useQuasar } from "quasar";
import { useStoreAuth } from "src/stores/storeAuth";
import { useStoreUsers } from "src/stores/storeUsers";
import { useRouter, useRoute } from "vue-router";
import { useLightOrDark } from "src/use/useLightOrDark";
import NavLink from "components/Nav/NavLink.vue";

const storeUsers = useStoreUsers();
const storeAuth = useStoreAuth();
const router = useRouter();
const route = useRoute(); // Import useRoute to get current route
const $q = useQuasar();

const leftDrawerOpen = ref(false);
const dropdownOpen = ref(false); // Manage dropdown visibility
const userAvatar = ref("src/assets/mind_3D_image.png");

// Computed properties for checking logged-in status, admin role, and signup page
const isLoggedIn = computed(() => !!storeAuth.user); // True if a user is logged in
const isAdmin = computed(() => storeUsers.user?.role === "admin"); // True if user is admin
const isSignupPage = computed(() => route.path === "/signup"); // True if on signup page

// Watch for changes in the user data to trigger updates
watch(
  () => storeAuth.user,
  async (newUser) => {
    if (newUser) {
      await storeUsers.init(); // Initialize the store and load user data
    }
  },
  { immediate: true }
);

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

const navLinks = [
  { title: "Entries", icon: "savings", link: "/" },
  { title: "Settings", icon: "settings", link: "/settings" },
  { title: "Camera", icon: "eva-camera", link: "/camera" },
  { title: "VideoCamera", icon: "eva-video-outline", link: "/videoCamera" },
  { title: "Videos", icon: "eva-film-outline", link: "/videos" },
  { title: "Audios", icon: "eva-headphones-outline", link: "/audios" },
  { title: "Photos", icon: "image", link: "/photos" },
  {
    title: "All-Transacts",
    icon: "point_of_sale",
    link: "/mongo-AllTransacts",
  },
];

// Toggles the drawer's visibility
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

// Navigation function to go to different pages
function goToPage(page) {
  leftDrawerOpen.value = false; // Close drawer when navigating
  switch (page) {
    case "users":
      router.push("/users"); // Admin users list page
      break;
    default:
      break;
  }
}

function navigateToViewEditTransactions() {
  router.push("/mongo-transacts");
  leftDrawerOpen.value = false; // Close the drawer after navigation
}

function navigateToNewTransaction() {
  router.push("/new-transaction"); // Add the route for creating a new transaction
  leftDrawerOpen.value = false;
}

// Go to profile page of the logged-in user
function goToProfile() {
  if (storeAuth.user) {
    router.push("/profile"); // Redirects to the User Profile page
    dropdownOpen.value = false; // Ensure dropdown closes
  } else {
    console.error("User is not logged in");
    router.push("/login"); // Redirect to login if the user is not logged in
  }
}

// Logout function
function logout() {
  storeAuth.logoutUser();
  storeUsers.clearUsers(); // Clear user data from storeUsers and LocalStorage
  dropdownOpen.value = false; // Close the dropdown
  $q.notify({
    type: "negative",
    message: "Logged out successfully",
    timeout: 1500,
  });
  setTimeout(() => {
    router.push("/login"); // Redirect to login page
  }, 1500);
}

// Quit app function for electron platform
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

function isActive(page) {
  return router.currentRoute.value.path === `/${page}`;
}
</script>
