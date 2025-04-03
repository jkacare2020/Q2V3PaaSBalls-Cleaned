<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">📋 AI-Screened Resumes</div>
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="minScore"
          label="Minimum Score"
          type="number"
          outlined
          dense
        />
        <q-btn
          label="Filter"
          color="primary"
          class="q-ml-sm q-mt-sm"
          @click="handleFilter"
        />

        <q-btn
          label="Run Matcher"
          color="secondary"
          class="q-ml-sm q-mt-sm"
          @click="runSemanticMatching"
        />

        <q-select
          v-model="selectedJob"
          :options="jobs"
          option-label="title"
          option-value="_id"
          label="Select Job to Match"
          outlined
          dense
          emit-value
          map-options
          class="q-mt-md"
        />

        <div class="q-mt-md text-subtitle1">
          <q-chip color="info" text-color="white">
            Showing:
            {{ isMatchingMode ? "Matching Results" : "Screened Resumes" }}
          </q-chip>
        </div>

        <q-table
          :rows="activeTableData"
          :columns="columns"
          row-key="_id"
          class="q-mt-md"
          dense
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                size="sm"
                color="primary"
                label="View Details"
                @click="viewResume(props.row)"
              />
            </q-td>
          </template>
        </q-table>
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

// State
const minScore = ref(0);
const screenedResumes = ref([]);
const activeTableData = ref([]);
const isMatchingMode = ref(false);
const selectedJob = ref(null);
const jobs = ref([]);

// Columns
const columns = [
  { name: "candidate", label: "Candidate ID", field: "userId", align: "left" },
  {
    name: "experience",
    label: "Experience (Years)",
    field: (row) =>
      row.response?.years_of_experience || row.years_of_experience || "N/A",
    align: "center",
  },
  {
    name: "skills",
    label: "Matched Skills",
    field: (row) =>
      row.response?.matched_skills?.join(", ") ||
      row.matched_skills?.join(", ") ||
      "N/A",
    align: "left",
  },
  {
    name: "score",
    label: "Score / Similarity",
    field: (row) =>
      row.resume_score !== undefined
        ? `${row.resume_score}/100`
        : row.similarity_score !== undefined
        ? `${(row.similarity_score * 100).toFixed(2)}%`
        : "N/A",
    align: "center",
  },
  {
    name: "name",
    label: "Candidate Name",
    field: (row) => row.full_name || row.response?.full_name || "N/A",
    align: "left",
  },
  {
    name: "email",
    label: "Email",
    field: (row) => row.email || row.response?.email || "N/A",
    align: "left",
  },
  {
    name: "phone",
    label: "Phone",
    field: (row) => row.phone || row.response?.phone || "N/A",
    align: "left",
  },
  { name: "actions", label: "Actions", align: "right" },
];

// Fetch resumes
const fetchScreenedResumes = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const employerId = localStorage.getItem("employer_id");
    const phoneNumber = localStorage.getItem("phone_number");

    if (!token) throw new Error("No FastAPI token");

    const response = await axios.get(`${FASTAPI_URL}/ai/hr/resume/screened`, {
      params: {
        min_score: minScore.value,
        employer_id: employerId,
        phone_number: phoneNumber,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    screenedResumes.value = response.data.screened_resumes;
    activeTableData.value = screenedResumes.value;
    isMatchingMode.value = false;

    $q.notify({ type: "positive", message: "Screened resumes loaded" });
  } catch (err) {
    console.error("❌ Error loading resumes:", err);
    $q.notify({ type: "negative", message: "Failed to load resumes" });
  }
};

// Filter button click
const handleFilter = () => {
  fetchScreenedResumes();
};

// View dialog
const viewResume = (resume) => {
  $q.dialog({
    title: `Resume Analysis - Candidate ${
      resume.userId || resume.candidate_name || "N/A"
    }`,
    message: `
      <b>Experience:</b> ${
        resume.response?.years_of_experience ||
        resume.years_of_experience ||
        "N/A"
      } years <br>
      <b>Skills:</b> ${
        resume.response?.matched_skills?.join(", ") ||
        resume.matched_skills?.join(", ") ||
        "N/A"
      } <br>
      <b>Score:</b> ${
        resume.resume_score !== undefined
          ? resume.resume_score + "/100"
          : resume.similarity_score !== undefined
          ? (resume.similarity_score * 100).toFixed(2) + "%"
          : "N/A"
      } <br>
      <b>Feedback:</b> ${resume.response?.overall_feedback || "N/A"}
    `,
    html: true,
    ok: "Close",
  });
};

// Job descriptions
const fetchJobs = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.get(`${FASTAPI_URL}/ai/hr/job-descriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    jobs.value = response.data;
  } catch (err) {
    console.error("❌ Failed to fetch jobs", err);
  }
};

// Semantic Matcher
const runSemanticMatching = async () => {
  if (!selectedJob.value) {
    $q.notify({ type: "warning", message: "Please select a job first" });
    return;
  }

  try {
    const token = localStorage.getItem("access_token");
    const response = await axios.get(`${FASTAPI_URL}/semantic-match/job`, {
      params: { job_id: selectedJob.value },
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("📊 Matching Result:", response.data.matches);
    activeTableData.value = response.data.matches;
    isMatchingMode.value = true;

    $q.notify({ type: "positive", message: "Matching completed!" });
  } catch (err) {
    console.error("❌ Matching failed:", err);
    $q.notify({ type: "negative", message: "Matching failed!" });
  }
};

onMounted(() => {
  fetchScreenedResumes();
  fetchJobs();
});
</script>
