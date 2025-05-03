<template>
  <!--PostProduct.vue--->
  <q-page class="q-pa-md">
    <!-- Page Title -->
    <div class="text-h5 q-mb-md">View or 📦 Post a New Product</div>

    <!-- Product Form -->
    <q-form @submit.prevent="submitProduct" class="q-gutter-md">
      <div class="row items-center q-gutter-sm">
        <q-input
          v-if="isEditingName"
          v-model="editedName"
          label="Edit Name"
          outlined
          dense
          style="flex: 1"
        />
        <q-input
          v-else
          :model-value="postDetails?.name"
          label="Product Name"
          readonly
          outlined
          dense
          style="flex: 1"
        />

        <q-btn
          v-if="canEditProduct && !isEditingName"
          flat
          dense
          icon="edit"
          @click="startEditingName"
        />
        <q-btn
          v-if="isEditingName"
          dense
          icon="check"
          color="primary"
          @click="updateName"
        />
      </div>
      <div class="row items-center q-gutter-sm">
        <q-input
          v-if="isEditingPrice"
          v-model.number="editedPrice"
          label="Edit Price"
          type="number"
          outlined
          dense
          style="flex: 1"
        />
        <q-input
          v-else
          :model-value="postDetails?.price"
          label="Price ($)"
          readonly
          type="number"
          outlined
          dense
          style="flex: 1"
        />

        <q-btn
          v-if="canEditProduct && !isEditingPrice"
          flat
          dense
          icon="edit"
          @click="startEditingPrice"
        />
        <q-btn
          v-if="isEditingPrice"
          dense
          icon="check"
          color="primary"
          @click="updatePrice"
        />
      </div>

      <template v-if="postDetails">
        <div class="row items-center q-gutter-sm">
          <q-input
            v-if="isEditingDescription"
            v-model="editedDescription"
            label="Edit Description"
            type="textarea"
            autogrow
            outlined
            style="flex: 1"
          />
          <q-input
            v-else
            :model-value="postDetails?.description"
            label="Description"
            type="textarea"
            readonly
            autogrow
            outlined
            style="flex: 1"
          />

          <q-btn
            v-if="canEditProduct && !isEditingDescription"
            flat
            dense
            icon="edit"
            @click="startEditingDescription"
          />

          <q-btn
            v-if="isEditingDescription"
            color="primary"
            dense
            icon="check"
            @click="updateDescription"
          />
        </div>
      </template>

      <!-- Image Upload (just base64 preview for now) -->
      <q-uploader
        label="Upload Product Image"
        accept="image/*"
        @added="handleImageUpload"
        :auto-upload="false"
        style="max-width: 300px"
      />

      <q-btn label="Submit" color="primary" type="submit" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Platform, useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { apiNode } from "boot/apiNode";
import { auth, db } from "src/firebase/init"; // ✅ import your initialized Firebase Auth
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

onAuthStateChanged(auth, (user) => {
  if (user) {
    // 🔄 Re-fetch roles, presence, or data
    fetchUserRoles();
    fetchProductDetails(); // if applicable
    console.log("🧠 User reloaded:", user.uid);
  } else {
    console.warn("⚠️ User signed out");
  }
});

const currentUserId = auth.currentUser?.uid;

const route = useRoute();

//---------------------------------------
const ownerPosts = ref([]);
const ownerVideos = ref([]);
const postDetails = ref(null); // ✅ define the ref
const userRoles = ref([]);

const marketingPosts = ref([]);
const marketingVideos = ref([]);
//--------------------------------------

const fetchMarketingMedia = async () => {
  try {
    const res = await apiNode.get(`/api/products/marketing/by-user/${userId}`);
    marketingPosts.value = res.data.posts || [];
    marketingVideos.value = res.data.videos || [];
  } catch (err) {
    console.error("Failed to fetch marketing content:", err);
  }
};
//--------------------------------

const isMerchant = computed(() => userRoles.value.includes("merchant"));
const isAdmin = computed(() => userRoles.value.includes("admin"));
const canEditProduct = computed(() => isMerchant.value || isAdmin.value);
//------------------------------------------------------------------------
const isEditingDescription = ref(false);
const editedDescription = ref("");
const productMongoId = ref(""); // already assigned when importing

const isEditingName = ref(false);
const isEditingPrice = ref(false);
const editedName = ref("");
const editedPrice = ref(0);

const startEditingDescription = () => {
  isEditingDescription.value = true;
  editedDescription.value = postDetails.value?.description || "";
};

