<template>
  <q-page class="q-pa-md">
    <!-- Main Chat Interface -->
    <div class="row q-col-gutter-md">
      <!-- Left Column: Chat Section -->
      <div class="col-12 col-md-7">
        <q-card>
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">AI HR Assistant</div>
          </q-card-section>

          <!-- Chat Messages -->
          <q-card-section class="chat-messages" style="height: 60vh">
            <template v-for="(message, index) in chatMessages" :key="index">
              <!-- User Message -->
              <div v-if="message.role === 'user'" class="q-mb-md">
                <q-chat-message
                  :text="[message.text]"
                  sent
                  stamp="Your message"
                  class="q-mr-sm"
                  bg-color="primary"
                  text-color="white"
                >
                  <template v-slot:avatar>
                    <q-avatar
                      color="primary"
                      text-color="white"
                      icon="person"
                    />
                  </template>
                  <template v-slot:stamp>
                    {{ message.time }}
                  </template>
                </q-chat-message>
              </div>

              <!-- Bot Message -->
              <div v-else class="q-mb-md">
                <q-chat-message
                  :text="[message.text]"
                  stamp="AI Response"
                  class="q-ml-sm"
                  bg-color="grey-3"
                >
                  <template v-slot:avatar>
                    <q-avatar
                      color="primary"
                      text-color="white"
                      icon="smart_toy"
                    />
                  </template>
                  <template v-slot:stamp>
                    {{ message.time }}
                  </template>
                </q-chat-message>
              </div>
            </template>
          </q-card-section>

          <!-- Input Section -->
          <q-card-section>
            <div class="row q-col-gutter-sm items-center">
              <div class="col-10">
                <q-input
                  v-model="userMessage"
                  outlined
                  dense
                  placeholder="Type your message..."
                  @keyup.enter="sendMessage"
                  :loading="isSendingMessage"
                >
                  <template v-slot:prepend>
                    <q-icon name="chat" />
                  </template>
                </q-input>
              </div>
              <div class="col-2">
                <q-btn
                  round
                  color="primary"
                  icon="send"
                  @click="sendMessage"
                  :disable="!userMessage.trim()"
                  :loading="isSendingMessage"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Resume Analysis -->
      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section class="bg-primary text-white">
            <div class="text-h6">Resume Analysis</div>
          </q-card-section>

          <q-card-section>
            <!-- File Upload Section -->
            <q-file
              v-model="resumeFile"
              outlined
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              label="Select resume file"
              :max-file-size="MAX_FILE_SIZE"
              @rejected="onFileRejected"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <!-- Progress Indicators -->
            <div v-if="isUploading" class="q-mb-md">
              <div class="text-caption q-mb-xs">Upload Progress</div>
              <q-linear-progress
                :value="uploadProgress / 100"
                color="primary"
                stripe
                animation-speed="600"
              />
              <div class="text-right text-caption">
                {{ uploadProgress }}% uploaded
              </div>
            </div>

            <div v-if="isAnalyzing">
              <div class="text-caption q-mb-xs">Analysis Progress</div>
              <q-linear-progress
                indeterminate
                color="green"
                track-color="grey-3"
              />
              <div class="text-right text-caption">
                Analyzing your resume...
              </div>
            </div>

            <!-- Action Button -->
            <!-- Action Buttons -->
            <div class="row q-col-gutter-sm">
              <!-- Start Analysis Button -->
              <div class="col">
                <q-btn
                  label="Start Analysis"
                  color="primary"
                  class="full-width q-mt-md"
                  :loading="isUploading || isAnalyzing"
                  :disable="!resumeFile"
                  @click="analyzeResume"
                />
              </div>
            </div>
            <!-- Toggle Button for Auto Grading -->
            <q-toggle
              v-model="enableAutoGrade"
              label="Enable Auto Grading"
              color="primary"
              class="q-mt-md"
            />

            <!-- ✅ Action Buttons -->
            <div class="row q-col-gutter-sm">
              <!-- Start Analysis Button -->
              <div class="col">
                <q-btn
                  label="Start Analysis"
                  color="primary"
                  class="full-width q-mt-md"
                  :loading="isUploading || isAnalyzing"
                  :disable="!resumeFile"
                  @click="analyzeResume"
                />
              </div>

              <!-- Grade Resume Button -->
              <div class="col">
                <q-btn
                  label="Grade Resume"
                  color="secondary"
                  class="full-width q-mt-md"
                  :disable="!resumeAnalyzed || enableAutoGrade"
                  @click="gradeResume"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();
