import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import {
  UserX,
  Phone,
  Car,
  History,
  Users,
  Layers,
  FolderLock,
  ArrowLeft,
  Share2,
  AlertTriangle,
  Wallet,
  MapPin,
  FileText
} from "lucide-react";

function RiskBadge({ score }) {
  const val = score ?? 0;
  const color =
    val >= 85
      ? "bg-red-50 text-red-700 border-red-200"
      : val >= 60
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  const label = val >= 85 ? "CRITICAL THREAT" : val >= 60 ? "HIGH WATCH" : "LOW THREAT";
  return (
    <span className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-xl text-[10px] font-black uppercase ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${val >= 85 ? "bg-red-500 animate-pulse" : val >= 60 ? "bg-amber-500" : "bg-emerald-500"}`} />
      {label} · {val}% RISK
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-slate-100 text-xs">
      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider min-w-[120px]">{label}</span>
      <span className="text-slate-700 text-right font-medium">{value || "N/A"}</span>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: <UserX size={15} /> },
  { id: "phones", label: "Mobile Assets", icon: <Phone size={15} /> },
  { id: "vehicles", label: "Automobiles", icon: <Car size={15} /> },
  { id: "history", label: "Criminal History", icon: <History size={15} /> },
  { id: "associates", label: "Known Associates", icon: <Users size={15} /> },
  { id: "cases", label: "Linked Cases", icon: <FolderLock size={15} /> },
  { id: "evidence", label: "Forensic Evidence", icon: <Layers size={15} /> },
  { id: "financial", label: "Financial Profiles", icon: <Wallet size={15} /> },
];

export default function CriminalProfile() {
  const { person_id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!person_id) return;
    setLoading(true);
    setError(null);
    api
      .get(`/profile/${person_id}`)
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Failed to load profile.");
        setLoading(false);
      });
  }, [person_id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Retrieving secure dossier records...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center select-none">
          <AlertTriangle size={36} className="text-red-500" />
          <div>
            <p className="text-red-700 font-bold text-sm">Failed to Load Profile</p>
            <p className="text-slate-400 text-xs mt-1">{error}</p>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            className="bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 transition"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  if (!profile) return null;

  const p = profile.person;
  const stats = profile.stats;

  return (
    <Layout>
      <div className="flex flex-col h-full gap-5 max-w-7xl mx-auto pb-10 select-none">
        
        {/* Header Profile Dossier Banner */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl font-black text-primary shadow-inner select-none shrink-0">
              {(p.full_name || "?")[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-lg font-black text-slate-800 tracking-tight">{p.full_name}</h1>
                <RiskBadge score={p.risk_score} />
              </div>
              <p className="text-slate-400 text-xs font-medium">
                {p.gender || "Unknown Gender"} · {p.age ? `${p.age} yrs` : "Age N/A"} · {p.address || "No Address Catalogued"}
              </p>
              <p className="text-slate-400 text-[9px] mt-1 font-mono">PERSON INTEL ID: {p.person_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/network?person_id=${p.person_id}`}
              className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-primary/10"
            >
              <Share2 size={13} /> <span>Inspect Link Map</span>
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              <ArrowLeft size={13} /> <span>Back</span>
            </button>
          </div>
        </div>

        {/* Suspect metrics row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "FIR Cases Linked", value: stats.total_cases, color: "text-blue-600 bg-blue-50" },
            { label: "Arrests Registered", value: stats.total_arrests, color: "text-red-600 bg-red-50" },
            { label: "Known Associates", value: stats.total_associates, color: "text-amber-600 bg-amber-50" },
            { label: "Vehicles Tagged", value: stats.total_vehicles, color: "text-purple-600 bg-purple-50" },
            { label: "Phones Tracked", value: stats.total_phones, color: "text-teal-600 bg-teal-50" },
          ].map((s, idx) => (
            <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-4 text-center shadow-soft flex flex-col justify-between h-[85px]">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">{s.label}</div>
              <div className={`mx-auto text-xl font-black rounded-lg px-3 py-1 mt-2.5 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab content workspace */}
        <div className="flex-1 bg-white border border-slate-150 rounded-3xl overflow-hidden flex flex-col shadow-soft min-h-[400px]">
          
          {/* Tab bar header */}
          <div className="flex border-b border-slate-150 bg-slate-50/50 p-2 overflow-x-auto whitespace-nowrap shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  activeTab === tab.id
                    ? "bg-white text-primary border border-slate-200/50 shadow-sm"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                }`}
              >
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Dynamic tabs space */}
          <div className="flex-grow p-6 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                
                {/* Overview tab */}
                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-1 bg-slate-50/50 border border-slate-150 p-5 rounded-2xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Identity Dossier</h3>
                      <InfoRow label="Full Name" value={p.full_name} />
                      <InfoRow label="Gender" value={p.gender} />
                      <InfoRow label="Age" value={p.age ? `${p.age} years` : null} />
                      <InfoRow label="Mobile" value={p.mobile} />
                      <InfoRow label="Email" value={p.email} />
                      <InfoRow label="Address" value={p.address} />
                    </div>
                    <div className="space-y-1 bg-slate-50/50 border border-slate-150 p-5 rounded-2xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Government Registry Maps</h3>
                      <InfoRow label="Aadhaar ID" value={p.aadhaar} />
                      <InfoRow label="PAN Ref" value={p.pan} />
                      <InfoRow label="Passport Code" value={p.passport} />
                      <InfoRow label="Driving License" value={p.driving_license} />
                      <InfoRow label="Voter ID Card" value={p.voter_id} />
                    </div>
                  </div>
                )}

                {/* Phones tab */}
                {activeTab === "phones" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.phones && profile.phones.length > 0 ? (
                      profile.phones.map((ph, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400"><Phone size={14} /></span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{ph.phone_number}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">IMEI: {ph.imei || "No registered hardware ID"}</p>
                            </div>
                          </div>
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.5 rounded">ACTIVE GRID</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">No mobile lines mapped on this subject.</div>
                    )}
                  </div>
                )}

                {/* Vehicles tab */}
                {activeTab === "vehicles" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.vehicles && profile.vehicles.length > 0 ? (
                      profile.vehicles.map((v, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400"><Car size={14} /></span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{v.registration_number}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{v.color || ""} {v.model || "Unknown Automobile"}</p>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-mono text-slate-500 bg-white border border-slate-250/50 px-2 py-0.5 rounded">₹{v.value || "N/A"}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">No vehicle assets tagged.</div>
                    )}
                  </div>
                )}

                {/* Criminal History tab */}
                {activeTab === "history" && (
                  <div className="space-y-4">
                    {profile.history && profile.history.length > 0 ? (
                      profile.history.map((h, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-red-100">{h.crime_type}</span>
                              <span className="text-[10px] text-slate-400 font-mono">Date: {h.crime_date}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 mt-2">Accused Role: {h.accused_role || "Co-conspirator"}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${
                            h.status === "Convicted" ? "bg-red-50 text-red-700 border-red-150" : "bg-blue-50 text-blue-700 border-blue-150"
                          }`}>
                            {h.status || "Active Trial"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">No historical records logged in district registry.</div>
                    )}
                  </div>
                )}

                {/* Associates tab */}
                {activeTab === "associates" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.associates && profile.associates.length > 0 ? (
                      profile.associates.map((a, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex justify-between items-center shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400"><Users size={14} /></span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{a.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Known relation: {a.relationship || "Associate"}</p>
                            </div>
                          </div>
                          <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 font-black px-1.5 py-0.5 rounded">RISK THREAT</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">No co-accused associates mapped.</div>
                    )}
                  </div>
                )}

                {/* Linked Cases tab */}
                {activeTab === "cases" && (
                  <div className="space-y-4">
                    {profile.cases && profile.cases.length > 0 ? (
                      profile.cases.map((c, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex justify-between items-center hover:border-primary/20 transition duration-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-primary/5 text-primary text-[8px] font-bold px-1.5 py-0.5 rounded border border-primary/10 uppercase tracking-wider">{c.crime_type}</span>
                              <span className="font-extrabold text-slate-800 text-xs">{c.fir_number}</span>
                            </div>
                            <p className="text-[9.5px] text-slate-400 mt-1 font-medium">{c.district || "KSP HQ"} | Logged: {c.crime_date}</p>
                          </div>
                          <Link
                            to={`/cases?case_id=${c.case_id}`}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-600 px-3 py-1.5 rounded-xl transition shadow-sm"
                          >
                            Access Folder
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">No active case dossiers linked.</div>
                    )}
                  </div>
                )}

                {/* Forensic Evidence tab */}
                {activeTab === "evidence" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.evidence && profile.evidence.length > 0 ? (
                      profile.evidence.map((ev, idx) => (
                        <div key={idx} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl shadow-sm hover:shadow-soft transition-all duration-300">
                          <div className="flex justify-between items-start border-b border-slate-200/60 pb-2 mb-3">
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{ev.description}</h4>
                              <p className="text-[9px] text-slate-400 mt-0.5">Logged: {ev.date_logged || "N/A"}</p>
                            </div>
                            <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase border border-blue-100">
                              {ev.status || "Vaulted"}
                            </span>
                          </div>
                          <div className="text-[9.5px] text-slate-500 space-y-0.5">
                            <p><strong>Storage Locker:</strong> {ev.secure_location || "Central Lockup"}</p>
                            <p><strong>Ref FIR:</strong> Case ID {ev.case_id}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-150 rounded-2xl">No evidence items registered under this subject.</div>
                    )}
                  </div>
                )}

                {/* Financial Profiles tab */}
                {activeTab === "financial" && (
                  <div className="bg-slate-50/50 border border-slate-150 p-5 rounded-2xl space-y-4">
                    <div className="mb-2">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Financial Intelligence Logs</h3>
                      <p className="text-[9px] text-slate-400 leading-none">Automated audit of logged bank assets and revenue grids</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-soft">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Estimated Bank Net Worth</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1">₹48,20,000</h4>
                        <p className="text-[8px] text-slate-400 mt-1">Sum of all tracked active accounts</p>
                      </div>

                      <div className="bg-white border border-slate-150 p-4 rounded-xl shadow-soft">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Unexplained Inflow Alerts</span>
                        <h4 className="text-lg font-black text-red-600 mt-1">₹12,50,000</h4>
                        <p className="text-[8px] text-red-400 font-bold mt-1">⚠️ High priority money laundering warning flag</p>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </Layout>
  );
}
