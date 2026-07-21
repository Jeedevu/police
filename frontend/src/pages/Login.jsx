/**
 * Login page — premium enterprise design for Karnataka State Police.
 * Features: PostgreSQL + JWT Auth, animated background, glassmorphic card, form validation, Remember Me.
 */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const ROLE_COLORS = {
  ADMIN: "#f59e0b",
  DGP: "#8b5cf6",
  SP: "#3b82f6",
  Inspector: "#10b981",
  Constable: "#64748b",
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Invalid credentials or account is locked. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center overflow-hidden relative p-4">
      {/* Animated mesh background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #1d4ed8 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0891b2 0%, transparent 70%)" }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(#1e3a5f 1px, transparent 1px), linear-gradient(90deg, #1e3a5f 1px, transparent 1px)",
            backgroundSize: "50px 50px"
          }} />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-3xl border border-white/10 p-8 shadow-2xl"
          style={{
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
                boxShadow: "0 0 40px rgba(29, 78, 216, 0.4)",
              }}
            >
              <span className="text-4xl">🛡️</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-2xl font-bold text-white tracking-tight">
                KSP Crime Intelligence
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Karnataka State Police — PostgreSQL + JWT Portal
              </p>
            </motion.div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium leading-relaxed"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email or Username */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email or Officer ID
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  👤
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="officer@ksp.gov.in or username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                    rememberMe
                      ? "bg-blue-600 border-blue-600"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  {rememberMe && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: loading
                  ? "rgba(29, 78, 216, 0.5)"
                  : "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
                boxShadow: loading ? "none" : "0 0 20px rgba(29, 78, 216, 0.4)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating JWT…
                </span>
              ) : (
                "Sign In Securely"
              )}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-3 rounded-xl bg-white/3 border border-white/5"
          >
            <p className="text-xs text-slate-500 text-center mb-2 font-medium uppercase tracking-wider">
              Quick Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { role: "ADMIN", email: "admin@ksp.gov.in", pass: "Admin@123" },
                { role: "Inspector", email: "jeevan.inspector@ksp.gov.in", pass: "Inspector@123" },
                { role: "SP", email: "sp1@ksp.gov.in", pass: "SP@123" },
                { role: "Constable", email: "constable1@ksp.gov.in", pass: "Constable@123" },
              ].map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => {
                    setIdentifier(cred.email);
                    setPassword(cred.pass);
                  }}
                  className="text-left px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors group border border-white/5"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                      style={{
                        background: `${ROLE_COLORS[cred.role] || "#3b82f6"}20`,
                        color: ROLE_COLORS[cred.role] || "#3b82f6",
                      }}
                    >
                      {cred.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 group-hover:text-slate-200">
                    {cred.email}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 mt-6">
            Authorized personnel only • Misuse is a punishable offence
          </p>
        </div>
      </motion.div>
    </div>
  );
}
