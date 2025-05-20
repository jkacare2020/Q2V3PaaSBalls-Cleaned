<template>
  <!--PageVisionDetails.vue--->
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">🧼 Restoration Job Evaluation</div>

    <q-markup-table
      v-if="evaluation && Object.keys(evaluation).length > 0"
      flat
      bordered
      class="bg-grey-1"
    >
      <thead>
        <tr>
          <th style="width: 200px">Metric</th>
          <th style="white-space: pre-line">Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>🧽 Dirty Areas Detected</td>
          <td>{{ evaluation.dirtyAreas }}</td>
        </tr>
        <tr>
          <td>✅ Cleaning Score</td>
          <td>{{ evaluation.cleaningScore }} / 100</td>
        </tr>
        <tr>
          <td>🎨 Color Restoration</td>
          <td>{{ evaluation.colorRestoration }} / 100</td>
        </tr>
        <tr>
          <td>🪞 Visible Scuffs</td>
          <td class="wrap-text">{{ evaluation.scuffVisibility }}</td>
        </tr>
        <tr>
          <td>✨ Leather Texture & Shine</td>
          <td class="wrap-text">{{ evaluation.textureAndShine }}</td>
        </tr>
        <tr>
          <td>🔍 Damage Detected</td>
          <td>{{ evaluation.damageDetected ? "Yes" : "No" }}</td>
        </tr>
        <tr>
          <td>📝 Summary</td>
          <td class="wrap-text">{{ evaluation.summary }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <q-banner v-else class="bg-grey-3 q-mt-md">
      No evaluation data available.
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiNode } from "src/boot/apiNode";
import { auth } from "src/firebase/init";

const evaluation = ref(null);

onMounted(async () => {
  const user = auth.currentUser;
  if (!user) return;
  const token = await user.getIdToken();
  try {
    const res = await apiNode.get("/api/chatbot/latest-vision-eval", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ Check if response is a stringified JSON
    if (typeof res.data === "string") {
      if (typeof res.data === "string") {
        evaluation.value = JSON.parse(res.data);
      } else if (res.data?.text && typeof res.data.text === "string") {
        evaluation.value = JSON.parse(res.data.text);
      } else {
        evaluation.value = res.data;
      }
    } else if (res.data?.text && typeof res.data.text === "string") {
      evaluation.value = JSON.parse(res.data.text); // ← your current structure
    } else {
      evaluation.value = res.data;
    }

    console.log("✅ Parsed evaluation:", evaluation.value);
  } catch (err) {
    console.error("Failed to load evaluation:", err);
  }
});
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
