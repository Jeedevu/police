import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Existing pages
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import Analytics from "./pages/Analytics";
import Investigation from "./pages/Investigation";
import Search from "./pages/Search";
import Network from "./pages/Network";
import Reports from "./pages/Reports";
import CriminalProfile from "./pages/CriminalProfile";

// New v2.0 pages
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import Officers from "./pages/Officers";
import Evidence from "./pages/Evidence";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — wrap with ProtectedRoute for auth */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cases"
            element={
              <ProtectedRoute>
                <Cases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/investigation"
            element={
              <ProtectedRoute>
                <Investigation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/network"
            element={
              <ProtectedRoute>
                <Network />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:person_id"
            element={
              <ProtectedRoute>
                <CriminalProfile />
              </ProtectedRoute>
            }
          />

          {/* New v2.0 routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officers"
            element={
              <ProtectedRoute>
                <Officers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/evidence"
            element={
              <ProtectedRoute>
                <Evidence />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;