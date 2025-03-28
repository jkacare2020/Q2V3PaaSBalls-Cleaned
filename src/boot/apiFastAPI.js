// src/boot/apiFastAPI.js
import { boot } from "quasar/wrappers";
import axios from "axios";

const isProd = process.env.NODE_ENV === "production";

// Choose the correct URL based on environment, with fallback
const baseURL =
  process.env.VITE_FASTAPI_URL ||
  (isProd
    ? "https://q2v3paasballs-cleaned.onrender.com"
    : "http://127.0.0.1:8000");

console.log("🔗 FastAPI base URL:", baseURL);
console.log("🌍 NODE_ENV:", process.env.NODE_ENV);

const apiFastAPI = axios.create({
  baseURL,
});

export default boot(({ app }) => {
  app.config.globalProperties.$apiFastAPI = apiFastAPI;
});

export { apiFastAPI };
