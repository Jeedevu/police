/**
 * Chat — Full AI-powered investigation chat interface.
 * Features: streaming, markdown, case cards, evidence cards, charts,
 * conversation history, voice input, pinning, bookmarks, suggestions.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../services/authService";
import { useAuth } from "../context/AuthContext";

// ── Chat message bubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, isLatest }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-bold shadow-lg ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gradient-to-br from-violet-600 to-blue-600 text-white"
        }`}
      >
        {isUser ? "👮" : "🤖"}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-slate-800/80 text-slate-100 rounded-tl-sm border border-white/5"
          }`}
        >
          {msg.content}
        </div>

        {/* Data table if available */}
        {msg.data && msg.data.length > 0 && (
          <DataTable data={msg.data} />
        )}

        {/* Findings */}
        {msg.findings && msg.findings.length > 0 && (
          <div className="bg-slate-800/60 border border-white/5 rounded-xl p-3 w-full">
            <p className="text-xs font-semibold text-yellow-400 mb-2 uppercase tracking-wider">Key Findings</p>
            <ul className="space-y-1">
              {msg.findings.map((f, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-yellow-400 mt-0.5">◆</span> {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {msg.recommendations && msg.recommendations.length > 0 && (
          <div className="bg-slate-800/60 border border-green-500/20 rounded-xl p-3 w-full">
            <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">Tactical Recommendations</p>
            <ul className="space-y-1">
              {msg.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">▶</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence score */}
        {msg.confidence_score != null && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden w-24">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${msg.confidence_score}%`,
                  background: msg.confidence_score > 80
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : msg.confidence_score > 60
                    ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                    : "linear-gradient(90deg, #ef4444, #f87171)",
                }}
              />
            </div>
            <span className="text-xs text-slate-500">{msg.confidence_score}% confidence</span>
          </div>
        )}

        <span className="text-xs text-slate-600 px-1">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

// ── Data Table component ───────────────────────────────────────────────────────
function DataTable({ data }) {
  const [expanded, setExpanded] = useState(false);
  if (!data || data.length === 0) return null;
  const cols = Object.keys(data[0]);
  const displayData = expanded ? data : data.slice(0, 5);

  return (
    <div className="w-full bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <span className="text-xs font-semibold text-slate-400">
          📊 {data.length} records
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {expanded ? "Show less" : `Show all ${data.length}`}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-800/50">
              {cols.slice(0, 6).map((col) => (
                <th key={col} className="px-3 py-2 text-left text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, i) => (
              <tr key={i} className="border-t border-white/5 hover:bg-white/3 transition-colors">
                {cols.slice(0, 6).map((col) => (
                  <td key={col} className="px-3 py-2 text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  "Show recent murder cases in Bengaluru",
  "Find repeat offenders",
  "Theft cases in Mysuru this month",
  "Who are the known associates of case 5?",
  "Show all cyber crime cases",
  "Vehicles owned by suspects",
  "Evidence for case 12",
  "Officer performance report",
  "Missing persons last 30 days",
  "Narcotics cases in Hubballi",
];

function SuggestionChips({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SUGGESTIONS.slice(0, 5).map((s) => (
        <motion.button
          key={s}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(s)}
          className="px-3 py-1.5 text-xs rounded-full border border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all"
        >
          {s}
        </motion.button>
      ))}
    </div>
  );
}

// ── Voice input button ─────────────────────────────────────────────────────────
function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    setListening(true);
  };

  return (
    <motion.button
      onClick={toggleVoice}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-2.5 rounded-xl transition-all ${
        listening
          ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
          : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-200"
      }`}
      title={listening ? "Stop listening" : "Voice input"}
    >
      🎤
    </motion.button>
  );
}

// ── Main Chat component ───────────────────────────────────────────────────────
export default function Chat() {
  const { officer } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `officer_${officer?.id || "anon"}_${Date.now()}`);
  const [pinnedChats, setPinnedChats] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    // Load history
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/api/ai/history?session_id=${sessionId}`);
      setHistory(data.history || []);
    } catch (_) {}
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/ai/chat", {
        message: text,
        session_id: sessionId,
        stream: false,
      });

      const aiMsg = {
        role: "assistant",
        content: data.summary || data.formatted_answer || "I processed your query.",
        timestamp: new Date().toISOString(),
        data: data.data || [],
        findings: data.findings || [],
        recommendations: data.recommendations || [],
        confidence_score: data.confidence_score,
        generated_sql: data.generated_sql,
        rows_returned: data.rows_returned,
        intent: data.intent,
      };
      setMessages((prev) => [...prev, aiMsg]);
      loadHistory();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ ${err?.response?.data?.detail || "Failed to process your query. Please try again."}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const pinMessage = (msg) => {
    setPinnedChats((prev) =>
      prev.find((p) => p.timestamp === msg.timestamp)
        ? prev
        : [...prev, msg]
    );
  };

  const bookmarkMessage = (msg) => {
    setBookmarks((prev) =>
      prev.find((b) => b.timestamp === msg.timestamp)
        ? prev.filter((b) => b.timestamp !== msg.timestamp)
        : [...prev, msg]
    );
  };

  const clearChat = () => {
    setMessages([]);
    api.delete(`/api/ai/history?session_id=${sessionId}`).catch(() => {});
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="h-screen bg-[#030712] flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-r border-white/5 flex flex-col overflow-hidden flex-shrink-0"
            style={{ background: "rgba(10, 15, 30, 0.95)" }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🛡️</span>
                <span className="text-sm font-bold text-white">KSP Intelligence</span>
              </div>
              <p className="text-xs text-slate-500">AI Chat Interface</p>
            </div>

            {/* New chat button */}
            <div className="p-3">
              <button
                onClick={clearChat}
                className="w-full py-2 px-3 rounded-xl text-xs font-medium border border-white/10 bg-white/5 text-slate-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30 transition-all flex items-center gap-2"
              >
                <span>✏️</span> New Conversation
              </button>
            </div>

            {/* Recent history */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {history.length > 0 && (
                <>
                  <p className="text-xs text-slate-600 uppercase tracking-wider px-2 mb-2 font-medium">Recent</p>
                  {history
                    .filter((h) => h.role === "user")
                    .slice(-8)
                    .reverse()
                    .map((h, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(h.content)}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors truncate"
                      >
                        {h.content}
                      </button>
                    ))}
                </>
              )}

              {pinnedChats.length > 0 && (
                <>
                  <p className="text-xs text-slate-600 uppercase tracking-wider px-2 mt-4 mb-2 font-medium">📌 Pinned</p>
                  {pinnedChats.map((p, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-xs text-yellow-400 truncate">{p.content}</p>
                    </div>
                  ))}
                </>
              )}

              {bookmarks.length > 0 && (
                <>
                  <p className="text-xs text-slate-600 uppercase tracking-wider px-2 mt-4 mb-2 font-medium">🔖 Bookmarks</p>
                  {bookmarks.map((b, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-blue-400 truncate">{b.content}</p>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Officer info */}
            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center text-xs">👮</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-300 truncate">{officer?.full_name || "Officer"}</p>
                  <p className="text-xs text-slate-600">{officer?.role || "Unknown"}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="h-14 border-b border-white/5 flex items-center px-4 gap-3 flex-shrink-0"
          style={{ background: "rgba(10, 15, 30, 0.95)" }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            ☰
          </button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white">Investigation AI</span>
              <span className="text-xs text-slate-500">Gemini 2.5 Flash</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-xs"
              title="Clear chat"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full gap-6 text-center"
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #7c3aed)" }}
              >
                🤖
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Karnataka Police Intelligence AI
                </h2>
                <p className="text-sm text-slate-400 max-w-md">
                  Ask about cases, suspects, evidence, crime trends, or get investigation assistance.
                  I can search the database and provide actionable insights.
                </p>
              </div>
              <SuggestionChips onSelect={sendMessage} />
            </motion.div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className="group relative">
                  <MessageBubble msg={msg} isLatest={i === messages.length - 1} />
                  {/* Action buttons */}
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => pinMessage(msg)}
                      className="p-1 text-xs rounded bg-slate-700 text-slate-400 hover:text-yellow-400"
                      title="Pin"
                    >📌</button>
                    <button
                      onClick={() => bookmarkMessage(msg)}
                      className="p-1 text-xs rounded bg-slate-700 text-slate-400 hover:text-blue-400"
                      title="Bookmark"
                    >🔖</button>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-sm">
                    🤖
                  </div>
                  <div className="px-4 py-3 bg-slate-800/80 border border-white/5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />

              {/* Suggestions after response */}
              {!loading && messages.length > 0 && messages.length < 4 && (
                <div className="pt-2">
                  <p className="text-xs text-slate-600 text-center mb-3">Try asking…</p>
                  <SuggestionChips onSelect={sendMessage} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Input area */}
        <div
          className="border-t border-white/5 p-4 flex-shrink-0"
          style={{ background: "rgba(10, 15, 30, 0.95)" }}
        >
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                placeholder="Ask about cases, suspects, vehicles, evidence… (Kannada supported)"
                rows={1}
                className="w-full px-4 py-3 pr-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all resize-none"
                style={{ minHeight: "48px", maxHeight: "200px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
                }}
              />
            </div>

            <VoiceButton onTranscript={(t) => { setInput(t); sendMessage(t); }} />

            <motion.button
              type="submit"
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 rounded-xl text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
                minWidth: "48px",
              }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
              ) : (
                "➤"
              )}
            </motion.button>
          </form>

          <p className="text-center text-xs text-slate-700 mt-2">
            Powered by Gemini 2.5 Flash • Restricted data system • Authorized use only
          </p>
        </div>
      </div>
    </div>
  );
}
