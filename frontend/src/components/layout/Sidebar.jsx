import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const candidateLinks = [
  { to: '/candidate/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/candidate/profile', label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/candidate/jobs', label: 'Browse Jobs', icon: 'M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
];

const recruiterLinks = [
  { to: '/recruiter/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/recruiter/post-job', label: 'Post a Job', icon: 'M12 4v16m8-8H4' },
];

export default function Sidebar({ onClose }) {
  const { user } = useAuth();
  const links = user?.role === 'recruiter' ? recruiterLinks : candidateLinks;

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-64 select-none">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Main Menu
        </p>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150
              ${isActive 
                ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-xs' 
                : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <svg className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate leading-none">{user?.name}</p>
            <p className="text-[11px] font-medium text-slate-500 capitalize mt-0.5 truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
