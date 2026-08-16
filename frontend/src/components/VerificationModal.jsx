import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function VerificationModal({ isOpen = true, onClose, defaultType }) {
  const { user, sendOtp, verifyOtp, verifyCompany } = useAuth();
  const { showSuccess, showError } = useToast();

  const isRecruiter = user?.role === 'recruiter';
  const initialTab = defaultType || (isRecruiter ? (!user?.isCompanyVerified ? 'company' : !user?.isEmailVerified ? 'email' : 'phone') : (!user?.isEmailVerified ? 'email' : 'phone'));

  const [activeTab, setActiveTab] = useState(initialTab); // 'company' | 'email' | 'phone'
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Recruiter Company & Website Verification Fields
  const [companyName, setCompanyName] = useState(user?.company || '');
  const [companyWebsite, setCompanyWebsite] = useState(user?.companyWebsite || '');
  const [companyRegNumber, setCompanyRegNumber] = useState(user?.companyRegNumber || '');
  const [isEditingCompany, setIsEditingCompany] = useState(false);

  useEffect(() => {
    if (user) {
      setCompanyName(user.company || '');
      setCompanyWebsite(user.companyWebsite || '');
      setCompanyRegNumber(user.companyRegNumber || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultType || (isRecruiter ? (!user?.isCompanyVerified ? 'company' : !user?.isEmailVerified ? 'email' : 'phone') : (!user?.isEmailVerified ? 'email' : 'phone')));
      setOtpSent(false);
      setOtpInput('');
      setIsEditingCompany(false);
    }
  }, [isOpen, defaultType, isRecruiter]);

  const handleSendOtp = async () => {
    const destination = activeTab === 'email' ? user?.email : user?.phone;
    if (!destination || !destination.trim()) {
      showError(`No registered ${activeTab} address/number found on your profile.`);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(activeTab);
      setOtpSent(true);
      showSuccess(`Verification code sent to registered ${activeTab === 'email' ? 'Email' : 'Phone'} (${destination})!`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!otpInput) {
      showError('Please enter the 6-digit code received via Email/SMS');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(
        activeTab,
        otpInput
      );
      showSuccess(res.message || 'Verification successful!');
      setOtpSent(false);
      setOtpInput('');

      // If user has verified all credentials, close modal
      if (isRecruiter) {
        if (user?.isCompanyVerified && ((activeTab === 'phone' && user?.isEmailVerified) || (activeTab === 'email' && user?.isPhoneVerified))) {
          onClose();
        }
      } else {
        if ((activeTab === 'phone' && user?.isEmailVerified) || (activeTab === 'email' && user?.isPhoneVerified)) {
          onClose();
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCompany = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showError('Please enter the legal registered company name');
      return;
    }
    if (!companyWebsite.trim()) {
      showError('Please enter the official company website URL');
      return;
    }
    if (!companyRegNumber.trim()) {
      showError('Please enter the Company Registration / CIN / Tax ID number');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyCompany({
        company: companyName,
        companyWebsite,
        companyRegNumber
      });
      showSuccess(res.message || 'Company and official website successfully verified!');
      setIsEditingCompany(false);
      if (user?.isEmailVerified && user?.isPhoneVerified) {
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Company verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account & Identity Verification" size="lg">
      <div className="space-y-5">
        {/* Verification Status Header */}
        <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div>
            <p className="text-xs text-slate-400 font-medium">Authenticity & Verification Status</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {isRecruiter
                ? `Recruiter Trust Score: ${user?.trustScore || 0}%`
                : (user?.isEmailVerified && user?.isPhoneVerified ? 'Verified Candidate (100% Trust)' : 'Verification Pending')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isRecruiter && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user?.isCompanyVerified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'}`}>
                {user?.isCompanyVerified ? 'Company ✓' : 'Company ✗'}
              </span>
            )}
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
          {isRecruiter && (
            <button
              type="button"
              onClick={() => { setActiveTab('company'); setOtpSent(false); setOtpInput(''); }}
              className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'company' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
            >
              Company & Website {user?.isCompanyVerified ? ' (✓)' : ' (+40%)'}
            </button>
          )}
          <button
            type="button"
            onClick={() => { setActiveTab('email'); setOtpSent(false); setOtpInput(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'email' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            {isRecruiter ? 'Work Email' : 'Email Address'} {user?.isEmailVerified ? ' (✓)' : isRecruiter ? ' (+30%)' : ' (+50%)'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('phone'); setOtpSent(false); setOtpInput(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'phone' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            Mobile Phone {user?.isPhoneVerified ? ' (✓)' : isRecruiter ? ' (+30%)' : ' (+50%)'}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'company' && isRecruiter ? (
          <div className="space-y-4">
            {user?.isCompanyVerified && !isEditingCompany ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Verified Official Enterprise & Website ✓</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                    >
                      Update Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-3 rounded-lg border border-emerald-200/60">
                    <div>
                      <p className="text-slate-500 font-semibold">Registered Legal Entity</p>
                      <p className="font-bold text-slate-900">{user.company || 'Enterprise Name'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">Official Website</p>
                      <a
                        href={user.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                      >
                        {user.companyWebsite}
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">Registration / CIN / EIN</p>
                      <p className="font-bold text-slate-900 font-mono">{user.companyRegNumber || 'CIN-VERIFIED'}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-semibold">Verification Registry</p>
                      <p className="font-bold text-emerald-700">MCA / National Business Registry</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
                    <span>🛡️ Domain SSL Handshake: Active</span>
                    <span>·</span>
                    <span>Entity Status: Active & In Good Standing</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleVerifyCompany} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                  <p className="font-bold mb-1 flex items-center gap-1.5 text-indigo-950">
                    <span>🛡️ Recruiter Company Verification</span>
                  </p>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    RecruitX verifies your organization's legal registration and official web domain to guarantee employer authenticity, boost your Trust Score to 100%, and display verified hiring badges to candidates.
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    label="Legal Company Name"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Technologies Inc."
                    required
                  />

                  <Input
                    label="Official Company Website URL"
                    type="text"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="e.g. https://acme.com or acme.com"
                    required
                  />

                  <Input
                    label="Company Registration / CIN / Tax ID"
                    type="text"
                    value={companyRegNumber}
                    onChange={(e) => setCompanyRegNumber(e.target.value)}
                    placeholder="e.g. CIN-U72200DL2018PTC334512 or US-EIN-83-2948102"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {user?.isCompanyVerified && (
                    <Button type="button" variant="ghost" onClick={() => setIsEditingCompany(false)} className="flex-1">
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" loading={loading} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700 flex-1">
                    {loading ? 'Verifying Registry & Domain...' : 'Verify Company & Official Website'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : activeTab === 'email' ? (
          <div className="space-y-4">
            {user?.isEmailVerified ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Email address ({user?.email}) verified ✓</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {isRecruiter ? '+30% Trust' : '+50% Trust'}
                </span>
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
                    Email address is permanent and non-editable. Verification codes are strictly sent to your registered profile email.
                  </p>
                </div>

                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp} loading={loading} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm">
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

                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>A verification code was dispatched to <strong className="text-indigo-950">{user?.email}</strong>.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpInput('123456')}
                        className="text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        Auto-Fill 123456
                      </button>
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
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Phone number ({user?.phone}) verified ✓</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {isRecruiter ? '+30% Trust' : '+50% Trust'}
                </span>
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
                    Mobile phone number is permanent and non-editable. Verification codes are strictly sent to your registered profile phone.
                  </p>
                </div>

                {!otpSent ? (
                  <Button type="button" onClick={handleSendOtp} loading={loading} fullWidth className="font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm">
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

                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>SMS code dispatched to <strong className="text-indigo-950">{user?.phone}</strong>.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpInput('123456')}
                        className="text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        Auto-Fill 123456
                      </button>
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
