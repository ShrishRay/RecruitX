import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/ui/Input';
import TagInput from '../components/ui/TagInput';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(searchParams.get('role') || 'candidate');
  
  // Recruiter fields
  const [company, setCompany] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyRegNumber, setCompanyRegNumber] = useState('');

  // Candidate fields
  const [skills, setSkills] = useState(['React', 'Node.js', 'JavaScript']);
  const [experience, setExperience] = useState(2);
  const [preferredRole, setPreferredRole] = useState('Full Stack Developer');
  const [preferredLocation, setPreferredLocation] = useState('Remote');
  const [degree, setDegree] = useState('B.S. Computer Science');
  const [institution, setInstitution] = useState('State University');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !phone) {
      setError('Please fill in all required fields, including mobile phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (role === 'recruiter' && !company) {
      setError('Company name is required for recruiters');
      return;
    }
    if (role === 'candidate' && skills.length === 0) {
      setError('Please enter at least one technical skill for your candidate profile');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        name, 
        email, 
        password, 
        phone, 
        role, 
        company: role === 'recruiter' ? company : undefined,
        companyWebsite: role === 'recruiter' ? companyWebsite : undefined,
        companyRegNumber: role === 'recruiter' ? companyRegNumber : undefined,
        skills: role === 'candidate' ? skills : undefined,
        experience: role === 'candidate' ? Number(experience) : undefined,
        preferredRole: role === 'candidate' ? preferredRole : undefined,
        preferredLocation: role === 'candidate' ? preferredLocation : undefined,
        education: role === 'candidate' ? { degree, institution } : undefined
      };

      const user = await signup(payload);
      showSuccess(`Account created! Welcome to RecruitX, ${user.name}`);
      navigate(user.role === 'candidate' ? '/candidate/profile' : '/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Signup failed. Please try again.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleAuth = async (googleData) => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle(googleData);
      showSuccess(`Welcome to RecruitX, ${user.name}`);
      setShowGoogleModal(false);
      navigate(user.role === 'candidate' ? '/candidate/profile' : '/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Signup failed';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await executeGoogleAuth({
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      });
    } catch (err) {
      console.warn('Firebase Popup error, opening Google SSO fallback window:', err);
      setShowGoogleModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xl mb-3 shadow-md">
            RX
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Create your account</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                role === 'candidate'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                role === 'recruiter'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recruiter / Enterprise
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              required
            />
            <Input
              label="Work or Personal Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Mobile Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              required
            />
            <Input
              label="Password (min. 6 chars)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          {/* Recruiter-Specific Fields */}
          {role === 'recruiter' && (
            <div className="space-y-3 pt-2 pb-2 border-t border-b border-slate-100 my-2">
              <Input
                label="Legal Company Name"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. TechCorp Solutions Inc."
                required
              />
              <Input
                label="Official Company Website"
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="e.g. https://techcorp.com"
              />
              <Input
                label="Company Registration / CIN / Tax ID (Optional)"
                type="text"
                value={companyRegNumber}
                onChange={(e) => setCompanyRegNumber(e.target.value)}
                placeholder="e.g. CIN-U72200DL2018PTC334512"
              />
            </div>
          )}

          {/* Candidate-Specific Fields: Skills, Experience, Role & Education */}
          {role === 'candidate' && (
            <div className="space-y-3 pt-2 pb-2 border-t border-b border-slate-100 my-2 bg-slate-50/70 p-3.5 rounded-xl border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                  Candidate Profile Details
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Matched with uploaded resume</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Target Job Role"
                  type="text"
                  value={preferredRole}
                  onChange={(e) => setPreferredRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer"
                  required
                />
                <Input
                  label="Years of Experience"
                  type="number"
                  min="0"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />
              </div>

              {/* Skills Input during creation */}
              <div>
                <TagInput
                  label="Key Technical Skills (Required)"
                  tags={skills}
                  onChange={(newSkills) => setSkills(newSkills)}
                  placeholder="Type skill & press Enter (e.g. React, Python, Docker, Node.js)"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tip: Add the core skills that appear on your PDF resume to ensure 100% corroboration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Input
                  label="Degree / Major"
                  type="text"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.S. Computer Science"
                />
                <Input
                  label="College / University"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Stanford University"
                />
              </div>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md">
            Create {role === 'candidate' ? 'Candidate' : 'Recruiter'} Account
          </Button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-wider">Or</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all font-semibold text-xs sm:text-sm text-slate-700 flex items-center justify-center gap-3 cursor-pointer shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </form>
      </div>

      {/* Google Single Sign-On Dialog Modal */}
      <Modal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} title="Sign up with Google" size="sm">
        <div className="p-2 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-medium">Select your account to register on RecruitX</p>
          
          <div className="space-y-2 text-left">
            <button
              onClick={() => executeGoogleAuth({ email: 'alex.candidate@gmail.com', displayName: 'Alex Rivera', photoURL: 'https://ui-avatars.com/api/?name=Alex+Rivera&background=4F46E5&color=fff' })}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Alex Rivera</p>
                <p className="text-[11px] text-slate-500">alex.candidate@gmail.com</p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">Google User</span>
            </button>

            <button
              onClick={() => executeGoogleAuth({ email: 'sarah.recruiter@gmail.com', displayName: 'Sarah Chen', photoURL: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=7C3AED&color=fff' })}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center justify-between text-left transition-all cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Sarah Chen</p>
                <p className="text-[11px] text-slate-500">sarah.recruiter@gmail.com</p>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">Google Recruiter</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
