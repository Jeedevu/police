/**
 * ProtectedRoute — Route guard enforcing authentication & permission matrix.
 *
 * Permissions:
 *  - dashboard         : Everyone
 *  - cases             : Everyone
 *  - evidence          : Sub Inspector+
 *  - analytics         : Inspector+
 *  - ai_analytics      : Inspector+
 *  - crime_trends      : DSP+
 *  - users             : Admin
 *  - system_settings   : Admin
 *  - audit_logs        : Admin
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, permission, requiredRole }) {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Verifying Officer Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-red-500/30 rounded-xl text-center text-slate-200">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-2xl font-bold">
          🚫
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Access Restricted</h2>
        <p className="text-slate-400 mb-6">
          Your current officer rank / role does not have authorization to view the <span className="text-amber-400 font-semibold">{permission}</span> module.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          Return to Previous Page
        </button>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
