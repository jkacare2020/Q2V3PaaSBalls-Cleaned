<template>
  <q-page class="q-pa-md" :class="{ 'bg-dark text-white': isDark }">
    <div class="row items-center q-mb-md justify-between">
      <div class="text-h5">Vision Logs</div>
      <q-btn
        label="Export PDF"
        color="red"
        icon="picture_as_pdf"
        @click="exportToPDF"
      />
    </div>

    <q-toggle
      v-model="showOnlyVision"
      label="Show only vision logs"
      class="q-mb-md"
    />

    <q-markup-table
      v-if="$q.screen.gt.sm && filteredLogs.length"
      :class="[isDark ? 'bg-grey-9 text-white' : 'bg-grey-1']"
      flat
      bordered
      wrap-cells
    >
      <thead>
        <tr>
          <th class="text-left">Images</th>
          <th class="text-left">Feedback</th>
          <th class="text-left">Prompt</th>
          <th class="text-left">Timestamp</th>
          <th class="text-left">Details</th>
          <th class="text-left">PDF</th>
          <th class="text-left">Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in filteredLogs" :key="log._id">
          <td>
            <q-btn
              label="View Images"
              icon="image"
              color="primary"
              dense
              @click="openImagePair(log.imageUrls)"
            />
          </td>
          <td>{{ log.response?.text || log.response }}</td>
          <td>{{ log.query }}</td>
          <td>{{ formatDate(log.timestamp) }}</td>
          <td>
            <q-btn
              label="View Details"
              color="primary"
              icon="open_in_new"
              @click="goToDetails"
            />
          </td>
          <td>
            <q-btn
              dense
              icon="picture_as_pdf"
              color="red"
              @click="exportSingleLog(log)"
            >
              <q-tooltip>Export this log to PDF</q-tooltip>
            </q-btn>
          </td>

          <td>
            <q-btn
              dense
              flat
              icon="delete"
              color="negative"
              @click="confirmDelete(log._id)"
            />
          </td>
        </tr>
      </tbody>
    </q-markup-table>

    <div v-else>
      <q-card
        v-for="log in filteredLogs"
        :key="log._id"
        class="q-mb-md shadow-2"
      >
        <q-card-section>
          <q-btn
            label="View Images"
            icon="image"
            color="primary"
            dense
            @click="openImagePair(log.imageUrls)"
          />
        </q-card-section>

        <q-card-section>
          <div class="text-bold">📝 Feedback:</div>
          <div class="q-mb-sm">{{ log.response?.text || log.response }}</div>

          <div class="q-mt-xs text-caption">
            <strong>📌 Prompt:</strong> {{ log.query }}
          </div>
          <div class="text-caption">
            <strong>⏰ Timestamp:</strong> {{ formatDate(log.timestamp) }}
          </div>

          <div class="q-mt-sm">
            <q-btn
              label="View Details"
              color="primary"
              icon="open_in_new"
              dense
              @click="goToDetails"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <q-dialog v-model="showPreviewDialog" maximized>
      <q-card class="q-pa-md">
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-6">
            <q-img
              v-if="previewImages[0]"
              :src="previewImages[0]"
              style="width: 100%; height: 80vh"
              fit="contain"
            />
            <div class="text-caption text-center q-mt-sm">Before</div>
          </div>
          <div class="col-12 col-md-6">
            <q-img
              v-if="previewImages[1]"
              :src="previewImages[1]"
              style="width: 100%; height: 80vh"
              fit="contain"
            />
            <div class="text-caption text-center q-mt-sm">After</div>
          </div>
        </div>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-banner v-if="!filteredLogs.length" class="bg-grey-3 q-mt-md">
      No logs found for this user.
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { apiNode } from "src/boot/apiNode";
import { auth } from "src/firebase/init";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { onAuthStateChanged } from "firebase/auth";

import { useRouter } from "vue-router";
const router = useRouter();

const $q = useQuasar();
const visionLogs = ref([]);
const showOnlyVision = ref(true);
const showPreviewDialog = ref(false);
const previewImages = ref([null, null]);

const openImagePair = (urls) => {
  previewImages.value = urls;
  showPreviewDialog.value = true;
};

const isDark = computed(() => $q.dark.isActive);

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const token = await user.getIdToken();

    try {
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
});

const filteredLogs = computed(() => {
  return showOnlyVision.value
    ? visionLogs.value.filter((log) => log.type === "vision")
    : visionLogs.value;
});

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString();
}

async function exportToPDF() {
  const doc = new jsPDF();
  doc.text("Vision Log Report", 14, 10);
  autoTable(doc, {
    head: [["Prompt", "Feedback", "Timestamp"]],
    body: filteredLogs.value.map((log) => [
      log.query,
      log.response?.text || log.response,
      formatDate(log.timestamp),
    ]),
    startY: 20,
    styles: { fontSize: 10, cellPadding: 3, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 90 },
      2: { cellWidth: 40 },
    },
  });
  doc.save(`vision_logs_${new Date().toISOString().slice(0, 10)}.pdf`);
}

function goToDetails() {
  router.push("/vision-details"); // route name or path
}

async function confirmDelete(id) {
  $q.dialog({
    title: "Confirm Deletion",
    message: "Are you sure you want to delete this log?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      await apiNode.delete(`/api/chatbot/log/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      visionLogs.value = visionLogs.value.filter((log) => log._id !== id);
      $q.notify({ type: "positive", message: "Log deleted successfully." });
    } catch (err) {
      console.error("Error deleting log:", err);
      $q.notify({ type: "negative", message: "Failed to delete log." });
    }
  });
}
//-----------------------------------------------------------------------
async function toBase64Image(imageUrl) {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function exportSingleLog(log) {
  const doc = new jsPDF();
  const title = "AI Cleaning Report";
  const date = new Date(log.timestamp).toLocaleString();
  let y = 15;

  doc.setFontSize(16);
  doc.text(title, 14, y);
  y += 10;

  doc.setFontSize(12);
  doc.text("AI Feedback:", 14, y);
  y += 8;

  doc.setFontSize(10);

  const feedback = log.response?.text || log.response || "";
  const feedbackText =
    typeof feedback === "object"
      ? JSON.stringify(feedback, null, 2)
      : String(feedback);

  const feedbackLines = doc.splitTextToSize(feedbackText, 180);
  doc.text(feedbackLines, 14, y);
  y += feedbackLines.length * 6 + 4;

  doc.text(`Timestamp: ${date}`, 14, y);
  y += 10;

  // try {
  //   if (log.imageUrls && log.imageUrls.length >= 2) {
  //     const [beforeUrl, afterUrl] = log.imageUrls;
  //     const beforeImg = await toBase64Image(beforeUrl);
  //     const afterImg = await toBase64Image(afterUrl);

  //     const imgHeight = 60;
  //     const imgWidth = 80;

  //     if (y + imgHeight > 270) {
  //       doc.addPage();
  //       y = 20;
  //     }

  //     doc.addImage(beforeImg, "JPEG", 14, y, imgWidth, imgHeight);
  //     doc.text("Before", 14, y + imgHeight + 5);

  //     doc.addImage(afterImg, "JPEG", 110, y, imgWidth, imgHeight);
  //     doc.text("After", 110, y + imgHeight + 5);
  //   }
  // } catch (err) {
  //   console.warn("Image embedding failed:", err);
  //   doc.text("Failed to embed images", 14, y);
  // }

  doc.save(`vision_log_${log._id}.pdf`);
}
</script>

<style scoped>
.q-img {
  border-radius: 8px;
  object-fit: cover;
}
</style>
