<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">🧠 Semantic Resume Matcher</div>
      </q-card-section>

      <q-card-section>
        <q-select
          v-model="selectedJob"
          label="Select Job"
          :options="jobs"
          option-value="id"
          option-label="title"
          outlined
          dense
        />
        <q-btn
          label="Match Resumes"
          color="primary"
          class="q-mt-md"
          :disable="!selectedJob"
          @click="fetchSemanticMatches"
        />
      </q-card-section>

      <q-card-section v-if="matches.length > 0">
        <q-table
          title="Top Matches"
          :rows="matches"
          :columns="columns"
          row-key="resume_id"
          dense
          flat
          bordered
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useQuasar } from "quasar";

const $q = useQuasar();
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";

const jobs = ref([]);
const selectedJob = ref(null);
const matches = ref([]);

const columns = [
  { name: "resume_id", label: "Resume ID", field: "resume_id", align: "left" },
  { name: "name", label: "Name", field: "candidate_name", align: "left" },
  { name: "email", label: "Email", field: "candidate_email", align: "left" },
  { name: "phone", label: "Phone", field: "candidate_phone", align: "left" },
  {
    name: "similarity_score",
    label: "Similarity",
    field: "similarity_score",
    align: "center",
    format: (val) => `${(val * 100).toFixed(2)}%`,
  },
  {
    name: "years_of_experience",
    label: "Experience",
    field: "years_of_experience",
    align: "center",
  },
  {
    name: "matched_skills",
    label: "Skills",
    field: (row) => row.matched_skills.join(", "),
    align: "left",
  },
];

const fetchJobs = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const res = await axios.get(`${FASTAPI_URL}/ai/hr/job-descriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    jobs.value = res.data.map((job) => ({
      id: job._id.$oid || job._id, // handle ObjectId
      title: job.title,
    }));
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    $q.notify({ type: "negative", message: "Failed to fetch jobs" });
  }
};

const fetchSemanticMatches = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const res = await axios.get(`${FASTAPI_URL}/semantic-match/job`, {
      params: { job_id: selectedJob.value.id },
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("🔍 Matching result:", res.data.matches); // 👈 ADD THIS LINE
    matches.value = res.data.matches;
  } catch (err) {
    console.error(err);
    $q.notify({ type: "negative", message: "Matching failed" });
  }
};

onMounted(fetchJobs);
</script>
