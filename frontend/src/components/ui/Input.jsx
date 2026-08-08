/**
 * Styled input component with label, error state, helper text, and optional icon.
 */
export default function Input({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-800"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={!!error}
          className={`
            w-full px-3.5 py-2.5 text-sm font-medium text-slate-900
            bg-white border rounded-xl shadow-xs
            placeholder:text-slate-400 placeholder:font-normal
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'}
          `}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-600 flex items-center gap-1.5 font-medium mt-1">
          <svg className="h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
