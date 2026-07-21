/**
 * AuthContext — global authentication state.
 * Provides currentOfficer, login(), logout(), isAuthenticated.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load officer from localStorage on mount
  useEffect(() => {
    const stored = authService.getCurrentOfficer();
    if (stored && authService.isAuthenticated()) {
      setOfficer(stored);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password, rememberMe) => {
    const data = await authService.login(email, password, rememberMe);
    setOfficer(data.officer);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setOfficer(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authService.getProfile();
      setOfficer(profile);
      localStorage.setItem("officer", JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  }, []);

  const value = {
    officer,
    loading,
    login,
    logout,
    refreshProfile,
    isAuthenticated: !!officer,
    hasRole: (...roles) => roles.includes(officer?.role),
    isAdmin: officer?.role === "ADMIN",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
