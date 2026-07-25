import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import ParticleText from "../components/ui/ParticleText";
import ASCIIWaves from "../components/ui/ASCIIWaves";

export default function Chat() {
  const { t, i18n } = useTranslation();

  // Session & Conversations
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);

  // Messages & Language
  const [messages, setMessages] = useState([]);
  const [inputPrompt, setInputPrompt] = useState("");
  
  // Sync selected language with active i18n language
  const mapI18nToSarvamLang = (lng) => {
    switch (lng) {
      case "kn": return "kn-IN";
      case "hi": return "hi-IN";
      case "ta": return "ta-IN";
      case "te": return "te-IN";
      case "ml": return "ml-IN";
      default: return "en-IN";
    }
  };

  const [selectedLanguage, setSelectedLanguage] = useState(() => mapI18nToSarvamLang(i18n.language));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSelectedLanguage(mapI18nToSarvamLang(i18n.language));
  }, [i18n.language]);

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

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const audioEl = audioRef.current;
    const handleEnded = () => {
      setIsPlaying(false);
    };
    audioEl.addEventListener("ended", handleEnded);
    return () => audioEl.removeEventListener("ended", handleEnded);
  }, []);

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
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: t("common.error", "Sorry, an error occurred while querying AI system."),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-100px)] gap-6 max-w-[1600px] mx-auto pb-4 select-none">
        
        {/* Left Sessions Sidebar */}
        <div className="hidden lg:flex flex-col w-64 bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl shrink-0">
          <button
            onClick={createNewSession}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 mb-4 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Chat Session</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">History Sessions</p>
            {conversations.map((conv) => (
              <div
                key={conv.conversation_id}
                onClick={() => loadConversationHistory(conv.conversation_id)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition cursor-pointer group ${
                  currentConvId === conv.conversation_id
                    ? "bg-blue-600/20 border border-blue-500/40 text-white font-bold"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare size={14} className="shrink-0 text-blue-400" />
                  <span className="truncate">{conv.title || "Crime Investigation Query"}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(conv.conversation_id, e)}
                  aria-label="Delete Session"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Conversation Pane */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-2xl backdrop-blur-md min-w-0">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{t("chat.title", "PoliceAssist AI Intelligence Chat")}</h2>
                <p className="text-xs text-slate-400">{t("chat.sub", "Conversational Crime Intelligence Assistant")}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                ✓ {t("chat.ai_reply_lang", "Responding in selected language")}
              </span>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center h-full text-center p-6 rounded-3xl border border-purple-500/20 overflow-hidden bg-slate-950/80 shadow-2xl">
                {/* Character Waves ASCII Background */}
                <div className="absolute inset-0 z-0 opacity-25 pointer-events-none">
                  <ASCIIWaves
                    characters=" .:-+*=%@#"
                    elementSize={16}
                    color="#733ceb"
                    background="#090d16"
                    speed={20}
                    waveTension={5}
                    noiseScale={12}
                    intensity={10}
                    hasCursorInteraction={true}
                    interactionIntensity={15}
                    interactionRadius={160}
                  />
                </div>

                {/* Pixel Drift ParticleText replacing static text "KSP AI" */}
                <div className="relative z-10 w-full h-[180px] max-w-xl mx-auto flex items-center justify-center pointer-events-auto">
                  <ParticleText
                    text="KSP AI"
                    colors={["#733ceb", "#212120"]}
                    position="middle"
                    particleSize={9}
                    fontSize={147}
                    autoFit={true}
                    mouseForce={6}
                    transition={{
                      ease: "linear",
                      mass: 1,
                      type: "tween",
                      damping: 60,
                      duration: 0,
                      stiffness: 800,
                    }}
                  />
                </div>

                <p className="relative z-10 text-xs text-slate-300 max-w-md mb-6 font-medium">
                  Ask AI about registered FIRs, high-risk suspects, crime hotspots, legal procedure, or biometric matching across Karnataka Police databases.
                </p>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg w-full">
                  {[
                    "Show high-risk suspects in Bengaluru",
                    "FIR status for Vikram Gowda case",
                    "ಅಪರಾಧ ನಿಯಂತ್ರಣ ಮತ್ತು ತನಿಖೆ ವಿವರ",
                    "अपराध और संदिग्धों की पूरी जानकारी"
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/50 rounded-xl text-xs text-slate-200 hover:text-white transition shadow-md cursor-pointer"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20"
                        : "bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-950 border border-slate-800 text-slate-400 rounded-2xl p-4 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                  <span>{t("common.loading", "AI is processing query...")}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input controls */}
          <div className="pt-4 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder={t("chat.placeholder", "Ask AI about FIRs, suspects, crime hotspots, or legal procedure...")}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputPrompt.trim()}
              className="px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Send size={15} />
              <span>{t("chat.send", "Send")}</span>
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
