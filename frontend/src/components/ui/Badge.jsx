/**
 * Status badge component with dot indicators and clear semantic styling.
 */
const variants = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200/80',
  shortlisted: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200/80',
  default: 'bg-slate-50 text-slate-700 border-slate-200/80',
  purple: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
};

const dots = {
  applied: 'bg-blue-500',
  shortlisted: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  default: 'bg-slate-400',
  purple: 'bg-indigo-500',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  const v = variants[variant] ? variant : 'default';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1
        text-xs font-semibold rounded-md border
        ${variants[v]}
        ${className}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dots[v]}`} />
      <span>{children}</span>
    </span>
  );
}
