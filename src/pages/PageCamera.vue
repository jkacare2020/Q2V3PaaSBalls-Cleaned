<template>
  <!--PageCamera.vue--->
  <q-page class="constrain-more q-pa-md">
    <div class="camera-action-group">
      <q-select
        v-model="selectedResolution"
        :options="resolutionOptions"
        label="Resolution"
        outlined
        dense
        emit-value
        map-options
      />

      <div class="camera-frame">
        <video
          v-show="!imageCaptured"
          ref="video"
          class="full-width"
          autoplay
          playsinline
          muted
        />
        <canvas
          v-show="imageCaptured"
          ref="canvas"
          class="full-width"
          height="240"
        />
      </div>
      <div class="text-center q-pa-md">
        <q-btn
          color="primary"
          icon="flip_camera_android"
          @click="flipCamera"
          size="lg"
          round
        >
          <q-tooltip>Flip Camera</q-tooltip>
          <!-- 🧠 Tooltip here -->
        </q-btn>
        <!-- 📸 Capture Image Button (Icon only) -->
        <q-btn
          v-if="hasCameraSupport"
          @click="captureImage"
          :disable="imageCaptured"
          color="grey-10"
          icon="eva-camera"
          size="lg"
          round
          class="q-ml-md"
        >
          <q-tooltip>Capture Photo</q-tooltip>
          <!-- 🧠 Tooltip here -->
        </q-btn>
        <q-file
          v-else
          v-model="imageUpload"
          @input="captureImageFallback"
          label="Choose an image"
          accept="image/*"
          outlined
        >
          <template v-slot:prepend>
            <q-icon name="eva-attach-outline" />
          </template>
        </q-file>
        <div class="row justify-center q-ma-md">
          <q-input
            v-model="post.caption"
            label="Caption *"
            outlined
            dense
            class="q-mt-md"
            style="width: 100%; max-width: 500px"
          />
        </div>
        <div class="row justify-center q-ma-md">
          <q-input
            v-model="post.location"
            :loading="locationLoading"
            label="Location"
            outlined
            dense
            class="q-mt-md"
            style="width: 100%; max-width: 500px"
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
        <div class="row justify-center q-ma-md">
          <q-select
            v-model="post.tags"
            :options="[
              'avatar',
              'public',
              'private',
              'merchant',
              'logo',
              'certification',
            ]"
            multiple
            label="Tags"
            outlined
            dense
            class="col col-sm-6"
            use-chips
            hide-dropdown-after-select
          />
        </div>
        <div class="row justify-center q-mt-lg">
          <q-btn
            @click="addPost()"
            :disable="!post.caption || !post.photo"
            color="primary"
            label="Post Image"
            rounded
            unelevated
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { uid, useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import axios from "axios";
import { useRouter } from "vue-router";
import { apiNode, nodeApiBaseURL } from "boot/apiNode"; // ✅ Make sure to import it
const router = useRouter();
const $q = useQuasar();

const post = reactive({
  id: uid(),
  caption: "",
  location: "",
  photo: null,
  date: Date.now(),
  tags: [], // ✅ Add this field
});

const video = ref(null);
const canvas = ref(null);
const imageCaptured = ref(false);
const imageUpload = ref([]);
const hasCameraSupport = ref(true);
const locationLoading = ref(false);
const locationSupported = computed(() => "geolocation" in navigator);
const selectedResolution = ref("1280x720");
const cameraFacingMode = ref("environment"); // default: back camera

const resolutionOptions = [
  { label: "HD 1280x720", value: "1280x720" },
  { label: "SD 640x480", value: "640x480" },
  { label: "Full HD 1920x1080", value: "1920x1080" },
];

onMounted(() => {
  initCamera();
});

function initCamera() {
  navigator.mediaDevices
    .getUserMedia({
      video: {
        width: selectedResolution.value.width,
        height: selectedResolution.value.height,
        facingMode: cameraFacingMode.value,
      },
      audio: false,
    })
    .then((stream) => {
      video.value.srcObject = stream;
    })
    .catch(() => {
      hasCameraSupport.value = false;
    });
}

const captureImage = () => {
  if (!video.value) return;

  const videoElement = video.value;
  const canvasElement = canvas.value;
  const context = canvasElement.getContext("2d");

  // ⚡ VERY IMPORTANT: match canvas size to actual video stream size
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;

  context.drawImage(
    videoElement,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );

  // ✅ Now capture correctly
  canvasElement.toBlob(
    (blob) => {
      post.photo = blob;
      imageCaptured.value = true;
    },
    "image/jpeg",
    0.9
  ); // you can adjust quality here
};

function captureImageFallback(event) {
  // Accessing the files property directly from the event target
  const fileList = event.target.files;

  // Check if fileList is provided and contains at least one file
  if (!fileList || fileList.length === 0) {
    console.error("No file uploaded.");
    return;
  }

  // Get the first file from the fileList
  const file = fileList[0];
  console.log("File received:", file); // Debugging - Check the file object

  // Ensure that the file is a valid Blob or File
  if (!(file instanceof Blob) && !(file instanceof File)) {
    console.error("The uploaded file is not of type Blob or File.");
    return;
  }

  console.log("File is of correct type:", file.type); // Debugging - Confirm the type

  // Assign the uploaded file to post.photo
  post.photo = file;

  // Display the image in the canvas for preview
  const canvasElement = canvas.value;
  if (!canvasElement) {
    console.error("Canvas element is not available.");
    return;
  }

  const context = canvasElement.getContext("2d");

  const reader = new FileReader();

  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      canvasElement.width = img.width;
      canvasElement.height = img.height;
      context.drawImage(img, 0, 0);
      imageCaptured.value = true; // Set the image captured state to true
    };
    img.src = event.target.result;
  };

  // Read the file as a data URL for preview
  reader.readAsDataURL(file);
}

