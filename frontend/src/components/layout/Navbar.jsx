import { useState, useEffect } from "react";
import { Search, Bell, Shield, ChevronDown, Check, User, LogOut, Settings, Volume2 } from "lucide-react";
import api from "../../services/api";

export default function Navbar({ onOpenCommandPalette }) {
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

  return (
    <header className="bg-white/75 backdrop-blur-md border-b border-slate-150/80 px-6 py-3.5 flex justify-between items-center sticky top-0 z-40">
      {/* Search Input hotkey trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between bg-slate-100/80 hover:bg-slate-100 hover:border-slate-300 text-slate-400 border border-slate-200/60 rounded-xl px-4 py-2.5 text-xs transition-all shadow-sm"
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
              setShowProfileMenu(false);
              setUnreadCount(0);
            }}
            className={`relative p-2.5 rounded-xl border transition-all ${
              showNotifications 
                ? "bg-slate-100 border-slate-300 text-slate-800" 
                : "bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-premium glow-accent z-50 p-2 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-3 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Intel Notifications</span>
                <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  High Risk Alerts
                </span>
              </div>
              <div className="py-1 max-h-[280px] overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 hover:bg-slate-50 rounded-xl transition flex gap-3 items-start border border-transparent hover:border-slate-100 mb-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                        <Shield size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-bold text-slate-800 truncate">{item.full_name}</p>
                          <span className="text-[9px] bg-red-100 text-red-700 font-black px-1.5 py-0.2 rounded-full">
                            {item.risk_score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">High-risk suspect active in {item.mobile ? "cell grid tracking" : "dossier database"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No active high-risk alerts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile menu dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 p-1.5 pr-3 bg-white border border-slate-200/80 hover:bg-slate-50 rounded-xl transition shadow-sm text-left"
          >
            <img
              src="https://ui-avatars.com/api/?name=Jeevan+Kumar&background=2563EB&color=fff&bold=true"
              alt="Officer Avatar"
              className="w-8 h-8 rounded-lg object-cover shadow-sm"
            />
            <div className="hidden md:block">
              <p className="text-[11px] font-bold text-slate-800 leading-tight">Insp. Jeevan Kumar</p>
              <p className="text-[9px] text-slate-400 leading-none mt-0.5">Investigation Officer</p>
            </div>
            <ChevronDown size={14} className="text-slate-400 ml-1" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-56 bg-white border border-slate-200/80 rounded-2xl shadow-premium glow-accent z-50 p-2 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">Insp. Jeevan Kumar</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Karnataka State Police HQ</p>
              </div>
              <div className="py-1">
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition">
                  <User size={15} />
                  <span>My Profile</span>
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition">
                  <Settings size={15} />
                  <span>System Settings</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition">
                  <LogOut size={15} />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}