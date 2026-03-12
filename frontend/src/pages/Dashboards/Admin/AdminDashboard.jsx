import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, jobs, applications, courses
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0, courses: 0 });
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [usersRes, jobsRes, appsRes, coursesRes] = await Promise.all([
        axios.get(`${API_URL}/auth/users`, { headers }),
        axios.get(`${API_URL}/jobs`, { headers }),
        axios.get(`${API_URL}/applications/all`, { headers }),
        axios.get(`${API_URL}/courses`, { headers })
      ]);
      
      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setCourses(coursesRes.data);
      
      setStats({
        users: usersRes.data.length,
        jobs: jobsRes.data.length,
        applications: appsRes.data.length,
        courses: coursesRes.data.length
      });
    } catch (err) {
      console.error("Admin fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/auth/users/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      setUsers(users.filter(u => u._id !== id));
      setStats({...stats, users: stats.users - 1});
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const handleDeleteJob = async (id) => {
    if(!window.confirm("Are you sure you want to permanently delete this job posting?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/jobs/admin/${id}`, { headers: { Authorization: `Bearer ${token}` }});
      setJobs(jobs.filter(j => j._id !== id));
      setStats({...stats, jobs: stats.jobs - 1});
    } catch (err) {
      alert("Failed to delete job");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">System Oversight</h2>
          <p className="text-slate-500 mt-2 font-medium">Platform-wide management and analytics dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
           {['overview', 'users', 'jobs', 'applications', 'courses'].map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </header>
      
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-medium">Syncing system data...</div>
      ) : activeTab === 'overview' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Users', val: stats.users, color: 'text-blue-600', border: 'hover:border-blue-200' },
            { label: 'Jobs', val: stats.jobs, color: 'text-slate-900', border: 'hover:border-slate-300' },
            { label: 'Apps', val: stats.applications, color: 'text-emerald-600', border: 'hover:border-emerald-200' },
            { label: 'Courses', val: stats.courses, color: 'text-primary-600', border: 'hover:border-primary-200' }
          ].map(s => (
            <div key={s.label} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center h-32 ${s.border} transition-all`}>
               <span className={`text-4xl font-bold ${s.color} mb-1`}>{s.val}</span>
               <span className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      ) : activeTab === 'users' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="divide-y divide-slate-50">
             {users.map(u => (
               <div key={u._id} className="p-5 px-8 flex justify-between items-center hover:bg-slate-50 transition-colors">
                 <div>
                   <h4 className="font-bold text-slate-900">{u.name}</h4>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{u.role} • {u.email}</p>
                 </div>
                 <button onClick={() => handleDeleteUser(u._id)} className="text-xs text-white font-bold bg-slate-900 hover:bg-red-600 px-4 py-2 rounded-xl transition-all shadow-lg shadow-slate-100">Delete</button>
               </div>
             ))}
           </div>
        </div>
      ) : activeTab === 'jobs' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
           <div className="divide-y divide-slate-50">
             {jobs.map(j => (
               <div key={j._id} className="p-5 px-8 flex justify-between items-center hover:bg-slate-50 transition-colors">
                 <div className="max-w-md">
                   <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                   <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{j.company} • {j.location}</p>
                 </div>
                 <button onClick={() => handleDeleteJob(j._id)} className="text-xs text-white font-bold bg-slate-900 hover:bg-red-600 px-4 py-2 rounded-xl transition-all shadow-lg shadow-slate-100">Delete</button>
               </div>
             ))}
           </div>
        </div>
      ) : activeTab === 'applications' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {applications.map(app => (
              <div key={app._id} className="p-5 px-8 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900">{app.candidateId?.name} ➔ {app.jobId?.title}</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{app.status}</span>
                    <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded font-bold text-indigo-600 uppercase">ATS: {app.atsScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {courses.map(course => (
              <div key={course._id} className="p-5 px-8 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-900">{course.title}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">{course.level} • {course.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
