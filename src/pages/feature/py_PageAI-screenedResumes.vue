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
          class="q-ml-sm"
          @click="fetchScreenedResumes"
        />

        <q-table
          :rows="screenedResumes"
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
const FASTAPI_URL = process.env.VUE_APP_FASTAPI_URL;

const minScore = ref(0);
const screenedResumes = ref([]);

const columns = [
  { name: "candidate", label: "Candidate ID", field: "userId", align: "left" },
  {
    name: "experience",
    label: "Experience (Years)",
    field: (row) => row.response.years_of_experience,
    align: "center",
  },
  {
    name: "skills",
    label: "Matched Skills",
    field: (row) => row.response.matched_skills.join(", "),
    align: "left",
  },
  { name: "score", label: "Score", field: "resume_score", align: "center" },
  { name: "actions", label: "Actions", align: "right" },
];

const fetchScreenedResumes = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const employerId = localStorage.getItem("employer_id"); // ✅ Get employer ID from storage
    const employerPhoneNo = localStorage.getItem("phone_number");

    if (!token) throw new Error("No FastAPI token available");
    //---backend hr_screened_resume.py ----------------------------------------
    const response = await axios.get(`${FASTAPI_URL}/ai/hr/resume/screened`, {
      params: {
        min_score: minScore.value,
        employer_id: employerId, // ✅ Send employer ID filter
        phone_number: employerPhoneNo, // ✅ Send employer phone filter
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    screenedResumes.value = response.data.screened_resumes;
    $q.notify({ type: "positive", message: "Screened resumes loaded!" });
  } catch (error) {
    console.error("🔥 Error fetching screened resumes:", error);
    $q.notify({ type: "negative", message: "Failed to load resumes!" });
  }
};

const viewResume = (resume) => {
  console.log("🔍 Viewing Resume:", resume);
  $q.dialog({
    title: `Resume Analysis - Candidate ${resume.userId}`,
    message: `
        <b>Experience:</b> ${resume.response.years_of_experience} years <br>
        <b>Skills:</b> ${resume.response.matched_skills.join(", ")} <br>
        <b>Score:</b> ${resume.resume_score}/100 <br>
        <b>Feedback:</b> ${resume.response.overall_feedback}
      `,
    html: true,
    ok: "Close",
  });
};

onMounted(() => {
  fetchScreenedResumes();
});
</script>
