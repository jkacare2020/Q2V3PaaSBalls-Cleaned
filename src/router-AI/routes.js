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
      { path: "/photo", component: () => import("pages/PageHome.vue") },
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
        path: "/mongo-transacts",
        component: () => import("pages/PageMongoTrans.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/mongo-users",
        component: () => import("pages/PageMongoUsers.vue"),
        meta: { requiresAuth: true },
      },

      // New AI Functionality Routes
      {
        path: "/ai/image-processing",
        component: () => import("pages/ImageProcessing.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/ai/video-processing",
        component: () => import("pages/VideoProcessing.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/ai/voice-recognition",
        component: () => import("pages/VoiceRecognition.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "/ai/model-training",
        component: () => import("pages/ModelTraining.vue"),
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
