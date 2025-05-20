<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <q-card-section>
        <div class="text-h6 text-center">Chat History</div>
      </q-card-section>

      <q-card-section>
        <q-table
          flat
          bordered
          title="Chat Logs"
          :rows="chatLogs"
          :columns="columns"
          row-key="timestamp"
        >
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td key="timestamp">{{ formatDate(props.row.timestamp) }}</q-td>
              <q-td key="query">{{ props.row.query }}</q-td>
              <q-td key="response">{{ props.row.response }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>

      <q-card-section class="row justify-end q-gutter-md">
        <q-btn
          label="Export CSV"
          color="secondary"
          icon="download"
          @click="exportToCSV"
        />
        <q-btn
          label="Export PDF"
          color="red"
          icon="picture_as_pdf"
          @click="exportToPDF"
        />
        <q-btn label="Back to Chatbot" color="primary" @click="goBack" />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { auth } from "src/firebase/init"; // Ensure correct import for Firebase Auth
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiNode } from "boot/apiNode";

// ✅ Define table columns
const columns = [
  { name: "timestamp", label: "Timestamp", field: "timestamp", align: "left" },
  { name: "query", label: "User Message", field: "query", align: "left" },
  { name: "response", label: "Bot Response", field: "response", align: "left" },
];

const getFirebaseToken = async () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe(); // Stop listening once we get the user state
      if (!user) {
        console.error("❌ User not authenticated.");
        resolve(null);
      } else {
        try {
          const token = await user.getIdToken(true);
          console.log("🔥 Retrieved Firebase ID Token:", token);
          localStorage.setItem("access_token", token);
          resolve(token);
        } catch (error) {
          console.error("❌ Error retrieving Firebase token:", error);
          resolve(null);
        }
      }
    });
  });
};

// Fetch the token once at app start or login
getFirebaseToken();

const chatLogs = ref([]);

// ✅ Get fresh Firebase token
const getValidToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("❌ User not authenticated.");
    return null;
  }
  try {
    const token = await currentUser.getIdToken(true); // Refresh token
    console.log("🔥 Fresh Firebase Token:", token);
    return token;
  } catch (error) {
    console.error("❌ Error retrieving Firebase token:", error);
    return null;
  }
};

// ✅ Fetch chat logs from backend
const fetchChatHistory = async () => {
  try {
    console.log("Fetching Chat History...");

    const token = await getValidToken();
    if (!token) throw new Error("No access token found");

    const response = await apiNode.get("/api/chatbot/history", {
      headers: { Authorization: `Bearer ${token}` },
    });

    let data = response.data;
    console.log("🔥 RAW API Response:", data);

    if (!Array.isArray(data)) {
      data = [data]; // Wrap single object into an array
    }

    chatLogs.value = data.map((log) => ({
      timestamp: log.timestamp
        ? new Date(log.timestamp).toLocaleString()
        : "N/A",
      query: log.query || "N/A",
      response: log.response || "N/A",
    }));

    console.log("✅ Processed Chat Logs:", chatLogs.value);
  } catch (error) {
    console.error("❌ Error fetching chat history:", error);
  }
};

// ✅ Fetch chat history on component mount
onMounted(async () => {
  // ✅ Try loading cached chat logs first
  const savedLogs = localStorage.getItem("chat_logs");
  if (savedLogs) {
    chatLogs.value = JSON.parse(savedLogs);
    console.log("📌 Loaded Cached Chat Logs:", chatLogs.value);
  }

  // ✅ Ensure a fresh token & fetch new chat logs
  await getValidToken();
  fetchChatHistory();
});

// ✅ Format timestamp
const formatDate = (timestamp) => {
  return timestamp ? new Date(timestamp).toLocaleString() : "N/A";
};

//---------- Export CSV ---------------------------

const exportToCSV = () => {
  console.log("🔍 Exporting CSV, Current Chat Logs:", chatLogs.value);

  if (!chatLogs.value.length) {
    console.error("❌ No chat logs available for export.");
    alert("No chat logs found to export!");
    return;
  }

  const headers = ["Timestamp", "User Message", "Bot Response"];
  const formattedData = chatLogs.value.map((log) => [
    log.timestamp || "N/A",
    log.query || "N/A",
    log.response || "N/A",
  ]);

  const csvData = Papa.unparse({
    fields: headers,
    data: formattedData,
  });

  console.log("✅ Generated CSV Data:", csvData);

  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `chat_history_${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

//---------- Export PDF ---------------------------

const exportToPDF = () => {
  console.log("🔍 Exporting PDF, Current Chat Logs:", chatLogs.value);

  if (!chatLogs.value.length) {
    console.error("❌ No chat logs available for export.");
    alert("No chat logs found to export!");
    return;
  }

  // ✅ Create a PDF document
  const doc = new jsPDF();
  doc.text("Chat History", 14, 10);

  console.log("🚀 Checking autoTable availability:", autoTable); // Debugging

  // ✅ Ensure autoTable is called properly
  autoTable(doc, {
    head: [["Timestamp", "User Message", "Bot Response"]],
    body: chatLogs.value.map((log) => [
      log.timestamp || "N/A",
      log.query || "N/A",
      log.response || "N/A",
    ]),
    startY: 20,
    styles: { fontSize: 10, cellPadding: 3, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 40 }, // Timestamp
      1: { cellWidth: 75 }, // User Message
      2: { cellWidth: 75 }, // Bot Response
    },
  });

  // ✅ Save the PDF
  doc.save(`chat_history_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ✅ Go Back to Chatbot
const goBack = () => {
  window.history.back();
};
</script>
