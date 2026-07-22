/**
 * Login page — premium enterprise design for Karnataka State Police.
 * Features: PostgreSQL + JWT Auth, animated background, glassmorphic card, form validation, Remember Me.
 */
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_COLORS = {
  ADMIN: "#F59E0B",
  DGP: "#4F46E5",
  SP: "#2563EB",
  Inspector: "#10B981",
  Constable: "#64748B",
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
    <div className="min-h-screen bg-[#08111F] flex items-center justify-center overflow-hidden relative p-4">
      {/* Ambient background field */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-22%] left-[-12%] w-[640px] h-[640px] rounded-full opacity-[0.16]"
          style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-24%] right-[-12%] w-[720px] h-[720px] rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[38%] right-[18%] w-[320px] h-[320px] rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #38BDF8 0%, transparent 70%)" }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Scanline sweep */}
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: "100%" }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-x-0 h-40 opacity-[0.04]"
          style={{ background: "linear-gradient(180deg, transparent, #38BDF8, transparent)" }}
        />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div
          className="rounded-[28px] border border-white/[0.06] p-8 shadow-2xl"
          style={{
            background: "rgba(17, 24, 39, 0.82)",
            backdropFilter: "blur(28px)",
            boxShadow:
              "0 24px 70px -20px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -8 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 14 }}
              className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center relative"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 12px 32px -8px rgba(37,99,235,0.55)",
              }}
            >
              <Shield size={28} className="text-white stroke-[2.25]" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h1 className="text-[22px] font-bold text-[#F8FAFC] tracking-tight">
                KSP Crime Intelligence
              </h1>
              <p className="text-[11px] text-[#64748B] mt-1.5 font-medium uppercase tracking-[0.14em]">
                Karnataka State Police &middot; Secure Access Portal
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
                className="mb-5 px-4 py-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171] text-xs font-medium leading-relaxed flex items-start gap-2.5"
              >
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or Username */}
            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-[0.12em]">
                Email or Officer ID
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="officer@ksp.gov.in or username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#F8FAFC] placeholder-[#475569] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold text-[#94A3B8] mb-2 uppercase tracking-[0.12em]">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[#F8FAFC] placeholder-[#475569] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                    rememberMe
                      ? "bg-[#2563EB] border-[#2563EB]"
                      : "border-white/15 bg-white/[0.03]"
                  }`}
                >
                  {rememberMe && <Check size={12} className="text-white stroke-[3]" />}
                </div>
                <span className="text-xs text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-[#38BDF8] hover:text-[#7dd3fc] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.985 }}
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden flex items-center justify-center gap-2 group mt-2"
              style={{
                background: loading
                  ? "rgba(37, 99, 235, 0.45)"
                  : "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
                boxShadow: loading
                  ? "none"
                  : "0 0 0 1px rgba(255,255,255,0.08) inset, 0 8px 24px -6px rgba(37,99,235,0.5)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Authenticating&hellip;
                </>
              ) : (
                <>
                  Sign In Securely
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Demo credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]"
          >
            <p className="text-[10px] text-[#64748B] text-center mb-2.5 font-bold uppercase tracking-[0.12em]">
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
                  className="text-left px-2.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors group border border-white/[0.04] hover:border-white/[0.08]"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{
                        background: `${ROLE_COLORS[cred.role] || "#2563EB"}1A`,
                        color: ROLE_COLORS[cred.role] || "#2563EB",
                      }}
                    >
                      {cred.role}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] truncate mt-1 group-hover:text-[#94A3B8] transition-colors">
                    {cred.email}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <p className="text-center text-[10px] text-[#475569] mt-6 tracking-wide">
            Authorized personnel only &middot; Misuse is a punishable offence
          </p>
        </div>
      </motion.div>
    </div>
  );
}
