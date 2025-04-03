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

        <q-spinner v-if="loading" color="primary" size="md" class="q-mt-md" />

        <q-btn
          label="Submit"
          color="primary"
          @click="uploadResume"
          :disable="!resumeFile"
          :loading="loading"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router"; // ✅ Add useRouter

import axios from "axios";
import { useQuasar } from "quasar";

const loading = ref(false);

// ✅ Get props from route query
const router = useRouter(); // ✅ for .push()
const route = useRoute(); // ✅ for .query
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

  loading.value = true;

  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("🚨 No token found!");

    console.log("🚀 Uploading Resume with:", {
      jobId: jobId.value,
      employerId: employerId.value,
      resumeFile: resumeFile.value.name,
    });

    const res = await axios.post(`${API_URL}/ai/hr/resume-upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("✅ Resume upload response:", res.data);
    // $q.notify({ type: "positive", message: "Resume uploaded successfully!" });
    // ✅ Redirect
    $q.notify({ type: "positive", message: "Resume uploaded successfully!" });
    router.push("/upload-success");
  } catch (error) {
    console.error("🔥 Error uploading resume:", error);
    $q.notify({ type: "negative", message: "Upload failed!" });
  } finally {
    loading.value = false;
  }
};
</script>
