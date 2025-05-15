<template>
  <!--PageFront.vue -->
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
        @click="$router.push('/profile/edit/')"
      >
        <q-card-section>
          <q-icon name="person" size="xl" color="primary" />
          <div class="text-h6 q-mt-sm">My Profile</div>
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
          <div class="text-h6 q-mt-sm">HR Bot</div>
        </q-card-section>
      </q-card>
    </div>

    <div class="text-caption text-grey-6 q-mt-xl">
      © 2025 IsmeHr. All rights reserved.
    </div>
  </q-page>
</template>

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
