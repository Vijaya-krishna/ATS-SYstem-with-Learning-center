import { useState, useEffect } from 'react';
import axios from 'axios';
import ResumeScanner from '../Candidate/ResumeScanner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getScoreColorClass = (score) => {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  if (score >= 50) return 'bg-amber-100 text-amber-800 border border-amber-300';
  return 'bg-rose-100 text-rose-800 border border-rose-300';
};

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'jobs', 'optimizer'
  const [jobs, setJobs] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', company: '', location: '', salary: '' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJobApps, setSelectedJobApps] = useState(null); // Stores applications for a job
  const [selectedJobDescription, setSelectedJobDescription] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  const handleBenchmark = (description) => {
    setSelectedJobDescription(description);
    setActiveTab('optimizer');
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = JSON.parse(localStorage.getItem('user'));
      const recruiterJobs = res.data.filter(j => j.recruiterId?._id === user?.id || j.recruiterId === user?.id);
      setJobs(recruiterJobs);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for welcome message trigger
    if (sessionStorage.getItem('justLoggedIn') === 'true') {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.name) {
        setUserName(user.name);
        setShowWelcome(true);
      }
      sessionStorage.removeItem('justLoggedIn');
    }

    fetchJobs();
  }, []);

  const handleViewApplications = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedJobApps({ jobId, apps: res.data });
    } catch (err) {
      alert("Failed to load applications");
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/applications/${appId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Update local state to reflect change without refetching
      setSelectedJobApps(prev => ({
        ...prev,
        apps: prev.apps.map(app => 
          app._id === appId ? { ...app, status: newStatus } : app
        )
      }));
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/jobs`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsFormOpen(false);
      setFormData({ title: '', description: '', company: '', location: '', salary: '' });
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'overview' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'jobs' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Active Job Postings
        </button>
        <button 
          onClick={() => setActiveTab('optimizer')}
          className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'optimizer' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Resume Matcher / Optimizer
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <header>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Recruiter Dashboard</h2>
            <p className="text-slate-500 mt-1">Manage your hiring pipeline efficiently.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-primary-200 transition-colors">
               <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Postings</h3>
               <p className="text-slate-500 text-sm mb-6">Create new opportunities and review candidate applications.</p>
               <button onClick={() => setActiveTab('jobs')} className="text-primary-600 font-bold hover:text-primary-700">View Job Postings &rarr;</button>
             </div>
             
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-secondary-200 transition-colors">
               <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center text-secondary-500 mb-4 group-hover:scale-110 transition-transform">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Internal Benchmarking</h3>
               <p className="text-slate-500 text-sm mb-6">Match external candidates against your job profiles.</p>
               <button onClick={() => setActiveTab('optimizer')} className="text-secondary-600 font-bold hover:text-secondary-700">Open Scanner &rarr;</button>
             </div>
          </div>
        </div>
      ) : activeTab === 'jobs' ? (
        <>
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Recruiter Dashboard</h2>
              <p className="text-slate-500 mt-1">Manage your job postings and review applications.</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {isFormOpen ? 'Cancel' : '+ Post New Job'}
            </button>
          </header>

          {isFormOpen && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-4">Create New Job Posting</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Title</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary (Optional)</label>
                    <input type="number" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea required rows="4" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea>
                </div>
                <div className="flex justify-end">
                  <button disabled={isSubmitting} type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Posting...' : 'Post Job'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <div className="text-slate-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Jobs Posted Yet</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Get started by creating your first job posting to attract top talent to your company.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                  <p className="text-slate-500 font-medium mt-1">{job.company} • {job.location}</p>
                  <p className="text-slate-600 text-sm mt-4 line-clamp-2 flex-grow">{job.description}</p>
                  <div className="mt-6 flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <button 
                      onClick={() => handleBenchmark(job.description)}
                      className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                     >
                      Benchmark
                     </button>
                     <button 
                      onClick={() => handleViewApplications(job._id)}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                     >
                      Apps
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <h3 className="text-blue-900 font-bold mb-2">Internal Candidate Benchmarking</h3>
            <p className="text-blue-700 text-sm">Upload a resume from an external source (like LinkedIn/Email) and scan it against your job descriptions to see if they are a good match before officially inviting them to apply.</p>
          </div>
          <ResumeScanner showHeader={false} availableJobs={jobs} initialJobDescription={selectedJobDescription} />
        </div>
      )}

      {selectedJobApps && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold">Applications</h3>
              <button onClick={() => setSelectedJobApps(null)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {selectedJobApps.apps.length === 0 ? (
                <p className="text-center text-slate-500 py-10">No applications yet for this position.</p>
              ) : (
                selectedJobApps.apps.map(app => (
                  <div key={app._id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">{app.candidateId?.name}</h4>
                      <p className="text-sm text-slate-500">{app.candidateId?.email}</p>
                      {app.resumeLink && (
                        <a 
                          href={`http://localhost:5001${app.resumeLink}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium inline-flex items-center gap-1 mt-1"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          View Resume
                        </a>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className={`text-xs font-bold px-3 py-1 rounded-full mb-1 inline-block ${getScoreColorClass(app.atsScore)}`}>
                        ATS: {app.atsScore}%
                      </div>
                      <select 
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none ${
                           app.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                           app.status === 'reviewed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                           'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Welcome Modal (Triggered on fresh login) */}
      {showWelcome && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-500 ease-out border border-white/20 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 transform translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mb-2">
                Welcome back, {userName.split(' ')[0]}!
              </h2>
              <p className="text-slate-600 mb-8 font-medium">
                We're thrilled to see you again. Get ready to find the perfect candidate today.
              </p>
              
              <button 
                onClick={() => setShowWelcome(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                Let's Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

