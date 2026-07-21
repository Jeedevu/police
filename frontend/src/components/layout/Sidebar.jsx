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
  HelpCircle
} from "lucide-react";

export default function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/" },
    { name: "AI Chat", icon: <Bot size={20} className="text-violet-500" />, path: "/chat", badge: "NEW" },
    { name: "AI Assistant", icon: <Bot size={20} className="text-blue-600" />, path: "/investigation", badge: "AI" },
    { name: "Cases Dossier", icon: <FolderLock size={20} />, path: "/cases" },
    { name: "Global Search", icon: <Search size={20} />, path: "/search" },
    { name: "Network Intel", icon: <Share2 size={20} />, path: "/network" },
    { name: "Analytics", icon: <TrendingUp size={20} />, path: "/analytics" },
    { name: "Reports Gen", icon: <FileCheck size={20} />, path: "/reports" },
  ];

  const secondaryItems = [
    { name: "Suspect Profiles", icon: <UserSquare2 size={20} className="text-amber-600" />, path: "/profile/1" },
    { name: "Evidence Vault", icon: <Layers size={20} />, path: "/evidence" },
    { name: "Officers", icon: <Users size={20} className="text-blue-500" />, path: "/officers" },
    { name: "Threat Matrix", icon: <AlertOctagon size={20} className="text-red-500" />, path: "/analytics?tab=predictions" },
  ];

  const handleLinkClick = (path) => {
    // If navigating to subtabs, handle routing
  };

  return (
    <aside 
      className={`sidebar-glass h-full flex flex-col justify-between transition-all duration-300 relative ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div>
        <div className={`p-5 flex items-center border-b border-slate-100 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-md shadow-primary/20">
              <Shield size={22} className="stroke-[2.5]" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-extrabold text-sm tracking-wider bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  KSP CRIME AI
                </span>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                  Intelligence
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible toggle button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-16 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 p-1 rounded-full shadow-md z-10 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Main Menu Links */}
        <nav className="p-3 space-y-1.5 mt-4">
          <div className={`px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-opacity duration-200 ${isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
            Intelligence Core
          </div>
          {menuItems.map((item) => {
            const isActive = item.path === "/" 
              ? currentPath === "/" 
              : currentPath.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => handleLinkClick(item.path)}
                className={`flex items-center rounded-xl p-3 text-xs font-semibold tracking-wide transition-all duration-200 group relative ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/95"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800"
                } ${isCollapsed ? "justify-center" : "gap-3"}`}
              >
                <span>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Badge alert */}
                {item.badge && !isCollapsed && (
                  <span className="ml-auto bg-blue-100 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md shadow-slate-950/20">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Supporting Directories */}
        <nav className="p-3 space-y-1.5 mt-2">
          <div className={`px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-opacity duration-200 ${isCollapsed ? "opacity-0 h-0 overflow-hidden" : "opacity-100"}`}>
            Directories
          </div>
          {secondaryItems.map((item) => {
            const isActive = currentPath.startsWith(item.path.split("?")[0]);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center rounded-xl p-3 text-xs font-semibold tracking-wide transition-all duration-200 group relative ${
                  isActive
                    ? "bg-slate-100 text-slate-900 border border-slate-200"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-800"
                } ${isCollapsed ? "justify-center" : "gap-3"}`}
              >
                <span>{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md shadow-slate-950/20">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <Link
          to="/settings"
          className={`flex items-center rounded-xl p-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition group relative ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <Settings size={20} />
          {!isCollapsed && <span>System Settings</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap shadow-md shadow-slate-950/20">
              System Settings
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}