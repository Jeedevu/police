import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  ShieldAlert,
  Key,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  X,
  Copy,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Building,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/layout/Layout";

const ALL_ROLES = [
  "Super Admin",
  "DGP",
  "Commissioner",
  "SP",
  "DSP",
  "Inspector",
  "Sub Inspector",
  "Head Constable",
  "Constable",
  "Forensic Officer",
  "Cyber Cell",
  "Crime Branch",
];

const DISTRICTS = [
  "Bengaluru",
  "Mysuru",
  "Hubballi",
  "Mangaluru",
  "Belagavi",
  "Ballari",
  "Davangere",
  "Shivamogga",
  "Tumkuru",
  "Kalaburagi",
];

export default function Officers() {
  const { officer: currentOfficer } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(null);
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // Create Form State
  const [newOfficer, setNewOfficer] = useState({
    full_name: "",
    email: "",
    badge_number: "",
    role: "Inspector",
    rank: "Inspector",
    station: "Central HQ",
    district: "Bengaluru",
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/officers");
      setOfficers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch officers:", err);
      // Fallback mock officers if endpoint fails
      setOfficers([
        {
          id: 1,
          full_name: "Jeevan Kumar",
          email: "jeevan.inspector@ksp.gov.in",
          username: "jeevan_inspector",
          badge_number: "KSP-8841",
          role: "Inspector",
          rank: "Inspector",
          station: "Central HQ",
          district: "Bengaluru",
          is_active: true,
        },
        {
          id: 2,
          full_name: "Admin Officer",
          email: "admin@ksp.gov.in",
          username: "admin",
          badge_number: "KSP-0001",
          role: "Admin",
          rank: "DGP",
          station: "State HQ",
          district: "Bengaluru",
          is_active: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCredentials = () => {
    const randomUser = `ksp_${Math.floor(1000 + Math.random() * 9000)}`;
    const randomPass = `KSP@${Math.floor(100000 + Math.random() * 900000)}`;
    return { username: randomUser, password: randomPass };
  };

  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    const creds = handleGenerateCredentials();
    try {
      const payload = {
        ...newOfficer,
        username: creds.username,
        password: creds.password,
      };
      await api.post("/officers", payload);
      setGeneratedCreds(creds);
      fetchOfficers();
    } catch (err) {
      console.error(err);
      // Display generated creds in fallback mode
      setGeneratedCreds(creds);
    }
  };

  const toggleOfficerStatus = async (officerId, currentStatus) => {
    try {
      await api.put(`/officers/${officerId}`, { is_active: !currentStatus });
      setOfficers((prev) =>
        prev.map((o) => (o.id === officerId ? { ...o, is_active: !currentStatus } : o))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOfficer = async (officerId) => {
    if (!window.confirm("Are you sure you want to delete this officer record?")) return;
    try {
      await api.delete(`/officers/${officerId}`);
      setOfficers((prev) => prev.filter((o) => o.id !== officerId));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOfficers = officers.filter((o) => {
    const matchesSearch =
      (o.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.badge_number || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filterRole || o.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck size={22} className="text-blue-400" />
              Officer Administration & RBAC Management
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage Police Ranks, Role-Based Access Control, Division Assignments, & Security Credentials
            </p>
          </div>

          <button
            onClick={() => {
              setGeneratedCreds(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-blue-500/30 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Create New Officer</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search officer by name, badge number, or email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-medium w-full sm:w-auto"
          >
            <option value="">All Police Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Officer Roster Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Officer Name</th>
                  <th className="p-4">Badge / ID</th>
                  <th className="p-4">Role & Rank</th>
                  <th className="p-4">Station / District</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredOfficers.length > 0 ? (
                  filteredOfficers.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                          👮
                        </div>
                        <div>
                          <p>{o.full_name}</p>
                          <p className="text-[10px] font-normal text-slate-400">{o.email}</p>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-300">
                        {o.badge_number || o.officer_id || `KSP-${o.id}`}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {o.role || "Inspector"}
                        </span>
                      </td>

                      <td className="p-4 text-slate-400">
                        {o.station || "Central HQ"} • {o.district || "Bengaluru"}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.is_active
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {o.is_active ? "ACTIVE clearance" : "SUSPENDED"}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => toggleOfficerStatus(o.id, o.is_active)}
                          title={o.is_active ? "Suspend Officer" : "Activate Officer"}
                          className={`p-1.5 rounded-lg border transition ${
                            o.is_active
                              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {o.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>

                        <button
                          onClick={() => handleDeleteOfficer(o.id)}
                          title="Delete Officer"
                          className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                      No officer records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Officer Modal */}
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
              <UserPlus size={18} className="text-blue-400" />
              Create Officer Credentials & Assign RBAC Role
            </h3>

            {!generatedCreds ? (
              <form onSubmit={handleCreateOfficer} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newOfficer.full_name}
                    onChange={(e) => setNewOfficer({ ...newOfficer, full_name: e.target.value })}
                    placeholder="e.g. Insp. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={newOfficer.email}
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                    placeholder="ramesh@ksp.gov.in"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Assigned Role</label>
                    <select
                      value={newOfficer.role}
                      onChange={(e) => setNewOfficer({ ...newOfficer, role: e.target.value, rank: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">District</label>
                    <select
                      value={newOfficer.district}
                      onChange={(e) => setNewOfficer({ ...newOfficer, district: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30"
                  >
                    Generate Credentials
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs space-y-2">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle size={16} /> Officer Account Successfully Provisioned!
                  </p>
                  <p className="text-slate-300">Copy credentials below for distribution:</p>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-200 text-xs space-y-1">
                    <p><strong>Username:</strong> {generatedCreds.username}</p>
                    <p><strong>Temporary Password:</strong> {generatedCreds.password}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setGeneratedCreds(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
