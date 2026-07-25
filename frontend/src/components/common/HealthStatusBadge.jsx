import React, { useEffect, useState } from "react";
import api from "../../services/api";

export default function HealthStatusBadge() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const { data } = await api.get("/health");
        setHealth(data);
      } catch (err) {
        setHealth({ status: "disconnected", backend: "offline", database: "offline", gemini: "offline" });
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs text-slate-400">
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></div>
        Checking System Status...
      </div>
    );
  }

  const isHealthy = health?.status === "healthy";

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-full text-xs font-medium">
      {/* Backend Status */}
      <div className="flex items-center gap-1.5" title="FastAPI Backend">
        <div className={`w-2 h-2 rounded-full ${isHealthy ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-amber-500 animate-ping"}`}></div>
        <span className="text-slate-300">Backend</span>
      </div>

      <span className="text-slate-700">|</span>

      {/* Database Status */}
      <div className="flex items-center gap-1.5" title="PostgreSQL Database">
        <div className={`w-2 h-2 rounded-full ${health?.database === "connected" ? "bg-emerald-500" : "bg-red-500"}`}></div>
        <span className="text-slate-300">DB</span>
      </div>

      <span className="text-slate-700">|</span>

      {/* AI Gemini Status */}
      <div className="flex items-center gap-1.5" title="Google Gemini AI">
        <div className={`w-2 h-2 rounded-full ${health?.gemini === "configured" ? "bg-purple-400 shadow-sm shadow-purple-500/50" : "bg-amber-500"}`}></div>
        <span className="text-purple-300 font-semibold">Gemini</span>
      </div>
    </div>
  );
}
