/**
 * Centralized Axios API client for KSP Crime AI Platform.
 * Supports VITE_API_URL, dynamic JWT bearer attachment, auto token refresh,
 * and robust error handling (401, 403, 500, network error).
 */
import axios from "axios";

// Primary API Base URL from environment, with fallback to production Render backend
const rawUrl = import.meta.env.VITE_API_URL || "https://police-98i7.onrender.com";
export const API_BASE = rawUrl.replace(/\/+$/, ""); // Trim trailing slashes

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer Token dynamically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token Refresh & Global Error Handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry logic for logout or authentication endpoints to prevent infinite loops
    if (
      originalRequest?.url?.includes("/logout") ||
      originalRequest?.url?.includes("/login")
    ) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized: Attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (data.access_token) {
            localStorage.setItem("access_token", data.access_token);
            if (data.refresh_token) {
              localStorage.setItem("refresh_token", data.refresh_token);
            }
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          console.warn("Token refresh failed. Logging out user.", refreshErr);
          clearAuthStorage();
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
          return Promise.reject(refreshErr);
        }
      } else {
        clearAuthStorage();
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Permission denied for action:", originalRequest?.url);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status >= 500) {
      console.error("Server Error:", error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

/** Helper to clear all auth storage keys */
export const clearAuthStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("officer");
  localStorage.removeItem("role");
  localStorage.removeItem("permissions");
  localStorage.removeItem("station");
  localStorage.removeItem("rank");
  localStorage.removeItem("district");
};

export default api;