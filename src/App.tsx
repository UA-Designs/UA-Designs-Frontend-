import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';

// Main Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Analytics from './pages/Analytics/Analytics';
import ProjectAnalyticsPage from './pages/Analytics/ProjectAnalyticsPage';
import Profile from './pages/Profile/Profile';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import Users from './pages/Users/Users';
import Projects from './pages/Projects/Projects';
import AuditLog from './pages/AuditLog/AuditLog';
import UnauthorizedPage from './pages/UnauthorizedPage';

// PMBOK Knowledge Areas (Core 5)
import ProjectSchedule from './pages/PMBOK/Schedule/ProjectSchedule';
import ProjectCost from './pages/PMBOK/Cost/ProjectCost';
import ProjectResources from './pages/PMBOK/Resources/ProjectResources';
import ProjectRisk from './pages/PMBOK/Risk/ProjectRisk';
import ProjectStakeholders from './pages/PMBOK/Stakeholders/ProjectStakeholders';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProjectProvider>
          <NotificationProvider>
            <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="projects/:projectId/analytics" element={<ProjectAnalyticsPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="expenses" element={<Navigate to="/pmbok/cost" replace />} />

              {/* PMBOK Knowledge Areas (Core 5) */}
              <Route path="pmbok/schedule" element={<ProjectSchedule />} />
              <Route path="pmbok/cost" element={<ProjectCost />} />
              <Route path="pmbok/resources" element={<ProjectResources />} />
              <Route path="pmbok/risk" element={<ProjectRisk />} />
              <Route
                path="pmbok/stakeholders"
                element={<ProjectStakeholders />}
              />

              {/* Admin-only routes */}
              <Route
                path="users"
                element={
                  <ProtectedRoute access="ADMIN_ONLY">
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit-log"
                element={
                  <ProtectedRoute access="ADMIN_ONLY">
                    <AuditLog />
                  </ProtectedRoute>
                }
              />

              {/* Catch all route for protected routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            </Routes>
          </NotificationProvider>
        </ProjectProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
