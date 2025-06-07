<template>
  <!--PageBluebookBag --->
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          👜 Bluebook Bag Cleaning Estimator (AI-Powered)
        </div>

        <q-file
          v-model="imageFile"
          label="Upload Bag Image"
          accept="image/*"
          filled
          class="q-mt-md"
          @update:model-value="onFileChange"
        />

        <div v-if="imagePreview" class="q-mt-md relative-position">
          <img
            :src="imagePreview"
            ref="imageRef"
            @load="drawHighlights"
            class="full-width bordered"
          />
          <canvas
            ref="canvasRef"
            class="absolute-top-left"
            style="pointer-events: none"
          />
        </div>

        <div class="row q-gutter-md q-mt-md">
          <q-btn
            label="🧠 Detect Brand/Material"
            color="secondary"
            :to="{ path: '/detect-brand' }"
            icon="science"
          />
          <q-btn
            label="👜 Estimate Cleaning Price"
            color="blue"
            class="q-mt-md"
            @click="mapPriceEstimating"
            :disable="!imageFile || loading"
            icon="price_change"
          />
        </div>

        <div v-if="loading" class="q-mt-md flex flex-center">
          <q-spinner-dots size="40px" color="primary" />
          <div class="q-ml-sm">Analyzing image with AI...</div>
        </div>

        <transition
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
        >
          <q-banner
            v-if="analysisResult"
            class="q-mt-md bg-blue-1 text-blue-10"
          >
            <div><strong>Material:</strong> {{ analysisResult.material }}</div>
            <div>
              <strong>Stain Type:</strong> {{ analysisResult.stainType }}
            </div>
            <div>
              <strong>Stain Count:</strong> {{ analysisResult.stainCount }}
            </div>

            <div v-if="analysisResult.stainLocations?.length">
              <strong>Stain Locations:</strong>
              <ul>
                <li
                  v-for="(loc, index) in analysisResult.stainLocations"
                  :key="index"
                >
                  {{ loc }}
                </li>
              </ul>
            </div>

            <q-input
              v-model.number="analysisResult.stainCount"
              label="Override Stain Count (optional)"
              type="number"
              min="0"
              dense
              class="q-mt-sm"
            />
          </q-banner>
        </transition>

        <transition
          appear
          enter-active-class="animated fadeInUp"
          leave-active-class="animated fadeOutDown"
        >
          <div v-if="pricingResult !== null" class="q-mt-md">
            <div class="text-subtitle1">💲 Estimated Cleaning Cost</div>
            <q-card flat bordered class="q-mt-sm">
              <q-card-section>
                <div>
                  <strong>Consumer Price:</strong> ${{
                    pricingResult.consumerPrice
                  }}
                </div>
                <div>
                  <strong>Merchant Price:</strong> ${{
                    pricingResult.merchantPrice
                  }}
                </div>
                <div>
                  <strong>Market Range:</strong> ${{
                    pricingResult.marketRange.low
                  }}
                  - ${{ pricingResult.marketRange.high }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </transition>

        <transition
          appear
          enter-active-class="animated fadeIn"
          leave-active-class="animated fadeOut"
        >
          <div
            v-if="analysisResult?.cleaningInstructions?.length"
            class="q-mt-md"
          >
            <div class="text-subtitle1">
              📌 AI Cleaning Instructions Per Zone
            </div>
            <q-card flat bordered class="q-mt-sm">
              <q-card-section>
                <div
                  v-for="(item, index) in analysisResult.cleaningInstructions"
                  :key="index"
                  class="q-mb-sm"
                >
                  <div>
                    <strong>{{ item.location }}</strong>
                  </div>
                  <div>
                    <em>{{ item.product }}</em>
                  </div>
                  <div>{{ item.usage }}</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </transition>

        <q-expansion-item
          label="📦 Raw AI Output"
          v-if="analysisResult"
          class="q-mt-md"
        >
          <pre>{{ JSON.stringify(analysisResult, null, 2) }}</pre>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { onMounted, nextTick } from "vue";
import { useQuasar } from "quasar";
import { apiNode } from "boot/apiNode";

const imagePreview = ref(null);

const $q = useQuasar();
const imageFile = ref(null);
const loading = ref(false);
const analysisResult = ref(null);
const pricingResult = ref(null);

watch(
  () => analysisResult.value?.stainCount,
  (newCount) => {
    if (
      newCount != null &&
      analysisResult.value?.material &&
      analysisResult.value?.stainType
    ) {
      const basePrices = { leather: 25, suede: 30, canvas: 15 };
      const multipliers = {
        mold: 2,
        oil: 1.8,
        ink: 1.6,
        water: 1.2,
        dirt: 1.3,
      };
      const material = analysisResult.value.material.toLowerCase();
      const stainType = analysisResult.value.stainType.toLowerCase();

      const base = basePrices[material] || 20;
      const multiplier = multipliers[stainType] || 1.0;

      const consumer = Math.round(base + newCount * multiplier * 5);
      const merchant = Math.round(consumer * 0.8);
      const market = {
        leather: { low: 40, high: 80 },
        suede: { low: 45, high: 90 },
        canvas: { low: 30, high: 60 },
      }[material] || { low: 35, high: 70 };

      pricingResult.value = {
        consumerPrice: consumer,
        merchantPrice: merchant,
        marketRange: market,
      };
    }
  }
);

async function mapPriceEstimating() {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("image", imageFile.value);

    const { data } = await apiNode.post(
      "/api/vision/map-price-estimate",
      formData
    );

    analysisResult.value = {
      material: data.material,
      stainType: data.stainType,
      stainCount: data.stainCount,
      stainLocations: data.stainLocations || [],
      cleaningInstructions: data.cleaningInstructions || [],
      stainCoordinates: data.stainCoordinates || [], // ✅ new
    };

    analysisResult.value.stainCoordinates = [
      { x: 100, y: 120, radius: 30 },
      { x: 200, y: 160, radius: 25 },
      { x: 300, y: 220, radius: 20 },
    ];

    await nextTick();
    drawHighlights();

    pricingResult.value = {
      consumerPrice: data.consumerPrice,
      merchantPrice: data.merchantPrice,
      marketRange: data.marketRange,
    };
  } catch (err) {
    if (err.response?.status === 403) {
      $q.notify({
        type: "negative",
        message:
          err.response.data.message || "Trial limit reached. Please upgrade.",
      });
    } else {
      $q.notify({
        type: "negative",
        message: "AI pricing failed. Please try again.",
      });
    }
  } finally {
    loading.value = false;
  }
}

