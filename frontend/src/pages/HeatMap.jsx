import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  MapPin, 
  Search, 
  Filter, 
  RotateCcw, 
  Download, 
  Printer, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Sparkles, 
  ShieldAlert, 
  FileText, 
  Clock, 
  CheckCircle2, 
  UserX, 
  AlertTriangle, 
  ChevronRight, 
  X, 
  Building2, 
  UserCheck, 
  RefreshCw,
  ExternalLink,
  Eye
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Layout from "../components/layout/Layout";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// Fix Leaflet Default Marker Icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const CITY_COORDINATES = {
  "Bengaluru": { lat: 12.9716, lng: 77.5946, zoom: 11 },
  "Mysuru": { lat: 12.2958, lng: 76.6394, zoom: 12 },
  "Mangaluru": { lat: 12.9141, lng: 74.8560, zoom: 12 },
  "Hubballi": { lat: 15.3647, lng: 75.1240, zoom: 12 },
  "Belagavi": { lat: 15.8497, lng: 74.4977, zoom: 12 },
  "Shivamogga": { lat: 13.9299, lng: 75.5681, zoom: 12 },
  "Davangere": { lat: 14.4644, lng: 75.9218, zoom: 12 },
  "Kalaburagi": { lat: 17.3297, lng: 76.8343, zoom: 12 },
  "Ballari": { lat: 15.1394, lng: 76.9214, zoom: 12 },
  "Tumakuru": { lat: 13.3379, lng: 77.1173, zoom: 12 },
};

const CRIME_TYPES = [
  "All",
  "Theft",
  "Robbery",
  "Cyber Crime",
  "Murder",
  "Kidnapping",
  "Missing Person",
  "Drug Case",
  "Financial Fraud",
  "Vehicle Theft",
  "Assault"
];

const STATUSES = ["All", "Open", "Under Investigation", "Chargesheet Filed", "Closed"];

const TILE_SERVERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors"
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO Dark Matter"
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri World Imagery"
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenTopoMap"
  }
};

