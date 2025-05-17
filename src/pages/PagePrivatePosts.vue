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

      <q-card-actions align="right">
        <!-- Buy Button -->
        <!-- <q-btn
          icon="shopping_cart"
          flat
          color="orange"
          label="Buy"
          @click.stop="goToTransaction(post)"
        /> -->

        <!-- Delete Button: only visible to owner -->
        <q-btn
          icon="delete"
          flat
          color="negative"
          label="Delete"
          @click.stop="deleteProduct(post)"
          v-if="userData?.uid === post.userId"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "src/firebase/init";
import { doc, getDoc } from "firebase/firestore";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

const $q = useQuasar();

const userData = ref(null);
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

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        userData.value = {
          ...snap.data(),
          uid: user.uid, // ✅ Add uid here
        };
      }
    } else {
      console.warn("No logged-in user");
    }
  });
});

//----------------------------------------------------
async function deleteProduct(post) {
  $q.dialog({
    title: "Delete Post",
    message: "Are you sure you want to delete this post?",
    cancel: true,
    persistent: true,
  })
    .onOk(async () => {
      try {
        const token = await auth.currentUser.getIdToken();
        await apiNode.delete(`/api/products/${post._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        $q.notify({ type: "positive", message: "Post deleted" });

        // Remove post from local list
        privatePosts.value = privatePosts.value.filter(
          (p) => p._id !== post._id
        );
      } catch (err) {
        console.error("❌ Failed to delete post:", err);
        $q.notify({ type: "negative", message: "Delete failed" });
      }
    })
    .onCancel(() => {
      console.log("🚫 Deletion canceled by user");
    });
}

function goToTransaction(post) {
  router.push({
    path: "/new-transaction-cart",
    query: { productId: post._id },
  });
}
</script>
