import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderLock, 
  Search, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  User, 
  Users, 
  Layers, 
  Car, 
  Share2, 
  History, 
  Clock, 
  Copy, 
  StickyNote, 
  AlertCircle,
  FileCheck,
  CheckSquare,
  Pencil,
  X,
  Phone,
  CreditCard
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const CRIME_TYPES = [
  "Theft / Larceny",
  "Robbery / Dacoity",
  "Cybercrime",
  "Homicide / Murder",
  "Assault / Bodily Harm",
  "Narcotics / NDPS",
  "Financial Fraud / Cheating",
  "Vehicle Theft",
  "Extortion",
  "IPC 354 (Molestation)",
  "IPC 302 (Murder)",
  "IPC 379 (Theft)",
  "IPC 279 (Rash Driving)",
  "Other Offence"
];

const DISTRICTS = [
  "Bengaluru City",
  "Mysuru City",
  "Mangaluru City",
  "Hubballi-Dharwad",
  "Belagavi",
  "Kalaburagi",
  "Shivamogga",
  "Ballari",
  "Davangere",
  "Tumakuru"
];

const CASE_STATUSES = [
  "Under Investigation",
  "Investigation",
  "Pending Chargesheet",
  "Under Trial",
  "Solved",
  "Closed"
];

export default function Cases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get("case_id");

  const [casesList, setCasesList] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [notes, setNotes] = useState("");
  const [similarCases, setSimilarCases] = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Modal edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    crime_type: "",
    district: "",
    police_station: "",
    case_status: "",
    case_description: "",
    // Complainant fields
    complainant_name: "",
    complainant_mobile: "",
    complainant_aadhaar: "",
    complainant_gender: "Male",
    complainant_age: "",
    complainant_address: "",
    // Accused fields
    accused_name: "",
    accused_mobile: "",
    accused_aadhaar: "",
    accused_gender: "Male",
    accused_age: "",
    accused_address: "",
  });

  // Load cases list
  useEffect(() => {
    api.get("/cases/")
      .then((res) => {
        setCasesList(res.data || []);
        setLoadingList(false);
        
        if (caseIdParam) {
          setSelectedCaseId(parseInt(caseIdParam));
        } else if (res.data && res.data.length > 0) {
          setSelectedCaseId(res.data[0].case_id);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoadingList(false);
      });
  }, [caseIdParam]);

  // Load case details on selection
  useEffect(() => {
    if (!selectedCaseId) return;
    setLoadingDetails(true);
    setSimilarCases(null);
    api.get(`/investigation/${selectedCaseId}`)
      .then((res) => {
        setCaseDetails(res.data);
        setLoadingDetails(false);
        const savedNotes = localStorage.getItem(`notes-${selectedCaseId}`) || "";
        setNotes(savedNotes);
      })
      .catch((err) => {
        console.error(err);
        setLoadingDetails(false);
      });
  }, [selectedCaseId]);

  // Lazy load similar cases when the similar tab is opened
  const loadSimilarCases = () => {
    if (!selectedCaseId || similarCases !== null) return;
    setLoadingSimilar(true);
    api.get(`/investigation/similar/${selectedCaseId}`)
      .then((res) => {
        setSimilarCases(res.data);
        setLoadingSimilar(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingSimilar(false);
        setSimilarCases({ similar_cases: [] });
      });
  };

  const saveNotes = () => {
    if (!selectedCaseId) return;
    localStorage.setItem(`notes-${selectedCaseId}`, notes);
    alert("Officer notes updated in secure local vault!");
  };

  // Open full edit modal prefilled with current case & suspect/complainant data
  const openEditDossierModal = () => {
    if (!caseDetails?.case) return;
    const c = caseDetails.case;
    const comp = caseDetails.complainants?.[0] || {};
    const acc = caseDetails.accused?.[0] || {};

    setEditFormData({
      crime_type: c.crime_type || "",
      district: c.district || "",
      police_station: c.police_station || "",
      case_status: c.case_status || "Under Investigation",
      case_description: c.case_description || c.brief_facts || "",
      complainant_name: comp.name || "",
      complainant_mobile: comp.mobile || comp.p_mobile || "",
      complainant_aadhaar: comp.p_aadhaar || "",
      complainant_gender: comp.gender || "Male",
      complainant_age: comp.age || "",
      complainant_address: comp.address || comp.p_address || "",
      accused_name: acc.name || "",
      accused_mobile: acc.p_mobile || "",
      accused_aadhaar: acc.p_aadhaar || "",
      accused_gender: acc.gender || "Male",
      accused_age: acc.age || "",
      accused_address: acc.address || acc.p_address || "",
    });
    setShowEditModal(true);
  };

  // Handle saving dossier updates
  const handleUpdateDossier = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    try {
      await api.put(`/api/cases/${selectedCaseId}`, editFormData)
        .catch(() => api.put(`/cases/${selectedCaseId}`, editFormData));
      setShowEditModal(false);
      
      // Reload case details and cases list
      setLoadingDetails(true);
      const res = await api.get(`/investigation/${selectedCaseId}`);
      setCaseDetails(res.data);
      setLoadingDetails(false);

      // Refresh list
      const listRes = await api.get("/cases/");
      setCasesList(listRes.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to update dossier details: " + (err.response?.data?.detail || err.message));
    }
  };

  const filteredCases = casesList.filter(
    (c) =>
      c.fir_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.crime_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.district && c.district.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const tabs = [
    { id: "overview", label: "Overview", icon: <FolderLock size={15} /> },
    { id: "accused", label: "Accused Suspects", icon: <ShieldAlert size={15} /> },
    { id: "victims", label: "Victims / Complainants", icon: <Users size={15} /> },
    { id: "evidence", label: "Evidence Vault", icon: <Layers size={15} /> },
    { id: "vehicles", label: "Vehicles Log", icon: <Car size={15} /> },
    { id: "timeline", label: "Investigation Timeline", icon: <Clock size={15} /> },
    { id: "similar", label: "Modus Operandi Fits", icon: <Copy size={15} /> },
    { id: "notes", label: "Officer Notes", icon: <StickyNote size={15} /> },
  ];

  return (
    <Layout>
      <div className="flex h-full gap-6 overflow-hidden select-none">
        
        {/* Left Column: Cases List Panel */}
        <div className="w-80 bg-white border border-slate-150 rounded-2xl flex flex-col h-full shadow-soft shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">FIR INDEX DOSSIERS</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search FIR, category, district..."
                className="w-full bg-white border border-slate-200 focus:border-primary rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none transition shadow-sm placeholder-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-slate-50/10">
            {loadingList ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Aggregating folders...</div>
            ) : filteredCases.length > 0 ? (
              filteredCases.map((c) => (
                <button
                  key={c.case_id}
                  onClick={() => {
                    setSelectedCaseId(c.case_id);
                    setSearchParams({ case_id: c.case_id });
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition duration-200 text-xs ${
                    selectedCaseId === c.case_id
                      ? "bg-primary/5 border-primary/20 text-primary shadow-sm font-semibold"
                      : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`font-bold text-xs ${selectedCaseId === c.case_id ? "text-primary" : "text-slate-800"}`}>
                      {c.fir_number}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {c.crime_date || "No date logged"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="truncate max-w-[120px]">{c.crime_type}</span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold text-[8px] uppercase tracking-wider">
                      {c.district || "KSP HQ"}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">No matching case folders found.</div>
            )}
          </div>
        </div>

        {/* Right Column: Case Dossier Details */}
        <div className="flex-1 bg-white border border-slate-150 rounded-2xl flex flex-col h-full shadow-soft overflow-hidden">
          {loadingDetails ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
              <p className="text-slate-400 text-xs font-medium">Fetching secure criminal records...</p>
            </div>
          ) : caseDetails ? (
            <div className="flex-grow flex flex-col h-full overflow-hidden">
              
              {/* Case Header Banner */}
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {caseDetails.case.crime_type}
                    </span>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">{caseDetails.case.fir_number}</h2>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium mt-2">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {caseDetails.case.police_station || "HQ Depot"}, {caseDetails.case.district || "KSP State"}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Registered on {caseDetails.case.crime_date || "Unknown Date"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={openEditDossierModal}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil size={14} />
                    <span>Edit Case & Suspect Data</span>
                  </button>

                  <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${
                    caseDetails.case.case_status === "Solved" || caseDetails.case.case_status === "Closed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    • {caseDetails.case.case_status || "Active Investigation"}
                  </span>
                </div>
              </div>

              {/* Glassmorphic Tabs bar */}
              <div className="flex gap-1 overflow-x-auto bg-slate-50/30 p-2 border-b border-slate-100 shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === "similar") loadSimilarCases();
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[10.5px] font-bold transition shrink-0 ${
                      activeTab === tab.id
                        ? "bg-white text-primary shadow-sm border border-slate-200/50"
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Workspace content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="h-full"
                  >
                    
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                      <div className="space-y-5">
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Brief Incident Summary</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {caseDetails.case.brief_facts || caseDetails.case.case_description || "No official incident transcript was registered for this case folder."}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-soft">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Officer in Charge</h4>
                            <div className="flex items-center gap-3">
                              <img
                                src={`https://ui-avatars.com/api/?name=${caseDetails.case.investigating_officer || "Officer"}&background=2563EB&color=fff&bold=true`}
                                alt="IO"
                                className="w-8 h-8 rounded-lg shadow-sm"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-800">{caseDetails.case.investigating_officer || "Insp. Unknown"}</p>
                                <p className="text-[9px] text-slate-400">Head Investigation Unit</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-soft flex flex-col justify-between">
                            <div>
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Legal Category</h4>
                              <p className="text-xs font-bold text-slate-800">{caseDetails.case.crime_type || "N/A"}</p>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-2 font-mono">ID ref: {caseDetails.case.case_id}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Accused Suspects Tab */}
                    {activeTab === "accused" && (
                      <div className="space-y-4">
                        {caseDetails.accused && caseDetails.accused.length > 0 ? (
                          caseDetails.accused.map((acc, index) => (
                            <div key={index} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-rose-500 font-extrabold text-lg shadow-sm">
                                  {acc.name ? acc.name.split(" ").map(n => n[0]).join("") : "S"}
                                </div>
                                <div>
                                  <Link to={`/profile/1`} className="text-xs font-black text-slate-800 hover:text-primary transition-colors flex items-center gap-1">
                                    <span>{acc.name}</span>
                                    <ChevronRight size={13} />
                                  </Link>
                                  <p className="text-[10px] text-slate-500 mt-1 font-medium">
                                    Age: {acc.age || "N/A"} | Gender: {acc.gender || "N/A"}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600 mt-1 font-medium">
                                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                                      <Phone size={11} className="text-blue-500" /> {acc.p_mobile || acc.mobile || "No Mobile"}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                                      <CreditCard size={11} className="text-emerald-500" /> Aadhaar: {acc.p_aadhaar || "Not Catalogued"}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 mt-1"><MapPin size={11} className="inline mr-1" />{acc.p_address || acc.address || "Address not catalogued"}</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-150 px-2.5 py-1 rounded-full shrink-0">
                                DANGER INDEX: HIGH
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">No suspects listed under this FIR case folder.</div>
                        )}
                      </div>
                    )}

                    {/* Victims / Complainants Tab */}
                    {activeTab === "victims" && (
                      <div className="space-y-4">
                        {caseDetails.complainants && caseDetails.complainants.length > 0 ? (
                          caseDetails.complainants.map((vic, index) => (
                            <div key={index} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-500">
                                  <User size={18} />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{vic.name}</p>
                                  <p className="text-[9px] text-slate-500 mt-1">Age: {vic.age || "N/A"} | Gender: {vic.gender || "N/A"}</p>
                                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600 mt-1 font-medium">
                                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                                      <Phone size={11} className="text-blue-500" /> {vic.p_mobile || vic.mobile || "No Mobile"}
                                    </span>
                                    <span className="flex items-center gap-1 text-slate-700 font-bold">
                                      <CreditCard size={11} className="text-emerald-500" /> Aadhaar: {vic.p_aadhaar || "Not Catalogued"}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 mt-0.5"><MapPin size={11} className="inline" /> {vic.p_address || vic.address || "N/A"}</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                Complainant
                              </span>
                            </div>
                          ))
                        ) : caseDetails.victims && caseDetails.victims.length > 0 ? (
                          caseDetails.victims.map((vic, index) => (
                            <div key={index} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center gap-4">
                              <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-500">
                                <User size={18} />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800">{vic.name}</p>
                                <p className="text-[9px] text-slate-400 mt-1">Age: {vic.age || "N/A"} | Gender: {vic.gender || "N/A"}</p>
                                <p className="text-[9px] text-slate-400"><MapPin size={11} className="inline" /> {vic.address || "N/A"}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">No complainant or victim logs associated with this case folder.</div>
                        )}
                      </div>
                    )}

                    {/* Evidence Tab */}
                    {activeTab === "evidence" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {caseDetails.evidence && caseDetails.evidence.length > 0 ? (
                          caseDetails.evidence.map((ev, index) => (
                            <div key={index} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft hover:shadow-premium transition-all duration-300">
                              <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-3">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 truncate max-w-[180px]">{ev.description}</h4>
                                  <p className="text-[9px] text-slate-400 mt-0.5">Logged: {ev.date_logged || "N/A"}</p>
                                </div>
                                <span className="bg-blue-50 text-blue-600 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase border border-blue-100">
                                  {ev.status || "Vaulted"}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 space-y-1">
                                <p><strong>Secure Repository:</strong> {ev.secure_location || "Central Locker"}</p>
                                <p><strong>Witness Chain:</strong> Verified Admin signature</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">No evidence items registered under this case folder.</div>
                        )}
                      </div>
                    )}

                    {/* Vehicles Tab */}
                    {activeTab === "vehicles" && (
                      <div className="space-y-4">
                        {caseDetails.vehicles && caseDetails.vehicles.length > 0 ? (
                          caseDetails.vehicles.map((v, index) => (
                            <div key={index} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                                  <Car size={18} />
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold text-slate-800">{v.registration_number}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{v.color || ""} {v.model || "Unknown Automobile"}</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-lg">
                                VALUE: {v.value ? `₹${v.value}` : "N/A"}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">No vehicles tagged in this investigation dossier.</div>
                        )}
                      </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === "timeline" && (
                      <div className="relative border-l border-slate-150 pl-6 ml-3 space-y-6 py-2">
                        {caseDetails.timeline && caseDetails.timeline.length > 0 ? (
                          caseDetails.timeline.map((tl, index) => (
                            <div key={index} className="relative">
                              <span className="absolute -left-[30px] top-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                              </span>
                              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 shadow-sm">
                                <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 border-b border-slate-100 pb-1 mb-2">
                                  <span>{tl.date || "Date logged"}</span>
                                  <span className="text-primary font-semibold">STAGE: ACTIVE</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-normal font-medium">{tl.action}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">No chronological actions logged for this timeline.</div>
                        )}
                      </div>
                    )}

                    {/* Similar Cases Tab */}
                    {activeTab === "similar" && (
                      <div className="space-y-4">
                        {loadingSimilar ? (
                          <div className="text-center py-8 text-xs text-slate-400 font-medium">Matching modus operandi metrics...</div>
                        ) : similarCases && similarCases.similar_cases && similarCases.similar_cases.length > 0 ? (
                          similarCases.similar_cases.map((sim, index) => (
                            <div key={index} className="bg-white border border-slate-150 p-4 rounded-2xl shadow-soft flex items-center justify-between gap-4 hover:border-primary/20 transition-all">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-primary/5 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">{sim.crime_type}</span>
                                  <span className="font-bold text-slate-800 text-xs">{sim.fir_number}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">{sim.district || "HQ Unit"} | Registered on {sim.crime_date}</p>
                              </div>
                              <Link
                                to={`/cases?case_id=${sim.case_id}`}
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 px-3 py-1.5 rounded-xl transition"
                              >
                                View File
                              </Link>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl">No similar cases found in this district.</div>
                        )}
                      </div>
                    )}

                    {/* Officer Notes Tab */}
                    {activeTab === "notes" && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidential Investigation Memo</label>
                          <textarea
                            rows={8}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Write secure tactical details, suspect grids, search leads and private logs. Autosaved locally on this terminal..."
                            className="w-full bg-slate-50 border border-slate-200 focus:border-primary focus:outline-none rounded-2xl p-4 text-xs text-slate-700 leading-relaxed font-medium shadow-inner"
                          />
                        </div>
                        <button
                          onClick={saveNotes}
                          className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-transform hover:scale-[1.02]"
                        >
                          Lock Memo Notes
                        </button>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-slate-400 text-xs">
              Select a case dossier from index panel to retrieve files.
            </div>
          )}
        </div>

      </div>

      {/* Edit Dossier Full Modal */}
      {showEditModal && caseDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto text-white">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Pencil size={18} className="text-blue-400" />
              Edit Case Dossier — {caseDetails.case.fir_number}
            </h3>

            <form onSubmit={handleUpdateDossier} className="space-y-4 text-xs">
              {/* SECTION 1: FIR & Incident Details */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">1. Incident & FIR Meta</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Crime Type / Offence Head</label>
                    <select
                      value={editFormData.crime_type}
                      onChange={(e) => setEditFormData({ ...editFormData, crime_type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {CRIME_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Investigation Status</label>
                    <select
                      value={editFormData.case_status}
                      onChange={(e) => setEditFormData({ ...editFormData, case_status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {CASE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">District</label>
                    <select
                      value={editFormData.district}
                      onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Police Station</label>
                    <input
                      type="text"
                      value={editFormData.police_station}
                      onChange={(e) => setEditFormData({ ...editFormData, police_station: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Brief Incident Summary / Facts</label>
                  <textarea
                    rows={3}
                    value={editFormData.case_description}
                    onChange={(e) => setEditFormData({ ...editFormData, case_description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  ></textarea>
                </div>
              </div>

              {/* SECTION 2: Complainant Information */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">2. Complainant & Victim Info</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Complainant Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={editFormData.complainant_name}
                      onChange={(e) => setEditFormData({ ...editFormData, complainant_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={editFormData.complainant_mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, complainant_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar"
                      value={editFormData.complainant_aadhaar}
                      onChange={(e) => setEditFormData({ ...editFormData, complainant_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Age</label>
                    <input
                      type="number"
                      placeholder="Age"
                      value={editFormData.complainant_age}
                      onChange={(e) => setEditFormData({ ...editFormData, complainant_age: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Gender</label>
                    <select
                      value={editFormData.complainant_gender}
                      onChange={(e) => setEditFormData({ ...editFormData, complainant_gender: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="Full residential address"
                    value={editFormData.complainant_address}
                    onChange={(e) => setEditFormData({ ...editFormData, complainant_address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* SECTION 3: Accused Suspect Information */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">3. Accused Suspect Info</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Suspect Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Gowda"
                      value={editFormData.accused_name}
                      onChange={(e) => setEditFormData({ ...editFormData, accused_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9988776655"
                      value={editFormData.accused_mobile}
                      onChange={(e) => setEditFormData({ ...editFormData, accused_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar"
                      value={editFormData.accused_aadhaar}
                      onChange={(e) => setEditFormData({ ...editFormData, accused_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Age</label>
                    <input
                      type="number"
                      placeholder="Age"
                      value={editFormData.accused_age}
                      onChange={(e) => setEditFormData({ ...editFormData, accused_age: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Gender</label>
                    <select
                      value={editFormData.accused_gender}
                      onChange={(e) => setEditFormData({ ...editFormData, accused_gender: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Known Address / Hideout</label>
                  <input
                    type="text"
                    placeholder="Last known address or location"
                    value={editFormData.accused_address}
                    onChange={(e) => setEditFormData({ ...editFormData, accused_address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
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
                  Save All Dossier Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}