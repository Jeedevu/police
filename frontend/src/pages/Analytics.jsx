import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, { MiniMap, Controls, Background } from "reactflow";
import "reactflow/dist/style.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  CartesianGrid
} from "recharts";
import { 
  UserX, 
  MapPin, 
  Users, 
  Brain, 
  Network, 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Calendar,
  Sparkles
} from "lucide-react";
import Layout from "../components/layout/Layout";
import api from "../services/api";

const COLORS = ["#3B82F6", "#06B6D4", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B", "#EC4899"];

function RiskBadge({ score }) {
  const val = score ?? 0;
  const color =
    val >= 85
      ? "bg-red-50 text-red-700 border-red-200"
      : val >= 60
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${color}`}>
      {val}% RISK
    </span>
  );
}

export default function Analytics() {
  const [repeatOffenders, setRepeatOffenders] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [officerWorkload, setOfficerWorkload] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [activeSection, setActiveSection] = useState("suspects");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [repeatRes, distRes, networkRes, workloadRes, predictRes] = await Promise.all([
          api.get("/analytics/repeat-offenders"),
          api.get("/analytics/districts"),
          api.get("/analytics/criminal-network"),
          api.get("/analytics/officer-workload"),
          api.get("/analytics/predictions"),
        ]);

        setRepeatOffenders(repeatRes.data || []);
        setDistricts(distRes.data || []);
        setOfficerWorkload(workloadRes.data || []);
        setPredictions(predictRes.data || []);

        // Build ReactFlow Nodes and Edges with custom bright styling
        const relations = networkRes.data || [];
        const nodesMap = new Map();
        const flowEdges = [];

        relations.forEach((rel, index) => {
          if (!nodesMap.has(rel.person)) {
            nodesMap.set(rel.person, {
              id: `person-${rel.person_id}`,
              data: { label: rel.person },
              position: { x: 0, y: 0 },
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "2px solid #3B82F6",
                borderRadius: "12px",
                padding: "8px 12px",
                fontSize: "11px",
                fontWeight: "bold",
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
              },
            });
          }

          if (!nodesMap.has(rel.associate)) {
            nodesMap.set(rel.associate, {
              id: `person-${rel.associate_person_id}`,
              data: { label: rel.associate },
              position: { x: 0, y: 0 },
              style: {
                background: "#ffffff",
                color: "#0f172a",
                border: "2px solid #06B6D4",
                borderRadius: "12px",
                padding: "8px 12px",
                fontSize: "11px",
                fontWeight: "bold",
                textAlign: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
              },
            });
          }

          flowEdges.push({
            id: `edge-${index}`,
            source: `person-${rel.person_id}`,
            target: `person-${rel.associate_person_id}`,
            label: rel.relationship,
            animated: true,
            style: { stroke: "#3B82F6", strokeWidth: 2 },
            labelStyle: { fill: "#475569", fontSize: "9px", fontWeight: "bold" },
            labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.9 },
          });
        });

        const flowNodes = Array.from(nodesMap.values());
        const center = { x: 300, y: 150 };
        const radius = 120;
        flowNodes.forEach((node, i) => {
          const angle = (i / flowNodes.length) * 2 * Math.PI;
          node.position = {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle),
          };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        console.error("Error loading analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Heatmap intensity level mapping
  const maxCases = Math.max(...districts.map((d) => d.total_cases), 1);
  const getHeatColor = (count) => {
    const ratio = count / maxCases;
    if (ratio >= 0.8) return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", intensity: "CRITICAL ALERT" };
    if (ratio >= 0.6) return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", intensity: "HIGH WARNING" };
    if (ratio >= 0.4) return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", intensity: "MODERATE RISK" };
    if (ratio >= 0.2) return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", intensity: "LOW RISK" };
    return { bg: "bg-slate-50", border: "border-slate-200/60", text: "text-slate-500", intensity: "STABLE INDEX" };
  };

  const sections = [
    { id: "suspects", label: "Repeat Suspects", icon: <UserX size={15} /> },
    { id: "heatmap", label: "Crime Heatmap", icon: <MapPin size={15} /> },
    { id: "workload", label: "Officer Activity", icon: <Users size={15} /> },
    { id: "prediction", label: "AI Predictions", icon: <Brain size={15} /> },
    { id: "network", label: "Criminal Network", icon: <Network size={15} /> },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Running statistical compile engines...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10 select-none">
        
        {/* Page Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-soft">
          <h1 className="text-lg font-black tracking-tight text-slate-800">INTELLIGENCE & PATTERN ANALYTICS</h1>
          <p className="text-slate-400 text-xs mt-1">
            Statistical crime projections, repeat suspects, district hotspots, and officer workload analysis.
          </p>
        </div>

        {/* Section Tabs bar */}
        <div className="flex gap-2 flex-wrap">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                activeSection === s.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-slate-500 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span>{s.icon}</span> <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Display Panel */}
        <div className="flex-1 min-h-[450px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full"
            >
              
              {/* Repeat Suspects Tab */}
              {activeSection === "suspects" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {repeatOffenders.map((s, index) => (
                    <div key={index} className="bg-white border border-slate-150 p-5 rounded-2xl shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col justify-between h-[150px]">
                      <div>
                        <div className="flex justify-between items-start">
                          <h4 className="text-xs font-black text-slate-800 truncate max-w-[140px]">{s.full_name}</h4>
                          <RiskBadge score={s.risk_score} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Logged FIR Cases: <span className="text-primary font-bold">{s.cases} cases</span></p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">Last Contact: {s.mobile || "No active cellular signal"}</p>
                      </div>
                      
                      <Link
                        to={`/profile/1`}
                        className="w-full bg-slate-50 hover:bg-primary hover:text-white border border-slate-200/50 hover:border-primary text-center text-[10px] font-bold py-2 rounded-xl transition-all"
                      >
                        Inspect Full Profile Dossier
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              {/* Crime Heatmap Tab */}
              {activeSection === "heatmap" && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary p-6 rounded-3xl text-white shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                        <MapPin size={24} className="animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-base font-black tracking-tight">KSP Full Interactive GIS Heat Map Engine</h3>
                        <p className="text-slate-300 text-xs mt-0.5">Explore real-time 3D spatial crime density, hotspot AI inspector, custom overlays, and PDF exports.</p>
                      </div>
                    </div>
                    <Link
                      to="/heatmap"
                      className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-cyan-400/20 flex items-center gap-2 shrink-0"
                    >
                      <span>Launch Heat Map Studio</span> &rarr;
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {districts.map((d, index) => {
                      const heat = getHeatColor(d.total_cases);
                      return (
                        <div key={index} className={`border rounded-2xl p-5 shadow-soft transition-all duration-300 ${heat.bg} ${heat.border} flex justify-between items-center`}>
                          <div>
                            <h4 className="text-xs font-black text-slate-800">{d.district} Unit</h4>
                            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Incident Record count: <span className="text-slate-700 font-extrabold">{d.total_cases} files</span></p>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl border border-transparent bg-white/70 shadow-sm shrink-0 ${heat.text}`}>
                            {heat.intensity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Officer Activity Workload Tab */}
              {activeSection === "workload" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Radar chart visualization */}
                  <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-soft flex flex-col h-[380px] lg:col-span-1">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Activity Strength</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned docket capacity by station units</p>
                    </div>
                    
                    <div className="flex-grow min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" radius="70%" data={officerWorkload}>
                          <PolarGrid stroke="#E2E8F0" />
                          <PolarAngleAxis dataKey="officer" stroke="#94A3B8" fontSize={9} />
                          <Radar name="Active Cases" dataKey="total_cases" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(226, 232, 240, 0.8)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                            itemStyle={{ fontSize: "11px" }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* High Density activity table */}
                  <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-soft flex flex-col h-[380px] lg:col-span-2">
                    <div className="mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Investigation Officer Roster</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">District workload allocation dockets</p>
                    </div>
                    
                    <div className="flex-grow overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] pb-2">
                            <th className="py-2.5 px-3">Officer Code Sign</th>
                            <th className="py-2.5 px-3">Active Dossiers</th>
                            <th className="py-2.5 px-3">Current Assignment</th>
                            <th className="py-2.5 px-3 text-right">Workload Load</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          {officerWorkload.map((o, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="py-3 px-3 font-bold text-slate-800 flex items-center gap-2">
                                <img
                                  src={`https://ui-avatars.com/api/?name=${o.officer}&background=2563EB&color=fff&bold=true`}
                                  alt="IO"
                                  className="w-6 h-6 rounded-lg shadow-sm"
                                />
                                <span>{o.officer}</span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-slate-700">{o.total_cases} files</td>
                              <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]">{o.current_case || "Cyber Fraud (Active)"}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                                  o.total_cases > 5 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                                }`}>
                                  {o.total_cases > 5 ? "OVERLOADED" : "NOMINAL"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* AI Predictions Tab */}
              {activeSection === "prediction" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {predictions.map((p, index) => (
                    <div key={index} className="bg-white border border-slate-150 p-5 rounded-3xl shadow-soft hover:shadow-premium transition-all duration-300 flex flex-col justify-between h-[210px] relative overflow-hidden group">
                      <div className="absolute right-0 top-0 bg-blue-500 text-white text-[8px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                        AI Forecast
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                            <Sparkles size={14} className="animate-pulse" />
                          </span>
                          <h4 className="text-xs font-black text-slate-800">{p.district} Region</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">Predicted Crime Head: <span className="text-primary font-bold">{p.predicted_crime_type}</span></p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">Confidence Coefficient: <span className="text-slate-700 font-extrabold">{p.probability_score}% confidence</span></p>
                        <p className="text-[10.5px] text-slate-500 mt-2.5 leading-relaxed italic">{p.recommendation || "Maintain active police grids."}</p>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><Calendar size={12} /> Target: Next 30 days</span>
                        <span className="text-red-500 font-bold">GRAVITY: HIGH</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Criminal Connection Network Map Tab */}
              {activeSection === "network" && (
                <div className="bg-white border border-slate-150 rounded-3xl p-4 shadow-soft h-[500px] flex flex-col overflow-hidden">
                  <div className="mb-3 shrink-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Suspect Relationship Matrix</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Trace co-accused connection networks. Nodes represent suspects; edges show FIR connection counts.</p>
                  </div>
                  
                  <div className="flex-1 min-h-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative">
                    <ReactFlow 
                      nodes={nodes} 
                      edges={edges}
                      fitView
                      className="text-xs"
                    >
                      <Background color="#cbd5e1" gap={16} size={1} />
                      <Controls className="bg-white border border-slate-200 rounded-lg shadow-sm" />
                      <MiniMap 
                        nodeColor={(n) => {
                          if (n.id.includes("person")) return "#3B82F6";
                          return "#06B6D4";
                        }}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm"
                        style={{ height: 100, width: 150 }}
                      />
                    </ReactFlow>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </Layout>
  );
}