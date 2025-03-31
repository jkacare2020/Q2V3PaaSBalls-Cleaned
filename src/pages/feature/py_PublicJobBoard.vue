<template>
  <q-page class="q-pa-md">
    <q-input
      v-model="search"
      label="Search jobs ..."
      dense
      outlined
      debounce="300"
      class="q-mb-md"
      clearable
    >
      <template v-slot:append>
        <q-icon name="search" />
      </template>
    </q-input>

    <q-toolbar>
      <q-toolbar-title>Job Opening</q-toolbar-title>
      <q-btn color="primary" @click="fetchJobDescriptions">Refresh</q-btn>
    </q-toolbar>

    <!-- ✅ Modal for Full Job Details -->
    <q-dialog v-model="jobModal">
      <q-card style="width: 600px; max-width: 90vw">
        <q-card-section>
          <q-toolbar>
            <q-toolbar-title>Job Details</q-toolbar-title>
            <q-btn flat round icon="close" @click="jobModal = false" />
          </q-toolbar>
        </q-card-section>

        <q-card-section>
          <q-list separator>
            <q-item>
              <q-item-section>
                <q-item-label
                  ><strong>📌 Title:</strong> {{ jobData.title }}</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label
                  ><strong>🏢 Company:</strong>
                  {{ jobData.company }}</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label class="q-pa-none">
                  <strong>📝 Description:</strong>
                  <div class="job-description-box">
                    {{ jobData.description }}
                  </div>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label
                  ><strong>📍 Location:</strong>
                  {{ jobData.location }}</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label
                  ><strong>📊 Salary:</strong>
                  {{ jobData.salaryRange }}</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label
                  ><strong>🔧 Required Skills:</strong>
                  {{ jobData.requiredSkills?.join(", ") }}</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label
                  ><strong>📞 Employer Phone:</strong>
                  {{ jobData.phone_number }}</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="Upload Resume"
            color="green"
            icon="upload"
            @click="goToResumeUpload(jobData)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ✅ Job Description Table with Preview Text -->
    <q-table
      :rows="jobDescriptions"
      :columns="columns"
      :filter="search"
      row-key="_id"
      flat
      bordered
      dense
      class="my-styled-table"
      v-if="!loading"
    >
      <template v-slot:body-cell-title="{ row }">
        <q-td>{{ row.title }}</q-td>
      </template>

      <template v-slot:body-cell-company="{ row }">
        <q-td>{{ row.company }}</q-td>
      </template>

      <template v-slot:body-cell-description="{ row }">
        <q-td :title="row.description">
          {{ row.description.slice(0, 150) }}
          <span v-if="row.description.length > 150">...</span>
        </q-td>
      </template>

      <template v-slot:body-cell-viewDetails="{ row }">
        <q-td class="text-center">
          <q-btn
            color="blue"
            dense
            size="sm"
            @click="editJob(row)"
            icon="visibility"
            round
          />
        </q-td>
      </template>

      <template v-slot:body-cell-uploadResume="{ row }">
        <q-td class="text-center">
          <q-btn
            color="green"
            dense
            size="sm"
            @click="goToResumeUpload(row)"
            icon="upload"
            round
          />
        </q-td>
      </template>
    </q-table>

    <q-spinner v-if="loading" color="primary" size="md" />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { search } from "app/backend/routes/userRoutes";

// const search = ref("");

const router = useRouter();

// ✅ Pass employer details to the Resume Upload page
const goToResumeUpload = (job) => {
  console.log("🔍 Navigating to Resume Upload with:", {
    jobId: job._id,
    employerId: job.createdBy, // ✅ Make sure this field exists in MongoDB
    employerPhone: job.phone_number, // ✅ Make sure this field exists in MongoDB
  });

  router.push({
    path: "/resume-upload",
    query: {
      jobId: job._id,
      employerId: job.createdBy, // ✅ Correct field name
      employerPhone: job.phone_number, // ✅ Correct field name
    },
  });
  jobModal.value = false; // ✅ Close the modal after clicking
};

const columns = [
  { name: "title", label: "Job Title", field: "title", align: "left" },
  { name: "company", label: "Company", field: "company", align: "left" },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
    style: "max-width: 200px",
    classes: "description-preview-cell",
  },

  {
    name: "experienceLevel",
    label: "Experience",
    field: "experienceLevel",
    align: "left",
  },
  { name: "salaryRange", label: "Salary", field: "salaryRange", align: "left" },
  {
    name: "viewDetails",
    label: "View",
    field: "viewDetails",
    align: "center",
    style: "width: 80px",
  },
  {
    name: "uploadResume",
    label: "Upload",
    field: "uploadResume",
    align: "center",
    style: "width: 100px",
  },
];

const jobDescriptions = ref([]);
const jobModal = ref(false);
const isEditing = ref(false);
const jobData = ref({
  title: "",
  company: "",
  description: "",
  requiredSkillsString: "", // ✅ String format, will be converted to an array
  experienceLevel: "Junior",
  salaryRange: "",
  location: "",
});

const loading = ref(false);
const API_URL = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";

// ✅ Function to Retrieve Token
const getFastAPIToken = () => localStorage.getItem("access_token");

const fetchJobDescriptions = async () => {
  loading.value = true;
  try {
    const token = getFastAPIToken();
    if (!token)
      throw new Error("🚨 No token found! User might not be authenticated.");

    const response = await axios.get(`${API_URL}/ai/hr/job-descriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    jobDescriptions.value = response.data;
  } catch (error) {
    console.error("🔥 Error fetching job descriptions:", error);
  } finally {
    loading.value = false;
  }
};

const editJob = (job) => {
  console.log("🔍 View Button Clicked! Job Data:", job);

  jobData.value = { ...job };
  jobData.value.requiredSkillsString = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.join(", ")
    : "";

  isEditing.value = true;

  console.log("📌 Before opening modal, jobModal.value:", jobModal.value);
  jobModal.value = true;
  console.log("✅ After setting jobModal.value:", jobModal.value);
};

onMounted(fetchJobDescriptions);
</script>

<style scoped>
.description-preview-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
