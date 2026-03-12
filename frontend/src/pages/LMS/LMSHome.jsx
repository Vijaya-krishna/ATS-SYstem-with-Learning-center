import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CourseBuilder from './CourseBuilder';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function LMSHome() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [user, setUser] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/courses`);
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchCourses();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourses();
    } catch (err) {
      alert("Failed to delete course");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Learning Center</h2>
        <p className="text-slate-500 mt-1">Boost your skills and earn certificates to improve your ATS score.</p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading catalog...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500">No courses available yet. Stay tuned!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-40 bg-slate-200 flex items-center justify-center relative overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm border border-slate-100">
                    {course.level}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">{course.category || 'General'}</span>
                  {(user?.role === 'admin' || user?.id === course.instructorId?._id || user?.id === course.instructorId) && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingCourseId(course._id)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                        title="Edit Course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete Course"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2 line-clamp-1">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6">{course.description}</p>
                <Link 
                  to={`/lms/course/${course._id}`}
                  className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-xl transition-colors shadow-sm"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCourseId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl relative my-8">
            <button 
              onClick={() => setEditingCourseId(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <div className="max-h-[90vh] overflow-y-auto p-12">
              <CourseBuilder 
                courseId={editingCourseId} 
                onComplete={() => {
                  setEditingCourseId(null);
                  fetchCourses();
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
