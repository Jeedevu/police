import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { MapPin, User, ChevronRight, Share2, Phone, Car, Layers, FolderLock, Sparkles, FileText, X, ExternalLink } from "lucide-react";

export default function Network() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const personIdParam = searchParams.get("person_id");

  const [people, setPeople] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [personInfo, setPersonInfo] = useState(null);

  // Active node inspection modal drawer state
  const [inspectedNode, setInspectedNode] = useState(null);

  // Load all people for dropdown selector
  useEffect(() => {
    api.get("/search?q=")
      .then((res) => {
        setPeople(res.data.people || []);

        if (personIdParam) {
          setSelectedPersonId(personIdParam);
        } else if (res.data.people && res.data.people.length > 0) {
          setSelectedPersonId(res.data.people[0].person_id.toString());
        }
      })
      .catch((err) => console.error(err));
  }, [personIdParam]);

  // Load individual network once person selected
  useEffect(() => {
    if (!selectedPersonId) return;
    setLoading(true);

    const current = people.find((p) => p.person_id.toString() === selectedPersonId);
    if (current) setPersonInfo(current);

    api.get(`/network/person/${selectedPersonId}`)
      .then((res) => {
        const data = res.data;
        const rawNodes = data.nodes || [];
        const rawEdges = data.edges || [];

        // Color and style nodes based on node type for bright UI
        const styledNodes = rawNodes.map((node) => {
          let bg = "#FFFFFF";
          let border = "#E2E8F0";
          let textColor = "#0F172A";
          let shadow = "rgba(15, 23, 42, 0.04)";

          if (node.type === "person") {
            if (node.id === `person-${selectedPersonId}`) {
              bg = "#EFF6FF";
              border = "#3B82F6";
              textColor = "#1E40AF";
              shadow = "rgba(59, 130, 246, 0.15)";
            } else {
              bg = "#F0FDFA";
              border = "#14B8A6";
              textColor = "#115E59";
              shadow = "rgba(20, 184, 166, 0.1)";
            }
          } else if (node.type === "case") {
            bg = "#FFFBEB";
            border = "#F59E0B";
            textColor = "#92400E";
            shadow = "rgba(245, 158, 11, 0.1)";
          } else if (node.type === "vehicle") {
            bg = "#FAF5FF";
            border = "#A78BFA";
            textColor = "#6B21A8";
            shadow = "rgba(167, 139, 250, 0.1)";
          } else if (node.type === "phone") {
            bg = "#FDF2F8";
            border = "#F472B6";
            textColor = "#9D174D";
            shadow = "rgba(244, 114, 182, 0.1)";
          } else if (node.type === "evidence") {
            bg = "#F0FDF4";
            border = "#34D399";
            textColor = "#065F46";
            shadow = "rgba(52, 211, 153, 0.1)";
          }

          return {
            id: node.id,
            nodeType: node.type,
            rawNode: node,
            data: { label: `${node.label} (${node.type.toUpperCase()})` },
            position: { x: 0, y: 0 },
            style: {
              background: bg,
              color: textColor,
              border: `2px solid ${border}`,
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "10px",
              fontWeight: "bold",
              boxShadow: `0 4px 20px -2px ${shadow}`,
              textAlign: "center",
              minWidth: "120px",
              cursor: "pointer",
            }
          };
        });

        // Circle Layout positioning
        const center = { x: 350, y: 200 };
        const radius = 150;
        styledNodes.forEach((node, i) => {
          if (node.id === `person-${selectedPersonId}`) {
            node.position = center;
          } else {
            const angle = (i / (styledNodes.length - 1)) * 2 * Math.PI;
            node.position = {
              x: center.x + radius * Math.cos(angle),
              y: center.y + radius * Math.sin(angle),
            };
          }
        });

        // Animate and color edges based on relationship
        const styledEdges = rawEdges.map((edge) => {
          let edgeColor = "#94A3B8";
          let animated = false;

          if (edge.label === "Owns") {
            edgeColor = "#A78BFA";
            animated = true;
          } else if (edge.label === "Accused In") {
            edgeColor = "#F59E0B";
            animated = true;
          } else if (edge.label === "Evidence In") {
            edgeColor = "#34D399";
          } else if (edge.label === "Known Associate" || edge.label === "Accomplice" || edge.label === "Friend") {
            edgeColor = "#EF4444";
            animated = true;
          }

          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            animated,
            style: { stroke: edgeColor, strokeWidth: 2 },
            labelStyle: { fill: "#475569", fontSize: "9px", fontWeight: "bold" },
            labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.9 },
          };
        });

        setNodes(styledNodes);
        setEdges(styledEdges);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedPersonId, people]);

  // Handle Node Click
  const handleNodeClick = (event, node) => {
    setInspectedNode(node);
  };

  return (
    <Layout>
      <div className="flex h-full gap-6 overflow-hidden select-none relative">
        
        {/* Left Column: Suspect Info & Legend */}
        <div className="w-80 bg-white border border-slate-150 rounded-2xl p-5 flex flex-col h-full shadow-soft shrink-0">
          <div className="space-y-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">TARGET DOSSIER SELECTOR</h3>
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 focus:outline-none focus:border-primary transition font-bold"
                value={selectedPersonId}
                onChange={(e) => {
                  setSelectedPersonId(e.target.value);
                  setSearchParams({ person_id: e.target.value });
                }}
              >
                <option value="">-- Choose suspect --</option>
                {people.map((p) => (
                  <option key={p.person_id} value={p.person_id}>
                    {p.full_name} ({p.risk_score}% Risk)
                  </option>
                ))}
              </select>
            </div>

            {personInfo && (
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl space-y-3 shadow-inner">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-black text-slate-800">{personInfo.full_name}</h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{personInfo.gender}, {personInfo.age} yrs</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${
                    personInfo.risk_score >= 80 ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}>
                    {personInfo.risk_score}% Risk
                  </span>
                </div>

                <div className="border-t border-slate-200/60 pt-3 space-y-2 text-xs text-slate-600 font-medium">
                  <p><span className="text-slate-400 font-bold uppercase text-[9px]">Mobile:</span> {personInfo.mobile || "N/A"}</p>
                  <p><span className="text-slate-400 font-bold uppercase text-[9px]">Aadhaar:</span> {personInfo.aadhaar || "N/A"}</p>
                  <p><span className="text-slate-400 font-bold uppercase text-[9px]">PAN:</span> {personInfo.pan || "N/A"}</p>
                  <p><span className="text-slate-400 font-bold uppercase text-[9px]">Passport:</span> {personInfo.passport || "N/A"}</p>
                  <p className="leading-relaxed"><span className="text-slate-400 font-bold uppercase text-[9px]">Address:</span> {personInfo.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Legend indicator */}
          <div className="mt-auto pt-6 border-t border-slate-100 space-y-2.5 text-[9px] uppercase font-bold text-slate-400 tracking-wider">
            <span className="block mb-1 text-[10px]">Graph entity indices</span>
            
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-blue-50 border border-blue-500 block shadow-sm" />
              <span className="text-slate-500">Target Suspect Node</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-teal-50 border border-teal-500 block shadow-sm" />
              <span className="text-slate-500">Associate Accomplices</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-amber-50 border border-amber-500 block shadow-sm" />
              <span className="text-slate-500">Active Case Dossier</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-purple-50 border border-purple-500 block shadow-sm" />
              <span className="text-slate-500">Vehicle Assets Owned</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-pink-50 border border-pink-500 block shadow-sm" />
              <span className="text-slate-500">Cell Phone Devices</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-lg bg-emerald-50 border border-emerald-500 block shadow-sm" />
              <span className="text-slate-500">Seized Evidence Items</span>
            </div>
          </div>
        </div>

        {/* Right Column: ReactFlow Network Display */}
        <div className="flex-grow bg-white border border-slate-150 rounded-2xl flex flex-col h-full shadow-soft overflow-hidden relative">
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] text-slate-500 font-bold uppercase tracking-wider shadow-sm flex items-center gap-2">
            <span>Suspect Connection Map</span>
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Click Any Node to Open Dossier</span>
          </div>

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
              <p className="text-slate-400 text-xs">Tracing associated connections...</p>
            </div>
          ) : nodes.length > 0 ? (
            <div className="flex-1 w-full h-full bg-slate-50/50">
              <ReactFlow nodes={nodes} edges={edges} onNodeClick={handleNodeClick} fitView>
                <Background color="#cbd5e1" gap={16} size={1} />
                <Controls className="bg-white border border-slate-200 rounded-lg shadow-sm" />
                <MiniMap 
                  style={{ background: "#ffffff", border: "1px solid rgba(226,232,240,0.8)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }} 
                  nodeColor={(n) => {
                    if (n.id.includes("person")) return "#3B82F6";
                    return "#14B8A6";
                  }}
                  maskColor="rgba(248, 250, 252, 0.6)" 
                />
              </ReactFlow>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Select a target profile to visualize relationship linkages.
            </div>
          )}
        </div>

        {/* Interactive Slide-over Node Inspector Modal */}
        {inspectedNode && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
            <div className="w-96 bg-white h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                    {inspectedNode.nodeType || "ENTITY"}
                  </span>
                  <button
                    onClick={() => setInspectedNode(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{inspectedNode.data?.label}</h3>
                  <p className="text-xs text-slate-500 mt-1">Entity ID: {inspectedNode.id}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs text-slate-700">
                  <p><strong className="text-slate-500 font-bold uppercase text-[9px] block mb-0.5">Classification:</strong> {inspectedNode.nodeType}</p>
                  <p><strong className="text-slate-500 font-bold uppercase text-[9px] block mb-0.5">KSP Database Status:</strong> Linked & Verified</p>
                  <p><strong className="text-slate-500 font-bold uppercase text-[9px] block mb-0.5">Assigned Station:</strong> Central Intelligence HQ</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                {inspectedNode.nodeType === "person" && (
                  <button
                    onClick={() => {
                      const id = inspectedNode.id.replace("person-", "");
                      navigate(`/profile/${id}`);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open Suspect 360° Profile <ExternalLink size={14} />
                  </button>
                )}
                {inspectedNode.nodeType === "case" && (
                  <button
                    onClick={() => navigate("/cases")}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open Case Dossier <ExternalLink size={14} />
                  </button>
                )}
                {inspectedNode.nodeType === "evidence" && (
                  <button
                    onClick={() => navigate("/evidence")}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    Open Evidence Locker <ExternalLink size={14} />
                  </button>
                )}
                <button
                  onClick={() => setInspectedNode(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
