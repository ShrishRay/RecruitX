import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleQuickLogin = async (userEmail, userPassword = 'password123') => {
    setEmail(userEmail);
    setPassword(userPassword);
    setLoading(true);
    setError('');
    try {
      const user = await login(userEmail, userPassword);
      showSuccess(`Welcome back, ${user.name}!`);
      navigate(user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      showSuccess(`Welcome back, ${user.name}!`);
      navigate(user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
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
      showSuccess(`Signed in with Google as ${user.name}`);
      setShowGoogleModal(false);
      navigate(user.role === 'candidate' ? '/candidate/dashboard' : '/recruiter/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google login failed';
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
      setLoading(false);
      setShowGoogleModal(true);
    }
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    if (!customGoogleEmail) return;
    const namePart = customGoogleEmail.split('@')[0];
    const formattedName = customGoogleName || (namePart.charAt(0).toUpperCase() + namePart.slice(1));
    
    executeGoogleAuth({
      email: customGoogleEmail,
      displayName: formattedName,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedName)}&background=4F46E5&color=fff`
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 text-white mb-12 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight">Recruit<span className="text-indigo-400">X</span></span>
          </Link>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight mb-4 text-white">
            Smart Resume Routing & Verification Platform
          </h2>
          <p className="text-base text-slate-300 max-w-md font-medium leading-relaxed">
            Automated PDF resume corroboration, enterprise verification, and real-time candidate match scoring.
          </p>
        </div>

        {/* Demo Accounts Quick List on Left Panel */}
        <div className="relative z-10 space-y-3 pt-8 border-t border-slate-800/80">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pre-Configured Test Accounts (Password: password123):</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-0.5">
              <span className="font-bold text-white block">Alex Rivera</span>
              <span className="text-[11px] text-slate-400 block font-mono">alex@email.com</span>
              <span className="text-[10px] text-indigo-300 font-medium">Fresh Candidate (0 Warnings)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-0.5">
              <span className="font-bold text-white block">Elena Rostova</span>
              <span className="text-[11px] text-slate-400 block font-mono">elena@email.com</span>
              <span className="text-[10px] text-emerald-400 font-medium">100% Resume Verified</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-0.5">
              <span className="font-bold text-white block">Lucas Silva</span>
              <span className="text-[11px] text-slate-400 block font-mono">lucas@email.com</span>
              <span className="text-[10px] text-amber-400 font-medium">1 Warning (2 Remaining)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-0.5">
              <span className="font-bold text-white block">Chloe Zhang</span>
              <span className="text-[11px] text-slate-400 block font-mono">chloe@email.com</span>
              <span className="text-[10px] text-amber-400 font-medium">2 Warnings (Final Warning)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-0.5">
              <span className="font-bold text-white block">Nathan Cole</span>
              <span className="text-[11px] text-slate-400 block font-mono">nathan@email.com</span>
              <span className="text-[10px] text-rose-400 font-medium">3 Warnings (Rejected Account)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 space-y-0.5">
              <span className="font-bold text-white block">Sarah Chen</span>
              <span className="text-[11px] text-slate-400 block font-mono">sarah@techcorp.com</span>
              <span className="text-[10px] text-purple-300 font-medium">Verified Enterprise Recruiter</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50 animate-slide-up">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tight">Recruit<span className="text-indigo-600">X</span></span>
            </Link>
          </div>

          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your account</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Don't have an account?{' '}
              <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Create one</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@email.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2 font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md">
              Sign In
            </Button>

            {/* 1-Click Quick Demo Login Grid */}
            <div className="pt-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">1-Click Test & Restored Accounts:</p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sarah@techcorp.com')}
                  className="p-1.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-indigo-950 text-[11px]">Sarah Chen</p>
                  <p className="text-[10px] text-indigo-700 font-semibold">🏢 Verified Recruiter</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('atharv1132006@gmail.com')}
                  className="p-1.5 bg-purple-50/70 hover:bg-purple-100 border border-purple-200 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-purple-950 text-[11px]">Atharva Joshi</p>
                  <p className="text-[10px] text-purple-700 font-semibold">Full Stack (Verified)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('alex@email.com')}
                  className="p-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-slate-800 text-[11px]">Alex Rivera</p>
                  <p className="text-[10px] text-slate-500">Fresh (0 Warnings)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('elena@email.com')}
                  className="p-1.5 bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-emerald-900 text-[11px]">Elena Rostova</p>
                  <p className="text-[10px] text-emerald-700">100% Resume Verified</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('lucas@email.com')}
                  className="p-1.5 bg-amber-50/50 hover:bg-amber-100 border border-amber-200 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-amber-900 text-[11px]">Lucas Silva</p>
                  <p className="text-[10px] text-amber-700">1 Warning (2 left)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('chloe@email.com')}
                  className="p-1.5 bg-amber-100/70 hover:bg-amber-200 border border-amber-300 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-amber-950 text-[11px]">Chloe Zhang</p>
                  <p className="text-[10px] text-amber-800">2 Warnings (Final)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('nathan@email.com')}
                  className="p-1.5 bg-rose-50/50 hover:bg-rose-100 border border-rose-200 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-rose-900 text-[11px]">Nathan Cole</p>
                  <p className="text-[10px] text-rose-700">3 Strikes (Rejected)</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('tariq@email.com')}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer"
                >
                  <p className="font-bold text-slate-800 text-[11px]">Tariq Mansoor</p>
                  <p className="text-[10px] text-slate-500">Unverified (0%)</p>
                </button>
              </div>
            </div>

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
      </div>

      {/* Google Single Sign-On Dialog Modal */}
      <Modal isOpen={showGoogleModal} onClose={() => setShowGoogleModal(false)} title="Sign in with Google" size="sm">
        <div className="p-2 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
            <svg className="w-6 h-6" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.73 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-medium">Choose an account to continue to RecruitX</p>
          
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

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative px-3 bg-white text-[11px] font-bold text-slate-400 uppercase">Or manual email</span>
          </div>

          <form onSubmit={handleCustomGoogleSubmit} className="space-y-3">
            <Input
              label="Your Full Name (Optional)"
              type="text"
              value={customGoogleName}
              onChange={(e) => setCustomGoogleName(e.target.value)}
              placeholder="e.g. Jane Doe"
            />
            <Input
              label="Google Email Address"
              type="email"
              value={customGoogleEmail}
              onChange={(e) => setCustomGoogleEmail(e.target.value)}
              placeholder="your.name@gmail.com"
              required
            />
            <Button type="submit" fullWidth size="md" className="font-bold bg-indigo-600 hover:bg-indigo-700">
              Sign In with Custom Google ID
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
