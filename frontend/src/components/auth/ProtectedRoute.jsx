/**
 * ProtectedRoute — Route guard enforcing authentication & permission matrix.
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function ProtectedRoute({ children, permission, requiredRole }) {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Verifying KSP Officer Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="p-8 max-w-lg w-full bg-slate-900 border border-red-500/30 rounded-2xl text-center text-slate-200 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Access Restricted (403 Forbidden)</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your current officer rank does not possess authorization for the{" "}
            <span className="text-amber-400 font-semibold">{permission}</span> module. Contact system admin if you believe this is an error.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            <ArrowLeft size={16} /> Return to Previous View
          </button>
        </div>
      </div>
    );
  }

  if (requiredRole && !hasRole(...(Array.isArray(requiredRole) ? requiredRole : [requiredRole]))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
