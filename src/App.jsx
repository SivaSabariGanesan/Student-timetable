import { Routes, Route } from 'react-router-dom';
import { useData } from './context/DataContext';
import Navbar from './components/Navbar';
import LoadingSkeleton from './components/LoadingSkeleton';
import Dashboard from './pages/Dashboard';
import StudentSearch from './pages/StudentSearch';
import StudentProfile from './pages/StudentProfile';
import RoomSearch from './pages/RoomSearch';
import FacultySearch from './pages/FacultySearch';
import Explore from './pages/Explore';
import Login from './pages/Login';

export default function App() {
  const { status, progress, error } = useData();

  if (status === 'loading') return <LoadingSkeleton progress={progress} />;

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-xl font-semibold text-bad mb-2">Couldn't load timetable data</h1>
          <p className="text-sm text-slate2-500">{error?.message || 'Check that the backend server is running.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<StudentSearch />} />
          <Route path="/students/:reg" element={<StudentProfile />} />
          <Route path="/rooms" element={<RoomSearch />} />
          <Route path="/faculty" element={<FacultySearch />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  );
}
