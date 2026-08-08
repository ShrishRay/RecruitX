import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Button from '../components/ui/Button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider border border-indigo-200/80 mb-8 animate-slide-up shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
            RecruitX Talent Platform 2.0
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 animate-slide-up">
            Precision hiring powered by <span className="text-brand-gradient">intelligent matching</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium mb-10 animate-slide-up">
            RecruitX scores and ranks applicants based on skills, experience, and project data so candidates land top jobs and recruiters hire 3× faster.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/signup?role=candidate" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-extrabold shadow-lg shadow-indigo-600/25 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl transition-all">
                Find Your Next Job
              </Button>
            </Link>
            <Link to="/signup?role=recruiter" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 py-4 text-base font-extrabold border-2 border-slate-200 hover:border-slate-300 rounded-xl">
                Post a Job & Hire
              </Button>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16 mt-16 border-t border-slate-100 animate-slide-up">
            <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-50/50 to-white border border-indigo-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">10,000+</p>
              <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider mt-1">Candidates Matched</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-50/50 to-white border border-emerald-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">95%</p>
              <p className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider mt-1">Match Accuracy</p>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-b from-purple-50/50 to-white border border-purple-100/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">3× Faster</p>
              <p className="text-xs font-extrabold text-purple-600 uppercase tracking-wider mt-1">Time to Hire</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-100">
              Streamlined Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-4">
              How the RecruitX algorithm works
            </h2>
            <p className="text-base text-slate-600 mt-3 font-medium">
              Eliminate guesswork with weighted skill coverage, experience mapping, and context matching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Structured Candidate Profile',
                desc: 'Candidates list verified skills, project history, and experience details in a standard format.',
                iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
              },
              {
                step: '02',
                title: 'Weighted Match Scoring',
                desc: 'Our scoring engine computes skill coverage (70%), experience alignment (20%), and keyword relevance (10%).',
                iconBg: 'bg-violet-50 text-violet-600 border-violet-200',
              },
              {
                step: '03',
                title: 'Ranked Recruiter Pipeline',
                desc: 'Recruiters get a ranked leaderboard of candidates automatically sorted by compatibility.',
                iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
              },
            ].map((card) => (
              <div key={card.step} className="p-7 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-lg transition-all duration-200 flex flex-col group">
                <div className={`w-12 h-12 rounded-xl border ${card.iconBg} flex items-center justify-center font-black text-lg mb-5 group-hover:scale-110 transition-transform`}>
                  {card.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium flex-1">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY ─────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            Connecting candidates with leading engineering teams
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-70">
            {['TechCorp', 'Innovate.io', 'DataFlow AI', 'CloudWorks', 'Digital Ventures'].map((co) => (
              <span key={co} className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight hover:text-indigo-600 transition-colors cursor-pointer">
                {co}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white mt-auto relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Ready to experience intelligent hiring?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 font-medium mb-8">
            Create your account today and unlock instant candidate matching on RecruitX.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold px-9 py-4 text-base shadow-xl rounded-xl">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="py-6 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} RecruitX. All rights reserved.</p>
          <p className="font-semibold text-slate-300">RecruitX Intelligent Hiring System</p>
        </div>
      </footer>
    </div>
  );
}
