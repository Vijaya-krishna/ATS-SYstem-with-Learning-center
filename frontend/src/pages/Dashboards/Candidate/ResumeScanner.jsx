import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function ResumeScanner({ showHeader = true, initialJobDescription = '', availableJobs = [] }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (initialJobDescription) {
      setJobDescription(initialJobDescription);
    }
  }, [initialJobDescription]);

  const handleJobSelect = (e) => {
    const jobId = e.target.value;
    const selectedJob = availableJobs.find(j => j._id === jobId);
    if (selectedJob) {
      setJobDescription(selectedJob.description);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      alert("Please upload a resume and paste a job description.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);

      const res = await axios.post(`${API_URL}/resumes/scan`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert(`Failed to scan resume: ${err.response?.data?.error || err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showHeader && (
        <header>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight text-center">ATS Resume Optimizer</h2>
          <p className="text-slate-500 mt-2 text-center max-w-lg mx-auto">
            Scan your resume against any job description to get instant feedback and keyword recommendations.
          </p>
        </header>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleScan} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6 self-start">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Upload Resume (PDF)</label>
            <div className="relative group">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full px-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary-400 transition-colors file:hidden text-sm text-slate-500"
              />
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                {file ? "File Selected ✓" : "Drop PDF here"}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-slate-700">2. Job Description</label>
              {availableJobs.length > 0 && (
                <select 
                  onChange={handleJobSelect}
                  className="text-xs bg-primary-50 text-primary-700 border-none rounded-lg px-2 py-1 font-bold outline-none cursor-pointer"
                >
                  <option value="">Select from your jobs...</option>
                  {availableJobs.map(job => (
                    <option key={job._id} value={job._id}>{job.title}</option>
                  ))}
                </select>
              )}
            </div>
            <textarea 
              rows="8"
              placeholder="Paste the target job description here..."
              className="w-full px-5 py-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm leading-relaxed"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
          >
            {loading ? "Analyzing Resume..." : "Scan My Resume"}
          </button>
        </form>

        <div className="space-y-6">
          {result ? (
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-primary-50 animate-in zoom-in duration-300">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary-50 bg-primary-600 text-white text-4xl font-black mb-4 shadow-xl">
                  {result.score}%
                </div>
                <h3 className="text-xl font-bold text-slate-900">ATS Match Score</h3>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                    Recommendations
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{result.recommendations}</p>
                </div>

                {result.missingKeywords.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-3 ml-1">Missing Key Terms</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.missingKeywords.map((kw, i) => (
                        <span key={i} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="font-medium">Upload your resume and paste a job description to see the results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
