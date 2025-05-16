<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">🔒 View Your Private Posts</div>

    <q-form @submit.prevent="fetchMyPrivatePosts" class="q-gutter-md">
      <q-input
        v-model="clientEmail"
        label="Your Email"
        outlined
        dense
        type="email"
        required
      />
      <q-input
        v-model="clientPasscode"
        label="Access Passcode"
        outlined
        dense
        required
      />
      <q-btn label="Fetch Posts" color="primary" type="submit" />
    </q-form>

    <q-separator class="q-my-md" />

    <div v-if="privatePosts.length === 0 && attempted" class="text-negative">
      No posts found or incorrect passcode.
    </div>

    <q-card v-for="post in privatePosts" :key="post._id" class="q-mb-md">
      <q-card-section>
        <div class="text-h6">{{ post.name }}</div>
        <div class="text-subtitle2">By {{ post.displayName }}</div>
      </q-card-section>
      <q-img :src="post.imageUrl" v-if="post.imageUrl" class="q-my-sm" />
      <q-card-section>{{
        post.description || "No description"
      }}</q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";

const $q = useQuasar();

const clientEmail = ref("");
const clientPasscode = ref("");
const privatePosts = ref([]);
const attempted = ref(false);

const fetchMyPrivatePosts = async () => {
  attempted.value = true;
  try {
    const res = await apiNode.get("/api/products/private/by-client", {
      params: {
        email: clientEmail.value,
        passcode: clientPasscode.value,
      },
    });
    privatePosts.value = res.data;
  } catch (err) {
    console.error("Error fetching private posts:", err);
    privatePosts.value = [];
    $q.notify({
      type: "negative",
      message:
        err?.response?.data?.message || "Access denied or error occurred.",
    });
  }
};
</script>
