<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">🧠 Vision Logs</div>

    <q-markup-table
      v-if="$q.screen.gt.sm && visionLogs.length"
      class="bg-grey-1 q-mb-lg"
      flat
      bordered
      wrap-cells
    >
      <thead>
        <tr>
          <th class="text-left">Before</th>
          <th class="text-left">After</th>
          <th class="text-left">Feedback</th>
          <th class="text-left">Prompt</th>
          <th class="text-left">Timestamp</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in visionLogs" :key="log._id">
          <td><q-img :src="log.imageUrls[0]" style="max-width: 120px" /></td>
          <td><q-img :src="log.imageUrls[1]" style="max-width: 120px" /></td>
          <td>{{ log.response?.text }}</td>
          <td>{{ log.query }}</td>
          <td>{{ formatDate(log.timestamp) }}</td>
        </tr>
      </tbody>
    </q-markup-table>

    <div v-else>
      <q-card v-for="log in visionLogs" :key="log._id" class="q-mb-md shadow-2">
        <q-card-section class="row items-start">
          <q-img :src="log.imageUrls[0]" class="q-mr-sm" style="width: 45%" />
          <q-img :src="log.imageUrls[1]" style="width: 45%" />
        </q-card-section>
        <q-card-section>
          <div class="text-bold">Feedback:</div>
          <div>{{ log.response?.text }}</div>
          <div class="q-mt-sm text-caption">Prompt: {{ log.query }}</div>
          <div class="text-caption">{{ formatDate(log.timestamp) }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-banner v-if="!visionLogs.length" class="bg-grey-3 q-mt-md">
      No vision logs found for this user.
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { apiNode } from "boot/apiNode";
import { auth } from "src/firebase/init";

const $q = useQuasar();
const visionLogs = ref([]);

onMounted(async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();
    const res = await apiNode.get("/api/chatbot/vision-logs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    visionLogs.value = res.data;
  } catch (err) {
    console.error("Failed to load vision logs:", err);
    $q.notify({ type: "negative", message: "Failed to load vision logs." });
  }
});

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString();
}
</script>

<style scoped>
.q-img {
  border-radius: 8px;
  object-fit: cover;
}
</style>
