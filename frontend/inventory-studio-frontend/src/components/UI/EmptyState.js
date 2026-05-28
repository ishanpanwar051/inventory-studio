import React from 'react';
import { Package, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getTranslation } from '../../utils/translations';

const EmptyState = ({ 
  icon: Icon = Package, 
  title, 
  description,
  buttonText,
  onAction 
}) => {
  const { state } = useApp();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 min-h-[350px]">
      <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[24px] rotate-[-5deg] hover:rotate-0 transition-transform duration-300 flex items-center justify-center mb-6 shadow-sm ring-4 ring-white dark:ring-slate-900">
        <Icon className="h-10 w-10 drop-shadow-sm" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
        {title || getTranslation('noDataFound', state.currentLanguage)}
      </h3>
      <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        {description || 'Get started by creating your first entry. It only takes a few seconds.'}
      </p>
      
      {buttonText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95"
        >
          <Plus className="h-5 w-5" strokeWidth={2.5} />
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
