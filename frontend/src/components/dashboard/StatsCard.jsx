import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatsCard({ title, value, icon, color = "sky", trend = "+4.2%", isPositive = true }) {
  const colorMap = {
    sky: {
      border: "border-blue-100",
      bg: "bg-blue-50/50",
      text: "text-blue-600",
      shadow: "shadow-blue-500/5",
    },
    emerald: {
      border: "border-emerald-100",
      bg: "bg-emerald-50/50",
      text: "text-emerald-600",
      shadow: "shadow-emerald-500/5",
    },
    amber: {
      border: "border-amber-100",
      bg: "bg-amber-50/50",
      text: "text-amber-600",
      shadow: "shadow-amber-500/5",
    },
    rose: {
      border: "border-red-100",
      bg: "bg-red-50/50",
      text: "text-red-600",
      shadow: "shadow-red-500/5",
    },
    violet: {
      border: "border-violet-100",
      bg: "bg-violet-50/50",
      text: "text-violet-600",
      shadow: "shadow-violet-500/5",
    },
  };

  const currentTheme = colorMap[color] || colorMap.sky;

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.05)" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-white border ${currentTheme.border} rounded-2xl p-5 shadow-soft hover:border-slate-200 transition-colors flex flex-col justify-between h-[125px] relative overflow-hidden group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">
            {title}
          </p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl ${currentTheme.bg} ${currentTheme.text} transition-transform group-hover:scale-110 duration-350`}>
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
        <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
          isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        }`}>
          {isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {trend}
        </span>
        <span className="text-slate-400">vs last month</span>
      </div>
    </motion.div>
  );
}