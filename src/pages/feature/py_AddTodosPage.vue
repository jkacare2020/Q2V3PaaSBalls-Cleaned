<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <q-card-section>
        <div class="text-h6 text-center">Make a new Todo</div>
      </q-card-section>

      <q-card-section>
        <q-input v-model="title" label="Title" filled />
        <q-input
          v-model="description"
          label="Description"
          filled
          type="textarea"
        />
        <q-select
          v-model="priority"
          :options="[1, 2, 3, 4, 5]"
          label="Priority"
          filled
        />

        <q-btn
          label="Add Todo"
          color="primary"
          class="q-mt-md"
          @click="submitTodo"
        />
        <q-btn
          label="Back"
          color="secondary"
          class="q-mt-md q-ml-sm"
          @click="router.push('/py_TodosPage')"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { apiFastAPI } from "boot/apiFastAPI";

const router = useRouter();
const $q = useQuasar();

const title = ref("");
const description = ref("");
const priority = ref(null);

const submitTodo = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("No access token found");
    }

    await apiFastAPI.post(
      "/todos/todo",
      {
        title: title.value,
        description: description.value,
        priority: parseInt(priority.value),
        complete: false,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    $q.notify({ type: "positive", message: "Todo added successfully!" });
    router.push("/py_PageTodos"); // Redirect back
  } catch (error) {
    console.error("Error adding todo:", error);
    $q.notify({ type: "negative", message: "Failed to add todo" });
  }
};
</script>
