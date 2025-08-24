// src/api.js
import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000/api";
const api = axios.create({ baseURL });

// 1) Request: Bearer lagao
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // cookies ki zarurat nahi:
  config.withCredentials = false;
  return config;
});

// 2) Response: 401 handle (but skip on auth endpoints)
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;
    const url = (original.url || "");

    // 👉 Auth endpoints pe bypass (UI ko error dikhane do)
    const skip401 =
      url.includes("/auth/login/") ||
      url.includes("/auth/register/") ||
      url.includes("/auth/verify-email/") ||
      url.includes("/auth/resend-verification/");

    if (status === 401 && !original.__isRetry && !skip401) {
      original.__isRetry = true;
      const refresh = localStorage.getItem("refresh");
      if (refresh) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/token/refresh/`, { refresh });
          localStorage.setItem("access", data.access);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (refreshError) {
          console.log("Refresh token failed:", refreshError);
        }
      }
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      // sirf non-auth calls par hi redirect
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;