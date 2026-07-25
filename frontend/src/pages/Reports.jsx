import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  FileText,
  FileDown,
  AlertTriangle,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Clock,
  ShieldAlert
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import { generateExecutiveIntelligenceDossier } from "../utils/pdfDossierGenerator";

const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [caseStatusData, setCaseStatusData] = useState([]);
  const [officerWorkload, setOfficerWorkload] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          statsRes,
          trendsRes,
          districtsRes,
          statusRes,
          workloadRes,
          alertsRes,
          predictionsRes,
        ] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/analytics/crime-trends"),
          api.get("/analytics/districts"),
          api.get("/analytics/case-status"),
          api.get("/analytics/officer-workload"),
          api.get("/analytics/alerts"),
          api.get("/analytics/predictions"),
        ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data || []);
        setDistricts(districtsRes.data || []);
        setCaseStatusData(statusRes.data || []);
        setOfficerWorkload(workloadRes.data || []);
        setAlerts(alertsRes.data || {});
        setPredictions(predictionsRes.data || []);
      } catch (err) {
        console.error("Reports fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const exportFullReport = () => {
    generateExecutiveIntelligenceDossier({
      stats,
      trends,
      districts,
      alerts,
      predictions
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Compiling PDF sheets...</p>
        </div>
      </Layout>
    );
  }

  // Calculate percentage solved
  const solvedPercentage = stats ? ((stats.closed_cases / stats.total_cases) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 select-none">
        
        {/* Page Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-soft flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800 flex items-center gap-2">
              <FileText size={20} className="text-primary" /> COMMAND ARCHIVE REPORTS
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Export and construct legal summaries for supreme officer audits and dispatch logs.
            </p>
          </div>
          
          <button
            onClick={exportFullReport}
            className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-md shadow-primary/10"
          >
            <FileDown size={14} /> <span>Compile PDF Dossier</span>
          </button>
        </div>

        {/* Operational Statistics grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total FIR cases</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{stats.total_cases}</h3>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Active Inquiries</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{stats.open_cases}</h3>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Solved Cases</span>
              <h3 className="text-xl font-black text-slate-800 mt-1">{stats.closed_cases}</h3>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Case Solved Rate</span>
              <h3 className="text-xl font-black text-emerald-600 mt-1">{solvedPercentage}%</h3>
            </div>
          </div>
        )}

        {/* Charts & Roster Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Solved Cases Distribution Recharts */}
          <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-soft h-[350px] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Case Solved Ratios</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Visual distribution representing active vs closed folders</p>
            </div>
            
            <div className="flex-grow min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseStatusData.length > 0 ? caseStatusData : [
                      { name: "Solved", value: stats?.closed_cases || 50 },
                      { name: "Active", value: stats?.open_cases || 50 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#3B82F6" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(226, 232, 240, 0.8)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                    itemStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-black text-slate-800">{solvedPercentage}%</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Closed</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 text-[10px] font-bold text-slate-500 mt-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Solved</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Open</span>
            </div>
          </div>

          {/* Active alerts danger index */}
          <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-soft h-[350px] flex flex-col lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">High Risk Suspect Registry</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Logged dangerous repeat offenders requiring dispatch surveillance</p>
            </div>
            
            <div className="flex-grow overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] pb-2">
                    <th className="py-2.5 px-3">Suspect Name</th>
                    <th className="py-2.5 px-3">Contact Trace</th>
                    <th className="py-2.5 px-3">Threat Profile</th>
                    <th className="py-2.5 px-3 text-right">Danger Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {alerts?.high_risk_suspects?.slice(0, 5).map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span>{s.full_name}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">{s.mobile || "No active cell mapping"}</td>
                      <td className="py-3 px-3">
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200/20 px-2 py-0.5 rounded-md">
                          CRITICAL Offence
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-[10px] font-extrabold text-red-600 bg-red-50 px-2 py-1 rounded-xl">
                          {s.risk_score}% RISK
                        </span>
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