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
        <div class="q-mt-md" style="max-width: 300px">
          <q-select
            v-model="itemType"
            :options="itemOptions"
            label="Item Type"
            outlined
            dense
            style="max-width: 300px"
          />
        </div>
        <q-btn
          type="submit"
          color="primary"
          label="Run AI Evaluation"
          :loading="isSubmitting"
        />

        <q-btn
          label="Reset Prompt"
          flat
          color="secondary"
          @click="resetPrompt"
        />
      </div>
      <!-- 📝 Prompt Textarea -->
      <q-input
        v-model="prompt"
        type="textarea"
        label="Custom Prompt for GPT"
        autogrow
        outlined
        :rules="[(val) => !!val || 'Prompt is required']"
        class="q-mt-md"
      />
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
import { ref, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";
import { useRouter } from "vue-router";
const router = useRouter();
const $q = useQuasar();
const dirtyImage = ref(null);
const cleanedImage = ref(null);

const aiResponse = ref(null);
const isSubmitting = ref(false);

// const itemType = ref("leather bag");
const prompt = ref("");

const itemOptions = [
  { label: "👜 leather bag", value: "leather bag" },
  { label: "👞 shoe", value: "shoe" },
  { label: "🧥 jacket", value: "jacket" },
  { label: "🧼 carpet", value: "carpet" },
];

const itemType = ref(itemOptions[0]); // ✅ Default selection with emoji la

function resetPrompt() {
  prompt.value = ""; // or regenerate based on itemType if you want
}

// Step 2: Define the reusable prompt generator function
function generatePrompt(type) {
  return `Please evaluate the cleaning result of this ${type}.

The first image shows the condition *before cleaning*, and the second image shows it *after cleaning*.

Your task:
- Visually compare both images.
- Identify specific cleaning improvements and surface conditions.

Respond ONLY with a JSON object with these fields:

{
  "dirtyAreas": integer,
  "cleaningSuccess": "Short summary of how well the dirty areas were cleaned",
  "cleaningScore": integer (0-100),
  "colorRestoration": integer (0-100),
  "scuffVisibility": "Describe if scuffs are still visible or reduced",
  "textureAndShine": "Describe how the ${type} texture and shine changed",
  "damageDetected": boolean,
  "summary": "Final judgment of the cleaning effectiveness"
}

Format only as raw JSON (no extra text, no explanation).`;
}

// Step 3: Watch for item type change
watch(itemType, (newTypeObj) => {
  const newType = newTypeObj?.value || "";
  if (
    !prompt.value ||
    prompt.value.includes("Please evaluate the cleaning result")
  ) {
    prompt.value = `Please evaluate the cleaning result of this ${newType}...`;
  }
});

// 🧠 Initialize prompt on page load
onMounted(() => {
  if (!prompt.value) {
    prompt.value = generatePrompt(itemType.value);
  }
});
//------------------------------------

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

.item-select-box {
  max-width: 300px;
}
</style>
