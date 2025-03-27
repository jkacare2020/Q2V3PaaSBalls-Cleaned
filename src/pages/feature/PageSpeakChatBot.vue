<template>
  <q-page class="q-pa-md">
    <div class="chat-container">
      <!-- Chatbot Section -->
      <q-card flat bordered class="chat-card">
        <q-card-section>
          <q-card-title>Speaking Chatbot</q-card-title>
        </q-card-section>
        <q-card-section>
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
        <q-card-section>
          <q-input
            v-model="userMessage"
            label="Type your message"
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

      <!-- Audio Section -->
      <q-card class="q-ma-md">
        <q-card-section>
          <q-card-title>Speech Controls</q-card-title>
          <div class="row items-center q-gutter-md q-mt-md">
            <q-btn
              @click="startTranscription"
              label="Start Transcription"
              color="blue"
              icon="mic"
            />
            <q-btn
              label="Play Response"
              color="blue"
              icon="play_arrow"
              :disable="!audioUrl"
              @click="playBotResponse"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";
import { apiNode } from "boot/apiNode";
const $q = useQuasar();
const userMessage = ref("");
const chatMessages = ref([]);
const audioUrl = ref(null);

// Function to send a message
const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  chatMessages.value.push({ role: "user", text: userMessage.value });

  try {
    const response = await apiNode.post(`/api/chatbot/sendMessage`, {
      userMessage: userMessage.value,
    });

    const botResponse = response.data.botResponse;
    chatMessages.value.push({ role: "bot", text: botResponse });

    // Convert bot response to speech
    convertToSpeech(botResponse);
  } catch (error) {
    console.error("Error sending message:", error);
    chatMessages.value.push({
      role: "bot",
      text: "Sorry, I couldn't process your message. Please try again later.",
    });
  } finally {
    userMessage.value = "";
  }
};

// Text-to-Speech (TTS) for bot response
const convertToSpeech = (text) => {
  if (!text.trim()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onerror = (event) => {
    console.error("TTS Error:", event.error);
    $q.notify({ type: "negative", message: "TTS failed." });
  };

  window.speechSynthesis.speak(utterance);
};

// Speech-to-Text (STT) using browser's SpeechRecognition API
const startTranscription = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    $q.notify({
      type: "negative",
      message: "Speech Recognition is not supported in your browser.",
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false; // Only return final results

  recognition.onstart = () => {
    $q.notify({
      type: "info",
      message: "Listening... Speak into the microphone.",
    });
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userMessage.value = transcript;

    // Automatically send the transcribed text to GPT
    sendMessage();
  };

  recognition.onerror = (event) => {
    console.error("STT Error:", event.error);
    $q.notify({
      type: "negative",
      message: "An error occurred during transcription: " + event.error,
    });
  };

  recognition.onend = () => {
    console.log("Speech recognition stopped.");
  };

  recognition.start();
};

// Play bot response audio
const playBotResponse = () => {
  if (audioUrl.value) {
    const audio = new Audio(audioUrl.value);
    audio.play();
  } else {
    $q.notify({ type: "negative", message: "No audio to play." });
  }
};
</script>

<style scoped>
.chat-container {
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
