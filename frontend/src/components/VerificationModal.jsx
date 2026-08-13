import { useState } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function VerificationModal({ isOpen, onClose, defaultType = 'phone' }) {
  const { user, sendOtp, verifyOtp } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [activeTab, setActiveTab] = useState(defaultType); // 'email' | 'phone'
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [phoneInput, setPhoneInput] = useState(user?.phone || '');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const target = activeTab === 'email' ? emailInput : phoneInput;
    if (!target.trim()) {
      showError(`Please enter a valid ${activeTab} address/number`);
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(activeTab, target);
      setOtpSent(true);
      showSuccess(`Verification code sent to ${target} via ${activeTab === 'email' ? 'Email' : 'SMS'}!`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput) {
      showError('Please enter the 6-digit code received via Email/SMS');
      return;
    }

    setLoading(true);
    try {
      const target = activeTab === 'email' ? emailInput : phoneInput;
      const res = await verifyOtp(
        activeTab,
        otpInput,
        activeTab === 'phone' ? phoneInput : undefined,
        activeTab === 'email' ? emailInput : undefined,
        target
      );
      showSuccess(res.message || 'Verification successful!');
      setOtpSent(false);
      setOtpInput('');

      // If both verified, close modal
      if ((activeTab === 'phone' && user?.isEmailVerified) || (activeTab === 'email' && user?.isPhoneVerified)) {
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account & Identity Verification" size="md">
      <div className="space-y-5">
        {/* Verification Status Header */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Verification Status</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {user?.role === 'recruiter' 
                ? `Recruiter Trust Score: ${user?.trustScore || 0}%`
                : (user?.isEmailVerified && user?.isPhoneVerified ? 'Verified Candidate' : 'Verification Pending')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user?.isEmailVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
              {user?.isEmailVerified ? 'Email ✓' : 'Email ✗'}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user?.isPhoneVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}`}>
              {user?.isPhoneVerified ? 'Phone ✓' : 'Phone ✗'}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab('email'); setOtpSent(false); setOtpInput(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'email' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Email Verification {user?.isEmailVerified ? ' (Verified ✓)' : ''}
          </button>
          <button
            onClick={() => { setActiveTab('phone'); setOtpSent(false); setOtpInput(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'phone' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Phone Verification {user?.isPhoneVerified ? ' (Verified ✓)' : ''}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'email' ? (
          <div className="space-y-4">
            {user?.isEmailVerified ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Email address ({user?.email}) verified ✓</span>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    label="Registered Profile Email Address"
                    type="email"
                    value={user?.email || ''}
                    disabled={true}
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium px-1">
                    🔒 Verification codes are strictly restricted to your registered profile email.
                  </p>
                </div>

                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp} loading={loading} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700">
                    Send Email Verification Code
                  </Button>
                ) : (
                  <>
                    <Input
                      label="Enter 6-Digit Email OTP Code"
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="e.g. 849201"
                      required
                    />

                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>A 6-digit verification code was sent to <strong className="text-indigo-950">{user?.email}</strong>. Please check your inbox.</span>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={handleSendOtp} loading={loading} className="flex-1">
                        Resend Code
                      </Button>
                      <Button type="submit" loading={loading} className="flex-1 font-bold bg-indigo-600 hover:bg-indigo-700">
                        Verify Email
                      </Button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {user?.isPhoneVerified ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Phone number ({user?.phone}) verified ✓</span>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <Input
                    label="Registered Mobile Phone Number"
                    type="tel"
                    value={user?.phone || ''}
                    disabled={true}
                    required
                  />
                  <p className="text-[11px] text-slate-500 font-medium px-1">
                    🔒 Verification codes are strictly restricted to your registered profile phone number.
                  </p>
                </div>

                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp} loading={loading} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700">
                    Send Phone Verification SMS Code
                  </Button>
                ) : (
                  <>
                    <Input
                      label="Enter 6-Digit Phone OTP Code"
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="e.g. 654321"
                      required
                    />

                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>An SMS verification code was sent to <strong className="text-indigo-950">{phoneInput}</strong>. Please check your mobile phone messages.</span>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="secondary" onClick={handleSendOtp} loading={loading} className="flex-1">
                        Resend OTP
                      </Button>
                      <Button type="submit" loading={loading} className="flex-1 font-bold bg-indigo-600 hover:bg-indigo-700">
                        Verify Phone Number
                      </Button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
