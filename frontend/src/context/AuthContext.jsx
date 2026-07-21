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

  // Restore session from local storage on launch
  useEffect(() => {
    try {
      const storedOfficer = authService.getCurrentOfficer();
      const storedPermissions = authService.getPermissions();
      if (storedOfficer && authService.isAuthenticated()) {
        setOfficer(storedOfficer);
        setPermissions(storedPermissions);
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
      if (officer?.role?.toLowerCase() === "admin") return true;

      const currentPerms = permissions.length > 0 ? permissions : authService.getPermissions();
      const keyLower = String(permissionKey).toLowerCase();

      return currentPerms.some((p) => String(p).toLowerCase() === keyLower);
    },
    [officer, permissions]
  );

  /** Check if officer role matches allowed roles */
  const hasRole = useCallback(
    (...allowedRoles) => {
      if (!officer?.role) return false;
      if (officer.role.toLowerCase() === "admin") return true;
      const officerRoleLower = officer.role.toLowerCase();
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
    isAuthenticated: !!officer && authService.isAuthenticated(),
    hasPermission,
    hasRole,
    isAdmin: officer?.role?.toLowerCase() === "admin",
    role: officer?.role || "Constable",
    rank: officer?.rank || officer?.role || "Constable",
    badgeNumber: officer?.badge_number || officer?.officer_id || "KSP-001",
    station: officer?.police_station_id ? `Station #${officer.police_station_id}` : "Central HQ",
    district: officer?.district_id ? `District #${officer.district_id}` : "State HQ",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
