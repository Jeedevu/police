import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { 
  Bot, 
  Plus, 
  Trash2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Send, 
  UploadCloud, 
  FileText, 
  Database, 
  List, 
  Volume2, 
  VolumeX, 
  Terminal, 
  Check, 
  Code, 
  Image as ImageIcon, 
  ChevronRight, 
  FileDown, 
  Shield, 
  Clock, 
  AlertCircle,
  Brain,
  Layers,
  FileSearch,
  ScanEye,
  Activity
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import { LiveKitRoom, RoomAudioRenderer, StartAudio, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

// Custom Audio Waveform Animation for Voice Interface
function CustomVoiceInterface({ onDisconnect }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Microphone, filter: Track.Component.ParticipantTile },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="flex flex-col items-center justify-center p-5 gap-4 flex-grow bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-1 h-12 my-2">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-blue-600 rounded-full"
            animate={{
              height: ["20%", "80%", "20%"]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          ></motion.div>
        ))}
      </div>

      <div className="text-center">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Active Dispatch Channel</h4>
        <p className="text-[10px] text-slate-400 mt-0.5">{tracks.length} active connection{tracks.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="w-full max-h-28 overflow-y-auto bg-white rounded-xl p-2.5 border border-slate-200/60 space-y-1">
        {tracks.length === 0 ? (
          <div className="text-[10px] text-slate-400 text-center font-mono py-1">Connecting participants...</div>
        ) : (
          tracks.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px] text-slate-600">
              <span className="font-mono truncate">{t.participant.identity || "Officer"}</span>
              <span className="text-[8px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1 rounded">
                ONLINE
              </span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={onDisconnect}
        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] py-2 rounded-xl transition shadow-lg shadow-red-600/10"
      >
        Disconnect Channel
      </button>
    </div>
  );
}

