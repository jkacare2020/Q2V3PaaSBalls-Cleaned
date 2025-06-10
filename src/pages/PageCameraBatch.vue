<template>
  <q-page class="q-pa-md constrain-more">
    <div class="text-h6 q-mb-md">📸 Batch Photo Capture</div>

    <q-input
      v-model="batchCaption"
      label="Caption for All Photos"
      outlined
      dense
      class="q-mb-md"
      autofocus
      :rules="[
        (val) => !!val?.trim() || 'Caption is required before capturing photos',
      ]"
    />

    <div class="camera-frame">
      <video ref="video" autoplay playsinline muted class="video-preview" />
    </div>

    <div class="q-my-md text-center">
      <q-btn
        @click="captureImage"
        color="primary"
        icon="photo_camera"
        label="Capture"
        class="q-mr-sm"
        :disable="!batchCaption.trim()"
      />

      <q-btn
        @click="uploadBatch"
        :disable="capturedPhotos.length === 0 || !batchCaption.trim()"
        color="positive"
        icon="cloud_upload"
        label="Upload Batch"
      />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="(photo, index) in capturedPhotos" :key="index" class="col-6">
        <img
          :src="photo.previewUrl"
          class="q-img"
          style="width: 100%; border-radius: 8px; border: 1px solid #ccc"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { uid, useQuasar } from "quasar";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";

const $q = useQuasar();
const video = ref(null);
const batchCaption = ref("");
const capturedPhotos = ref([]);

onMounted(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
    });
    video.value.srcObject = stream;
  } catch (err) {
    $q.dialog({ title: "Error", message: "Camera not available." });
  }
});

function captureImage() {
  const canvas = document.createElement("canvas");
  canvas.width = video.value.videoWidth;
  canvas.height = video.value.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(
    (blob) => {
      const id = uid();
      const previewUrl = URL.createObjectURL(blob);
      capturedPhotos.value.push({ id, blob, previewUrl });
    },
    "image/jpeg",
    0.9
  );
}

async function uploadBatch() {
  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();
  $q.loading.show();

  try {
    for (const photo of capturedPhotos.value) {
      const formData = new FormData();
      formData.append("id", photo.id);
      formData.append("caption", batchCaption.value);
      formData.append("location", "");
      formData.append("date", Date.now());
      formData.append("file", photo.blob, `${photo.id}.jpg`);
      formData.append("tags", "private");

      await apiNode.post("/api/create-post", formData, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
    }

    $q.notify({ message: "📤 Batch uploaded!", color: "positive" });
    capturedPhotos.value = [];
    batchCaption.value = "";
  } catch (err) {
    console.error(err);
    $q.dialog({ title: "Error", message: "Upload failed." });
  }

  $q.loading.hide();
}
</script>

<style scoped>
.camera-frame {
  max-width: 100%;
  aspect-ratio: 4/3;
  border: 2px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}
.video-preview {
  width: 100%;
  height: auto;
  object-fit: cover;
}
</style>
