const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", component: () => import("pages/PageEntries.vue") },
      { path: "settings", component: () => import("pages/PageSettings.vue") },
      {
        path: "/profile",
        component: () => import("pages/UserProfile.vue"),
        meta: { requiresAuth: true },
      },
      { path: "/login", component: () => import("pages/Login.vue") },
      { path: "/signup", component: () => import("pages/Signup.vue") },
      { path: "/users", component: () => import("pages/ViewUsersList.vue") },
      { path: "/profile", component: () => import("pages/UserProfile.vue") },
      {
        path: "/profile/:id",
        component: () => import("pages/UserProfile.vue"),
        name: "UserProfile",
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
