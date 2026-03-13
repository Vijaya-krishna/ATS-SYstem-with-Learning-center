import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ResumeScanner from '../Candidate/ResumeScanner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getScoreColorClass = (score) => {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
  if (score >= 50) return 'bg-amber-100 text-amber-800 border border-amber-300';
  return 'bg-rose-100 text-rose-800 border border-rose-300';
};

export default function RecruiterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null); // job object being edited
  const [formData, setFormData] = useState({ title: '', description: '', company: '', location: '', salary: '' });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedJobApps, setSelectedJobApps] = useState(null);
  const [selectedJobDescription, setSelectedJobDescription] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

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
      const recruiterJobs = res.data.filter(j => j.recruiterId?._id === user?.id || j.recruiterId === user?.id);
      setJobs(recruiterJobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myCourses = res.data.filter(c =>
        c.instructorId?._id === user?.id || c.instructorId === user?.id
      );
      setCourses(myCourses);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('justLoggedIn') === 'true') {
      const u = JSON.parse(localStorage.getItem('user'));
      if (u?.name) { setUserName(u.name); setShowWelcome(true); }
      sessionStorage.removeItem('justLoggedIn');
    }
    fetchJobs();
    fetchMyCourses();
  }, []);

  const handleViewApplications = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/applications/job/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedJobApps({ jobId, apps: res.data });
    } catch {
      alert("Failed to load applications");
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/applications/${appId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedJobApps(prev => ({
        ...prev,
        apps: prev.apps.map(app => app._id === appId ? { ...app, status: newStatus } : app)
      }));
    } catch {
      alert("Failed to update status");
    }
  };

  const openCreateForm = () => {
    setEditingJob(null);
    setFormData({ title: '', description: '', company: '', location: '', salary: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (job) => {
    setEditingJob(job);
    setFormData({ title: job.title, description: job.description, company: job.company, location: job.location, salary: job.salary || '' });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (editingJob) {
        await axios.put(`${API_URL}/jobs/${editingJob._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/jobs`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsFormOpen(false);
      setEditingJob(null);
      setFormData({ title: '', description: '', company: '', location: '', salary: '' });
      fetchJobs();
    } catch {
      alert('Failed to save job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting? All applications will also be removed.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(prev => prev.filter(j => j._id !== jobId));
    } catch {
      alert('Failed to delete job');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this course permanently?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(prev => prev.filter(c => c._id !== courseId));
    } catch {
      alert('Failed to delete course');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'jobs', label: 'Job Postings' },
    { id: 'courses', label: 'My Courses' },
    { id: 'optimizer', label: 'Resume Matcher' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-4 px-2 text-sm font-bold whitespace-nowrap transition-all ${activeTab === t.id ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <header>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Recruiter Dashboard</h2>
            <p className="text-slate-500 mt-1">Manage your hiring pipeline and learning content.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'jobs', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Manage Postings', desc: 'Create and manage your job listings.', cta: 'View Postings →', color: 'primary' },
              { id: 'courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', label: 'My Courses', desc: 'Manage and edit courses you have created.', cta: 'View Courses →', color: 'secondary' },
              { id: 'optimizer', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Resume Matcher', desc: 'Benchmark candidates against job descriptions.', cta: 'Open Scanner →', color: 'primary' },
            ].map(card => (
              <div key={card.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-primary-200 transition-colors">
                <div className={`w-16 h-16 bg-${card.color}-50 rounded-full flex items-center justify-center text-${card.color}-600 mb-4 group-hover:scale-110 transition-transform`}>
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{card.label}</h3>
                <p className="text-slate-500 text-sm mb-6">{card.desc}</p>
                <button onClick={() => setActiveTab(card.id)} className={`text-${card.color}-600 font-bold hover:text-${card.color}-700`}>{card.cta}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JOBS TAB */}
      {activeTab === 'jobs' && (
        <>
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Job Postings</h2>
              <p className="text-slate-500 mt-1">Create, edit, and manage your job listings.</p>
            </div>
            <button
              onClick={openCreateForm}
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              + Post New Job
            </button>
          </header>

          {isFormOpen && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-4">{editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Job Title</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Salary (Optional)</label>
                    <input type="number" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea required rows="4" className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsFormOpen(false); setEditingJob(null); }} className="px-5 py-2 rounded-xl border font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button disabled={isSubmitting} type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Saving...' : editingJob ? 'Save Changes' : 'Post Job'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 text-slate-500">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Jobs Posted Yet</h3>
              <p className="text-slate-500">Get started by creating your first job posting.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                  <p className="text-slate-500 font-medium mt-1">{job.company} • {job.location}</p>
                  {job.salary && <p className="text-emerald-600 font-bold text-sm mt-1">₹{Number(job.salary).toLocaleString()}/yr</p>}
                  <p className="text-slate-600 text-sm mt-4 line-clamp-2 flex-grow">{job.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => handleBenchmark(job.description)} className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">Benchmark</button>
                    <button onClick={() => handleViewApplications(job._id)} className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors">Applications</button>
                    <button onClick={() => openEditForm(job)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">✏️ Edit</button>
                    <button onClick={() => handleDeleteJob(job._id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MY COURSES TAB */}
      {activeTab === 'courses' && (
        <>
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">My Courses</h2>
              <p className="text-slate-500 mt-1">Courses you have created in the Learning Center.</p>
            </div>
            <Link
              to="/lms/create"
              className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              + Create Course
            </Link>
          </header>

          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Courses Yet</h3>
              <p className="text-slate-500 mb-4">Create your first course to start teaching candidates.</p>
              <Link to="/lms/create" className="text-primary-600 font-bold hover:text-primary-700">Create your first course →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-36 object-cover" />
                  ) : (
                    <div className="w-full h-36 bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                      <svg className="w-12 h-12 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{course.title}</h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-2 flex-grow">{course.description}</p>
                    <p className="text-xs text-slate-400 mt-3 font-medium">{course.modules?.length || 0} modules</p>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Link to={`/lms/${course._id}`} className="col-span-1 text-center bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">View</Link>
                      <Link to={`/lms/create?edit=${course._id}`} className="col-span-1 text-center bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">✏️ Edit</Link>
                      <button onClick={() => handleDeleteCourse(course._id)} className="col-span-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors">🗑️ Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* OPTIMIZER TAB */}
      {activeTab === 'optimizer' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <h3 className="text-blue-900 font-bold mb-2">Internal Candidate Benchmarking</h3>
            <p className="text-blue-700 text-sm">Upload a resume from an external source and scan it against your job descriptions to see if they are a good match before officially inviting them to apply.</p>
          </div>
          <ResumeScanner showHeader={false} availableJobs={jobs} initialJobDescription={selectedJobDescription} />
        </div>
      )}

      {/* Applications Modal */}
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
                          href={`${API_URL.replace('/api', '')}${app.resumeLink}`}
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
                      <div className={`text-xs font-bold px-3 py-1 rounded-full mb-1 inline-block ${getScoreColorClass(app.atsScore)}`}>ATS: {app.atsScore}%</div>
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

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-500 ease-out border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-secondary-100 rounded-full mix-blend-multiply filter blur-2xl opacity-70 transform translate-x-1/2 translate-y-1/2"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600 mb-2">
                Welcome back, {userName.split(' ')[0]}!
              </h2>
              <p className="text-slate-600 mb-8 font-medium">We're thrilled to see you again. Get ready to find the perfect candidate today.</p>
              <button onClick={() => setShowWelcome(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-slate-200 active:scale-95">
                Let's Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
