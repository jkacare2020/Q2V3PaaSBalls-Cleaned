<template>
  <q-page class="q-pa-md">
    <q-card flat class="q-pa-md q-mx-auto" style="max-width: 500px">
      <div class="text-h5 q-mb-sm">🧠 Try AI Leather Cleaner Report</div>
      <div class="text-subtitle1 q-mb-md">
        Upload your before/after bag photos. Get AI feedback and a PDF in 30
        seconds.
      </div>

      <q-file
        v-model="beforeImage"
        label="Upload BEFORE image"
        filled
        accept="image/*"
        class="q-mb-md"
      />
      <q-file
        v-model="afterImage"
        label="Upload AFTER image"
        filled
        accept="image/*"
        class="q-mb-md"
      />
      <q-select
        v-model="selectedItem"
        :options="itemOptions"
        label="Item Type"
        outlined
        emit-value
        map-options
        class="q-mt-md"
      />
      <q-btn
        label="🧼 Analyze & Generate Report"
        color="primary"
        :disable="!beforeImage || !afterImage || loading"
        @click="handleSubmit"
        class="full-width"
      />

      <q-banner v-if="resultText" class="q-mt-md bg-blue-1 text-blue-10">
        {{ resultText }}
      </q-banner>
      <div v-if="resultText" class="q-my-md">
        <canvas
          ref="pieChart"
          style="max-width: 250px; margin: 0 auto"
        ></canvas>
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
// Draw dummy chart once result is shown
import { ref, watch, nextTick } from "vue"; // ✅ Add nextTick
import Chart from "chart.js/auto";

const beforeImage = ref(null);
const afterImage = ref(null);
const resultText = ref("");
const loading = ref(false);

const pieChart = ref(null);
const chartInstance = ref(null);

const selectedItem = ref("leather bag"); // or default value

watch(resultText, async (newVal) => {
  if (newVal && !chartInstance.value) {
    await nextTick(); // ✅ Wait for DOM to update and canvas to exist

    if (pieChart.value) {
      chartInstance.value = new Chart(pieChart.value, {
        type: "doughnut",
        data: {
          labels: ["Cleaned", "Remaining"],
          datasets: [
            {
              data: [83, 17],
              backgroundColor: ["#66bb6a", "#ef5350"],
              borderWidth: 1,
            },
          ],
        },
        options: {
          cutout: "60%",
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            beforeDraw: function (chart) {
              const { width } = chart;
              const ctx = chart.ctx;
              ctx.restore();
              const fontSize = (width / 10).toFixed(2);
              ctx.font = `${fontSize}px sans-serif`;
              ctx.textBaseline = "middle";
              const text = "83%";
              const textX = Math.round(
                (width - ctx.measureText(text).width) / 2
              );
              const textY = chart.height / 2;
              ctx.fillText(text, textX, textY);
              ctx.save();
            },
          },
        },
      });
    }
  }
});

async function handleSubmit() {
  loading.value = true;
  setTimeout(async () => {
    resultText.value =
      "✅ AI Score: 83/100. Click below to download the report.";
    loading.value = false;
    await logTry(); // 👈 Add this
  }, 2000);
}

async function logTry() {
  try {
    await fetch(`${import.meta.env.VITE_API_LOCAL}/api/try-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType: selectedItem.value,
        score: 83,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }),
    });
  } catch (err) {
    console.error("Logging failed:", err);
  }
}
</script>
