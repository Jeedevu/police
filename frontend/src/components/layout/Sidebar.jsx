import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Bot, 
  FolderLock, 
  Search, 
  Share2, 
  TrendingUp, 
  FileCheck, 
  UserSquare2, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  Layers,
  Users,
  AlertOctagon,
  FileSpreadsheet
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { hasPermission, hasRole, isAdmin, role, rank } = useAuth();

  const roleLower = (role || "").toLowerCase();

  // Define full menu matrix
  const allMenuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={19} />, path: "/", permission: "dashboard" },
    { name: "AI Chat", icon: <Bot size={19} />, path: "/chat", badge: "AI", permission: "ai_analytics", accent: "#4F46E5" },
    { name: "AI Assistant", icon: <Bot size={19} />, path: "/investigation", badge: "PRO", permission: "ai_analytics", accent: "#2563EB" },
    { name: "Cases Dossier", icon: <FolderLock size={19} />, path: "/cases", permission: "cases" },
    { name: "Global Search", icon: <Search size={19} />, path: "/search", permission: "cases" },
    { name: "Network Intel", icon: <Share2 size={19} />, path: "/network", permission: "analytics" },
    { name: "Analytics", icon: <TrendingUp size={19} />, path: "/analytics", permission: "analytics" },
    { name: "Reports Gen", icon: <FileCheck size={19} />, path: "/reports", permission: "analytics" },
  ];

  const allSecondaryItems = [
    { name: "Suspect Profiles", icon: <UserSquare2 size={19} />, path: "/profile/1", permission: "cases", accent: "#F59E0B" },
    { name: "Evidence Vault", icon: <Layers size={19} />, path: "/evidence", permission: "evidence" },
    { name: "Officers Management", icon: <Users size={19} />, path: "/officers", permission: "users", accent: "#2563EB" },
    { name: "Threat Matrix", icon: <AlertOctagon size={19} />, path: "/analytics?tab=predictions", permission: "analytics", accent: "#EF4444" },
  ];

  // Dynamic Filtering based on User Role & Permissions
  const menuItems = allMenuItems.filter((item) => {
    if (isAdmin) return true;
    if (item.name === "Dashboard" || item.name === "Cases Dossier" || item.name === "Global Search") return true;
    if (item.name.includes("AI") || item.name === "Analytics" || item.name === "Reports Gen" || item.name === "Network Intel") {
      return ["inspector", "sub inspector", "si", "dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower) || hasPermission(item.permission);
    }
    return hasPermission(item.permission);
  });

  const secondaryItems = allSecondaryItems.filter((item) => {
    if (isAdmin) return true;
    if (item.name === "Evidence Vault") {
      return ["sub inspector", "si", "inspector", "dsp", "sp", "dig", "igp", "dgp", "admin"].includes(roleLower) || hasPermission("evidence");
    }
    if (item.name === "Officers Management") {
      return ["sp", "dig", "igp", "dgp", "admin"].includes(roleLower) || hasPermission("users");
    }
    return hasPermission(item.permission);
  });

  return (
    <aside 
      className={`h-full flex flex-col justify-between transition-all duration-300 relative border-r border-white/[0.06] ${
        isCollapsed ? "w-20" : "w-64"
      }`}
      style={{
        background: "linear-gradient(180deg, #0B1626 0%, #08111F 100%)",
      }}
    >
      {/* Sidebar Header */}
      <div>
        <div className={`h-[65px] px-5 flex items-center border-b border-white/[0.06] ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white relative"
              style={{
                background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.08) inset, 0 6px 18px -4px rgba(37,99,235,0.5)",
              }}
            >
              <Shield size={20} className="stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-[13px] tracking-wide text-[#F8FAFC] block truncate">
                  KSP CRIME AI
                </span>
                <div className="text-[9px] text-[#64748B] font-bold uppercase tracking-[0.14em] leading-none mt-1 truncate">
                  {rank || role || "Officer"} View
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[52px] w-6 h-6 flex items-center justify-center bg-[#162235] border border-white/10 hover:border-[#2563EB]/50 hover:bg-[#1a2942] text-[#64748B] hover:text-[#38BDF8] rounded-full shadow-lg z-10 transition-all"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Main Menu Links */}
        <nav className="p-3 space-y-1 mt-4">
          <div className={`px-3 mb-2 text-[9px] font-bold text-[#475569] uppercase tracking-[0.16em] transition-opacity duration-200 ${isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
            Intelligence Core
          </div>
          {menuItems.map((item) => {
            const isActive = item.path === "/" 
              ? currentPath === "/" 
              : currentPath.startsWith(item.path);
            const accent = item.accent || "#2563EB";

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center rounded-xl px-3 py-2.5 text-[12.5px] font-semibold tracking-wide transition-all duration-200 group relative ${
                  isActive
                    ? "text-white"
                    : "text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F8FAFC]"
                } ${isCollapsed ? "justify-center" : "gap-3"}`}
                style={
                  isActive
                    ? {
                        background: "linear-gradient(135deg, rgba(37,99,235,0.9) 0%, rgba(79,70,229,0.9) 100%)",
                        boxShadow: "0 4px 14px -4px rgba(37,99,235,0.45)",
                      }
                    : undefined
                }
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-5 rounded-full bg-[#38BDF8]" />
                )}
                <span className={isActive ? "text-white" : ""} style={!isActive ? { color: accent } : undefined}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Badge alert */}
                {item.badge && !isCollapsed && (
                  <span
                    className={`ml-auto text-[8.5px] font-bold px-1.5 py-0.5 rounded-full tracking-wide ${
                      isActive ? "bg-white/20 text-white" : "bg-[#2563EB]/15 text-[#38BDF8]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#162235] border border-white/10 text-[#F8FAFC] text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Supporting Directories */}
        {secondaryItems.length > 0 && (
          <nav className="p-3 space-y-1 mt-2">
            <div className={`px-3 mb-2 text-[9px] font-bold text-[#475569] uppercase tracking-[0.16em] transition-opacity duration-200 ${isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
              Directories &amp; Ops
            </div>
            {secondaryItems.map((item) => {
              const isActive = currentPath.startsWith(item.path.split("?")[0]);
              const accent = item.accent || "#64748B";
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center rounded-xl px-3 py-2.5 text-[12.5px] font-semibold tracking-wide transition-all duration-200 group relative ${
                    isActive
                      ? "bg-white/[0.06] text-[#F8FAFC] border border-white/10"
                      : "text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F8FAFC] border border-transparent"
                  } ${isCollapsed ? "justify-center" : "gap-3"}`}
                >
                  <span style={{ color: isActive ? "#F8FAFC" : accent }}>{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.name}</span>}

                  {/* Collapsed Tooltip */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#162235] border border-white/10 text-[#F8FAFC] text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                      {item.name}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        {isAdmin && (
          <Link
            to="/settings"
            className={`flex items-center rounded-xl px-3 py-2.5 text-[12.5px] font-semibold text-[#94A3B8] hover:bg-white/[0.04] hover:text-[#F8FAFC] transition group relative ${
              isCollapsed ? "justify-center" : "gap-3"
            }`}
          >
            <Settings size={19} />
            {!isCollapsed && <span>System Settings</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#162235] border border-white/10 text-[#F8FAFC] text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-xl">
                System Settings
              </div>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
