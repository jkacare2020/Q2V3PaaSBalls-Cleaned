// import { boot } from "quasar/wrappers";
// import axios from "axios";

// console.log(
//   "🔗 FastAPI base URL:",
//   "https://q2v3paasballs-cleaned.onrender.com"
// );

// const apiFastAPI = axios.create({
//   baseURL: "https://q2v3paasballs-cleaned.onrender.com",
// });

// export default boot(({ app }) => {
//   app.config.globalProperties.$apiFastAPI = apiFastAPI;
// });

// export { apiFastAPI };
import { boot } from "quasar/wrappers";
import axios from "axios";

const baseURL = process.env.VUE_APP_FASTAPI_URL;

console.log("🔗 FastAPI base URL:", baseURL);

const apiFastAPI = axios.create({
  baseURL,
});

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("FASTAPI_URL in use:", process.env.VUE_APP_FASTAPI_URL);

export default boot(({ app }) => {
  app.config.globalProperties.$apiFastAPI = apiFastAPI;
});

export { apiFastAPI };
