<template>
  <q-page class="q-pa-md">
    <q-input
      v-model="search"
      label="Search jobs..."
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
      <q-toolbar-title>Job Descriptions</q-toolbar-title>
      <q-btn color="primary" @click="fetchJobDescriptions">Refresh</q-btn>
      <q-btn color="green" class="q-ml-sm" @click="openJobModal">Add Job</q-btn>
    </q-toolbar>

    <!-- Job Description Table -->
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

      <template v-slot:body-cell-employerPhone="{ row }">
        <q-td>{{ row.phone_number || "N/A" }}</q-td>
        <!-- ✅ Show employer phone -->
      </template>

      <template v-slot:body-cell-actions="{ row }">
        <q-td>
          <div class="row q-gutter-x-sm">
            <q-btn
              color="blue"
              dense
              size="sm"
              @click="editJob(row)"
              label="Edit"
            />
            <q-btn
              color="negative"
              dense
              size="sm"
              @click="deleteJob(row._id)"
              label="Delete"
            />
          </div>
        </q-td>
      </template>
    </q-table>

    <q-spinner v-if="loading" color="primary" size="md" />

    <q-dialog v-model="jobModal">
      <q-card style="width: 600px; max-width: 90vw">
        <q-card-section>
          <q-toolbar>
            <q-toolbar-title>{{
              isEditing ? "Edit Job" : "Add Job"
            }}</q-toolbar-title>
            <q-btn flat round icon="close" @click="jobModal = false" />
          </q-toolbar>
        </q-card-section>

        <q-card-section>
          <q-input v-model="jobData.title" label="Job Title" outlined dense />
          <q-input
            v-model="jobData.company"
            label="Company Name"
            outlined
            dense
          />
          <q-input
            v-model="jobData.description"
            label="Job Description"
            outlined
            dense
            type="textarea"
          />
          <q-input
            v-model="jobData.phone_number"
            label="Employer Phone"
            outlined
            dense
          />
          <!-- ✅ Employer phone -->

          <!-- ✅ Input for Required Skills -->
          <q-input
            v-model="jobData.requiredSkillsString"
            label="Required Skills (comma-separated)"
            outlined
            dense
          />

          <!-- ✅ Input for Experience Level -->
          <q-select
            v-model="jobData.experienceLevel"
            :options="['Junior', 'Mid', 'Senior']"
            label="Experience Level"
            outlined
            dense
          />

          <!-- ✅ Input for Salary Range -->
          <q-input
            v-model="jobData.salaryRange"
            label="Salary Range"
            outlined
            dense
          />

          <!-- ✅ Input for Location -->
          <q-input v-model="jobData.location" label="Location" outlined dense />

          <!-- ✅ Add File Upload Field for PDF/DOCX -->
          <q-file
            filled
            label="Upload PDF/DOCX Job Description"
            v-model="jobData.attachment"
            accept=".pdf,.doc,.docx"
            dense
            outlined
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="isEditing"
            label="Update"
            color="blue"
            @click="updateJob"
          />
          <q-btn v-else label="Save" color="primary" @click="saveJob" />
          <q-btn label="Cancel" color="negative" @click="jobModal = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const jobDescriptions = ref([]);
const jobModal = ref(false);
const isEditing = ref(false);
const loading = ref(false);
const search = ref(""); // ✅ Search input for table filtering
const API_URL = import.meta.env.VITE_FASTAPI_URL || "http://127.0.0.1:8000";

// ✅ Job Data with Employer Phone
const jobData = ref({
  title: "",
  company: "",
  description: "",
  requiredSkillsString: "",
  experienceLevel: "Junior",
  salaryRange: "",
  location: "",
  phone_number: "", // ✅ New Field
});

// ✅ Columns for Table
const columns = [
  { name: "title", label: "Job Title", field: "title", align: "left" },
  { name: "company", label: "Company", field: "company", align: "left" },
  {
    name: "phone_number",
    label: "Employer Phone",
    field: "phone_number",
    align: "left",
  }, // ✅ Show Phone
  {
    name: "experienceLevel",
    label: "Experience",
    field: "experienceLevel",
    align: "left",
  },
  { name: "actions", label: "Actions", field: "actions", align: "left" },
];

// ✅ Fetch Employer Token
const getFastAPIToken = () => localStorage.getItem("access_token");

// ✅ Fetch Job Descriptions
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

// ✅ Open Job Modal

const openJobModal = () => {
  jobData.value = {
    title: "",
    company: "",
    description: "",
    requiredSkillsString: "",
    experienceLevel: "Junior",
    salaryRange: "",
    location: "",
    phone_number: "", // ✅ Reset phone number
  };
  isEditing.value = false;
  jobModal.value = true;
};

// ✅ Save Job with Employer Info
const saveJob = async () => {
  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("🚨 No token found!");

    const formattedSkills = jobData.value.requiredSkillsString
      ? jobData.value.requiredSkillsString
          .split(",")
          .map((skill) => skill.trim())
      : [];

    const jobPayload = {
      title: jobData.value.title,
      company: jobData.value.company,
      description: jobData.value.description,
      requiredSkills: formattedSkills,
      experienceLevel: jobData.value.experienceLevel,
      salaryRange: jobData.value.salaryRange,
      location: jobData.value.location,
      phone_number: jobData.value.phone_number, // ✅ Include employer phone
    };

    console.log("📤 Sending Job Payload:", jobPayload);

    await axios.post(`${API_URL}/ai/hr/job-descriptions`, jobPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    jobModal.value = false;
    fetchJobDescriptions();
  } catch (error) {
    console.error("🔥 Error saving job:", error);
  }
};

// ✅ Edit Job
const editJob = (job) => {
  jobData.value = { ...job };
  jobData.value.requiredSkillsString = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.join(", ")
    : "";
  isEditing.value = true;
  jobModal.value = true;
};

// ✅ Update Job
const updateJob = async () => {
  try {
    const token = getFastAPIToken();
    if (!token) throw new Error("🚨 No token found!");

    const formattedSkills = jobData.value.requiredSkillsString
      ? jobData.value.requiredSkillsString
          .split(",")
          .map((skill) => skill.trim())
      : [];

    const jobPayload = {
      title: jobData.value.title,
      company: jobData.value.company,
      description: jobData.value.description,
      requiredSkills: formattedSkills,
      experienceLevel: jobData.value.experienceLevel,
      salaryRange: jobData.value.salaryRange,
      location: jobData.value.location,
      phone_number: jobData.value.phone_number,
    };

    console.log("📤 Updating Job Payload:", jobPayload);

    await axios.put(
      `${API_URL}/ai/hr/job-descriptions/${jobData.value._id}`,
      jobPayload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    jobModal.value = false;
    fetchJobDescriptions();
  } catch (error) {
    console.error("🔥 Error updating job:", error);
  }
};
const deleteJob = async (id) => {
  if (!confirm("Are you sure you want to delete this job?")) return;

  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("🚨 No token found! Cannot proceed.");

    console.log(`🗑️ Deleting Job with ID: ${id}`); // ✅ Debugging

    await axios.delete(`${API_URL}/ai/hr/job-descriptions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("✅ Job deleted successfully");
    fetchJobDescriptions(); // ✅ Refresh the table
  } catch (error) {
    console.error("🔥 Error deleting job:", error);
  }
};

onMounted(fetchJobDescriptions);
</script>
