import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";

export default function CinematicLoginAnimation({ officerName = "Officer", onComplete }) {
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const handleManualRedirect = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (onComplete) onComplete();
  };

  useEffect(() => {
    const startTime = Date.now();
    const targetDurationMs = 6000; // 6 seconds duration

    // 1. Play background audio asset
    const audio = new Audio("/ritu_tts_audio.mp3");
    audioRef.current = audio;

    // Progress bar tick interval over 6 seconds
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, (elapsed / targetDurationMs) * 100);
      setProgress(pct);

      if (elapsed >= targetDurationMs) {
        clearInterval(interval);
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (onComplete) onComplete();
      }
    }, 50);

    audio.play().catch((err) => {
      console.warn("Audio autoplay prevented by browser policy:", err);
    });

    return () => {
      clearInterval(interval);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onComplete]);

  const currentHour = new Date().getHours();
  const greetingTitle = currentHour < 12 ? "🌅 ಶುಭೋದಯ • Good Morning" : "🌙 ಶುಭ ಸಂಜೆ • Good Evening";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden"
    >
      {/* Police Siren Light Pulse Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse delay-500" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0,transparent_100%)]" />

      {/* Center Container */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-lg">
        {/* KSP Logo Badge Image */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="relative mb-6"
        >
          <div className="w-32 h-32 rounded-3xl bg-slate-900/90 border border-white/20 p-2 shadow-2xl shadow-blue-500/50 relative overflow-hidden flex items-center justify-center">
            <img
              src="/ksp_logo.png"
              alt="KSP Crime Intelligence Platform Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
          </div>
          {/* Pulsing ring */}
          <span className="absolute -inset-3 rounded-3xl border-2 border-blue-400/40 animate-ping" />
        </motion.div>

        {/* Greetings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-3"
        >
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest inline-block mb-1">
            {greetingTitle}
          </span>

          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            Welcome to <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Karnataka State Police Intelligence
            </span>
          </h1>

          <div className="pt-2 text-2xl font-semibold text-emerald-400 tracking-wide flex items-center justify-center gap-2">
            <span>🙏</span>
            <span>ನಮಸ್ಕಾರ, {officerName}</span>
          </div>

          <p className="text-xs text-slate-400 tracking-wider uppercase font-medium pt-3">
            Authenticating Officer Clearance • Launching Command Center...
          </p>
        </motion.div>

        {/* Audio Progress Bar */}
        <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-6 overflow-hidden relative border border-slate-700">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-75"
          />
        </div>

        {/* Manual Redirect Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={handleManualRedirect}
          className="mt-6 px-5 py-2.5 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <span>Proceed to Command Center</span>
          <ArrowRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}
