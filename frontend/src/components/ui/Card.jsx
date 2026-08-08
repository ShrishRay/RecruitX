/**
 * Premium container card with handcrafted shadow system and smooth hover transition.
 */
export default function Card({ children, className = '', hover = true, padding = true, onClick, glass = false }) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl border transition-all duration-200
        ${glass 
          ? 'bg-white/80 backdrop-blur-md border-white/40 shadow-xs' 
          : 'bg-white border-slate-200/90 shadow-xs'
        }
        ${padding ? 'p-5 sm:p-6' : ''}
        ${hover ? 'hover:border-slate-300 hover:shadow-md hover:-translate-y-[1px]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
