import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import TagInput from '../../components/ui/TagInput';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import VerificationModal from '../../components/VerificationModal';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    skills: [],
    experience: 0,
    projects: [{ title: '', description: '', technologies: [] }],
    education: { degree: '', institution: '', year: '' },
    preferredRole: '',
    preferredLocation: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/candidate/profile');
      const p = res.data.profile;
      setForm({
        name: p.name || '',
        skills: p.skills || [],
        experience: p.experience || 0,
        projects: p.projects?.length > 0 ? p.projects : [{ title: '', description: '', technologies: [] }],
        education: p.education || { degree: '', institution: '', year: '' },
        preferredRole: p.preferredRole || '',
        preferredLocation: p.preferredLocation || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      showError('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        experience: Number(form.experience),
        education: {
          ...form.education,
          year: form.education.year ? Number(form.education.year) : undefined,
        },
        projects: form.projects.filter(p => p.title.trim() !== ''),
      };
      const res = await api.put('/candidate/profile', payload);
      updateUser(res.data.profile);
      showSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Error saving profile:', err);
      showError('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const addProject = () => {
    setForm({
      ...form,
      projects: [...form.projects, { title: '', description: '', technologies: [] }],
    });
  };

  const removeProject = (index) => {
    setForm({ ...form, projects: form.projects.filter((_, i) => i !== index) });
  };

  const updateProject = (index, field, value) => {
    const updated = [...form.projects];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, projects: updated });
  };

  if (loading) {
    return <Spinner className="py-32" size="lg" />;
  }

  const isFullyVerified = user?.isEmailVerified && user?.isPhoneVerified;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {showVerificationModal && <VerificationModal onClose={() => setShowVerificationModal(false)} />}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Candidate Profile</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Keep your skills, experience, and verification details updated to apply for job openings.
        </p>
      </div>

      {/* Account Verification Card */}
      <Card hover={false} className="p-5 border-l-4 border-l-indigo-600 bg-gradient-to-r from-indigo-50/40 to-slate-50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Identity Verification Status</h2>
              <span className={`px-2 py-0.5 rounded-md text-xs font-extrabold ${isFullyVerified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {isFullyVerified ? 'Verified Profile ✓' : 'Verification Required ⚡'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {isFullyVerified 
                ? 'Your profile is fully verified! You can apply for all active job requisitions.' 
                : 'Please complete both Email and Phone verification to unlock job applications.'}
            </p>
            <div className="flex items-center gap-3 mt-2.5 text-xs font-semibold">
              <span className={user?.isEmailVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                Email: {user?.isEmailVerified ? 'Verified ✓' : 'Unverified ✗'}
              </span>
              <span>·</span>
              <span className={user?.isPhoneVerified ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                Phone: {user?.isPhoneVerified ? `Verified (${user?.phone || ''}) ✓` : 'Unverified ✗'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowVerificationModal(true)}
            className="font-bold shrink-0 bg-indigo-600 hover:bg-indigo-700 shadow-sm"
          >
            {isFullyVerified ? 'Manage Verification' : 'Verify Account Now'}
          </Button>
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
              required
            />
            <Input
              label="Years of Experience"
              type="number"
              min="0"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              required
            />
            <Input
              label="Target Role"
              value={form.preferredRole}
              onChange={(e) => setForm({ ...form, preferredRole: e.target.value })}
              placeholder="e.g. Full Stack Developer"
            />
            <Input
              label="Preferred Location"
              value={form.preferredLocation}
              onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
              placeholder="e.g. Remote, New York"
            />
          </div>
        </Card>

        {/* Skills */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Technical Skills (70% Match Weight)
          </h2>
          <TagInput
            label="Key Skills"
            tags={form.skills}
            onChange={(skills) => setForm({ ...form, skills })}
            placeholder="Type a skill and press Enter (e.g. React, Python, Docker)"
          />
        </Card>

        {/* Education */}
        <Card hover={false} className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
            Education Background
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Degree / Major"
              value={form.education.degree}
              onChange={(e) => setForm({ ...form, education: { ...form.education, degree: e.target.value } })}
              placeholder="e.g. B.S. Computer Science"
            />
            <Input
              label="University / Institution"
              value={form.education.institution}
              onChange={(e) => setForm({ ...form, education: { ...form.education, institution: e.target.value } })}
              placeholder="e.g. Stanford University"
            />
            <Input
              label="Graduation Year"
              type="number"
              value={form.education.year}
              onChange={(e) => setForm({ ...form, education: { ...form.education, year: e.target.value } })}
              placeholder="e.g. 2022"
            />
          </div>
        </Card>

        {/* Projects */}
        <Card hover={false} className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Key Projects
            </h2>
            <Button variant="ghost" size="sm" onClick={addProject} type="button" className="text-indigo-600 font-bold">
              + Add Project
            </Button>
          </div>

          <div className="space-y-4">
            {form.projects.map((project, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase text-slate-400">Project #{index + 1}</span>
                  {form.projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProject(index)}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Input
                  label="Project Title"
                  value={project.title}
                  onChange={(e) => updateProject(index, 'title', e.target.value)}
                  placeholder="e.g. E-Commerce Microservices Platform"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-800">Description</label>
                  <textarea
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    placeholder="Briefly summarize what you built, key challenges solved, and outcomes..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 hover:border-slate-300 transition-colors"
                  />
                </div>
                <TagInput
                  label="Technologies Used"
                  tags={project.technologies || []}
                  onChange={(techs) => updateProject(index, 'technologies', techs)}
                  placeholder="Add technology tags..."
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Submit */}
        <div className="pt-2">
          <Button type="submit" loading={saving} size="lg" className="font-bold px-8">
            Save Profile
          </Button>
        </div>
      </form>

      {/* Identity Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </div>
  );
}
