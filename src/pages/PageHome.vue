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
    <!-- left side post box -->
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
import { auth, storage, db } from "src/firebase/init";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";
import defaultAvatar from "src/assets/avatar.png";
import { useStoreAuth } from "src/stores/storeAuth";
import { apiNode, nodeApiBaseURL } from "boot/apiNode";

const storeAuth = useStoreAuth();

const posts = ref([]);
const loadingPosts = ref(false);
const showNotificationsBanner = ref(false);
const isAuthenticated = ref(false);
const avatarUrl = ref(defaultAvatar);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");

const $q = useQuasar();

const serviceWorkerSupported = computed(() => "serviceWorker" in navigator);
const pushNotificationsSupported = computed(() => "PushManager" in window);

const getPosts = () => {
  if (!auth.currentUser) {
    console.warn("No authenticated user, skipping post retrieval.");
    return;
  }

  loadingPosts.value = true;

  auth.currentUser
    .getIdToken()
    .then((idToken) => {
      apiNode
        .get(`/api/posts`, {
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

const deletePost = (postId) => {
  auth.currentUser.getIdToken().then((idToken) => {
    apiNode
      .delete(`/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      .then((response) => {
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

const niceDate = (value) => {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      getPosts();
      fetchUserData(user.uid);
    }
  });
});

onMounted(() => {
  if (storeAuth.user) {
    username.value = storeAuth.user.displayName;
    email.value = storeAuth.user.email;
  }
});

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

  try {
    const avatarCollectionRef = collection(db, `users/${uid}/avatar`);
    const avatarSnapshot = await getDocs(avatarCollectionRef);
    if (!avatarSnapshot.empty) {
      const avatarDoc = avatarSnapshot.docs[0];
      avatarUrl.value = avatarDoc.data().imageUrl || defaultAvatar;
    }
  } catch (error) {
    console.error("Error fetching avatar: ", error);
  }
}
</script>

<style scoped lang="scss">
.delete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  cursor: pointer;
  color: red;

  &:hover {
    color: blue !important;
  }
}

.card-post {
  .q-img {
    min-height: 200px;
  }
}
</style>
