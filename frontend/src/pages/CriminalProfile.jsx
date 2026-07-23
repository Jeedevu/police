import { useEffect, useState, useCallback } from "react";
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
  FileText,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  X,
  CreditCard,
  Briefcase,
  ShieldAlert
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

  const [suspectsList, setSuspectsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [createForm, setCreateForm] = useState({
    full_name: "",
    gender: "Male",
    age: "",
    mobile: "",
    aadhaar: "",
    address: "",
    occupation: "",
    risk_score: 50,
  });

  const [editForm, setEditForm] = useState({
    full_name: "",
    gender: "Male",
    age: "",
    mobile: "",
    aadhaar: "",
    address: "",
    occupation: "",
    risk_score: 50,
  });

  // Fetch Suspects List
  const fetchSuspects = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/profile", { params: { search: searchQuery } });
      const list = Array.isArray(res.data) ? res.data : [];
      setSuspectsList(list);

      // Auto-select suspect if none specified
      if (person_id) {
        setSelectedPersonId(parseInt(person_id));
      } else if (list.length > 0) {
        setSelectedPersonId(list[0].person_id);
      }
    } catch (err) {
      console.error("Failed to load suspects list:", err);
    } finally {
      setLoadingList(false);
    }
  }, [searchQuery, person_id]);

  useEffect(() => {
    fetchSuspects();
  }, [fetchSuspects]);

  // Fetch Selected Suspect 360 Profile
  useEffect(() => {
    if (!selectedPersonId) return;
    setLoadingDetails(true);
    setErrorDetails(null);
    api.get(`/profile/${selectedPersonId}`)
      .then((res) => {
        setProfile(res.data);
        setLoadingDetails(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorDetails(err.response?.data?.detail || "Failed to load suspect profile.");
        setLoadingDetails(false);
      });
  }, [selectedPersonId]);

  // Create Suspect Handler
  const handleCreateSuspect = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/profile", createForm);
      setShowCreateModal(false);
      setCreateForm({
        full_name: "",
        gender: "Male",
        age: "",
        mobile: "",
        aadhaar: "",
        address: "",
        occupation: "",
        risk_score: 50,
      });

      // Reload list and navigate to new suspect
      const newId = res.data.person_id;
      fetchSuspects();
      if (newId) {
        setSelectedPersonId(newId);
        navigate(`/profile/${newId}`);
      }
    } catch (err) {
      console.error("Create suspect failed:", err);
      alert("Failed to register new suspect: " + (err.response?.data?.detail || err.message));
    }
  };

  // Open Edit Suspect Modal
  const openEditModal = () => {
    if (!profile?.person) return;
    const p = profile.person;
    setEditForm({
      full_name: p.full_name || "",
      gender: p.gender || "Male",
      age: p.age || "",
      mobile: p.mobile || "",
      aadhaar: p.aadhaar || "",
      address: p.address || "",
      occupation: p.occupation || "",
      risk_score: p.risk_score || 0,
    });
    setShowEditModal(true);
  };

  // Update Suspect Handler
  const handleUpdateSuspect = async (e) => {
    e.preventDefault();
    if (!selectedPersonId) return;
    try {
      await api.put(`/profile/${selectedPersonId}`, editForm);
      setShowEditModal(false);
      
      // Reload profile & list
      setLoadingDetails(true);
      const res = await api.get(`/profile/${selectedPersonId}`);
      setProfile(res.data);
      setLoadingDetails(false);
      fetchSuspects();
    } catch (err) {
      console.error("Update suspect failed:", err);
      alert("Failed to update suspect profile: " + (err.response?.data?.detail || err.message));
    }
  };

  // Delete Suspect Handler
  const handleDeleteSuspect = async () => {
    if (!selectedPersonId || !profile?.person) return;
    const name = profile.person.full_name || `Suspect #${selectedPersonId}`;
    if (!window.confirm(`Are you sure you want to delete suspect record "${name}" from database?`)) return;

    try {
      await api.delete(`/profile/${selectedPersonId}`);
      fetchSuspects();
      if (suspectsList.length > 1) {
        const next = suspectsList.find(s => s.person_id !== selectedPersonId);
        if (next) {
          setSelectedPersonId(next.person_id);
          navigate(`/profile/${next.person_id}`);
        }
      }
    } catch (err) {
      console.error("Delete suspect failed:", err);
      alert("Failed to delete suspect: " + (err.response?.data?.detail || err.message));
    }
  };

  const p = profile?.person;
  const stats = profile?.stats || { total_cases: 0, total_arrests: 0, total_associates: 0, total_vehicles: 0, total_phones: 0 };

  return (
    <Layout>
      <div className="flex h-full gap-6 overflow-hidden select-none">
        
        {/* Left Column: Suspect Index List Panel */}
        <div className="w-80 bg-white border border-slate-150 rounded-2xl flex flex-col h-full shadow-soft shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">SUSPECT REGISTRY</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <UserPlus size={12} />
                <span>+ New Suspect</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search name, mobile, aadhaar..."
                className="w-full bg-white border border-slate-200 focus:border-primary rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none transition shadow-sm placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/10">
            {loadingList ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Loading suspect records...</div>
            ) : suspectsList.length > 0 ? (
              suspectsList.map((s) => (
                <button
                  key={s.person_id}
                  onClick={() => {
                    setSelectedPersonId(s.person_id);
                    navigate(`/profile/${s.person_id}`);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition duration-200 text-xs ${
                    selectedPersonId === s.person_id
                      ? "bg-amber-500/5 border-amber-500/20 text-amber-900 shadow-sm font-semibold"
                      : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-bold text-xs ${selectedPersonId === s.person_id ? "text-amber-700" : "text-slate-800"}`}>
                      {s.full_name}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                      (s.risk_score || 0) >= 85 ? "bg-red-100 text-red-700" : (s.risk_score || 0) >= 60 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {s.risk_score || 0}% RISK
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>{s.mobile || "No Mobile"}</span>
                    <span className="truncate max-w-[100px]">{s.address || "HQ Unit"}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">No matching suspects found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Suspect 360° Profile Details */}
        <div className="flex-1 bg-white border border-slate-150 rounded-2xl flex flex-col h-full shadow-soft overflow-hidden">
          {loadingDetails ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-amber-500 animate-spin"></div>
              <p className="text-slate-400 text-xs font-semibold">Retrieving suspect 360° dossier...</p>
            </div>
          ) : profile && p ? (
            <div className="flex-grow flex flex-col h-full overflow-hidden p-6 space-y-5">
              
              {/* Suspect Header Banner */}
              <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl font-black text-amber-600 shadow-inner shrink-0">
                    {(p.full_name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                      <h1 className="text-lg font-black text-slate-800 tracking-tight">{p.full_name}</h1>
                      <RiskBadge score={p.risk_score} />
                    </div>
                    <p className="text-slate-500 text-xs font-medium">
                      {p.gender || "Unknown Gender"} · {p.age ? `${p.age} yrs` : "Age N/A"} · <MapPin size={12} className="inline text-slate-400" /> {p.address || "No Address Catalogued"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 mt-1 font-medium">
                      <span><strong>Mobile:</strong> {p.mobile || "N/A"}</span>
                      <span><strong>Aadhaar:</strong> {p.aadhaar || "N/A"}</span>
                      <span><strong>Occupation:</strong> {p.occupation || "N/A"}</span>
                      <span className="font-mono text-slate-400">INTEL ID: {p.person_id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <UserPlus size={13} /> <span>+ Create New</span>
                  </button>

                  <button
                    onClick={openEditModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Pencil size={13} /> <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={handleDeleteSuspect}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 size={13} /> <span>Delete</span>
                  </button>

                  <Link
                    to={`/network?person_id=${p.person_id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition border border-slate-200"
                  >
                    <Share2 size={13} /> <span>Link Map</span>
                  </Link>
                </div>
              </div>

              {/* Metrics Counter cards row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "FIR Cases Linked", value: stats.total_cases, color: "text-blue-600 bg-blue-50" },
                  { label: "Arrests Registered", value: stats.total_arrests, color: "text-red-600 bg-red-50" },
                  { label: "Known Associates", value: stats.total_associates, color: "text-amber-600 bg-amber-50" },
                  { label: "Vehicles Tagged", value: stats.total_vehicles, color: "text-purple-600 bg-purple-50" },
                  { label: "Phones Tracked", value: stats.total_phones, color: "text-teal-600 bg-teal-50" },
                ].map((s, idx) => (
                  <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-3 text-center shadow-soft flex flex-col justify-between h-[75px]">
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">{s.label}</div>
                    <div className={`mx-auto text-lg font-black rounded-lg px-2.5 py-0.5 mt-1 ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Dossier Tabs Container */}
              <div className="flex-1 bg-white border border-slate-150 rounded-3xl overflow-hidden flex flex-col shadow-soft min-h-[350px]">
                {/* Tab Bar */}
                <div className="flex border-b border-slate-150 bg-slate-50/50 p-2 overflow-x-auto whitespace-nowrap shrink-0 gap-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                        activeTab === tab.id
                          ? "bg-white text-amber-600 border border-slate-200/50 shadow-sm"
                          : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                      }`}
                    >
                      {tab.icon} <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-grow p-5 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Overview */}
                      {activeTab === "overview" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-1">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Personal Identity</h4>
                            <InfoRow label="Full Name" value={p.full_name} />
                            <InfoRow label="Gender" value={p.gender} />
                            <InfoRow label="Age" value={p.age ? `${p.age} Years` : null} />
                            <InfoRow label="Mobile Contact" value={p.mobile} />
                            <InfoRow label="Primary Email" value={p.email} />
                          </div>

                          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-1">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">National Identifiers & Location</h4>
                            <InfoRow label="Aadhaar Card" value={p.aadhaar} />
                            <InfoRow label="PAN Number" value={p.pan} />
                            <InfoRow label="Passport" value={p.passport} />
                            <InfoRow label="Occupation" value={p.occupation} />
                            <InfoRow label="Known Address" value={p.address} />
                          </div>
                        </div>
                      )}

                      {/* Phones */}
                      {activeTab === "phones" && (
                        <div className="space-y-3">
                          {profile.phones && profile.phones.length > 0 ? (
                            profile.phones.map((ph, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Phone size={16} className="text-teal-600" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{ph.phone_number}</p>
                                    <p className="text-[10px] text-slate-400">Carrier: {ph.service_provider || "Cellular Provider"}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono bg-white px-2 py-0.5 rounded border text-slate-500">IMEI: {ph.imei || "Registered"}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">No mobile assets linked.</div>
                          )}
                        </div>
                      )}

                      {/* Vehicles */}
                      {activeTab === "vehicles" && (
                        <div className="space-y-3">
                          {profile.vehicles && profile.vehicles.length > 0 ? (
                            profile.vehicles.map((v, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Car size={16} className="text-purple-600" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{v.registration_number}</p>
                                    <p className="text-[10px] text-slate-400">{v.model} ({v.color})</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">No registered automobiles.</div>
                          )}
                        </div>
                      )}

                      {/* Criminal History */}
                      {activeTab === "history" && (
                        <div className="space-y-3">
                          {profile.criminal_history && profile.criminal_history.length > 0 ? (
                            profile.criminal_history.map((h, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl">
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                                  <span>ARREST DATE: {h.arrest_date || "Logged"}</span>
                                  <span className="text-red-600 font-black">FIR REF #{h.case_id}</span>
                                </div>
                                <p className="text-xs text-slate-700 font-semibold">{h.charges || "Registered offence charges"}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">No historical arrest records.</div>
                          )}
                        </div>
                      )}

                      {/* Known Associates */}
                      {activeTab === "associates" && (
                        <div className="space-y-3">
                          {profile.associates && profile.associates.length > 0 ? (
                            profile.associates.map((a, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Users size={16} className="text-amber-600" />
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{a.associate_name}</p>
                                    <p className="text-[10px] text-slate-400">Relationship: {a.relationship_type || "Co-Accused"}</p>
                                  </div>
                                </div>
                                <Link to={`/profile/${a.other_person_id}`} className="text-[10px] font-bold text-blue-600 hover:underline">
                                  View Associate File
                                </Link>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">No co-accused associates mapped.</div>
                          )}
                        </div>
                      )}

                      {/* Linked Cases */}
                      {activeTab === "cases" && (
                        <div className="space-y-3">
                          {profile.cases && profile.cases.length > 0 ? (
                            profile.cases.map((c, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{c.fir_number} — {c.crime_type}</p>
                                  <p className="text-[10px] text-slate-400">{c.police_station}, {c.district}</p>
                                </div>
                                <Link to={`/cases?case_id=${c.case_id}`} className="text-[10px] font-bold text-primary hover:underline">
                                  Open Case File
                                </Link>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">No FIR cases linked.</div>
                          )}
                        </div>
                      )}

                      {/* Evidence */}
                      {activeTab === "evidence" && (
                        <div className="space-y-3">
                          {profile.evidence && profile.evidence.length > 0 ? (
                            profile.evidence.map((ev, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl">
                                <p className="text-xs font-bold text-slate-800">{ev.description}</p>
                                <p className="text-[10px] text-slate-400 mt-1">Repository: {ev.secure_location || "Vault"}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">No forensic evidence items logged.</div>
                          )}
                        </div>
                      )}

                      {/* Financial */}
                      {activeTab === "financial" && (
                        <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border rounded-2xl">
                          No flagged bank accounts or frozen assets on file.
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-slate-400 text-xs">
              Select a suspect from the registry index to view full intelligence file.
            </div>
          )}
        </div>

      </div>

      {/* Create Suspect Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-white">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <UserPlus size={18} className="text-emerald-400" />
              Register New Suspect Profile
            </h3>

            <form onSubmit={handleCreateSuspect} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Kumar"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={createForm.mobile}
                    onChange={(e) => setCreateForm({ ...createForm, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Aadhaar Card</label>
                  <input
                    type="text"
                    placeholder="12-digit Aadhaar"
                    value={createForm.aadhaar}
                    onChange={(e) => setCreateForm({ ...createForm, aadhaar: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="Age"
                    value={createForm.age}
                    onChange={(e) => setCreateForm({ ...createForm, age: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Gender</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Threat Risk Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={createForm.risk_score}
                    onChange={(e) => setCreateForm({ ...createForm, risk_score: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Occupation / Alias</label>
                <input
                  type="text"
                  placeholder="e.g. Local Trader / Known Alias"
                  value={createForm.occupation}
                  onChange={(e) => setCreateForm({ ...createForm, occupation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Last Known Address</label>
                <input
                  type="text"
                  placeholder="Residential or hideout address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 cursor-pointer"
                >
                  Register Suspect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Suspect Modal */}
      {showEditModal && profile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-white">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Pencil size={18} className="text-blue-400" />
              Edit Suspect Profile — {profile.person.full_name}
            </h3>

            <form onSubmit={handleUpdateSuspect} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Aadhaar Card</label>
                  <input
                    type="text"
                    value={editForm.aadhaar}
                    onChange={(e) => setEditForm({ ...editForm, aadhaar: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Risk Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.risk_score}
                    onChange={(e) => setEditForm({ ...editForm, risk_score: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Occupation / Alias</label>
                <input
                  type="text"
                  value={editForm.occupation}
                  onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Last Known Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
