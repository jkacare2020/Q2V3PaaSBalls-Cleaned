<template>
  <q-page class="constrain q-pa-md">
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingPosts && videos.length">
          <q-card
            v-for="video in videos"
            :key="video.id"
            class="card-post q-mb-md"
            bordered
            flat
          >
            <!-- Video Delete Icon -->
            <q-icon
              name="delete"
              color="red"
              class="delete-icon absolute"
              size="24px"
              aria-label="Delete video"
              @click="deleteVideo(video.id)"
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
                  {{ video.location }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <!-- Video Display -->
            <video controls class="full-width">
              <source :src="video.videoUrl" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <q-card-section>
              <div>{{ video.caption }}</div>
              <div class="text-caption text-grey">
                {{ niceDate(video.date) }}
              </div>
            </q-card-section>
          </q-card>
        </template>
        <template v-else-if="!loadingPosts && !videos.length">
          <h5 class="text-center text-grey">No videos yet.</h5>
        </template>
        <template v-else>
          <!-- Skeleton Loading -->
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
import { auth, db } from "src/firebase/init";
import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import axios from "axios";
import defaultAvatar from "src/assets/avatar.jpg";
import { useStoreAuth } from "src/stores/storeAuth";
import { apiNode, nodeApiBaseURL } from "boot/apiNode";

const storeAuth = useStoreAuth();
const videos = ref([]);
const loadingPosts = ref(false);
const isAuthenticated = ref(false);
const avatarUrl = ref(defaultAvatar);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");
const $q = useQuasar();

// Fetch videos from backend
const getVideos = () => {
  if (!auth.currentUser) {
    console.warn("No authenticated user, skipping video retrieval.");
    return;
  }

  loadingPosts.value = true;

  auth.currentUser
    .getIdToken()
    .then((idToken) => {
      apiNode
        .get(`/api/videos`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        .then((response) => {
          videos.value = response.data;
          loadingPosts.value = false;
        })
        .catch((err) => {
          console.error("Error fetching videos:", err);
          $q.dialog({
            title: "Error",
            message: "Could not download videos.",
          });
          loadingPosts.value = false;
        });
    })
    .catch((error) => {
      console.error("Error getting ID token:", error);
      loadingPosts.value = false;
    });
};

// Delete video
const deleteVideo = (videoId) => {
  console.log("Delete this Video triggered", videoId);
  auth.currentUser.getIdToken().then((idToken) => {
    apiNode
      .delete(`/api/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      .then((response) => {
        console.log("Post deleted:", response);
        videos.value = videos.value.filter((video) => video.id !== videoId);
        $q.notify({
          type: "positive",
          message: "Video deleted successfully.",
        });
      })
      .catch((err) => {
        console.error("Error deleting video:", err);
        $q.dialog({
          title: "Error",
          message: "Could not delete video.",
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
  getVideos();
});

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
