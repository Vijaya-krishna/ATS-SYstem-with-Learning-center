import { useState, useEffect } from 'react';
import axios from 'axios';
import ResumeScanner from './ResumeScanner';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const getScoreColorClass = (score) => {
  if (score >= 75) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-rose-50 text-rose-700 border border-rose-200';
};

export default function CandidateDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'jobs', 'optimizer'
  const [jobs, setJobs] = useState([]);
  const [applyingTo, setApplyingTo] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState({}); // Stores { jobId: { score, status } }
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedJobDescription, setSelectedJobDescription] = useState('');
  const [atsSubmissionResult, setAtsSubmissionResult] = useState(null); // Stores rich feedback
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  
  const handleScanBeforeApply = (description) => {
    setSelectedJobDescription(description);
    setActiveTab('optimizer');
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

    const fetchJobsAndApps = async () => {
      try {
        const token = localStorage.getItem('token');
        const jobsRes = await axios.get(`${API_URL}/jobs`);
        
        const appsRes = await axios.get(`${API_URL}/applications/my-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const appliedMap = {};
        appsRes.data.forEach(app => {
          appliedMap[app.jobId?._id || app.jobId] = {
            score: app.atsScore || 0,
            status: app.status || 'pending'
          };
        });
        
        setJobs(jobsRes.data);
        setAppliedJobs(appliedMap);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };
    fetchJobsAndApps();
  }, []);

  const handleApply = async (jobId) => {
    if (!selectedFile) {
      alert("Please select a resume (PDF) first.");
      return;
    }
    if (applyingTo === jobId || appliedJobs[jobId] !== undefined) return;
    setApplyingTo(jobId);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('resume', selectedFile);
      
      const res = await axios.post(`${API_URL}/resumes/apply-with-resume`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setAppliedJobs(prev => ({ 
        ...prev, 
        [jobId]: { score: res.data.atsDetails.score, status: 'pending' } 
      }));
      setAtsSubmissionResult(res.data.atsDetails);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyingTo(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          Browse Jobs
        </button>
        <button 
          onClick={() => setActiveTab('optimizer')}
          className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'optimizer' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Resume Optimizer
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          <header>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome to your Dashboard</h2>
            <p className="text-slate-500 mt-1">Here is a quick overview of your activity and tools.</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-primary-200 transition-colors">
               <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mb-4 group-hover:scale-110 transition-transform">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Find Your Next Role</h3>
               <p className="text-slate-500 text-sm mb-6">Browse through available jobs and apply directly with your saved resume.</p>
               <button onClick={() => setActiveTab('jobs')} className="text-primary-600 font-bold hover:text-primary-700">View Jobs &rarr;</button>
             </div>
             
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-secondary-200 transition-colors">
               <div className="w-16 h-16 bg-secondary-50 rounded-full flex items-center justify-center text-secondary-500 mb-4 group-hover:scale-110 transition-transform">
                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">Optimize Your Resume</h3>
               <p className="text-slate-500 text-sm mb-6">Use our ATS scanner to match your resume against any job description.</p>
               <button onClick={() => setActiveTab('optimizer')} className="text-secondary-600 font-bold hover:text-secondary-700">Open Optimizer &rarr;</button>
             </div>
          </div>
        </div>
      ) : activeTab === 'jobs' ? (
        <>
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Available Jobs</h2>
              <p className="text-slate-500 mt-1">Browse jobs and skyrocket your career with ATS-optimized applications.</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Your Resume:</span>
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>
          </header>
          
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
              <p className="text-slate-500">No jobs available right now. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{job.title}</h3>
                    {appliedJobs[job._id] && (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${getScoreColorClass(appliedJobs[job._id].score)}`}>
                          ATS: {appliedJobs[job._id].score}%
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                           appliedJobs[job._id].status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                           appliedJobs[job._id].status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                           appliedJobs[job._id].status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                           'bg-slate-100 text-slate-600'
                        }`}>
                          {appliedJobs[job._id].status}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium">{job.company}</p>
                  
                  <div className="flex gap-3 mt-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800">
                      {job.location}
                    </span>
                    {job.salary && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                        ${job.salary.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-600 text-sm mt-5 line-clamp-3 mb-6 flex-grow">{job.description}</p>
                  
                  <div className="flex gap-2 mt-auto">
                    <button 
                      onClick={() => handleScanBeforeApply(job.description)}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-2 rounded-xl transition-all text-xs"
                    >
                      Scan Match
                    </button>
                    <button 
                      onClick={() => handleApply(job._id)}
                      disabled={applyingTo === job._id || appliedJobs[job._id] !== undefined}
                      className={`flex-[2] font-bold py-2 rounded-xl transition-colors border text-xs ${
                        appliedJobs[job._id] !== undefined 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed'
                          : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-wait'
                      }`}
                    >
                      {appliedJobs[job._id] !== undefined ? 'Applied ✓' : applyingTo === job._id ? 'Applying...' : 'Apply Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <ResumeScanner showHeader={false} availableJobs={jobs} initialJobDescription={selectedJobDescription} />
      )}

      {/* ATS Result Modal */}
      {atsSubmissionResult && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`p-6 border-b text-center ${getScoreColorClass(atsSubmissionResult.score)} bg-opacity-10 border-opacity-50`}>
              <h3 className="text-2xl font-bold mb-1">Application Submitted</h3>
              <p className="text-sm opacity-80">Here is your ATS match analysis</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 shadow-inner ${getScoreColorClass(atsSubmissionResult.score).replace('bg-','text-').replace('text-','border-')}`}>
                  <div className="text-center">
                    <span className="text-4xl font-bold block">{atsSubmissionResult.score}%</span>
                    <span className="text-xs uppercase tracking-wide font-medium text-slate-500">Match</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-2">Recommendations</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{atsSubmissionResult.recommendations}</p>
              </div>

              {atsSubmissionResult.missingKeywords?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 text-sm">Suggested Keywords for Next Time</h4>
                  <div className="flex flex-wrap gap-2">
                    {atsSubmissionResult.missingKeywords.map((kw, i) => (
                      <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-xs font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-slate-50 flex justify-end">
              <button 
                onClick={() => setAtsSubmissionResult(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-medium transition-colors"
              >
                Close & Continue
              </button>
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
                We're thrilled to see you again. Get ready to explore new opportunities and optimize your ATS score.
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

