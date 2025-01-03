<template>
  <q-page class="q-pa-md">
    <!-- Text-to-Speech (TTS) Section -->
    <q-card class="q-ma-md">
      <q-card-section>
        <q-card-title>Text-to-Speech (TTS)</q-card-title>
        <q-input
          v-model="text"
          label="Enter Text for TTS"
          type="textarea"
          rows="5"
          outlined
          class="q-mt-md"
        />
        <q-btn
          label="Convert to Speech"
          color="primary"
          :loading="isLoading"
          @click="convertToSpeech"
          class="q-mt-md"
        />
      </q-card-section>
      <q-card-section v-if="audioUrl" class="q-mt-md">
        <audio :src="audioUrl" controls autoplay class="full-width"></audio>
      </q-card-section>
    </q-card>

    <!-- Mic Control and Transcription Section -->
    <q-card class="q-ma-md">
      <q-card-section>
        <q-card-title>Speech-to-Text (STT)</q-card-title>
        <div class="row items-center q-gutter-md q-mt-md">
          <q-btn
            @click="startRecording"
            label="Start Recording"
            color="green"
            icon="mic"
          />
          <q-btn
            @click="stopRecording"
            label="Stop Recording"
            color="red"
            icon="stop"
          />
          <q-btn
            label="Start Transcription"
            color="blue"
            icon="mic"
            @click="startTranscription"
          />
        </div>
      </q-card-section>
      <q-card-section class="q-mt-md">
        <q-card-title>Transcription Output</q-card-title>
        <div class="text-body1 text-grey-8">{{ sttOutput }}</div>
      </q-card-section>
    </q-card>

    <!-- Playback and Upload Section -->
    <q-card class="q-ma-md">
      <q-card-section>
        <q-card-title>Playback and Upload</q-card-title>
        <div class="row items-center q-gutter-md q-mt-md">
          <q-btn
            @click="playRecording"
            label="Play Recording"
            color="primary"
            icon="play_arrow"
            :disable="!audioUrl"
          />
          <q-btn
            @click.stop="uploadAudio"
            label="Upload Audio"
            color="teal"
            icon="cloud_upload"
            :disable="!audioBlob || isUploading"
          />

          <!-- Caption Input -->
          <q-input
            v-if="audioBlob"
            v-model="caption"
            label="Add a caption"
            class="q-mb-md"
            outlined
          />
        </div>
      </q-card-section>
      <q-card-section v-if="audioUrl" class="q-mt-md">
        <audio :src="audioUrl" controls autoplay class="full-width"></audio>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { db, auth } from "src/firebase/init";
import { useQuasar } from "quasar";
import { debounce } from "quasar";
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
const uploadAudio = debounce(async () => {
  console.log("Upload Audio function called"); // Log when the function is called

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

  // Disable the upload button to prevent multiple calls
  isUploading.value = true;

  try {
    const reader = new FileReader();

    reader.onloadend = async () => {
      console.log("FileReader onloadend triggered"); // Log when FileReader completes
      const base64Audio = reader.result.split(",")[1]; // Remove the data URL prefix
      const fileName = `recording_${Date.now()}.webm`; // Ensure file extension matches type
      const userId = user.uid; // Use logged-in user's UID

      const payload = {
        audioData: base64Audio,
        fileName,
        userId,
        caption: caption.value, // Include the caption
      };

      try {
        console.log("Sending payload to backend:", payload); // Log the payload
        const response = await axios.post(
          `${process.env.API}/api/audios/upload`,
          payload
        );

        if (response.data.audioUrl) {
          console.log("Backend response received:", response.data); // Log the backend response
          $q.notify({
            type: "positive",
            message: "Audio uploaded successfully!",
          });

          // Clear data
          audioBlob.value = null;
          audioUrl.value = null;
          caption.value = "";
        } else {
          $q.notify({
            type: "negative",
            message: "Audio uploaded, but no URL received.",
          });
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
        $q.notify({
          type: "negative",
          message: "Failed to upload audio to backend.",
        });
      } finally {
        // Re-enable the upload button
        isUploading.value = false;
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      $q.notify({
        type: "negative",
        message: "Failed to read audio file.",
      });
      // Re-enable the upload button
      isUploading.value = false;
    };

    // Start reading the audio blob
    reader.readAsDataURL(audioBlob.value);
  } catch (error) {
    console.error("Error in uploadAudio:", error);
    $q.notify({
      type: "negative",
      message: "An unexpected error occurred.",
    });
    // Re-enable the upload button
    isUploading.value = false;
  }
}, 1000); // Debounce for 1 second
</script>
