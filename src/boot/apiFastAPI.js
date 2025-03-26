import { boot } from "quasar/wrappers";
import axios from "axios";

// ✅ Use environment variable instead of hardcoded localhost
const apiFastAPI = axios.create({
  baseURL: process.env.VUE_APP_FASTAPI_URL || "http://127.0.0.1:8000",
});

export default boot(({ app }) => {
  app.config.globalProperties.$apiFastAPI = apiFastAPI;
});

export { apiFastAPI };
