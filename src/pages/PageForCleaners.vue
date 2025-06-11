<template>
  <q-page class="q-pa-md">
    <q-card flat class="q-pa-md q-mx-auto" style="max-width: 800px">
      <div class="text-h5 q-mb-md text-center">
        🧼 Tools for Professional Cleaners
      </div>

      <div class="text-subtitle1 q-mb-md text-center">
        Designed for leather cleaners, carpet care experts, and boutique
        restoration businesses
      </div>

      <q-separator class="q-my-md" />

      <q-list bordered padding>
        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="science" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>AI Cleaning Analysis</q-item-label>
            <q-item-label caption>
              Upload before/after images and let AI evaluate restoration quality
              and stain removal score.
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="description" color="green" />
          </q-item-section>
          <q-item-section>
            <q-item-label>PDF Reports</q-item-label>
            <q-item-label caption>
              Generate downloadable visual reports for your customers with
              confidence scores and summaries.
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="inventory_2" color="deep-orange" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Material & Brand Detection</q-item-label>
            <q-item-label caption>
              Get automatic material insights to guide treatment decisions and
              product recommendations.
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable>
          <q-item-section avatar>
            <q-icon name="shopping_cart" color="accent" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Transaction & Checkout</q-item-label>
            <q-item-label caption>
              Create cleaning orders, generate invoices, and manage client
              payments easily.
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <div class="q-mt-lg text-center">
        <q-btn
          label="🚀 Start Free Trial"
          color="primary"
          size="lg"
          to="/try"
        />
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
// No script logic needed for now
</script>
