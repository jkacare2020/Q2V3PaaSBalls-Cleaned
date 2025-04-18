<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-md">
      <q-toolbar class="bg-grey-2 text-primary">
        <q-toolbar-title> 💬 Replies to Comment </q-toolbar-title>
        <q-btn flat round dense icon="close" @click="$router.go(-1)" />
      </q-toolbar>

      <!-- Debug info if root comment fails -->
      <div v-if="!rootComment" class="text-negative q-mt-md">
        ⚠️ Root comment not found or loading failed.
      </div>

      <!-- Main Comment Thread -->
      <CommentItem
        v-if="rootComment"
        :comment="rootComment"
        :repliesByCommentId="repliesByCommentId"
        :level="0"
      />

      <!-- Reply input -->
      <q-input
        v-model="replyText"
        type="textarea"
        label="Write a reply..."
        autogrow
        outlined
        class="q-mt-md"
      />
      <q-btn
        label="Reply"
        color="primary"
        class="q-mt-sm"
        @click="submitReply"
      />
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { dbRealtime } from "src/firebase/init";
import { ref as dbRef, onValue, push } from "firebase/database";
import { useStoreAuth } from "src/stores/storeAuth";
import CommentItem from "src/components/CommentItem.vue";
import { useQuasar } from "quasar";

import defaultAvatar from "src/assets/avatar.png";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "src/firebase/init";

const avatarUrl = ref(defaultAvatar);
const username = ref("User");
const email = ref("");

const route = useRoute();
const $q = useQuasar();
const storeAuth = useStoreAuth();

const postId = route.params.postId;
const rootCommentId = route.params.commentId;

const comments = ref([]);
const replyText = ref("");
const rootComment = ref(null);

async function fetchUserData(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      username.value = userData.displayName || "Guest";
      email.value = userData.email || "";
      if (storeAuth.user) {
        storeAuth.user.displayName = userData.displayName;
        storeAuth.user.userName = userData.userName;
      }
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
  }

  try {
    const avatarCollectionRef = collection(db, `users/${uid}/avatar`);
    const avatarSnapshot = await getDocs(avatarCollectionRef);
    if (!avatarSnapshot.empty) {
      const url = avatarSnapshot.docs[0].data().imageUrl || defaultAvatar;
      avatarUrl.value = url;
      if (storeAuth.user) {
        storeAuth.user.avatarUrl = url;
      }
    } else {
      avatarUrl.value = defaultAvatar;
    }
  } catch (error) {
    console.error("Error fetching avatar: ", error);
    avatarUrl.value = defaultAvatar;
  }
}

async function fetchComments() {
  const commentsRef = dbRef(dbRealtime, `comments/${postId}`);
  onValue(
    commentsRef,
    async (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      await Promise.all(
        parsed.map(async (comment) => {
          if (!comment.avatarUrl || comment.avatarUrl === "") {
            try {
              const avatarCollectionRef = collection(
                db,
                `users/${comment.userId}/avatar`
              );
              const avatarSnapshot = await getDocs(avatarCollectionRef);
              if (!avatarSnapshot.empty) {
                comment.avatarUrl =
                  avatarSnapshot.docs[0].data().imageUrl || defaultAvatar;
              } else {
                comment.avatarUrl = defaultAvatar;
              }
            } catch (err) {
              console.warn(`Could not fetch avatar for ${comment.userId}`);
              comment.avatarUrl = defaultAvatar;
            }
          }
        })
      );

      comments.value = parsed;

      const targetComment = parsed.find((c) => c.id === rootCommentId);
      if (targetComment) {
        rootComment.value = targetComment.replyTo
          ? parsed.find((c) => c.id === targetComment.replyTo)
          : targetComment;
      } else {
        console.warn("⚠️ Comment ID not found:", rootCommentId);
      }
    },
    (error) => {
      console.error("🚨 Firebase onValue error:", error);
    }
  );
}

onMounted(async () => {
  await fetchComments();
  if (storeAuth.user?.uid) {
    await fetchUserData(storeAuth.user.uid);
  }
});

const repliesByCommentId = computed(() => {
  const grouped = {};
  for (const comment of comments.value) {
    if (comment.replyTo) {
      if (!grouped[comment.replyTo]) grouped[comment.replyTo] = [];
      grouped[comment.replyTo].push(comment);
    }
  }
  return grouped;
});

async function submitReply() {
  if (!replyText.value.trim()) return;

  const user = storeAuth.user;
  await fetchUserData(user.uid);

  const newComment = {
    text: replyText.value,
    timestamp: Date.now(),
    userId: user?.uid || "unknown",
    userName: user?.userName || user?.displayName || "Anonymous",
    displayName: user?.displayName || "User",
    avatarUrl: user?.avatarUrl || avatarUrl.value || defaultAvatar,
    online: true,
    replyTo: rootCommentId,
    postId,
  };

  const commentRef = dbRef(dbRealtime, `comments/${postId}`);
  push(commentRef, newComment)
    .then(() => {
      replyText.value = "";
      $q.notify({ message: "Reply added", type: "positive" });
    })
    .catch((err) => {
      console.error("🔥 Failed to push reply:", err);
      $q.notify({ message: "Failed to add reply.", type: "negative" });
    });
}
</script>

<style scoped>
.q-page {
  max-width: 800px;
  margin: auto;
}
</style>
