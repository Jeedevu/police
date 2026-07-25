import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({ title, value, icon, color = "sky", trend = "+4.2%", isPositive = true }) {
  const colorMap = {
    sky: {
      ring: "ring-[#2563EB]/15",
      bg: "bg-[#2563EB]/10",
      text: "text-[#38BDF8]",
      glow: "rgba(37,99,235,0.18)",
    },
    emerald: {
      ring: "ring-[#10B981]/15",
      bg: "bg-[#10B981]/10",
      text: "text-[#10B981]",
      glow: "rgba(16,185,129,0.18)",
    },
    amber: {
      ring: "ring-[#F59E0B]/15",
      bg: "bg-[#F59E0B]/10",
      text: "text-[#F59E0B]",
      glow: "rgba(245,158,11,0.18)",
    },
    rose: {
      ring: "ring-[#EF4444]/15",
      bg: "bg-[#EF4444]/10",
      text: "text-[#EF4444]",
      glow: "rgba(239,68,68,0.18)",
    },
    violet: {
      ring: "ring-[#4F46E5]/15",
      bg: "bg-[#4F46E5]/10",
      text: "text-[#818CF8]",
      glow: "rgba(79,70,229,0.18)",
    },
  };

  const currentTheme = colorMap[color] || colorMap.sky;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`relative bg-[#111827] border border-white/[0.06] ring-1 ${currentTheme.ring} rounded-2xl p-5 h-[128px] flex flex-col justify-between overflow-hidden group transition-colors hover:border-white/[0.1]`}
      style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.02) inset" }}
    >
      {/* Ambient glow on hover */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
        style={{ background: currentTheme.glow }}
      />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-[0.12em] mb-2">
            {title}
          </p>
          <h3 className="text-[26px] leading-none font-bold text-[#F8FAFC] tracking-tight tabular-nums">
            {value}
          </h3>
        </div>
        <div
          className={`p-2.5 rounded-xl ${currentTheme.bg} ${currentTheme.text} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold relative">
        <span
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
            isPositive ? "bg-[#10B981]/10 text-[#10B981]" : "bg-[#EF4444]/10 text-[#EF4444]"
          }`}
        >
          {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </span>
        <span className="text-[#64748B] font-medium">vs last month</span>
      </div>
    </motion.div>
  );
}
