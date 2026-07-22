import { useState, useEffect } from "react";
import { Search, Bell, Shield, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Navbar({ onOpenCommandPalette }) {
  const { officer, role, rank, logout, station, district } = useAuth();
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

  return (
    <header
      className="h-[65px] px-6 flex justify-between items-center sticky top-0 z-40 border-b border-white/[0.06]"
      style={{
        background: "rgba(8, 17, 31, 0.75)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Search Input hotkey trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between bg-white/[0.03] hover:bg-white/[0.05] text-[#64748B] border border-white/[0.07] hover:border-white/[0.12] rounded-xl px-4 py-2.5 text-xs transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Search size={15} className="text-[#64748B]" />
            <span className="font-medium text-[#94A3B8]">Search FIR, Suspects, Evidence...</span>
          </div>
          <kbd className="bg-white/[0.05] border border-white/[0.08] text-[9.5px] text-[#94A3B8] font-bold px-1.5 py-0.5 rounded-md">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Action utilities */}
      <div className="flex items-center gap-3">
        {/* Active Dispatch audio indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-[#10B981]/[0.08] border border-[#10B981]/25 text-[#10B981] px-3 py-2 rounded-xl text-[9.5px] font-bold tracking-wide shadow-sm select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]"></span>
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
                ? "bg-white/[0.06] border-white/[0.14] text-[#F8FAFC]" 
                : "bg-white/[0.02] border-white/[0.07] text-[#94A3B8] hover:bg-white/[0.05] hover:text-[#F8FAFC]"
            }`}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-[9px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-[#08111F]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 mt-2.5 w-80 rounded-2xl z-50 p-2 border border-white/[0.08] shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200"
              style={{ background: "#111827", boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)" }}
            >
              <div className="px-3 py-2.5 border-b border-white/[0.06] flex justify-between items-center">
                <span className="text-xs font-bold text-[#F8FAFC]">Intel Notifications</span>
                <span className="text-[9.5px] bg-[#EF4444]/10 text-[#EF4444] font-bold px-2 py-0.5 rounded-full">
                  High Risk Alerts
                </span>
              </div>
              <div className="py-1.5 max-h-[280px] overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 hover:bg-white/[0.04] rounded-xl transition flex gap-3 items-start border border-transparent hover:border-white/[0.06] mb-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444] shrink-0 mt-0.5">
                        <Shield size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <p className="text-xs font-bold text-[#F8FAFC] truncate">{item.full_name}</p>
                          <span className="text-[9px] bg-[#EF4444]/15 text-[#F87171] font-black px-1.5 py-0.5 rounded-full shrink-0">
                            {item.risk_score}%
                          </span>
                        </div>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">High-risk suspect active in {item.mobile ? "cell grid tracking" : "dossier database"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-[#64748B]">
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
            className="flex items-center gap-3 p-1.5 pr-3 bg-white/[0.02] border border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12] rounded-xl transition text-left"
          >
            <img
              src={avatarUrl}
              alt="Officer Avatar"
              className="w-8 h-8 rounded-lg object-cover border border-white/10"
            />
            <div className="hidden md:block">
              <p className="text-[11px] font-bold text-[#F8FAFC] leading-tight">{officerName}</p>
              <p className="text-[9px] text-[#64748B] leading-none mt-0.5">{rank || role} &middot; {officer?.badge_number || "KSP"}</p>
            </div>
            <ChevronDown size={14} className="text-[#64748B] ml-1" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div
              className="absolute right-0 mt-2.5 w-60 rounded-2xl z-50 p-2 border border-white/[0.08] shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200"
              style={{ background: "#111827", boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)" }}
            >
              <div className="px-3 py-2.5 border-b border-white/[0.06]">
                <p className="text-xs font-bold text-[#F8FAFC]">{officerName}</p>
                <p className="text-[10px] font-medium text-[#94A3B8] mt-0.5">{rank || role} ({officer?.badge_number || "KSP"})</p>
                <p className="text-[9px] text-[#64748B] mt-0.5">{station} &middot; {district}</p>
              </div>
              <div className="py-1">
                <div className="px-3 py-1.5 text-[9.5px] text-[#64748B] font-bold uppercase tracking-wider">
                  Role: <span className="text-[#38BDF8]">{role}</span>
                </div>
                <div className="border-t border-white/[0.06] my-1" />
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold text-[#F87171] hover:bg-[#EF4444]/10 transition"
                >
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
