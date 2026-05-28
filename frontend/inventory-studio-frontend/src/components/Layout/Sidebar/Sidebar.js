import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useApp, ActionTypes, isPlanExpired } from '../../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  Truck,
  BarChart3,
  TrendingUp,
  Crown,
  Settings,
  X,
  Warehouse,
  Wallet,
  IndianRupee,
  CreditCard,
  Lock,
  History,
  RotateCcw,
  Share2,
  Palette,
  FileText,
  BoxSelect,
  Zap,
  Store,
  PlayCircle,
  Target
} from 'lucide-react';
import { getTranslation } from '../../../utils/translations';
import { isModuleUnlocked, getUpgradeMessage, FREE_MODE } from '../../../utils/planUtils';
import { getPathForView } from '../../../utils/navigation';
import { useNavigate } from 'react-router-dom';

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

const Sidebar = React.memo(({ onClose, isMinimized = false }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  // Force re-render when plan details change
  const [planDetailsKey, setPlanDetailsKey] = useState(0);

  // Force re-render when plan details change
  useEffect(() => {
    // Force component update by changing a local state
    setPlanDetailsKey(prev => prev + 1);
  }, [state.currentPlan, state.currentPlanDetails?.unlockedModules, state.isSubscriptionActive]);
  const subscriptionExpiryDate = useMemo(() => getSubscriptionExpiryDate(state), [state]);
  const subscriptionStatus = useMemo(() =>
    typeof state.subscription?.status === 'string'
      ? state.subscription.status.toLowerCase()
      : null,
    [state.subscription?.status]
  );
  const planExpired = useMemo(() => isPlanExpired(state), [state]);

  /* FILTER PENDING ORDERS
     * Only count orders that originate from 'online' and have status 'Pending'
     */
  const pendingOrdersCount = useMemo(() => {
    if (!state.orders || !Array.isArray(state.orders)) return 0;
    return state.orders.filter(order =>
      (order.orderSource === 'online' || order.source === 'online') &&
      order.orderStatus === 'Pending'
    ).length;
  }, [state.orders]);

  const planExpiredMessage = 'Your subscription has expired. Upgrade your plan to continue.';
  // Settings, dashboard, and upgrade are always unlocked for all users, regardless of plan status
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 1280 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1280);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const footerHrefs = ['dashboard', 'products', 'billing', 'salesOrderHistory', 'customers'];

  /* Navigation Groups for better organization */
  const navGroups = useMemo(() => {
    const groups = [
      {
        title: 'Operations',
        items: [
          { name: 'dashboard', href: 'dashboard', icon: LayoutDashboard },
          ...(FREE_MODE ? [] : [{ name: 'billing', href: 'billing', icon: CreditCard }]),
          { name: 'products', href: 'products', icon: Package },
          { name: 'salesOrderHistory', href: 'salesOrderHistory', icon: History },
        ]
      },
      {
        title: 'Sales & CRM',
        items: [
          { name: 'customers', href: 'customers', icon: Users },
          { name: 'onlineStore', href: 'onlineStore', icon: Store, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
          { name: 'refunds', href: 'refunds', icon: RotateCcw },
        ]
      },
      {
        title: 'Inventory Control',
        items: [
          { name: 'purchaseOrders', href: 'purchase', icon: Truck },
          { name: 'suppliers', href: 'suppliers', icon: Warehouse },
          { name: 'dProducts', href: 'dProducts', icon: Zap },
        ]
      },
      {
        title: 'Insights & Growth',
        items: [
          { name: 'productPerformance', href: 'productPerformance', icon: TrendingUp },
          { name: 'salesTarget', href: 'salesTarget', icon: Target },
        ]
      }
    ];

    if (isMobile) {
      return groups.map(group => ({
        ...group,
        items: group.items.filter(item => !footerHrefs.includes(item.href))
      })).filter(group => group.items.length > 0);
    }
    return groups;
  }, [pendingOrdersCount, isMobile]);

  const bottomNavItems = useMemo(() => [
    { name: 'tutorials', href: 'tutorials', icon: PlayCircle },
    { name: 'settings', href: 'settings', icon: Settings },
    ...(FREE_MODE ? [] : [{ name: 'upgradePlan', href: 'upgrade', icon: Crown, highlight: true }]),
  ], []);

  const navigation = useMemo(() =>
    [...navGroups.flatMap(group => group.items), ...bottomNavItems],
    [navGroups, bottomNavItems]);

  const handleNavigation = useCallback((view) => {
    // Check if the item is disabled first
    const item = navigation.find(n => n.href === view);
    if (item?.disabled) return;

    // Strict Lock Check: Check if this module is unlocked
    // We skip this check for 'upgrade' page itself to ensure user can always upgrade
    if (item && item.href !== 'upgrade') {
      const isUnlocked = isModuleUnlocked(item.name, state.currentPlan, state.currentPlanDetails);
      if (!isUnlocked) {
        if (window.showToast) {
          window.showToast(getUpgradeMessage(item.name, state.currentPlan) || 'Please upgrade your plan to access this feature', 'warning');
        }
        return; // BLOCK NAVIGATION
      }
    }

    const path = getPathForView(view);
    dispatch({ type: ActionTypes.SET_CURRENT_VIEW, payload: view });
    navigate(path);
    if (onClose) onClose();
  }, [state.currentPlanDetails, state.currentPlan, dispatch, navigate, onClose, navigation]);

  // Preload critical images on component mount
  useEffect(() => {
    const { preloadCriticalImages } = require('../../../utils/imageOptimization');
    preloadCriticalImages();
  }, []);

  const getNavButtonClass = useCallback((isActive, isUnlocked, isUpgrade, highlight) => {
    const baseClasses = `group relative flex w-full items-center ${isMinimized ? 'justify-center px-0' : 'gap-3.5 px-4'} rounded-xl py-3 text-[14px] font-semibold transition-all duration-300 overflow-hidden outline-none`;

    if (!isUnlocked) {
      return `${baseClasses} text-slate-400 dark:text-slate-500 cursor-not-allowed grayscale opacity-60`;
    }

    if (isActive) {
      return `${baseClasses} bg-blue-50/60 dark:bg-blue-900/20 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-blue-200/50 dark:border-blue-800/50`;
    }

    if (highlight) {
      return `${baseClasses} bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50 border hover:shadow-lg hover:shadow-amber-500/10 mb-2 mt-4`;
    }

    return `${baseClasses} text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white hover:translate-x-1`;
  }, [isMinimized]);

  const getIconClass = useCallback((isActive, isUnlocked, highlight) => {
    if (!isUnlocked) return 'h-5 w-5 text-slate-400 dark:text-slate-500 flex-shrink-0';
    if (isActive) return 'h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 transition-transform duration-300 scale-110 drop-shadow-sm';
    if (highlight) return 'h-5 w-5 text-amber-500 dark:text-amber-400 flex-shrink-0 animate-pulse-subtle';
    return 'h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 flex-shrink-0 transition-transform duration-300 group-hover:scale-110';
  }, []);

  const logoSrc = useMemo(() => `${process.env.PUBLIC_URL || ''}/assets/inventory-studio-logo-removebg.png`, []);
  const fallbackLogoSrc = useMemo(() => `${process.env.PUBLIC_URL || ''}/assets/inventory-studio-logo.png`, []);

  const handleLogoError = useCallback((e) => {
    e.currentTarget.src = fallbackLogoSrc;
  }, [fallbackLogoSrc]);

  const renderNavItem = useCallback((item) => {
    const Icon = item.icon;
    const isActive = state.currentView === item.href;
    const isUpgradePage = item.href === 'upgrade';
    const finalIsUnlocked = isModuleUnlocked(item.name, state.currentPlan, state.currentPlanDetails);

    const buttonTitle = isMinimized
      ? getTranslation(item.name, state.currentLanguage)
      : (!finalIsUnlocked ? getUpgradeMessage(item.name, state.currentPlan) : undefined);

    return (
      <li key={item.name} className={`${isMinimized ? 'px-0' : 'px-3'}`}>
        <button
          onClick={() => handleNavigation(item.href)}
          className={getNavButtonClass(isActive, finalIsUnlocked && !item.disabled, isUpgradePage, item.highlight)}
          title={item.disabled ? getTranslation('comingSoon', state.currentLanguage) : buttonTitle}
          disabled={!finalIsUnlocked || item.disabled}
        >
          <div className={`relative z-10 p-1.5 rounded-lg transition-colors duration-300 flex items-center justify-center ${isActive ? 'bg-white/80 dark:bg-slate-800 ring-1 ring-black/5 dark:ring-white/10 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
            <Icon className={getIconClass(isActive, finalIsUnlocked, item.highlight)} />
            {isMinimized && item.badge && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {item.badge}
              </span>
            )}
          </div>

          {!isMinimized && (
            <>
              <span className={`truncate capitalize flex-1 text-left font-semibold tracking-tight transition-colors duration-300 ${isActive ? 'text-blue-800 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                {getTranslation(item.name, state.currentLanguage)}
              </span>

              {!finalIsUnlocked && (
                <div className="h-6 w-6 flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800/50">
                  <Lock className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                </div>
              )}

              {item.highlight && (
                <div className="h-6 w-6 flex items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                </div>
              )}

              {item.badge && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-lg bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
                  {item.badge}
                </span>
              )}

              {item.disabled && (
                <span className="px-1.5 py-0.5 text-[8px] font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded shadow-sm tracking-tighter">
                  COMING SOON
                </span>
              )}
            </>
          )}
        </button>
      </li>
    );
  }, [state.currentView, state.currentPlan, state.currentPlanDetails, state.currentLanguage, isMinimized, getNavButtonClass, getIconClass, handleNavigation]);

  return (
    <div className={`dark-sidebar flex h-full flex-col transition-all duration-300 ${isMinimized ? 'items-center' : ''}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className={`flex items-center ${isMinimized ? 'justify-center px-2' : 'justify-between px-5'} h-24 flex-shrink-0 border-b border-slate-200/50 dark:border-slate-700/50 transition-all duration-300`}>
        <div className={`flex items-center ${isMinimized ? 'justify-center' : 'gap-3'} relative`}>
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 flex items-center justify-center overflow-hidden transition-all duration-300">
              <img
                src={logoSrc}
                alt="Chitrgupt"
                className="h-full w-full object-contain"
                onError={handleLogoError}
              />
            </div>
          </div>
          {!isMinimized && (
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400 leading-none mb-1.5">Easy Kit</span>
              <h1 className="truncate text-base font-extrabold text-slate-800 dark:text-white tracking-tight">Chitrgupt</h1>
            </div>
          )}
        </div>
        {!isMinimized && onClose && (
          <button
            onClick={onClose}
            className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden min-h-0 w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        <nav className={`pb-6 pt-2 ${isMinimized ? 'px-2' : ''}`}>
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} className={groupIdx > 0 ? 'mt-6' : ''}>
              {!isMinimized && (
                <div className="px-5 mb-2.5 flex items-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400/80 dark:text-slate-500">
                    {group.title}
                  </p>
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map(renderNavItem)}
              </ul>
            </div>
          ))}

          <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
            {!isMinimized && (
              <div className="px-5 mb-2.5 flex items-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400/80 dark:text-slate-500">
                  System
                </p>
              </div>
            )}
            <ul className="space-y-1">
              {bottomNavItems.map((item) => (
                <React.Fragment key={item.name}>
                  {renderNavItem(item)}
                </React.Fragment>
              ))}
            </ul>
          </div>
        </nav>
      </div>

    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
