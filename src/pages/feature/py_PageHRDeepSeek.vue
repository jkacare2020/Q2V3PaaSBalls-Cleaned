<template>
  <q-page class="q-pa-md">
    <!-- 聊天界面 -->
    <q-card class="full-width">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">
          <q-icon name="smart_toy" class="q-mr-sm" />
          DeepSeek HR Assistant
        </div>
      </q-card-section>

      <!-- 聊天记录 -->
      <q-card-section class="chat-container">
        <div v-for="(msg, index) in messages" :key="index" class="q-mb-md">
          <q-chat-message
            :text="[msg.text]"
            :sent="msg.sender === 'user'"
            :stamp="msg.time"
            :bg-color="msg.sender === 'user' ? 'primary' : 'grey-3'"
          >
            <template v-slot:avatar>
              <q-avatar :color="msg.sender === 'user' ? 'primary' : 'grey'">
                <q-icon
                  :name="msg.sender === 'user' ? 'person' : 'smart_toy'"
                />
              </q-avatar>
            </template>
          </q-chat-message>
        </div>
      </q-card-section>

      <!-- 输入区域 -->
      <q-card-section>
        <q-form @submit.prevent="sendMessage">
          <div class="row items-center q-gutter-sm">
            <q-input
              v-model="inputMessage"
              outlined
              dense
              class="col-grow"
              placeholder="输入您的问题..."
              :disable="isLoading"
            />
            <q-btn
              round
              color="primary"
              icon="send"
              type="submit"
              :loading="isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- 简历分析模块 -->
    <q-card class="q-mt-md">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">
          <q-icon name="description" class="q-mr-sm" />
          简历智能分析
        </div>
      </q-card-section>

      <q-card-section>
        <q-file
          v-model="resumeFile"
          outlined
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          label="上传简历文件"
          :max-file-size="10 * 1024 * 1024"
          @rejected="onFileRejected"
        >
          <template v-slot:prepend>
            <q-icon name="upload" />
          </template>
        </q-file>

        <q-btn
          color="primary"
          label="开始分析"
          class="q-mt-md full-width"
          @click="analyzeResume"
          :loading="isAnalyzing"
        />

        <!-- 分析结果 -->
        <div v-if="analysisResult" class="q-mt-md">
          <div class="text-subtitle1 q-mb-sm">分析结果：</div>
          <q-card bordered>
            <q-card-section>
              <div class="text-pre-wrap">{{ analysisResult }}</div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import axios from "axios";

const $q = useQuasar();
const inputMessage = ref("");
const messages = ref([]);
const resumeFile = ref(null);
const isLoading = ref(false);
const isAnalyzing = ref(false);
const analysisResult = ref("");

// 发送消息
const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  try {
    isLoading.value = true;
    const newMsg = {
      text: inputMessage.value,
      sender: "user",
      time: new Date().toLocaleTimeString(),
    };
    messages.value.push(newMsg);

    const response = await axios.post("/ai/deepseek/chat", {
      message: inputMessage.value,
    });

    messages.value.push({
      text: response.data.response,
      sender: "bot",
      time: new Date().toLocaleTimeString(),
    });
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error.response?.data?.detail || "请求失败",
    });
  } finally {
    isLoading.value = false;
    inputMessage.value = "";
  }
};

// 分析简历
const analyzeResume = async () => {
  if (!resumeFile.value) {
    $q.notify({ type: "warning", message: "请先选择文件" });
    return;
  }

  try {
    isAnalyzing.value = true;
    const formData = new FormData();
    formData.append("file", resumeFile.value);

    const response = await axios.post("/ai/deepseek/analyze-resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    analysisResult.value = response.data.analysis;
    $q.notify({ type: "positive", message: "分析完成" });
  } catch (error) {
    $q.notify({
      type: "negative",
      message: error.response?.data?.detail || "分析失败",
    });
  } finally {
    isAnalyzing.value = false;
  }
};

// 文件验证失败处理
const onFileRejected = (rejectedEntries) => {
  $q.notify({
    type: "negative",
    message:
      rejectedEntries[0].failedPropValidation === "max-file-size"
        ? "文件大小超过10MB限制"
        : "不支持的文件类型",
  });
};
</script>

<style scoped>
.chat-container {
  height: 60vh;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 12px;
}

.text-pre-wrap {
  white-space: pre-wrap;
}
</style>
