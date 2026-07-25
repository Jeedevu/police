/**
 * Evidence page — gallery view with upload modal, filter, and chain of custody.
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/layout/Layout";
import { api } from "../services/authService";
import { formatIndianDate, format24HourTime } from "../utils/formatters";

const FILE_TYPE_ICONS = {
  image: "🖼️",
  video: "🎥",
  audio: "🎵",
  document: "📄",
  unknown: "📎",
};

const FILE_TYPE_COLORS = {
  image: { bg: "#3b82f620", text: "#60a5fa", border: "#3b82f640" },
  video: { bg: "#8b5cf620", text: "#a78bfa", border: "#8b5cf640" },
  audio: { bg: "#10b98120", text: "#34d399", border: "#10b98140" },
  document: { bg: "#f59e0b20", text: "#fbbf24", border: "#f59e0b40" },
  unknown: { bg: "#64748b20", text: "#94a3b8", border: "#64748b40" },
};

function EvidenceCard({ item }) {
  const { t } = useTranslation();
  const icon = FILE_TYPE_ICONS[item.evidence_type] || FILE_TYPE_ICONS.unknown;
  const colors = FILE_TYPE_COLORS[item.evidence_type] || FILE_TYPE_COLORS.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 hover:border-blue-500/30 transition-all cursor-pointer shadow-lg backdrop-blur-md"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border shadow-inner"
          style={{ background: colors.bg, borderColor: colors.border }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider"
              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              {item.evidence_type || "Unknown"}
            </span>
            <span className="text-xs text-slate-400 font-mono">FIR #{item.case_id}</span>
          </div>
          <p className="text-sm text-white font-bold truncate">
            {item.description || "Evidence Item"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {t("evidence.officer", "Officer")}: <span className="text-slate-200 font-semibold">{item.collected_by || "Unknown"}</span>
          </p>
          {item.collected_date && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              {t("evidence.timestamp", "Timestamp")}: {formatIndianDate(item.collected_date)} {format24HourTime(item.collected_date)}
            </p>
          )}
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  item.status === "Collected" ? "bg-emerald-400 animate-pulse" :
                  item.status === "Under Analysis" ? "bg-amber-400" :
                  "bg-blue-400"
                }`}
              />
              <span className="text-xs font-semibold text-slate-300">{item.status || "Verified"}</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
              ✓ {t("evidence.verified", "Verified")}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UploadModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [caseId, setCaseId] = useState("");
  const [description, setDescription] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !caseId) {
      setError("Please select a file and provide a case ID.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("case_id", caseId);
      form.append("description", description);
      form.append("collected_by", collectedBy);
      form.append("file", file);
      await api.post("/api/evidence/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-white">{t("evidence.upload_evidence", "Upload Evidence")}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              {t("evidence.case_id", "Case FIR ID")} *
            </label>
            <input
              type="number"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Enter case FIR ID"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              {t("evidence.category", "Category & Description")}
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Brief description of evidence item"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
              {t("evidence.officer", "Seizing Officer")}
            </label>
            <input
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Officer Name / Badge"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">File *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                file
                  ? "border-blue-500/50 bg-blue-500/10"
                  : "border-white/10 hover:border-blue-500/30 hover:bg-white/5"
              }`}
            >
              {file ? (
                <div>
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm text-blue-400 font-bold">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-1">📁</p>
                  <p className="text-sm text-slate-300 font-bold">Click to select or drag & drop</p>
                  <p className="text-xs text-slate-500 mt-1">CCTV videos, forensic snaps, call log dumps, FIR PDFs</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              ⚠️ {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 text-sm font-bold transition-colors"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-blue-500/20"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
            >
              {uploading ? t("common.loading", "Uploading...") : t("evidence.upload_evidence", "Upload Evidence")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Evidence() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [caseFilter, setCaseFilter] = useState("");

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (typeFilter) params.set("evidence_type", typeFilter);
      if (caseFilter) params.set("case_id", caseFilter);
      const { data } = await api.get(`/api/evidence?${params}`);
      setItems(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load evidence:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [typeFilter, caseFilter]);

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <AnimatePresence>
          {showUpload && (
            <UploadModal onClose={() => setShowUpload(false)} onSuccess={loadEvidence} />
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              {t("evidence.title", "Evidence Vault & Custody Ledger")}
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {t("evidence.sub", "Cryptographically Sealed Forensic Evidence & Chain of Custody")} • {total} items
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
          >
            <span>📤</span> {t("evidence.upload_evidence", "Upload Evidence")}
          </button>
        </motion.div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(FILE_TYPE_ICONS).filter(([k]) => k !== "unknown").map(([type, icon]) => {
            const count = items.filter(i => i.evidence_type === type).length;
            const colors = FILE_TYPE_COLORS[type];
            return (
              <div
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-blue-500/30 transition-all shadow-md"
                style={typeFilter === type ? { borderColor: colors.border, background: colors.bg } : {}}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-xl font-black" style={{ color: colors.text }}>{count}</p>
                    <p className="text-xs text-slate-400 capitalize font-medium">{type}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Case filter */}
        <div className="flex items-center gap-3">
          <input
            value={caseFilter}
            onChange={(e) => setCaseFilter(e.target.value)}
            placeholder={t("nav.search_placeholder", "Filter by Case ID…")}
            type="number"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-56 shadow-sm"
          />
          {(typeFilter || caseFilter) && (
            <button
              onClick={() => { setTypeFilter(""); setCaseFilter(""); }}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition"
            >
              {t("common.reset", "Clear Filters")}
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-white/10">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t("common.no_data", "No evidence files stored in vault")}</p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition"
            >
              {t("evidence.upload_evidence", "Upload Evidence")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <EvidenceCard key={item.evidence_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
