<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-md">
      <q-card-section class="text-h5">📦 Product Details</q-card-section>

      <q-separator />

      <q-card-section v-if="loading">
        <q-spinner color="primary" size="md" />
      </q-card-section>

      <q-card-section v-else>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-img
              :src="product.imageUrl || defaultImage"
              style="max-height: 300px"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="text-h6">{{ product.name }}</div>
            <div class="text-subtitle2 text-grey">
              Product ID: {{ product._id }}
            </div>
            <div class="q-mt-sm">
              <q-chip
                v-for="tag in product.tags"
                :key="tag"
                color="primary"
                text-color="white"
              >
                {{ tag }}
              </q-chip>
            </div>
            <div class="text-body1 q-mt-md">
              <strong>Description:</strong>
              <div>{{ product.description || "No description available" }}</div>
            </div>
            <div class="text-body1 q-mt-md">
              <strong>Price:</strong>
              <span class="text-positive">${{ product.price }}</span>
            </div>
            <div class="text-caption text-grey q-mt-sm">
              Created on: {{ formatDate(product.createdAt) }}
            </div>
            <q-btn
              v-if="canEdit"
              label="Edit Product"
              icon="edit"
              color="primary"
              flat
              class="q-mt-md"
              @click="editProduct"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { apiNode } from "boot/apiNode";
import { auth, db } from "src/firebase/init";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const route = useRoute();
const router = useRouter();
const productId = route.params.id;

const product = ref({});
const userRoles = ref([]);
const loading = ref(true);
const defaultImage = "https://via.placeholder.com/400x300?text=No+Image";

const canEdit = computed(
  () =>
    userRoles.value.includes("merchant") || userRoles.value.includes("admin")
);

onMounted(() => {
  fetchProduct();
  fetchRoles();
});

const fetchProduct = async () => {
  try {
    const res = await apiNode.get(`/api/products/${productId}`);
    product.value = res.data;
  } catch (err) {
    console.error("❌ Failed to load product:", err);
  } finally {
    loading.value = false;
  }
};

const fetchRoles = async () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      userRoles.value = userSnap.data().role || [];
    }
  });
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const editProduct = () => {
  router.push(`/post-product/${product.value.postId}`); // Optional: allow editing via Firestore import flow
};
</script>

<style scoped>
.q-img {
  border-radius: 12px;
}
</style>
