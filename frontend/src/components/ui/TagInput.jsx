import { useState } from 'react';

/**
 * Tag input component with add/remove chip UI.
 */
export default function TagInput({ label, tags = [], onChange, placeholder = 'Type skill and press Enter...', error, className = '' }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Capitalize each word nicely
    const formatted = trimmed
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (formatted && !tags.some(t => t.toLowerCase() === formatted.toLowerCase())) {
      onChange([...tags, formatted]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
      setInputValue('');
    }
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, i) => i !== indexToRemove));
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
      )}
      <div
        className={`
          flex flex-wrap items-center gap-1.5 p-2 min-h-[42px]
          bg-white border rounded-xl shadow-xs
          transition-all duration-150
          focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600
          ${error ? 'border-rose-300' : 'border-slate-200 hover:border-slate-300'}
        `}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80 animate-scale-in"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-indigo-400 hover:text-indigo-900 transition-colors cursor-pointer p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
              setInputValue('');
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] text-sm outline-none placeholder:text-slate-400 bg-transparent px-1 font-medium text-slate-900"
        />
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
