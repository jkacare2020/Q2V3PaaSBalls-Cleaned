<template>
  <q-layout view="hHh lpR lFf">
    <q-header :elevated="useLightOrDark(true, false)">
      <q-banner v-if="showAppInstallBanner" class="bubble-banner">
        <div>
          <b>Install PaaS-Balls as a native app?</b>
        </div>
        <div class="bubble-banner-buttons">
          <q-btn flat dense label="Yes" @click="installApp" color="white" />
          <q-btn
            flat
            dense
            label="Later"
            @click="showAppInstallBanner = false"
            color="white"
          />
          <q-btn
            flat
            dense
            label="Never"
            @click="neverShowAppInstallBanner"
            color="white"
          />
        </div>
      </q-banner>

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

    <!-- ------------Left side Drawer  ------------------ -->
    <!-- Left-side Navigation Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      class="bg-primary"
      :width="250"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header class="text-white">Navigation</q-item-label>

        <template v-for="category in navLinks" :key="category.category">
          <q-expansion-item
            :icon="category.icon"
            :label="category.category"
            expand-separator
          >
            <q-item
              v-for="link in category.links"
              :key="link.title"
              clickable
              v-ripple
              @click="$router.push(link.link)"
            >
              <q-item-section avatar>
                <q-icon :name="link.icon" />
              </q-item-section>
              <q-item-section>{{ link.title }}</q-item-section>
            </q-item>
          </q-expansion-item>
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useQuasar } from "quasar";
import { useStoreAuth } from "src/stores/storeAuth";
import { useStoreUsers } from "src/stores/storeUsers";
import { useRouter, useRoute } from "vue-router";
import { useLightOrDark } from "src/use/useLightOrDark";
import { LocalStorage } from "quasar";

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
  {
    category: "General",
    links: [
      { title: "Entries", icon: "savings", link: "/" },
      { title: "Settings", icon: "settings", link: "/settings" },
    ],
  },
  {
    category: "User Authentication",
    links: [
      { title: "Python Login", icon: "login", link: "/py_loginPage" },
      {
        title: "Python Register",
        icon: "person_add",
        link: "/py_registerPage",
      },
    ],
  },
  {
    category: "HR Agent",
    links: [
      { title: "HR Dashboard", icon: "work", link: "/hr-agent" },
      {
        title: "Job Descriptions",
        icon: "description",
        link: "/job-description",
      },
      {
        title: "Job Opening",
        icon: "description",
        link: "/public/job-opening",
      },
      { title: "Job Matching", icon: "sync", link: "/job-matching" },
      { title: "Resume History", icon: "history", link: "/resume-history" }, // ✅ Ensure this is correct
    ],
  },
  {
    category: "Media",
    links: [
      { title: "Camera", icon: "eva-camera", link: "/camera" },
      {
        title: "Video Camera",
        icon: "eva-video-outline",
        link: "/videoCamera",
      },
      { title: "Videos", icon: "eva-film-outline", link: "/videos" },
      { title: "Audios", icon: "eva-headphones-outline", link: "/audios" },
      {
        title: "Audio Files",
        icon: "eva-headphones-outline",
        link: "/audio-posts",
      },
      { title: "Photos", icon: "image", link: "/photos" },
    ],
  },
  {
    category: "Social & Chat",
    links: [
      { title: "ChatBot", icon: "message", link: "/chatBot" },
      { title: "Tenant", icon: "message", link: "/tenants" },
    ],
  },
  {
    category: "Transactions",
    links: [
      {
        title: "All Transactions",
        icon: "point_of_sale",
        link: "/mongo-AllTransacts",
      },
      {
        title: "View My Transactions",
        icon: "table_chart",
        link: "/mongo-mytransacts",
      },
      { title: "Create Transaction", icon: "add", link: "/new-transaction" },
    ],
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

function navigateToViewMyTransactions() {
  router.push("/mongo-mytransacts");
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

const showAppInstallBanner = ref(false);
let deferredPrompt = null;

// Handle "Install" button click
const installApp = () => {
  showAppInstallBanner.value = false;

  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
        neverShowAppInstallBanner();
      } else {
        console.log("User dismissed the install prompt");
      }
    });
  }
};

// Handle "Never" button click
const neverShowAppInstallBanner = () => {
  showAppInstallBanner.value = false;
  LocalStorage.set("neverShowAppInstallBanner", true);
};

// Detect install prompt
onMounted(() => {
  console.log("👀 Waiting for beforeinstallprompt...");

  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("✅ beforeinstallprompt fired!");

    e.preventDefault();
    deferredPrompt = e;

    // Only show banner if user hasn't chosen "Never"
    if (!LocalStorage.getItem("neverShowAppInstallBanner")) {
      showAppInstallBanner.value = true;
    }
  });

  // Optional: detect successful install
  window.addEventListener("appinstalled", () => {
    console.log("🎉 App was installed");
    $q.notify({
      type: "positive",
      message: "PaaS-Balls installed successfully!",
    });
  });
});
</script>
