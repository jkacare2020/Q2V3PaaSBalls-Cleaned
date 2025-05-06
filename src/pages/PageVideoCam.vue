<template>
  <!--PageVideoCam.vue--->
  <q-page class="constrain-more q-pa-md">
    <div class="camera-frame q-pa-md">
      <video
        v-show="!videoCaptured"
        ref="video"
        class="full-width"
        height="300"
        autoplay
        playsinline
        muted
      />
      <div v-show="videoCaptured" class="q-pa-md">
        <video controls class="full-width" :src="videoURL"></video>
      </div>
    </div>

    <!--Record/Stop Controls -->
    <div class="text-center q-pa-md">
      <q-btn
        color="primary"
        icon="flip_camera_android"
        @click="flipCamera"
        size="lg"
        round
        class="q-mr-md"
      >
        <q-tooltip>Flip Camera</q-tooltip>
        <!-- 🧠 Tooltip here -->
      </q-btn>
      <q-btn
        v-if="hasCameraSupport && !recording"
        @click="startRecording"
        color="red"
        icon="eva-video-outline"
        size="lg"
        round
        label="Record"
      />
      <q-btn
        v-if="hasCameraSupport && recording"
        @click="stopRecording"
        color="grey-10"
        icon="eva-stop-circle-outline"
        size="lg"
        round
        label="Stop"
      />
      <q-file
        v-else
        @input="captureVideoFallback"
        label="Choose a video"
        accept="video/*"
        outlined
      >
        <template v-slot:prepend>
          <q-icon name="eva-attach-outline" />
        </template>
      </q-file>
    </div>

    <!-- Caption and Location -->
    <div class="row justify-center q-ma-md">
      <q-input
        v-model="post.caption"
        class="col col-sm-6"
        label="Caption *"
        dense
      />
    </div>
    <div class="row justify-center q-ma-md">
      <q-input
        v-model="post.location"
        :loading="locationLoading"
        class="col col-sm-6"
        label="Location"
        dense
      >
        <template v-slot:append>
          <q-btn
            v-if="!locationLoading && locationSupported"
            @click="getLocation"
            icon="eva-navigation-2-outline"
            dense
            flat
            round
          />
        </template>
      </q-input>
    </div>
    <!---Tag input---->
    <div class="row justify-center q-ma-md">
      <q-select
        ref="tagSelectRef"
        v-model="post.tags"
        :options="['public', 'private', 'certification', 'marketplace']"
        multiple
        use-chips
        label="Tags"
        outlined
        dense
        class="col col-sm-6"
        @update:model-value="onTagSelect"
      />
    </div>

    <!-- Upload Button -->
    <div class="row justify-center q-mt-lg">
      <q-btn
        v-if="videoCaptured"
        @click="uploadVideo"
        class="q-mb-lg"
        color="primary"
        label="Upload Video"
        rounded
        unelevated
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue";
import { uid, useQuasar } from "quasar";
import axios from "axios";
import { auth } from "src/firebase/init";
import { useRouter } from "vue-router";
import { apiNode, nodeApiBaseURL } from "boot/apiNode"; // ✅ Make sure to import it

const router = useRouter();
const $q = useQuasar();

const isFrontCamera = ref(true);
let mediaStream = null;

// Reactive states
const post = reactive({
  id: uid(),
  caption: "",
  location: "",
  video: null,
  date: Date.now(),
  tags: [], // ✅ Add this field
});

const video = ref(null);
const mediaRecorder = ref(null);
const chunks = ref([]);
const videoCaptured = ref(false);
const recording = ref(false);
const videoURL = ref(null);
const hasCameraSupport = ref(true);
const locationLoading = ref(false);
const locationSupported = computed(() => "geolocation" in navigator);

const tagSelectRef = ref(null);

function onTagSelect() {
  // ✅ Force close dropdown
  if (tagSelectRef.value) {
    tagSelectRef.value.hidePopup();
  }
}

