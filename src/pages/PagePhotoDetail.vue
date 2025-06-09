<template>
  <q-page class="q-pa-md">
    <q-card class="q-mx-auto" style="max-width: 600px">
      <q-img :src="post.imageUrl" spinner-color="primary" />
      <q-card-section>
        <div class="text-h6">{{ post.caption }}</div>
        <div class="text-caption text-grey">
          By {{ post.userName }} | {{ formattedDate }}
        </div>
        <div class="text-caption">Location: {{ post.location }}</div>
        <q-chip
          v-for="tag in post.tags"
          :key="tag"
          size="sm"
          color="primary"
          text-color="white"
          class="q-mr-xs q-mt-sm"
        >
          {{ tag }}
        </q-chip>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { apiNode } from "boot/apiNode";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const post = ref({});
const route = useRoute();
const auth = getAuth();

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("👤 Auth state changed:", user.uid);
      const postId = route.params.postId;

      try {
        const res = await apiNode.get(`/api/posts/${postId}`);
        post.value = res.data;
      } catch (err) {
        console.error("Failed to fetch post:", err);
      }
    } else {
      console.warn("User not logged in");
      // optionally redirect to login
    }
  });
});

const formattedDate = computed(() =>
  post.value.date ? format(new Date(post.value.date), "PPPp") : ""
);
</script>
