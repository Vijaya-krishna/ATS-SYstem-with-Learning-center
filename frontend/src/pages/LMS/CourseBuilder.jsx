import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function CourseBuilder({ courseId = null, onComplete = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editId = courseId || queryParams.get('edit');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    thumbnail: '',
    modules: [{ title: '', content: '', videoUrl: '' }]
  });
  const [loading, setLoading] = useState(editId ? true : false);

  useEffect(() => {
    if (editId) {
      const fetchCourse = async () => {
        try {
          const res = await axios.get(`${API_URL}/courses/${editId}`);
          setFormData(res.data);
        } catch (err) {
          alert("Failed to load course data");
        } finally {
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId]);

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { title: '', content: '', videoUrl: '' }]
    });
  };

  const handleRemoveModule = (index) => {
    const newModules = formData.modules.filter((_, i) => i !== index);
    setFormData({ ...formData, modules: newModules });
  };

  const handleModuleChange = (index, field, value) => {
    const newModules = [...formData.modules];
    newModules[index][field] = value;
    setFormData({ ...formData, modules: newModules });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (editId) {
        await axios.put(`${API_URL}/courses/${editId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Course updated successfully!");
      } else {
        await axios.post(`${API_URL}/courses`, formData, {
          headers: { Authorization:     `Bearer ${token}` }
        });
        alert("Course created successfully!");
      }
      
      if (onComplete) onComplete();
      else navigate('/lms');
    } catch (err) {
      alert("Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{courseId ? 'Edit Course' : 'Create New Course'}</h2>
        <p className="text-slate-500 mt-1">{courseId ? 'Update your course content and settings.' : 'Design a course to train candidates and improve their matching potential.'}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Course Title</label>
              <input 
                required 
                type="text" 
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="e.g. Advanced JavaScript Mastery"
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
              <input 
                required 
                type="text" 
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="e.g. Development"
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Level</label>
              <select 
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-all font-medium"
                value={formData.level} 
                onChange={(e) => setFormData({...formData, level: e.target.value})}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Thumbnail URL (Optional)</label>
              <input 
                type="text" 
                className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="https://images.unsplash.com/..."
                value={formData.thumbnail || ''} 
                onChange={(e) => setFormData({...formData, thumbnail: e.target.value})} 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
            <textarea 
              required 
              rows="4" 
              className="w-full px-5 py-3 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="What will students learn in this course?"
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-900">Course Curriculum</h3>
            <button 
              type="button" 
              onClick={handleAddModule}
              className="text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl font-bold text-sm transition-colors border border-primary-100"
            >
              + Add Module
            </button>
          </div>

          <div className="space-y-6">
            {formData.modules.map((module, index) => (
              <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative group animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-lg text-xs tracking-widest uppercase">Module {index + 1}</span>
                  {formData.modules.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveModule(index)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Module Title</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 transition-all font-bold"
                      value={module.title} 
                      onChange={(e) => handleModuleChange(index, 'title', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">YouTube Video URL</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-2 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 transition-all text-sm"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={module.videoUrl} 
                      onChange={(e) => handleModuleChange(index, 'videoUrl', e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Context / Notes</label>
                    <textarea 
                      rows="3" 
                      className="w-full px-4 py-2 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none bg-slate-50 transition-all text-sm leading-relaxed"
                      value={module.content} 
                      onChange={(e) => handleModuleChange(index, 'content', e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-primary-100 hover:-translate-y-1 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (courseId ? 'Update Course' : 'Launch Course')}
          </button>
        </div>
      </form>
    </div>
  );
}
