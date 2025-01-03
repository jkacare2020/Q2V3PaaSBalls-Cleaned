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
            id="uploadButton"
            label="Upload Audio"
            color="teal"
            icon="cloud_upload"
            :disable="!audioBlob"
            @click.once="uploadAudio"
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
import { db, auth } from "src/firebase/init";
import { useQuasar } from "quasar";
import { v4 as uuidv4 } from "uuid";

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

// Upload audio -----------------------------
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

  isUploading.value = true; // Prevent multiple uploads
  const uniqueId = uuidv4(); // Generate a unique ID for the audio

  try {
    // Convert Blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob.value);

    reader.onloadend = async () => {
      const base64Audio = reader.result.split(",")[1]; // Remove the data URL prefix
      const fileName = `recording_${Date.now()}.wav`;
      const userId = user.uid; // Use the logged-in user's UID

      try {
        // Send request to backend ------------
        const response = await axios.post(
          `${process.env.API}/api/audios/upload`,
          {
            audioData: base64Audio,
            fileName,
            userId,
            caption: caption.value,
          }
        );

        if (response.data.audioUrl) {
          // Check if document already exists in Firestore
          const docRef = doc(db, "audios", uniqueId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            console.log("Duplicate document detected. Skipping save.");
            $q.notify({
              type: "warning",
              message: "Duplicate upload detected. Skipping save.",
            });
            return;
          }

          // Save metadata to Firestore
          // await setDoc(docRef, {
          //   id: uniqueId,
          //   userId,
          //   audioUrl: response.data.audioUrl,
          //   fileName,
          //   caption: caption.value,
          //   date: new Date(),
          // });

          console.log("Metadata saved to Firestore.");
          $q.notify({
            type: "positive",
            message: "Audio uploaded successfully!",
          });

          // Clear the form
          audioBlob.value = null;
          audioUrl.value = null;
          caption.value = "";
        }
      } catch (error) {
        console.error("Error uploading audio:", error);
        $q.notify({
          type: "negative",
          message: "Failed to upload audio.",
        });
      }
    };
  } catch (error) {
    console.error("Error in uploadAudio:", error);
    $q.notify({
      type: "negative",
      message: "An unexpected error occurred.",
    });
  } finally {
    isUploading.value = false; // Reset upload flag
  }
};
</script>
