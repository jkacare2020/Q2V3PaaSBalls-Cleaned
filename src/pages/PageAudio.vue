<template>
  <q-page class="q-pa-md">
    <!-- Text-to-Speech (TTS) Section -->
    <div class="audio-frame q-pa-md">
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
    </div>

    <!-- Mic Control and Transcription Section -->
    <div class="audio-frame q-pa-md q-mt-md">
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

            <!--Start Transcription and Mic Input Section -->
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
    </div>

    <!-- Playback, Upload, and File Input Section -->
    <div class="audio-frame q-pa-md q-mt-md">
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
          </div>
          <div class="row justify-center q-ma-md">
            <q-file
              label="Choose an audio file"
              accept="audio/*"
              outlined
              @input="handleFileUpload"
            >
              <template v-slot:prepend>
                <q-icon name="eva-attach-outline" />
              </template>
            </q-file>
          </div>
          <q-input
            v-if="audioBlob"
            v-model="caption"
            label="Add a caption"
            class="q-mb-md"
            outlined
          />
        </q-card-section>

        <q-card-section v-if="audioUrl" class="q-mt-md">
          <audio :src="audioUrl" controls autoplay class="full-width"></audio>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { auth } from "src/firebase/init";
import { useQuasar } from "quasar";
import { apiNode } from "boot/apiNode";

const isLoading = ref(false);

const $q = useQuasar();
const audioBlob = ref(null);
const audioUrl = ref(null);
const caption = ref("");
const isRecording = ref(false);
const isUploading = ref(false);
const sttOutput = ref("");
const textToSpeak = ref("");
const text = ref("");

// Handles file upload from local device
const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    audioBlob.value = file;
    audioUrl.value = URL.createObjectURL(file);
    console.log("Audio file selected:", file);
  } else {
    console.error("No file selected.");
  }
};

// Starts audio recording
let mediaRecorder = null;
const startRecording = () => {
  if (isRecording.value) return;

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        audioBlob.value = blob;
        audioUrl.value = URL.createObjectURL(blob);
        console.log("Recording completed. Blob created:", blob);
      };

      mediaRecorder.start();
      isRecording.value = true;
      console.log("Recording started...");
    })
    .catch((err) => {
      console.error("Error accessing microphone:", err);
      $q.notify({ type: "negative", message: "Microphone not accessible." });
    });
};

// Stops audio recording
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop();
    isRecording.value = false;
    console.log("Recording stopped.");
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

//--------------------------- Text to Speach ---------------------

const convertToSpeech = () => {
  if (!text.value.trim()) {
    $q.notify({
      color: "negative",
      message: "Please enter some text for TTS.",
      icon: "error",
    });
    return;
  }

  if (!window.speechSynthesis) {
    $q.notify({
      color: "negative",
      message: "Speech Synthesis is not supported in this browser.",
      icon: "error",
    });
    return;
  }

  isLoading.value = true;

  const utterance = new SpeechSynthesisUtterance(text.value);
  utterance.lang = "en-US"; // Customize language if needed
  utterance.rate = 1; // Speed of speech (default: 1, range: 0.1 to 10)
  utterance.pitch = 1; // Pitch of speech (default: 1, range: 0 to 2)

  // Event listeners for debugging or additional actions
  utterance.onstart = () => {
    console.log("Speech synthesis started.");
  };
  utterance.onend = () => {
    console.log("Speech synthesis ended.");
    isLoading.value = false;
    $q.notify({
      color: "positive",
      message: "Speech synthesis completed.",
      icon: "check",
    });
  };
  utterance.onerror = (event) => {
    console.error("Speech synthesis error:", event.error);
    isLoading.value = false;
    $q.notify({
      color: "negative",
      message: "An error occurred during TTS processing.",
      icon: "error",
    });
  };

  // Speak the text
  window.speechSynthesis.speak(utterance);
};

// Plays the recorded audio
const playRecording = () => {
  if (audioUrl.value) {
    const audio = new Audio(audioUrl.value);
    audio.play();
    console.log("Playing audio...");
  } else {
    $q.notify({ type: "negative", message: "No audio available to play." });
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
        const response = await apiNode.post(`/api/audios/upload`, payload);

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
<style lang="sass">
.audio-frame
  border: 2px solid $grey-10
  border-radius: 10px

  // app global css in Sass form
.text-grand-hotel
  font-family: 'Grand Hotel', 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif

.small-screen-only
  @media (max-width: $breakpoint-xs-max)
    display: block
  @media (min-width: $breakpoint-sm-min)
    display: none

.large-screen-only
  @media (max-width: $breakpoint-xs-max)
    display: none
  @media (min-width: $breakpoint-sm-min)
    display: block

.constrain
  max-width: 975px
  margin: 0 auto

.constrain-more
  max-width: 600px
  margin: 0 auto
</style>
