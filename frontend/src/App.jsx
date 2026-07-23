import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Core Pages
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Analytics from "./pages/Analytics";
import Investigation from "./pages/Investigation";
import Search from "./pages/Search";
import Network from "./pages/Network";
import Reports from "./pages/Reports";
import CriminalProfile from "./pages/CriminalProfile";
import HeatMap from "./pages/HeatMap";

// Auth & Security Pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import Chat from "./pages/Chat";
import Officers from "./pages/Officers";
import Evidence from "./pages/Evidence";

// Sarvam AI Speech-to-Speech Assistant
import SarvamSpeechAssistant from "./components/ai/SarvamSpeechAssistant";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Application Routes with Granular Permission Guards */}
          <Route
            path="/"
            element={
              <ProtectedRoute permission="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute permission="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases"
            element={
              <ProtectedRoute permission="cases">
                <Cases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases/:id"
            element={
              <ProtectedRoute permission="cases">
                <Cases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence"
            element={
              <ProtectedRoute permission="evidence">
                <Evidence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute permission="analytics">
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/heatmap"
            element={
              <ProtectedRoute permission="analytics">
                <HeatMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investigation"
            element={
              <ProtectedRoute permission="cases">
                <Investigation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute permission="dashboard">
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officers"
            element={
              <ProtectedRoute permission="users">
                <Officers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute permission="cases">
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/network"
            element={
              <ProtectedRoute permission="analytics">
                <Network />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute permission="analytics">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute permission="cases">
                <CriminalProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profiles"
            element={
              <ProtectedRoute permission="cases">
                <CriminalProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:person_id"
            element={
              <ProtectedRoute permission="cases">
                <CriminalProfile />
              </ProtectedRoute>
            }
          />

          {/* Security & Password Settings Route */}
          <Route
            path="/change-password"
            element={
              <ProtectedRoute permission="dashboard">
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRole="Admin">
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Sarvam Speech-to-Speech AI Assistant Floating Widget */}
        <SarvamSpeechAssistant />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;