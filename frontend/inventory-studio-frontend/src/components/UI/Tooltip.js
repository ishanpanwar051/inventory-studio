import React, { useState } from 'react';

const Tooltip = ({ text, children, position = 'top' }) => {
  const [show, setShow] = useState(false);
  
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-800 dark:border-t-slate-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4 border-b-slate-800 dark:border-b-slate-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-l-4 border-l-slate-800 dark:border-l-slate-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-800 dark:border-r-slate-700',
  };

  return (
    <div className="relative inline-flex items-center group">
      <div 
        onMouseEnter={() => setShow(true)} 
        onMouseLeave={() => setShow(false)}
        className="cursor-help flex items-center"
      >
        {children}
      </div>
      {show && (
        <div className={`absolute ${positionClasses[position]} z-[100] w-max max-w-[250px] px-3 py-2 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 rounded-lg shadow-xl pointer-events-none animate-fadeIn`} style={{animationDuration: '0.2s'}}>
          {text}
          <div className={`absolute ${arrowClasses[position]} w-0 h-0`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
