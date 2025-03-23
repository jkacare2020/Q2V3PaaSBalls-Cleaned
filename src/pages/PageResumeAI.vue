<template>
  <q-page class="q-pa-md">
    <q-card class="uniform-card">
      <q-card-section>
        <div class="text-h6 text-center">AI Resume Analyzer</div>
      </q-card-section>

      <!-- File Upload -->
      <q-card-section>
        <q-file
          v-model="resumeFile"
          label="Upload Resume"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          filled
        />
        <q-btn
          label="Analyze"
          color="primary"
          @click="analyzeResume"
          class="q-mt-md"
        />
      </q-card-section>

      <!-- AI Analysis Result -->
      <q-card-section v-if="analysisResult">
        <q-card>
          <q-card-section>
            <div class="text-h6">AI Analysis</div>
            <p>{{ analysisResult }}</p>
          </q-card-section>
        </q-card>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";

const $q = useQuasar();
const resumeFile = ref(null);
const analysisResult = ref("");

const analyzeResume = async () => {
  if (!resumeFile.value) {
    $q.notify({ type: "negative", message: "Please upload a resume" });
    return;
  }

  const formData = new FormData();
  formData.append("file", resumeFile.value);

  try {
    const response = await axios.post(
      `${process.env.API}/resume/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    analysisResult.value = response.data.analysis;
  } catch (error) {
    console.error("Resume Analysis Error:", error);
    $q.notify({ type: "negative", message: "Analysis failed" });
  }
};
</script>

<style scoped>
.uniform-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>
