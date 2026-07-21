/**
 * Officers page — manage police officer hierarchy, transfers, promotions.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { api } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const ROLE_COLORS = {
  ADMIN: { bg: "#f59e0b20", text: "#f59e0b", border: "#f59e0b40" },
  DGP: { bg: "#8b5cf620", text: "#8b5cf6", border: "#8b5cf640" },
  ADGP: { bg: "#a78bfa20", text: "#a78bfa", border: "#a78bfa40" },
  IGP: { bg: "#6366f120", text: "#6366f1", border: "#6366f140" },
  DIG: { bg: "#3b82f620", text: "#3b82f6", border: "#3b82f640" },
  SP: { bg: "#0ea5e920", text: "#0ea5e9", border: "#0ea5e940" },
  DSP: { bg: "#06b6d420", text: "#06b6d4", border: "#06b6d440" },
  ACP: { bg: "#10b98120", text: "#10b981", border: "#10b98140" },
  Inspector: { bg: "#22c55e20", text: "#22c55e", border: "#22c55e40" },
  "Sub Inspector": { bg: "#84cc1620", text: "#84cc16", border: "#84cc1640" },
  "Head Constable": { bg: "#eab30820", text: "#eab308", border: "#eab30840" },
  Constable: { bg: "#f9731620", text: "#f97316", border: "#f9731640" },
  Analyst: { bg: "#ec489920", text: "#ec4899", border: "#ec489940" },
  Guest: { bg: "#64748b20", text: "#64748b", border: "#64748b40" },
};

function RoleBadge({ role }) {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.Guest;
  return (
    <span
      className="px-2 py-0.5 rounded-md text-xs font-semibold border"
      style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
    >
      {role}
    </span>
  );
}

function OfficerCard({ officer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.005 }}
      className="bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-blue-500/20 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-lg flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
        >
          👮
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">
              {officer.full_name}
            </h3>
            {officer.is_active ? (
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {officer.badge_number || "No badge"} • {officer.email}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <RoleBadge role={officer.role} />
            {officer.district_id && (
              <span className="text-xs text-slate-600">District #{officer.district_id}</span>
            )}
            {officer.last_login && (
              <span className="text-xs text-slate-600">
                Last login: {new Date(officer.last_login).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Officers() {
  const { officer: currentOfficer } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [stats, setStats] = useState(null);

  const loadOfficers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const { data } = await api.get(`/api/officers?${params}`);
      setOfficers(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load officers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get("/api/officers/stats");
      setStats(data);
    } catch (_) {}
  };

  useEffect(() => {
    loadOfficers();
    loadStats();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadOfficers, 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const ROLES = Object.keys(ROLE_COLORS);

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Officer Management</h1>
            <p className="text-slate-400 text-sm">
              Karnataka State Police • {total} officers
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
          >
            + Add Officer
          </button>
        </motion.div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: "Total Officers", value: stats.total_officers, icon: "👮", color: "#3b82f6" },
              { label: "Active", value: stats.active_officers, icon: "✅", color: "#10b981" },
              { label: "Roles", value: Object.keys(stats.by_role || {}).length, icon: "🎖️", color: "#8b5cf6" },
              { label: "Inactive", value: stats.total_officers - stats.active_officers, icon: "⏸️", color: "#f59e0b" },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/60 border border-white/5 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search officers…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 min-w-[150px]"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Officers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/40 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : officers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">👮</p>
          <p className="text-slate-400">No officers found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {officers.map((o) => (
            <OfficerCard key={o.id} officer={o} />
          ))}
        </div>
      )}

      {/* Role Distribution */}
      {stats?.by_role && (
        <div className="mt-8 bg-slate-900/60 border border-white/5 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Role Distribution
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(stats.by_role).map(([role, count]) => {
              const colors = ROLE_COLORS[role] || ROLE_COLORS.Guest;
              return (
                <div key={role} className="text-center">
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{ color: colors.text }}
                  >{count}</div>
                  <div className="text-xs text-slate-500 leading-tight">{role}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
