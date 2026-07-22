import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  MicOff,
  Globe,
  Play,
  Pause,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  Radio,
  FileText,
  Video,
  Image as ImageIcon,
  Shield,
  Clock,
  Trash2,
  Plus,
  MessageSquare,
  ExternalLink,
  CheckCircle,
  Eye,
  X,
  Sparkles,
} from "lucide-react";
import api from "../services/api";
import sarvamService, { SARVAM_LANGUAGES } from "../services/sarvamService";
import Layout from "../components/layout/Layout";

export default function Chat() {
  // Session & Conversations
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);

  // Messages & Language
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("kn-IN");
  const [loading, setLoading] = useState(false);

  // Evidence Intelligence (Right Panel)
  const [activeEvidenceList, setActiveEvidenceList] = useState([]);
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState(null);

  // Audio Playback & Hands-Free
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [handsFree, setHandsFree] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const audioRef = useRef(new Audio());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Fetch Saved Conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Audio element listeners
  useEffect(() => {
    const audioEl = audioRef.current;
    const handleEnded = () => {
      setIsPlaying(false);
      if (handsFree) {
        setTimeout(() => startRecording(), 800);
      }
    };
    audioEl.addEventListener("ended", handleEnded);
    return () => audioEl.removeEventListener("ended", handleEnded);
  }, [handsFree]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/api/ai/conversations");
      if (res.data && Array.isArray(res.data)) {
        setConversations(res.data);
      }
    } catch (e) {
      console.warn("Could not fetch conversation history:", e);
    }
  };

  const loadConversationHistory = async (convId) => {
    setCurrentConvId(convId);
    setLoading(true);
    try {
      const res = await api.get(`/api/ai/conversations/${convId}`);
      if (res.data && res.data.messages) {
        setMessages(
          res.data.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.message,
            translated: m.translated_message,
            audio_url: m.audio_url,
            evidence: m.evidence || [],
            timestamp: m.created_at,
          }))
        );
        setSelectedLanguage(res.data.language || "kn-IN");
        // Load latest message evidence
        const lastAssistant = res.data.messages.filter((m) => m.role === "assistant").pop();
        if (lastAssistant && lastAssistant.evidence_json) {
          setActiveEvidenceList(lastAssistant.evidence_json);
        }
      }
    } catch (e) {
      console.error("Failed to load conversation session:", e);
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = () => {
    setCurrentConvId(null);
    setMessages([]);
    setActiveEvidenceList([]);
  };

  const deleteSession = async (convId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/ai/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
      if (currentConvId === convId) {
        createNewSession();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleSendMessage = async (overridePrompt = null) => {
    const promptText = overridePrompt || inputPrompt.trim();
    if (!promptText || loading) return;

    if (!overridePrompt) setInputPrompt("");

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const chatRes = await sarvamService.sendChatMessage(
        promptText,
        selectedLanguage,
        autoSpeak && !isMuted
      );

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: chatRes.response,
        evidence: chatRes.evidence || [],
        audio_url: chatRes.tts?.audio_urls?.[0] || null,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (chatRes.evidence && chatRes.evidence.length > 0) {
        setActiveEvidenceList(chatRes.evidence);
      }

      if (chatRes.conversation_id) {
        setCurrentConvId(chatRes.conversation_id);
        fetchConversations();
      }

      // Audio Playback
      if (chatRes.tts?.audio_urls?.[0] && autoSpeak && !isMuted) {
        const url = chatRes.tts.audio_urls[0];
        setAudioUrl(url);
        audioRef.current.src = url;
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "Sorry, an error occurred while connecting to the investigation service.",
          evidence: [],
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Recording Hands-Free logic
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm" });

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size > 500) {
          const sttRes = await sarvamService.transcribeSpeech(audioBlob, selectedLanguage);
          if (sttRes.transcript) {
            handleSendMessage(sttRes.transcript);
          }
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Mic access denied:", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Voice playback controls
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioUrl) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleStop = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  const handleReplay = () => {
    if (audioUrl) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)] flex gap-4 overflow-hidden">
        {/* LEFT PANEL — Saved Conversation History Sessions */}
        <div className="w-80 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between hidden md:flex shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-xs">
                <MessageSquare size={16} className="text-blue-400" />
                <span>Conversation Sessions</span>
              </div>
              <button
                onClick={createNewSession}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm"
              >
                <Plus size={14} /> New
              </button>
            </div>

            {/* Conversation list */}
            <div className="space-y-1.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {conversations.length > 0 ? (
                conversations.map((c) => (
                  <div
                    key={c.conversation_id}
                    onClick={() => loadConversationHistory(c.conversation_id)}
                    className={`p-3 rounded-2xl cursor-pointer transition flex items-center justify-between text-xs group ${
                      currentConvId === c.conversation_id
                        ? "bg-blue-600/20 border border-blue-500/40 text-blue-300 font-bold"
                        : "bg-slate-950/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/80"
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <p className="truncate font-medium">{c.title}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {new Date(c.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(c.conversation_id, e)}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No saved conversations found. Start a new query!
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl text-[11px] text-slate-400">
            <p className="font-bold text-slate-200 mb-1 flex items-center gap-1">
              <Shield size={12} className="text-emerald-400" /> PostgreSQL Persistence
            </p>
            Every query is automatically saved to PostgreSQL audit trail.
          </div>
        </div>

        {/* CENTER PANEL — Main AI Conversation Pane */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-xl">
          {/* Header Controls */}
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Sparkles size={18} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-100">AI Investigation Assistant</h2>
                <p className="text-[10px] text-slate-400">Gemini 2.5 Flash • Sarvam Bulbul V3 Voice</p>
              </div>
            </div>

            {/* Language Selector & Controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition appearance-none cursor-pointer font-medium"
                >
                  {SARVAM_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <Globe size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              {/* Auto Speak Toggle */}
              <button
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  autoSpeak
                    ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                <Volume2 size={14} />
                <span>Auto Speak</span>
              </button>

              {/* Hands-Free Toggle */}
              <button
                onClick={() => setHandsFree(!handsFree)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                  handsFree
                    ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-900 border-slate-700 text-slate-400"
                }`}
              >
                <Radio size={14} className={handsFree ? "animate-pulse" : ""} />
                <span>Hands-Free</span>
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-sm font-bold text-slate-200">KSP Intelligent Conversational Platform</h3>
                <p className="text-xs max-w-md text-slate-400">
                  Ask natural language queries regarding Repeat Offenders, FIRs, Suspect Networks, Crime Statistics, or Forensic Evidence.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-md ${
                    m.role === "user" ? "bg-blue-600 text-white" : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                  }`}
                >
                  {m.role === "user" ? "👮" : "🤖"}
                </div>
                <div className={`max-w-[80%] space-y-2 ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-slate-950/80 text-slate-100 rounded-tl-sm border border-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>

                  {/* Audio Controls Bar for Assistant Message */}
                  {m.role === "assistant" && m.audio_url && (
                    <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={handlePlayPause}
                        className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                      >
                        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                      </button>
                      <button onClick={handleReplay} className="p-1 text-slate-400 hover:text-white transition">
                        <RotateCcw size={13} />
                      </button>
                      <button onClick={handleStop} className="p-1 text-slate-400 hover:text-white transition">
                        <Square size={13} />
                      </button>
                      <span className="text-[10px] text-slate-400">Sarvam Bulbul Voice Playback</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                Processing Gemini 2.5 Intelligence & PostgreSQL Evidence query...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
          >
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-2xl transition ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Ask Crime AI assistant (e.g. Show repeat offenders in Bengaluru)..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || loading}
              className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl transition shadow-lg shadow-blue-500/30"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* RIGHT PANEL — Interactive Evidence Intelligence & Citations */}
        <div className="w-80 bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col justify-between hidden lg:flex shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-100 font-bold text-xs">
                <FileText size={16} className="text-emerald-400" />
                <span>Evidence Intelligence</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE DB
              </span>
            </div>

            {/* Evidence Items List */}
            <div className="space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {activeEvidenceList.length > 0 ? (
                activeEvidenceList.map((ev, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedEvidenceItem(ev)}
                    className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl hover:border-blue-500/50 transition cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {ev.type || "DOC"}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">{ev.confidence} match</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition">
                      {ev.title}
                    </h4>

                    <div className="mt-2 text-[10px] text-slate-400 space-y-1 border-t border-slate-800/60 pt-2">
                      <p><strong className="text-slate-300">FIR No:</strong> {ev.fir_no}</p>
                      <p><strong className="text-slate-300">Case No:</strong> {ev.case_number}</p>
                      <p><strong className="text-slate-300">Court Status:</strong> {ev.court_status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No active evidence citations loaded. Run a query to load linked FIRs & CCTV.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Evidence Viewer */}
      {selectedEvidenceItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedEvidenceItem(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText size={18} className="text-blue-400" />
              Evidence Asset Viewer — {selectedEvidenceItem.id}
            </h3>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
              <p><strong className="text-slate-300">Title:</strong> {selectedEvidenceItem.title}</p>
              <p><strong className="text-slate-300">FIR Number:</strong> {selectedEvidenceItem.fir_no}</p>
              <p><strong className="text-slate-300">Case Number:</strong> {selectedEvidenceItem.case_number}</p>
              <p><strong className="text-slate-300">Investigating Officer:</strong> {selectedEvidenceItem.officer}</p>
              <p><strong className="text-slate-300">Court Status:</strong> {selectedEvidenceItem.court_status}</p>
              <p><strong className="text-slate-300">Confidence Match:</strong> {selectedEvidenceItem.confidence}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEvidenceItem(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
