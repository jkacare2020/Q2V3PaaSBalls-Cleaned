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
          v-if="rolesLoaded && canEditProduct && !isEditingName"
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
          v-if="rolesLoaded && canEditProduct && !isEditingPrice"
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
        <div>
          <q-card v-if="postDetails">
            <q-card-section>
              <div class="text-h6">{{ postDetails.caption }}</div>
              <div class="text-subtitle2">By {{ postDetails.displayName }}</div>
            </q-card-section>
            <q-img :src="postDetails.imageUrl" v-if="postDetails.imageUrl" />
            <!-- More fields here -->
          </q-card>

          <q-skeleton v-else height="200px" />
        </div>
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
            v-if="rolesLoaded && canEditProduct && !isEditingDescription"
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
import { ref, computed, watch, watchEffect, onMounted } from "vue";
import { Platform, useQuasar } from "quasar";
import { useRoute } from "vue-router";
import { apiNode } from "boot/apiNode";
import { auth, db } from "src/firebase/init"; // ✅ import your initialized Firebase Auth
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const user = auth.currentUser; // ✅ Already initialized
const currentUserId = auth.currentUser?.uid;

const route = useRoute();

const postDetails = ref({
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  caption: "",
  displayName: "",
});

const productMongoId = ref(null);
//---------------------------------------
const form = ref({ name: "", description: "", price: 0, image: "" });
const products = ref([]);

const userRoles = ref([]);
const isLoadingRoles = ref(true);
const rolesLoaded = ref(false);

const isEditingDescription = ref(false);
const editedDescription = ref("");

const isEditingName = ref(false);
const isEditingPrice = ref(false);
const editedName = ref("");
const editedPrice = ref(0);

watch(userRoles, (val) => {
  console.log("👥 Loaded userRoles:", val);
});

const isMerchant = computed(() => userRoles.value.includes("merchant"));
const isAdmin = computed(() => userRoles.value.includes("admin"));
// const canEditProduct = computed(() => isMerchant.value || isAdmin.value);

const isOwner = computed(() => postDetails.value.userId === currentUserId);

const canEditProduct = computed(
  () => isOwner.value || isMerchant.value || isAdmin.value
);
//------------------------------------------------------------------------

watchEffect(() => {
  console.log("🧠 postDetails loaded:", postDetails.value);
  console.log("✏️ canEditProduct:", canEditProduct.value);
});
//--------------------------------

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
onMounted(() => {
  const postId = route.params.postId;
  if (!postId) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("User is not authenticated");
      return;
    }

    try {
      const token = await user.getIdToken();

      const res = await apiNode.post(
        `/api/products/import-from-post/${postId}`,
        {}, // empty body
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data;
      form.value.name = data.name || "";
      form.value.description = data.description || "";
      form.value.price = data.price || 0;
      form.value.image = data.imageUrl || "";
      productMongoId.value = data._id;
      products.value.unshift(data);

      await fetchProductDetails();
    } catch (err) {
      console.error("❌ Failed to import post as product:", err);
    }
  });
});

//-------------------------------------
const fetchUserRoles = async () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const userSnap = await getDoc(doc(db, "users", user.uid));
    if (userSnap.exists()) {
      userRoles.value = userSnap.data().role || [];
      rolesLoaded.value = true; // ✅ mark as ready
    }
  });
};
onMounted(fetchUserRoles);
//-----------------------------------------------------
onMounted(() => {
  const postId = route.params.postId;
  if (!postId) return;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      console.warn("User is not authenticated");
      return;
    }

    try {
      const token = await user.getIdToken();

      const res = await apiNode.post(
        `/api/products/import-from-post/${postId}`,
        {}, // ✅ required body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = res.data;
      form.value.name = data.name || "";
      form.value.description = data.description || "";
      form.value.price = data.price || 0;
      form.value.image = data.imageUrl || "";
      productMongoId.value = data._id;
      products.value.unshift(data);
      await fetchProductDetails?.();
    } catch (err) {
      console.error("❌ Failed to import post as product:", err);
      $q.notify({ type: "negative", message: "Failed to import product." });
    }
  });
});

const $q = useQuasar();
const isMobile = Platform.is.mobile;

const defaultImage = "https://via.placeholder.com/400x200?text=No+Image";

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
