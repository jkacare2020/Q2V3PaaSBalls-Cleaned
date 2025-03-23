<template>
  <q-page class="q-pa-md">
    <div class="chat-container">
      <q-card flat bordered class="chat-card">
        <q-card-section>
          <q-card-title>Chatbot</q-card-title>
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
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const userMessage = ref("");
const chatMessages = ref([]);

// Function to send a message
const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  chatMessages.value.push({ role: "user", text: userMessage.value });

  try {
    const response = await axios.post(
      `${process.env.API}/api/chatbot/sendMessage`,
      {
        userMessage: userMessage.value, // Match backend expectation
      }
    );

    // Access the correct field from backend response
    chatMessages.value.push({
      role: "bot",
      text: response.data.botResponse, // Match the backend's response format
    });
  } catch (error) {
    console.error("Error sending message:", error);
    chatMessages.value.push({
      role: "bot",
      text: "Sorry, I couldn't process your message. Please try again later.",
    });
  } finally {
    userMessage.value = ""; // Clear input field
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
