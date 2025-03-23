<template>
  <q-page class="q-pa-md">
    <q-toolbar>
      <q-toolbar-title>Resume Analysis History</q-toolbar-title>
      <q-btn color="primary" @click="fetchChatLogs">Refresh</q-btn>
    </q-toolbar>

    <q-table
      :rows="chatLogs"
      :columns="columns"
      row-key="_id"
      flat
      bordered
      dense
      class="my-styled-table"
      v-if="!loading"
    >
      <!-- Timestamp Column -->
      <template v-slot:body-cell-timestamp="{ row }">
        <q-td>{{ formatDate(row.timestamp) }}</q-td>
      </template>

      <!-- Response Column (View Analysis Button) -->
      <template v-slot:body-cell-response="{ row }">
        <q-td class="text-left">
          <q-btn
            color="primary"
            dense
            size="sm"
            @click="viewAnalysis(row)"
            label="View Analysis"
          />
        </q-td>
      </template>

      <!-- Action Column: Edit, Delete, Download PDF -->
      <template v-slot:body-cell-actions="{ row }">
        <q-td class="text-center">
          <!-- Edit Button -->
          <q-btn
            color="secondary"
            dense
            size="sm"
            icon="edit"
            @click="editResume(row)"
            class="q-mr-sm"
          />

          <!-- Delete Button -->
          <q-btn
            color="negative"
            dense
            size="sm"
            icon="delete"
            @click="confirmDelete(row._id)"
            class="q-mr-sm"
          />

          <!-- Download PDF Button -->
          <q-btn
            color="blue"
            dense
            size="sm"
            icon="download"
            @click="downloadPDF(row._id)"
          />
        </q-td>
      </template>
    </q-table>

    <q-spinner v-if="loading" color="primary" size="md" />

    <!-- Modal to Show Analysis Details -->
    <q-dialog v-model="analysisDialog">
      <q-card style="width: 600px; max-width: 90vw">
        <q-card-section>
          <q-toolbar>
            <q-toolbar-title>Resume Analysis Details</q-toolbar-title>
            <q-btn flat round icon="close" @click="analysisDialog = false" />
          </q-toolbar>
        </q-card-section>

        <!-- Styled Scrollable Section -->
        <q-card-section class="analysis-content">
          <pre>{{ formattedAnalysis }}</pre>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="Close"
            color="primary"
            @click="analysisDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";

const $q = useQuasar();
const chatLogs = ref([]);
const loading = ref(false);
const analysisDialog = ref(false);
const selectedAnalysis = ref(null);
const errorMessage = ref("");
const FASTAPI_URL = process.env.VUE_APP_FASTAPI_URL;

const columns = [
  { name: "_id", label: "ID", field: "_id", align: "left" },
  { name: "query", label: "Query", field: "query", align: "left" },
  { name: "timestamp", label: "Timestamp", field: "timestamp", align: "left" },
  { name: "response", label: "Response", field: "response", align: "left" }, // ✅ Ensured Left Alignment
  { name: "actions", label: "Actions", align: "center" }, // ✅ Add Actions Column
];

// Fetch Chat Logs from Backend
const fetchChatLogs = async () => {
  try {
    loading.value = true;
    const token = localStorage.getItem("access_token");

    if (!token) {
      errorMessage.value = "Authentication token is missing!";
      return;
    }

    const response = await axios.get(`${FASTAPI_URL}/ai/hr/chatlogs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    chatLogs.value = response.data;
    console.log("Chat logs retrieved:", chatLogs.value);
  } catch (error) {
    errorMessage.value = "Failed to fetch chat logs.";
    console.error("Error fetching chat logs:", error);
  } finally {
    loading.value = false;
  }
};

// Show Full Resume Analysis in Modal
const viewAnalysis = (response) => {
  try {
    selectedAnalysis.value =
      typeof response === "string" ? JSON.parse(response) : response; // Ensure it's an object
    analysisDialog.value = true;
  } catch (error) {
    console.error("❌ Error parsing response:", error);
    selectedAnalysis.value = { error: "Invalid JSON format" };
  }
};

// Format JSON for Readable Display in Modal
const formattedAnalysis = computed(() => {
  return selectedAnalysis.value
    ? JSON.stringify(selectedAnalysis.value, null, 2) // Pretty print JSON
    : "No Analysis Data Available.";
});

// Format Timestamp for Readability
const formatDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleString(); // ✅ Converts to readable local format
};

// ✅ Edit Resume Analysis
const editResume = (row) => {
  $q.dialog({
    title: "Edit Resume Entry",
    message: "Modify resume analysis details",
    prompt: {
      model: JSON.stringify(row.response, null, 2),
      type: "textarea",
    },
    cancel: true,
    persistent: true,
  }).onOk(async (newData) => {
    try {
      const token = localStorage.getItem("access_token"); // ✅ Ensure token retrieval
      if (!token) {
        console.error("❌ No access token found!");
        $q.notify({
          type: "negative",
          message: "Authentication error. Please log in again.",
        });
        return;
      }

      // ✅ Validate if newData is already a JSON object
      let updatedResponse;
      try {
        updatedResponse =
          typeof newData === "string" ? JSON.parse(newData) : newData;
      } catch (parseError) {
        console.error("❌ JSON Parsing Error:", parseError);
        $q.notify({
          type: "negative",
          message: "Invalid JSON format. Please check the input.",
        });
        return;
      }

      await axios.put(
        `${FASTAPI_URL}/ai/hr/chatlogs/${row._id}`,
        { response: updatedResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      $q.notify({ type: "positive", message: "Resume updated successfully!" });
      fetchChatLogs(); // ✅ Refresh the table after updating
    } catch (error) {
      console.error("🔥 Error updating resume:", error);
      $q.notify({ type: "negative", message: "Failed to update resume" });
    }
  });
};

// ✅ Delete Resume Analysis (Confirm before deleting)
const confirmDelete = (logId) => {
  $q.dialog({
    title: "Confirm Delete",
    message: "Are you sure you want to delete this entry?",
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      const token = localStorage.getItem("access_token"); // ✅ Retrieve token here
      if (!token) {
        console.error("❌ No access token found!");
        $q.notify({
          type: "negative",
          message: "Authentication error. Please log in again.",
        });
        return;
      }

      await axios.delete(`${FASTAPI_URL}/ai/hr/chatlogs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      $q.notify({ type: "positive", message: "Resume deleted successfully!" });

      // ✅ Refresh table after deletion
      fetchChatLogs();
    } catch (error) {
      console.error("🔥 Error deleting resume:", error);
      $q.notify({ type: "negative", message: "Failed to delete resume" });
    }
  });
};

// ✅ Download Resume PDF
const downloadPDF = async (resumeId) => {
  try {
    const res = await axios.get(
      `${FASTAPI_URL}/ai/hr/generate-resume-pdf?resume_id=${resumeId}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      }
    );

    // Create a blob URL for downloading
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resume_analysis_${resumeId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("🔥 Error downloading PDF:", error);
    $q.notify({ type: "negative", message: "Failed to download PDF" });
  }
};

onMounted(fetchChatLogs);
</script>

<style scoped>
/* ✅ Add a grey background and scrollbar */
.analysis-content {
  background-color: #f5f5f5; /* Light grey background */
  padding: 15px;
  max-height: 300px; /* Limits height to enable scrolling */
  overflow-y: auto; /* Enables vertical scroll when needed */
  border-radius: 5px;
}

/* ✅ Improve JSON formatting readability */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
  padding: 10px;
  border-radius: 5px;
}
</style>
