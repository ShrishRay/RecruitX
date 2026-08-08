import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} showMenuButton />

      <div className="flex flex-1 relative max-w-7xl w-full mx-auto">
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)} 
            aria-hidden="true"
          />
        )}

        {/* Sidebar Container */}
        <aside className={`
          fixed lg:sticky top-[64px] left-0 z-40 shrink-0
          h-[calc(100vh-64px)]
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
