<template>
  <q-page class="q-pa-xl flex flex-center column items-center bg-grey-1">
    <!-- Hero Section -->
    <div class="text-h3 text-center q-mb-md">
      AI Cleaning Tools for Leather & Fabric Professionals
    </div>
    <div class="text-subtitle1 text-center q-mb-xl" style="max-width: 600px">
      Help your customers see the difference. Our AI detects stains, estimates
      cleaning success, and generates professional reports — instantly.
    </div>

    <!-- Demo Video or Screenshot -->
    <!-- Horizontal iPhone Preview -->
    <div class="row wrap justify-center q-gutter-md q-mb-xl">
      <div style="height: 600px"></div>
      <q-intersection
        once
        @visibility="(val) => (bagVisible = val || bagVisible)"
      >
        <div :class="['fade-in-box', { visible: bagVisible }]">
          <q-img
            :src="iphone2BagsBig"
            style="width: 200px"
            class="shadow-4 rounded-borders"
          />
        </div>
      </q-intersection>

      <q-intersection
        once
        @visibility="(val) => (scoreVisible = val || scoreVisible)"
      >
        <div :class="['fade-in-box', { visible: scoreVisible }]">
          <q-img
            :src="iphoneBagScore"
            style="width: 200px"
            class="shadow-4 rounded-borders"
          />
        </div>
      </q-intersection>

      <q-intersection
        once
        @visibility="(val) => (piesVisible = val || piesVisible)"
      >
        <div :class="['fade-in-box', { visible: piesVisible }]">
          <q-img
            :src="iphone2Pies"
            style="width: 200px"
            class="shadow-4 rounded-borders"
          />
        </div>
      </q-intersection>
    </div>

    <!-- How It Works -->
    <div class="text-h5 q-mb-sm">How It Works</div>
    <q-timeline color="primary" layout="dense" class="q-mb-xl">
      <q-timeline-entry
        title="1. Identify Bag Material"
        subtitle="Use our AI detector to recognize brand, leather, or fabric type."
      />
      <q-timeline-entry
        title="2. Estimate Price & Stains"
        subtitle="Automatically count stains and generate a cleaning quote."
      />
      <q-timeline-entry
        title="3. Upload Before & After Photos"
        subtitle="Let the AI measure visual improvements after cleaning."
      />
      <q-timeline-entry
        title="4. Download Report"
        subtitle="Export a professional report or share results with clients."
      />
    </q-timeline>

    <!-- Benefits -->
    <div class="text-h5 q-mb-sm">Why Use Ismehr?</div>
    <q-list bordered separator class="q-mb-xl" style="max-width: 600px">
      <q-item
        ><q-item-section
          >✅ Show proof of cleaning quality to clients</q-item-section
        ></q-item
      >
      <q-item
        ><q-item-section
          >✅ Save time on manual inspections</q-item-section
        ></q-item
      >
      <q-item
        ><q-item-section
          >✅ Charge premium by showing AI-based results</q-item-section
        ></q-item
      >
      <q-item
        ><q-item-section>✅ Build trust & transparency</q-item-section></q-item
      >
    </q-list>

    <!-- Testimonials -->
    <div class="text-h5 q-mb-sm">What Cleaners Are Saying</div>
    <q-card class="q-pa-md q-mb-lg" flat bordered style="max-width: 600px">
      <q-icon name="format_quote" size="md" color="grey-7" />
      <div class="q-mt-sm">
        "Since using Ismehr, we close more jobs — customers love seeing the
        before-after analysis!"
      </div>
      <div class="text-caption text-right text-grey-7 q-mt-sm">
        – LeatherFix Pros
      </div>
    </q-card>

    <!-- CTA -->
    <q-btn
      label="🧪 Try Free AI Cleaning Analysis"
      color="primary"
      type="a"
      href="https://www.ismehr.com/try/vision-submit"
      target="_blank"
    />

    <q-btn
      label="🔍 Detect Material & Brand"
      color="primary"
      class="q-mt-md"
      to="/detect-brand"
    />

    <q-btn
      label="📊 Estimate Stains  &  $ Price"
      color="primary"
      class="q-mt-sm"
      to="/bluebook-bag"
    />

    <q-btn
      outline
      color="secondary"
      icon="mail"
      label="Contact Us for Business Plan"
      to="mailto:support@ismehr.com"
      class="q-mt-md"
    />
  </q-page>
</template>

<script setup>
import { useMeta } from "quasar";

import iphone2BagsBig from "src/assets/iphone2BagsBig.jpg";
import iphoneBagScore from "src/assets/iphoneBagScore.jpg";
import iphone2Pies from "src/assets/iphone2Pies.jpg";

import { ref } from "vue";

const bagVisible = ref(false);
const scoreVisible = ref(false);
const piesVisible = ref(false);

useMeta({
  title: "AI Tools for Leather & Fabric Cleaning | Ismehr",
  meta: {
    description: {
      name: "description",
      content:
        "Use Ismehr to analyze cleaning results, detect stains, and share AI reports with clients. Perfect for dry cleaners and leather pros.",
    },
  },
});
</script>

<style scoped>
.fade-in-box {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease;
}
.fade-in-box.visible {
  opacity: 1;
  transform: translateY(0);
}
</style>
