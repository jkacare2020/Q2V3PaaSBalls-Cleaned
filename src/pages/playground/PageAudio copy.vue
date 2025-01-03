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
            @click="uploadAudio"
            label="Upload Audio"
            color="teal"
            icon="cloud_upload"
            :disable="!audioBlob"
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
import { auth } from "src/firebase/init"; // Adjust the Firebase import path
import { addDoc, collection } from "firebase/firestore";
import { db } from "src/firebase/init"; // Adjust Firestore path
import { useQuasar } from "quasar";
const $q = useQuasar(); // Access Quasar's $q object
// States
const text = ref("");
const audioUrl = ref(null);
const audioBlob = ref(null);
const sttOutput = ref("");
const caption = ref("");
const isLoading = ref(false);
const statusMessage = ref("");

//------------------------------------------------------

// Convert Text to Speech
const convertToSpeech = async () => {
  if (!text.value.trim()) {
    alert("Please enter some text.");
    return;
  }

  isLoading.value = true;
  try {
    const response = await axios.post(`${process.env.API}/api/tts`, {
      text: text.value,
    });
    audioUrl.value = response.data.audioUrl;
  } catch (error) {
    console.error("Error generating TTS:", error);
    alert("Error generating TTS audio.");
  } finally {
    isLoading.value = false;
  }
};

// Speech-to-Text Transcription
const startTranscription = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    sttOutput.value = transcript;
  };

  recognition.onerror = (event) => {
    console.error("STT Error:", event.error);
    alert("An error occurred during transcription: " + event.error);
  };

  recognition.start();
};

// Recording Controls
let mediaRecorder;
const audioChunks = ref([]);

const startRecording = () => {
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => {
      audioChunks.value.push(e.data);
    };
    mediaRecorder.start();
    statusMessage.value = "Recording started...";
  });
};

const stopRecording = () => {
  if (mediaRecorder) {
    // Stop the recorder
    mediaRecorder.stop();

    // Stop all media tracks to release the microphone
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    // Ensure the final chunk of data is captured
    mediaRecorder.ondataavailable = (e) => {
      audioChunks.value.push(e.data);

      // Create the Blob from the recorded chunks
      const blob = new Blob(audioChunks.value, { type: "audio/webm" });
      audioBlob.value = blob;
      audioUrl.value = URL.createObjectURL(blob);
      statusMessage.value = "Recording stopped.";

      // Clear the audio chunks for the next recording
      audioChunks.value = [];
    };
  }
};
const playRecording = () => {
  if (audioUrl.value) {
    const audioElement = new Audio(audioUrl.value);
    audioElement.play().catch((error) => {
      console.error("Error playing audio:", error);
      $q.notify({
        type: "negative",
        message: "Failed to play audio.",
      });
    });
  } else {
    $q.notify({
      type: "negative",
      message: "No audio to play.",
    });
  }
};
//---------------------------------------
const uploadAudio = async () => {
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
  const uploadButton = document.querySelector("#uploadButton");
  if (uploadButton) uploadButton.disabled = true;

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
          // Metadata saved to Firestore
          // await addDoc(collection(db, "audios"), {
          //   userId,
          //   audioUrl: response.data.audioUrl,
          //   fileName,
          //   date: new Date(),
          //   caption: caption.value,
          // });
          console.log("Firestore document added"); // Log Firestore save
          $q.notify({
            type: "positive",
            message: "Audio uploaded successfully!",
          });

          // Clear data
          audioBlob.value = null;
          audioUrl.value = null;
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
        if (uploadButton) uploadButton.disabled = false;
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      $q.notify({
        type: "negative",
        message: "Failed to read audio file.",
      });
      // Re-enable the upload button
      if (uploadButton) uploadButton.disabled = false;
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
    if (uploadButton) uploadButton.disabled = false;
  }
};
</script>
