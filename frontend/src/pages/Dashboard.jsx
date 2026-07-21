import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  UserX, 
  Car, 
  Layers, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  MapPin, 
  Activity, 
  TrendingUp, 
  UserCheck, 
  ArrowRight,
  TrendingDown
} from "lucide-react";
import Layout from "../components/layout/Layout";
import StatsCard from "../components/dashboard/StatsCard";
import api from "../services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_cases: 0,
    open_cases: 0,
    closed_cases: 0,
    criminals: 0,
    complainants: 0,
    vehicles: 0,
    evidence: 0,
  });

  const [trends, setTrends] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [recentCases, setRecentCases] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  // Time-of-day greeting
  const [greeting, setGreeting] = useState("Good Morning");
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs >= 12 && hrs < 17) setGreeting("Good Afternoon");
    else if (hrs >= 17) setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes, districtsRes, monthlyRes, casesRes, alertsRes] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/analytics/crime-trends"),
          api.get("/analytics/districts"),
          api.get("/analytics/monthly"),
          api.get("/cases/"),
          api.get("/analytics/alerts"),
        ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data);
        setDistricts(districtsRes.data);
        setMonthly(monthlyRes.data);
        setAlerts(alertsRes.data || {});
        const sortedCases = (casesRes.data || [])
          .slice(-4)
          .reverse();
        setRecentCases(sortedCases);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <div className="text-center">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Running KSP Core Engines...</h4>
            <p className="text-[10px] text-slate-400 mt-1">Aggregating records and compiling crime metrics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Large Premium Greeting Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-primary p-6 md:p-8 text-white shadow-premium">
          {/* Decorative mesh background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400 via-blue-500 to-indigo-600"></div>
          <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 text-[10px] font-bold tracking-wider uppercase mb-3">
                <Sparkles size={11} className="text-cyan-400 animate-pulse" />
                <span>AI-ASSISTED DECISION ROOM</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {greeting}, Inspector Jeevan
              </h1>
              <p className="text-slate-300 text-xs md:text-sm mt-1.5 font-medium max-w-xl leading-relaxed">
                Crime index indicates an optimal response time of <span className="text-cyan-300 font-bold">1.2m</span> this hour. Intelligence systems are online and mapping active investigations.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Link
                to="/investigation"
                className="bg-white hover:bg-slate-50 text-slate-950 text-xs font-bold px-4 py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 border border-slate-100"
              >
                <Sparkles size={14} className="text-primary" />
                <span>Ask KSP AI Assistant</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Dynamic Counter KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard title="Total FIR Files" value={stats.total_cases} icon={<FileText size={18} />} color="sky" trend="+6.2%" />
          <StatsCard title="Open Cases" value={stats.open_cases} icon={<Clock size={18} />} color="amber" trend="-2.4%" isPositive={false} />
          <StatsCard title="Solved / Closed" value={stats.closed_cases} icon={<CheckCircle2 size={18} />} color="emerald" trend="+11.1%" />
          <StatsCard title="High Risk Suspects" value={stats.criminals} icon={<UserX size={18} />} color="rose" trend="+1.5%" />
          <StatsCard title="Vehicles Scan" value={stats.vehicles} icon={<Car size={18} />} color="violet" trend="+4.8%" />
          <StatsCard title="Evidence Items" value={stats.evidence} icon={<Layers size={18} />} color="sky" trend="+8.3%" />
        </div>

        {/* Charts & Map split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Monthly Incidents Trend Line Chart */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft lg:col-span-8 flex flex-col h-[350px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Monthly Incident Frequencies</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Aggregated dataset mapped by case registration dates</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <TrendingUp size={11} /> Solved Rate up +5%
              </span>
            </div>
            
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(226, 232, 240, 0.8)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                    labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#1E293B" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Area type="monotone" dataKey="total_cases" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" name="Incident Volume" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Crime Distribution Head bar chart */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft lg:col-span-4 flex flex-col h-[350px]">
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Distribution By Crime Head</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top-ranking categories in active dossiers</p>
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trends}>
                  <XAxis dataKey="crime_type" stroke="#94A3B8" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(226, 232, 240, 0.8)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                    labelStyle={{ fontWeight: "bold", fontSize: "11px", color: "#1E293B" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                  <Bar dataKey="total_cases" radius={[6, 6, 0, 0]} name="Cases Count">
                    {trends.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* High Risk Suspect Ticker */}
        {alerts && alerts.high_risk_suspects && alerts.high_risk_suspects.length > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-3xl p-5 shadow-soft">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
                <h3 className="text-xs font-bold uppercase tracking-widest text-red-700 flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Active High-Threat Suspect Alerts
                </h3>
              </div>
              <Link to="/reports" className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1">
                <span>View Full Danger Matrix</span> <ArrowRight size={13} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {alerts.high_risk_suspects.slice(0, 4).map((s) => (
                <Link
                  key={s.person_id}
                  to={`/profile/${s.person_id}`}
                  className="flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-150 hover:border-red-200/50 p-3 rounded-2xl transition shadow-sm group"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate group-hover:text-primary transition-colors">{s.full_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.mobile || "No active IMEI tracking"}</p>
                  </div>
                  <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-200/30 px-2 py-0.5 rounded-full shrink-0 ml-2">
                    {s.risk_score}% RISK
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Incident Mapping & Activity logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Geographic incidents */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft flex flex-col h-[400px]">
            <div className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Jurisdiction Hotspots</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top regional distribution in Karnataka State</p>
            </div>
            <div className="flex-grow rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative">
              
              {/* Custom styled light vector mapping placeholder representation */}
              <div className="absolute inset-0 bg-slate-50 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full text-slate-200/60" viewBox="0 0 500 500" fill="none">
                  {/* Visual mockup outline representing geographic boundaries */}
                  <path d="M150 100 Q 250 80, 350 120 T 450 300 Q 300 400, 150 350 Z" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
                  <path d="M220 180 Q 280 150, 320 220" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
                  
                  {/* Dynamic Hotspots pulses */}
                  <circle cx="200" cy="150" r="15" fill="#3B82F6" className="opacity-25" />
                  <circle cx="200" cy="150" r="4" fill="#2563EB" />

                  <circle cx="340" cy="220" r="25" fill="#EF4444" className="opacity-15" />
                  <circle cx="340" cy="220" r="6" fill="#EF4444" />
                  
                  <circle cx="280" cy="290" r="18" fill="#F59E0B" className="opacity-20" />
                  <circle cx="280" cy="290" r="5" fill="#D97706" />

                  <circle cx="220" cy="310" r="12" fill="#10B981" className="opacity-25" />
                  <circle cx="220" cy="310" r="4" fill="#059669" />
                </svg>

                {/* Floating Map Indicators */}
                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/50 shadow-soft text-[9px] font-bold text-slate-600 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>High Frequency ({districts[0]?.district || "Bengaluru"})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Moderate ({districts[1]?.district || "Mysuru"})</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Active Timeline & Recent Investigations */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft lg:col-span-2 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Investigations</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Most recent FIR logs synchronised with central servers</p>
              </div>
              <Link to="/cases" className="text-primary hover:text-primary/95 text-xs font-bold flex items-center gap-1">
                <span>Access Archive</span> <ArrowRight size={13} />
              </Link>
            </div>
            
            <div className="flex-grow overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">FIR Identifier</th>
                    <th className="py-3 px-3">Category Head</th>
                    <th className="py-3 px-3">District Unit</th>
                    <th className="py-3 px-3">Case Status</th>
                    <th className="py-3 px-3 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 text-slate-600">
                  {recentCases.map((c) => (
                    <tr key={c.case_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">{c.fir_number}</td>
                      <td className="py-3 px-3 font-medium text-slate-700">{c.crime_type}</td>
                      <td className="py-3 px-3 text-slate-500">{c.district}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
                          c.case_status === "Solved" || c.case_status === "Closed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${c.case_status === "Solved" || c.case_status === "Closed" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                          {c.case_status || "Investigation"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/cases?case_id=${c.case_id}`}
                          className="inline-flex items-center bg-slate-100 hover:bg-primary hover:text-white border border-slate-200/50 hover:border-primary text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                        >
                          View Dossier
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}