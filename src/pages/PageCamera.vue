<template>
  <q-page class="constrain-more q-pa-md">
    <div class="camera-frame q-pa-md">
      <video
        v-show="!imageCaptured"
        ref="video"
        class="full-width"
        autoplay
        playsinline
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
        v-if="hasCameraSupport"
        @click="captureImage"
        :disable="imageCaptured"
        color="grey-10"
        icon="eva-camera"
        size="lg"
        round
      />
      <q-file
        v-else
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
      <div class="row justify-center q-mt-lg">
        <q-btn
          @click="addPost"
          :disable="!post.caption || !post.photo"
          class="q-mb-lg"
          color="primary"
          label="Post Image"
          rounded
          unelevated
        />
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

const router = useRouter();
const $q = useQuasar();

const post = reactive({
  id: uid(),
  caption: "",
  location: "",
  photo: null,
  date: Date.now(),
});

const video = ref(null);
const canvas = ref(null);
const imageCaptured = ref(false);
const imageUpload = ref([]);
const hasCameraSupport = ref(true);
const locationLoading = ref(false);

const locationSupported = computed(() => "geolocation" in navigator);

onMounted(() => {
  initCamera();
});

function initCamera() {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.value.srcObject = stream;
    })
    .catch(() => {
      hasCameraSupport.value = false;
    });
}

function captureImage() {
  const videoElement = video.value;
  const canvasElement = canvas.value;

  if (videoElement && canvasElement) {
    canvasElement.width = videoElement.getBoundingClientRect().width;
    canvasElement.height = videoElement.getBoundingClientRect().height;
    const context = canvasElement.getContext("2d");
    context.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    imageCaptured.value = true;
    post.photo = dataURItoBlob(canvasElement.toDataURL());
    disableCamera();
  }
}

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
//-------------------------------------------------
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

  try {
    console.log("API URL:", process.env.API); // url backend

    const idToken = await user.getIdToken();
    await axios.post(`${process.env.API}/api/create-post`, formData, {
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
</script>

<style scoped>
.camera-frame {
  border: 2px solid var(--q-color-grey-10);
  border-radius: 10px;
}
</style>
