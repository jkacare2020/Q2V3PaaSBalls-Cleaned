<template>
  <q-page class="flex flex-center column">
    <h2>Audio Recorder</h2>

    <!-- Recording Controls -->
    <div class="q-mb-md">
      <q-btn
        v-if="!isRecording"
        color="primary"
        label="Start Recording"
        @click="startRecording"
        icon="mic"
      />
      <q-btn
        v-else
        color="negative"
        label="Stop Recording"
        @click="stopRecording"
        icon="stop"
      />
    </div>

    <!-- Playback Controls -->
    <div class="q-mb-md">
      <q-btn
        v-if="audioUrl"
        color="positive"
        label="Play Recording"
        @click="playRecording"
        icon="speaker"
      />
      <q-btn
        v-if="audioBlob"
        color="secondary"
        label="Upload Audio"
        @click="uploadAudio"
        icon="upload"
      />
    </div>

    <!-- Caption Input -->
    <q-input
      v-if="audioBlob"
      v-model="caption"
      label="Add a caption"
      class="q-mb-md"
      outlined
    />

    <!-- Audio Player -->
    <audio v-if="audioUrl" :src="audioUrl" controls></audio>

    <!-- Status Message -->
    <p v-if="statusMessage" class="q-mt-md">{{ statusMessage }}</p>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "src/firebase/init";
import { useQuasar } from "quasar";

const $q = useQuasar();

// Reactive state
const isRecording = ref(false);
const isUploading = ref(false); // Prevent multiple uploads
const audioUrl = ref(null);
const audioBlob = ref(null);
const statusMessage = ref("");
const caption = ref(""); // Caption input
let mediaRecorder = null;
let audioChunks = [];

// Start recording
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    mediaRecorder.onstop = () => {
      audioBlob.value = new Blob(audioChunks, { type: "audio/wav" });
      audioUrl.value = URL.createObjectURL(audioBlob.value);
      audioChunks = [];
    };
    mediaRecorder.start();
    isRecording.value = true;
    statusMessage.value = "Recording started...";
  } catch (error) {
    statusMessage.value = "Error accessing microphone: " + error.message;
  }
};

// Stop recording
const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    isRecording.value = false;
    statusMessage.value = "Recording stopped.";
  }
};

// Play recording
const playRecording = () => {
  if (audioUrl.value) {
    const audio = new Audio(audioUrl.value);
    audio.play();
    statusMessage.value = "Playing recording...";
  }
};

// Upload audio
const uploadAudio = async () => {
  if (isUploading.value) {
    console.log("Upload already in progress.");
    return;
  }

  const user = auth.currentUser;

  if (!user) {
    $q.notify({
      type: "negative",
      message: "Please log in to upload audio.",
    });
    return;
  }

  if (!audioBlob.value) {
    $q.notify({
      type: "negative",
      message: "No audio to upload.",
    });
    return;
  }

  isUploading.value = true;

  try {
    console.log("Starting upload process...");

    // Convert Blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob.value);

    reader.onloadend = async () => {
      console.log("FileReader onloadend triggered");

      const base64Audio = reader.result.split(",")[1]; // Remove the data URL prefix
      const fileName = `recording_${Date.now()}.wav`;
      const userId = user.uid; // Use the logged-in user's UID

      try {
        const response = await axios.post(
          `${process.env.API}/api/audios/upload`,
          {
            audioData: base64Audio,
            fileName,
            userId,
            caption: caption.value,
          }
        );

        $q.notify({
          type: "positive",
          message: "Audio uploaded successfully!",
        });

        // Clear data
        audioBlob.value = null;
        audioUrl.value = null;
        caption.value = "";
      } catch (error) {
        console.error("Error uploading audio:", error);
        $q.notify({
          type: "negative",
          message: "Failed to upload audio.",
        });
      } finally {
        isUploading.value = false; // Ensure flag is reset
      }
    };

    reader.onerror = () => {
      console.error("FileReader error occurred.");
      $q.notify({
        type: "negative",
        message: "Failed to read audio file.",
      });
      isUploading.value = false; // Reset flag on error
    };
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    $q.notify({
      type: "negative",
      message: "An unexpected error occurred.",
    });
    isUploading.value = false; // Ensure flag is reset
  }
};
</script>

<style scoped>
/* Add your custom styles here */
</style>
