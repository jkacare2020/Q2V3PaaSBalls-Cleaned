<template>
  <q-page class="q-pa-md">
    <q-btn label="🎤 Start Talking" color="primary" @click="startListening" />
    <div class="q-mt-md">
      <q-input
        v-model="userMessage"
        label="Recognized Text"
        readonly
        outlined
        dense
      />
      <q-input
        v-model="botResponse"
        label="Bot Response"
        readonly
        outlined
        dense
      />
      <q-btn
        class="q-mt-sm"
        label="Play Response"
        color="primary"
        icon="volume_up"
        @click="playBotResponse"
        :disable="!botResponse"
        :class="{ 'pulse-button': shouldPulse }"
      />
      <!-- 📜 Chat History -->
      <q-btn
        class="q-ml-md q-mt-sm"
        label="Chat History"
        color="secondary"
        icon="history"
        @click="goToChatHistory"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { apiNode } from "boot/apiNode"; // your axios
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { auth } from "src/firebase/init";

const router = useRouter();
const $q = useQuasar();
const userMessage = ref("");
const botResponse = ref("");
const audioUrl = ref("");
const latestBotResponse = ref("");
const shouldPulse = ref(false);
// When you receive the bot response from server:
const handleBotReply = (botText) => {
  latestBotResponse.value = botText;
  shouldPulse.value = true; // 🎯 Start animation when bot replies
};

const sendMessage = async () => {
  const response = await apiNode.post("/api/chatbot/sendMessage", {
    userMessage: userMessage.value,
  });
  const botText = response.data.botResponse;
  handleBotReply(botText); // ✅ Save it immediately
};
//------------------------------------------------------
const startListening = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    $q.notify({
      type: "negative",
      message: "Speech Recognition not supported.",
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    userMessage.value = transcript;
    await sendMessageToBot();
  };

  recognition.onerror = (event) => {
    console.error("STT error:", event.error);
    $q.notify({ type: "negative", message: "Speech recognition failed." });
  };

  recognition.start();
};

const sendMessageToBot = async () => {
  try {
    const idToken = await auth.currentUser.getIdToken();
    const response = await apiNode.post(
      "/api/chatbot/sendMessage",
      { userMessage: userMessage.value },
      { headers: { Authorization: `Bearer ${idToken}` } } // ✅ this extra closing "}" for headers
    ); // ✅ then final ")"

    botResponse.value = response.data.botResponse;
    convertTextToSpeech(botResponse.value);
    handleBotReply(response.data.botResponse);
  } catch (error) {
    console.error("Failed to send message:", error);
  }
};

const convertTextToSpeech = (text) => {
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.onend = () => console.log("Speech synthesis finished.");
  window.speechSynthesis.speak(utterance);

  // 🎯 Optional: if you want downloadable MP3, use backend TTS and serve MP3
};

const playBotResponse = () => {
  if (!latestBotResponse.value) return;

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(latestBotResponse.value);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  speechSynthesis.speak(utterance);

  shouldPulse.value = false; // 🛑 Stop animation when clicked
};

const goToChatHistory = () => {
  router.push("/ChatbotHistory");
};

// 🔥 Handle Input Based on Voice Mode
const handleInput = () => {
  if (isVoiceMode.value) {
    startVoiceInput();
  } else {
    sendMessage();
  }
};
</script>
<style scoped>
.pulse-button {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
