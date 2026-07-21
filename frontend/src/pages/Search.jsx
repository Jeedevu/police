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
  Phone
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

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Advanced filter state
  const [filterCrimeType, setFilterCrimeType] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("");
  const [filterCategory, setFilterCategory] = useState("all"); // all | cases | people | vehicles | phones | evidence
  const [filterMinRisk, setFilterMinRisk] = useState("");

  const hasActiveFilters = filterCrimeType || filterDistrict || filterCategory !== "all" || filterMinRisk;

  const handleSearch = async (overrideQuery = null) => {
    const q = overrideQuery ?? query;
    if (!q.trim() && !hasActiveFilters) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.append("q", q.trim());
      if (filterCrimeType) params.append("crime_type", filterCrimeType);
      if (filterDistrict) params.append("district", filterDistrict);
      if (filterMinRisk) params.append("min_risk", filterMinRisk);

      const res = await api.get(`/search?${params.toString()}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search failed:", err);
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

  // Filter results client-side by category and crime type / district
  const filteredResults = results
    ? {
        cases: (results.cases || []).filter((c) => {
          if (filterCrimeType && !c.crime_type?.toLowerCase().includes(filterCrimeType.toLowerCase())) return false;
          if (filterDistrict && !c.district?.toLowerCase().includes(filterDistrict.toLowerCase())) return false;
          return true;
        }),
        people: (results.people || []).filter((p) => {
          if (filterMinRisk && (p.risk_score || 0) < parseInt(filterMinRisk)) return false;
          return true;
        }),
        vehicles: results.vehicles || [],
        phones: results.phones || [],
        evidence: results.evidence || [],
      }
    : null;

  const showSection = (id) => filterCategory === "all" || filterCategory === id;

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 select-none">
        
        {/* Page Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-soft">
          <h1 className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
            <SearchIcon size={20} className="text-primary" /> SYSTEM-WIDE INTEL SEARCH
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Execute secure records inquiries across cases, vehicles, cell phones, suspects, and forensic evidence.
          </p>
        </div>

        {/* Dynamic Search Bar panel */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-soft space-y-4">
          <div className="flex gap-3">
            <div className="flex-grow relative flex items-center">
              <input
                id="search-input"
                type="text"
                placeholder="Search by name, Aadhaar, registration, FIR number, phone, IMEI..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl pl-11 pr-4 py-3 text-xs text-slate-800 focus:outline-none transition shadow-inner placeholder-slate-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <SearchIcon className="absolute left-4 text-slate-400" size={16} />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 font-bold text-xs px-4 rounded-xl transition border ${
                showFilters || hasActiveFilters
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-primary text-white text-[8px] font-black rounded-full px-1.5 py-0.5 ml-1">
                  ON
                </span>
              )}
            </button>
            
            <button
              id="search-btn"
              onClick={() => handleSearch()}
              disabled={loading}
              className="bg-primary hover:bg-primary/95 disabled:bg-slate-100 text-white disabled:text-slate-400 font-bold text-xs px-6 rounded-xl shadow-md transition"
            >
              {loading ? "Inquiring..." : "Execute Search"}
            </button>
          </div>

          {/* Advanced Filters Expand Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 mt-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Configure Inquest Filters</span>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center gap-1 text-[10px] text-red-600 font-bold hover:underline"
                      >
                        <X size={10} /> Reset Filters
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Crime Head</label>
                      <select
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 focus:outline-none focus:border-primary"
                        value={filterCrimeType}
                        onChange={(e) => setFilterCrimeType(e.target.value)}
                      >
                        <option value="">All Crime Types</option>
                        {CRIME_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regional Unit</label>
                      <select
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 focus:outline-none focus:border-primary"
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                      >
                        <option value="">All Districts</option>
                        {DISTRICTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dossier Category</label>
                      <select
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 focus:outline-none focus:border-primary"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="all">All Fields</option>
                        <option value="cases">FIR Cases</option>
                        <option value="people">Accused Suspects</option>
                        <option value="vehicles">Tagged Vehicles</option>
                        <option value="phones">Mobile Assets</option>
                        <option value="evidence">Evidence Vault</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Min Suspect Danger Risk</label>
                      <input
                        type="number"
                        placeholder="e.g. 70%"
                        className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-600 focus:outline-none focus:border-primary placeholder-slate-300"
                        value={filterMinRisk}
                        onChange={(e) => setFilterMinRisk(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Workspace */}
        {filteredResults ? (
          <div className="space-y-6">
            
            {/* Cases results */}
            {showSection("cases") && filteredResults.cases.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Matching FIR Files ({filteredResults.cases.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResults.cases.map((c) => (
                    <div key={c.case_id} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft hover:shadow-premium transition-all duration-300 flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/5 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-wider">{c.crime_type}</span>
                          <span className="font-bold text-slate-800 text-xs">{c.fir_number}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2 font-medium">
                          <span className="flex items-center gap-1"><MapPin size={11} /> {c.district || "HQ"}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> {c.crime_date || "N/A"}</span>
                        </div>
                      </div>
                      <Link
                        to={`/cases?case_id=${c.case_id}`}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-3 py-1.5 rounded-xl transition shrink-0"
                      >
                        Inspect Dossier
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suspects results */}
            {showSection("people") && filteredResults.people.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Matching Accused Suspects ({filteredResults.people.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.people.map((p) => (
                    <div key={p.person_id} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <Link to={`/profile/1`} className="font-bold text-slate-800 text-xs truncate hover:text-primary transition-colors flex items-center gap-1">
                          <span>{p.full_name}</span>
                          <ChevronRight size={12} />
                        </Link>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">ID/Aadhaar: {p.id_number || "N/A"}</p>
                        <p className="text-[9px] text-slate-400 truncate">Contact: {p.mobile || "No grid logging"}</p>
                      </div>
                      <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-150 px-2 py-0.5 rounded-full shrink-0">
                        {p.risk_score}% RISK
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tagged Vehicles results */}
            {showSection("vehicles") && filteredResults.vehicles.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Matching Tagged Vehicles ({filteredResults.vehicles.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.vehicles.map((v, idx) => (
                    <div key={idx} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-150 text-slate-500">
                          <Car size={16} />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-xs">{v.registration_number}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{v.color || ""} {v.model || "Unknown Automobile"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-lg">
                        Owner ID: {v.person_id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracked Phones results */}
            {showSection("phones") && filteredResults.phones.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Matching Tracked Mobile Assets ({filteredResults.phones.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.phones.map((ph, idx) => (
                    <div key={idx} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-150 text-slate-500">
                          <Phone size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{ph.phone_number}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">IMEI: {ph.imei || "No secure mapping"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded-lg">
                        Subject ID: {ph.person_id}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Vault results */}
            {showSection("evidence") && filteredResults.evidence.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Matching Forensic Evidence ({filteredResults.evidence.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResults.evidence.map((ev) => (
                    <div key={ev.evidence_id} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft hover:shadow-premium transition-all duration-300">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 truncate max-w-[200px]">{ev.description}</h4>
                          <p className="text-[9px] text-slate-400 mt-0.5">Logged: {ev.date_logged || "N/A"}</p>
                        </div>
                        <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-blue-100 uppercase">
                          {ev.status || "Vaulted"}
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-500 space-y-0.5">
                        <p><strong>Storage Locker:</strong> {ev.secure_location || "Central Crypt"}</p>
                        <p><strong>Case Dossier Reference ID:</strong> {ev.case_id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.values(filteredResults).every((arr) => arr.length === 0) && (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                No matching records were compiled for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs bg-white border border-slate-150 rounded-3xl shadow-soft max-w-md mx-auto">
            <SearchIcon className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="font-bold text-slate-700">Awaiting Record Query</p>
            <p className="text-[10px] mt-1 text-slate-400">Enter a subject parameter above to query the central KSP SQL servers.</p>
          </div>
        )}

      </div>
    </Layout>
  );
}
