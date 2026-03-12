import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import AdminDashboard from './pages/Dashboards/Admin/AdminDashboard';
import RecruiterDashboard from './pages/Dashboards/Recruiter/RecruiterDashboard';
import CandidateDashboard from './pages/Dashboards/Candidate/CandidateDashboard';
import ResumeScanner from './pages/Dashboards/Candidate/ResumeScanner';
import LMSHome from './pages/LMS/LMSHome';
import CourseView from './pages/LMS/CourseView';
import CourseBuilder from './pages/LMS/CourseBuilder';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on load
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-primary-600 tracking-tight">ATS System</Link>
            {user && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/" className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors">Dashboard</Link>
                {(user.role === 'candidate' || user.role === 'recruiter') && (
                  <Link to="/resume-scanner" className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors">Resume Scanner</Link>
                )}
                <Link to="/lms" className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors">Learning Center</Link>
                {(user.role === 'admin' || user.role === 'recruiter') && (
                  <Link to="/lms/create" className="text-slate-600 hover:text-primary-600 font-semibold text-sm transition-colors">Create Course</Link>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? (
                // Sun icon for dark mode
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon for light mode
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-500 uppercase tracking-widest">{user.role}</span>
                <button 
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-red-500 font-bold text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
        
        <main className="container mx-auto px-4 py-10 max-w-7xl flex-grow">
          <Routes>
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            <Route path="/" element={
              !user ? <Navigate to="/login" /> :
              user.role === 'admin' ? <AdminDashboard /> :
              user.role === 'recruiter' ? <RecruiterDashboard /> :
              <CandidateDashboard />
            } />

            <Route path="/resume-scanner" element={(user?.role === 'candidate' || user?.role === 'recruiter') ? <ResumeScanner /> : <Navigate to="/" />} />
            <Route path="/lms" element={user ? <LMSHome /> : <Navigate to="/login" />} />
            <Route path="/lms/course/:id" element={user ? <CourseView /> : <Navigate to="/login" />} />
            <Route path="/lms/create" element={
              user && (user.role === 'admin' || user.role === 'recruiter') 
                ? <CourseBuilder /> 
                : <Navigate to="/" />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
