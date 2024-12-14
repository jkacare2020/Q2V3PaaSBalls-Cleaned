// frontend/src/boot/axios.js

import { boot } from "quasar/wrappers";
import axios from "axios";
import { useStoreAuth } from "stores/storeAuth";

export default boot(async ({ app }) => {
  const storeAuth = useStoreAuth();

  // Create a new Axios instance
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
    timeout: 10000,
  });

  // Add a request interceptor to include JWT
  api.interceptors.request.use(
    async (config) => {
      if (storeAuth.user) {
        try {
          // Get the ID token from Firebase Auth
          const idToken = await storeAuth.user.getIdToken();
          config.headers.Authorization = `Bearer ${idToken}`;
        } catch (error) {
          console.error("Failed to get ID token:", error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Make the Axios instance available globally
  app.config.globalProperties.$api = api;
});

export { axios };
