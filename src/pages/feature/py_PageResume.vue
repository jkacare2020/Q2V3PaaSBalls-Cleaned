<template>
  <q-page class="q-pa-md">
    <q-card v-if="resume" class="q-pa-md">
      <q-card-section>
        <div class="text-h6">📜 Resume Analysis for {{ resume.userId }}</div>
        <q-separator />
        <p><strong>📝 Extracted Resume Text:</strong></p>
        <q-scroll-area style="height: 150px; max-width: 100%">
          <p class="text-caption">{{ resume.query }}</p>
        </q-scroll-area>
      </q-card-section>

      <q-card-section>
        <p><strong>🤖 AI Feedback:</strong></p>
        <q-scroll-area style="height: 100px; max-width: 100%">
          <p class="text-caption">{{ resume.response }}</p>
        </q-scroll-area>
      </q-card-section>

      <q-card-section>
        <p>
          <strong>📊 Resume Score:</strong>
          {{ resume.resume_score || "Not Graded" }}
        </p>
        <q-btn
          v-if="!resume.resume_score"
          label="Grade Resume"
          color="primary"
          @click="gradeResume(resume._id)"
        />
      </q-card-section>
    </q-card>

    <q-card v-else class="q-pa-md">
      <q-card-section>
        <p>No resume analysis found.</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { apiFastAPI } from "boot/apiFastAPI";
import { useQuasar } from "quasar";

const $q = useQuasar();
const resume = ref(null);

const fetchResumeAnalysis = async () => {
  try {
    const response = await apiFastAPI.get("/ai/hr/resume-results");
    resume.value = response.data;
  } catch (error) {
    console.error("Error fetching resume analysis:", error);
  }
};

const gradeResume = async (resumeId) => {
  try {
    const response = await apiFastAPI.post("/ai/hr/grade-resume", null, {
      params: { resume_id: resumeId },
    });
    $q.notify({ type: "positive", message: response.data.message });
    fetchResumeAnalysis(); // Refresh data
  } catch (error) {
    console.error("Error grading resume:", error);
    $q.notify({ type: "negative", message: "Failed to grade resume" });
  }
};

onMounted(fetchResumeAnalysis);
</script>
