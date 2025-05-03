<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">📋 Your Product Listings</div>

    <!-- Loading State -->
    <q-spinner v-if="loading" color="primary" size="lg" />

    <!-- Product Table -->
    <q-table
      v-else
      :rows="products"
      :columns="columns"
      row-key="_id"
      flat
      bordered
    >
      <template v-slot:body-cell-imageUrl="props">
        <q-td :props="props">
          <q-img :src="props.row.imageUrl" style="width: 100px; height: auto" />
        </q-td>
      </template>

      <template v-slot:body-cell-videoUrl="props">
        <q-td :props="props">
          <video
            v-if="props.row.videoUrl"
            :src="props.row.videoUrl"
            controls
            style="width: 100px"
          ></video>
          <span v-else>-</span>
        </q-td>
      </template>

      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            icon="edit"
            flat
            dense
            color="primary"
            @click="editProduct(props.row._id)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { apiNode } from "src/boot/apiNode";
import { auth } from "src/firebase/init";

const router = useRouter();
const loading = ref(true);
const products = ref([]);

const columns = [
  { name: "imageUrl", label: "Image", field: "imageUrl" },
  { name: "videoUrl", label: "Video", field: "videoUrl" },
  { name: "name", label: "Name", field: "name", align: "left" },
  { name: "price", label: "Price", field: "price", align: "right" },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
  },
  { name: "actions", label: "Actions", field: "actions", align: "right" },
];

const fetchUserProducts = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const res = await apiNode.get(`/api/products/by-user/${userId}`);
    products.value = res.data.posts || []; // Or merge if needed
  } catch (err) {
    console.error("Failed to fetch user products:", err);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const editProduct = (productId) => {
  router.push(`/post-product/${productId}`);
};

onMounted(fetchUserProducts);
</script>

<style scoped>
.q-img {
  border-radius: 8px;
}
video {
  border-radius: 8px;
}
</style>
