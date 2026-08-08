import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import TagInput from '../../components/ui/TagInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function PostJob() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    skillsRequired: [],
    experienceRequired: '',
    location: '',
    salary: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.description || !form.experienceRequired) {
      setError('Title, description, and required experience are mandatory');
      return;
    }

    setSaving(true);
    try {
      await api.post('/jobs', {
        ...form,
        experienceRequired: Number(form.experienceRequired),
      });
      showSuccess('Job posting published successfully!');
      navigate('/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error creating job posting';
      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Post a New Job</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Create a detailed job requirement to begin automatically matching candidates.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Job Details */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Role Information
          </h2>
          <div className="space-y-4">
            <Input
              label="Job Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Full Stack Developer"
              required
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-800">Job Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe role responsibilities, team structure, stack, and project goals..."
                rows={5}
                required
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 hover:border-slate-300 transition-colors resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Required Qualifications
          </h2>
          <div className="space-y-4">
            <TagInput
              label="Required Skills (Key matching criteria)"
              tags={form.skillsRequired}
              onChange={(skills) => setForm({ ...form, skillsRequired: skills })}
              placeholder="Type required skill and press Enter (e.g. React, Node.js, AWS)"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Required Experience (years)"
                type="number"
                min="0"
                value={form.experienceRequired}
                onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })}
                placeholder="e.g. 3"
                required
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Remote, San Francisco"
              />
              <Input
                label="Salary Range"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="e.g. $130K - $160K"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => navigate('/recruiter/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} size="lg" className="font-bold px-8">
            Publish Job Posting
          </Button>
        </div>
      </form>
    </div>
  );
}
