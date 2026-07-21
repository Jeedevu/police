import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Folder, Terminal, Settings, User, FileText, X, ShieldAlert, Cpu } from "lucide-react";
import api from "../../services/api";

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global search items
  const staticCommands = [
    { id: "dash", title: "Go to Dashboard", category: "Navigation", icon: <ShieldAlert size={16} />, action: () => navigate("/") },
    { id: "ai", title: "Launch AI Investigation Assistant", category: "AI Actions", icon: <Cpu size={16} className="text-blue-500" />, action: () => navigate("/investigation") },
    { id: "cases", title: "View Active Cases Index", category: "Navigation", icon: <Folder size={16} />, action: () => navigate("/cases") },
    { id: "analytics", title: "Analyze Crime Stats & Trends", category: "Navigation", icon: <FileText size={16} />, action: () => navigate("/analytics") },
    { id: "search", title: "System-wide Advanced Search", category: "Navigation", icon: <Search size={16} />, action: () => navigate("/search") },
  ];

  // Fetch recent cases from backend when query is empty, or search case list
  const [dbCases, setDbCases] = useState([]);
  useEffect(() => {
    if (isOpen) {
      api.get("/cases/")
        .then(res => {
          setDbCases(res.data || []);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Filter commands and cases
  const filteredItems = [
    ...staticCommands.filter(item => item.title.toLowerCase().includes(query.toLowerCase())),
    ...dbCases
      .filter(c => c.fir_number.toLowerCase().includes(query.toLowerCase()) || c.crime_type.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(c => ({
        id: `case-${c.case_id}`,
        title: `FIR ${c.fir_number}: ${c.crime_type}`,
        category: "Cases Dossier",
        icon: <Folder size={16} className="text-amber-500" />,
        action: () => navigate(`/cases?case_id=${c.case_id}`)
      }))
  ];

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-premium glow-accent transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input bar */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3">
          <Search className="text-slate-400 mr-3" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-sm focus:outline-none"
            placeholder="Type a command or search FIR dossiers... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 hover:bg-slate-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm font-medium">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div>
              {/* Group items by category */}
              {Object.entries(
                filteredItems.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      // Find real global index of this item to check selection
                      const globalIndex = filteredItems.findIndex(fi => fi.id === item.id);
                      const isSelected = globalIndex === selectedIndex;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action();
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-primary/10 text-primary glow-accent"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={isSelected ? "text-primary animate-pulse" : "text-slate-400"}>
                              {item.icon}
                            </span>
                            <span>{item.title}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] bg-primary/20 text-primary font-bold px-1.5 py-0.5 rounded-md">
                              ENTER
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2 bg-slate-50/50 flex justify-between items-center text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <span className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-sm">↑↓</span>
            <span>Select:</span>
            <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">Enter</span>
          </div>
          <div>KSP Intelligence v1.0</div>
        </div>
      </div>
    </div>
  );
}
