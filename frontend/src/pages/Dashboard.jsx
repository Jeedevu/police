import { useEffect, useState, useCallback } from "react";
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
  TrendingDown,
  FolderPlus,
  Pencil,
  Trash2,
  X,
  Flame
} from "lucide-react";
import Layout from "../components/layout/Layout";
import StatsCard from "../components/dashboard/StatsCard";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
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

const CRIME_TYPES = [
  "Theft / Larceny",
  "Robbery / Dacoity",
  "Cybercrime",
  "Homicide / Murder",
  "Assault / Bodily Harm",
  "Narcotics / NDPS",
  "Financial Fraud / Cheating",
  "Vehicle Theft",
  "Extortion",
  "Other Offence"
];

const DISTRICTS = [
  "Bengaluru City",
  "Mysuru City",
  "Mangaluru City",
  "Hubballi-Dharwad",
  "Belagavi",
  "Kalaburagi",
  "Shivamogga",
  "Ballari",
  "Davangere",
  "Tumakuru"
];

const CASE_STATUSES = [
  "Investigation",
  "Pending Chargesheet",
  "Under Trial",
  "Solved",
  "Closed"
];

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

  // Case Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditCase, setSelectedEditCase] = useState(null);

  // New Case Form State
  const [newCase, setNewCase] = useState({
    fir_number: "",
    crime_type: "Theft / Larceny",
    district: "Bengaluru City",
    police_station: "Central HQ",
    case_status: "Investigation",
    brief_facts: "",
  });

  // Edit Case Form State
  const [editForm, setEditForm] = useState({
    crime_type: "",
    district: "",
    police_station: "",
    case_status: "",
    brief_facts: "",
  });

  // Time-of-day greeting
  const [greeting, setGreeting] = useState("Good Morning");
  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs >= 12 && hrs < 17) setGreeting("Good Afternoon");
    else if (hrs >= 17) setGreeting("Good Evening");
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, trendsRes, districtsRes, monthlyRes, casesRes, alertsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/analytics/crime-trends"),
        api.get("/analytics/districts"),
        api.get("/analytics/monthly"),
        api.get("/api/cases").catch(() => api.get("/cases/")),
        api.get("/analytics/alerts"),
      ]);

      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setDistricts(districtsRes.data);
      setMonthly(monthlyRes.data);
      setAlerts(alertsRes.data || {});
      
      const casesList = Array.isArray(casesRes.data) ? casesRes.data : (casesRes.data?.data || []);
      const sortedCases = casesList.slice(-6).reverse();
      setRecentCases(sortedCases);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create Case Handler
  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newCase,
        fir_number: newCase.fir_number || `FIR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        crime_date: new Date().toISOString().split("T")[0],
      };
      await api.post("/api/cases", payload).catch(() => api.post("/cases/", payload));
      setShowCreateModal(false);
      setNewCase({
        fir_number: "",
        crime_type: "Theft / Larceny",
        district: "Bengaluru City",
        police_station: "Central HQ",
        case_status: "Investigation",
        brief_facts: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create case:", err);
      const msg = err.response?.data?.detail || "Failed to register case in database";
      alert(`Error: ${msg}`);
    }
  };

  // Open Edit Modal with full suspect and complainant details
  const openEditModal = async (c) => {
    setSelectedEditCase(c);
    let comp = {};
    let acc = {};
    try {
      const detailsRes = await api.get(`/investigation/${c.case_id}`);
      if (detailsRes.data) {
        comp = detailsRes.data.complainants?.[0] || {};
        acc = detailsRes.data.accused?.[0] || {};
      }
    } catch {
      // ignore
    }

    setEditForm({
      crime_type: c.crime_type || "Theft / Larceny",
      district: c.district || "Bengaluru City",
      police_station: c.police_station || "Central HQ",
      case_status: c.case_status || "Investigation",
      brief_facts: c.brief_facts || "",
      case_description: c.brief_facts || "",
      complainant_name: comp.name || "",
      complainant_mobile: comp.mobile || comp.p_mobile || "",
      complainant_aadhaar: comp.p_aadhaar || "",
      complainant_gender: comp.gender || "Male",
      complainant_age: comp.age || "",
      complainant_address: comp.address || comp.p_address || "",
      accused_name: acc.name || "",
      accused_mobile: acc.p_mobile || "",
      accused_aadhaar: acc.p_aadhaar || "",
      accused_gender: acc.gender || "Male",
      accused_age: acc.age || "",
      accused_address: acc.address || acc.p_address || "",
    });
    setShowEditModal(true);
  };

  // Edit Case Handler
  const handleUpdateCase = async (e) => {
    e.preventDefault();
    if (!selectedEditCase) return;
    try {
      await api.put(`/api/cases/${selectedEditCase.case_id}`, editForm)
        .catch(() => api.put(`/cases/${selectedEditCase.case_id}`, editForm));
      setShowEditModal(false);
      setSelectedEditCase(null);
      fetchData();
    } catch (err) {
      console.error("Failed to update case:", err);
      const msg = err.response?.data?.detail || "Failed to update case record";
      alert(`Error: ${msg}`);
    }
  };

  // Delete Case Handler
  const handleDeleteCase = async (caseId, firNumber) => {
    if (!window.confirm(`Are you sure you want to delete case ${firNumber || caseId} from the database?`)) return;
    try {
      await api.delete(`/api/cases/${caseId}`).catch(() => api.delete(`/cases/${caseId}`));
      fetchData();
    } catch (err) {
      console.error("Failed to delete case:", err);
      const msg = err.response?.data?.detail || "Failed to delete case";
      alert(`Error: ${msg}`);
    }
  };

  const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B"];

  const { officer, rank, role, badgeNumber, station, district } = useAuth();
  const officerName = officer?.full_name || "Officer";
  const avatarUrl = officer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(officerName)}&background=2563EB&color=fff&bold=true`;
  const lastLoginStr = officer?.last_login ? new Date(officer.last_login).toLocaleString() : "Active Session";

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

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={avatarUrl}
                alt="Officer Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-xl shrink-0"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/15 text-[10px] font-bold tracking-wider uppercase mb-2">
                  <Sparkles size={11} className="text-cyan-400 animate-pulse" />
                  <span>{rank || role || "Officer"} • BADGE: {badgeNumber}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  {greeting}, {rank} {officerName}
                </h1>
                <p className="text-slate-300 text-xs md:text-sm mt-1 font-medium leading-relaxed">
                  Jurisdiction: <span className="text-cyan-300 font-bold">{station}</span> ({district}) • Last Login: <span className="text-slate-200">{lastLoginStr}</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Link
                to="/heatmap"
                className="bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 border border-red-400/30"
              >
                <Flame size={15} className="animate-pulse" />
                <span>Crime Heat Map</span>
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 border border-emerald-400/30 cursor-pointer"
              >
                <FolderPlus size={15} />
                <span>+ Register New Case</span>
              </button>

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
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft flex flex-col h-[420px]">
            <div className="mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Jurisdiction Hotspots</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top regional distribution in Karnataka State</p>
            </div>
            <div className="flex-grow rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative">
              <div className="absolute inset-0 bg-slate-50 flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full text-slate-200/60" viewBox="0 0 500 500" fill="none">
                  <path d="M150 100 Q 250 80, 350 120 T 450 300 Q 300 400, 150 350 Z" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="2" />
                  <path d="M220 180 Q 280 150, 320 220" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />
                  
                  <circle cx="200" cy="150" r="15" fill="#3B82F6" className="opacity-25" />
                  <circle cx="200" cy="150" r="4" fill="#2563EB" />

                  <circle cx="340" cy="220" r="25" fill="#EF4444" className="opacity-15" />
                  <circle cx="340" cy="220" r="6" fill="#EF4444" />
                  
                  <circle cx="280" cy="290" r="18" fill="#F59E0B" className="opacity-20" />
                  <circle cx="280" cy="290" r="5" fill="#D97706" />

                  <circle cx="220" cy="310" r="12" fill="#10B981" className="opacity-25" />
                  <circle cx="220" cy="310" r="4" fill="#059669" />
                </svg>

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
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-soft lg:col-span-2 flex flex-col h-[420px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Case Dossiers & Management</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Create, update, or manage cases in central repository</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderPlus size={14} />
                  <span>+ New Case</span>
                </button>

                <Link to="/cases" className="text-primary hover:text-primary/95 text-xs font-bold flex items-center gap-1">
                  <span>View All Archive</span> <ArrowRight size={13} />
                </Link>
              </div>
            </div>
            
            <div className="flex-grow overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">FIR Identifier</th>
                    <th className="py-3 px-3">Category Head</th>
                    <th className="py-3 px-3">District Unit</th>
                    <th className="py-3 px-3">Case Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 text-slate-600">
                  {recentCases.length > 0 ? (
                    recentCases.map((c) => (
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
                        <td className="py-3 px-3 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            title="Edit Case Details"
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCase(c.case_id, c.fir_number)}
                            title="Delete Case"
                            className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg border border-slate-200 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>

                          <Link
                            to={`/cases?case_id=${c.case_id}`}
                            className="inline-flex items-center bg-slate-100 hover:bg-primary hover:text-white border border-slate-200/50 hover:border-primary text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                          >
                            Dossier
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No case records registered yet. Click <strong>+ New Case</strong> to register your first FIR.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FolderPlus size={18} className="text-emerald-400" />
              Register New FIR Case Record
            </h3>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">FIR Number</label>
                <input
                  type="text"
                  value={newCase.fir_number}
                  onChange={(e) => setNewCase({ ...newCase, fir_number: e.target.value })}
                  placeholder={`Auto: FIR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Crime Type / Head</label>
                  <select
                    value={newCase.crime_type}
                    onChange={(e) => setNewCase({ ...newCase, crime_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {CRIME_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Case Status</label>
                  <select
                    value={newCase.case_status}
                    onChange={(e) => setNewCase({ ...newCase, case_status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {CASE_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">District</label>
                  <select
                    value={newCase.district}
                    onChange={(e) => setNewCase({ ...newCase, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Police Station</label>
                  <input
                    type="text"
                    required
                    value={newCase.police_station}
                    onChange={(e) => setNewCase({ ...newCase, police_station: e.target.value })}
                    placeholder="Central HQ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Brief Facts / Description</label>
                <textarea
                  rows={3}
                  value={newCase.brief_facts}
                  onChange={(e) => setNewCase({ ...newCase, brief_facts: e.target.value })}
                  placeholder="Enter brief facts of the incident..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-600"
                ></textarea>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 cursor-pointer"
                >
                  Register Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {showEditModal && selectedEditCase && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedEditCase(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Pencil size={18} className="text-blue-400" />
              Edit Case Details — {selectedEditCase.fir_number}
            </h3>

            <form onSubmit={handleUpdateCase} className="space-y-4 text-xs">
              {/* SECTION 1: Case Meta */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">1. FIR & Incident Information</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Crime Type / Head</label>
                    <select
                      value={editForm.crime_type}
                      onChange={(e) => setEditForm({ ...editForm, crime_type: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {CRIME_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Case Status</label>
                    <select
                      value={editForm.case_status}
                      onChange={(e) => setEditForm({ ...editForm, case_status: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {CASE_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">District</label>
                    <select
                      value={editForm.district}
                      onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Police Station</label>
                    <input
                      type="text"
                      required
                      value={editForm.police_station}
                      onChange={(e) => setEditForm({ ...editForm, police_station: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Brief Facts / Description</label>
                  <textarea
                    rows={2}
                    value={editForm.brief_facts}
                    onChange={(e) => setEditForm({ ...editForm, brief_facts: e.target.value, case_description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  ></textarea>
                </div>
              </div>

              {/* SECTION 2: Complainant Info */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">2. Complainant Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Complainant Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={editForm.complainant_name || ""}
                      onChange={(e) => setEditForm({ ...editForm, complainant_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={editForm.complainant_mobile || ""}
                      onChange={(e) => setEditForm({ ...editForm, complainant_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar"
                      value={editForm.complainant_aadhaar || ""}
                      onChange={(e) => setEditForm({ ...editForm, complainant_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Age</label>
                    <input
                      type="number"
                      placeholder="Age"
                      value={editForm.complainant_age || ""}
                      onChange={(e) => setEditForm({ ...editForm, complainant_age: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Gender</label>
                    <select
                      value={editForm.complainant_gender || "Male"}
                      onChange={(e) => setEditForm({ ...editForm, complainant_gender: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="Full residential address"
                    value={editForm.complainant_address || ""}
                    onChange={(e) => setEditForm({ ...editForm, complainant_address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* SECTION 3: Accused Suspect Info */}
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">3. Accused Suspect Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Suspect Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Gowda"
                      value={editForm.accused_name || ""}
                      onChange={(e) => setEditForm({ ...editForm, accused_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="+91 9988776655"
                      value={editForm.accused_mobile || ""}
                      onChange={(e) => setEditForm({ ...editForm, accused_mobile: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar"
                      value={editForm.accused_aadhaar || ""}
                      onChange={(e) => setEditForm({ ...editForm, accused_aadhaar: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Age</label>
                    <input
                      type="number"
                      placeholder="Age"
                      value={editForm.accused_age || ""}
                      onChange={(e) => setEditForm({ ...editForm, accused_age: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Gender</label>
                    <select
                      value={editForm.accused_gender || "Male"}
                      onChange={(e) => setEditForm({ ...editForm, accused_gender: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Known Address / Hideout</label>
                  <input
                    type="text"
                    placeholder="Last known address"
                    value={editForm.accused_address || ""}
                    onChange={(e) => setEditForm({ ...editForm, accused_address: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEditCase(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 cursor-pointer"
                >
                  Save All Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}