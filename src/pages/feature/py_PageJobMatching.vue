<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">AI Job Matching</div>
      </q-card-section>

      <!-- Job Selection -->
      <q-card-section>
        <q-select
          v-model="selectedJob"
          label="Select Job"
          outlined
          :options="jobList"
          option-value="id"
          option-label="title"
        />
        <q-btn
          label="Match Resumes"
          color="primary"
          class="q-mt-md full-width"
          @click="matchResumes"
        />
      </q-card-section>

      <!-- Matched Result -->
      <q-card-section v-if="matchedResume">
        <div class="text-h6">Best Match</div>
        <p><strong>Resume ID:</strong> {{ matchedResume.best_match_id }}</p>
        <p>
          <strong>Matched Skills:</strong>
          {{ matchedResume.matched_skills.join(", ") }}
        </p>
        <p><strong>Match Score:</strong> {{ matchedResume.match_score }}</p>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";

const $q = useQuasar();
const API_URL = import.meta.env.VITE_API_URL;
const jobList = ref([]);
const selectedJob = ref(null);
const matchedResume = ref(null);

const fetchJobs = async () => {
  try {
    const response = await axios.get(`${API_URL}/job-description/`);
    jobList.value = response.data;
  } catch (error) {
    console.error("Error Fetching Jobs:", error);
  }
};

const matchResumes = async () => {
  if (!selectedJob.value) {
    $q.notify({ type: "negative", message: "Please select a job first!" });
    return;
  }

  try {
    const response = await axios.get(`${API_URL}/job-matching/match`, {
      params: { job_id: selectedJob.value.id },
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    matchedResume.value = response.data;
  } catch (error) {
    console.error("Error Matching Resumes:", error);
    $q.notify({ type: "negative", message: "Failed to match resumes" });
  }
};

onMounted(fetchJobs);
</script>
