<template>
  <q-page class="constrain-more q-pa-md">
    <div class="camera-frame q-pa-md">
      <video ref="video" class="full-width" autoplay playsinline muted></video>
    </div>
    <div class="text-center q-pa-md">
      <q-btn
        v-if="!recording"
        @click="startRecording"
        color="red"
        icon="eva-video-outline"
        size="lg"
        round
        label="Record"
      />
      <q-btn
        v-else
        @click="stopRecording"
        color="grey-10"
        icon="eva-stop-circle-outline"
        size="lg"
        round
        label="Stop"
      />
    </div>
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

    <div v-if="videoCaptured" class="q-mt-md">
      <video controls class="full-width" :src="videoURL"></video>
      <q-btn
        @click="uploadVideo"
        class="q-mt-md"
        label="Upload Video"
        color="primary"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { uid, useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const $q = useQuasar();

const post = reactive({
  id: uid(),
  caption: "",
  location: "",
  video: null, // This will hold the video blob
  date: Date.now(), // Automatically set the current date
});

const video = ref(null);
const mediaRecorder = ref(null);
const chunks = ref([]);
const videoCaptured = ref(false);
const recording = ref(false);
const videoURL = ref(null);
const locationLoading = ref(false);
const locationSupported = computed(() => "geolocation" in navigator);

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
      $q.notify({
        type: "negative",
        message: "Camera not accessible.",
      });
    });
}
//------------------------------------------------------------------------

//-------------------------------------------------------------------------
function startRecording() {
  console.log("Start recording");

  const stream = video.value.srcObject;
  mediaRecorder.value = new MediaRecorder(stream);

  mediaRecorder.value.ondataavailable = (e) => {
    console.log("Data available:", e.data);
    chunks.value.push(e.data);
  };

  mediaRecorder.value.onstop = () => {
    console.log("Recording stopped");
    if (chunks.value.length > 0) {
      const blob = new Blob(chunks.value, { type: "video/mp4" });
      videoURL.value = URL.createObjectURL(blob);
      videoCaptured.value = true; // You can set it directly to the post object if needed
      post.video = blob; // Save the blob for uploading later
      console.log("Assigned blob to post.video:", post.video);

      console.log("Blob created:", blob); //---blob is OK----
    } else {
      console.error("No data in chunks array");
    }
    chunks.value = [];
  };

  mediaRecorder.value.start();
  recording.value = true;
  console.log("Recording started");
}

//------------------------------------------------------

function stopRecording() {
  mediaRecorder.value.stop();
  recording.value = false;
}

//---------------------Upload---------------------------------

async function uploadVideo() {
  const user = auth.currentUser;
  if (!user) {
    $q.notify({
      type: "negative",
      message: "You must be logged in to upload a video!",
    });
    return;
  }

  console.log("Blob in uploadVideo:", post.video);

  const formData = new FormData();
  formData.append("id", post.id);
  formData.append("caption", post.caption);
  formData.append("location", post.location);
  formData.append("date", post.date);
  formData.append("video", post.video, "video.mp4");

  console.log("FormData content:", [...formData.entries()]);

  try {
    $q.loading.show();
    const idToken = await user.getIdToken();
    const response = await axios.post(
      `${process.env.API}/api/create-video-post`,
      formData,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    console.log("Video upload response:", response);
    $q.notify({
      type: "positive",
      message: "Video uploaded successfully!",
    });

    router.push("/video-posts");
  } catch (error) {
    console.error("Upload failed:", error);
    $q.notify({
      type: "negative",
      message: "Failed to upload video.",
    });
  } finally {
    $q.loading.hide();
  }
}

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
  $q.dialog({
    title: "Error",
    message: "Could not find your location.",
  });
  locationLoading.value = false;
}
</script>

<style scoped>
.camera-frame {
  border: 2px solid var(--q-color-grey-10);
  border-radius: 10px;
}
</style>
