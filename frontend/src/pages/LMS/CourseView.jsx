import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Track currently logged-in user
  const user = JSON.parse(localStorage.getItem('user'));
  const isOwnerOrAdmin = user && (user.role === 'admin' || (course && course.instructorId?._id === user.id) || (course && course.instructorId === user.id));

  const fetchCourseData = async () => {
    try {
      const token = localStorage.getItem('token');
      const courseRes = await axios.get(`${API_URL}/courses/${id}`);
      setCourse(courseRes.data);

      const enrollRes = await axios.get(`${API_URL}/courses/my/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const existing = enrollRes.data.find(e => e.courseId?._id === id || e.courseId === id);
      if (existing) setEnrollment(existing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/courses/${id}/enroll`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Enrolled successfully!");
      fetchCourseData();
    } catch (err) {
      const msg = err.response?.data?.message || "Enrolled failed";
      alert(msg);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    try {
      const token = localStorage.getItem('token');
      const nextProgress = Math.round(((enrollment.completedModules.length + 1) / course.modules.length) * 100);
      await axios.put(`${API_URL}/courses/enrollment/${enrollment._id}/progress`, 
        { progress: nextProgress, completedModuleId: moduleId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchCourseData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this course?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Course deleted successfully.');
      navigate('/lms');
    } catch (err) {
      alert('Failed to delete course');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-500 font-medium">Loading course...</div>;
  if (!course) return <div className="text-center py-20 text-slate-500 font-medium">Course not found</div>;

  const currentModule = course.modules[currentModuleIndex];
  const isCompleted = enrollment?.completedModules.includes(currentModule?._id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pb-20 animate-in fade-in duration-500">
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           {enrollment ? (
             <div className="p-0">
               {currentModule?.videoUrl ? (
                 <div className="aspect-video bg-black flex items-center justify-center">
                    <iframe 
                      className="w-full h-full"
                      src={currentModule.videoUrl.replace('watch?v=', 'embed/')} 
                      title="Video player" 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                 </div>
               ) : (
                 <div className="aspect-video bg-slate-900 border-b border-slate-100 flex items-center justify-center text-slate-400 font-medium relative overflow-hidden">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-60" />
                    ) : (
                      "No Video Provided"
                    )}
                 </div>
               )}
               <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-900">{currentModule?.title}</h2>
                    {!isCompleted && (
                      <button 
                        onClick={() => handleCompleteModule(currentModule._id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md shadow-emerald-100"
                      >
                        Complete Module
                      </button>
                    )}
                    {isCompleted && (
                      <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        Module Completed ✓
                      </span>
                    )}
                 </div>
                 <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                   {currentModule?.content || "No text content for this module."}
                 </div>
               </div>
             </div>
           ) : (
             <div className="p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-3xl mx-auto flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Enroll to unlock this course</h3>
                  <p className="text-slate-500 max-w-md mx-auto">Master the skills required to rank higher in our ATS system and secure your dream job.</p>
                </div>
                <button 
                  onClick={handleEnroll}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-10 py-3 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-slate-200"
                >
                  Enroll Now
                </button>
             </div>
           )}
        </div>
      </div>

      <div className="lg:col-span-1 space-y-6">
        {/* Admin/Recruiter Action Panel */}
        {isOwnerOrAdmin && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3">
            <h4 className="font-bold text-slate-900 mb-2">Manage Course</h4>
            <Link 
              to={`/lms/create?edit=${id}`}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-center py-2.5 rounded-xl font-bold transition-colors"
            >
              Edit Course
            </Link>
            <button 
              onClick={handleDeleteCourse}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 text-center py-2.5 rounded-xl font-bold transition-colors"
            >
              Delete Course
            </button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="font-bold text-slate-900 tracking-tight">Curriculum</h4>
            {enrollment && (
              <span className="bg-primary-100 text-primary-700 font-bold px-3 py-1 rounded-full text-[10px] tracking-widest">{enrollment.progress}%</span>
            )}
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {course.modules.map((m, idx) => {
              const moduleIsCompleted = enrollment?.completedModules.includes(m._id);
              return (
                <button 
                  key={m._id} 
                  onClick={() => enrollment && setCurrentModuleIndex(idx)}
                  disabled={!enrollment}
                  className={`w-full p-4 flex items-start gap-4 text-left transition-colors hover:bg-slate-50 ${currentModuleIndex === idx ? 'bg-primary-50 border-l-4 border-primary-500' : ''}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${moduleIsCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {moduleIsCompleted ? '✓' : idx + 1}
                  </div>
                  <div>
                    <h5 className={`font-bold text-sm ${currentModuleIndex === idx ? 'text-primary-600' : 'text-slate-800'}`}>{m.title}</h5>
                    <p className="text-xs text-slate-400 font-medium">Module {idx + 1}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
