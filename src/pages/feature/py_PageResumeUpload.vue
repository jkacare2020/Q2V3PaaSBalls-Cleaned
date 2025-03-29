<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <q-card-section>
        <div class="text-h6">Upload Your Resume</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="jobId" label="Job ID" readonly outlined dense />
        <q-input
          v-model="employerId"
          label="Employer ID"
          readonly
          outlined
          dense
        />

        <!-- 🔹 Resume Upload -->
        <q-file v-model="resumeFile" label="Upload Resume" outlined dense />

        <q-btn
          label="Submit"
          color="primary"
          @click="uploadResume"
          :disable="!resumeFile"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useQuasar } from "quasar";

// ✅ Get props from route query
const route = useRoute();
const $q = useQuasar();
const API_URL = import.meta.env.VITE_FASTAPI_URL;

// ✅ Correctly define props using ref()
const jobId = ref(route.query.jobId || "");
const employerId = ref(route.query.employerId || "");
const resumeFile = ref(null);

// ✅ Function to Retrieve Token
const getFastAPIToken = () => localStorage.getItem("access_token");

// ✅ Upload Resume Function
const uploadResume = async () => {
  if (!resumeFile.value) {
    console.error("🚨 No resume file selected!");
    return;
  }

  const formData = new FormData();
  formData.append("resume", resumeFile.value);
  formData.append("jobId", jobId.value);
  formData.append("employerId", employerId.value);

  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("🚨 No token found!");

    console.log("🚀 Uploading Resume with:", {
      jobId: jobId.value,
      employerId: employerId.value,
      resumeFile: resumeFile.value.name,
    });

    await axios.post(`${API_URL}/ai/hr/resume-upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    $q.notify({ type: "positive", message: "Resume uploaded successfully!" });
  } catch (error) {
    console.error("🔥 Error uploading resume:", error);
    $q.notify({ type: "negative", message: "Upload failed!" });
  }
};
</script>
