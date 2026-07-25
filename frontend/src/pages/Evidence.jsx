/**
 * Evidence page — gallery view with upload modal, filter, and chain of custody.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/authService";

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
  const icon = FILE_TYPE_ICONS[item.evidence_type] || FILE_TYPE_ICONS.unknown;
  const colors = FILE_TYPE_COLORS[item.evidence_type] || FILE_TYPE_COLORS.unknown;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="bg-slate-900/60 border border-white/5 rounded-xl p-4 hover:border-blue-500/20 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border"
          style={{ background: colors.bg, borderColor: colors.border }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md border"
              style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
            >
              {item.evidence_type || "Unknown"}
            </span>
            <span className="text-xs text-slate-600">Case #{item.case_id}</span>
          </div>
          <p className="text-sm text-white font-medium truncate">
            {item.description || "Evidence Item"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Collected by: {item.collected_by || "Unknown"}
          </p>
          {item.collected_date && (
            <p className="text-xs text-slate-600">
              {new Date(item.collected_date).toLocaleDateString()}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                item.status === "Collected" ? "bg-green-400" :
                item.status === "Under Analysis" ? "bg-yellow-400" :
                "bg-slate-500"
              }`}
            />
            <span className="text-xs text-slate-500">{item.status || "Unknown"}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function UploadModal({ onClose, onSuccess }) {
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
        className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">Upload Evidence</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Case ID *</label>
            <input
              type="number"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Enter case ID"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Brief description of evidence"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Collected By</label>
            <input
              value={collectedBy}
              onChange={(e) => setCollectedBy(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Officer name"
            />
          </div>

          {/* File drop zone */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">File *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                file
                  ? "border-blue-500/50 bg-blue-500/5"
                  : "border-white/10 hover:border-blue-500/30 hover:bg-white/3"
              }`}
            >
              {file ? (
                <div>
                  <p className="text-2xl mb-1">✅</p>
                  <p className="text-sm text-blue-400 font-medium">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl mb-1">📁</p>
                  <p className="text-sm text-slate-400">Click to select or drag & drop</p>
                  <p className="text-xs text-slate-600 mt-1">Images, videos, audio, PDFs</p>
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
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
            >
              {uploading ? "Uploading…" : "Upload Evidence"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Evidence() {
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
    <div className="min-h-screen bg-[#030712] text-white p-6">
      <AnimatePresence>
        {showUpload && (
          <UploadModal onClose={() => setShowUpload(false)} onSuccess={loadEvidence} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Evidence Management</h1>
          <p className="text-slate-400 text-sm">{total} evidence items</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
        >
          <span>📤</span> Upload Evidence
        </button>
      </motion.div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(FILE_TYPE_ICONS).filter(([k]) => k !== "unknown").map(([type, icon]) => {
          const count = items.filter(i => i.evidence_type === type).length;
          const colors = FILE_TYPE_COLORS[type];
          return (
            <div
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? "" : type)}
              className="bg-slate-900/60 border border-white/5 rounded-xl p-3 cursor-pointer hover:border-blue-500/20 transition-all"
              style={typeFilter === type ? { borderColor: colors.border, background: colors.bg } : {}}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="text-lg font-bold" style={{ color: colors.text }}>{count}</p>
                  <p className="text-xs text-slate-500 capitalize">{type}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Case filter */}
      <div className="flex gap-3 mb-6">
        <input
          value={caseFilter}
          onChange={(e) => setCaseFilter(e.target.value)}
          placeholder="Filter by Case ID…"
          type="number"
          className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-48"
        />
        {(typeFilter || caseFilter) && (
          <button
            onClick={() => { setTypeFilter(""); setCaseFilter(""); }}
            className="px-3 py-2 rounded-xl text-xs text-slate-400 border border-white/10 hover:bg-white/5"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/40 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-slate-400">No evidence found.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-blue-400 border border-blue-500/30 hover:bg-blue-500/10"
          >
            Upload first evidence
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
  );
}
