<!-- src/pages/feature/py_SuccessfulPage.vue -->
<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <q-icon name="check_circle" color="green" size="64px" />
      <div class="text-h5 q-mt-md">Resume Submitted!</div>
      <div class="text-subtitle2 q-mt-sm">
        Thank you for submitting your resume. We'll notify you after review.
      </div>
      <q-btn
        class="q-mt-lg"
        color="primary"
        label="Back to Job Board"
        to="/public/job-opening"
      />
    </div>
  </q-page>
</template>
