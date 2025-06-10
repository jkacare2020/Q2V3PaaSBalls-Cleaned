<template>
  <q-page class="q-pa-xl flex flex-center column items-center">
    <!-- 🧠 Headline -->
    <div class="text-h4 text-center q-mb-md" style="max-width: 600px">
      🧠 AI Leather Cleaning Evaluation
    </div>

    <!-- 📊 Dummy Pie Charts -->
    <div
      class="row q-col-gutter-xl q-mt-lg q-mb-xl items-center justify-center"
    >
      <div class="col-12 col-sm-6 col-md-4 flex flex-center">
        <q-card class="q-pa-md shadow-2 text-center">
          <q-circular-progress
            show-value
            font-size="20px"
            value="83"
            size="150px"
            color="primary"
            track-color="grey-3"
            class="q-mb-sm"
          />
          <div class="text-subtitle1">Restoration Quality</div>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-4 flex flex-center">
        <q-card class="q-pa-md shadow-2 text-center">
          <q-circular-progress
            show-value
            font-size="20px"
            value="17"
            size="150px"
            color="deep-orange"
            track-color="grey-3"
            class="q-mb-sm"
          />
          <div class="text-subtitle1">Residual Stains</div>
        </q-card>
      </div>
    </div>

    <!-- 🚀 CTA -->
    <q-btn
      color="positive"
      size="lg"
      icon="cloud_upload"
      label="Try with Your Photos"
      @click="redirectToCamera"
    />

    <!-- 💬 Testimonials or Additional Value -->
    <div class="q-mt-xl text-center" style="max-width: 600px">
      <q-icon name="format_quote" size="32px" color="grey-6" />
      <p class="text-body1">
        "This tool helped us instantly measure the results of our leather
        polishing jobs. It’s like having an AI inspector!"
      </p>
      <div class="text-subtitle2 text-grey">– Verified Merchant</div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

function redirectToCamera() {
  router.push("/try"); // or '/camera/batch'
}
</script>

<style scoped>
.q-page {
  background: #fafafa;
  min-height: 100vh;
}
</style>