watch(
  () => post.tags,
  (newTags) => {
    if (newTags.includes("public") && newTags.includes("private")) {
      // Only keep the latest one selected
      const last = newTags[newTags.length - 1];
      post.tags = [last];
    }
  }
);

// Initialize camera
onMounted(() => {
  initCamera();
});

function initCamera() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      video.value.srcObject = stream;
    })
    .catch(() => {
      hasCameraSupport.value = false;
    });
}

// Start recording
function startRecording() {
  const stream = video.value.srcObject;
  mediaRecorder.value = new MediaRecorder(stream);

  mediaRecorder.value.ondataavailable = (e) => {
    chunks.value.push(e.data);
  };

  mediaRecorder.value.onstop = () => {
    if (chunks.value.length > 0) {
      const blob = new Blob(chunks.value, { type: "video/mp4" });
      videoURL.value = URL.createObjectURL(blob);
      post.video = blob;
      videoCaptured.value = true;
    }
    chunks.value = [];
  };

  mediaRecorder.value.start();
  recording.value = true;
}

// Stop recording
function stopRecording() {
  mediaRecorder.value.stop();
  recording.value = false;
}

// Handle file upload fallback
function captureVideoFallback(event) {
  const file = event.target.files[0];
  if (file) {
    post.video = file;
    videoURL.value = URL.createObjectURL(file);
    videoCaptured.value = true;
  }
}

// ---------------Upload video --------------------------
async function uploadVideo() {
  const user = auth.currentUser;
  if (!user) {
    $q.notify({
      type: "negative",
      message: "You must be logged in to upload a video!",
    });
    return;
  }

  const formData = new FormData();
  formData.append("id", post.id);
  formData.append("caption", post.caption);
  formData.append("location", post.location);
  formData.append("date", post.date);
  formData.append("video", post.video, `${post.id}.mp4`);
  formData.append("tags", post.tags.join(",")); // ✅ Add this line

  try {
    $q.loading.show();
    const idToken = await user.getIdToken();
    await apiNode.post(`/api/create-video-post`, formData, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    $q.notify({ type: "positive", message: "Video uploaded successfully!" });
    router.push("/video-posts");
  } catch (error) {
    $q.notify({ type: "negative", message: "Failed to upload video." });
  } finally {
    $q.loading.hide();
  }
}

// ------------Geolocation logic -------------------
function getLocation() {
  locationLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => getCityAndCountry(position),
    () => locationError(),
    { timeout: 7000 }
  );
}

function getCityAndCountry(position) {
  const apiUrl = `https://geocode.xyz/${position.coords.latitude},${position.coords.longitude}?json=1`;
  axios
    .get(apiUrl)
    .then((result) => locationSuccess(result))
    .catch(() => locationError());
}

function locationSuccess(result) {
  post.location = result.data.city;
  if (result.data.country) {
    post.location += `, ${result.data.country}`;
  }
  locationLoading.value = false;
}

function locationError() {
  $q.dialog({ title: "Error", message: "Could not find your location." });
  locationLoading.value = false;
}

async function flipCamera() {
  isFrontCamera.value = !isFrontCamera.value;

  // Stop old stream
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
  }

  // Start new stream with flipped camera
  const facingMode = isFrontCamera.value ? "user" : "environment";

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: true, // ✅ include microphone
    });

    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.srcObject = mediaStream;
    }
  } catch (err) {
    console.error("Camera access failed:", err);
  }
}
</script>

<style lang="sass">
.camera-frame
  position: relative
  width: 100%
  max-width: 500px
  aspect-ratio: 4 / 3
  overflow: hidden
  margin: 0 auto
  border: 2px solid $grey-10
  border-radius: 10px
  background-color: white

video
  width: 100%
  height: 100%
  object-fit: cover
  display: block




  padding-bottom: env(safe-area-inset-bottom);

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
  padding-bottom: 40px // extra space for buttons
</style>