export default function Investigation() {
  // Resizable Panels States
  const [leftWidth, setLeftWidth] = useState(250);
  const [rightWidth, setRightWidth] = useState(300);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  
  // Voice synthesis states
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  
  // LiveKit WebRTC modal states
  const [lkOpen, setLkOpen] = useState(false);
  const [lkRoomName, setLkRoomName] = useState("ksp-hq-dispatch");
  const [lkOfficerName, setLkOfficerName] = useState("Investigator_01");
  const [lkToken, setLkToken] = useState("");
  const [lkServerUrl, setLkServerUrl] = useState("");
  const [lkConnected, setLkConnected] = useState(false);
  const [lkLoading, setLkLoading] = useState(false);
  const [lkError, setLkError] = useState("");
  
  // Active response sub-tabs (findings vs raw db structure)
  const [activeTabs, setActiveTabs] = useState({}); // { messageId: "findings" | "database" }

  // Drag & Drop / OCR simulation states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Quick suggestions
  const suggestions = [
    "Find repeat offenders",
    "Show all theft cases in Mysuru",
    "Who owns vehicle KA01AB1234",
    "Show evidence of case 2",
    "Show accused connected to Suresh Gowda"
  ];

  // Drag handlers for Left/Right resizable dividers
  const handleLeftResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    const onMouseMove = (moveEvent) => {
      const nextWidth = startWidth + (moveEvent.clientX - startX);
      if (nextWidth > 200 && nextWidth < 380) setLeftWidth(nextWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleRightResize = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightWidth;
    const onMouseMove = (moveEvent) => {
      const nextWidth = startWidth - (moveEvent.clientX - startX);
      if (nextWidth > 220 && nextWidth < 450) setRightWidth(nextWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN";

      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
      };
      setRecognition(rec);
    }
  }, []);

  // Load chat sessions on component mount
  useEffect(() => {
    const stored = localStorage.getItem("ksp_investigation_sessions");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setSessions(parsed);
          setCurrentSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
    
    const defaultSession = {
      id: Date.now().toString(),
      title: "New Intelligence session",
      messages: []
    };
    setSessions([defaultSession]);
    setCurrentSessionId(defaultSession.id);
  }, []);

  // Sync sessions to localStorage when updated
  const saveSessions = (newSessions) => {
    setSessions(newSessions);
    localStorage.setItem("ksp_investigation_sessions", JSON.stringify(newSessions));
  };

  const getActiveSession = () => {
    return sessions.find(s => s.id === currentSessionId) || null;
  };

  const startNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: `Intelligence session ${sessions.length + 1}`,
      messages: []
    };
    saveSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
  };

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      const resetSession = {
        id: Date.now().toString(),
        title: "New Intelligence session",
        messages: []
      };
      saveSessions([resetSession]);
      setCurrentSessionId(resetSession.id);
    } else {
      saveSessions(filtered);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
    }
  };

  const startVoiceSearch = () => {
    if (recognition) {
      if (listening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  // Speaks output text using local Speech Synthesis
  const speakText = (text, messageId) => {
    if (!window.speechSynthesis) return;

    if (speakingMsgId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    const isKannada = /[\u0C80-\u0CFF]/.test(text);
    if (isKannada) {
      utterance.lang = "kn-IN";
    } else {
      utterance.lang = "en-IN";
    }

    const voices = window.speechSynthesis.getVoices();
    if (isKannada) {
      const knVoice = voices.find(v => v.lang.startsWith("kn") || v.name.toLowerCase().includes("kannada"));
      if (knVoice) utterance.voice = knVoice;
    } else {
      const enVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("India") || v.name.includes("Google")));
      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const askAI = async (queryText = question) => {
    const targetQuery = queryText || question;
    if (!targetQuery) return;

    const activeSession = getActiveSession();
    if (!activeSession) return;

    setLoading(true);
    setQuestion("");

    const historyPayload = activeSession.messages.slice(-5).map(m => ({
      role: m.role,
      content: m.question || m.explanation || ""
    }));

    try {
      const res = await api.post("/ai/query", {
        question: targetQuery,
        history: historyPayload
      });

      const messageId = Date.now().toString();
      const newMessage = {
        id: messageId,
        role: "assistant",
        question: targetQuery,
        ...res.data
      };

      setActiveTabs(prev => ({ ...prev, [messageId]: "findings" }));

      const updatedMessages = [...activeSession.messages, newMessage];
      const updatedSessions = sessions.map(s => {
        if (s.id === currentSessionId) {
          const title = s.title.startsWith("New Intelligence") ? (targetQuery.slice(0, 20) + "...") : s.title;
          return { ...s, title, messages: updatedMessages };
        }
        return s;
      });

      saveSessions(updatedSessions);

      if (speechEnabled && res.data.success && res.data.explanation) {
        speakText(res.data.explanation, messageId);
      }
    } catch (err) {
      console.error(err);
      const messageId = Date.now().toString();
      const errMessage = {
        id: messageId,
        role: "assistant",
        question: targetQuery,
        success: false,
        error: err.response?.data?.detail || err.message || "Failed to establish API handshake with backend."
      };
      
      const updatedMessages = [...activeSession.messages, errMessage];
      const updatedSessions = sessions.map(s => {
        if (s.id === currentSessionId) {
          return { ...s, messages: updatedMessages };
        }
        return s;
      });
      saveSessions(updatedSessions);
    } finally {
      setLoading(false);
    }
  };

  // Drag & drop file handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFilesUpload(files);
    }
  };

  const handleFilesUpload = (files) => {
    const formatted = files.map(file => ({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setUploadedFiles(prev => [...prev, ...formatted]);

    // Simulate OCR running on first uploaded image/pdf
    const file = files[0];
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setOcrLoading(true);
      setTimeout(() => {
        setOcrLoading(false);
        setOcrResult({
          fileName: file.name,
          extractedText: `🚨 EXTRADITION WARRANT / EVIDENCE LOG\n\nCase reference ID: FIR-2026/08\nAccused subject name: SURESH GOWDA\nVehicle license Plate: KA-01-AB-1234\nGPS coordinates logged: 12.9716° N, 77.5946° E\nPhone IMEI mapping log: 863249015743029\n\nForensic text extraction completed successfully under secure KSP clearance.`,
          confidence: "98.4%",
          coordinates: "Mysuru Central Grid"
        });
      }, 1500);
    }
  };

  // Compile and download PDF dossier
  const exportDossierPDF = () => {
    const activeSession = getActiveSession();
    if (!activeSession || activeSession.messages.length === 0) {
      alert("No query dossier entries available to export in this session.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("KARNATAKA STATE POLICE", 15, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("CONFIDENTIAL CRIME DOSSIER - POLICE WORK PRODUCT", 15, 24);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`SESSION ID: ${activeSession.id}`, 15, 34);
    doc.text(`EXPORT DATE: ${new Date().toLocaleString()}`, pageWidth - 70, 34);

    y = 50;

    activeSession.messages.forEach((msg, idx) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`INQUIRY #${idx + 1}: "${msg.question}"`, 15, y);
      y += 6;

      if (msg.success) {
        doc.setFont("courier", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(37, 99, 235);
        const sqlLines = doc.splitTextToSize(msg.generated_sql || "", pageWidth - 30);
        doc.text(sqlLines, 15, y);
        y += (sqlLines.length * 4) + 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text("AI Summary & Criminological Analysis:", 15, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const explanationLines = doc.splitTextToSize(msg.explanation || "", pageWidth - 30);
        doc.text(explanationLines, 15, y);
        y += (explanationLines.length * 4.5) + 6;

        if (msg.recommendations && msg.recommendations.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text("Tactical Recommendations & Leads:", 15, y);
          y += 5;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(71, 85, 105);
          msg.recommendations.forEach(rec => {
            const recLines = doc.splitTextToSize(`* ${rec}`, pageWidth - 35);
            doc.text(recLines, 18, y);
            y += (recLines.length * 4.5);
          });
          y += 5;
        }

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Rows: ${msg.rows_returned} | Confidence: ${msg.confidence_score}%`, 15, y);
        y += 10;
      } else {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(239, 68, 68);
        doc.text(`Execution Error: ${msg.error}`, 15, y);
        y += 12;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(15, y - 2, pageWidth - 15, y - 2);
      y += 6;
    });

    doc.save(`ksp_crime_dossier_${activeSession.id}.pdf`);
  };

  const connectToLiveKit = async () => {
    if (!lkRoomName || !lkOfficerName) {
      setLkError("Room Name and Officer ID are required.");
      return;
    }

    setLkLoading(true);
    setLkError("");

    try {
      const res = await api.post("/livekit/token", {
        room_name: lkRoomName,
        participant_name: lkOfficerName
      });

      setLkToken(res.data.token);
      setLkServerUrl(res.data.server_url);
      setLkConnected(true);
    } catch (err) {
      console.error(err);
      setLkError(err.response?.data?.detail || "Failed to request WebRTC token from the backend server.");
    } finally {
      setLkLoading(false);
    }
  };

  const disconnectFromLiveKit = () => {
    setLkConnected(false);
    setLkToken("");
    setLkServerUrl("");
  };

  // Helper to extract table headers and values dynamically
  const renderTable = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="text-slate-400 text-[10px] py-6 text-center bg-slate-50 border border-slate-150 rounded-xl">
          No matching database records returned.
        </div>
      );
    }

    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto max-h-60 border border-slate-100 rounded-xl shadow-inner bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
              {headers.map((h) => (
                <th key={h} className="py-2 px-3 font-bold">{h.replace("_", " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition">
                {headers.map((h) => {
                  const val = row[h];
                  let display = "";
                  if (val === null || val === undefined) display = "null";
                  else if (typeof val === "object") display = JSON.stringify(val);
                  else display = val.toString();

                  return (
                    <td key={h} className="py-2 px-3 font-mono text-[10px] truncate max-w-xs" title={display}>
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const activeSession = getActiveSession();

  return (
    <Layout>
      <div className="flex h-full w-full overflow-hidden relative select-none">
        
        {/* Left Resizable Panel: Session History */}
        <div 
          style={{ width: `${leftWidth}px` }} 
          className="bg-white border border-slate-150 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-soft"
        >
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={12} className="text-primary animate-pulse" /> Case sessions
            </span>
            <button
              onClick={startNewSession}
              className="p-1.5 rounded-lg bg-primary hover:bg-primary/95 text-white transition-all text-xs flex items-center gap-1.5 shadow-md shadow-primary/10"
              title="Start New Session"
            >
              <Plus size={12} /> <span className="font-bold text-[10px]">New</span>
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-2.5 space-y-1.5">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`w-full group p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                  currentSessionId === s.id
                    ? "bg-primary/5 border-primary/20 text-primary shadow-sm font-semibold"
                    : "bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs truncate leading-normal">{s.title}</p>
                  <p className="text-[9px] text-slate-400 mt-1 font-medium">{s.messages.length} queries logged</p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                  title="Delete Session"
                >
                  <Trash2 size={12} />
                </button>
              </button>
            ))}
          </div>

          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px] font-bold">
            <span className="text-slate-400 uppercase tracking-widest">TTS Output</span>
            <button
              onClick={() => {
                setSpeechEnabled(!speechEnabled);
                if (speechEnabled) window.speechSynthesis?.cancel();
              }}
              className={`px-2 py-1 rounded-lg text-[9px] font-bold transition border ${
                speechEnabled 
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {speechEnabled ? "ACTIVE" : "MUTED"}
            </button>
          </div>
        </div>

        {/* Draggable resize handler (Left) */}
        <div 
          onMouseDown={handleLeftResize}
          className="resize-handle w-2 hover:bg-slate-200 cursor-col-resize shrink-0 h-full flex items-center justify-center"
        />

        {/* Center Panel: ChatGPT + Cursor + Notion AI chat view */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border border-slate-150 rounded-2xl shadow-soft overflow-hidden relative">
          
          {/* Header Area */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center shrink-0">
            <div>
              <h1 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5 leading-none">
                <Brain size={14} className="text-blue-600 animate-pulse" /> AI Crime Assistant
              </h1>
              <p className="text-[9px] text-slate-400 leading-none mt-1.5 font-medium">Explain suspect connections and generate secure SQL queries</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLkOpen(true)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
              >
                <Activity size={12} className="animate-pulse" /> Live WebRTC Dispatch
              </button>
              <button
                onClick={exportDossierPDF}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <FileDown size={13} className="text-red-500" /> Export PDF
              </button>
            </div>
          </div>

          {/* Interactive Chat messages pane */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex-1 overflow-y-auto p-4 space-y-6 relative"
          >
            {/* Drag & drop overlay portal */}
            <AnimatePresence>
              {isDragging && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary/5 backdrop-blur-xs border-2 border-dashed border-primary z-30 flex flex-col items-center justify-center p-4 m-2 rounded-xl"
                >
                  <UploadCloud size={36} className="text-primary animate-bounce" />
                  <h4 className="text-xs font-bold text-primary mt-2">Drop Evidence File Here</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Extract locations, numbers, and suspects using OCR</p>
                </motion.div>
              )}
            </AnimatePresence>

            {activeSession && activeSession.messages.length === 0 ? (
              /* Welcome Page with suggested prompts */
              <div className="h-full flex flex-col items-center justify-center text-center p-4 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/10 glow-accent mb-4">
                  <Bot size={26} />
                </div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">KSP Automated Investigation Intel</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed font-medium">
                  Enter queries in natural language (Kannada/English). The system translates commands to SQL, executing secure SELECT actions on state crime records.
                </p>
                
                <div className="grid grid-cols-1 gap-2 mt-6 w-full">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => askAI(s)}
                      className="p-2.5 rounded-xl border border-slate-150 hover:border-primary/20 bg-white hover:bg-primary/5 text-slate-600 hover:text-primary text-[10.5px] text-left transition duration-200 font-semibold shadow-sm flex justify-between items-center group"
                    >
                      <span>&ldquo;{s}&rdquo;</span>
                      <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat log container */
              <div className="space-y-6">
                {activeSession?.messages.map((msg) => (
                  <div key={msg.id} className="space-y-4">
                    {/* User query bubble */}
                    <div className="flex justify-end items-start gap-2">
                      <div className="max-w-[70%] bg-primary text-white rounded-2xl rounded-tr-none p-3 shadow-soft text-xs font-medium">
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.question}</p>
                        <div className="text-[8px] text-white/70 font-mono mt-1 text-right">
                          Officer Jeevan
                        </div>
                      </div>
                      <img
                        src="https://ui-avatars.com/api/?name=Jeevan+Kumar&background=2563EB&color=fff&bold=true"
                        alt="User"
                        className="w-7 h-7 rounded-lg shadow-sm"
                      />
                    </div>

                    {/* AI Response Block */}
                    <div className="flex justify-start items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shrink-0 shadow-sm shadow-primary/20 glow-accent mt-0.5">
                        <Bot size={15} />
                      </div>
                      
                      <div className="flex-1 max-w-[85%] space-y-3">
                        
                        {/* Tab header buttons */}
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 shrink-0">
                          <button
                            onClick={() => setActiveTabs(prev => ({ ...prev, [msg.id]: "findings" }))}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                              (activeTabs[msg.id] || "findings") === "findings"
                                ? "bg-primary/10 text-primary"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span className="flex items-center gap-1"><FileText size={11} /> Criminological Lead</span>
                          </button>
                          {msg.success && (
                            <button
                              onClick={() => setActiveTabs(prev => ({ ...prev, [msg.id]: "database" }))}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                                activeTabs[msg.id] === "database"
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span className="flex items-center gap-1"><Database size={11} /> DB Records ({msg.rows_returned})</span>
                            </button>
                          )}
                        </div>

                        {/* Findings Sub-tab Content */}
                        {(activeTabs[msg.id] || "findings") === "findings" && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 space-y-3.5 shadow-sm"
                          >
                            {msg.success ? (
                              <>
                                {/* Custom SQL Animation block */}
                                <div className="bg-slate-900 rounded-xl p-3 border border-slate-950/20 text-slate-100 shadow-inner">
                                  <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-400 border-b border-slate-800 pb-1.5 mb-2 select-none">
                                    <span className="flex items-center gap-1"><Terminal size={10} className="text-blue-400 animate-pulse" /> SQL CODE EXPLAINER</span>
                                    <span className="text-emerald-400 flex items-center gap-0.5"><Check size={10} /> SECURITY CLEARED</span>
                                  </div>
                                  <code className="text-[10px] font-mono block overflow-x-auto text-blue-300 leading-normal">{msg.generated_sql}</code>
                                </div>

                                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                                  {msg.explanation}
                                </div>

                                {msg.recommendations && msg.recommendations.length > 0 && (
                                  <div className="space-y-1.5 border-t border-slate-150 pt-2.5">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Investigation Leads</span>
                                    <ul className="space-y-1">
                                      {msg.recommendations.map((rec, rIdx) => (
                                        <li key={rIdx} className="text-xs text-slate-500 flex items-start gap-2">
                                          <span className="text-primary mt-1 shrink-0">•</span>
                                          <span className="font-medium">{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Metadata bar */}
                                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono border-t border-slate-100 pt-2.5">
                                  <span>Confidence: <span className="text-primary font-bold">{msg.confidence_score}%</span></span>
                                  <button
                                    onClick={() => speakText(msg.explanation, msg.id)}
                                    className="hover:text-primary transition flex items-center gap-0.5"
                                  >
                                    {speakingMsgId === msg.id ? <VolumeX size={11} className="text-red-500" /> : <Volume2 size={11} />}
                                    <span>{speakingMsgId === msg.id ? "Cancel speech" : "Read aloud"}</span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="flex gap-2.5 items-start text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 text-xs leading-relaxed font-medium">
                                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Handshake Handled - DB Exception</p>
                                  <p className="text-[10.5px] mt-0.5 text-red-500 font-mono">{msg.error}</p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {/* Database record lists sub-tab */}
                        {activeTabs[msg.id] === "database" && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50/50 border border-slate-150 rounded-2xl p-3 shadow-sm"
                          >
                            {renderTable(msg.data)}
                          </motion.div>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Simulated typing streaming response indicator */}
            {loading && (
              <div className="flex justify-start items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Bot size={15} />
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 max-w-sm shadow-sm space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0s" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.15s" }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0.3s" }}></span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">generating sql & validating logs...</p>
                </div>
              </div>
            )}
          </div>

          {/* Form input controls */}
          <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50 flex flex-col gap-2">
            
            {/* File list indicators */}
            {uploadedFiles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 select-none">
                {uploadedFiles.map((file, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-sm"
                  >
                    <ImageIcon size={10} className="text-blue-500" />
                    <span className="truncate max-w-[80px]">{file.name}</span>
                    <span className="text-[8px] text-slate-400">({file.size})</span>
                    <button 
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} 
                      className="text-slate-400 hover:text-red-500 ml-1 font-bold text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="file"
                id="file-attach-input"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => document.getElementById("file-attach-input").click()}
                className="p-3 bg-white border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-xl transition shadow-sm"
                title="Attach Dossier Image / PDF for OCR"
              >
                <UploadCloud size={16} />
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  placeholder={listening ? "Listening voice feed..." : "Enter natural query (e.g. Show theft cases in Bengaluru)..."}
                  className="w-full bg-white border border-slate-200/85 focus:border-primary rounded-xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition shadow-sm"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askAI()}
                  disabled={loading}
                />
                
                <button
                  onClick={startVoiceSearch}
                  className={`absolute right-3 p-1 rounded-lg transition-colors ${
                    listening 
                      ? "text-red-500 bg-red-50 animate-pulse" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }`}
                  title="Toggle Voice Input"
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
              </div>

              <button
                onClick={() => askAI()}
                disabled={loading || !question.trim()}
                className="bg-primary hover:bg-primary/95 disabled:bg-slate-100 text-white disabled:text-slate-400 p-3 rounded-xl shadow-md transition flex items-center justify-center"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Draggable resize handler (Right) */}
        <div 
          onMouseDown={handleRightResize}
          className="resize-handle w-2 hover:bg-slate-200 cursor-col-resize shrink-0 h-full flex items-center justify-center"
        />

        {/* Right Resizable Panel: Evidence Citations & OCR Output */}
        <div 
          style={{ width: `${rightWidth}px` }} 
          className="bg-white border border-slate-150 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-soft"
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1.5 shrink-0">
            <Layers size={13} className="text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evidence citations</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Live WebRTC indicator detail */}
            {lkConnected && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <CustomVoiceInterface onDisconnect={disconnectFromLiveKit} />
              </div>
            )}

            {/* OCR Extracted Text Display */}
            {ocrLoading && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 select-none">
                <ScanEye size={22} className="text-primary animate-spin" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Running Forensic OCR Scanner...</span>
              </div>
            )}

            {ocrResult && !ocrLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-50/30 border border-blue-100 rounded-xl p-3 space-y-2.5"
              >
                <div className="flex justify-between items-center text-[9px] font-bold text-blue-600 border-b border-blue-100 pb-1.5">
                  <span className="flex items-center gap-1"><ScanEye size={11} /> OCR TEXT EXTRACTION</span>
                  <span>CONF: {ocrResult.confidence}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-lg border border-blue-50">
                  <pre className="text-[9px] font-mono text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap">{ocrResult.extractedText}</pre>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setQuestion(`Show details for vehicle ${ocrResult.extractedText.match(/KA-\d{2}-[A-Z]{1,2}-\d{4}/)?.[0] || "KA-01-AB-1234"}`)}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-[9px] font-bold py-1 rounded transition text-center"
                  >
                    Query Vehicle Plate
                  </button>
                  <button
                    onClick={() => setQuestion(`Find repeat offenders connected to Suresh Gowda`)}
                    className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-[9px] font-bold py-1 rounded transition text-center"
                  >
                    Inspect Suspect
                  </button>
                </div>
              </motion.div>
            )}

            {/* Static PDF Dossier previews */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Indexed Documents</span>
              
              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl transition flex gap-2.5 items-start">
                <FileText size={15} className="text-red-500 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 truncate">FIR-2026-Bengaluru-Theft.pdf</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Dossier File | 4.2 MB | Admin log</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl transition flex gap-2.5 items-start">
                <FileText size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 truncate">Forensic-Report-KA01.pdf</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Automobile analysis | 1.8 MB | Lab log</p>
                </div>
              </div>
            </div>

            {/* Quick guidance tips */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-3.5 space-y-1.5 text-[10px] text-slate-500">
              <span className="font-bold text-slate-700">Officer Quick Tips:</span>
              <p className="leading-relaxed">Drag files (Images or PDFs) directly into the center panel to auto-run OCR. The scanner pulls out registrations, IMEIs, and Aadhaar numbers instantly.</p>
            </div>

          </div>
        </div>

        {/* LiveKit voice dispatch room connection drawer */}
        <AnimatePresence>
          {lkOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setLkOpen(false)} />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl border border-slate-200 shadow-premium w-full max-w-sm p-5 z-10 flex flex-col gap-4 animate-in fade-in duration-200"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">Connect Live Dispatch Channel</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Join high-fidelity audio channel with KSP HQ</p>
                </div>

                {lkConnected ? (
                  <div className="space-y-3">
                    <LiveKitRoom
                      video={false}
                      audio={true}
                      token={lkToken}
                      serverUrl={lkServerUrl}
                      data-lk-theme="default"
                      style={{ height: "auto" }}
                    >
                      <CustomVoiceInterface onDisconnect={disconnectFromLiveKit} />
                      <RoomAudioRenderer />
                    </LiveKitRoom>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lkError && (
                      <div className="bg-red-50 text-red-700 border border-red-100 p-2 rounded-xl text-[10px] font-bold">
                        {lkError}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Channel Call Sign</label>
                      <input 
                        type="text" 
                        value={lkRoomName} 
                        onChange={(e) => setLkRoomName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-700 font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Officer ID</label>
                      <input 
                        type="text" 
                        value={lkOfficerName} 
                        onChange={(e) => setLkOfficerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-slate-700 font-medium"
                      />
                    </div>

                    <button
                      onClick={connectToLiveKit}
                      disabled={lkLoading}
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-primary/10 mt-2"
                    >
                      {lkLoading ? "Synthesizing Token..." : "Authenticate Connection"}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setLkOpen(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-xl transition text-center"
                >
                  Close Settings
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}