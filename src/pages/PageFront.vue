<template>
  <q-page class="q-pa-lg column items-center justify-center">
    <div class="text-center q-mb-xl">
      <q-img
        src="/icons/apple-touch-icon.png"
        width="120px"
        height="120px"
        class="q-mb-md"
      />
      <div class="text-h4 text-primary text-weight-bold">IsmeHr</div>
      <div class="text-subtitle2 text-grey-7">Your AI-powered HR Assistant</div>
    </div>

    <div
      class="q-gutter-md row justify-center items-stretch"
      style="max-width: 700px"
    >
      <q-card
        class="my-card"
        flat
        bordered
        clickable
        @click="$router.push('/photos')"
      >
        <q-card-section>
          <q-icon name="feed" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">Explore Posts</div>
        </q-card-section>
      </q-card>

      <q-card
        class="my-card"
        flat
        bordered
        clickable
        @click="$router.push('/marketplace')"
      >
        <q-card-section>
          <q-icon name="storefront" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">Marketplace</div>
        </q-card-section>
      </q-card>

      <q-card
        class="my-card"
        flat
        bordered
        clickable
        @click="$router.push('/camera')"
      >
        <q-card-section>
          <q-icon name="photo_camera" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">Upload Photo</div>
        </q-card-section>
      </q-card>

      <q-card
        class="my-card"
        flat
        bordered
        clickable
        @click="$router.push('/private-posts')"
      >
        <q-card-section>
          <q-icon name="person" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">My Private Post</div>
        </q-card-section>
      </q-card>

      <q-card
        class="my-card"
        flat
        bordered
        clickable
        @click="$router.push('/chatbot')"
      >
        <q-card-section>
          <q-icon name="smart_toy" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">AI Assist Bot</div>
        </q-card-section>
      </q-card>

      <q-card
        class="my-card"
        flat
        bordered
        clickable
        @click="$router.push('/vision-submit')"
      >
        <q-card-section>
          <q-icon name="scoreboard" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">AI Cleaning Score</div>
        </q-card-section>
        <q-tooltip>Upload before & after images for AI evaluation</q-tooltip>
      </q-card>

      <q-card
        class="my-card relative-position"
        flat
        bordered
        clickable
        @click="$router.push('/mongo-mytransacts')"
      >
        <q-card-section>
          <q-icon name="shopping_cart" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">Resume Cart</div>
          <q-tooltip v-if="showResumeCart">
            You have {{ cartCount }} item(s) in your cart
          </q-tooltip>
          <q-badge
            v-if="showResumeCart"
            color="red"
            floating
            rounded
            style="position: absolute; top: 5px; right: 5px"
          >
            {{ cartCount }}
          </q-badge>
        </q-card-section>
      </q-card>
    </div>

    <div class="text-caption text-grey-6 q-mt-xl">
      © 2025 IsmeHr. All rights reserved.
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiNode } from "src/boot/apiNode";
import { auth } from "src/firebase/init";

const showResumeCart = ref(false);
const cartCount = ref(0);

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) return;

  const token = await user.getIdToken();
  try {
    const res = await apiNode.get("/api/transactions/drafts", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.data && res.data.length > 0) {
      showResumeCart.value = true;
      cartCount.value = res.data.length;
    }
  } catch (err) {
    console.error("Error checking cart drafts:", err);
  }
});
</script>

<script>
export default {
  name: "PageFront",
  meta() {
    return {
      title: "IsmeHr | AI Cleaning Grading & HR Assistant",
      meta: [
        {
          name: "description",
          content:
            "Upload before-and-after cleaning photos and get an AI-generated grade using GPT-4 Vision. Manage resumes, access HR tools, and shop with confidence.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "IsmeHr | AI Cleaning Grading" },
        {
          property: "og:description",
          content:
            "Get instant AI feedback on cleanliness, explore the marketplace, or chat with our HR AI assistant.",
        },
        {
          property: "og:image",
          content: "https://ismehr.com/icons/apple-touch-icon.png",
        },
        { property: "og:url", content: "https://ismehr.com" },
      ],
    };
  },
};
</script>

<style scoped>
.my-card {
  width: 140px;
  text-align: center;
  transition: transform 0.2s;
}
.my-card:hover {
  transform: scale(1.05);
}
</style>