function disableCamera() {
  if (video.value?.srcObject) {
    video.value.srcObject.getVideoTracks().forEach((track) => {
      track.stop();
    });
  }
}

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
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
//--------------------add image-----------------------------
async function addPost() {
  $q.loading.show();

  const user = auth.currentUser;
  if (!user) {
    $q.loading.hide();
    $q.notify({
      message: "You must be logged in to create a post!",
      actions: [{ label: "Dismiss", color: "white" }],
    });
    return;
  }

  const formData = new FormData();
  formData.append("id", post.id);
  formData.append("caption", post.caption);
  formData.append("location", post.location);
  formData.append("date", post.date);
  formData.append("file", post.photo, `${post.id}.png`);
  formData.append("tags", post.tags.join(",")); // ✅ Add this line

  try {
    console.log("API URL:", nodeApiBaseURL); // url backend

    const idToken = await user.getIdToken();
    await apiNode.post(`/api/create-post`, formData, {
      // postRoutes.js /creat-post...> createPostcontroller.js
      headers: { Authorization: `Bearer ${idToken}` },
    });
    $q.localStorage.set("postCreated", true);
    $q.notify({
      message: "Post created!",
      actions: [{ label: "Dismiss", color: "white" }],
    });

    // Redirect to the photo page
    router.push("/photos");

    $q.loading.hide();
  } catch (err) {
    addPostError();
    $q.loading.hide();
  }
}

function addPostError() {
  $q.dialog({ title: "Error", message: "Sorry, could not create post!" });
}

const usingRearCamera = ref(true);
let currentStream = null;

const startCamera = async () => {
  if (currentStream) {
    currentStream.getTracks().forEach((track) => track.stop());
  }
  try {
    const constraints = {
      video: {
        facingMode: usingRearCamera.value ? { exact: "environment" } : "user",
      },
      audio: false,
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.value.srcObject = stream;
    currentStream = stream;
  } catch (err) {
    console.error("Error starting camera:", err);
  }
};

const flipCamera = async () => {
  usingRearCamera.value = !usingRearCamera.value;
  await startCamera();
};

// Call startCamera() once initially:
startCamera();
</script>

<style lang="sass">
.camera-action-group
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center
  gap: 12px // controls vertical spacing between video & button


.camera-frame
  position: relative
  width: 100%
  max-width: 500px
  aspect-ratio: 4 / 3
  overflow: hidden
  border: 2px solid $grey-10
  border-radius: 10px
  background: white


.video-preview
  width: 110%
  height: 100%
  object-fit: cover




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

.video
  width: 100%
  height: auto
  object-fit: cover
  /* Stretch nicely if needed */
</style>
