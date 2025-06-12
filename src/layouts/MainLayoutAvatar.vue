<template>
  <q-layout view="hHh lpR lFf">
    <q-header :elevated="useLightOrDark(true, false)">
      <q-banner v-if="showAppInstallBanner" class="bubble-banner">
        <div>
          <b>Install SaaS-Balls as a native app?</b>
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
              SaaS-Balls
            </div>
          </div>
        </q-toolbar-title>

        <div>
          <div v-if="isLoggedIn">
            <q-btn flat round @click.stop="toggleDropdown" class="q-ml-md">
              <q-avatar>
                <img :src="finalAvatarUrl" />
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

          <div v-else-if="!isSignupPage">
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
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header class="text-white">Navigation</q-item-label>

        <q-item clickable v-ripple @click="$router.push('/')">
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Home</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="$router.push('/profile')">
          <q-item-section avatar><q-icon name="person" /></q-item-section>
          <q-item-section>Profile</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="$router.push('/camera')">
          <q-item-section avatar><q-icon name="camera_alt" /></q-item-section>
          <q-item-section>Camera</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="$router.push('/photos')">
          <q-item-section avatar><q-icon name="image" /></q-item-section>
          <q-item-section>Photos</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="$router.push('/resume-screened')">
          <q-item-section avatar><q-icon name="fact_check" /></q-item-section>
          <q-item-section>Screened Resumes</q-item-section>
        </q-item>

        <q-item clickable v-ripple @click="$router.push('/semantic-match')">
          <q-item-section avatar><q-icon name="psychology" /></q-item-section>
          <q-item-section>Semantic Matcher</q-item-section>
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
import { useQuasar, LocalStorage } from "quasar";
import { useStoreAuth } from "src/stores/storeAuth";
import { useStoreUsers } from "src/stores/storeUsers";
import { useRouter, useRoute } from "vue-router";
import { useLightOrDark } from "src/use/useLightOrDark";
import { auth, db } from "src/firebase/init";
import { collection, getDocs } from "firebase/firestore";

const storeUsers = useStoreUsers();
const storeAuth = useStoreAuth();
const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const leftDrawerOpen = ref(false);
const dropdownOpen = ref(false);
const userAvatar = ref("");

const finalAvatarUrl = computed(
  () => userAvatar.value || "src/assets/default-avatar.png"
);
const isLoggedIn = computed(() => !!storeAuth.user);
const isSignupPage = computed(() => route.path === "/signup");

watch(
  () => storeAuth.user,
  async (newUser) => {
    if (newUser) {
      await storeUsers.init();
      await loadAvatar(newUser.uid);
    }
  },
  { immediate: true }
);

async function loadAvatar(uid) {
  try {
    const avatarCollectionRef = collection(db, `users/${uid}/avatar`);
    const avatarSnapshot = await getDocs(avatarCollectionRef);
    if (!avatarSnapshot.empty) {
      const avatarDoc = avatarSnapshot.docs[0];
      userAvatar.value = avatarDoc.data().imageUrl || userAvatar.value;
    }
  } catch (err) {
    console.error("Error loading avatar from Firestore:", err);
  }
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function goToProfile() {
  if (storeAuth.user) {
    router.push("/profile");
    dropdownOpen.value = false;
  }
}

function logout() {
  storeAuth.logoutUser();
  storeUsers.clearUsers();
  dropdownOpen.value = false;
  $q.notify({
    type: "negative",
    message: "Logged out successfully",
    timeout: 1500,
  });
  setTimeout(() => {
    router.push("/login");
  }, 1500);
}

const showAppInstallBanner = ref(false);
let deferredPrompt = null;

const installApp = () => {
  showAppInstallBanner.value = false;
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        neverShowAppInstallBanner();
      }
    });
  }
};

const neverShowAppInstallBanner = () => {
  showAppInstallBanner.value = false;
  LocalStorage.set("neverShowAppInstallBanner", true);
};
</script>
