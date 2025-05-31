<template>
  <q-input filled label="From Date">
    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
      <q-date v-model="fromDate" mask="YYYY-MM-DD" />
    </q-popup-proxy>
  </q-input>

  <q-input filled label="To Date">
    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
      <q-date v-model="toDate" mask="YYYY-MM-DD" />
    </q-popup-proxy>
  </q-input>

  <q-btn label="Search" @click="fetchByDateRange" color="primary" />
</template>

<script setup>
const fetchByDateRange = async () => {
  const token = await auth.currentUser.getIdToken();

  const res = await apiNode.get("/api/transactions/search-by-date", {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      from: fromDate.value,
      to: toDate.value,
    },
  });

  transactions.value = res.data;
};
</script>
