import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, Shield, ChevronDown, User, LogOut, Settings, ArrowLeft, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Navbar({ onOpenCommandPalette, onToggleMobileSidebar }) {
  const { officer, role, rank, logout, station, district } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    // Fetch live alerts from analytics
    api.get("/analytics/alerts")
      .then(res => {
        if (res.data && res.data.high_risk_suspects) {
          setAlerts(res.data.high_risk_suspects.slice(0, 4));
        }
      })
      .catch(() => {});
  }, []);

  const officerName = officer?.full_name || officer?.username || "Officer";
  const avatarUrl = officer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(officerName)}&background=2563EB&color=fff&bold=true`;

  const isHomePage = location.pathname === "/" || location.pathname === "/dashboard";

  return (
    <header className="bg-white/75 backdrop-blur-md border-b border-slate-150/80 px-6 py-3.5 flex justify-between items-center sticky top-0 z-40">
      {/* Global Navigation & Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Hamburger menu trigger for mobile screen sizes */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors mr-2 border border-slate-200"
        >
          <Menu size={20} />
        </button>

        {/* ← Back Button */}
        {!isHomePage && (
          <button
            onClick={() => navigate(-1)}
            title="Go Back (Preserves Filters & Scroll State)"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm border border-slate-200"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        )}

        {/* Search Input hotkey trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 flex items-center justify-between bg-slate-100/80 hover:bg-slate-100 hover:border-slate-300 text-slate-400 border border-slate-200/60 rounded-xl px-4 py-2 text-xs transition-all shadow-sm"
        >
          <div className="flex items-center gap-2.5">
            <Search size={15} className="text-slate-400" />
            <span className="font-medium text-slate-500">Search FIR, Suspects, Evidence...</span>
          </div>
          <kbd className="bg-white border border-slate-200/80 text-[10px] text-slate-500 font-bold px-1.5 py-0.5 rounded shadow-sm">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Action utilities */}
      <div className="flex items-center gap-4">
        {/* Active Dispatch audio indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-sm select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>HQ DISPATCH CONNECTED</span>
        </div>

        {/* Notifications center */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 rounded-xl transition border border-transparent hover:border-slate-200"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-800">Critical Intelligence Alerts</h4>
                <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  LIVE HQ
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition cursor-pointer">
                      <p className="text-xs font-semibold text-slate-800">{alert.name || "High Risk Flag"}</p>
                      <p className="text-[11px] text-slate-500">Risk Score: {alert.risk_score} | District: {alert.district || "Bengaluru"}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No active critical alerts</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-100/80 rounded-xl transition border border-transparent hover:border-slate-200"
          >
            <img
              src={avatarUrl}
              alt={officerName}
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/20"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">{officerName}</div>
              <div className="text-[10px] font-medium text-slate-500 leading-tight">
                {rank || "Inspector"} • {station || "Central HQ"}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{officerName}</p>
                <p className="text-[11px] text-slate-500 truncate">{officer?.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-md">
                  Role: {role || "Inspector"}
                </span>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/change-password");
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings size={14} /> Security Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}