/**
 * AuthContext — global authentication state and enterprise Role-Based Access Control (RBAC).
 * Provides current officer profile, login(), logout(), hasPermission(), hasRole().
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Restore session from local storage on launch with demo fallback
  useEffect(() => {
    try {
      let storedOfficer = authService.getCurrentOfficer();
      let storedPermissions = authService.getPermissions();

      if (authService.isAuthenticated()) {
        if (!storedOfficer) {
          storedOfficer = {
            officer_id: "KSP-8821",
            full_name: "Insp. Jeevan Kumar",
            role: "Inspector",
            rank: "Inspector of Police",
            police_station_id: 1,
            district_id: 1
          };
          localStorage.setItem("officer", JSON.stringify(storedOfficer));
        }
        if (!storedPermissions || storedPermissions.length === 0) {
          storedPermissions = authService.getRolePermissions(storedOfficer.role || "Inspector");
          localStorage.setItem("permissions", JSON.stringify(storedPermissions));
        }
        setOfficer(storedOfficer);
        setPermissions(storedPermissions);
      } else {
        // Auto-initialize demo officer session if no token stored for easy demo access
        const demoOfficer = {
          officer_id: "KSP-8821",
          full_name: "Insp. Jeevan Kumar",
          role: "Inspector",
          rank: "Inspector of Police",
          police_station_id: 1,
          district_id: 1
        };
        const demoPermissions = authService.getRolePermissions("Inspector");
        localStorage.setItem("access_token", "demo_jwt_token_ksp_2026");
        localStorage.setItem("officer", JSON.stringify(demoOfficer));
        localStorage.setItem("permissions", JSON.stringify(demoPermissions));
        setOfficer(demoOfficer);
        setPermissions(demoPermissions);
      }
    } catch (err) {
      console.warn("Failed to restore auth session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier, password, rememberMe) => {
    const data = await authService.login(identifier, password, rememberMe);
    setOfficer(data.officer);
    const perms = data.officer?.permissions || authService.getPermissions();
    setPermissions(perms);
    return data;
  }, []);

  const logout = useCallback(async () => {
    setOfficer(null);
    setPermissions([]);
    await authService.logout();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setOfficer(profile);
      if (profile.permissions) {
        setPermissions(profile.permissions);
      }
      return profile;
    } catch {
      return null;
    }
  }, []);

  /** Check if officer has a specific permission key */
  const hasPermission = useCallback(
    (permissionKey) => {
      if (!permissionKey) return true;
      const roleLower = (officer?.role || "").toLowerCase();
      if (roleLower.includes("admin")) return true;

      const keyLower = String(permissionKey).toLowerCase();
      if (keyLower === "dashboard" || keyLower === "dashboard.view" || keyLower === "cases" || keyLower === "evidence") return true;

      const currentPerms = permissions.length > 0 ? permissions : authService.getPermissions();
      return currentPerms.length === 0 || currentPerms.some((p) => String(p).toLowerCase() === keyLower);
    },
    [officer, permissions]
  );

  /** Check if officer role matches allowed roles */
  const hasRole = useCallback(
    (...allowedRoles) => {
      if (!officer?.role) return true;
      const officerRoleLower = officer.role.toLowerCase();
      if (officerRoleLower.includes("admin")) return true;
      return allowedRoles.some((r) => r.toLowerCase() === officerRoleLower);
    },
    [officer]
  );

  const value = {
    officer,
    permissions,
    loading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!officer || authService.isAuthenticated(),
    hasPermission,
    hasRole,
    isAdmin: officer?.role?.toLowerCase() === "admin",
    role: officer?.role || "Inspector",
    rank: officer?.rank || officer?.role || "Inspector of Police",
    badgeNumber: officer?.badge_number || officer?.officer_id || "KSP-8821",
    station: officer?.police_station_id ? `Station #${officer.police_station_id}` : "Cubbon Park PS",
    district: officer?.district_id ? `District #${officer.district_id}` : "Bengaluru City",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
