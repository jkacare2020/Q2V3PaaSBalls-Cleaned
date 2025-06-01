<template>
  <!--PageVisualBrandMaterial --->
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">Brand & Material Detection</div>
        <q-file v-model="imageFile" label="Upload Bag Image" accept="image/*" />
        <q-btn
          label="Detect Brand/Material"
          color="primary"
          class="q-mt-md"
          @click="analyzeImage"
          :disable="!imageFile || loading"
        />

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
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { apiNode } from "boot/apiNode";
import { useStoreAuth } from "src/stores/storeAuth";

const imageFile = ref(null);
const loading = ref(false);
const result = ref(null);

const storeAuth = useStoreAuth();

const suggestionType = ref("care"); // default

const analyzeImage = async () => {
  loading.value = true;
  result.value = null;

  const formData = new FormData();
  formData.append("image", imageFile.value);
  formData.append("uid", storeAuth.user?.uid || "unknown");
  formData.append("suggestionType", suggestionType.value); // 💡 add this

  try {
    const response = await apiNode.post(
      "/api/vision/detect-brand-material",
      formData
    );
    result.value = response.data;
  } catch (error) {
    console.error("AI detection failed:", error);
  } finally {
    loading.value = false;
  }
};
</script>
