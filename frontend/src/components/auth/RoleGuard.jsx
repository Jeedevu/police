/**
 * RoleGuard — UI component guard that renders children only if officer matches allowed roles.
 */
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function RoleGuard({ allowedRoles = [], fallback = null, children }) {
  const { hasRole, isAdmin } = useAuth();

  if (isAdmin) return children;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (hasRole(...roles)) {
    return children;
  }

  return fallback;
}
