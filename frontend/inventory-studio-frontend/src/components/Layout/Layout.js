import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useApp, ActionTypes } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils/api';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';
import MobileNavigation from './MobileNavigation/MobileNavigation';
import { usePWAInstall } from '../../hooks/usePWAInstall';

import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';
import { useLocation } from 'react-router-dom';
import { auth } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import { getTranslation } from '../../utils/translations';
import { AlertTriangle, Database, AlertCircle, Info } from 'lucide-react';

const Layout = React.memo(({ children }) => {
  const { state, dispatch, logoutWithDataProtection } = useApp();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unsyncedDataInfo, setUnsyncedDataInfo] = useState(null);
  const [isCheckingSync, setIsCheckingSync] = useState(false);
  const planBootstrapState = state.planBootstrap || {};
  const shouldShowPlanLoader = planBootstrapState.isActive && !planBootstrapState.hasCompleted;
  const [isPlanLoaderVisible, setIsPlanLoaderVisible] = useState(shouldShowPlanLoader);
  // Set sidebar off by default per user request ("remove slidebar and show options on dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Keyboard shortcut: Shift + S to toggle sidebar
  useKeyboardShortcut('s', false, true, () => {
    setSidebarOpen(prevState => {
      const newState = !prevState;

      // Show toast
      if (window.showToast) {
        window.showToast(newState ? 'Sidebar opened' : 'Sidebar closed', 'info', 1500);
      }

      return newState;
    });
  }, [sidebarOpen]); // Add sidebarOpen as dependency

  // Responsive behavior handled via CSS or manual toggle now
  useEffect(() => {
    // We only track mobile view for UI adjustments, not sidebar state anymore
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mobile detection for responsive toasts
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const { prompt, isInstallable, isInstalled, install } = usePWAInstall();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasDismissedInstallPrompt, setHasDismissedInstallPrompt] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return sessionStorage.getItem('pwa-install-dismissed') === 'true';
  });
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768; // md breakpoint
  });

  const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);

  useEffect(() => {
    if (shouldShowPlanLoader) {
      setIsPlanLoaderVisible(true);
      return;
    }
    if (!isPlanLoaderVisible) return;
    const timeout = setTimeout(() => setIsPlanLoaderVisible(false), 400);
    return () => clearTimeout(timeout);
  }, [shouldShowPlanLoader, isPlanLoaderVisible]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('pwa-install-dismissed', hasDismissedInstallPrompt ? 'true' : 'false');
  }, [hasDismissedInstallPrompt]);

  useEffect(() => {
    if (isInstallable && !isInstalled && !hasDismissedInstallPrompt) {
      const timer = setTimeout(() => setShowInstallPrompt(true), 800);
      return () => clearTimeout(timer);
    }
    setShowInstallPrompt(false);
  }, [isInstallable, isInstalled, hasDismissedInstallPrompt]);



  const showToast = useCallback((message, type = 'info', duration) => {
    // Set default duration based on type
    if (!duration) {
      switch (type) {
        case 'error':
          duration = 6000; // Errors should be visible longer
          break;
        case 'warning':
          duration = 5000;
          break;
        case 'success':
          duration = 3500; // Success messages can be shorter
          break;
        default:
          duration = 4000;
      }
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type, duration, createdAt: id };

    // persistent Audio ref used below
    const { playNotificationSound, playWebAudioBeep } = require('../../utils/audioUtils');
    if (type === 'success') {
      playNotificationSound();
    } else if (type === 'error') {
      playWebAudioBeep(300, 0.4, 0.5); // Low frequency "error" beep
    } else if (type === 'warning') {
      playWebAudioBeep(500, 0.3, 0.4); // Mid frequency "warning" beep
    } else {
      // info or others
      playWebAudioBeep(1000, 0.1, 0.1); // High frequency short "info" pip
    }

    setToasts(prev => {
      // Clear timeouts for ALL existing toasts since we are replacing them
      prev.forEach(t => {
        if (t.timeoutId) clearTimeout(t.timeoutId);
      });

      // Replace everything with just the new toast (Single toast mode)
      return [newToast];
    });

    // Auto-remove after duration - trigger dismissal animation first
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, duration);

    // Update the toast with its timeout ID for cleanup
    setToasts(prev => prev.map(toast =>
      toast.id === id ? { ...toast, timeoutId } : toast
    ));
  }, []);

  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const lastScrollTop = useRef(0);
  const mainRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    const currentScrollTop = mainRef.current.scrollTop;
    
    if (currentScrollTop < 100) {
      // User is near the top -> Show footer
      setIsFooterVisible(true);
    } else if (Math.abs(currentScrollTop - lastScrollTop.current) > 10) {
      // User is scrolling (any direction) and not at top -> Hide footer
      setIsFooterVisible(false);
    }
    lastScrollTop.current = currentScrollTop;
  }, []);

  useEffect(() => {
    window.showToast = showToast;
  }, []);

  const removeToast = useCallback((id) => {
    // First trigger dismissal animation
    setToasts(prev => prev.map(toast => {
      if (toast.id === id) {
        return { ...toast, isDismissing: true };
      }
      return toast;
    }));

    // Then remove after animation completes
    setTimeout(() => {
      setToasts(prev => prev.map(toast => {
        if (toast.id === id && toast.timeoutId) {
          clearTimeout(toast.timeoutId);
        }
        return toast;
      }).filter(toast => toast.id !== id));
    }, 300);
  }, []);

  // Enhanced toast with pause-on-hover and mobile-style slide animations
  const ToastItem = React.memo(({ toast, onRemove, isMobile }) => {
    const [isPaused, setIsPaused] = useState(false);
    const [remainingTime, setRemainingTime] = useState(toast.duration);

    // Swipe state
    const [touchStart, setTouchStart] = useState(null);
    const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const isDismissing = toast.isDismissing || false;
    const startTimeRef = useRef(Date.now());
    const totalPausedTimeRef = useRef(0);
    const lastPauseStartRef = useRef(null);
    const timerRef = useRef(null);

    // Calculate progress bar width
    const progressWidth = Math.max(0, (remainingTime / toast.duration) * 100);

    useEffect(() => {
      // If paused or dragging, we don't tick.
      if (isPaused || isDragging) {
        if (!lastPauseStartRef.current) {
          lastPauseStartRef.current = Date.now();
        }
        if (timerRef.current) clearTimeout(timerRef.current);
        return;
      }

      // If we were paused, add that duration to totalPausedTime
      if (lastPauseStartRef.current) {
        totalPausedTimeRef.current += (Date.now() - lastPauseStartRef.current);
        lastPauseStartRef.current = null;
      }

      const updateTimer = () => {
        const now = Date.now();
        const activeDuration = now - startTimeRef.current - totalPausedTimeRef.current;
        const remaining = Math.max(0, toast.duration - activeDuration);

        // Avoid unnecessary updates if already 0
        if (remainingTime !== remaining) {
          setRemainingTime(remaining);
        }

        if (remaining <= 0) {
          onRemove(toast.id);
        } else {
          timerRef.current = setTimeout(updateTimer, 50);
        }
      };

      // Start the timer
      timerRef.current = setTimeout(updateTimer, 50);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [isPaused, isDragging, toast.id, toast.duration, onRemove]); // Removed remainingTime from dep to avoid loop, calculated inside

    const handleMouseEnter = useCallback(() => {
      setIsPaused(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsPaused(false);
    }, []);

    const handleTouchStart = (e) => {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setIsDragging(true);
    };

    const handleTouchMove = (e) => {
      if (!touchStart) return;
      const x = e.touches[0].clientX - touchStart.x;
      // Fix Y to 0 effectively
      setSwipeOffset({ x, y: 0 });
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;

      // Thresholds
      const dismissThreshold = 75; // px

      // Dismiss if swiped Sideways enough
      if (Math.abs(swipeOffset.x) > dismissThreshold) {
        onRemove(toast.id);
        // Keep offset to prevent jump before unmount
      } else {
        setSwipeOffset({ x: 0, y: 0 });
        setIsDragging(false);
      }
      setTouchStart(null);
    };

    const containerStyle = {
      // Only translate X, Y remains 0
      ...(isDragging ? { transform: `translate(${swipeOffset.x}px, 0px)`, transition: 'none' } : {}),
      ...(isMobile ? { touchAction: 'pan-y', userSelect: 'none' } : {}) // Allow vertical scrolling, block horizontal
    };

    return (
      <div
        className={`${isMobile
          ? // Mobile styling: Floating pill, top center, rounded, shadow
          `pointer-events-auto w-full max-w-[360px] mx-auto rounded-2xl border px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl text-sm transform transition-all duration-300 ease-out ${isDismissing ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
          } ${toast.type === 'success'
            ? 'border-emerald-100/50 bg-white/95 dark:bg-black dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            : toast.type === 'error'
              ? 'border-rose-100/50 bg-white/95 dark:bg-black dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
              : toast.type === 'warning'
                ? 'border-amber-100/50 bg-white/95 dark:bg-black dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
                : 'border-slate-100/50 bg-white/95 dark:bg-black dark:border-white/10 text-slate-700 dark:text-slate-300'
          }`
          : // Desktop styling: Floating card, top right
          `pointer-events-auto flex items-end gap-3 rounded-xl border px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl min-w-[300px] max-w-[400px] mb-3 text-sm transform transition-all duration-300 ease-out hover:scale-[1.02] ${isDismissing ? 'translate-x-full opacity-0' : 'translate-y-0 opacity-100'
          } ${toast.type === 'success'
            ? 'border-emerald-100/50 bg-white/80 dark:bg-black dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
            : toast.type === 'error'
              ? 'border-rose-100/50 bg-white/80 dark:bg-black dark:border-rose-500/20 text-rose-800 dark:text-rose-300'
              : toast.type === 'warning'
                ? 'border-amber-100/50 bg-white/80 dark:bg-black dark:border-amber-500/20 text-amber-800 dark:text-amber-300'
                : 'border-slate-100/50 bg-white/80 dark:bg-black dark:border-white/10 text-slate-800 dark:text-slate-300'
          }`
          }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={containerStyle}
      >
        <div className={`flex-1 ${isMobile ? 'flex items-center gap-3' : ''}`}>
          {isMobile ? (
            // Mobile layout: Compact horizontal pill
            <>
              {/* Icon based on type */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                toast.type === 'error' ? 'bg-rose-100 text-rose-600' :
                  toast.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                }`}>
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : toast.type === 'error' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : toast.type === 'warning' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white capitalize truncate">
                  {toast.type || 'Notification'}
                </p>
                <p className="text-sm leading-tight text-gray-600 dark:text-gray-300 truncate mt-0.5">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => onRemove(toast.id)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Dismiss"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </>
          ) : (
            // Desktop layout: Vertical with progress bar
            <>
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                  toast.type === 'error' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                    toast.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                  {toast.type === 'success' ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  ) : toast.type === 'error' ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : toast.type === 'warning' ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm capitalize text-gray-900 dark:text-white">{toast.type || 'Notification'}</p>
                    <button
                      onClick={() => onRemove(toast.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-lg leading-none -mt-1"
                    >
                      &times;
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {toast.message}
                  </p>
                </div>
              </div>

              {/* Minimal Progress Line */}
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-100 dark:bg-slate-700 overflow-hidden rounded-full opacity-50">
                <div
                  className={`h-full transition-all duration-100 ease-linear ${toast.type === 'success' ? 'bg-emerald-500' :
                    toast.type === 'error' ? 'bg-rose-500' :
                      toast.type === 'warning' ? 'bg-amber-500' :
                        'bg-slate-500'
                    }`}
                  style={{ width: `${progressWidth}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  });

  ToastItem.displayName = 'ToastItem';

  const installState = useMemo(() => ({
    prompt,
    isInstallable,
    isInstalled,
    install
  }), [prompt, isInstallable, isInstalled, install]);

  const handleInstallClick = useCallback(async () => {
    if (!install) {
      setHasDismissedInstallPrompt(true);
      setShowInstallPrompt(false);
      return;
    }

    try {
      await install();
    } finally {
      setHasDismissedInstallPrompt(true);
      setShowInstallPrompt(false);
    }
  }, [install]);

  const handleRecheckSession = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      const response = await fetch(`${API_BASE_URL}/auth/check-session`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'x-session-id': auth.currentSessionId || ''
        }
      });
      const data = await response.json();
      if (data.success && data.currentSessionId === state.currentSessionId) {
        dispatch({ type: ActionTypes.SET_READ_ONLY_MODE, payload: false });
        if (window.showToast) window.showToast('Session verified. Write access restored!', 'success');
      } else {
        if (window.showToast) window.showToast('Another device is still active.', 'error');
      }
    } catch (error) {
      if (window.showToast) window.showToast('Connection error. Please try again.', 'error');
    }
  };

  const performLogout = async () => {
    try {
      console.log('🚪 Starting complete logout and cleanup...');
      localStorage.clear();
      try {
        const dbName = 'ERP_DB';
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        await new Promise((resolve, reject) => {
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => resolve();
          deleteRequest.onblocked = () => setTimeout(() => resolve(), 500);
        });
      } catch (dbError) {
        console.error('❌ IndexedDB deletion error:', dbError);
      }

      console.log('🔐 Signing out from Firebase...');
      await signOut(auth);

      console.log('📤 Dispatching logout action...');
      dispatch({ type: ActionTypes.LOGOUT });

      if (window.showToast) {
        window.showToast('Logged out successfully. All local data cleared.', 'info');
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      if (window.showToast) window.showToast('Error logging out', 'error');
    }
  };

  const handleForceLogout = async () => {
    setUnsyncedDataInfo(null);
    await performLogout();
  };

  const handleLogout = async () => {
    setIsCheckingSync(true);
    const result = await logoutWithDataProtection();
    setIsCheckingSync(false);

    if (result.success) {
      setShowReadOnlyModal(false);
      await performLogout();
    } else if (result.hasUnsyncedData) {
      console.warn('⚠️ Logout blocked - Unsynced data detected');
      setUnsyncedDataInfo(result);
      setShowReadOnlyModal(false);
      setShowLogoutModal(false);
    }
  };

  const location = useLocation();
  const isUpgradePage = location.pathname === '/upgrade';
  const isOnlineStorePage = location.pathname === '/online-store';
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  return (
    <div className="flex h-screen text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <nav
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`hidden xl:flex xl:flex-col xl:sticky xl:top-0 xl:h-screen shadow-[0_28px_90px_-55px_rgba(15,23,42,0.55)] transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen
          ? (isSidebarHovered ? 'xl:w-72 opacity-100' : 'xl:w-24 opacity-100') // w-24 gives slightly more room for centering icons than w-20
          : 'xl:w-0 opacity-0'
          }`}
      >
        <Sidebar isMinimized={!isSidebarHovered} />
      </nav>

      <div className={`fixed inset-0 z-[150] xl:hidden transition-all duration-300 ${sidebarOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'}`} style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar Panel */}
        <div className={`relative w-full max-w-xs h-full flex flex-col shadow-[0_28px_80px_-50px_rgba(15,23,42,0.55)] bg-white dark:bg-slate-800 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ height: '100vh' }}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={useCallback(() => setSidebarOpen(prev => !prev), [])} installState={installState} />

        {state.systemStatus === 'offline' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium px-4 py-2.5 text-center flex items-center justify-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top duration-300">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-amber-500 opacity-75 animate-ping"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
            </div>
            <span className="tracking-wide uppercase text-[10px] sm:text-xs">
              Offline Mode · Changes will sync in the background
            </span>
          </div>
        )}

        {state.isReadOnlyMode && (
          <div
            onClick={() => setShowReadOnlyModal(true)}
            className="bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 text-white px-4 py-3 shadow-lg flex items-center justify-center gap-4 animate-in slide-in-from-top duration-500 sticky top-0 z-40 cursor-pointer hover:bg-rose-600 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-sm sm:text-base leading-tight">Read-Only Mode Active</p>
                <p className="text-xs text-white/80 leading-tight mt-0.5">Your account is logged in on another device. Data can be viewed but not modified.</p>
              </div>
            </div>
          </div>
        )}

        <main 
          ref={mainRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth no-scrollbar ${isMobileView ? 'pb-20' : ''} ${isOnlineStorePage ? 'flex flex-col' : ''}`}
        >
          <div className={(isUpgradePage || location.pathname === '/tutorials') ? 'h-full flex flex-col' : (isOnlineStorePage || location.pathname === '/billing' ? "p-0 sm:p-5 sm:pt-4 xl:p-7 xl:pt-5 2xl:p-10 2xl:pt-6" : "p-3 pt-3 sm:p-5 sm:pt-4 xl:p-7 xl:pt-5 2xl:p-10 2xl:pt-6")}>
            {children}
          </div>
        </main>
      </div>

      <MobileNavigation isVisible={isFooterVisible} />


      {isPlanLoaderVisible && (
        <div
          className={`fixed inset-0 z-[70] flex flex-col items-center justify-center transition-opacity duration-500 ease-out ${shouldShowPlanLoader ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
        >
          <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-xl" aria-hidden="true"></div>
          <div className="relative flex flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-white/10 px-10 py-12 shadow-[0_35px_90px_-25px_rgba(15,23,42,0.65)] backdrop-blur-2xl">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl"></div>
              <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-white/25 border-t-white"></div>
            </div>
            <div className="space-y-2 text-center text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Please wait</p>
              <h2 className="text-2xl font-semibold">We are preparing your dashboard...</h2>
              <p className="text-sm text-white/70 max-w-sm">
                Fetching the latest plan details and unlocking your workspace.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Toast Container - Mobile: Top Floating, Desktop: Top Right */}
      <div className={`fixed z-[200000] pointer-events-none transition-all duration-300 ${isMobileView
        ? 'top-4 left-4 right-4 flex flex-col items-center gap-2'
        : 'top-6 right-6 flex flex-col items-end gap-3 min-w-[320px]'
        }`}>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
            isMobile={isMobileView}
          />
        ))}
      </div>

      {showInstallPrompt && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md px-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.35)] p-8 space-y-6 backdrop-blur-2xl transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out">
            <div className="flex flex-col items-center text-center space-y-4">
              <img
                src={`${process.env.PUBLIC_URL || ''}/assets/inventory-studio-logo-removebg.png`}
                alt="Chitrgupt"
                className="w-28 h-28 object-contain drop-shadow-sm"
              />
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-400">Install App</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Chitrgupt <br /><span className="text-slate-400 font-medium text-lg">on your device</span></h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                  Experience seamless inventory management with instant access and offline support.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setHasDismissedInstallPrompt(true);
                  setShowInstallPrompt(false);
                }}
                className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-[0.97]"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-xl shadow-slate-900/10 dark:shadow-white/5 hover:opacity-90 transition-all active:scale-[0.97]"
              >
                Install now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Mode Explanation Modal */}
      {showReadOnlyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-0">
          <div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setShowReadOnlyModal(false)}
          />
          <div className="relative w-full max-w-md rounded-[24px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] p-8 overflow-hidden transform transition-all animate-in zoom-in-[0.98] slide-in-from-bottom-[2%] duration-500 ease-out">

            {/* Close icon top right */}
            <button
              onClick={() => setShowReadOnlyModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-rose-50/60 dark:bg-rose-900/10 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center space-y-6">
              {/* Icon Container with multi-layered rings */}
              <div className="relative flex justify-center mt-2">
                <div className="absolute inset-0 bg-rose-100/50 dark:bg-rose-900/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '3s' }}></div>
                <div className="relative flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full ring-8 ring-rose-50 dark:ring-rose-900/10">
                  <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-3 px-2">
                <h2 className="text-[22px] font-bold tracking-tight text-slate-900 dark:text-white">Read-Only Mode</h2>
                <div className="space-y-2">
                  <p className="text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Data modification is locked because this account is currently active on another device.
                  </p>
                  <p className="text-[15px] leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                    To perform operations on this device, you must logout and login again.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex justify-center pt-2">
                <button
                  type="button"
                  disabled={isCheckingSync}
                  onClick={() => handleLogout()}
                  className="w-full min-h-[44px] inline-flex justify-center items-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-[15px] font-semibold shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCheckingSync ? 'Checking...' : 'Logout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsynced Data Warning Modal */}
      {unsyncedDataInfo && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-red-200 dark:border-red-900/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-8 w-8" />
                <h3 className="text-2xl font-bold">{getTranslation('warningUnsyncedData', state.currentLanguage)}</h3>
              </div>
              <p className="text-red-100 text-sm">
                {getTranslation('unsyncedDataDesc', state.currentLanguage)
                  .replace('{count}', unsyncedDataInfo.totalUnsynced)
                  .replace('{item}', unsyncedDataInfo.totalUnsynced === 1 ? 'item' : 'items')}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Unsynced Items Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Database className="h-5 w-5 text-red-600 dark:text-red-500" />
                  {getTranslation('unsyncedDataBreakdown', state.currentLanguage)}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(unsyncedDataInfo.unsyncedData || {}).map(([key, count]) => {
                    if (count === 0) return null;
                    const labels = {
                      products: getTranslation('products', state.currentLanguage),
                      customers: getTranslation('customers', state.currentLanguage),
                      orders: getTranslation('orders', state.currentLanguage),
                      transactions: 'Transactions',
                      purchaseOrders: 'Purchase Orders',
                      productBatches: 'Product Batches',
                      expenses: getTranslation('expenses', state.currentLanguage)
                    };
                    return (
                      <div key={key} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{count}</div>
                        <div className="text-xs text-red-700 dark:text-red-300">{labels[key] || key}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync Issue Reason */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  {getTranslation('whyNotSyncing', state.currentLanguage)}
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                  {unsyncedDataInfo.syncBlockMessage}
                </p>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {getTranslation('recommendedActions', state.currentLanguage)}
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                  {unsyncedDataInfo.syncBlockReason === 'offline' && (
                    <>
                      <li>Check your internet connection</li>
                      <li>Wait for connection to restore</li>
                      <li>Try refreshing the page once online</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'syncing' && (
                    <>
                      <li>Wait for the current sync to complete</li>
                      <li>Check the sync status indicator</li>
                      <li>Try logging out again in a few moments</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'plan_expired' && (
                    <>
                      <li>Upgrade your subscription plan to enable sync</li>
                      <li>Go to Settings → Upgrade Plan</li>
                      <li>Once upgraded, data will automatically sync</li>
                      <li>Contact support if you need assistance with renewal</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'auth_error' && (
                    <>
                      <li>Refresh the page to restore your session</li>
                      <li>If issue persists, logout and login again</li>
                      <li>Clear browser cache and cookies if needed</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'sync_error' && (
                    <>
                      <li>Check browser console for detailed error messages</li>
                      <li>Refresh the page to retry sync</li>
                      <li>Verify server is accessible</li>
                      <li>Contact support with error details if issue persists</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'sync_failed' && (
                    <>
                      <li>Refresh the page to retry sync</li>
                      <li>Check if the server is accessible</li>
                      <li>Contact support if the issue persists</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'error' && (
                    <>
                      <li>Refresh the page</li>
                      <li>Check browser console for errors</li>
                      <li>Contact support if needed</li>
                    </>
                  )}
                  {unsyncedDataInfo.syncBlockReason === 'unknown' && (
                    <>
                      <li>Refresh the page</li>
                      <li>Check your internet connection</li>
                      <li>Wait a few moments and try again</li>
                      <li>Contact support if the issue persists</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-900 dark:text-red-200 font-semibold mb-2">
                  ⚠️ {getTranslation('dataLossWarning', state.currentLanguage)}
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {getTranslation('forceLogoutDesc', state.currentLanguage)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setUnsyncedDataInfo(null)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors font-semibold"
              >
                {getTranslation('cancelLogout', state.currentLanguage)}
              </button>
              <button
                onClick={handleForceLogout}
                className="flex-1 px-4 py-3 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                {getTranslation('forceLogout', state.currentLanguage)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
