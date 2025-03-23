// src/services/api.js
import axios from "axios";
import router from "../router"; // 确保已正确配置路由实例

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000,
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器（仅处理逻辑错误）
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.detail?.code;
    const message = error.response?.data?.detail?.message || error.message;

    // 创建标准化错误对象
    const normalizedError = {
      code: code || "UNKNOWN_ERROR",
      message,
      status,
      raw: error,
    };

    // 特殊状态码处理
    if (status === 401) {
      router.push("/login"); // 仅处理路由跳转
    }

    return Promise.reject(normalizedError); // 传递结构化错误
  }
);

export default api;
