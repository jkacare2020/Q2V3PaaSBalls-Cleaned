import { createRouter, createWebHashHistory } from "vue-router";
import routes from "./routes";
import { useStoreAuth } from "src/stores/storeAuth";
import { useStoreUsers } from "src/stores/storeUsers";

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Global Navigation Guard for Authentication
router.beforeEach(async (to, from, next) => {
  const storeAuth = useStoreAuth();
  const storeUsers = useStoreUsers();

  // Check if the route requires authentication
  if (to.meta.requiresAuth) {
    // Ensure the user is authenticated
    const isAuthenticated = storeAuth.user !== null;

    if (!isAuthenticated) {
      // If not authenticated, redirect to the login page
      return next("/login");
    } else {
      // If the user is authenticated, load the user data if necessary
      if (!storeUsers.userLoaded) {
        await storeUsers.init();
      }
    }
  }

  // Check for admin access if trying to access the /users route
  if (to.path === "/users" && storeUsers.user.role !== "admin") {
    return next("/profile"); // Redirect non-admin users to their profile
  }

  next(); // Proceed with the navigation
});

export default router;
