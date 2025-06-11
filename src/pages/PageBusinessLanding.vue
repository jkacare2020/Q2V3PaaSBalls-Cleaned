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
    <q-img
      src="/ai-demo-preview.jpg"
      ratio="16/9"
      class="q-mb-xl shadow-2"
      style="max-width: 800px"
    />

    <!-- How It Works -->
    <div class="text-h5 q-mb-sm">How It Works</div>
    <q-timeline color="primary" layout="dense" class="q-mb-xl">
      <q-timeline-entry title="1. Upload Before & After Photos" />
      <q-timeline-entry
        title="2. AI Analyzes the Results"
        subtitle="Detects stains, damage, color restoration, and gives a score."
      />
      <q-timeline-entry title="3. Download PDF Report or Share with Client" />
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
      label="Start Free Trial"
      color="primary"
      type="a"
      href="https://www.ismehr.com/try"
      target="_blank"
    />

    <q-btn
      outline
      color="secondary"
      icon="mail"
      label="Contact Us for Business Plan"
      to="mailto:support@ismehr.com"
    />
  </q-page>
</template>

<script setup>
// No logic needed for static marketing page
</script>

<style scoped>
.q-page {
  min-height: 100vh;
}
</style>
