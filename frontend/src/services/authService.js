/**
 * Authentication service — wraps API calls for login, logout, token management.
 * Stores tokens in localStorage (secure httpOnly cookies in production).
 */
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        }
      } catch {
        authService.logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

const authService = {
  async login(email, password, rememberMe = false) {
    const { data } = await api.post("/api/auth/login", {
      email,
      password,
      remember_me: rememberMe,
    });
    localStorage.setItem("access_token", data.tokens.access_token);
    localStorage.setItem("refresh_token", data.tokens.refresh_token);
    localStorage.setItem("officer", JSON.stringify(data.officer));
    return data;
  },

  async logout() {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {}
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("officer");
  },

  async getProfile() {
    const { data } = await api.get("/api/auth/profile");
    return data;
  },

  async refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token");
    const { data } = await api.post("/api/auth/refresh", {
      refresh_token: refreshToken,
    });
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data;
  },

  getCurrentOfficer() {
    try {
      const stored = localStorage.getItem("officer");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  },

  getToken() {
    return localStorage.getItem("access_token");
  },
};

export { api };
export default authService;
