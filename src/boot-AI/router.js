import { boot } from "quasar/wrappers";
import router from "../router";
import { useStoreAuth } from "src/stores/storeAuth";
import { watch } from "vue";

export default boot(({ app }) => {
  app.use(router);

  router.beforeEach(async (to, from, next) => {
    const authStore = useStoreAuth();

    console.log("Auth Store State (before init):", authStore);

    if (!authStore.ready) {
      console.log("Auth store is not ready. Initializing...");
      await authStore.init();
    }

    console.log("Auth Store State (after init):", authStore);
    console.log("Navigating to:", to.path);
    console.log("Requires Auth:", to.meta.requiresAuth);
    console.log("Is Authenticated:", authStore.isAuthenticated);

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      console.warn("Redirecting to login...");
      next("/login");
    } else {
      next();
    }
  });
});