function onFileChange(file) {
  if (file) {
    imagePreview.value = URL.createObjectURL(file);
  } else {
    imagePreview.value = null;
  }
}
//------------------------------------------------------------

const canvasRef = ref(null);
const imageRef = ref(null);

// 🟡 Draw stain circles when image is loaded
async function drawHighlights() {
  await nextTick();

  const canvas = canvasRef.value;
  const image = imageRef.value;
  if (!canvas || !image || !analysisResult.value?.stainCoordinates) return;

  const ctx = canvas.getContext("2d");
  const rect = image.getBoundingClientRect();

  canvas.width = rect.width;
  canvas.height = rect.height;
  canvas.style.width = rect.width + "px";
  canvas.style.height = rect.height + "px";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;

  const stainCoords = analysisResult.value.stainCoordinates;

  stainCoords.forEach((stain) => {
    // Normalize and apply shift
    let x = (stain.x / image.naturalWidth) * rect.width;
    let y = (stain.y / image.naturalHeight) * rect.height;

    x += rect.width * 0.16; // ➕ Shift right 10%
    y += rect.height * 0.22; // ➕ Shift down 10%

    const r = (stain.radius / image.naturalWidth) * rect.width;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
  });
}
</script>

<style scoped>
.text-subtitle1 {
  font-size: 1.2rem;
}

.relative-position {
  position: relative;
}
.absolute-top-left {
  position: absolute;
  top: 0;
  left: 0;
}
.full-width {
  width: 100%;
  display: block;
}
.bordered {
  border: 1px solid #ccc;
  border-radius: 4px;
}

canvas {
  background-color: rgba(0, 0, 255, 0.05); /* light blue */
  z-index: 10;
}
</style>
