import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, ActionTypes } from '../../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  FilePlus,
  Package,
  Warehouse,
  Truck,
  Wallet,
  BarChart3,
  Crown,
  History,
  RotateCcw,
  Store
} from 'lucide-react';
import { isModuleUnlocked, getUpgradeMessage } from '../../../utils/planUtils';
import { getPathForView } from '../../../utils/navigation';

const parseExpiryDate = (rawValue) => {
  if (!rawValue) return null;
  const parsedDate = new Date(rawValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getSubscriptionExpiryDate = (state) => {
  if (!state) return null;
  const rawValue =
    state.subscription?.expiresAt ||
    state.subscription?.expiryDate ||
    state.subscription?.endDate ||
    state.currentPlanDetails?.expiresAt ||
    state.currentPlanDetails?.expiryDate ||
    state.currentPlanDetails?.endDate ||
    null;
  return parseExpiryDate(rawValue);
};

const MobileNavigation = ({ isVisible = true }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Home', href: 'dashboard', icon: LayoutDashboard },
    { name: 'Inventory', href: 'products', icon: Package },
    { name: 'Billing', href: 'billing', icon: FilePlus, isAction: true },
    { name: 'History', href: 'salesOrderHistory', icon: History },
    { name: 'Customers', href: 'customers', icon: Users },
  ];

  const handleNavigation = (view) => {
    // Check plan unlocks for non-basic views
    if (view !== 'dashboard' && !isModuleUnlocked(view, state.currentPlan, state.currentPlanDetails)) {
      if (window.showToast) window.showToast(getUpgradeMessage(view, state.currentPlan), 'warning');
      return;
    }

    dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
    navigate(getPathForView(view));
  };

  return (
    <div className={`xl:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-[100] shadow-[0_-8px_30px_rgb(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : 'translate-y-[150%]'
    }`}>
      <div className="flex justify-around items-center h-16 sm:h-20 px-2 max-w-md mx-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = state.currentView === item.href;
          
          if (item.isAction) {
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="relative -top-3 flex flex-col items-center"
              >
                <div className={`flex items-center justify-center h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 scale-110' 
                    : 'bg-sky-500 text-white hover:bg-sky-600'
                }`}>
                  <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold mt-1 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                  {item.name}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-0 transition-all duration-200 ${
                isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-medium mt-1 truncate w-full text-center transition-all ${
                isActive ? 'opacity-100 font-bold' : 'opacity-70'
              }`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;
