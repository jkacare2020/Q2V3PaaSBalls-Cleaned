<template>
  <!--PageVisualBrandMaterial --->
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <q-expansion-item
          label="🧠 How to Analyze Your Handbag"
          expand-separator
          :default-opened="false"
          class="bg-grey-1 text-grey-9 rounded-borders q-mb-md"
        >
          <ul class="q-pl-md q-pt-sm">
            <li>Upload a clear handbag image (front view preferred)</li>
            <li>
              Select Suggestion Type:
              <ul>
                <li>🧼 General Care – tips for maintenance</li>
                <li>🛒 Products – get cleaner recommendations</li>
              </ul>
            </li>
            <li>Choose Stain Type (optional)</li>
            <li>Click <strong>Detect Brand/Material</strong></li>
          </ul>
        </q-expansion-item>

        <div class="text-h6">Brand & Material Detection</div>
        <q-file
          v-model="imageFile"
          label="📷 Upload Bag Image"
          accept="image/*"
          filled
          outlined
          color="primary"
          class="q-mt-md"
          use-chips
          style="max-width: 320px; font-weight: bold"
        />

        <div v-if="imagePreviewUrl" class="q-mt-md">
          <img
            :src="imagePreviewUrl"
            alt="Preview"
            style="max-width: 300px; border-radius: 8px"
          />
        </div>

        <div class="row q-gutter-md q-mt-md">
          <q-btn
            label="🧠 Detect Brand/Material"
            color="secondary"
            class="q-mt-md"
            @click="analyzeImage"
            :disable="!imageFile || loading"
          />
          <q-btn
            label="👜 Estimate Cleaning Price"
            color="blue"
            class="q-mt-md q-ml-md"
            :to="{ path: '/bluebook-bag' }"
            icon="price_change"
          />
        </div>
        <q-select
          v-model="suggestionType"
          :options="[
            { label: '🧼 General Care Suggestions', value: 'care' },
            { label: '🛒 Available Cleaning Products', value: 'products' },
          ]"
          label="Suggestion Type"
          class="q-mt-md"
          emit-value
          map-options
        />
        <q-select
          v-model="stainType"
          :options="stainOptions"
          label="Optional: Select Stain Type"
          class="q-mt-md"
          emit-value
          map-options
        />

        <q-banner
          v-if="suggestionType === 'products'"
          dense
          class="bg-blue-1 text-blue-10 q-mt-sm"
        >
          We’ll show real-world cleaning product suggestions tailored to your
          bag’s material.
        </q-banner>

        <q-banner v-else dense class="bg-grey-2 text-grey-9 q-mt-sm">
          We’ll suggest basic care instructions for your detected material.
        </q-banner>

        <q-spinner v-if="loading" class="q-mt-md" />
        <div v-if="result" class="q-mt-md">
          <p><strong>Brand:</strong> {{ result.brand }}</p>
          <p><strong>Material:</strong> {{ result.material }}</p>
          <p><strong>Summary:</strong> {{ result.summary }}</p>
          <p><strong>Suggestion:</strong> {{ result.suggestion }}</p>
        </div>
      </q-card-section>
      <q-separator class="q-mt-lg" />
      <q-card-section v-if="result?.recommendedProducts?.length">
        <div class="text-subtitle1 q-mb-md">
          🧴 Recommended Products Based on Material & Stain
        </div>

        <div class="column">
          <q-card
            v-for="product in result.recommendedProducts"
            :key="product.name"
            class="q-mb-md q-pa-md"
            flat
            bordered
          >
            <q-card-section>
              <div class="text-subtitle1 text-bold">{{ product.name }}</div>
              <div class="text-caption text-grey">{{ product.brand }}</div>

              <q-separator class="q-my-sm" />

              <div class="q-mt-sm">
                <strong>How to Use:</strong>
                <div class="q-mt-xs">{{ product.usage }}</div>
              </div>

              <div class="q-mt-sm">
                <strong>Where to Buy:</strong>
                <div class="q-mt-xs text-blue">{{ product.availability }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { apiNode } from "boot/apiNode";
import { useStoreAuth } from "src/stores/storeAuth";
import { useQuasar } from "quasar";

const imageFile = ref(null);
const loading = ref(false);
const result = ref(null);
const $q = useQuasar();

const storeAuth = useStoreAuth();

const suggestionType = ref("care"); // default

const stainType = ref("general"); // If not already added

const imagePreviewUrl = computed(() => {
  if (imageFile.value && imageFile.value instanceof File) {
    return URL.createObjectURL(imageFile.value);
  } else if (
    Array.isArray(imageFile.value) &&
    imageFile.value[0] instanceof File
  ) {
    return URL.createObjectURL(imageFile.value[0]);
  }
  return null;
});

const analyzeImage = async () => {
  loading.value = true;
  result.value = null;

  const formData = new FormData();
  formData.append("image", imageFile.value);
  formData.append("uid", storeAuth.user?.uid || "unknown");
  formData.append("suggestionType", suggestionType.value);
  formData.append("stainType", stainType.value || "general");

  try {
    // Step 1: detectBrandAndMaterial
    const response = await apiNode.post(
      "/api/vision/detect-brand-material",
      formData
    );
    result.value = response.data;
    console.log("🧠 Detection result:", result.value);

    // Step 2: Optional mapProductsToBag if suggestionType is 'products'
    if (suggestionType.value === "products" && result.value?.material) {
      const mapRes = await apiNode.post("/api/vision/map-products", {
        material: result.value.material,
        stainType: stainType.value || "general",
        summary: result.value.summary,
      });

      console.log("🗺️ Product map result:", mapRes.data);

      // 🧴 Override recommended products (optional)
      result.value.recommendedProducts = mapRes.data.recommendedProducts || [];
    }
  } catch (error) {
    console.error("❌ Detection or mapping failed:", error);

    if (error.response?.status === 403) {
      $q.notify({
        type: "negative",
        message:
          error.response.data.message || "Trial limit reached. Please upgrade.",
      });
    } else {
      $q.notify({
        type: "negative",
        message: "Failed to get AI response. Please try again.",
      });
    }
  } finally {
    loading.value = false;
  }
};

const stainOptions = [
  { label: "None", value: "general" },
  { label: "Water Stain", value: "water" },
  { label: "Grease/Oil", value: "oil" },
  { label: "Ink Mark", value: "ink" },
  { label: "Dirt/Mud", value: "dirt" },
  { label: "Mold/Mildew", value: "mold" },
];
</script>

<style scoped>
.q-file {
  border: 2px dashed #ccc;
  border-radius: 8px;
  background-color: #fafafa;
  transition: border-color 0.2s;
}

.q-file:hover {
  border-color: #2196f3;
}
</style>
