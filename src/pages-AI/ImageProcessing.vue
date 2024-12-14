<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md" style="width: 600px">
      <q-card>
        <q-card-section>
          <div class="text-h6">Image Upload and Processing</div>
        </q-card-section>

        <q-card-section>
          <q-uploader
            ref="uploader"
            :url="uploadUrl"
            color="primary"
            text-color="black"
            no-thumbnails
            multiple
            :headers="headers"
            @uploaded="onUploadSuccess"
            @failed="onUploadError"
            accept="image/*"
          />
          <q-btn
            label="Upload Image"
            color="secondary"
            class="full-width q-mt-md"
            @click="startUpload"
          />
        </q-card-section>

        <q-card-section v-if="processing">
          <q-spinner-dots color="primary" size="50px" />
          <div class="text-center">Processing Image...</div>
        </q-card-section>

        <q-card-section v-if="result">
          <q-banner color="blue-4" class="text-white">
            <strong>Processing Result:</strong> {{ result }}
          </q-banner>
        </q-card-section>

        <q-card-section v-if="message">
          <q-banner
            :color="messageType === 'success' ? 'green' : 'red'"
            class="text-white"
          >
            {{ message }}
          </q-banner>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
// Removed unused import: import { api } from "boot/axios";

const uploader = ref(null);
const uploadUrl = "/upload/image"; // Backend API endpoint
const headers = {
  Authorization: `Bearer ${localStorage.getItem("token")}`,
};

const message = ref("");
const messageType = ref("success");
const processing = ref(false);
const result = ref("");

const startUpload = () => {
  processing.value = true;
  uploader.value.upload();
};

const onUploadSuccess = (response) => {
  processing.value = false;
  message.value = "Image uploaded and processed successfully!";
  messageType.value = "success";
  result.value = response.data.processed_data; // Adjust based on backend response
};

const onUploadError = (error) => {
  processing.value = false;
  message.value = error.response?.data?.error || "Image upload failed";
  messageType.value = "error";
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
