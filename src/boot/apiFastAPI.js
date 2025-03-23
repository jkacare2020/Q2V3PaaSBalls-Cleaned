import { boot } from "quasar/wrappers";
import axios from "axios";

const apiFastAPI = axios.create({
  baseURL: "http://127.0.0.1:8000", // Adjust as needed
});

export default boot(({ app }) => {
  app.config.globalProperties.$apiFastAPI = apiFastAPI;
});

export { apiFastAPI };
