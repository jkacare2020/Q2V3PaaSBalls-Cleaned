<template>
  <!--PageVisionSubmit.vue-->
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Submit Cleaning Evaluation</div>

    <q-form @submit.prevent="submitToAI">
      <div class="q-gutter-md">
        <div class="row items-start q-col-gutter-md">
          <div class="col-6">
            <q-file
              v-model="dirtyImage"
              label="Upload Dirty Image (Before Cleaning)"
              accept="image/*"
              filled
            />
            <div v-if="dirtyImage" class="q-mt-sm">
              ``
              <img
                :src="dirtyPreviewUrl"
                @click="showZoom('dirty')"
                style="
                  max-width: 100%;
                  max-height: 200px;
                  border: 1px solid #ccc;
                  cursor: zoom-in;
                "
              />
              <div class="text-caption text-center">Before</div>
            </div>
          </div>

          <div class="col-6">
            <q-file
              v-model="cleanedImage"
              label="Upload Cleaned Image (After Cleaning)"
              accept="image/*"
              filled
            />
            <div v-if="cleanedImage" class="q-mt-sm">
              <img
                :src="cleanedPreviewUrl"
                @click="showZoom('cleaned')"
                style="
                  max-width: 100%;
                  max-height: 200px;
                  border: 1px solid #ccc;
                  cursor: zoom-in;
                "
              />
              <div class="text-caption text-center">After</div>
            </div>
          </div>
        </div>

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

        <!-- Link to detect brand/material -->
        <q-btn
          label="👜 Detect Brand & Material"
          color="accent"
          class="q-mt-sm"
          to="/detect-brand"
        />
      </div>

      <!-- 🗘 Prompt Textarea -->
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

    <!-- Zoomed image dialog -->
    <q-dialog v-model="zoomDialog">
      <q-card style="max-width: 90vw; max-height: 90vh; overflow: auto">
        <img :src="zoomImageUrl" style="width: 100%; height: auto" />
      </q-card>
    </q-dialog>
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
const dirtyPreviewUrl = ref("");
const cleanedPreviewUrl = ref("");

const zoomDialog = ref(false);
const zoomImageUrl = ref("");

const showZoom = (type) => {
  zoomImageUrl.value =
    type === "dirty" ? dirtyPreviewUrl.value : cleanedPreviewUrl.value;
  zoomDialog.value = true;
};

watch(dirtyImage, (file) => {
  if (file) {
    dirtyPreviewUrl.value = URL.createObjectURL(file);
  }
});

watch(cleanedImage, (file) => {
  if (file) {
    cleanedPreviewUrl.value = URL.createObjectURL(file);
  }
});

const aiResponse = ref(null);
const isSubmitting = ref(false);

// const itemType = ref("leather bag");
const prompt = ref("");

const itemOptions = [
  { label: "👜 leather bag", value: "leather bag" },
  { label: "👞 shoe", value: "shoe" },
  { label: "🧥 jacket", value: "jacket" },
  { label: "🛋️ sofa", value: "sofa" },
  { label: "🧼 carpet", value: "carpet" },
];

const itemType = ref(itemOptions[0]); // ✅ Default selection with emoji la

function resetPrompt() {
  prompt.value = ""; // or regenerate based on itemType if you want
}

// Step 2: Define the reusable prompt generator function
function generatePrompt(type) {
  const baseFields = `{
  "dirtyAreas": integer,
  "cleaningSuccess": "Short summary of how well the dirty areas were cleaned",
  "cleaningScore": integer (0-100),
  "colorRestoration": integer (0-100),
  "scuffVisibility": "Describe if scuffs are still visible or reduced",
  "textureAndShine": "Describe how the ${type} texture and shine changed",
  "damageDetected": boolean,
  "summary": "Final judgment of the cleaning effectiveness"
}`;

  const prompts = {
    "leather bag": `
Please evaluate the cleaning result of this leather bag.

The first image shows the condition *before cleaning*, and the second shows it *after cleaning*.

Focus on:
- Dirt/stain removal (especially on corners and handles),
- Surface shine and color restoration,
- Visibility of scratches, mold, or scuffs,
- Leather softness and flexibility.

Respond ONLY with this JSON structure:
${baseFields}
`,

    shoe: `
Please evaluate the cleaning result of this shoe.

Focus on:
- Sole and upper stain removal,
- Scuff visibility on toe and heel,
- Shine or polish restoration,
- Laces and edge detailing.

Respond ONLY with this JSON structure:
${baseFields}
`,

    sofa: `
Please evaluate the cleaning result of this leather sofa.

Focus on:
- Stain removal from seat, back, and arms,
- Recovery of original color and shine,
- Surface issues: cracks, dryness, mold, or oil buildup,
- Wrinkles, sagging, or structural wear.

Respond ONLY with this JSON structure:
${baseFields}
`,

    jacket: `
Please evaluate the cleaning result of this leather jacket.

Focus on:
- Stains on sleeves, collar, and front,
- Shine and texture restoration,
- Damage or dryness signs,
- Scuff visibility on high-contact areas.

Respond ONLY with this JSON structure:
${baseFields}
`,

    carpet: `
Please evaluate the cleaning result of this carpet.

Focus on:
- Stain removal across fibers,
- Color vibrancy restoration,
- Edge and center spot visibility,
- Texture softness and cleanliness.

Respond ONLY with this JSON structure:
${baseFields}
`,
  };

  const key = type?.toLowerCase?.();
  return (
    prompts[key] ||
    `
Please evaluate the cleaning result of this item.

The first image shows it before cleaning; the second, after.

Focus on visible improvements in cleanliness, damage, texture, and shine.

Respond ONLY with this JSON structure:
${baseFields}
`
  );
}

// Step 3: Watch for item type change
watch(itemType, (newTypeObj) => {
  const newType = newTypeObj?.value || "";
  if (
    !prompt.value ||
    prompt.value.includes("Please evaluate the cleaning result")
  ) {
    // prompt.value = `Please evaluate the cleaning result of this ${newType}...`;
    prompt.value = generatePrompt(newType); // ✅ Call function
  }
});

// 🧠 Initialize prompt on page load
onMounted(() => {
  if (!prompt.value) {
    // prompt.value = generatePrompt(itemType.value);
    prompt.value = generatePrompt(itemType.value.value); // ✅ Extract value
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
