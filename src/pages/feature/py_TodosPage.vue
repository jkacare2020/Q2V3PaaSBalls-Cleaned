<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md shadow-2">
      <q-card-section>
        <div class="text-h6 text-center">Your Todo's!</div>
      </q-card-section>

      <q-card-section>
        <q-table
          flat
          bordered
          title="List of your todo's!"
          :rows="todos"
          :columns="columns"
          row-key="id"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                color="primary"
                label="Edit"
                dense
                @click="editTodo(props.row.id)"
              />
            </q-td>
          </template>
        </q-table>

        <q-btn
          label="Add a new todo!"
          color="primary"
          class="q-mt-md"
          @click="addTodo"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { apiFastAPI } from "boot/apiFastAPI";
import { useQuasar } from "quasar";

const router = useRouter();
const $q = useQuasar();
const todos = ref([]);

const columns = [
  { name: "id", label: "#", field: "id", align: "left", sortable: true },
  {
    name: "title",
    label: "Info",
    field: "title",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
    sortable: true,
  }, // 👈 Added description
  { name: "actions", label: "Actions", align: "center" },
];

// Fetch Todos from FastAPI
const fetchTodos = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("No access token found");

    const response = await apiFastAPI.get("/todos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Fetched Todos from API:", response.data); // Add this line
    todos.value = response.data;
  } catch (error) {
    console.error("Error fetching todos:", error);
    $q.notify({ type: "negative", message: "Failed to load todos" });
  }
};

// Watch todos for changes
watch(todos, (newVal) => {
  console.log("Todos updated in UI:", newVal);
});

const editTodo = (todoId) => {
  router.push(`/edit-todo/${todoId}`);
};

const addTodo = () => {
  router.push("/add-todo");
};

onMounted(fetchTodos);
</script>