const autoGrading = ref(true); // ✅ Default: Auto Grading is enabled

const userMessage = ref("");
const chatMessages = ref([]);
const resumeFile = ref(null);
const uploadProgress = ref(0); // ✅ Upload progress (0-100%)
const analysisProgress = ref(0); // ✅ Analysis progress (0-100%)
const isUploading = ref(false); // ✅ Track uploading state
const isAnalyzing = ref(false); // ✅ Track analysis state
const FASTAPI_URL = process.env.VUE_APP_FASTAPI_URL;

const MAX_FILE_SIZE = 10485760; // 10 MB (for example)
function onFileRejected(rejectedEntries) {
  rejectedEntries.forEach((entry) => {
    $q.notify({
      type: "negative",
      message: `${entry.file.name} was rejected: ${entry.failedPropValidation}`,
    });
  });
}

// ✅ Get Authentication Token
const getFastAPIToken = () => localStorage.getItem("access_token");

// ✅ Function to Save Chat Logs to MongoDB
async function logChatMessage(query, response) {
  console.log("🔥 Logging Chat Message...");

  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("access_token");

  if (!userId || !token) {
    console.error("❌ Missing user ID or token!");
    return;
  }

  try {
    const res = await axios.post(
      "http://127.0.0.1:8000/ai/hr/logs",
      null, // ✅ Set body to null since we're using query params
      {
        params: {
          query: query,
          response: JSON.stringify(response), // ✅ Ensure response is a string!
          source: "fastapi",
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

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

// ✅  Auto-Save Resume Analysis Log
const resumeAnalyzed = ref(false); // ✅ Track if analysis is complete
const analyzedResumeId = ref(null); // ✅ Store analyzed resume ID for grading

const enableAutoGrade = ref(true); // ✅ Default: Auto Grading is enabled

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

    analyzedResumeId.value = response.data.resume_id;
    resumeAnalyzed.value = true;

    // ✅ Display JSON analysis in chat first
    chatMessages.value.push({
      role: "bot",
      text: `📄 **Resume Analysis:**\n${JSON.stringify(
        response.data.analysis,
        null,
        2
      )}`,
    });

    // ✅ Check toggle before running Auto Grading
    if (enableAutoGrade.value) {
      autoGradeResume(response.data.resume_id);
    }

    $q.notify({ type: "positive", message: "Resume analyzed successfully!" });
  } catch (error) {
    console.error("🔥 Resume Analysis Error:", error);
    $q.notify({ type: "negative", message: "Analysis failed" });

    uploadProgress.value = 0;
    analysisProgress.value = 0;
    isUploading.value = false;
    isAnalyzing.value = false;
    resumeAnalyzed.value = false;
  }
};

const autoGradeResume = async (resumeId) => {
  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("No FastAPI token available");

    const response = await axios.post(
      `${FASTAPI_URL}/ai/hr/grade-resume`,
      null, // No request body needed, using query params
      {
        params: { resume_id: resumeId },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // ✅ Display the score below the analysis result
    chatMessages.value.push({
      role: "bot",
      text: `📊 **Resume Score:** ${response.data.resume_score}`,
    });

    $q.notify({ type: "positive", message: "Resume graded successfully!" });
  } catch (error) {
    console.error("🔥 Error grading resume:", error);
    $q.notify({ type: "negative", message: "Grading failed" });
  }
};

const gradeResume = async () => {
  if (!analyzedResumeId.value) {
    $q.notify({ type: "negative", message: "No resume ID found!" });
    return;
  }

  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("No FastAPI token available");

    const response = await axios.post(
      `${FASTAPI_URL}/ai/hr/grade-resume`,
      {},
      {
        params: { resume_id: analyzedResumeId.value },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    $q.notify({ type: "positive", message: response.data.message });
    chatMessages.value.push({
      role: "bot",
      text: `📊 Resume Score: ${response.data.resume_score}`,
    });
  } catch (error) {
    console.error("🔥 Error grading resume:", error);
    $q.notify({ type: "negative", message: "Failed to grade resume." });
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

<style scoped>
.chat-messages {
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background: #fafafa;
}

.q-chat-message {
  max-width: 80%;
  transition: all 0.3s ease;
}
</style>
