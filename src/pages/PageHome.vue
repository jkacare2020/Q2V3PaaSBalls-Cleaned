<template>
  <q-page class="constrain q-pa-md">
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div
        v-if="showNotificationsBanner && pushNotificationsSupported"
        class="banner-container bg-primary"
      >
        <div class="constrain">
          <q-banner class="bg-grey-3 q-mb-md">
            <template v-slot:avatar>
              <q-icon name="eva-bell-outline" color="primary" />
            </template>

            Would you like to enable notifications?

            <template v-slot:action>
              <q-btn
                @click="enableNotifications"
                label="Yes"
                color="primary"
                class="q-px-sm"
                dense
                flat
              />
              <q-btn
                @click="showNotificationsBanner = false"
                label="Later"
                color="primary"
                class="q-px-sm"
                dense
                flat
              />
              <q-btn
                @click="neverShowNotificationsBanner"
                label="Never"
                color="primary"
                class="q-px-sm"
                dense
                flat
              />
            </template>
          </q-banner>
        </div>
      </div>
    </transition>
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingPosts && posts.length">
          <q-card
            v-for="post in posts"
            :key="post.id"
            class="card-post q-mb-md"
            :class="{ 'bg-red-1': post.offline }"
            bordered
            flat
          >
            <q-badge
              v-if="post.offline"
              class="badge-offline absolute-top-right"
              color="red"
            >
              Stored offline
            </q-badge>

            <!-- New delete icon -->
            <q-icon
              name="delete"
              color="red"
              class="delete-icon absolute"
              size="24px"
              aria-label="Delete post"
              @click="deletePost(post.id)"
              tabindex="0"
            />

            <q-item>
              <q-item-section avatar>
                <q-avatar>
                  <img :src="avatarUrl" :alt="username" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-bold">{{ username }}</q-item-label>
                <q-item-label caption>
                  {{ post.location }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-img :src="post.imageUrl" />

            <q-card-section>
              <div>{{ post.caption }}</div>
              <div class="text-caption text-grey">
                {{ niceDate(post.date) }}
              </div>
            </q-card-section>
          </q-card>
        </template>
        <template v-else-if="!loadingPosts && !posts.length">
          <h5 class="text-center text-grey">No posts yet.</h5>
        </template>
        <template v-else>
          <q-card flat bordered>
            <q-item>
              <q-item-section avatar>
                <q-skeleton type="QAvatar" animation="fade" size="40px" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  <q-skeleton type="text" animation="fade" />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton type="text" animation="fade" />
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-skeleton height="200px" square animation="fade" />

            <q-card-section>
              <q-skeleton type="text" class="text-subtitle2" animation="fade" />
              <q-skeleton
                type="text"
                width="50%"
                class="text-subtitle2"
                animation="fade"
              />
            </q-card-section>
          </q-card>
        </template>
      </div>

      <div class="col-4 large-screen-only">
        <q-item class="fixed">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img :src="avatarUrl" :alt="username" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-bold">{{ username }}</q-item-label>
            <q-item-label caption> {{ email }} </q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useQuasar } from "quasar";
import { auth, storage, db } from "src/firebase/init"; // Correct import for Firebase auth instance
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore"; // Add missing Firestore functions
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import defaultAvatar from "src/assets/avatar.jpg"; // Import default avatar
import { useStoreAuth } from "src/stores/storeAuth";
const storeAuth = useStoreAuth();

// Reactive state for avatar URL, username, and email
const posts = ref([]);
const loadingPosts = ref(false);
const showNotificationsBanner = ref(false);
// const displayName = ref("");
const isAuthenticated = ref(false);
const avatarUrl = ref(defaultAvatar);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");

const $q = useQuasar();

const serviceWorkerSupported = computed(() => "serviceWorker" in navigator);
const pushNotificationsSupported = computed(() => "PushManager" in window);

// Fetch posts from the backend
const getPosts = () => {
  if (!auth.currentUser) {
    console.warn("No authenticated user, skipping post retrieval.");
    return;
  }

  loadingPosts.value = true;

  auth.currentUser
    .getIdToken()
    .then((idToken) => {
      axios
        .get(`${process.env.API}/posts`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        .then((response) => {
          posts.value = response.data;
          loadingPosts.value = false;
        })
        .catch((err) => {
          console.error("Error fetching posts:", err);
          $q.dialog({
            title: "Error",
            message: "Could not download posts.",
          });
          loadingPosts.value = false;
        });
    })
    .catch((error) => {
      console.error("Error getting ID token:", error);
      loadingPosts.value = false;
    });
};

// Delete a post
const deletePost = (postId) => {
  console.log("deletePost function called with postId:", postId);
  auth.currentUser.getIdToken().then((idToken) => {
    axios
      .delete(`${process.env.API}/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      .then((response) => {
        console.log("Post deleted:", response);
        posts.value = posts.value.filter((post) => post.id !== postId);
      })
      .catch((err) => {
        console.error("Error deleting post:", err);
        $q.dialog({
          title: "Error",
          message: "Could not delete post.",
        });
      });
  });
};

// Nice date formatting
const niceDate = (value) => {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

// onMounted without async
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is authenticated, fetching posts.");
      getPosts(); // Assuming you have a getPosts function defined elsewhere
      fetchUserData(user.uid); // <-- This triggers the fetchUserData function
    } else {
      console.warn("User is not authenticated.");
    }
  });
});
//----------storeAuth preserving the username and email after a page reload. ----
onMounted(() => {
  if (storeAuth.user) {
    username.value = storeAuth.user.displayName;
    email.value = storeAuth.user.email;
  }
});
//----------------------------------------------------
// Function to fetch user data from Firestore
async function fetchUserData(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      username.value = userData.displayName || "Guest";
      email.value = userData.email;
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
  }
}

onMounted(async () => {
  if (storeAuth.user) {
    username.value = storeAuth.user.displayName;
    email.value = storeAuth.user.email;
    isAuthenticated.value = true;

    // Fetch avatar from users collection's avatar subcollection
    try {
      const avatarCollectionRef = collection(
        db,
        `users/${storeAuth.user.uid}/avatar`
      );
      const avatarSnapshot = await getDocs(avatarCollectionRef);
      if (!avatarSnapshot.empty) {
        const avatarDoc = avatarSnapshot.docs[1]; // Assume there is only one avatar
        avatarUrl.value = avatarDoc.data().imageUrl;
      }
    } catch (error) {
      console.error("Error fetching avatar: ", error);
    }
  }
});
</script>

<style scoped>
.delete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  cursor: pointer;
  color: red;
}

.delete-icon:hover {
  color: blue !important;
}
</style>
