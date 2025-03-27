import { boot } from "quasar/wrappers";
import axios from "axios";

const nodeApiBaseURL =
  process.env.NODE_ENV === "production"
    ? process.env.VUE_APP_API_PRODUCTION ||
      "https://quasargram-jason-backend-2024-98f0d3ac8c4a.herokuapp.com"
    : process.env.VUE_APP_API_LOCAL || "http://localhost:3000";

console.log("🧠 Node API base URL:", nodeApiBaseURL);

const apiNode = axios.create({
  baseURL: nodeApiBaseURL,
});

export default boot(({ app }) => {
  app.config.globalProperties.$apiNode = apiNode;
});

export { apiNode, nodeApiBaseURL };
