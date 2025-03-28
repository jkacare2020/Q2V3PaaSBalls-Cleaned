//--aipNode.js ----
import { boot } from "quasar/wrappers";
import axios from "axios";

const nodeApiBaseURL =
  process.env.NODE_ENV === "production"
    ? process.env.VITE_API_PRODUCTION ||
      "https://q2v3paasapp2025-42f2077366f9.herokuapp.com"
    : process.env.VITE_API_LOCAL || "http://localhost:3000";

console.log("🧠 Node API base URL:", nodeApiBaseURL);

const apiNode = axios.create({
  baseURL: nodeApiBaseURL,
});

export default boot(({ app }) => {
  app.config.globalProperties.$apiNode = apiNode;
});

export { apiNode, nodeApiBaseURL };
