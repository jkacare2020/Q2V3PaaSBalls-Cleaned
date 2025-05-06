<template>
  <!--- PageMarketplace.vue --->
  <q-page class="q-pa-md">
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>🛒 Marketplace</q-toolbar-title>
    </q-toolbar>

    <q-input
      v-model="searchQuery"
      placeholder="Search items..."
      outlined
      dense
      class="q-my-md"
    />

    <q-list>
      <q-item
        v-for="item in filteredMarketplacePosts"
        :key="item._id"
        clickable
        @click="$router.push(`/product-view/${item._id}`)"
      >
        <q-item-section avatar>
          <img
            :src="item.imageUrl || defaultImage"
            alt="Product"
            style="height: 64px; width: 64px"
          />
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label caption class="text-grey">
            {{ item.description }} – ${{ item.price }}
          </q-item-label>
          <q-item-label caption class="text-grey">
            {{ formatDate(item.createdAt) }} – ${{ item.price }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn icon="shopping_cart" flat color="primary" label="View" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { apiNode } from "boot/apiNode";

const posts = ref([]); // Assume you already fetched marketplace-tagged posts here
const searchQuery = ref("");

onMounted(async () => {
  try {
    const res = await apiNode.get("/api/products/marketplace");
    posts.value = res.data;
  } catch (err) {
    console.error("Error loading marketplace products:", err);
  }
});

const filteredMarketplacePosts = computed(() =>
  posts.value.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>
