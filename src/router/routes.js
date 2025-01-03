import { useStoreUsers } from "src/stores/storeUsers";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("pages/PageEntries.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "settings",
        component: () => import("pages/PageSettings.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/login",
        component: () => import("pages/Login.vue"),
      },
      {
        path: "/signup",
        component: () => import("pages/Signup.vue"),
      },
      {
        path: "/profile/:id?",
        component: () => import("pages/UserProfile.vue"),
        meta: { requiresAuth: true },
        name: "UserProfile",
      },
      {
        path: "/camera",
        component: () => import("pages/PageCamera.vue"),
        meta: { requiresAuth: true },
        name: "Camera",
      },
      {
        path: "/videoCamera",
        component: () => import("pages/PageVideoCam.vue"),
        meta: { requiresAuth: true },
        name: "VideoCamera",
      },
      {
        path: "/video-posts",
        component: () => import("pages/PageVideoView.vue"),
        meta: { requiresAuth: true },
        name: "VideoPost",
      },
      {
        path: "/audio-posts",
        component: () => import("pages/PageAudioView.vue"),
        meta: { requiresAuth: true },
        name: "audioPost",
      },

      { path: "/photos", component: () => import("pages/PageHome.vue") },
      { path: "/videos", component: () => import("pages/PageVideoView.vue") },
      {
        path: "/audios",
        component: () => import("pages/PageAudio.vue"),
      },
      {
        path: "/users",
        component: () => import("pages/ViewUsersList.vue"),
        meta: { requiresAuth: true },
        async beforeEnter(to, from, next) {
          const storeUsers = useStoreUsers();

          // Ensure user data is loaded before making access control decisions
          if (!storeUsers.userLoaded) {
            await storeUsers.init();
          }

          if (storeUsers.user?.role === "admin") {
            next(); // Allow access if the user is an admin
          } else {
            next("/profile"); // Redirect to profile or another appropriate page if not admin
          }
        },
      },
      {
        path: "/mongo-users",
        component: () => import("pages/PageMongoUsers.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/mongo-transacts",
        component: () => import("pages/PageMongoTran.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/mongo-AllTransacts",
        component: () => import("pages/PageMongoAllTransacts.vue"),
        meta: { requiresAuth: true },
      },

      {
        path: "/view-transaction/:transactId",
        component: () => import("pages/ViewTransact.vue"),
        meta: { requiresAuth: true },
      },

      // Route for creating a new transaction
      {
        path: "/new-transaction",
        component: () => import("pages/RetieveTranHistory.vue"),
        meta: { requiresAuth: true },
      },
      // Route for creating a new transaction
      {
        path: "/CartPage",
        name: "CartPage",
        component: () => import("pages/NewTransactionCart.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },

  // Always leave this as the last one,
  // This handles routes that don't match any defined routes
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
