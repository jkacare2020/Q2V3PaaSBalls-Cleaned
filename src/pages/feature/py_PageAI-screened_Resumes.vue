<template>
  <q-page class="q-pa-md">
    <q-toolbar>
      <q-toolbar-title>AI-Screened Resumes</q-toolbar-title>
    </q-toolbar>

    <q-table :rows="resumes" :columns="columns" row-key="_id" bordered dense>
      <template v-slot:body-cell-score="{ row }">
        <q-td
          ><q-badge :label="row.response.resume_score" color="primary"
        /></q-td>
      </template>

      <template v-slot:body-cell-feedback="{ row }">
        <q-td>{{ row.response.overall_feedback }}</q-td>
      </template>

      <template v-slot:body-cell-actions="{ row }">
        <q-td>
          <q-btn
            label="Shortlist"
            color="orange"
            @click="shortlistCandidate(row)"
            v-if="!row.shortlisted"
          />
          <q-btn label="View Details" color="green" @click="viewDetails(row)" />
          <q-btn label="Download" color="blue" @click="downloadResume(row)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const resumes = ref([]);
const API_URL = process.env.VUE_APP_FASTAPI_URL;

const fetchResumes = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const employerId = localStorage.getItem("employer_id"); // ✅ Get employer ID

    if (!token || !employerId) throw new Error("Missing authentication info!");

    const response = await axios.get(
      `${API_URL}/ai/hr/resume/employer-resumes/${employerId}`, // ✅ Use employer-specific endpoint
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    resumes.value = response.data.resumes; // ✅ Update resumes list
    console.log("✅ Resumes fetched:", resumes.value);
  } catch (error) {
    console.error("🔥 Error fetching resumes:", error);
  }
};

const shortlistCandidate = async (row) => {
  try {
    await axios.put(
      `${API_URL}/ai/hr/shortlist-candidate/${row._id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      }
    );
    row.shortlisted = true;
  } catch (error) {
    console.error("🔥 Error shortlisting candidate:", error);
  }
};

const downloadResume = async (row) => {
  window.open(`${API_URL}${row.resumeFileUrl}`, "_blank");
};

onMounted(fetchResumes);
</script>
