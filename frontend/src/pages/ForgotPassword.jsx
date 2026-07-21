import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import authService from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to initiate password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl z-10 relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-primary/25 mb-4">
            <Shield size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Reset KSP Credentials</h2>
          <p className="text-xs text-slate-400 mt-1">Enter your registered departmental email to receive reset instructions.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If <span className="font-bold text-white">{email}</span> matches an active officer account, instructions have been sent.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Official Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@ksp.gov.in"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition"
                />
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 transition flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send Reset Instructions"
              )}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition inline-flex items-center gap-1">
                <ArrowLeft size={12} /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
