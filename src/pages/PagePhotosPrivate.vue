<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Private Client Photos</div>
    <!-- 🔍 Search Input -->
    <q-input
      v-model="searchQuery"
      label="Search posts"
      outlined
      dense
      debounce="300"
      class="q-mb-md"
      clearable
    />
    <div class="row q-col-gutter-md">
      <div
        v-for="post in filteredPosts"
        :key="post.id"
        class="col-xs-12 col-sm-6 col-md-4"
      >
        <img
          :src="post.imageUrl"
          :alt="post.caption"
          @click="goToPhotoDetail(post.id)"
          style="
            width: 100%;
            height: auto;
            cursor: zoom-in;
            border-radius: 12px;
            border: 1px solid #ccc;
          "
        />
        <div class="q-mt-sm">
          <div class="text-subtitle2">{{ post.caption }}</div>
          <div class="text-caption text-grey">{{ post.userName }}</div>
        </div>
      </div>
    </div>

    <!-- Zoom Dialog -->
    <q-dialog v-model="selectedImage" persistent>
      <q-card style="max-width: 90vw; max-height: 90vh; background: black">
        <q-img
          v-if="selectedImage"
          :src="selectedImage.imageUrl"
          style="max-height: 90vh; object-fit: contain"
        />
        <q-btn
          icon="close"
          flat
          round
          dense
          class="absolute-top-right q-ma-sm bg-white"
          @click="selectedImage = null"
        />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { apiNode } from "boot/apiNode";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "vue-router";

const router = useRouter();

const posts = ref([]);
const loading = ref(true);
const selectedImage = ref(null); // ✅ The key to open zoom
const auth = getAuth();
const searchQuery = ref("");

const filteredPosts = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return posts.value.filter(
    (post) =>
      post.caption?.toLowerCase().includes(q) ||
      post.location?.toLowerCase().includes(q) ||
      post.userName?.toLowerCase().includes(q)
  );
});

function goToPhotoDetail(postId) {
  router.push(`/photos/${postId}`);
}

const fetchPrivatePosts = async () => {
  try {
    const res = await apiNode.get("/api/from-clients");
    posts.value = res.data;
  } catch (err) {
    console.error("❌ Failed to load photos", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("👤 Auth state changed:", user.uid);
      fetchPrivatePosts();
      // Optional: fetchUserData(user.uid) if needed here
      // Optional: initPresenceTracking() if this page requires presence
    }
  });

  // Optional fallback if auth is already initialized
  if (auth.currentUser) {
    fetchPrivatePosts();
  }
});
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
