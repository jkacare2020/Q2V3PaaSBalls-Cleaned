<template>
  <q-page class="q-pa-xl column items-center justify-center">
    <!-- Header Branding -->
    <div class="text-center q-mb-xl">
      <q-img
        src="/icons/apple-touch-icon.png"
        width="120px"
        height="120px"
        class="q-mb-md"
      />
      <div class="text-h4 text-primary text-weight-bold">IsmeHr</div>
      <div class="text-subtitle2 text-grey-7">
        AI-Powered Leather Care Assistant
      </div>
    </div>

    <!-- Highlighted Features -->
    <div class="q-gutter-xl row justify-center items-stretch q-mb-xl">
      <q-card
        class="feature-card"
        flat
        bordered
        clickable
        @click="$router.push('/vision-submit')"
      >
        <q-card-section class="q-pa-md">
          <q-icon name="science" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm text-weight-medium">
            AI Cleaning Evaluation
          </div>
          <div class="text-caption q-mt-xs text-grey-7">
            Upload before & after photos. Let GPT-4 Vision assess cleanliness
            and material quality.
          </div>
        </q-card-section>
      </q-card>

      <q-card
        class="feature-card"
        flat
        bordered
        clickable
        @click="$router.push('/detect-brand')"
      >
        <q-card-section class="q-pa-md">
          <q-icon name="inventory_2" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm text-weight-medium">
            Product Suggestions
          </div>
          <div class="text-caption q-mt-xs text-grey-7">
            Get cleaner & conditioner product recommendations tailored to your
            bag’s leather type.
          </div>
        </q-card-section>
      </q-card>

      <q-card
        class="feature-card"
        flat
        bordered
        clickable
        @click="$router.push('/vision-bot')"
      >
        <q-card-section class="q-pa-md">
          <q-icon name="description" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm text-weight-medium">
            Client PDF Reports
          </div>
          <div class="text-caption q-mt-xs text-grey-7">
            Export professional AI analysis reports for your cleaning clients.
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Quick Access -->
    <div class="q-gutter-md row justify-center">
      <q-btn
        color="primary"
        label="Chat with AI Assistant"
        icon="smart_toy"
        @click="$router.push('/chatbot')"
      />
      <q-btn
        color="accent"
        label="Go to Marketplace"
        icon="storefront"
        @click="$router.push('/marketplace')"
      />
      <q-btn
        color="secondary"
        label="Upload New Photo"
        icon="photo_camera"
        @click="$router.push('/camera')"
      />
    </div>

    <div class="text-caption text-grey-6 q-mt-xl">
      © 2025 IsmeHr – Your trusted AI assistant for leather restoration
    </div>
  </q-page>
</template>

<script>
export default {
  name: "PageFront",
  meta() {
    return {
      title: "IsmeHr | AI Cleaning & Leather Restoration Assistant",
      meta: [
        {
          name: "description",
          content:
            "Upload before-and-after cleaning photos and get an AI-generated grade using GPT-4 Vision. Suggest products, manage clients, and export PDF reports.",
        },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: "IsmeHr | AI Leather Care Assistant" },
        {
          property: "og:description",
          content:
            "Let AI analyze handbag images, recommend care products, and generate client reports.",
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
.feature-card {
  width: 220px;
  min-height: 220px;
  text-align: center;
  transition: transform 0.2s ease;
}
.feature-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
}
</style>
