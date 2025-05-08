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
          <!-- View Button (Product details page) -->
          <q-btn
            icon="visibility"
            flat
            color="primary"
            label="View"
            @click.stop="$router.push(`/product-view/${item._id}`)"
          />

          <!-- Cart Button (Go to transaction page) -->
          <q-btn
            icon="shopping_cart"
            flat
            color="orange"
            label="Buy"
            @click.stop="goToTransaction(item)"
          />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { apiNode } from "boot/apiNode";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "src/firebase/init"; // Adjust path if needed
import { useRouter } from "vue-router";

const router = useRouter();

const userData = ref({}); // Create the userData ref
const posts = ref([]); // Assume you already fetched marketplace-tagged posts here
const searchQuery = ref("");

onMounted(async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      userData.value = userDoc.data(); // Now it's available for goToTransaction
    }
  } else {
    console.warn("No logged-in user");
  }
});

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

function goToTransaction(product) {
  const buyer = {
    First_Name: userData.value.firstName || "",
    Last_Name: userData.value.lastName || "",
    Phone_Number: userData.value.phoneNo || "",
    User_Email: userData.value.email || "",
  };

  const transactionPayload = {
    ...buyer,
    transact_amount: product.price,
    description: product.name,
    sellerId: product.userId,
    imageUrl: product.imageUrl,
    productId: product._id,
  };

  router.push({
    path: "/new-transaction-cart",
    query: {
      transaction: JSON.stringify(transactionPayload),
    },
  });
}

//--------------------------------
</script>