// Helper Component to control Map View programmatically
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 11, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function HeatMap() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL query params
  const paramCrimeType = searchParams.get("crime_type") || searchParams.get("crime") || "All";
  const paramCity = searchParams.get("city") || searchParams.get("district") || "All";

  // Filter States
  const [selectedCrimeType, setSelectedCrimeType] = useState(paramCrimeType);
  const [selectedCity, setSelectedCity] = useState(paramCity);
  const [selectedStation, setSelectedStation] = useState("All");
  const [selectedOfficer, setSelectedOfficer] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Map Controls State
  const [mapMode, setMapMode] = useState("combined"); // 'heatmap' | 'markers' | 'combined'
  const [tileStyle, setTileStyle] = useState("dark");
  const [mapCenter, setMapCenter] = useState([15.3173, 75.7139]); // Default Karnataka
  const [mapZoom, setMapZoom] = useState(7);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Data States
  const [points, setPoints] = useState([]);
  const [summary, setSummary] = useState({
    total_cases: 0,
    todays_cases: 0,
    high_risk_cases: 0,
    active_investigations: 0,
    hotspots: 0,
    highest_city: "Bengaluru",
    highest_crime: "Theft"
  });
  const [loading, setLoading] = useState(true);

  // Hotspot Details Panel State
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [hotspotDetails, setHotspotDetails] = useState(null);
  const [loadingHotspot, setLoadingHotspot] = useState(false);

  const mapContainerRef = useRef(null);

  // Fetch Heatmap Data from Backend
  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        crime_type: selectedCrimeType !== "All" ? selectedCrimeType : undefined,
        city: selectedCity !== "All" ? selectedCity : undefined,
        station: selectedStation !== "All" ? selectedStation : undefined,
        officer: selectedOfficer !== "All" ? selectedOfficer : undefined,
        status: selectedStatus !== "All" ? selectedStatus : undefined,
        risk_level: selectedRiskLevel !== "All" ? selectedRiskLevel : undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        search: searchQuery || undefined,
      };

      const [pointsRes, summaryRes] = await Promise.all([
        api.get("/api/analytics/heatmap", { params }).catch(() => api.get("/analytics/heatmap", { params })),
        api.get("/api/analytics/heatmap/summary", { params }).catch(() => api.get("/analytics/heatmap/summary", { params }))
      ]);

      setPoints(Array.isArray(pointsRes.data) ? pointsRes.data : []);
      setSummary(summaryRes.data || {});
    } catch (err) {
      console.error("Error loading heatmap data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCrimeType, selectedCity, selectedStation, selectedOfficer, selectedStatus, selectedRiskLevel, fromDate, toDate, searchQuery]);

  // Initial & Filter Change Load
  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  // Auto-refresh when new FIR or live sync every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchHeatmapData();
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchHeatmapData]);

  // Handle City Search / Change map center
  const handleCitySearch = (cityName) => {
    setSelectedCity(cityName);
    if (CITY_COORDINATES[cityName]) {
      setMapCenter([CITY_COORDINATES[cityName].lat, CITY_COORDINATES[cityName].lng]);
      setMapZoom(CITY_COORDINATES[cityName].zoom);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSelectedCrimeType("All");
    setSelectedCity("All");
    setSelectedStation("All");
    setSelectedOfficer("All");
    setSelectedStatus("All");
    setSelectedRiskLevel("All");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setMapCenter([15.3173, 75.7139]);
    setMapZoom(7);
  };

  // Hotspot Click Event
  const handlePointClick = async (point) => {
    setSelectedHotspot(point);
    setLoadingHotspot(true);
    const locName = point.station || point.district || "Karnataka";
    try {
      const res = await api.get(`/api/analytics/hotspot/${encodeURIComponent(locName)}`)
        .catch(() => api.get(`/analytics/hotspot/${encodeURIComponent(locName)}`));
      setHotspotDetails(res.data);
    } catch (err) {
      console.error("Failed to load hotspot details:", err);
    } finally {
      setLoadingHotspot(false);
    }
  };

  // Download Map PNG
  const handleDownloadPNG = async () => {
    if (!mapContainerRef.current) return;
    try {
      const canvas = await html2canvas(mapContainerRef.current, { useCORS: true, allowTaint: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `KSP_Crime_Heatmap_${new Date().toISOString().split("T")[0]}.png`;
      link.click();
    } catch (err) {
      console.error("PNG export error:", err);
      alert("Failed to generate PNG screenshot.");
    }
  };

  // Print Map Report
  const handlePrint = () => {
    window.print();
  };

  // Color mapper for intensity / risk
  const getCircleColor = (weight, crime) => {
    const c = (crime || "").toLowerCase();
    if (c.includes("murder") || c.includes("robbery") || weight >= 20) return "#EF4444"; // Red Critical
    if (c.includes("cyber") || c.includes("fraud") || weight >= 15) return "#F97316"; // Orange Very High
    if (c.includes("assault") || c.includes("drug") || weight >= 12) return "#F59E0B"; // Yellow High
    if (c.includes("vehicle") || weight >= 8) return "#10B981"; // Green Medium
    return "#3B82F6"; // Blue Low
  };

  return (
    <Layout>
      <div className={`flex flex-col gap-5 select-none ${isFullScreen ? "fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto" : "max-w-[1600px] mx-auto pb-10"}`}>
        
        {/* Header Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-primary p-6 rounded-3xl text-white shadow-premium relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl"></div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 shadow-inner">
              <Flame size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>LIVE GIS SPATIAL INTELLIGENCE MATRIX</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">KSP Crime Heat Map Engine</h1>
              <p className="text-slate-300 text-xs mt-0.5 font-medium">Real-time crime cluster distribution & geospatial analytics across Karnataka State</p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <button
              onClick={fetchHeatmapData}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Refresh Heatmap Data"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Sync Live Data</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cases</p>
              <p className="text-xl font-black text-slate-800">{summary.total_cases || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent Cases</p>
              <p className="text-xl font-black text-slate-800">{summary.todays_cases || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center font-bold">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">High Risk Cases</p>
              <p className="text-xl font-black text-slate-800">{summary.high_risk_cases || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold">
              <UserX size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Dossiers</p>
              <p className="text-xl font-black text-slate-800">{summary.active_investigations || 0}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold">
              <Flame size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Hotspots</p>
              <p className="text-xl font-black text-slate-800">{summary.hotspots || 0}</p>
            </div>
          </div>
        </div>

        {/* Main Interactive Map Workspace with Filters & Hotspot Side Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[600px]">
          
          {/* Left Column: Filters Panel */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft lg:col-span-3 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Filter size={15} className="text-primary" />
                  Spatial Controls & Filters
                </h3>
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition"
                  title="Reset all filters"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                {/* Search Bar */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Search Keywords / FIR</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="FIR, Station, Suspect, City..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none transition shadow-sm"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                  </div>
                </div>

                {/* City Zoom Quick Select */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">City / Jurisdiction Zoom</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCitySearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="All">Karnataka State (All)</option>
                    {Object.keys(CITY_COORDINATES).map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Crime Type Filter */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Crime Type / Category</label>
                  <select
                    value={selectedCrimeType}
                    onChange={(e) => setSelectedCrimeType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    {CRIME_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Case Status Filter */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Case Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">From Date</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-bold mb-1">To Date</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-slate-800 text-[11px]"
                    />
                  </div>
                </div>

                {/* Map Layer Mode Toggle */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Layer Density Display</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMapMode("heatmap")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${mapMode === "heatmap" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
                    >
                      Heatmap
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode("markers")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${mapMode === "markers" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
                    >
                      Markers
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapMode("combined")}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${mapMode === "combined" ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}
                    >
                      Combined
                    </button>
                  </div>
                </div>

                {/* Map Tile Style Toggle */}
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Base Map Tiles</label>
                  <select
                    value={tileStyle}
                    onChange={(e) => setTileStyle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="dark">Dark Police Mode (CARTO)</option>
                    <option value="street">OpenStreetMap Street</option>
                    <option value="satellite">Esri World Satellite</option>
                    <option value="terrain">OpenTopo Terrain</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
              <span>Points Loaded: <strong className="text-slate-700">{points.length}</strong></span>
              <span>Updated: <strong>Live Sync</strong></span>
            </div>
          </div>

          {/* Center Column: Large Interactive Leaflet Map */}
          <div
            ref={mapContainerRef}
            className="bg-slate-900 border border-slate-150 rounded-3xl shadow-soft overflow-hidden relative lg:col-span-6 flex flex-col min-h-[500px]"
          >
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              style={{ width: "100%", height: "100%", minHeight: "500px" }}
            >
              <MapViewController center={mapCenter} zoom={mapZoom} />
              <TileLayer
                url={TILE_SERVERS[tileStyle].url}
                attribution={TILE_SERVERS[tileStyle].attribution}
              />

              {/* Points rendering (Circles & Markers) */}
              {points.map((p, idx) => {
                const circleColor = getCircleColor(p.weight, p.crime_type);
                return (
                  <CircleMarker
                    key={`point-${idx}`}
                    center={[p.lat, p.lng]}
                    radius={mapMode === "heatmap" ? 18 : 10}
                    pathOptions={{
                      color: circleColor,
                      fillColor: circleColor,
                      fillOpacity: mapMode === "heatmap" ? 0.45 : 0.75,
                      weight: mapMode === "heatmap" ? 0 : 2
                    }}
                    eventHandlers={{
                      click: () => handlePointClick(p),
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1 text-xs">
                        <div className="font-bold text-slate-900 border-b pb-1">{p.station || p.district}</div>
                        <p><strong>Crime:</strong> {p.crime_type}</p>
                        <p><strong>FIR:</strong> {p.fir_number}</p>
                        <p><strong>Status:</strong> {p.status}</p>
                        <button
                          onClick={() => handlePointClick(p)}
                          className="mt-1 w-full bg-primary text-white text-[10px] font-bold py-1 rounded transition"
                        >
                          Inspect Hotspot Details
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Bottom Right Legend Overlay */}
            <div className="absolute bottom-4 right-4 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800 text-white p-3 rounded-2xl text-[10px] font-medium shadow-xl space-y-1.5">
              <div className="font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 mb-1">
                Crime Density Gradient
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span>Low Crime Frequency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Medium Density</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span>High Frequency</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span>Very High Threat</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                <span className="text-red-400 font-bold">Critical Hotspot</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hotspot Details Side Panel */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-soft lg:col-span-3 flex flex-col justify-between overflow-y-auto">
            {loadingHotspot ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="w-8 h-8 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
                <p className="text-slate-400 text-xs font-medium">Aggregating hotspot intel...</p>
              </div>
            ) : selectedHotspot || hotspotDetails ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {hotspotDetails?.topCrime || selectedHotspot?.crime_type || "Crime Hotspot"}
                    </span>
                    <h3 className="text-sm font-black text-slate-800 tracking-tight mt-1">
                      {hotspotDetails?.station || selectedHotspot?.station || selectedHotspot?.district}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedHotspot(null);
                      setHotspotDetails(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Hotspot Key Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Cases Count</p>
                    <p className="text-base font-black text-slate-800">{hotspotDetails?.cases || 1}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Risk Score</p>
                    <p className="text-base font-black text-red-600">{hotspotDetails?.averageRisk || 75}%</p>
                  </div>
                </div>

                {/* AI Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-100 rounded-2xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles size={13} className="text-blue-500 animate-pulse" />
                    <span>KSP AI Incident Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {hotspotDetails?.aiSummary || "High frequency of incident reports mapped to this police station jurisdiction. Continuous GIS surveillance active."}
                  </p>
                </div>

                {/* Recent FIRs list */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recent Registered FIRs</h4>
                  <div className="space-y-1.5">
                    {hotspotDetails?.recentCases && hotspotDetails.recentCases.length > 0 ? (
                      hotspotDetails.recentCases.slice(0, 4).map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <p className="font-bold text-slate-800 text-[11px]">{c.fir_number}</p>
                            <p className="text-[9px] text-slate-400">{c.crime_type} · {c.status}</p>
                          </div>
                          <Link
                            to={`/cases?case_id=${c.case_id}`}
                            className="p-1 bg-white hover:bg-primary hover:text-white border rounded text-[9px] font-bold text-slate-600 transition"
                          >
                            <Eye size={12} />
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No recent FIRs logged.</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <Link
                    to={`/cases?search=${encodeURIComponent(selectedHotspot?.station || selectedHotspot?.district || "")}`}
                    className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>View All Station Cases</span> <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-slate-400 p-4">
                <MapPin size={32} className="text-slate-300 animate-bounce" />
                <div>
                  <p className="text-slate-700 font-bold text-xs">Interactive Hotspot Inspector</p>
                  <p className="text-[10px] text-slate-400 mt-1">Click on any crime cluster circle or marker on the map to inspect AI summary, cases, and suspects.</p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </Layout>
  );
}
