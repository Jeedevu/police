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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    <div className="flex h-screen w-screen bg-[#08111F] text-[#F8FAFC] overflow-hidden font-sans relative">
      {/* Ambient background field */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-15%] left-[20%] w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #2563EB 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #4F46E5 0%, transparent 70%)" }}
        />
      </div>

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block h-full">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      </div>

      {/* Mobile Sidebar Overlay/Drawer */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 z-50 md:hidden"
            >
              <Sidebar 
                isCollapsed={false} 
                onToggle={() => setIsMobileSidebarOpen(false)} 
                isMobile={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative z-10">
        {/* Top Navbar */}
        <Navbar 
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} 
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-auto p-4 md:p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname} // Triggers animation on route changes
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full max-w-[1600px] mx-auto"
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
