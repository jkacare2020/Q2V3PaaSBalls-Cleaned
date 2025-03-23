<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <q-card-section>
        <div class="text-h6 text-center">Edit Your Todo</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="updateTodo">
          <q-input v-model="todo.title" label="Title" filled required />
          <q-input
            v-model="todo.description"
            label="Description"
            type="textarea"
            filled
            required
          />
          <q-select
            v-model="todo.priority"
            :options="[1, 2, 3, 4, 5]"
            label="Priority"
            filled
          />
          <q-checkbox v-model="todo.complete" label="Complete" />

          <div class="q-mt-md row justify-end">
            <q-btn label="Save" type="submit" color="primary" class="q-mr-sm" />
            <q-btn label="Delete" color="negative" @click="deleteTodo" />
            <q-btn label="Back" color="secondary" @click="goBack" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { apiFastAPI } from "boot/apiFastAPI";
import { useQuasar } from "quasar";

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

const todo = ref({
  title: "",
  description: "",
  priority: 1,
  complete: false,
});

const fetchTodo = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    const response = await apiFastAPI.get(`/todos/todo/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    todo.value = response.data;
  } catch (error) {
    console.error("Error fetching todo:", error);
    $q.notify({ type: "negative", message: "Failed to load todo" });
  }
};

const updateTodo = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    await apiFastAPI.put(`/todos/todo/${route.params.id}`, todo.value, {
      headers: { Authorization: `Bearer ${token}` },
    });

    $q.notify({ type: "positive", message: "Todo updated successfully!" });
    router.push("/py_PageTodos"); // Redirect back
  } catch (error) {
    console.error("Error updating todo:", error);
    $q.notify({ type: "negative", message: "Failed to update todo" });
  }
};

const deleteTodo = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    await apiFastAPI.delete(`/todos/todo/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    $q.notify({ type: "positive", message: "Todo deleted successfully!" });
    router.push("/py_PageTodos"); // Redirect back
  } catch (error) {
    console.error("Error deleting todo:", error);
    $q.notify({ type: "negative", message: "Failed to delete todo" });
  }
};

const goBack = () => {
  router.push("/py_PageTodos");
};

onMounted(fetchTodo);
</script>
