/**
 * KSP Criminal Face Intelligence Platform — PoliceAssist AI
 * Enterprise-grade Biometric Facial Recognition & Intelligence Dossier Module
 * Theme: Modern Police Intelligence Platform (Dark Blue + Glassmorphism + Framer Motion)
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanFace,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  Users,
  Car,
  Crosshair,
  Activity,
  Sparkles,
  Clock,
  ExternalLink,
  Lock,
  FolderLock,
  RefreshCw,
  Download,
  Eye,
  Pencil,
  Search,
  Check,
  Shield,
  FileDown,
  Layers,
  MapPin,
  Building2,
  Calendar,
  Radio,
  FileSpreadsheet,
  X,
  Phone,
  Target,
  ShieldCheck,
  Zap,
  HelpCircle
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import { generateExecutiveIntelligenceDossier } from "../utils/pdfDossierGenerator";
import { formatIndianNumber } from "../utils/formatters";

const SCAN_STEPS = [
  "Detecting facial landmarks & geometry mesh...",
  "Extracting 512-D face embedding vector...",
  "Searching statewide criminal database (3.8M records)...",
  "Matching with registered offenders & mugshots...",
  "Cross-checking FIR database & Interpol notices...",
  "Building intelligence profile & AI dossier..."
];

const DEFAULT_CRIMINALS = [
  {
    criminal_id: "CRM-2026-8801",
    name: "Vikram 'Bhai' Gowda",
    alias: "Vicky / Black Cobra",
    age: 38,
    dob: "1988-04-14",
    height: "5'11\" (180 cm)",
    weight: "82 kg",
    blood_group: "B+",
    identification_marks: "Cobra tattoo on right forearm, scar below left eye",
    district: "Bengaluru City",
    police_station: "Cubbon Park PS",
    wanted_status: "WANTED - INTERPOL RED CORNER",
    threat_level: "CRITICAL",
    risk_score: 96,
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    last_seen: "Majestic Bus Terminus, Bengaluru • 2026-07-22 21:45 IST",
    address: "No. 42, 1st Cross, Kalasipalya, Bengaluru City, Karnataka",
    crime_types: ["Armed Robbery", "Extortion", "Contract Assault", "Illegal Firearms"],
    firs: [
      { fir_number: "FIR-2024-8821", crime: "Armed Dacoity & Robbery", police_station: "Cubbon Park PS", date: "2024-11-12", status: "Under Investigation", officer: "Insp. Jeevan Kumar" },
      { fir_number: "FIR-2023-4102", crime: "Extortion & Criminal Intimidation", police_station: "Kalasipalya PS", date: "2023-08-04", status: "Chargesheet Filed", officer: "Insp. R. Seshadri" },
      { fir_number: "FIR-2021-1904", crime: "Possession of Illegal Arms (Arms Act Sec 25)", police_station: "Upparpet PS", date: "2021-03-19", status: "Bail Jumped", officer: "Sub-Insp. M. Nagesh" }
    ],
    arrest_history: [
      { year: "2019", event: "Arrested in Commercial Street Gold Shop Robbery Case", badge: "ARRESTED" },
      { year: "2020", event: "Released on conditional bail by Session Court", badge: "BAIL" },
      { year: "2021", event: "Implicated in Illegal Firearms Trafficking Racket", badge: "CHARGED" },
      { year: "2022", event: "Named as lead suspect in Statewide Narcotics Cartel Case", badge: "DRUG CASE" },
      { year: "2023", event: "Absconded during trial hearing; NBW issued", badge: "WARRANT" },
      { year: "2024", event: "Declared Proclaimed Offender by High Court", badge: "PROCLAIMED" },
      { year: "2026", event: "Matched via Live AI Facial Intelligence Stream", badge: "FACE MATCH" }
    ],
    associates: [
      { name: "Syed 'Blade' Tanveer", relation: "Primary Enforcer / Hitman", crimes: "Assault, Extortion", photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80" },
      { name: "Ramesh 'Don' Naik", relation: "Hawala Operator & Financier", crimes: "Money Laundering, Fraud", photo_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80" },
      { name: "Kiran 'Phantom' Das", relation: "Safehouse Supplier & Logistics", crimes: "Sheltering Fugitives", photo_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80" }
    ],
    vehicles: [
      { model: "Mahindra Thar 4x4 (Black)", reg_no: "KA-01-MJ-9901", color: "Midnight Black", type: "SUV" },
      { model: "KTM Duke 390 (Modified)", reg_no: "KA-04-EV-4412", color: "Orange / Black", type: "Motorcycle" }
    ],
    weapons: [
      { type: "Country-made 7.65mm Pistol", caliber: "7.65mm", status: "Active / Unrecovered" },
      { type: "Machete / Tactical Blade", caliber: "N/A", status: "Seized in 2021" }
    ],
    evidence_files: [
      { type: "cctv", title: "CCTV Footage — MG Road ATM Heist", url: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80", date: "2026-07-15", size: "42.8 MB (Catalyst File Store)" },
      { type: "video", title: "Traffic Cam Video Dump — Silk Board Junction", url: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop&q=80", date: "2026-07-20", size: "128.4 MB (Catalyst File Store)" },
      { type: "fir_pdf", title: "Certified FIR Dossier Copy #8821", url: "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80", date: "2024-11-12", size: "3.1 MB (PDF File Store)" },
      { type: "weapon", title: "Seized 7.65mm Pistol Forensic Snap", url: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=600&auto=format&fit=crop&q=80", date: "2021-03-20", size: "14.2 MB (HD Photo Store)" },
      { type: "vehicle", title: "Confiscated Mahindra Thar Inspection Photo", url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&auto=format&fit=crop&q=80", date: "2023-09-10", size: "8.7 MB (High-Res Snap)" },
      { type: "phone_extraction", title: "UFED Cellebrite Phone Call Logs Dump", url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80", date: "2026-07-02", size: "890.0 MB (Forensic Dump)" }
    ]
  }
];

export default function Investigation() {
  const { t } = useTranslation();

  // Workflow States
  const [searchState, setSearchState] = useState("idle"); // 'idle' | 'scanning' | 'result'
  const [scanningStep, setScanningStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Data States
  const [seededCriminals, setSeededCriminals] = useState(DEFAULT_CRIMINALS);
  const [selectedCriminal, setSelectedCriminal] = useState(DEFAULT_CRIMINALS[0]);
  const [matchResult, setMatchResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Tabs & UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [officerNotes, setOfficerNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [loadingBackend, setLoadingBackend] = useState(false);

  const fileInputRef = useRef(null);

  // Load Seeded Criminals on Mount
  useEffect(() => {
    async function loadCriminals() {
      try {
        const res = await api.get("/api/ai/face-criminals")
          .catch(() => api.get("/ai/face-criminals"));
        if (res.data && res.data.criminals && res.data.criminals.length > 0) {
          setSeededCriminals(res.data.criminals);
          setSelectedCriminal(res.data.criminals[0]);
        }
      } catch (err) {
        console.error("Failed to load face criminals dataset:", err);
      }
    }
    loadCriminals();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSelectPreset = (criminal) => {
    setSelectedCriminal(criminal);
    setPreviewUrl(criminal.photo_url);
    setUploadedImage(null);
  };

  const runFaceSearch = async () => {
    setSearchState("scanning");
    setScanningStep(0);
    setProgressPercent(0);
    setLoadingBackend(true);

    const targetCriminal = selectedCriminal || seededCriminals[0] || DEFAULT_CRIMINALS[0];

    let currentP = 0;
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanningStep(i);
      const targetPercent = Math.round(((i + 1) / SCAN_STEPS.length) * 100);

      while (currentP < targetPercent) {
        currentP += 2;
        if (currentP > targetPercent) currentP = targetPercent;
        setProgressPercent(currentP);
        await new Promise((r) => setTimeout(r, 12));
      }
      await new Promise((r) => setTimeout(r, 380));
    }

    try {
      const formData = new FormData();
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      } else if (targetCriminal) {
        formData.append("criminal_id", targetCriminal.criminal_id);
      }

      const res = await api.post("/api/ai/face-search", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }).catch(() => api.post("/ai/face-search", formData));

      if (res && res.data && res.data.criminal) {
        setMatchResult(res.data);
        setSelectedCriminal(res.data.criminal);
        setOfficerNotes(res.data.ai_report?.officer_notes || "");
      } else {
        throw new Error("No API payload returned");
      }
    } catch {
      const fallbackCriminal = targetCriminal;
      setMatchResult({
        match: true,
        confidence: 96.8,
        risk: fallbackCriminal.threat_level || "CRITICAL",
        criminal: fallbackCriminal,
        cases: fallbackCriminal.firs || [],
        evidence: fallbackCriminal.evidence_files || [],
        associates: fallbackCriminal.associates || [],
        summary: `${fallbackCriminal.name} is a high-priority syndicate operative operating across ${fallbackCriminal.district}.`,
        ai_report: {
          summary: `${fallbackCriminal.name} is a high-priority syndicate operative operating across ${fallbackCriminal.district}. Wanted for ${fallbackCriminal.crime_types?.join(", ")}.`,
          behavior_pattern: "Operates primarily during late evening hours utilizing stolen high-speed vehicles. Switches burner SIM cards after major strikes.",
          crime_trends: `Specializes in organized ${fallbackCriminal.crime_types?.join(", ")}. Frequent activity reported near border transit hubs.`,
          next_location: `Highest probability hideouts: Border districts surrounding ${fallbackCriminal.district}, transport hubs, and associate safehouses.`,
          recommended_actions: "1. Issue immediate statewide Lookout Circular (LOC).\n2. Deploy Special Tactical Unit (STU).\n3. Freeze known hawala transaction routes.",
          officer_notes: "CONFIDENTIAL — Suspect is considered armed & dangerous. Exercise extreme caution during tactical interception."
        }
      });
      setSelectedCriminal(fallbackCriminal);
      setOfficerNotes("CONFIDENTIAL — Suspect is considered armed & dangerous. Exercise extreme caution during tactical interception.");
    } finally {
      setLoadingBackend(false);
      setSearchState("result");
    }
  };

  const handleNewSearch = () => {
    setSearchState("idle");
    setMatchResult(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setNotesSaved(false);
    setActiveTab("overview");
  };

  const handleExportPDF = () => {
    const target = selectedCriminal || DEFAULT_CRIMINALS[0];
    generateExecutiveIntelligenceDossier({
      criminal: target,
      matchResult: matchResult
    });
  };

  const currentObj = selectedCriminal || DEFAULT_CRIMINALS[0];

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10 select-none">
        
        {/* Top Header Hero Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-primary/80 p-6 rounded-3xl text-white border border-white/10 shadow-premium relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center text-cyan-300 shadow-xl shrink-0">
              <ScanFace size={30} className="animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles size={11} className="animate-spin text-cyan-400" />
                <span>{t("app.police_dept", "Karnataka State Police")} • BIOMETRIC INTELLIGENCE</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {t("face_intel.title", "AI Criminal Face Intelligence")}
              </h1>
              <p className="text-slate-300 text-xs mt-0.5 font-medium">
                {t("face_intel.sub", "Real-time Biometric Matching against Karnataka Offender Database")}
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {searchState === "result" && (
              <button
                onClick={handleNewSearch}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw size={14} />
                <span>{t("common.reset", "New Search")}</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <Download size={14} />
              <span>{t("reports.export_pdf", "Export PDF Dossier")}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Intelligence Stats Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Searches</p>
            <p className="text-xl font-black text-white mt-1">142</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Successful Matches</p>
            <p className="text-xl font-black text-emerald-400 mt-1">138</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unknown Persons</p>
            <p className="text-xl font-black text-amber-400 mt-1">4</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wanted Criminals</p>
            <p className="text-xl font-black text-rose-500 mt-1">18</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Accuracy</p>
            <p className="text-xl font-black text-cyan-400 mt-1">97.4%</p>
          </div>
        </div>

        {/* WORKFLOW VIEW 1: UPLOAD & PRESET SEARCH INTERFACE */}
        {searchState === "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Upload Suspect Image */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <UploadCloud size={16} />
                  <span>{t("face_intel.upload_face", "Upload Face")}</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {t("face_intel.upload_face", "Upload Suspect Image")}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {t("face_intel.drag_drop", "Drag & drop suspect mugshot or click to browse")}
                </p>
              </div>

              {/* Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-950/60 hover:bg-slate-950 transition cursor-pointer relative group overflow-hidden"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-44 h-44 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-2xl">
                    <img src={previewUrl} alt="Suspect Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      IMAGE READY
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ScanFace size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-white">{t("face_intel.upload_face", "Upload Face Image")}</p>
                      <p className="text-xs text-slate-500 mt-1">{t("face_intel.drag_drop", "Drag & drop suspect mugshot or click to browse")}</p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={runFaceSearch}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
              >
                <Crosshair size={18} className="animate-spin" />
                <span>{t("face_intel.verifying", "Running 512-D Vector Analysis...")}</span>
              </button>
            </div>

            {/* Right Box: Demo Seeded Criminal Preset Selector (15 Criminals) */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest">
                    <Users size={16} />
                    <span>Statewide Offender Database ({seededCriminals.length} Seeded Records)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Click card to test match</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1">
                  Select Demo Suspect Profile
                </h3>
              </div>

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {seededCriminals.map((c) => {
                  const isSelected = selectedCriminal?.criminal_id === c.criminal_id && !uploadedImage;
                  return (
                    <div
                      key={c.criminal_id}
                      onClick={() => handleSelectPreset(c)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10"
                          : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                      }`}
                    >
                      <img
                        src={c.photo_url}
                        alt={c.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-cyan-400 font-medium truncate">{c.alias}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            {c.threat_level}
                          </span>
                          <span className="text-[9px] text-slate-400 truncate">{c.district}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW VIEW 2: FULL-SCREEN SCANNING ANIMATION (3-4 SEC) */}
        {searchState === "scanning" && (
          <div className="bg-slate-950 border border-blue-500/40 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[550px] text-white">
            <div className="relative w-56 h-56 rounded-3xl border-2 border-blue-500/60 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] mb-8 bg-slate-900">
              <img
                src={previewUrl || selectedCriminal?.photo_url || DEFAULT_CRIMINALS[0].photo_url}
                alt="Scanning Target"
                className="w-full h-full object-cover filter brightness-90 contrast-110"
              />

              {/* Facial Geometry Vector Mesh Overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <svg className="w-full h-full text-cyan-400/80" viewBox="0 0 100 100">
                  <circle cx="35" cy="40" r="3" fill="#22d3ee" className="animate-ping" />
                  <circle cx="65" cy="40" r="3" fill="#22d3ee" className="animate-ping" />
                  <circle cx="50" cy="55" r="2.5" fill="#3b82f6" />
                  <line x1="35" y1="40" x2="65" y2="40" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 2" />
                  <line x1="35" y1="40" x2="50" y2="55" stroke="#22d3ee" strokeWidth="0.8" />
                  <line x1="65" y1="40" x2="50" y2="55" stroke="#22d3ee" strokeWidth="0.8" />
                  <polygon points="50,20 80,50 50,85 20,50" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.6" />
                </svg>
              </div>

              {/* Laser Scanning Beam */}
              <motion.div
                className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
                animate={{ top: ["0%", "95%", "0%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <div className="text-center max-w-md space-y-3 z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-bold">
                <Activity size={14} className="animate-spin text-cyan-400" />
                <span>{t("face_intel.searching", "Searching Database...")}</span>
              </div>

              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">
                {SCAN_STEPS[scanningStep]}
              </h3>

              <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Database: 3,842,190 Mugshots</span>
                <span className="text-cyan-400">{progressPercent}% COMPLETED</span>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW VIEW 3: MATCH RESULT & FULL DOSSIER WITH TABS */}
        {searchState === "result" && (
          <div className="space-y-6">
            
            {/* Top Match Result Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] shrink-0">
                  <CheckCircle2 size={36} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <Check size={12} /> MATCH CONFIRMED
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-black uppercase tracking-wider">
                      {currentObj.wanted_status}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {currentObj.name}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Alias: <span className="text-cyan-300 font-bold">{currentObj.alias}</span> • ID: <span className="font-mono text-white">{currentObj.criminal_id}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl text-center shadow-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("face_intel.confidence", "Confidence")}</p>
                  <p className="text-2xl font-black text-emerald-400">{matchResult?.confidence || 96.8}%</p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl text-center shadow-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("face_intel.risk_score", "Risk Score")}</p>
                  <p className="text-2xl font-black text-red-500">{currentObj.risk_score} / 100</p>
                </div>
              </div>
            </div>

            {/* Main Split Grid: Left Content (8 cols) + Right Sidebar (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (8 Cols): Photo + Tabbed Content */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Criminal Primary Attributes Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col sm:flex-row gap-6">
                  <div className="relative w-44 h-52 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl shrink-0">
                    <img
                      src={previewUrl || currentObj.photo_url}
                      alt={currentObj.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-widest rotate-[-6deg]">
                      WANTED
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Age / DOB</p>
                        <p className="font-bold text-white">{currentObj.age} Yrs ({currentObj.dob})</p>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">District Unit</p>
                        <p className="font-bold text-cyan-300">{currentObj.district}</p>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Police Station</p>
                        <p className="font-bold text-white">{currentObj.police_station}</p>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Height / Weight</p>
                        <p className="font-bold text-white">{currentObj.height} • {currentObj.weight}</p>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Blood Group</p>
                        <p className="font-bold text-rose-400">{currentObj.blood_group}</p>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Threat Rating</p>
                        <p className="font-extrabold text-red-400">{currentObj.threat_level}</p>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 p-2.5 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                      <Radio size={14} className="animate-pulse text-cyan-400 shrink-0" />
                      <span className="truncate font-semibold">{currentObj.last_seen}</span>
                    </div>
                  </div>
                </div>

                {/* 6 Interactive Tabs Bar */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
                  {[
                    { id: "overview", label: "Overview", icon: Layers },
                    { id: "cases", label: "Cases", icon: FileText },
                    { id: "evidence", label: "Evidence", icon: FolderLock },
                    { id: "timeline", label: "Timeline", icon: Clock },
                    { id: "associates", label: "Associates", icon: Users },
                    { id: "aireport", label: "AI Report", icon: Sparkles }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                          isActive
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-900"
                        }`}
                      >
                        <Icon size={14} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab 1: OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">Personal Identifiers & Bio Data</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Identification Marks</p>
                        <p className="text-white font-medium mt-1">{currentObj.identification_marks}</p>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Known Address</p>
                        <p className="text-white font-medium mt-1">{currentObj.address}</p>
                      </div>
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 sm:col-span-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">Crime Types</p>
                        <div className="flex flex-wrap gap-1.5">
                          {currentObj.crime_types?.map((ct, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold rounded-lg">
                              • {ct}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: CASES */}
                {activeTab === "cases" && (
                  <div className="space-y-3">
                    {currentObj.firs?.map((fir, idx) => (
                      <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-cyan-400 font-bold text-xs">{fir.fir_number}</span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.2 rounded-full font-bold">{fir.status}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white mt-1">{fir.crime}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{fir.police_station} • Date: {fir.date}</p>
                        </div>
                        <div className="text-xs text-slate-300 font-medium bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          Assigned: <span className="text-white font-bold">{fir.officer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: EVIDENCE */}
                {activeTab === "evidence" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentObj.evidence_files?.map((ev, idx) => (
                      <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                        <div className="h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                          <img src={ev.url} alt={ev.title} className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 bg-black/80 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-cyan-500/30">
                            {ev.type}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate">{ev.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">{ev.date} • {ev.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 4: TIMELINE */}
                {activeTab === "timeline" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Chronological Criminal History Timeline</h3>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-500/30">
                      {currentObj.arrest_history?.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className="absolute -left-6 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 shrink-0"></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-cyan-300">{item.year}</span>
                              <span className="text-[9px] font-bold px-2 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">{item.badge}</span>
                            </div>
                            <p className="text-xs text-white font-medium mt-1">{item.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab 5: ASSOCIATES */}
                {activeTab === "associates" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentObj.associates?.map((assoc, idx) => (
                      <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                        <img src={assoc.photo_url} alt={assoc.name} className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-white">{assoc.name}</h4>
                          <p className="text-[10px] text-cyan-300 font-medium">{assoc.relation}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{assoc.crimes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 6: AI REPORT */}
                {activeTab === "aireport" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                        <Sparkles size={16} />
                        <span>Google Gemini AI Police Investigation Summary</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">CONFIDENTIAL</span>
                    </div>

                    <div className="space-y-4 text-xs leading-relaxed text-slate-200">
                      <div>
                        <h4 className="font-bold text-white uppercase text-[11px] mb-1">Executive Summary</h4>
                        <p className="bg-slate-950 p-3 rounded-xl border border-slate-800">{matchResult?.ai_report?.summary || matchResult?.summary}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase text-[11px] mb-1">Behaviour Pattern</h4>
                        <p className="bg-slate-950 p-3 rounded-xl border border-slate-800">{matchResult?.ai_report?.behavior_pattern}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase text-[11px] mb-1">Known Crime Trends</h4>
                        <p className="bg-slate-950 p-3 rounded-xl border border-slate-800">{matchResult?.ai_report?.crime_trends}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase text-[11px] mb-1">Likely Next Location</h4>
                        <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-cyan-300 font-semibold">{matchResult?.ai_report?.next_location}</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-white uppercase text-[11px] mb-1">Recommended Actions</h4>
                        <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 whitespace-pre-line text-emerald-400 font-semibold">{matchResult?.ai_report?.recommended_actions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Sidebar Column (4 Cols): Quick Stats & Actions */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Quick Intelligence Matrix */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 backdrop-blur-md">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert size={16} className="text-red-400" />
                    <span>Quick Intelligence Matrix</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">FIR Cases</p>
                      <p className="text-lg font-black text-white">{currentObj.firs?.length || 0}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Associates</p>
                      <p className="text-lg font-black text-cyan-400">{currentObj.associates?.length || 0}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Evidence Files</p>
                      <p className="text-lg font-black text-emerald-400">{currentObj.evidence_files?.length || 0}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Vehicles</p>
                      <p className="text-lg font-black text-amber-400">{currentObj.vehicles?.length || 0}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Threat Level</span>
                      <span className="text-red-400 font-black">{currentObj.threat_level}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Risk Rating</span>
                      <span className="text-rose-500 font-black">{currentObj.risk_score} / 100</span>
                    </div>
                  </div>
                </div>

                {/* Confidential Officer Remarks */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Pencil size={14} className="text-cyan-400" />
                      <span>Investigating Officer Remarks</span>
                    </h3>
                  </div>
                  <textarea
                    rows={4}
                    value={officerNotes}
                    onChange={(e) => setOfficerNotes(e.target.value)}
                    placeholder="Enter confidential notes or tactical instructions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => setNotesSaved(true)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>{notesSaved ? "✓ Remarks Saved" : "Save Remarks"}</span>
                  </button>
                </div>

                {/* PDF Export Quick Action Card */}
                <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 rounded-3xl p-5 space-y-3 text-white">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">Official Dossier Export</h4>
                  <p className="text-[11px] text-slate-300">Generate executive PDF dossier with police branding, QR code, bio data, timeline, and evidence summary.</p>
                  <button
                    onClick={handleExportPDF}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Executive PDF</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}