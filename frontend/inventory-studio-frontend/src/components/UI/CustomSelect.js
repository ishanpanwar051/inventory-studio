import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select an option",
  className = "",
  icon: Icon,
  name,
  onFocus
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  const handleSelect = (option) => {
    // Mimic the native event structure for easy integration
    onChange({ target: { value: option.value, name: name } });
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onFocus={onFocus}
        className={`w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-slate-700'} rounded-xl text-sm font-medium transition-all shadow-sm focus:outline-none`}
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-slate-400 shrink-0" />}
          <span className={selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  String(option.value) === String(value)
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && <option.icon className="h-4 w-4 opacity-70" />}
                  <span className="truncate">{option.label}</span>
                </div>
                {String(option.value) === String(value) && (
                  <Check className="h-4 w-4 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
