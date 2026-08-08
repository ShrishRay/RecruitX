/**
 * Progress bar component with match threshold color indicators.
 */
export default function ProgressBar({ value = 0, showLabel = true, size = 'md', className = '' }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const getColor = (val) => {
    if (val >= 75) return { bar: 'bg-gradient-to-r from-emerald-500 to-teal-500', text: 'text-emerald-700' };
    if (val >= 50) return { bar: 'bg-gradient-to-r from-indigo-600 to-violet-600', text: 'text-indigo-700' };
    if (val >= 30) return { bar: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-amber-700' };
    return { bar: 'bg-gradient-to-r from-rose-500 to-pink-500', text: 'text-rose-700' };
  };

  const colors = getColor(clampedValue);
  const heights = { sm: 'h-1.5', md: 'h-2', lg: 'h-2.5' };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`flex-1 ${heights[size]} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${heights[size]} ${colors.bar} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-bold tabular-nums min-w-[2.5rem] text-right ${colors.text}`}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
}
