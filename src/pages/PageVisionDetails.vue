<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">🧼 Restoration Job Evaluation</div>

    <q-markup-table v-if="evaluation" flat bordered class="bg-grey-1">
      <thead>
        <tr>
          <th style="width: 200px">Metric</th>
          <th style="white-space: pre-line">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>🧽 Dirty Areas Detected</td>
          <td>{{ evaluation.dirtyAreas || 0 }}</td>
        </tr>
        <tr>
          <td>✅ Cleaning Score</td>
          <td>
            {{ evaluation.cleaningScore || 0 }} / 100 ({{
              evaluation.cleaningScore || 0
            }}
            points)
          </td>
        </tr>
        <tr>
          <td>🎨 Color Restoration</td>
          <td>
            {{ evaluation.colorRestoration || 0 }} / 100 ({{
              evaluation.colorRestoration || 0
            }}
            points)
          </td>
        </tr>
        <tr>
          <td>🪞 Visible Scuffs</td>
          <td class="wrap-text">{{ evaluation.scuffVisibility || "N/A" }}</td>
        </tr>
        <tr>
          <td>✨ Leather Texture & Shine</td>
          <td class="wrap-text">{{ evaluation.textureAndShine || "N/A" }}</td>
        </tr>
        <tr>
          <td>🔍 Damage Detected</td>
          <td>{{ evaluation.damageDetected === false ? "No" : "Yes" }}</td>
        </tr>
        <tr>
          <td>📝 Summary</td>
          <td class="wrap-text">{{ evaluation.summary || "N/A" }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <div v-if="evaluation" class="q-mt-xl">
      <div class="text-subtitle1 q-mb-sm">📊 Visual Summary</div>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <canvas id="cleaningScoreChart"></canvas>
        </div>
        <div class="col-12 col-md-6">
          <canvas id="colorRestorationChart"></canvas>
        </div>
      </div>
    </div>

    <q-banner v-else class="bg-grey-3 q-mt-md">
      No evaluation data available.
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiNode } from "src/boot/apiNode";
import { auth } from "src/firebase/init";
import Chart from "chart.js/auto";
import { useRoute } from "vue-router";
const route = useRoute();

const evaluation = ref(null);

//-----------------------------------------

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) return;

  const token = await user.getIdToken();
  const sessionId = route.query.sessionId;

  try {
    const url = sessionId
      ? `/api/chatbot/vision-eval/${sessionId}`
      : `/api/chatbot/latest-vision-eval`;

    const res = await apiNode.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const raw = res.data;
    let parsed = raw;

    // 🧠 Robust parser for `response.text` format
    if (raw?.text && typeof raw.text === "string") {
      try {
        const cleanText = raw.text
          .replace(/^```json/, "")
          .replace(/^```/, "")
          .replace(/```$/, "")
          .trim();

        parsed = JSON.parse(cleanText);
      } catch (err) {
        console.warn("⚠️ Failed to parse evaluation text as JSON:", err);
      }
    }

    evaluation.value = parsed;
    drawCharts();
  } catch (err) {
    console.error("❌ Failed to load evaluation:", err);
  }
});
//--------------------------------------------------------

// onMounted(async () => {
//   const user = auth.currentUser;
//   if (!user) return;
//   const token = await user.getIdToken();
//   try {
//     const res = await apiNode.get("/api/chatbot/latest-vision-eval", {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     const raw = res.data;

//     let parsed = raw;

//     // If `text` is a stringified JSON with ```json...``` wrapper
//     if (raw?.text && typeof raw.text === "string") {
//       try {
//         const cleanText = raw.text
//           .replace(/^```json/, "")
//           .replace(/^```/, "")
//           .replace(/```$/, "")
//           .trim();

//         parsed = JSON.parse(cleanText);
//       } catch (err) {
//         console.warn("Text field not JSON:", err);
//       }
//     }

//     evaluation.value = parsed;

//     drawCharts();
//   } catch (err) {
//     console.error("Failed to load evaluation:", err);
//   }
// });
//-------------------------------
function drawCharts() {
  setTimeout(() => {
    if (!evaluation.value) return;

    new Chart(document.getElementById("cleaningScoreChart"), {
      type: "doughnut",
      data: {
        labels: ["Cleaned", "Remaining"],
        datasets: [
          {
            data: [
              evaluation.value.cleaningScore || 0,
              100 - (evaluation.value.cleaningScore || 0),
            ],
            backgroundColor: ["#4CAF50", "#E0E0E0"],
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Cleaning Score",
          },
        },
      },
    });

    new Chart(document.getElementById("colorRestorationChart"), {
      type: "doughnut",
      data: {
        labels: ["Restored", "Unrestored"],
        datasets: [
          {
            data: [
              evaluation.value.colorRestoration || 0,
              100 - (evaluation.value.colorRestoration || 0),
            ],
            backgroundColor: ["#03A9F4", "#E0E0E0"],
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: "Color Restoration",
          },
        },
      },
    });
  }, 100);
}
</script>

<style scoped>
.q-markup-table td {
  vertical-align: top;
}
.wrap-text {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
