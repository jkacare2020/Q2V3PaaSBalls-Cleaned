<template>
  <q-page class="constrain q-pa-md">
    <!-- left side post video box -->
    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingPosts && videos.length">
          <q-card
            v-for="video in videos"
            :key="video.id"
            class="card-post q-mb-md"
            bordered
            flat
          >
            <!-- Video Delete Icon -->
            <q-icon
              name="delete"
              color="red"
              class="delete-icon absolute"
              size="24px"
              aria-label="Delete video"
              @click="deleteVideo(video.id)"
              tabindex="0"
            />

            <q-item>
              <q-item-section avatar>
                <q-avatar>
                  <img :src="avatarUrl" :alt="username" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-bold">{{ username }}</q-item-label>
                <q-item-label caption>
                  {{ video.location }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <!-- Video Display -->
            <video controls class="full-width">
              <source :src="video.videoUrl" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <q-card-section>
              <div>{{ video.caption }}</div>
              <div class="text-caption text-grey">
                {{ niceDate(video.date) }}
              </div>

              <!--------------badge---------------->
              <q-badge
                v-if="video.tags?.includes('public')"
                label="Public"
                color="green"
                class="q-mt-sm"
                rounded
              />
              <q-badge
                v-else
                label="Private"
                color="grey"
                class="q-mt-sm"
                rounded
              />
              <q-badge
                v-if="video.userId === storeAuth.user?.uid"
                label="You"
                color="primary"
                class="q-ml-sm"
              />
              <q-card-actions align="right">
                <q-select
                  v-model="video.visibilityTag"
                  :options="['public', 'private']"
                  label="Visibility"
                  dense
                  emit-value
                  map-options
                  outlined
                  style="max-width: 140px"
                  @update:model-value="
                    (value) => updateVisibility(video.id, value)
                  "
                  :disable="video.userId !== storeAuth.user?.uid"
                />
              </q-card-actions>
            </q-card-section>
          </q-card>
        </template>
        <template v-else-if="!loadingPosts && !videos.length">
          <h5 class="text-center text-grey">No videos yet.</h5>
        </template>
        <template v-else>
          <!-- Skeleton Loading -->
          <q-card flat bordered>
            <q-item>
              <q-item-section avatar>
                <q-skeleton type="QAvatar" animation="fade" size="40px" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  <q-skeleton type="text" animation="fade" />
                </q-item-label>
                <q-item-label caption>
                  <q-skeleton type="text" animation="fade" />
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-skeleton height="200px" square animation="fade" />

            <q-card-section>
              <q-skeleton type="text" class="text-subtitle2" animation="fade" />
              <q-skeleton
                type="text"
                width="50%"
                class="text-subtitle2"
                animation="fade"
              />
            </q-card-section>
          </q-card>
        </template>
      </div>

      <!-- RIGHT: Presence + Comment input -->
      <div class="col-4 large-screen-only">
        <q-card class="q-pa-md">
          <!---------------------comments ------------------------>
          <q-list bordered class="q-mb-md" v-if="comments.length">
            <q-item v-for="(comment, idx) in comments" :key="comment.id || idx">
              <q-item-section avatar>
                <q-avatar size="32px">
                  <img :src="comment.avatarUrl || defaultAvatar" />
                  <q-badge
                    rounded
                    floating
                    :color="comment.online ? 'green' : 'red'"
                    class="presence-dot"
                  />
                </q-avatar>
              </q-item-section>

              <!-- Main text -->
              <q-item-section>
                <q-item-label class="text-bold">
                  {{ comment.userName || comment.displayName || "User" }}
                </q-item-label>

                <!-- 👇 Inline Edit Mode -->
                <div v-if="editingCommentId === comment.id">
                  <q-input
                    v-model="editedText"
                    dense
                    outlined
                    autogrow
                    autofocus
                    @keyup.enter="submitEditedComment(comment.id)"
                  />
                  <div class="q-mt-xs">
                    <q-btn
                      flat
                      dense
                      color="primary"
                      label="Save"
                      @click="submitEditedComment(comment.id)"
                    />
                    <q-btn
                      flat
                      dense
                      color="grey"
                      label="Cancel"
                      @click="editingCommentId = null"
                    />
                  </div>
                </div>

                <!-- 👇 Normal Display Mode -->
                <div v-else>
                  <q-item-label caption>{{ comment.text }}</q-item-label>
                  <q-item-label caption class="text-grey-6">
                    {{ new Date(comment.timestamp).toLocaleString() }}
                    <span v-if="comment.edited">(edited)</span>
                  </q-item-label>
                </div>
              </q-item-section>

              <!-- ⋯ Action menu -->
              <q-item-section
                side
                v-if="comment.userId === storeAuth.user?.uid"
              >
                <q-btn round dense flat icon="more_vert" color="primary">
                  <q-menu>
                    <q-list style="min-width: 120px">
                      <q-item
                        clickable
                        v-close-popup
                        @click="startEditingComment(comment)"
                      >
                        <q-item-section avatar
                          ><q-icon name="edit"
                        /></q-item-section>
                        <q-item-section>Edit</q-item-section>
                      </q-item>

                      <q-item
                        clickable
                        v-close-popup
                        @click="confirmDeleteComment(comment.id)"
                      >
                        <q-item-section avatar
                          ><q-icon name="delete"
                        /></q-item-section>
                        <q-item-section>Delete</q-item-section>
                      </q-item>

                      <q-item
                        clickable
                        v-close-popup
                        @click="toggleCommentOffline(comment)"
                      >
                        <q-item-section avatar>
                          <q-icon name="visibility_off" />
                        </q-item-section>
                        <q-item-section>
                          {{ comment.online ? "Set Offline" : "Go Online" }}
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </q-item-section>
            </q-item>
          </q-list>
          <!-------------------------------------------------------------------------------------->
          <div v-else class="text-caption q-mt-sm">❌ No comments yet.</div>
          <!-- Comment input -->
          <div class="q-mt-md">
            <q-input
              filled
              v-model="commentText"
              label="Leave a comment..."
              dense
              type="textarea"
              autogrow
              @keyup.enter="sendComment"
            />
            <q-btn
              class="q-mt-sm"
              label="Send"
              color="primary"
              @click="sendComment"
              :disable="!commentText"
            />
          </div>
        </q-card>
      </div>
    </div>

    <!-- Floating icon for small screens -->
    <q-page-sticky
      position="bottom-right"
      :offset="[18, 18]"
      class="q-mb-md q-mr-md small-screen-only"
    >
      <q-btn round color="primary" icon="chat" @click="handleCommentClick" />
    </q-page-sticky>
  </q-page>

  <q-dialog
    v-model="showCommentModal"
    persistent
    full-width
    full-height
    class="drawer-style"
  >
    <transition
      appear
      enter-active-class="animated fadeInUp"
      leave-active-class="animated fadeOutDown"
    >
      <q-card
        v-if="showCommentModal"
        class="full-width column no-wrap"
        style="border-top-left-radius: 20px; border-top-right-radius: 20px"
      >
        <!-- Header -->
        <q-bar class="bg-primary text-white">
          <div class="text-h6">Comments</div>
          <q-space />
          <q-btn dense flat icon="close" @click="showCommentModal = false" />
        </q-bar>

        <!-- Modal Comment Feed -->
        <q-scroll-area style="height: 60vh">
          <q-list>
            <q-item v-for="(comment, idx) in comments" :key="comment.id || idx">
              <!-- Avatar with dot -->
              <q-item-section avatar>
                <q-avatar size="32px">
                  <img :src="comment.avatarUrl || defaultAvatar" />
                  <q-badge
                    rounded
                    floating
                    :color="comment.online ? 'green' : 'red'"
                    class="presence-dot"
                  />
                </q-avatar>
              </q-item-section>

              <!-- Comment content -->
              <q-item-section>
                <q-item-label class="text-bold">
                  {{ comment.userName || comment.displayName || "User" }}
                </q-item-label>
                <!-- Timestamp -->
                <q-item-label caption class="text-grey-6">
                  {{ new Date(comment.timestamp).toLocaleString() }}
                </q-item-label>
                <q-item-label caption>
                  {{ comment.text }}
                </q-item-label>
              </q-item-section>

              <!-- Delete button (owner only) -->
              <q-item-section
                side
                v-if="comment.userId === storeAuth.user?.uid"
              >
                <q-btn
                  dense
                  flat
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click="confirmDeleteComment(comment.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>

        <!-- Modal Input Section -->
        <q-separator />
        <q-card-actions class="q-px-sm q-py-sm">
          <q-input
            ref="commentInputRef"
            v-model="commentText"
            placeholder="Leave a comment..."
            dense
            outlined
            class="col"
            @keyup.enter="sendComment"
          />
          <q-btn round color="primary" icon="send" @click="sendComment">
            <q-badge
              v-if="hasUnreadComments"
              color="red"
              floating
              rounded
              style="top: -6px; right: -6px"
            />
          </q-btn>
        </q-card-actions>
      </q-card>
    </transition>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

import { auth, dbRealtime, db } from "src/firebase/init";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

import { useStoreAuth } from "src/stores/storeAuth";
import { apiNode } from "boot/apiNode";
import {
  onValue,
  ref as dbRef,
  remove,
  set,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { watch } from "vue";
import { onAuthStateChanged } from "firebase/auth";
import defaultAvatar from "src/assets/avatar.png";
import { useRouter } from "vue-router";
import { nextTick } from "vue";
import { useQuasar } from "quasar";

const router = useRouter();
const storeAuth = useStoreAuth();

const onlineUsers = ref([]);
const comments = ref([]);
const commentText = ref("");
const postId = ref("global");
const posts = ref([]);
const editingCommentId = ref(null);
const editedText = ref("");
const allUserMap = ref({});
const videos = ref([]);
const username = ref(storeAuth.user?.displayName || "User Name");
const email = ref(storeAuth.user?.email || "user@example.com");

const loadingPosts = ref(false);
const showNotificationsBanner = ref(false);
const isAuthenticated = ref(false);

const avatarUrl = ref(defaultAvatar);

const $q = useQuasar();

//---------------------Modal open ---------------
function openActionSheet() {
  $q.bottomSheet({
    title: "Choose an action",
    actions: [
      { label: "Open Comments", icon: "chat", id: "reply" },
      { label: "Delete", icon: "delete", color: "negative", id: "delete" },
      { label: "Cancel", icon: "close", id: "cancel" },
    ],
  }).onOk((action) => {
    if (action.id === "reply") {
      showCommentModal.value = true; // Opens <q-dialog>
    } else if (action.id === "delete") {
      $q.notify({ type: "warning", message: "Feature coming soon!" });
    }
  });
}

function handleCommentClick() {
  console.log("FAB clicked");
  openActionSheet(); // ✅ Always run for testing
}
//--------------------Delete comment confirmation -----------
function confirmDeleteComment(commentId) {
  $q.dialog({
    title: "Delete comment?",
    message: "This action cannot be undone.",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    deleteComment(commentId);
  });
}

function deleteComment(commentId) {
  const commentRef = dbRef(dbRealtime, `comments/global/${commentId}`);
  remove(commentRef)
    .then(() => {
      $q.notify({
        type: "positive",
        message: "🗑️ Comment deleted",
        timeout: 2000,
        position: "top-right",
        icon: "check_circle",
      });
    })
    .catch((error) => {
      $q.notify({
        type: "negative",
        message: "❌ Could not delete comment",
        timeout: 2500,
        position: "top-right",
        icon: "error",
      });
      console.error("Failed to delete comment:", error);
    });
}

//---------------------------Presence--------------------------------------------
function initPresenceTracking() {
  if (!auth.currentUser) {
    console.warn("⚠️ No authenticated user for presence");
    return;
  }

  const userId = auth.currentUser.uid;
  const userStatusRef = dbRef(dbRealtime, `usersPresence/${userId}`);

  // Set the user online
  set(userStatusRef, {
    online: true,
    lastSeen: serverTimestamp(),
  });

  // Set the user offline when disconnected (auto-handled by Firebase)
  onDisconnect(userStatusRef).set({
    online: false,
    lastSeen: serverTimestamp(),
  });

  console.log("🟢 Presence tracking initialized for:", userId);
}
// ----------Fetch videos from backend---------
const getVideos = () => {
  if (!auth.currentUser) {
    console.warn("No authenticated user, skipping video retrieval.");
    return;
  }

  loadingPosts.value = true;

  auth.currentUser
    .getIdToken()
    .then((idToken) => {
      apiNode
        .get(`/api/videos`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        .then((response) => {
          videos.value = response.data;
          loadingPosts.value = false;
        })
        .catch((err) => {
          console.error("Error fetching videos:", err);
          $q.dialog({
            title: "Error",
            message: "Could not download videos.",
          });
          loadingPosts.value = false;
          // ✅ Process posts and add visibilityTag
          posts.value = response.data.map((post) => ({
            ...post,
            visibilityTag: video.tags?.includes("public")
              ? "public"
              : "private",
          }));
        })
        .catch((err) => {
          console.error("Error fetching posts:", err);
          $q.dialog({
            title: "Error",
            message: "Could not download posts.",
          });
          loadingPosts.value = false;
        });
    })
    .catch((error) => {
      console.error("Error getting ID token:", error);
      loadingPosts.value = false;
    });
};

// ---------- Delete video --------------------------
const deleteVideo = (videoId) => {
  console.log("Delete this Video triggered", videoId);
  auth.currentUser.getIdToken().then((idToken) => {
    apiNode
      .delete(`/api/videos/${videoId}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      })
      .then((response) => {
        console.log("Post deleted:", response);
        videos.value = videos.value.filter((video) => video.id !== videoId);
        $q.notify({
          type: "positive",
          message: "Video deleted successfully.",
        });
      })
      .catch((err) => {
        console.error("Error deleting video:", err);
        $q.dialog({
          title: "Error",
          message: "Could not delete video.",
        });
      });
  });
};

const niceDate = (value) => {
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
};
//---------------------------------fetch comments----------------------------------
function fetchComments(postId = "global") {
  console.log("📡 Fetching comments from DB...");

  const commentsRef = dbRef(dbRealtime, `comments/${postId}`);

  onValue(commentsRef, (snapshot) => {
    const data = snapshot.val();
    console.log("🪵 Raw snapshot:", data);

    if (data) {
      const parsed = Object.entries(data).map(([key, value]) => ({
        ...value,
        id: key,
      }));
      comments.value = parsed.sort((a, b) => b.timestamp - a.timestamp);
    } else {
      comments.value = [];
    }

    console.log("🧾 Parsed comments:", comments.value);

    // ✅ Auto-scroll to latest comment
    nextTick(() => {
      const scrollEl = document.querySelector(".q-scrollarea__container");
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
    });
  });
}

onMounted(() => {
  getVideos();
});

onMounted(() => {
  if (auth.currentUser) {
    initPresenceTracking();
  }
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("👤 Auth state changed:", user.uid);
      fetchUserData(user.uid);
      getVideos();
      fetchComments(); // ✅ called from here
      initPresenceTracking(); // 👈 make sure it's called here too
    }
  });
  if (auth.currentUser) {
    getVideos();
  }
});

onMounted(async () => {
  if (storeAuth.user) {
    username.value = storeAuth.user.displayName;
    email.value = storeAuth.user.email;
    isAuthenticated.value = true;

    // Fetch avatar from users collection's avatar subcollection
    try {
      const avatarCollectionRef = collection(
        db,
        `users/${storeAuth.user.uid}/avatar`
      );
      const avatarSnapshot = await getDocs(avatarCollectionRef);
      if (!avatarSnapshot.empty) {
        const avatarDoc = avatarSnapshot.docs[1]; // Assume there is only one avatar
        avatarUrl.value = avatarDoc.data().imageUrl;
      }
    } catch (error) {
      console.error("Error fetching avatar: ", error);
    }
  }
});

// Watch for storeAuth.user to be ready
watch(
  () => storeAuth.user,
  (newUser) => {
    if (newUser) {
      console.log("🟢 storeAuth.user is now available, calling fetchPresence");
      username.value = newUser.displayName || "User";
      email.value = newUser.email || "user@example.com";
      fetchPresence();
    }
  },
  { immediate: true }
);
//---------------------user Data------------------------------
async function fetchUserData(uid) {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      username.value = userData.displayName || "Guest";
      email.value = userData.email;
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
  }

  try {
    const avatarCollectionRef = collection(db, `users/${uid}/avatar`);
    const avatarSnapshot = await getDocs(avatarCollectionRef);
    if (!avatarSnapshot.empty) {
      const avatarDoc = avatarSnapshot.docs[0];
      avatarUrl.value = avatarDoc.data().imageUrl || defaultAvatar;
    }
  } catch (error) {
    console.error("Error fetching avatar: ", error);
  }
}
//--------------------user presence-----------------------------------
async function fetchPresence() {
  console.log("🚀 fetchPresence() called");

  const usersPresenceRef = dbRef(dbRealtime, "usersPresence");

  onValue(usersPresenceRef, async (snapshot) => {
    const presenceData = snapshot.val() || {};
    const newUserMap = {};

    const all = await Promise.all(
      Object.entries(presenceData).map(async ([userId, presence]) => {
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        let avatarUrl = "";
        try {
          const avatarSnap = await getDocs(
            collection(db, `users/${userId}/avatar`)
          );
          if (!avatarSnap.empty) {
            avatarUrl = avatarSnap.docs[0].data().imageUrl;
          }
        } catch (err) {
          console.warn(`⚠️ No avatar found for ${userId}`);
        }

        newUserMap[userId] = {
          userId,
          displayName: userData.displayName || "User",
          userName: userData.userName || "",
          email: userData.email || "",
          avatarUrl: avatarUrl,
          online: presence.online === true,
        };
      })
    );

    allUserMap.value = newUserMap;
    console.log("✅ allUserMap updated with presence:", newUserMap);
  });
}
//------------------------Send Comments----------------------------------------
async function sendComment() {
  const user = storeAuth.user; // ✅ Define this!
  if (!storeAuth.user || !commentText.value) return;

  // Check if the logged-in user has a username
  const userDoc = await getDoc(doc(db, "users", user.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};

  if (!userData.userName) {
    $q.notify({
      type: "warning",
      message: "Please set a username before commenting.",
      icon: "warning",
      position: "top",
    });

    setTimeout(() => {
      router.push("/profile"); // or your profile/edit page route
    }, 1500);
    return; // 🚫 Prevent comment from being sent
  }

  const token = await auth.currentUser.getIdToken();

  await apiNode.post(
    "/api/comments/add",
    {
      postId: postId.value,
      text: commentText.value,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  commentText.value = "";
}
//------------------------map-----------------------------
const userMap = computed(() => {
  const map = {};
  for (const user of onlineUsers.value) {
    map[user.userId] = user;
  }
  return map;
});
//------- Inline Edit ------------------------

function startEditingComment(comment) {
  editingCommentId.value = comment.id;
  editedText.value = comment.text;
}

//----------Submit--------------------------
async function submitEditedComment(commentId) {
  const token = await auth.currentUser.getIdToken();

  try {
    await apiNode.put(
      "/api/comments/update",
      {
        commentId,
        postId: "global", // or dynamic postId
        newText: editedText.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    $q.notify({ type: "positive", message: "✏️ Comment updated" });
    editingCommentId.value = null;
  } catch (err) {
    console.error("❌ Failed to update:", err);
    $q.notify({ type: "negative", message: "Update failed" });
  }
}

//------------------------------------------------
async function toggleCommentOffline(comment) {
  const token = await auth.currentUser.getIdToken();

  await apiNode.put(
    "/api/comments/update",
    {
      commentId: comment.id,
      postId: "global",
      newText: comment.text,
      online: !comment.online, // ✅ flip the boolean
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  // Optional instant UI update
  comment.online = !comment.online;
}

//---------------Video tag updateVisibility-------------------------------
async function updateVisibility(videoId, visibility) {
  const token = await auth.currentUser.getIdToken();
  try {
    await apiNode.put(
      "/api/videos/visibility",
      {
        videoId,
        makePublic: visibility === "public",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // 🔄 Update the post in local array
    const index = videos.value.findIndex((p) => p.id === videoId);
    if (index !== -1) {
      videos.value[index].visibilityTag = visibility;

      // Optionally update tags too ----------------------
      videos.value[index].tags =
        visibility === "public" ? ["public"] : ["private"];
    }
    $q.notify({ type: "positive", message: "Visibility updated" });
  } catch (err) {
    console.error("Failed to update visibility", err);
    $q.notify({ type: "negative", message: "Failed to update visibility" });
  }
}

//-----------------------------------------------

const showCommentModal = ref(false);
</script>

<style scoped lang="scss">
.delete-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  cursor: pointer;
  color: red;
}

.delete-icon:hover {
  color: blue !important;
}

.card-post {
  .q-img {
    min-height: 200px;
  }
}
.presence-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border: 2px solid white;
}
.q-dialog__inner--top {
  align-items: flex-end;
}
</style>
