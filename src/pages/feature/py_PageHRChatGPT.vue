<template>
  <q-page class="q-pa-md">
    <q-card class="uniform-card">
      <q-card-section>
        <div class="text-h5 text-center">💼 AI HR Agent</div>
      </q-card-section>

      <!-- AI Chat Interface -->
      <q-card-section class="chat-section">
        <div class="chat-display">
          <div
            v-for="(message, index) in chatMessages"
            :key="index"
            :class="message.role === 'user' ? 'user-message' : 'bot-message'"
          >
            <span>{{ message.text }}</span>
          </div>
        </div>
      </q-card-section>

      <!-- Input Section -->
      <q-card-section>
        <q-input
          v-model="userMessage"
          label="Ask the AI Agent..."
          outlined
          dense
          @keyup.enter="sendMessage"
        />
        <q-btn
          label="Send"
          color="primary"
          @click="sendMessage"
          class="q-mt-md"
        />
      </q-card-section>
    </q-card>

    <!-- Resume Upload -->
    <q-card class="uniform-card q-mt-md">
      <q-card-section>
        <div class="text-h6">📂 Upload Resume for Analysis</div>
      </q-card-section>
      <q-card-section>
        <q-file
          v-model="resumeFile"
          label="Choose File"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          filled
        />
        <q-btn
          label="Analyze Resume"
          color="primary"
          @click="analyzeResume"
          class="q-mt-md"
        />

        <!-- Upload Progress Bar -->
        <q-linear-progress
          v-if="isUploading"
          :value="uploadProgress / 100"
          color="blue"
          class="q-mt-md"
        />
        <div v-if="isUploading" class="text-center q-mt-sm">
          {{ uploadProgress }}% Uploading...
        </div>

        <!-- Analysis Progress Bar -->
        <q-linear-progress
          v-if="isAnalyzing"
          :value="analysisProgress / 100"
          color="green"
          class="q-mt-md"
        />
        <div v-if="isAnalyzing" class="text-center q-mt-sm">
          {{ analysisProgress }}% Analyzing...
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();

const userMessage = ref("");
const chatMessages = ref([]);
const resumeFile = ref(null);
const uploadProgress = ref(0); // ✅ Upload progress (0-100%)
const analysisProgress = ref(0); // ✅ Analysis progress (0-100%)
const isUploading = ref(false); // ✅ Track uploading state
const isAnalyzing = ref(false); // ✅ Track analysis state
const FASTAPI_URL = process.env.VUE_APP_FASTAPI_URL;

// ✅ Get Authentication Token
const getFastAPIToken = () => localStorage.getItem("access_token");

// ✅ AI Chat Function
// ✅ Function to Save Chat Logs to MongoDB
async function logChatMessage(query, response) {
  console.log("🔥 Logging Chat Message...");

  const userId = localStorage.getItem("user_id"); // Check if stored
  const token = localStorage.getItem("access_token");

  console.log("🆔 User ID from LocalStorage:", userId);
  console.log("🔑 JWT Token:", token);

  if (!userId || !token) {
    console.error("❌ Missing user ID or token!");
    return;
  }

  try {
    const res = await axios.post("http://127.0.0.1:8000/ai/hr/logs", null, {
      params: {
        query: query,
        response: response,
        source: "fastapi",
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Chat Log Saved:", res.data);
  } catch (error) {
    console.error("❌ Error logging chat:", error);
  }
}

// ✅ Modify `sendMessage()` to Auto-Save Chat Log
const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  chatMessages.value.push({ role: "user", text: userMessage.value });

  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("No FastAPI token available");

    console.log("🔥 Sending FastAPI JWT:", token);

    const response = await axios.post(`${FASTAPI_URL}/ai/hr/query`, null, {
      params: { query: userMessage.value },
      headers: { Authorization: `Bearer ${token}` },
    });

    const botResponse = response.data.response;
    chatMessages.value.push({ role: "bot", text: botResponse });

    // ✅ Save Chat Log
    await logChatMessage(userMessage.value, botResponse); // ✅ Correctly pass botResponse
  } catch (error) {
    console.error("🔥 Error sending message:", error);
    chatMessages.value.push({ role: "bot", text: "Error processing message." });
  } finally {
    userMessage.value = "";
  }
};

// ✅ Modify `analyzeResume()` to Auto-Save Resume Analysis Log
const analyzeResume = async () => {
  if (!resumeFile.value) {
    $q.notify({ type: "negative", message: "Please upload a resume" });
    return;
  }

  const formData = new FormData();
  formData.append("file", resumeFile.value);

  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("No FastAPI token available");

    uploadProgress.value = 0;
    analysisProgress.value = 0;
    isUploading.value = true;
    isAnalyzing.value = false;

    // ✅ Upload Progress Bar
    const response = await axios.post(
      `${FASTAPI_URL}/ai/hr/analyze-resume`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadProgress.value = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
          }
        },
      }
    );

    uploadProgress.value = 100;
    setTimeout(() => {
      isUploading.value = false;
    }, 500);

    isAnalyzing.value = true;
    analysisProgress.value = 0;

    let interval = setInterval(() => {
      if (analysisProgress.value < 95) {
        analysisProgress.value += 5;
      }
    }, 500);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    clearInterval(interval);
    analysisProgress.value = 100;
    setTimeout(() => {
      isAnalyzing.value = false;
    }, 1000);

    // ✅ Save Resume Analysis Log
    logChatMessage("Resume Uploaded & Analyzed", response.data.analysis);

    chatMessages.value.push({
      role: "bot",
      text: `📄 Resume Analysis: ${response.data.analysis}`,
    });
  } catch (error) {
    console.error("🔥 Resume Analysis Error:", error);
    $q.notify({ type: "negative", message: "Analysis failed" });
    uploadProgress.value = 0;
    analysisProgress.value = 0;
    isUploading.value = false;
    isAnalyzing.value = false;
  }
};
</script>

<style scoped>
.uniform-card {
  max-width: 600px;
  margin: 0 auto;
}

.chat-display {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
}

.user-message {
  text-align: right;
  background: #e0f7fa;
  padding: 8px 12px;
  border-radius: 16px;
  margin: 5px 0;
}

.bot-message {
  text-align: left;
  background: #f1f8e9;
  padding: 8px 12px;
  border-radius: 16px;
  margin: 5px 0;
}
</style>
