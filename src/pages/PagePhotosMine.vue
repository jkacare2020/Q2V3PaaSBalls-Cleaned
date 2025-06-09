<template>
  <q-page padding>
    <h4>My Posts</h4>

    <div class="row q-col-gutter-md">
      <q-card
        v-for="post in myPosts"
        :key="post.id"
        class="q-mb-md relative-position col-12 col-sm-6 col-md-4"
      >
        <!-- 🖼️ Image -->
        <q-img :src="post.imageUrl" :alt="post.caption" height="600px" />

        <!-- ✅ Checkmark selection overlay -->
        <q-btn
          round
          dense
          size="sm"
          icon="check_circle"
          :color="selectedPostIds.includes(post.id) ? 'primary' : 'grey-5'"
          class="absolute-top-right q-mt-sm q-mr-sm"
          @click="toggleSelection(post.id)"
        >
          <q-tooltip>Toggle Select</q-tooltip>
        </q-btn>

        <q-card-section>
          <div class="text-h6">{{ post.caption }}</div>
          <div class="text-subtitle2 text-grey">{{ post.location }}</div>
        </q-card-section>
      </q-card>
    </div>

    <q-dialog v-model="showGrantDialog" persistent>
      <q-card style="min-width: 300px; max-width: 400px">
        <q-card-section>
          <div class="text-h6">Grant Access to Client</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="clientEmail"
            label="Client Email"
            type="email"
            dense
            outlined
          />
          <q-input
            v-model="clientPhone"
            label="Client Phone"
            dense
            outlined
            class="q-mt-sm"
          />

          <q-input
            v-model="accessPasscode"
            label="Access Passcode"
            dense
            outlined
            class="q-mt-sm"
            :hint="'Auto-generated or manually edit'"
            :rules="[(val) => !!val || 'Required']"
          >
            <template v-slot:append>
              <q-btn flat icon="refresh" @click="generatePasscode" size="sm">
                <q-tooltip>Regenerate</q-tooltip>
              </q-btn>
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn
            label="Grant Access"
            color="primary"
            @click="submitGrantAccessBatch"
            :disable="!clientEmail || !accessPasscode"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ✅ Grant Access Button -->
    <q-btn
      label="Grant Access to Selected"
      color="primary"
      icon="send"
      class="q-mt-lg"
      :disable="!selectedPostIds?.length"
      @click="openGrantAccessDialog"
    />
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "src/firebase/init";
import { apiNode } from "boot/apiNode";
import { useQuasar } from "quasar";

const $q = useQuasar();

const showGrantDialog = ref(false);
const clientEmail = ref("");
const clientPhone = ref("");
const accessPasscode = ref("");
const selectedPostIds = ref([]); // ✅ Always initialize with an empty array

const myPosts = ref([]);

function fetchPrivatePosts(uid) {
  apiNode
    .get("/api/posts/mine", {
      headers: {
        Authorization: `Bearer ${
          auth.currentUser && auth.currentUser.getIdToken()
        }`,
      },
    })
    .then((res) => {
      myPosts.value = res.data;
    })
    .catch((err) => {
      console.error("Failed to fetch posts", err);
    });
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("👤 Auth state changed:", user.uid);
      await fetchPrivatePosts(user.uid);
    }
  });
});
function openGrantAccessDialog() {
  generatePasscode(); // auto-fill
  showGrantDialog.value = true;
}

function generatePasscode() {
  const shortId = Math.random().toString(36).substring(2, 6);
  const user = auth.currentUser;
  accessPasscode.value = `${user?.displayName || "merchant"}-${shortId}`;
}
//-----------------------------------------------------------

const toggleSelection = (postId) => {
  const index = selectedPostIds.value.indexOf(postId);
  if (index === -1) {
    selectedPostIds.value.push(postId);
  } else {
    selectedPostIds.value.splice(index, 1);
  }
};

async function submitGrantAccessBatch() {
  try {
    const user = auth.currentUser;
    const token = await user.getIdToken();

    // Step 1: Import selected posts into MongoDB
    for (const postId of selectedPostIds.value) {
      await apiNode.post(
        `/api/products/import-from-post/${postId}`,
        {
          email: clientEmail.value,
          phone: clientPhone.value,
          passcode: accessPasscode.value,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }

    // Step 2: Grant private access to all selected posts
    await apiNode.post(
      "/api/products/grant-batch",
      {
        postIds: selectedPostIds.value,
        email: clientEmail.value,
        phone: clientPhone.value,
        passcode: accessPasscode.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    $q.notify({ type: "positive", message: "Access granted successfully!" });
    showGrantDialog.value = false;
    selectedPostIds.value = [];
  } catch (err) {
    console.error("❌ Grant batch error:", err);
    $q.notify({ type: "negative", message: "Failed to grant access." });
  }
}
</script>
