<template>
  <q-page class="constrain q-pa-md">
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingAudios && audios.length">
          <q-card
            v-for="audio in audios"
            :key="audio.id"
            class="card-post q-mb-md"
            bordered
            flat
          >
            <!-- Log the audioUrl -->
            <!-- {{ console.log("Audio URL:", audio.audioUrl) }} -->
            <!-- Audio Delete Icon -->
            <q-icon
              name="delete"
              color="red"
              class="delete-icon absolute"
              size="24px"
              aria-label="Delete audio"
              @click="deleteAudio(audio.id)"
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
                  {{ audio.location }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <!-- Audio Player -->
            <audio
              controls
              class="full-width"
              @error="handleAudioError(audio.id)"
            >
              <source :src="audio.audioUrl" type="audio/webm" />
              Your browser does not support the audio tag.
            </audio>

            <q-card-section>
              <div>{{ audio.caption }}</div>
              <div class="text-caption text-grey">
                {{ niceDate(audio.date) }}
              </div>
            </q-card-section>
          </q-card>
        </template>
        <template v-else-if="!loadingAudios && !audios.length">
          <h5 class="text-center text-grey">No audios yet.</h5>
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
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import axios from "axios";
import defaultAvatar from "src/assets/avatar.jpg";
import { useStoreAuth } from "src/stores/storeAuth";
import { apiNode } from "boot/apiNode";

const storeAuth = useStoreAuth();
const audios = ref([]);
const loadingAudios = ref(true); // Unified loading state
const avatarUrl = ref(defaultAvatar);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");
const $q = useQuasar();

// Fetch audios from backend
const getAudios = () => {
  if (!auth.currentUser) {
    console.warn("No authenticated user, skipping audio retrieval.");
    return;
  }

  loadingAudios.value = true;

  auth.currentUser
    .getIdToken()
    .then((idToken) => {
      apiNode
        .get(`/api/audios`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        .then((response) => {
          audios.value = response.data; // Now includes Firestore document IDs as `id`
          console.log("Fetched audios:", audios.value);
        })
        .catch((err) => {
          console.error("Error fetching audios:", err);
          $q.notify({
            type: "negative",
            message: "Failed to load audios.",
          });
        })
        .finally(() => {
          loadingAudios.value = false;
        });
    })
    .catch((error) => {
      console.error("Error getting ID token:", error);
      loadingAudios.value = false;
    });
};

const handleAudioError = (audioId) => {
  console.error("Error playing audio with ID:", audioId);
  $q.notify({
    type: "negative",
    message: "Failed to play audio.",
  });
};

const deleteAudio = async (audioId) => {
  try {
    const idToken = await auth.currentUser.getIdToken();

    await apiNode.delete(`/api/audios/${audioId}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    // Update the local audios array to remove the deleted audio
    audios.value = audios.value.filter((audio) => audio.id !== audioId);

    $q.notify({
      type: "positive",
      message: "Audio deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting audio:", err);
    $q.notify({
      type: "negative",
      message: "Failed to delete audio. Please try again.",
    });
  }
};

const niceDate = (value) => {
  if (!value) return "No date available";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};

onMounted(() => {
  getAudios();
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
