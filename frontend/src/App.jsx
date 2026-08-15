import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Spinner from './components/ui/Spinner';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import ProfilePage from './pages/candidate/ProfilePage';
import BrowseJobs from './pages/candidate/BrowseJobs';
import MockTestPage from './pages/candidate/MockTestPage';

// Recruiter Pages
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import PostJob from './pages/recruiter/PostJob';
import JobCandidates from './pages/recruiter/JobCandidates';

/**
 * Protected route wrapper — redirects to login if not authenticated.
 * Optionally restricts access to a specific role.
 */
function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Spinner className="min-h-screen" size="lg" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard'} replace />;
  }

  return children;
}

/**
 * Guest-only route — redirects authenticated users to their dashboard.
 */
function GuestRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <Spinner className="min-h-screen" size="lg" />;
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard'} replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />

            {/* Candidate Routes */}
            <Route
              path="/candidate"
              element={
                <ProtectedRoute role="candidate">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<CandidateDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="jobs" element={<BrowseJobs />} />
              <Route path="mock-test" element={<MockTestPage />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Recruiter Routes */}
            <Route
              path="/recruiter"
              element={
                <ProtectedRoute role="recruiter">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<RecruiterDashboard />} />
              <Route path="post-job" element={<PostJob />} />
              <Route path="jobs/:jobId/candidates" element={<JobCandidates />} />
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
