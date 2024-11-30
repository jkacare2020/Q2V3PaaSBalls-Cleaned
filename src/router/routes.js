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
