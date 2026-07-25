/**
 * Authentication service — handles PostgreSQL + JWT login, logout, token management,
 * password change, password reset, and role/permission helpers.
 */
import api, { clearAuthStorage } from "./api";

const authService = {
  /**
   * Log in officer with email/username + password and store authentication details.
   */
  async login(identifier, password, rememberMe = false) {
    const isEmail = String(identifier).includes("@");
    const payload = {
      email: isEmail ? identifier : null,
      username: !isEmail ? identifier : null,
      password,
      remember_me: rememberMe,
    };

    const { data } = await api.post("/api/auth/login", payload);

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
    localStorage.setItem("rank", officer.rank || officer.role || "Constable");
    localStorage.setItem("station", officer.police_station_id ? `Station ${officer.police_station_id}` : "HQ");
    localStorage.setItem("district", officer.district_id ? `District ${officer.district_id}` : "State");

    const permissions = officer.permissions || this.getRolePermissions(officer.role);
    localStorage.setItem("permissions", JSON.stringify(permissions));

    return data;
  },

  /**
   * Log out officer cleanly.
   */
  async logout() {
    try {
      await api.post("/api/auth/logout", {}, { _retry: true });
    } catch (err) {
      // Ignore network errors on logout
    } finally {
      clearAuthStorage();
    }
  },

  /** Fetch current logged in officer profile */
  async getProfile() {
    const { data } = await api.get("/api/auth/profile");
    if (data) {
      localStorage.setItem("officer", JSON.stringify(data));
      if (data.permissions) {
        localStorage.setItem("permissions", JSON.stringify(data.permissions));
      }
    }
    return data;
  },

  /** Change password for logged in officer */
  async changePassword(currentPassword, newPassword) {
    const { data } = await api.post("/api/auth/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  },

  /** Request password reset link */
  async forgotPassword(email) {
    const { data } = await api.post("/api/auth/forgot-password", { email });
    return data;
  },

  /** Confirm password reset with token */
  async resetPassword(token, newPassword) {
    const { data } = await api.post("/api/auth/reset-password", {
      token,
      new_password: newPassword,
    });
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

  /** Fallback permission mapper if permissions array is empty */
  getRolePermissions(role = "Constable") {
    const roleLower = String(role).toLowerCase();
    const perms = ["Dashboard.View", "Cases.Read", "dashboard", "cases"];

    if (["sub inspector", "si", "inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower)) {
      perms.push("Evidence.Upload", "Evidence.Download", "Evidence.Tag", "evidence");
    }

    if (["inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower)) {
      perms.push("Analytics.View", "AI.Chat", "AI.GenerateReport", "CrimeMap.View", "analytics", "ai_analytics");
    }

    if (["sp", "dig", "igp", "dgp", "admin"].includes(roleLower)) {
      perms.push("Officers.View", "Officers.Edit", "Investigation.Assign", "Investigation.Close", "users", "crime_trends");
    }

    if (roleLower === "admin") {
      perms.push("Users.Create", "Users.Edit", "Users.Delete", "Settings.View", "Settings.Edit", "Audit.View", "Audit.Export", "system_settings", "audit_logs");
    }

    return perms;
  },
};

export { api };
export default authService;
