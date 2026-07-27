import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useData } from './context/DataContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoadingSkeleton from './components/LoadingSkeleton';
import Dashboard from './pages/Dashboard';
import StudentSearch from './pages/StudentSearch';
import StudentProfile from './pages/StudentProfile';
import RoomSearch from './pages/RoomSearch';
import FreeRooms from './pages/FreeRooms';
import FacultySearch from './pages/FacultySearch';
import Explore from './pages/Explore';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import ChangePassword from './pages/ChangePassword';

/** Redirect unauthenticated visitors to /login, preserving the intended destination. */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSkeleton />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/** Only admins and superusers may access this route. */
function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSkeleton />;
  if (!isAdmin) return <Navigate to="/" state={{ from: location }} replace />;
  return children;
}

/**
 * Blocks routes that are restricted for the basic `user` role.
 * `user` role can only access /students, /students/:reg, and /explore.
 */
function RequireNotBasicUser({ children }) {
  const { user } = useAuth();
  if (user?.role === 'user') {
    return <Navigate to="/students" replace />;
  }
  return children;
}

export default function App() {
  const { status, progress, error } = useData();
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // While we're still checking the session, show the skeleton
  if (authLoading) return <LoadingSkeleton />;

  // Send unauthenticated users straight to /login (unless they're already there)
  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  // After login the data layer loads
  if (user && (status === 'loading' || status === 'idle')) return <LoadingSkeleton progress={progress} />;

  if (user && status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-xl font-semibold text-bad mb-2">Couldn't load timetable data</h1>
          <p className="text-sm text-slate2-500">{error?.message || 'Check that the backend server is running.'}</p>
        </div>
      </div>
    );
  }

  // Logged-out users only see the login page
  if (!user) {
    return (
      <div className="min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/" element={<RequireNotBasicUser><RequireAuth><Dashboard /></RequireAuth></RequireNotBasicUser>} />
          <Route path="/students" element={<RequireAuth><StudentSearch /></RequireAuth>} />
          <Route path="/students/:reg" element={<RequireAuth><StudentProfile /></RequireAuth>} />
          <Route path="/rooms" element={<RequireNotBasicUser><RequireAuth><RoomSearch /></RequireAuth></RequireNotBasicUser>} />
          <Route path="/rooms/free" element={<RequireNotBasicUser><RequireAuth><FreeRooms /></RequireAuth></RequireNotBasicUser>} />
          <Route path="/faculty" element={<RequireNotBasicUser><RequireAuth><FacultySearch /></RequireAuth></RequireNotBasicUser>} />
          <Route path="/explore" element={<RequireAuth><Explore /></RequireAuth>} />
          <Route
            path="/users"
            element={
              <RequireAdmin>
                <UserManagement />
              </RequireAdmin>
            }
          />
          <Route
            path="/password"
            element={
              <RequireAdmin>
                <ChangePassword />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
