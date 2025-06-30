<template>
  <q-page class="q-pa-md flex flex-center bg-grey-1">
    <div
      class="column items-center q-gutter-md"
      style="max-width: 800px; width: 100%"
    >
      <!-- 🖼️ Upload Buttons -->
      <div class="row q-col-gutter-sm justify-center" style="width: 100%">
        <q-btn
          label="Upload Dirty Image"
          color="negative"
          class="col"
          @click="$refs.dirtyInput.click()"
        />

        <q-btn
          label="Upload Cleaned Image"
          color="positive"
          class="col"
          @click="$refs.cleanedInput.click()"
        />
      </div>

      <!-- Hidden Inputs -->
      <input
        type="file"
        ref="dirtyInput"
        accept="image/*"
        @change="onDirtyChange"
        hidden
      />
      <input
        type="file"
        ref="cleanedInput"
        accept="image/*"
        @change="onCleanedChange"
        hidden
      />

      <!-- 🔍 Image Preview -->
      <div
        class="row q-col-gutter-md justify-around q-mt-md"
        style="width: 100%"
      >
        <!-- Dirty Image Container -->
        <div class="image-container" style="flex: 1; min-width: 45%">
          <q-img
            v-if="dirtyPreviewUrl"
            :src="dirtyPreviewUrl"
            class="preview-img rounded-borders shadow-2"
          />
          <div v-if="isSubmitting" class="scanner-bar" />
        </div>

        <!-- Cleaned Image Container -->
        <div class="image-container" style="flex: 1; min-width: 45%">
          <q-img
            v-if="cleanedPreviewUrl"
            :src="cleanedPreviewUrl"
            class="preview-img rounded-borders shadow-2"
          />
          <div v-if="isSubmitting" class="scanner-bar" />
        </div>
      </div>

      <!-- 📋 Item Type -->
      <q-select
        filled
        dense
        v-model="itemType"
        label="Item Type"
        :options="itemOptions"
        style="width: 100%"
      />

      <!-- ✏️ Action Buttons -->
      <div class="row q-gutter-sm justify-center">
        <q-btn
          v-if="!showPromptEditor"
          label="✏️ Edit Prompt"
          color="primary"
          flat
          @click="showPromptEditor = true"
          :disable="isRoleBlocked"
        />
        <q-btn
          label="🔄 Reset Prompt"
          flat
          color="secondary"
          @click="resetPrompt"
          :disable="isRoleBlocked"
        />
      </div>

      <!-- 📝 Prompt Text -->
      <q-input
        v-if="showPromptEditor"
        filled
        v-model="prompt"
        type="textarea"
        autogrow
        label="AI Prompt"
        style="width: 100%"
      />

      <!-- 🚀 Submit -->
      <q-btn
        label="Submit Cleaning Evaluation"
        color="primary"
        class="q-mt-md"
        :loading="isSubmitting"
        @click="submitToAI"
        style="width: 100%"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import { useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";
import { useRouter } from "vue-router";
import { getDoc, doc } from "firebase/firestore";
import { db } from "src/firebase/init"; // or wherever your Firestore instance is
const router = useRouter();
const $q = useQuasar();
const dirtyImage = ref(null);
const cleanedImage = ref(null);
const dirtyPreviewUrl = ref("");
const cleanedPreviewUrl = ref("");

const zoomDialog = ref(false);
const zoomImageUrl = ref("");

const showPromptEditor = ref(false);

const userRole = ref("client"); // default

const itemTypeSelect = ref(null);

const isRoleBlocked = computed(() => {
  const allowed = ["admin", "merchant"];
  const role = userRole.value;
  return !(Array.isArray(role)
    ? role.some((r) => allowed.includes(r))
    : allowed.includes(role));
});

onMounted(async () => {
  const user = auth.currentUser;
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log("✅ Firestore user data:", data);
      userRole.value = data.role; // assign the real role
    }
  }
});

onMounted(() => {
  itemTypeSelect.value?.showPopup(); // Opens dropdown automatically
});

// You should load actual role from Firebase or your backend
// e.g., Firestore: users/{uid}.role

function hidePromptIfEmpty() {
  // Optional: hide editor again if prompt is empty
  if (prompt.value.trim() === "") {
    showPromptEditor.value = false;
  }
}

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
  { label: "👝 pouch", value: "pouch" },
  { label: "👛 wallet", value: "wallet" },
  { label: "👞 shoe", value: "shoe" },
  { label: "🧥 jacket", value: "jacket" },
  { label: "🛋️ sofa", value: "sofa" },
  { label: "🚗 car seat", value: "car seat" },
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

    wallet: `
Please evaluate the cleaning result of this leather wallet.

Focus on:
- Stain and grime removal from folds and edges,
- Restoration of shine and color,
- Visibility of scratches, wear marks, or surface dullness,
- Softness and flexibility of the leather.

Respond ONLY with this JSON structure:
${baseFields}
`,

    pouch: `
Please evaluate the cleaning result of this leather pouch.

Focus on:
- Surface stain removal,
- Restoration of color and shine,
- Damage on corners, zippers, or seams,
- Texture and suppleness of the leather.

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
    if (err.response?.status === 403) {
      $q.notify({
        type: "negative",
        message:
          err.response.data.message || "Trial limit reached. Please upgrade.",
      });
    } else {
      $q.notify({
        type: "negative",
        message: "Failed to get AI response. Please try again.",
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

function onDirtyChange(e) {
  dirtyImage.value = e.target.files[0];
  if (dirtyImage.value) {
    dirtyPreviewUrl.value = URL.createObjectURL(dirtyImage.value);
  }
}

function onCleanedChange(e) {
  cleanedImage.value = e.target.files[0];
  if (cleanedImage.value) {
    cleanedPreviewUrl.value = URL.createObjectURL(cleanedImage.value);
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

.image-preview {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.image-container {
  position: relative;
  height: 320px;
  overflow: hidden;
  border-radius: 8px;
}

.scanner-bar {
  position: absolute;
  top: 0;
  left: -60%;
  width: 40%;
  height: 100%;
  background: linear-gradient(
    to right,
    transparent,
    rgba(0, 174, 255, 0.4),
    transparent
  );
  animation: scan 2s linear infinite;
  pointer-events: none;
}

@keyframes scan {
  0% {
    left: -60%;
  }
  100% {
    left: 100%;
  }
}
</style>
