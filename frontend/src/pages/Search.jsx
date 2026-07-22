import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  Filter,
  X,
  ChevronRight,
  FolderLock,
  UserX,
  Car,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  Fingerprint,
  ScanFace,
  FileText,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const CRIME_TYPES = [
  "Theft", "Murder", "Robbery", "Assault", "Fraud", "Cyber Crime",
  "Kidnapping", "Burglary", "Drug Offence", "Domestic Violence",
];

const DISTRICTS = [
  "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi",
  "Ballari", "Davangere", "Shivamogga", "Tumkuru", "Kalaburagi",
];

const SEARCH_MODES = [
  { id: "all", label: "🔍 All Fields", icon: SearchIcon },
  { id: "name", label: "👤 Name", icon: UserX },
  { id: "phone", label: "📞 Phone Number", icon: Phone },
  { id: "aadhaar", label: "🪪 Aadhaar ID", icon: ShieldCheck },
  { id: "vehicle", label: "🚘 Vehicle Reg", icon: Car },
  { id: "fingerprint", label: "🖐️ Fingerprint ID", icon: Fingerprint },
  { id: "face", label: "📷 Face ID", icon: ScanFace },
  { id: "case", label: "📁 Case / FIR No", icon: FileText },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("all");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState(null);

  // Advanced filter state
  const [filterCrimeType, setFilterCrimeType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMinRisk, setFilterMinRisk] = useState("");

  const hasActiveFilters = filterCrimeType || filterDistrict || filterCategory !== "all" || filterMinRisk;

  const handleSearch = async (overrideQuery = null) => {
    const q = overrideQuery ?? query;
    if (!q.trim() && !hasActiveFilters) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append("q", q.trim());
      if (searchMode !== "all") params.append("search_mode", searchMode);
      if (filterCrimeType) params.append("crime_type", filterCrimeType);
      if (filterDistrict) params.append("district", filterDistrict);
      if (filterMinRisk) params.append("min_risk", filterMinRisk);

      const res = await api.get(`/search?${params.toString()}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setResults({ cases: [], people: [], vehicles: [], phones: [], evidence: [] });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterCrimeType("");
    setFilterDistrict("");
    setFilterCategory("all");
    setFilterMinRisk("");
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Search Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <SearchIcon size={22} className="text-blue-400" />
                Intelligence & Suspect Search Engine
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Search multi-attribute records across Suspect Names, Phone CDR, Aadhaar, Fingerprints, Face IDs, & Vehicles
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition flex items-center gap-2 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Filter size={15} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Search Mode Quick Selector Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
            {SEARCH_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSearchMode(mode.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  searchMode === mode.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Search input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search by ${SEARCH_MODES.find(m => m.id === searchMode)?.label}...`}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 pl-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
              />
              <SearchIcon size={18} className="absolute left-4 top-3.5 text-slate-500" />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Search</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Advanced Filter Collapsible Bar */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-slate-800 space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px]">Crime Type</label>
                    <select
                      value={filterCrimeType}
                      onChange={(e) => setFilterCrimeType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Crime Types</option>
                      {CRIME_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px]">District</label>
                    <select
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">All Districts</option>
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px]">Minimum Risk Score</label>
                    <input
                      type="number"
                      placeholder="e.g. 70"
                      value={filterMinRisk}
                      onChange={(e) => setFilterMinRisk(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Container */}
        {results && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Results Column */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                <span>Matching Intelligence Records</span>
                <span>{results.people?.length || 0} Suspects Found</span>
              </h2>

              {results.people && results.people.length > 0 ? (
                results.people.map((p) => (
                  <div
                    key={p.person_id}
                    onClick={() => setSelectedSuspect(p)}
                    className={`p-5 bg-slate-900 border rounded-3xl cursor-pointer transition shadow-xl space-y-3 ${
                      selectedSuspect?.person_id === p.person_id
                        ? "border-blue-500 ring-2 ring-blue-500/20 bg-slate-900/90"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-bold text-blue-400 shadow-inner">
                          👮
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">{p.full_name}</h3>
                          <p className="text-[11px] text-slate-400">{p.gender}, {p.age} years • {p.district || "Bengaluru"}</p>
                        </div>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                          p.risk_score >= 80
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {p.risk_score}% Risk Score
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">Phone</span>
                        <span className="text-slate-300 font-medium">{p.mobile || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">Aadhaar</span>
                        <span className="text-slate-300 font-medium">{p.aadhaar || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">PAN</span>
                        <span className="text-slate-300 font-medium">{p.pan || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase block">Passport</span>
                        <span className="text-slate-300 font-medium">{p.passport || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
                  No suspect records matching current search criteria.
                </div>
              )}
            </div>

            {/* 360° Suspect Dossier Inspection Panel */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                360° Target Dossier
              </h2>

              {selectedSuspect ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl sticky top-24">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-base font-black text-slate-100">{selectedSuspect.full_name}</h3>
                      <p className="text-xs text-slate-400">ID: SUSP-2024-{selectedSuspect.person_id}</p>
                    </div>
                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      {selectedSuspect.risk_score}% Risk
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <p><strong className="text-slate-400 uppercase text-[9px] block">Address:</strong> {selectedSuspect.address}</p>
                    <p><strong className="text-slate-400 uppercase text-[9px] block">Mobile:</strong> {selectedSuspect.mobile || "N/A"}</p>
                    <p><strong className="text-slate-400 uppercase text-[9px] block">Aadhaar ID:</strong> {selectedSuspect.aadhaar || "N/A"}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <Link
                      to={`/profile/${selectedSuspect.person_id}`}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                      <span>Open Full Criminal Profile</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-slate-500 text-xs">
                  Click any suspect result on the left to inspect complete 360° dossier.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
