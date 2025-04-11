<template>
  <q-page class="constrain q-pa-md">
    <transition
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div
        v-if="showNotificationsBanner && pushNotificationsSupported"
        class="banner-container bg-primary"
      >
        <div class="constrain">
          <q-banner class="bg-grey-3 q-mb-md">
            <template v-slot:avatar>
              <q-icon name="eva-bell-outline" color="primary" />
            </template>
            Would you like to enable notifications?
            <template v-slot:action>
              <q-btn
                @click="enableNotifications"
                label="Yes"
                color="primary"
                class="q-px-sm"
                dense
                flat
              />
              <q-btn
                @click="showNotificationsBanner = false"
                label="Later"
                color="primary"
                class="q-px-sm"
                dense
                flat
              />
              <q-btn
                @click="neverShowNotificationsBanner"
                label="Never"
                color="primary"
                class="q-px-sm"
                dense
                flat
              />
            </template>
          </q-banner>
        </div>
      </div>
    </transition>

    <div class="row q-col-gutter-lg">
      <div class="col-12 col-sm-8">
        <template v-if="!loadingPosts && posts.length">
          <q-card
            v-for="post in posts"
            :key="post.id"
            class="card-post q-mb-md"
            flat
            bordered
          >
            <q-item>
              <q-item-section avatar>
                <q-avatar>
                  <img
                    :src="getUserData(post.userId)?.avatarUrl || defaultAvatar"
                  />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-bold">{{
                  getUserData(post.userId)?.displayName
                }}</q-item-label>
                <q-item-label caption>{{
                  post.location || "Unknown Location"
                }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />
            <q-img :src="post.imageUrl" :alt="post.caption" />
            <q-card-section>
              <div>{{ post.caption }}</div>
              <div class="text-caption text-grey">
                {{ new Date(post.date).toLocaleString() }}
              </div>
            </q-card-section>
          </q-card>
        </template>

        <template v-else-if="!loadingPosts && !posts.length">
          <div class="text-center text-grey">No posts available.</div>
        </template>

        <template v-else>
          <q-spinner color="primary" />
        </template>
      </div>

      <div class="col-4 large-screen-only">
        <q-card class="q-pa-md">
          <q-item v-for="user in onlineUsers" :key="user.userId">
            <q-item-section avatar>
              <q-avatar size="40px">
                <img
                  :src="user.avatarUrl || defaultAvatar"
                  :alt="user.displayName"
                />
                <q-badge
                  rounded
                  floating
                  :color="user.online ? 'green' : 'red'"
                  class="presence-dot"
                />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-bold">
                {{ user.displayName }}
              </q-item-label>
              <q-item-label caption>
                {{ user.email }}
              </q-item-label>

              <!-- 🔍 DEBUG LINE -->
              <q-item-label caption> Online: {{ user.online }} </q-item-label>
            </q-item-section>
          </q-item>

          <q-list bordered class="q-mb-md" v-if="comments.length">
            <q-item v-for="(comment, idx) in comments" :key="comment.id || idx">
              <q-item-section avatar>
                <q-avatar size="32px">
                  <img
                    :src="
                      getUserData(comment.userId).avatarUrl || defaultAvatar
                    "
                  />
                  <q-badge
                    rounded
                    floating
                    :color="
                      getUserData(comment.userId).online ? 'green' : 'red'
                    "
                    class="presence-dot"
                  />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-bold">
                  {{ getUserData(comment.userId).displayName }}
                </q-item-label>
                <q-item-label caption>{{ comment.text }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

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

      <q-page-sticky
        position="bottom-right"
        :offset="[18, 18]"
        class="q-mb-md q-mr-md small-screen-only"
      >
        <q-btn
          round
          color="primary"
          icon="chat"
          @click="$router.push('/comments')"
        />
      </q-page-sticky>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { auth, dbRealtime, db } from "src/firebase/init";
import { onValue, ref as dbRef } from "firebase/database";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { apiNode } from "boot/apiNode";
import { useStoreAuth } from "src/stores/storeAuth";
import defaultAvatar from "src/assets/avatar.png";

// Avatar fallback logic
const finalAvatarUrl = computed(() => userAvatar.value || defaultAvatar);
const storeAuth = useStoreAuth();
const posts = ref([]);
const loadingPosts = ref(false);
const onlineUsers = ref([]);
const comments = ref([]);
const commentText = ref("");
const postId = ref("global");
const allUserMap = ref({});
const showNotificationsBanner = ref(false);

function getPosts() {
  if (!auth.currentUser) return;
  loadingPosts.value = true;
  auth.currentUser.getIdToken().then((token) => {
    apiNode
      .get("/api/posts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        posts.value = res.data;
        loadingPosts.value = false;
      })
      .catch((err) => {
        console.error("Error fetching posts:", err);
        loadingPosts.value = false;
      });
  });
}

function fetchPresence() {
  const usersPresenceRef = dbRef(dbRealtime, "usersPresence");
  onValue(usersPresenceRef, async (snapshot) => {
    const presenceData = snapshot.val() || {};
    const updatedMap = { ...allUserMap.value };
    for (const [userId, presence] of Object.entries(presenceData)) {
      if (!updatedMap[userId]) {
        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.exists() ? userDoc.data() : {};

        let avatar = defaultAvatar;
        try {
          console.log("👤 Loading avatar for:", userId);
          const avatarCollectionRef = collection(db, `users/${userId}/avatar`);
          const avatarSnapshot = await getDocs(avatarCollectionRef);

          if (!avatarSnapshot.empty) {
            const avatarDoc = avatarSnapshot.docs[0];
            const avatarData = avatarDoc.data();
            avatar = avatarData.imageUrl || defaultAvatar;
            console.log("✅ Avatar loaded for", userId, "→", avatar);
          } else {
            console.warn("⚠️ No avatar document found for", userId);
          }
        } catch (err) {
          console.error(
            "❌ Error loading avatar from Firestore for",
            userId,
            err
          );
        }

        updatedMap[userId] = {
          userId,
          displayName: userData.displayName || "User",
          email: userData.email || "",
          avatarUrl: avatar,
          online: presence.online,
        };
      } else {
        updatedMap[userId].online = presence.online;
        console.log("🧠 Avatar assigned:", updatedMap[userId].avatarUrl);
      }
    }
    allUserMap.value = updatedMap;
    onlineUsers.value = Object.values(updatedMap);
  });
}

function fetchComments() {
  const commentsRef = dbRef(dbRealtime, `comments/global`);
  onValue(commentsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      comments.value = Object.entries(data)
        .map(([id, value]) => ({ ...value, id }))
        .sort((a, b) => b.timestamp - a.timestamp);
    } else {
      comments.value = [];
    }
  });
}

async function sendComment() {
  if (!storeAuth.user || !commentText.value) return;
  const token = await auth.currentUser.getIdToken();
  await apiNode.post(
    "/api/comments/add",
    { postId: postId.value, text: commentText.value },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  commentText.value = "";
}

function getUserData(userId) {
  return (
    allUserMap.value[userId] || {
      displayName: "User",
      avatarUrl: defaultAvatar,
      online: false,
    }
  );
}

onMounted(() => {
  getPosts();
  fetchComments();
});

watch(
  () => storeAuth.user,
  (user) => {
    if (user) {
      fetchPresence();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.presence-dot {
  bottom: 0;
  right: 0;
  border: 2px solid white;
}

.card-post .q-img {
  min-height: 200px;
}

.small-screen-only {
  display: none;
}

@media screen and (max-width: 1024px) {
  .large-screen-only {
    display: none !important;
  }
  .small-screen-only {
    display: block !important;
  }
}
</style>
