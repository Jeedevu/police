/**
 * PermissionGuard — UI component guard that renders children only if officer possesses the required permission.
 */
import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function PermissionGuard({ permission, fallback = null, children }) {
  const { hasPermission, isAdmin } = useAuth();

  if (isAdmin) return children;

  if (hasPermission(permission)) {
    return children;
  }

  return fallback;
}
