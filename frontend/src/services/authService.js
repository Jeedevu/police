/**
 * Authentication service — handles login, logout, token management, and local storage state.
 */
import api, { clearAuthStorage } from "./api";

const authService = {
  /**
   * Log in officer and store authentication details.
   */
  async login(email, password, rememberMe = false) {
    const { data } = await api.post("/api/auth/login", {
      email,
      password,
      remember_me: rememberMe,
    });

    const officer = data.officer || {};
    const tokens = data.tokens || {};

    if (tokens.access_token) {
      localStorage.setItem("access_token", tokens.access_token);
    }
    if (tokens.refresh_token) {
      localStorage.setItem("refresh_token", tokens.refresh_token);
    }

    localStorage.setItem("officer", JSON.stringify(officer));
    localStorage.setItem("role", officer.role || "Constable");
    localStorage.setItem("rank", officer.role || "Constable");
    localStorage.setItem("station", officer.unit_id ? `Station ${officer.unit_id}` : "HQ");
    localStorage.setItem("district", officer.district_id ? `District ${officer.district_id}` : "State");

    // Assign permission set based on officer role
    const permissions = this.getRolePermissions(officer.role);
    localStorage.setItem("permissions", JSON.stringify(permissions));

    return data;
  },

  /**
   * Log out officer cleanly.
   * Clears storage immediately, then attempts background API notification.
   */
  async logout() {
    try {
      await api.post("/api/auth/logout", {}, { _retry: true });
    } catch (err) {
      // Ignore network / token errors during logout
    } finally {
      clearAuthStorage();
    }
  },

  /** Fetch officer profile details */
  async getProfile() {
    const { data } = await api.get("/api/auth/profile");
    return data;
  },

  /** Refresh access token */
  async refreshToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    const { data } = await api.post("/api/auth/refresh", {
      refresh_token: refreshToken,
    });

    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return data;
  },

  /** Return currently stored officer details */
  getCurrentOfficer() {
    try {
      const stored = localStorage.getItem("officer");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /** Return stored officer role */
  getRole() {
    return localStorage.getItem("role") || "Constable";
  },

  /** Return stored permissions list */
  getPermissions() {
    try {
      const stored = localStorage.getItem("permissions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /** Check if currently authenticated */
  isAuthenticated() {
    return !!localStorage.getItem("access_token");
  },

  /** Return Bearer token string */
  getToken() {
    return localStorage.getItem("access_token");
  },

  /** Map officer role to permission set */
  getRolePermissions(role = "Constable") {
    const roleLower = String(role).toLowerCase();

    // Default permissions for everyone
    const perms = ["dashboard", "cases"];

    if (["sub inspector", "inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower)) {
      perms.push("evidence");
    }

    if (["inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower)) {
      perms.push("analytics", "ai_analytics");
    }

    if (["dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower)) {
      perms.push("crime_trends");
    }

    if (roleLower === "admin") {
      perms.push("users", "system_settings", "audit_logs");
    }

    return perms;
  },
};

export { api };
export default authService;
