/**
 * ProtectedRoute — redirects to /login if not authenticated.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, officer, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && officer?.role !== requiredRole && officer?.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-slate-400">
            Your role ({officer?.role}) does not have access to this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
