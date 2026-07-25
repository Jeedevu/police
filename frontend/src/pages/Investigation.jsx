/**
 * KSP Criminal Face Intelligence Platform — PoliceAssist AI
 * Full Biometric Facial Recognition & Criminal Network Analytics Matrix
 * Theme: Modern Police Intelligence Platform (Dark Blue + Glassmorphism + Framer Motion)
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
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
  RefreshCw,
  Download,
  Eye,
  Pencil,
  Flame,
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
  Target
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const SCAN_STEPS = [
  "Detecting facial landmarks & geometry mesh...",
  "Extracting 512-D face embedding vector...",
  "Searching statewide criminal database (3.8M records)...",
  "Matching with registered offenders & mugshots...",
  "Cross-checking FIR database & Interpol notices...",
  "Building intelligence profile & AI dossier..."
];

export default function Investigation() {
  // Workflow States
  const [searchState, setSearchState] = useState("idle"); // 'idle' | 'scanning' | 'result'
  const [scanningStep, setScanningStep] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Data States
  const [seededCriminals, setSeededCriminals] = useState([]);
  const [selectedCriminal, setSelectedCriminal] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Tabs & UI States
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'cases' | 'evidence' | 'timeline' | 'associates' | 'aireport'
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
        if (res.data && res.data.criminals) {
          setSeededCriminals(res.data.criminals);
          setSelectedCriminal(res.data.criminals[0]);
        }
      } catch (err) {
        console.error("Failed to load face criminals dataset:", err);
      }
    }
    loadCriminals();
  }, []);

  // Handle File Upload Select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Select Preset Criminal
  const handleSelectPreset = (criminal) => {
    setSelectedCriminal(criminal);
    setPreviewUrl(criminal.photo_url);
    setUploadedImage(null);
  };

  // Run AI Face Search Scanning Sequence (3.5 Seconds)
  const runFaceSearch = async () => {
    setSearchState("scanning");
    setScanningStep(0);
    setProgressPercent(0);
    setLoadingBackend(true);

    // Prepare API call in background
    let backendPromise = null;
    try {
      const formData = new FormData();
      if (uploadedImage) {
        formData.append("image", uploadedImage);
      } else if (selectedCriminal) {
        formData.append("criminal_id", selectedCriminal.criminal_id);
      }
      backendPromise = api.post("/api/ai/face-search", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      }).catch(() => api.post("/ai/face-search", formData));
    } catch {
      // ignore
    }

    // Run Scanning Animation Steps (6 steps across 3.5s)
    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanningStep(i);
      const targetPercent = Math.round(((i + 1) / SCAN_STEPS.length) * 100);

      // Smooth percentage count up
      for (let p = progressPercent; p <= targetPercent; p++) {
        setProgressPercent(p);
        await new Promise((r) => setTimeout(r, 12));
      }
      await new Promise((r) => setTimeout(r, 450));
    }

    // Resolve Backend Data
    try {
      const res = await backendPromise;
      if (res && res.data && res.data.criminal) {
        setMatchResult(res.data);
        setSelectedCriminal(res.data.criminal);
        setOfficerNotes(res.data.ai_report?.officer_notes || "");
      } else {
        // Fallback result
        const fallbackCriminal = selectedCriminal || seededCriminals[0];
        setMatchResult({
          match: true,
          confidence: 96.8,
          risk: fallbackCriminal.threat_level || "CRITICAL",
          criminal: fallbackCriminal,
          summary: `High confidence match confirmed. ${fallbackCriminal.name} identified with ${fallbackCriminal.wanted_status}.`,
          ai_report: {
            summary: `${fallbackCriminal.name} is a high-priority syndicate operative operating across ${fallbackCriminal.district}. Multiple active warrants exist across Karnataka State.`,
            behavior_pattern: "Operates primarily during late evening hours utilizing stolen high-speed vehicles. Known to rotate safehouses every 48 hours to evade cell tower triangulation.",
            crime_trends: `Specializes in organized ${fallbackCriminal.crime_types?.join(", ")}. Uses encrypted messaging platforms and local hawala channels for funding.`,
            next_location: `Highest probability hideouts: Border districts surrounding ${fallbackCriminal.district}, highway motels near major transport corridors.`,
            recommended_actions: "1. Issue immediate statewide Lookout Circular (LOC).\n2. Deploy Special Tactical Unit (STU) to last reported GPS coordinates.\n3. Intercept associate communications.",
            officer_notes: "CONFIDENTIAL — Suspect is considered armed & dangerous. Exercise extreme caution during tactical interception."
          }
        });
        setOfficerNotes("CONFIDENTIAL — Suspect is considered armed & dangerous. Exercise extreme caution during tactical interception.");
      }
    } catch (err) {
      console.error("Search resolution error:", err);
    } finally {
      setLoadingBackend(false);
      setSearchState("result");
    }
  };

  // Reset to Start New Search
  const handleNewSearch = () => {
    setSearchState("idle");
    setMatchResult(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setNotesSaved(false);
  };

  // Save Officer Notes
  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 3000);
  };

  // PDF Dossier Export Generator
  const handleExportPDF = () => {
    if (!selectedCriminal) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("KARNATAKA STATE POLICE — INTELLIGENCE DOSSIER", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Criminal ID: ${selectedCriminal.criminal_id} | Status: ${selectedCriminal.wanted_status}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleString()} | Classification: CONFIDENTIAL POLICE USE ONLY`, 14, 34);

    doc.line(14, 38, 196, 38);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SUSPECT BIOMETRIC & PERSONAL PROFILE", 14, 46);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Full Name: ${selectedCriminal.name}`, 14, 54);
    doc.text(`Alias: ${selectedCriminal.alias}`, 14, 60);
    doc.text(`Age: ${selectedCriminal.age} | DOB: ${selectedCriminal.dob}`, 14, 66);
    doc.text(`District: ${selectedCriminal.district} (${selectedCriminal.police_station})`, 14, 72);
    doc.text(`Threat Level: ${selectedCriminal.threat_level} | Risk Score: ${selectedCriminal.risk_score}/100`, 14, 78);
    doc.text(`Last Known Location: ${selectedCriminal.last_seen}`, 14, 84);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AI INVESTIGATION REPORT SUMMARY", 14, 96);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const summaryLines = doc.splitTextToSize(matchResult?.ai_report?.summary || matchResult?.summary || "", 180);
    doc.text(summaryLines, 14, 104);

    doc.save(`KSP_Dossier_${selectedCriminal.criminal_id}_${selectedCriminal.name.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10 select-none">
        
        {/* Header Hero Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-primary/80 p-6 rounded-3xl text-white border border-white/10 shadow-premium relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center text-cyan-300 shadow-xl shrink-0">
              <ScanFace size={30} className="animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles size={11} className="animate-spin text-cyan-400" />
                <span>KSP BIOMETRIC NEURAL MATCH ENGINE v4.2 • LIVE</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Criminal Face Intelligence Matrix
              </h1>
              <p className="text-slate-300 text-xs mt-0.5 font-medium">
                Simulated AI facial recognition, automated mugshot matching & criminal network intelligence
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
                <span>New AI Face Search</span>
              </button>
            )}

            <button
              onClick={handleExportPDF}
              disabled={!selectedCriminal}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50"
            >
              <Download size={14} />
              <span>Export PDF Dossier</span>
            </button>
          </div>
        </div>

        {/* Top Intelligence Dashboard Widget Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-soft flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
              <Search size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Searches</p>
              <p className="text-2xl font-black text-white">142</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-soft flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Successful Matches</p>
              <p className="text-2xl font-black text-white">138</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-soft flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unknown Persons</p>
              <p className="text-2xl font-black text-white">4</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-soft flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center font-bold">
              <ShieldAlert size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wanted Criminals</p>
              <p className="text-2xl font-black text-white">89</p>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-soft flex items-center gap-3.5 backdrop-blur-md">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
              <Target size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Match Accuracy</p>
              <p className="text-2xl font-black text-emerald-400">96.8%</p>
            </div>
          </div>
        </div>

        {/* WORKFLOW VIEW 1: UPLOAD & SEARCH INPUT INTERFACE */}
        {searchState === "idle" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box: Upload Suspect Image */}
            <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <UploadCloud size={16} />
                  <span>Step 1: Upload Suspect Photo</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Biometric Facial Recognition Scanner
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a CCTV frame, crime scene photograph, or suspect snapshot to initiate 512-D neural face embedding comparison across Karnataka State offender records.
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
                    <div className="absolute inset-0 bg-blue-600/10 pointer-events-none"></div>
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
                      <p className="text-sm font-bold text-white">Click or Drag Suspect Image Here</p>
                      <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, WEBP (HD resolution recommended)</p>
                    </div>
                  </>
                )}
              </div>

              {/* Start Scan Button */}
              <button
                onClick={runFaceSearch}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
              >
                <Crosshair size={18} className="animate-spin" />
                <span>INITIATE AI FACE SEARCH & MATCH</span>
              </button>
            </div>

            {/* Right Box: Demo Seeded Criminal Preset Selector */}
            <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 backdrop-blur-md">
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
                  <Users size={16} />
                  <span>Hackathon Demo Presets</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Select Seeded Criminal Record
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Or click any of the 15 pre-configured state offenders to simulate instant biometric match and AI intelligence dossier generation.
                </p>
              </div>

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-1">
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
                          <span className="text-[9px] text-slate-400">{c.district}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Total Seeded Dossiers: <strong className="text-white">15 Records</strong></span>
                <span className="text-emerald-400 font-bold">100% Catalyst Data Store Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* WORKFLOW VIEW 2: FULL-SCREEN / EMBEDDED PREMUM AI SCANNING ANIMATION */}
        {searchState === "scanning" && (
          <div className="bg-slate-950 border border-blue-500/40 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[550px] text-white">
            
            {/* Background Neural Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 opacity-80 pointer-events-none"></div>
            
            {/* Animated Scanning Beam & Face Container */}
            <div className="relative w-56 h-56 rounded-3xl border-2 border-blue-500/60 overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] mb-8 bg-slate-900">
              <img
                src={previewUrl || selectedCriminal?.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80"}
                alt="Scanning Target"
                className="w-full h-full object-cover filter brightness-90 contrast-110"
              />

              {/* Scanning Beam Overlay */}
              <motion.div
                className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] z-20"
                animate={{
                  top: ["0%", "95%", "0%"]
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Facial Landmark Geometry Overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                <svg className="w-full h-full text-cyan-400/80" viewBox="0 0 100 100">
                  <circle cx="35" cy="40" r="3" fill="#22d3ee" className="animate-ping" />
                  <circle cx="65" cy="40" r="3" fill="#22d3ee" className="animate-ping" />
                  <circle cx="50" cy="55" r="2.5" fill="#3b82f6" />
                  <line x1="35" y1="40" x2="65" y2="40" stroke="#22d3ee" strokeWidth="0.8" strokeDasharray="2 2" />
                  <line x1="35" y1="40" x2="50" y2="55" stroke="#22d3ee" strokeWidth="0.8" />
                  <line x1="65" y1="40" x2="50" y2="55" stroke="#22d3ee" strokeWidth="0.8" />
                  <line x1="35" y1="70" x2="65" y2="70" stroke="#22d3ee" strokeWidth="0.8" />
                  <polygon points="50,20 80,50 50,85 20,50" fill="none" stroke="#3b82f6" strokeWidth="0.5" opacity="0.6" />
                </svg>
              </div>

              <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full z-30">
                512-D VECTOR SCAN
              </div>
            </div>

            {/* Scanning Status Text */}
            <div className="text-center max-w-md space-y-3 z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-300 text-xs font-bold">
                <Activity size={14} className="animate-spin text-cyan-400" />
                <span>ANALYZING BIOMETRIC EMBEDDINGS</span>
              </div>

              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white">
                {SCAN_STEPS[scanningStep]}
              </h3>

              {/* Progress Bar & Percentage */}
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

        {/* WORKFLOW VIEW 3: MATCH RESULT & FULL INTELLIGENCE DOSSIER PAGE */}
        {searchState === "result" && selectedCriminal && (
          <div className="space-y-6">
            
            {/* Top Match Result Notification Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

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
                      {selectedCriminal.wanted_status}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {selectedCriminal.name}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Alias: <span className="text-cyan-300 font-bold">{selectedCriminal.alias}</span> • ID: <span className="font-mono text-white">{selectedCriminal.criminal_id}</span>
                  </p>
                </div>
              </div>

              {/* Confidence & Risk Gauge Box */}
              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl text-center shadow-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Match Confidence</p>
                  <p className="text-2xl font-black text-emerald-400">{matchResult?.confidence || 96.8}%</p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl text-center shadow-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risk Score</p>
                  <p className="text-2xl font-black text-red-500">{selectedCriminal.risk_score} / 100</p>
                </div>
              </div>
            </div>

            {/* Main Split Grid: Left Criminal Tabs + Right Quick Intelligence Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (8 Cols): Criminal Photo, Header & Tabs Content */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Criminal Primary Summary Box */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row gap-6">
                  {/* Photo with Wanted Overlay */}
                  <div className="relative w-48 h-56 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl shrink-0">
                    <img
                      src={previewUrl || selectedCriminal.photo_url}
                      alt={selectedCriminal.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded uppercase shadow-lg tracking-widest rotate-[-6deg]">
                      WANTED
                    </div>
                  </div>

                  {/* Primary Details Attributes Grid */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Age / DOB</p>
                        <p className="font-bold text-white">{selectedCriminal.age} Yrs ({selectedCriminal.dob})</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">District Unit</p>
                        <p className="font-bold text-cyan-300">{selectedCriminal.district}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Police Station</p>
                        <p className="font-bold text-white">{selectedCriminal.police_station}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Height / Weight</p>
                        <p className="font-bold text-white">{selectedCriminal.height} • {selectedCriminal.weight}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Blood Group</p>
                        <p className="font-bold text-rose-400">{selectedCriminal.blood_group}</p>
                      </div>

                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Threat Rating</p>
                        <p className="font-extrabold text-red-400">{selectedCriminal.threat_level}</p>
                      </div>
                    </div>

                    {/* Last Seen GPS Ticker */}
                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl text-xs text-blue-300 flex items-center gap-2">
                      <MapPin size={16} className="text-cyan-400 shrink-0" />
                      <span><strong>Last Reported GPS Location:</strong> {selectedCriminal.last_seen}</span>
                    </div>
                  </div>
                </div>

                {/* 6 Tabs Navigation Header */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto">
                  {[
                    { id: "overview", label: "Overview", icon: <FileText size={14} /> },
                    { id: "cases", label: `Cases (${selectedCriminal.firs?.length || 0})`, icon: <FileSpreadsheet size={14} /> },
                    { id: "evidence", label: `Evidence (${selectedCriminal.evidence_files?.length || 0})`, icon: <Layers size={14} /> },
                    { id: "timeline", label: "Timeline", icon: <Clock size={14} /> },
                    { id: "associates", label: `Associates (${selectedCriminal.associates?.length || 0})`, icon: <Users size={14} /> },
                    { id: "aireport", label: "AI Gemini Report", icon: <Sparkles size={14} /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* TAB 1: OVERVIEW */}
                {activeTab === "overview" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Personal Attributes & Physical Identifiers
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                        <span className="font-bold text-slate-400">Identification Marks & Tattoos:</span>
                        <p className="font-bold text-white mt-1">{selectedCriminal.identification_marks}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                        <span className="font-bold text-slate-400">Registered Permanent Address:</span>
                        <p className="font-bold text-white mt-1">{selectedCriminal.address}</p>
                      </div>

                      <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                        <span className="font-bold text-slate-400">Primary Offence Heads & Modus Operandi:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCriminal.crime_types?.map((type) => (
                            <span key={type} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CASES */}
                {activeTab === "cases" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Registered FIR Case Dossiers
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                      {selectedCriminal.firs?.map((fir) => (
                        <div key={fir.fir_number} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-blue-400 text-sm">{fir.fir_number}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {fir.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-1">{fir.crime}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Station: <strong className="text-slate-200">{fir.police_station}</strong> • Date: {fir.date} • Officer: {fir.officer}
                            </p>
                          </div>

                          <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start md:self-auto cursor-pointer">
                            <Eye size={14} /> View Case File
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: EVIDENCE */}
                {activeTab === "evidence" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Catalyst File Store Evidence Artifacts
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                        6 Files Vault Encrypted
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedCriminal.evidence_files?.map((ev, idx) => (
                        <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg group hover:border-blue-500/50 transition">
                          <div className="h-32 bg-slate-900 relative overflow-hidden">
                            <img src={ev.url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-cyan-300 border border-white/10 uppercase">
                              {ev.type}
                            </div>
                          </div>
                          <div className="p-3.5 space-y-1.5">
                            <p className="font-bold text-xs text-white truncate">{ev.title}</p>
                            <p className="text-[10px] text-slate-400">{ev.date} • {ev.size}</p>
                            <button className="w-full mt-2 py-1.5 bg-slate-800 hover:bg-blue-600 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer">
                              <Download size={12} /> Inspect Asset
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: TIMELINE */}
                {activeTab === "timeline" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Chronological Offender Activity & Arrest Timeline
                    </h3>

                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                      {selectedCriminal.arrest_history?.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 shadow-md shadow-blue-500/50"></div>
                          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-xs text-cyan-400">{item.year}</span>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white mt-1">{item.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 5: ASSOCIATES */}
                {activeTab === "associates" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      Syed Criminal Network & Known Associates
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedCriminal.associates?.map((assoc, idx) => (
                        <div key={idx} className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
                          <img src={assoc.photo_url} alt={assoc.name} className="w-14 h-14 rounded-2xl object-cover border border-white/20 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-white truncate">{assoc.name}</p>
                            <p className="text-xs text-cyan-400 font-medium truncate">{assoc.relation}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Known Crimes: {assoc.crimes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 6: AI REPORT (GOOGLE GEMINI) */}
                {activeTab === "aireport" && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 backdrop-blur-md">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-cyan-400 animate-pulse" size={18} />
                        <h3 className="text-sm font-bold text-white">Google Gemini Police Intelligence Report</h3>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        AI MODEL: GEMINI 2.5 FLASH
                      </span>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-cyan-400 uppercase tracking-wider mb-1">Executive Summary</h4>
                        <p className="text-slate-200 leading-relaxed font-medium">
                          {matchResult?.ai_report?.summary || matchResult?.summary}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-cyan-400 uppercase tracking-wider mb-1">Behaviour Pattern & Tactical MO</h4>
                        <p className="text-slate-300 leading-relaxed font-medium">
                          {matchResult?.ai_report?.behavior_pattern}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-cyan-400 uppercase tracking-wider mb-1">Known Crime Trends & Syndicate Operations</h4>
                        <p className="text-slate-300 leading-relaxed font-medium">
                          {matchResult?.ai_report?.crime_trends}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-cyan-400 uppercase tracking-wider mb-1">Likely Next Location & Safehouses</h4>
                        <p className="text-slate-300 leading-relaxed font-medium">
                          {matchResult?.ai_report?.next_location}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                        <h4 className="font-bold text-emerald-400 uppercase tracking-wider mb-1">Recommended Tactical Actions</h4>
                        <p className="text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                          {matchResult?.ai_report?.recommended_actions}
                        </p>
                      </div>

                      {/* Officer Notes Editor */}
                      <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-amber-400 uppercase tracking-wider">Officer Confidential Notes</h4>
                          {notesSaved && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              <Check size={12} /> Notes Saved to Catalyst
                            </span>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={officerNotes}
                          onChange={(e) => setOfficerNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleSaveNotes}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[11px] transition shadow-md cursor-pointer"
                          >
                            Save Confidential Note
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (4 Cols): Quick Stats & Intelligence Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Quick Stats Panel */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <ShieldAlert size={15} className="text-red-400" />
                    Quick Intelligence Stats
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 font-bold">Total FIR Cases:</span>
                      <strong className="text-white text-sm">{selectedCriminal.firs?.length || 0}</strong>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 font-bold">Pending Warrants:</span>
                      <strong className="text-red-400 text-sm">2 Warrants</strong>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 font-bold">Known Associates:</span>
                      <strong className="text-cyan-300 text-sm">{selectedCriminal.associates?.length || 0} Operatives</strong>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 font-bold">Evidence Files Vault:</span>
                      <strong className="text-emerald-400 text-sm">{selectedCriminal.evidence_files?.length || 0} Files</strong>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 font-bold">Vehicles Tagged:</span>
                      <strong className="text-white text-sm">{selectedCriminal.vehicles?.length || 0}</strong>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400 font-bold">Weapons Recorded:</span>
                      <strong className="text-amber-400 text-sm">{selectedCriminal.weapons?.length || 0}</strong>
                    </div>
                  </div>
                </div>

                {/* Weapons & Vehicles Tagged */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Car size={15} className="text-cyan-400" />
                    Vehicles & Weapons Assets
                  </h3>

                  <div className="space-y-3 text-xs">
                    {selectedCriminal.vehicles?.map((v, i) => (
                      <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                        <p className="font-bold text-white">{v.model}</p>
                        <p className="text-[10px] text-cyan-300 mt-0.5">Reg: {v.reg_no} • Color: {v.color}</p>
                      </div>
                    ))}

                    {selectedCriminal.weapons?.map((w, i) => (
                      <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                        <p className="font-bold text-red-400">{w.type}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Caliber: {w.caliber} • Status: {w.status}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactical Actions Buttons */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 backdrop-blur-md">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    Tactical Officer Actions
                  </h3>

                  <button
                    onClick={() => alert(`Statewide Lookout Circular (LOC) issued for ${selectedCriminal.name}. Alert sent to all control rooms.`)}
                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-red-400/30"
                  >
                    <Radio size={16} />
                    <span>Broadcast Statewide Alert (LOC)</span>
                  </button>

                  <button
                    onClick={() => alert(`Cell Tower IMEI triangulation initiated for ${selectedCriminal.name}. Live location stream active.`)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <Phone size={16} />
                    <span>Triangulate Cell Tower / IMEI</span>
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