const startEditingName = () => {
  editedName.value = postDetails.value.name;
  isEditingName.value = true;
};

const updateName = async () => {
  try {
    const res = await apiNode.put(`/api/products/${productMongoId.value}`, {
      name: editedName.value,
    });
    postDetails.value.name = res.data.name;
    isEditingName.value = false;
    $q.notify({ type: "positive", message: "Name updated!" });
  } catch (err) {
    console.error("❌ Failed to update name:", err);
    $q.notify({ type: "negative", message: "Update failed." });
  }
};

const startEditingPrice = () => {
  editedPrice.value = postDetails.value.price;
  isEditingPrice.value = true;
};

const updatePrice = async () => {
  try {
    const res = await apiNode.put(`/api/products/${productMongoId.value}`, {
      price: editedPrice.value,
    });
    postDetails.value.price = res.data.price;
    isEditingPrice.value = false;
    $q.notify({ type: "positive", message: "Price updated!" });
  } catch (err) {
    console.error("❌ Failed to update price:", err);
    $q.notify({ type: "negative", message: "Update failed." });
  }
};

const updateDescription = async () => {
  try {
    const res = await apiNode.put(`/api/products/${productMongoId.value}`, {
      description: editedDescription.value,
    });
    console.log("description content: ", editedDescription.value);

    postDetails.value.description = res.data.description;
    isEditingDescription.value = false;
    $q.notify({ type: "positive", message: "Description updated!" });
  } catch (err) {
    console.error("❌ Failed to update product:", err);
    $q.notify({ type: "negative", message: "Update failed." });
  }
};

//-----------------------------------------
const fetchProductDetails = async () => {
  try {
    const res = await apiNode.get(`/api/products/${productMongoId.value}`);
    postDetails.value = res.data;
  } catch (err) {
    console.error("❌ Failed to fetch product:", err);
  }
};

// After fetching post from MongoDB, assign it:
onMounted(async () => {
  const postId = route.params.postId;
  if (!postId) return;

  try {
    const res = await apiNode.post(`/api/products/import-from-post/${postId}`);
    const data = res.data;

    productMongoId.value = data._id; // ✅ assign MongoDB ID
    console.log("productMongoId", productMongoId);

    // Optionally preload product list:
    products.value.unshift(data);

    // ✅ now fetch full detail using MongoDB _id
    await fetchProductDetails();
  } catch (err) {
    console.error("❌ Failed to import post as product:", err);
  }
});

//-------------------------------------
const fetchUserRoles = async () => {
  if (!currentUserId) return;
  const userSnap = await getDoc(doc(db, "users", currentUserId));
  if (userSnap.exists()) {
    userRoles.value = userSnap.data().role || [];
  }
};

onMounted(fetchUserRoles);
onMounted(async () => {
  const postId = route.params.postId;
  if (!postId) return;

  try {
    const res = await apiNode.post(`/api/products/import-from-post/${postId}`);
    const data = res.data;

    // Autofill form
    form.value.name = data.name || "";
    form.value.description = data.description || "";
    form.value.price = data.price || 0;
    form.value.image = data.imageUrl || "";

    products.value.unshift(data); // optional: show in product list
  } catch (err) {
    console.error("❌ Failed to import post as product:", err);
    $q.notify({ type: "negative", message: "Failed to import product." });
  }
});

const $q = useQuasar();
const isMobile = Platform.is.mobile;

const defaultImage = "https://via.placeholder.com/400x200?text=No+Image";

// Form data
const form = ref({
  name: "",
  description: "",
  price: 0,
  image: null, // base64 or download URL
});

// Dummy product list
const products = ref([]);

// Columns for desktop table
const columns = [
  { name: "name", label: "Product", field: "name", align: "left" },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
  },
  {
    name: "price",
    label: "Price",
    field: "price",
    align: "right",
    format: (val) => `$${val}`,
  },
];

// Handle uploader
function handleImageUpload(files) {
  const reader = new FileReader();
  reader.onload = () => {
    form.value.image = reader.result;
  };
  reader.readAsDataURL(files[0]);
}

// Submit new product
function submitProduct() {
  if (!form.value.name || !form.value.price) {
    $q.notify({ type: "negative", message: "Name and Price are required" });
    return;
  }

  products.value.unshift({ ...form.value }); // add to top
  $q.notify({ type: "positive", message: "Product added" });

  // Clear form
  form.value = {
    name: "",
    description: "",
    price: 0,
    image: null,
  };
}
//---------------Update ------------------
</script>
