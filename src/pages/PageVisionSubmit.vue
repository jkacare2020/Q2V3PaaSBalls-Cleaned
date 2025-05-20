<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Submit Cleaning Evaluation</div>

    <q-form @submit.prevent="submitToAI">
      <div class="q-gutter-md">
        <q-file
          v-model="dirtyImage"
          label="Upload Dirty Image (Before Cleaning)"
          accept="image/*"
          filled
        />

        <q-file
          v-model="cleanedImage"
          label="Upload Cleaned Image (After Cleaning)"
          accept="image/*"
          filled
        />

        <q-input
          v-model="prompt"
          type="textarea"
          label="Custom Prompt for GPT"
          autogrow
          outlined
          :rules="[(val) => !!val || 'Prompt is required']"
          class="q-mt-md"
        />

        <q-btn
          type="submit"
          color="primary"
          label="Run AI Evaluation"
          :loading="isSubmitting"
        />
      </div>
    </q-form>

    <q-separator class="q-my-md" />

    <div v-if="aiResponse">
      <div class="text-subtitle1 q-mb-sm">AI Result:</div>
      <q-card flat bordered class="q-pa-md bg-grey-2">
        <div>{{ aiResponse.analysis || aiResponse.text }}</div>
        <q-badge
          v-if="aiResponse.score"
          color="green"
          :label="aiResponse.score + '%'"
          class="q-mt-sm"
        />
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";
import { useRouter } from "vue-router";
const router = useRouter();
const $q = useQuasar();
const dirtyImage = ref(null);
const cleanedImage = ref(null);
// const prompt = ref("Compare the cleaning result of this item.");
const prompt = ref(`Please evaluate the cleaning result of this leather bag.

The first image shows the condition *before cleaning*, and the second image shows it *after cleaning*.

Your task:
- Visually compare both images.
- Identify specific cleaning improvements and surface conditions.

Respond ONLY with a JSON object with these fields:

{
  "dirtyAreas": integer, // Total distinct dirty regions seen in the before image (e.g. stains, dark spots, grime)
  "cleaningSuccess": "Short summary of how well the dirty areas were cleaned",
  "cleaningScore": integer (0-100), // Based on cleanliness and visual improvement
  "colorRestoration": integer (0-100), // Based on color consistency and vibrancy after cleaning
  "scuffVisibility": "Describe if scuffs are still visible or reduced",
  "textureAndShine": "Describe how the leather texture and shine changed",
  "damageDetected": boolean, // true if cleaning caused new visible damage
  "summary": "Final judgment of the cleaning effectiveness"
}

Format only as raw JSON (no extra text, no explanation).
`);

const aiResponse = ref(null);
const isSubmitting = ref(false);

async function submitToAI() {
  if (!dirtyImage.value || !cleanedImage.value) {
    $q.notify({ type: "negative", message: "Please upload both images." });
    return;
  }
  try {
    isSubmitting.value = true;
    const token = await auth.currentUser.getIdToken();
    const formData = new FormData();

    formData.append("dirty", dirtyImage.value);
    formData.append("cleaned", cleanedImage.value);
    formData.append("prompt", prompt.value);
    formData.append("uid", auth.currentUser.uid);

    const res = await apiNode.post("/api/vision/compare", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    aiResponse.value = res.data.result;
    $q.notify({ type: "positive", message: "AI evaluation complete!" });
    const sessionId = res.data.sessionId;
    router.push({ path: "/vision-details", query: { sessionId } });
  } catch (err) {
    console.error("Vision error:", err);
    $q.notify({ type: "negative", message: "Failed to get AI response." });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.q-file {
  max-width: 400px;
}
</style>
