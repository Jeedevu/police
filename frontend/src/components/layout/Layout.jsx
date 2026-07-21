import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";

export default function Layout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("ksp_sidebar_collapsed");
    return saved === "true";
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("ksp_sidebar_collapsed", String(newVal));
      return newVal;
    });
  };

  // Listen for Ctrl+K globally
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen bg-[#F8FAFC] text-[#0F172A] overflow-hidden font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar} 
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <Navbar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-auto bg-slate-50/50 p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname} // Triggers animation on route changes
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </div>
  );
}