import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, ActionTypes } from '../../context/AppContext';
import { updateSellerProfile } from '../../utils/api';
import { sanitizeMobileNumber, isValidMobileNumber, sanitizeGSTNumber, isValidGSTNumber } from '../../utils/validation';
import { indianCities } from '../../utils/indianCities';
import { auth } from '../../utils/firebase';
import {
  X, LogOut, Store, Briefcase, MapPin, Phone, Building2, Navigation, CreditCard, FileText, User, ArrowRight,
  Users, Package, Wallet, TrendingUp, Truck, AlertTriangle, Clock, ChevronRight, Search, Menu, Bell, Loader2,
  MessageCircle, ChevronDown, Check
} from 'lucide-react';

const businessTypes = ['Retail', 'Wholesale', 'Service', 'Manufacturing', 'E-commerce', 'Other'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const indianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

const parseExpiryDate = (rawValue) => {
  if (!rawValue) {
    return null;
  }
  const parsedDate = new Date(rawValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const calculateExpiryCountdown = (expiryDate) => {
  if (!expiryDate) {
    return null;
  }
  const diff = expiryDate.getTime() - Date.now();
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    expired: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const formatCountdownValue = (value) => String(value ?? 0).padStart(2, '0');

const ConfettiEffect = () => {
  const [mounted, setMounted] = useState(false);
  const particles = Array.from({ length: 60 });
  const colors = ['#f4a259', '#0f172a', '#4cc9f0', '#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4895ef'];

  useEffect(() => {
    // Small delay to trigger the transition after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* Left Cannon Burst */}
      {particles.slice(0, 30).map((_, i) => {
        const tx = Math.random() * 60 + 20; // Aim towards middle
        const ty = -(Math.random() * 80 + 20); // Aim upwards
        const duration = Math.random() * 0.8 + 1.2;
        const size = Math.random() * 10 + 10;
        const delay = Math.random() * 0.3;

        return (
          <div
            key={`left-${i}`}
            style={{
              position: 'absolute',
              left: '-20px',
              bottom: '-20px',
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: colors[i % colors.length],
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '3px' : '0',
              opacity: mounted ? 0 : 1,
              transform: mounted ? `translate(${tx}vw, ${ty}vh) rotate(${Math.random() * 720}deg) scale(0.5)` : 'translate(0, 0) scale(1)',
              transition: `transform ${duration}s cubic-bezier(0.1, 0.8, 0.4, 1) ${delay}s, opacity ${duration}s ease-in ${delay}s`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              zIndex: 99999
            }}
          />
        );
      })}

      {/* Right Cannon Burst */}
      {particles.slice(30).map((_, i) => {
        const tx = -(Math.random() * 60 + 20); // Aim towards middle
        const ty = -(Math.random() * 80 + 20); // Aim upwards
        const duration = Math.random() * 0.8 + 1.2;
        const size = Math.random() * 10 + 10;
        const delay = Math.random() * 0.3;

        return (
          <div
            key={`right-${i}`}
            style={{
              position: 'absolute',
              right: '-20px',
              bottom: '-20px',
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: colors[i % colors.length],
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '3px' : '0',
              opacity: mounted ? 0 : 1,
              transform: mounted ? `translate(${tx}vw, ${ty}vh) rotate(${-(Math.random() * 720)}deg) scale(0.5)` : 'translate(0, 0) scale(1)',
              transition: `transform ${duration}s cubic-bezier(0.1, 0.8, 0.4, 1) ${delay}s, opacity ${duration}s ease-in ${delay}s`,
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              zIndex: 99999
            }}
          />
        );
      })}
    </div>
  );
};

const logoSrc = `${process.env.PUBLIC_URL || ''}/assets/inventory-studio-logo-removebg.png`;

const InputWrapper = ({ label, error, children, icon: Icon, required }) => (
  <div className="space-y-1.5 mb-6 group">
    <div className="flex justify-between items-center px-0.5">
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{label} {required && <span className="text-neutral-400">*</span>}</label>
      {error && (
        <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
          <AlertTriangle size={10} />
          {error}
        </span>
      )}
    </div>
    <div className="relative">
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? 'text-rose-500' : 'text-neutral-500 group-focus-within:text-white'}`}>
        <Icon size={18} />
      </div>
      {React.cloneElement(children, {
        className: `block w-full pl-12 pr-4 py-3.5 bg-black/40 border border-neutral-800 transition-all duration-200 rounded-xl text-sm font-medium text-white placeholder:text-neutral-600 outline-none ${error
          ? 'border-rose-500/50 bg-rose-500/5'
          : 'focus:border-indigo-500/50 focus:bg-neutral-900/80 focus:ring-1 focus:ring-indigo-500/20'
          }`
      })}
    </div>
  </div>
);

const CustomSelect = ({ label, value, onChange, options, placeholder, icon: Icon, required, error, onFocus, id }) => {
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

  return (
    <div className={`space-y-1.5 mb-6 group relative ${isOpen ? 'z-[10002]' : 'z-10'}`} ref={containerRef}>
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{label} {required && <span className="text-neutral-400">*</span>}</label>
        {error && (
          <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
            <AlertTriangle size={10} />
            {error}
          </span>
        )}
      </div>
      <div className="relative">
        <button
          id={id}
          type="button"
          onFocus={onFocus}
          onClick={() => setIsOpen(!isOpen)}
          className={`group flex items-center w-full pl-12 pr-4 py-3.5 bg-black border transition-all duration-200 rounded-xl text-sm font-medium shadow-sm text-left outline-none ${error ? 'border-rose-500/50 bg-rose-500/5 text-rose-400' : (isOpen ? 'border-neutral-500 bg-neutral-900' : 'border-neutral-800 hover:border-neutral-700 text-white')
            }`}
        >
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${error ? 'text-rose-500' : (isOpen ? 'text-white' : 'text-neutral-500 group-hover:text-white')}`}>
            <Icon size={18} />
          </div>
          <span className={`truncate mr-4 ${value ? 'text-white' : (error ? 'text-rose-400/80 font-normal' : 'text-neutral-400 font-normal')}`}>
            {value || placeholder}
          </span>
          <ChevronDown size={18} className={`ml-auto shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : 'text-neutral-600'}`} />
        </button>

        {isOpen && (
          <div className="absolute z-[10003] top-full mt-2 w-full bg-black border border-neutral-700 rounded-xl shadow-2xl py-1 overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange({ target: { value: opt } });
                  setIsOpen(false);
                }}
                className={`w-full px-5 py-3 text-left text-sm font-medium transition-colors flex items-center justify-between ${value === opt ? 'bg-indigo-500/10 text-indigo-400' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
              >
                {opt}
                {value === opt && <Check size={14} className="text-indigo-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- PREVIEW DASHBOARD COMPONENTS ---

const STAT_THEMES = {
  primary: { background: 'rgba(47, 60, 126, 0.12)', color: '#2F3C7E', border: 'rgba(47, 60, 126, 0.28)' },
  teal: { background: 'rgba(45, 212, 191, 0.14)', color: '#0F766E', border: 'rgba(15, 118, 110, 0.24)' },
  amber: { background: 'rgba(244, 162, 89, 0.16)', color: '#C2410C', border: 'rgba(194, 65, 12, 0.24)' },
  rose: { background: 'rgba(251, 113, 133, 0.16)', color: '#BE123C', border: 'rgba(190, 18, 60, 0.24)' },
  sky: { background: 'rgba(56, 189, 248, 0.18)', color: '#0369A1', border: 'rgba(3, 105, 161, 0.24)' },
  emerald: { background: 'rgba(74, 222, 128, 0.14)', color: '#047857', border: 'rgba(4, 120, 87, 0.22)' },
  purple: { background: 'rgba(196, 181, 253, 0.2)', color: '#6D28D9', border: 'rgba(109, 40, 217, 0.24)' },
  slate: { background: 'rgba(148, 163, 184, 0.16)', color: '#1E293B', border: 'rgba(30, 41, 59, 0.2)' }
};

const PreviewStatCard = ({ name, value, icon: Icon, description, secondaryValue, themeKey }) => {
  const theme = STAT_THEMES[themeKey] || STAT_THEMES.slate;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border p-2.5" style={{ backgroundColor: theme.background, color: theme.color, borderColor: theme.border }}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{name}</p>
            <p className={`text-2xl font-semibold whitespace-nowrap ${name.includes('Sales') || name.includes('Profit') ? 'text-emerald-600' : 'text-slate-900'
              }`}>
              {value}
            </p>
            {secondaryValue && (
              <p className="text-xs font-medium text-slate-400 mt-1">
                Value: {secondaryValue}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500">{description}</div>
    </div>
  );
};

const PreviewDashboard = ({ mode = 'desktop' }) => {
  const isMobile = mode === 'mobile';

  // Hardcoded "Success" Data
  const stats = [
    { name: 'Total Customers', value: '1,248', icon: Users, description: 'Active Customers', theme: 'primary' },
    { name: 'Total Products', value: '856', icon: Package, description: 'Items in Inventory', theme: 'teal' },
    { name: 'Total Sales', value: '₹42.5L', icon: Wallet, description: 'Sales - Last 30 Days', theme: 'amber' },
    { name: 'Net Profit', value: '₹8.2L', icon: TrendingUp, description: 'Net Profit - Last 30 Days', theme: 'emerald' },
    { name: 'Balance Due', value: '₹1.4L', icon: CreditCard, description: 'Outstanding Payments', theme: 'rose' },
    { name: 'Purchase Orders', value: '12', icon: Truck, description: 'Last 30 Days', theme: 'slate', secondaryValue: '₹2.1L' }
  ];

  const displayStats = isMobile ? stats.slice(0, 4) : stats;

  const ContentArea = () => (
    <div className={`bg-slate-50 w-full h-full font-sans ${isMobile ? 'p-3' : 'p-6'} overflow-hidden flex flex-col`}>
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 shrink-0">
        <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-slate-900`}>Business Overview</h1>

        {/* Time Range Selector Mimic */}
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm w-fit">
          {['Today', '7d', '30d', 'Custom'].map((t, i) => (
            <span key={t} className={`px-3 py-1 text-xs font-medium rounded-full ${i === 2 ? 'bg-slate-900 text-white shadow' : 'text-slate-600'}`}>
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-6">
        {/* Stats Grid */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-3 gap-6'} shrink-0`}>
          {displayStats.map((s, i) => (
            <PreviewStatCard key={i} themeKey={s.theme} {...s} />
          ))}
        </div>

        {/* Charts Section Mimic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">
          {/* Chart 1: Revenue */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="font-semibold text-slate-800">Revenue Analytics</h3>
              <span className="text-xs text-slate-400">Monthly</span>
            </div>
            <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2">
              {[40, 65, 45, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
                <div key={i} className="w-full bg-indigo-50 rounded-t-sm relative group h-full flex items-end">
                  <div className="w-full bg-indigo-500 rounded-t-sm transition-all duration-500" style={{ height: `${h}%` }}></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-400 px-2 shrink-0">
              <span>Jan</span><span>Dec</span>
            </div>
          </div>

          {/* Chart 2: Recent Activity / List */}
          {!isMobile && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
              <h3 className="font-semibold text-slate-800 mb-4 shrink-0">Recent Transactions</h3>
              <div className="space-y-3 overflow-hidden text-ellipsis">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {i % 2 === 0 ? 'S' : 'R'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">Order #{2400 + i}</p>
                        <p className="text-xs text-slate-400">Just now</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">₹{1200 + i * 50}</p>
                      <p className="text-xs text-green-600">Paid</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return <ContentArea />;
  }

  // DESKTOP LAYOUT WITH SIDEBAR (Matched to Sidebar.js)
  return (
    <div className="flex w-full h-full bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white flex flex-col shrink-0 border-r border-slate-200 h-full">
        {/* Logo Area */}
        <div className="h-20 flex items-center px-5 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
              {/* Placeholder for Logo */}
              <div className="w-full h-full bg-slate-200"></div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chitrgupt</p>
              <h1 className="text-sm font-bold text-slate-800">Chitrgupt</h1>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="px-3 space-y-1 flex-1 overflow-y-auto py-2">
          {[
            { icon: Store, label: 'Dashboard', active: true },
            { icon: Users, label: 'Customers' },
            { icon: Package, label: 'Products' },
            { icon: CreditCard, label: 'Billing' },
            { icon: Clock, label: 'Sales History' },
            { icon: ChevronRight, label: 'Refunds' },
            { icon: Truck, label: 'Purchase Orders' },
            { icon: Wallet, label: 'Financial' },
            { icon: TrendingUp, label: 'Reports' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center px-4 py-2.5 rounded-xl transition-all ${item.active
              ? 'bg-gradient-to-r from-slate-900 to-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <item.icon className={`h-4 w-4 mr-3 ${item.active ? 'text-white' : 'text-slate-400'}`} />
              <span className="font-medium text-xs tracking-wide">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Settings Link at Bottom */}
        <div className="p-3 mt-auto">
          <div className="flex items-center px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
            <Menu className="h-4 w-4 mr-3 text-slate-400" /> {/* Settings Icon placeholder */}
            <span className="font-medium text-xs tracking-wide">Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden relative">
        <ContentArea />
      </div>
    </div>
  );
};

const SellerRegistrationForm = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const currentUser = state.currentUser || {};

  const initialForm = useMemo(() => ({
    shopName: currentUser.shopName || '',
    businessType: currentUser.businessType || '',
    shopAddress: currentUser.shopAddress || '',
    phoneNumber: currentUser.phoneNumber || '',
    city: currentUser.city || '',
    state: currentUser.state || '',
    pincode: currentUser.pincode || '',
    upiId: currentUser.upiId || '',
    gstNumber: currentUser.gstNumber || '',
    gender: currentUser.gender || '',
    whatsappLink: currentUser.whatsappLink || ''
  }), [currentUser]);

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ text: '', type: '' });
  const [showUpiInfo, setShowUpiInfo] = useState(false);
  // Disabled the initial intrusive popup as it's now integrated into the sticky sidebar
  const [showTrialPopup, setShowTrialPopup] = useState(false);

  const speakInstruction = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.lang = 'hi-IN';
      const voices = window.speechSynthesis.getVoices();
      let isNativeMale = false;
      if (voices.length > 0) {
        const maleVoice = voices.find(v => (v.lang === 'hi-IN' || v.lang.includes('IN')) && (v.name.includes('Male') || v.name.includes('Hemant') || v.name.includes('Ravi') || v.name.includes('Rishi')));
        const anyIndianVoice = voices.find(v => v.lang === 'hi-IN' || v.lang.includes('IN'));
        if (maleVoice) { utterance.voice = maleVoice; isNativeMale = true; }
        else if (anyIndianVoice) { utterance.voice = anyIndianVoice; }
      }
      utterance.pitch = isNativeMale ? 1.0 : 0.65;
      window.speechSynthesis.speak(utterance);
    }
  };

  const shiftFocus = (nextId) => {
    const el = document.getElementById(nextId);
    if (el) el.focus();
  };

  useEffect(() => {
    // Auto-focus the first field and trigger voice instruction eagerly
    const timer = setTimeout(() => {
      const el = document.getElementById('input-shopName');
      if (el) {
        el.focus();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const [trialDuration, setTrialDuration] = useState(() => {
    const saved = localStorage.getItem('is_trial_duration');
    return saved ? parseFloat(saved) : 14;
  }); // Fallback

  const [fetchedExpiryRaw, setFetchedExpiryRaw] = useState(() => {
    return localStorage.getItem('is_trial_expiry') || null;
  });

  const [sessionStartTime] = useState(() => {
    // try capturing the absolute first mount time securely using localStorage
    const savedStart = localStorage.getItem('is_trial_session_start');
    if (savedStart) return parseInt(savedStart);
    const now = Date.now();
    localStorage.setItem('is_trial_session_start', now.toString());
    return now;
  });

  const estimatedExpiryRaw = useMemo(() => {
    // Start the trial countdown from NOW if we don't have a concrete expiry. 
    // This prevents old 'createdAt' dates from instantly expiring a newly configured trial duration.
    let start = sessionStartTime;
    if (currentUser?.createdAt) {
      const parsed = new Date(currentUser.createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        start = parsed.getTime();
      }
    }

    const estimatedEnd = start + trialDuration * 24 * 60 * 60 * 1000;
    // If the account creation date makes this trial duration already expired,
    // just use the session start time for the Onboarding UI prompt so it looks right.
    if (estimatedEnd <= sessionStartTime) {
      return new Date(sessionStartTime + trialDuration * 24 * 60 * 60 * 1000).toISOString();
    }

    return new Date(estimatedEnd).toISOString();
  }, [currentUser?.createdAt, trialDuration, sessionStartTime]);

  useEffect(() => {
    const getDuration = (val) => {
      if (!val) return null;
      if (typeof val === 'object' && val.$numberDecimal) return parseFloat(val.$numberDecimal);
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };

    let duration = null;

    // Sort to get the most recent free plan if there are multiple, to prevent fetching an old expired one
    const freePlans = (state.planOrders || []).filter(p => p.price === 0 || String(p.price) === '0' || p.planType === 'free' || p.isTrial);
    const mostRecentFreePlan = freePlans.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];
    const trialPlan = mostRecentFreePlan || state.currentPlanDetails;

    if (trialPlan) {
      if (trialPlan.expiryDate) setFetchedExpiryRaw(trialPlan.expiryDate);
      else if (trialPlan.expiresAt) setFetchedExpiryRaw(trialPlan.expiresAt);

      if (trialPlan.durationDays) duration = getDuration(trialPlan.durationDays);
      else if (trialPlan.planId && typeof trialPlan.planId === 'object' && trialPlan.planId.durationDays) duration = getDuration(trialPlan.planId.durationDays);
      else if (trialPlan.plan && trialPlan.plan.durationDays) duration = getDuration(trialPlan.plan.durationDays);
      else if (trialPlan.expiryDate && trialPlan.createdAt) {
        const ms = new Date(trialPlan.expiryDate) - new Date(trialPlan.createdAt);
        duration = ms / (1000 * 60 * 60 * 24);
      }
    }

    if (duration !== null) {
      setTrialDuration(Math.max(0.01, Math.round(duration * 100) / 100)); // Keeps decimals if any (like 0.02)
    } else {
      // Direct API fetch to identify the free trial length from DB
      const fetchTrialDuration = async () => {
        try {
          const { apiRequest } = await import('../../utils/api');
          const res = await apiRequest('/data/plans');

          if (res && res.success) {
            let plansArray = [];
            if (Array.isArray(res.data)) plansArray = res.data;
            else if (res.data && Array.isArray(res.data.data)) plansArray = res.data.data;

            if (plansArray.length > 0) {
              const freePlan = plansArray.find(p => p.rawPrice === 0 || p.price === 'Free' || (p.name && p.name.toLowerCase().includes('free')));

              if (freePlan && freePlan.durationDays !== undefined) {
                const parsedDuration = getDuration(freePlan.durationDays);
                if (parsedDuration !== null) {
                  // If it's something like 0.02 days, this preserves it instead of rounding to 0, which would show 1.
                  // Or if user says 28 days, it remains 28.
                  setTrialDuration(Math.max(0.01, Math.round(parsedDuration * 100) / 100));
                }
              }
            }

            const planInfo = res.data?.sellerPlanInfo || res.data?.data?.sellerPlanInfo;
            if (planInfo && (planInfo.expiresAt || planInfo.expiryDate)) {
              setFetchedExpiryRaw(planInfo.expiresAt || planInfo.expiryDate);
            } else {
              const usagePlans = res.data?.usagePlans || res.data?.data?.usagePlans || [];
              const validPlan = usagePlans.find(p => p.status !== 'expired' && (p.price === 0 || p.planType === 'free'));
              if (validPlan && validPlan.expiryDate) {
                setFetchedExpiryRaw(validPlan.expiryDate);
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch trial duration directly:", err);
        }
      };
      fetchTrialDuration();
    }

    // Persist to local storage if discovered
    if (duration !== null && !isNaN(duration)) {
      localStorage.setItem('is_trial_duration', duration.toString());
    }
  }, [state.planOrders, state.currentPlanDetails]);

  // Persist fetched expiry when it updates
  useEffect(() => {
    if (fetchedExpiryRaw) {
      localStorage.setItem('is_trial_expiry', fetchedExpiryRaw);
    }
  }, [fetchedExpiryRaw]);

  const subscriptionExpiryRaw =
    fetchedExpiryRaw ||
    state.currentPlanDetails?.expiresAt ||
    state.currentPlanDetails?.expiryDate ||
    state.subscription?.expiresAt;

  const subscriptionExpiryDate = useMemo(() => {
    let date = parseExpiryDate(subscriptionExpiryRaw);
    if (!date) {
      date = parseExpiryDate(estimatedExpiryRaw);
    }
    return date;
  }, [subscriptionExpiryRaw, estimatedExpiryRaw]);

  const [expiryCountdown, setExpiryCountdown] = useState(() =>
    calculateExpiryCountdown(subscriptionExpiryDate)
  );

  const daysRemaining = subscriptionExpiryDate
    ? Math.max(
      0,
      Math.ceil(
        (subscriptionExpiryDate.getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
      )
    )
    : 0;

  useEffect(() => {
    if (!subscriptionExpiryDate) {
      setExpiryCountdown(null);
      return;
    }

    const updateCountdown = () => {
      setExpiryCountdown(calculateExpiryCountdown(subscriptionExpiryDate));
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [subscriptionExpiryDate]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      shopName: currentUser.shopName || prev.shopName,
      businessType: currentUser.businessType || prev.businessType,
      shopAddress: currentUser.shopAddress || prev.shopAddress,
      phoneNumber: currentUser.phoneNumber || prev.phoneNumber,
      city: currentUser.city || prev.city,
      state: currentUser.state || prev.state,
      pincode: currentUser.pincode || prev.pincode,
      upiId: currentUser.upiId || prev.upiId,
      gstNumber: currentUser.gstNumber || prev.gstNumber,
      gender: currentUser.gender || prev.gender,
      whatsappLink: currentUser.whatsappLink || prev.whatsappLink
    }));
  }, [currentUser]);

  // Ensure the auto-fetched city is available in the dropdown
  const cityOptions = useMemo(() => {
    if (form.city && !indianCities.includes(form.city)) {
      return [...indianCities, form.city].sort();
    }
    return indianCities;
  }, [form.city]);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === 'phoneNumber') value = value.replace(/\D/g, '').slice(0, 10);
    if (field === 'gstNumber' && value) value = sanitizeGSTNumber(value);

    // Auto-fill location based on Pincode
    if (field === 'pincode') {
      value = value.replace(/\D/g, '').slice(0, 6);
      if (value.length === 6) {
        fetch(`https://api.postalpincode.in/pincode/${value}`)
          .then(res => res.json())
          .then(data => {
            if (data && data[0]?.Status === 'Success') {
              const { District, State } = data[0].PostOffice[0];
              setForm(prev => ({ ...prev, city: District, state: State }));
              setErrors(prev => ({ ...prev, city: '', state: '' }));
            }
          })
          .catch(console.error);
      }
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    const requiredFields = ['shopName', 'businessType', 'shopAddress', 'phoneNumber', 'city', 'state', 'pincode', 'upiId', 'gender'];
    requiredFields.forEach((field) => { if (!form[field] || !form[field].toString().trim()) nextErrors[field] = 'Required'; });
    if (form.shopAddress && form.shopAddress.trim().length < 5) nextErrors.shopAddress = 'Address must be at least 5 characters long';
    const sanitizedPhone = sanitizeMobileNumber(form.phoneNumber);
    if (!sanitizedPhone || !isValidMobileNumber(sanitizedPhone)) nextErrors.phoneNumber = 'Enter a valid 10-digit mobile number';
    const sanitizedPincode = (form.pincode || '').toString().replace(/\D/g, '');
    if (sanitizedPincode.length !== 6) nextErrors.pincode = 'Enter a valid 6-digit pincode';
    const upiPattern = /^[\w.-]{2,}@[a-zA-Z]{2,}$/;
    if (!upiPattern.test(form.upiId.trim())) nextErrors.upiId = 'Enter a valid UPI ID (example: name@bank)';
    if (form.gstNumber && form.gstNumber.trim()) {
      const sanitizedGST = sanitizeGSTNumber(form.gstNumber);
      if (!isValidGSTNumber(sanitizedGST)) nextErrors.gstNumber = 'Enter a valid 15-character GSTIN';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      dispatch({ type: ActionTypes.LOGOUT });
      navigate('/login');
      if (window.showToast) window.showToast('Logged out successfully.', 'info');
    } catch (error) {
      if (window.showToast) window.showToast('Error logging out.', 'error');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormMessage({ text: '', type: '' });
    if (isSubmitting) return;
    if (!validate()) {
      const msg = 'Please fix the highlighted fields.';
      setFormMessage({ text: msg, type: 'warning' });
      if (window.showToast) window.showToast(msg, 'warning');
      return;
    }
    setIsSubmitting(true);
    const sanitizedPhone = sanitizeMobileNumber(form.phoneNumber);
    const sanitizedPincode = (form.pincode || '').toString().replace(/\D/g, '').slice(0, 6);
    const sanitizedGST = form.gstNumber ? sanitizeGSTNumber(form.gstNumber) : null;
    const payload = {
      ...form,
      phoneNumber: sanitizedPhone,
      pincode: sanitizedPincode,
      gstNumber: sanitizedGST,
      shopName: form.shopName.trim(),
      businessType: form.businessType.trim(),
      shopAddress: form.shopAddress.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      upiId: form.upiId.trim(),
      gender: form.gender.trim(),
      whatsappLink: form.whatsappLink ? form.whatsappLink.trim() : null
    };

    try {
      const response = await updateSellerProfile(payload);
      if (!response.success) {
        // Handle backend validation errors with details
        if (response.error && typeof response.error === 'object' && response.error.details) {
          const backendErrors = {};
          response.error.details.forEach(detail => {
            if (detail.field) backendErrors[detail.field] = detail.message;
          });
          if (Object.keys(backendErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...backendErrors }));
            const msg = 'Please fix the highlighted fields.';
            setFormMessage({ text: msg, type: 'warning' });
            if (window.showToast) window.showToast(msg, 'warning');
            return;
          }
        }
        const errorMsg = response.error || response.data?.message || 'Failed to complete registration';
        setFormMessage({ text: errorMsg, type: 'error' });
        throw new Error(errorMsg);
      }

      const updatedSeller = response.data?.data?.seller || response.data?.seller || {};
      dispatch({
        type: ActionTypes.UPDATE_USER,
        payload: {
          ...currentUser,
          ...updatedSeller,
          profileCompleted: true
        }
      });
      if (payload.shopName) dispatch({ type: ActionTypes.SET_STORE_NAME, payload: payload.shopName });
      if (payload.upiId) dispatch({ type: ActionTypes.SET_UPI_ID, payload: payload.upiId });
      const successMsg = 'Profile completed successfully!';
      setFormMessage({ text: successMsg, type: 'success' });
      if (window.showToast) window.showToast(successMsg, 'success');

      // Navigate to dashboard after completion
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);

    } catch (error) {
      // Handle duplicate mobile number error specifically
      if (error.message && error.message.includes('mobile number is already registered')) {
        const msg = 'This mobile number is already in use.';
        setErrors(prev => ({ ...prev, phoneNumber: msg }));
        setFormMessage({ text: 'Mobile number already registered.', type: 'error' });
        if (window.showToast) window.showToast('Mobile number already registered.', 'error');
        return;
      }

      // Check if error object has details (from api.js throw)
      if (error.details && Array.isArray(error.details)) {
        const backendErrors = {};
        error.details.forEach(detail => {
          if (detail.field) backendErrors[detail.field] = detail.message;
        });
        if (Object.keys(backendErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...backendErrors }));
          const msg = 'Please fix the highlighted fields.';
          setFormMessage({ text: msg, type: 'warning' });
          if (window.showToast) window.showToast(msg, 'warning');
          return;
        }
      }

      const errorMsg = error.message || 'Failed to save details.';
      setFormMessage({ text: errorMsg, type: 'error' });
      if (window.showToast) window.showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col overflow-hidden font-sans m-0 p-0 text-white">
      {/* Immersive Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Banner (Trial Status) */}
      <div className={`shrink-0 border-b ${expiryCountdown?.expired ? 'bg-rose-950/20 border-rose-900/30' : 'bg-neutral-900/40 border-neutral-800/60'} px-6 py-3 flex items-center justify-between backdrop-blur-md relative z-10`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Free Trial Active</span>
          </div>
          <div className="h-4 w-px bg-neutral-800 hidden sm:block"></div>
          <div className="flex items-center gap-3 bg-neutral-800/40 px-3 py-1 rounded-full border border-white/5">
            <Clock size={12} className="text-neutral-500" />
            <div className="flex items-center gap-1 tabular-nums">
              <span className="text-[11px] font-bold text-neutral-200">{formatCountdownValue(expiryCountdown?.days)}d</span>
              <span className="text-neutral-700">:</span>
              <span className="text-[11px] font-bold text-neutral-200">{formatCountdownValue(expiryCountdown?.hours)}h</span>
              <span className="text-neutral-700">:</span>
              <span className="text-[11px] font-bold text-neutral-200">{formatCountdownValue(expiryCountdown?.minutes)}m</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2 px-4 py-1.5 hover:bg-neutral-800/50 rounded-lg">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block">Sign Out</span>
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]/50 relative z-10 backdrop-blur-[2px] flex flex-col items-center">
        <div className="w-[95vw] sm:w-full max-w-6xl mx-auto px-0 sm:px-6 py-12 lg:py-20">
          {/* Header removed from here */}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Identity */}
            <section className="bg-neutral-900/20 border border-neutral-800/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-3xl w-full">
              <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-indigo-500/30"></div>
                Business Identity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <InputWrapper label="Shop Name" required error={errors.shopName} icon={Store}><input id="input-shopName" type="text" value={form.shopName} onChange={handleChange('shopName')} onFocus={() => speakInstruction('यहाँ पर आप अपने शॉप का नाम डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); shiftFocus('select-businessType'); } }} placeholder="e.g. Acme Superstore" maxLength={50} /></InputWrapper>
                <CustomSelect id="select-businessType" label="Business Type" required error={errors.businessType} icon={Briefcase} value={form.businessType} onChange={handleChange('businessType')} onFocus={() => speakInstruction('यहाँ पर अपने बिज़नेस का प्रकार चुनें')} options={businessTypes} placeholder="Select Type" />
              </div>
            </section>

            {/* Address */}
            <section className="bg-neutral-900/20 border border-neutral-800/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-3xl w-full">
              <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-cyan-500/30"></div>
                Location & Reach
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputWrapper label="Contact Number" required error={errors.phoneNumber} icon={Phone}><input id="input-phoneNumber" type="tel" value={form.phoneNumber} onChange={handleChange('phoneNumber')} onFocus={() => speakInstruction('यहाँ पर अपना दस अंकों का मोबाइल नंबर डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); shiftFocus('input-pincode'); } }} placeholder="9876543210" maxLength={10} /></InputWrapper>
                  <InputWrapper label="Pincode" required error={errors.pincode} icon={Navigation}><input id="input-pincode" type="text" value={form.pincode} onChange={handleChange('pincode')} onFocus={() => speakInstruction('यहाँ पर अपने एरिया का पिनकोड डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); shiftFocus('input-shopAddress'); } }} placeholder="6-digit PIN" maxLength={6} /></InputWrapper>
                </div>
                <InputWrapper label="Full Operating Address" required error={errors.shopAddress} icon={MapPin}><input id="input-shopAddress" type="text" value={form.shopAddress} onChange={handleChange('shopAddress')} onFocus={() => speakInstruction('यहाँ पर अपने शॉप का पूरा पता डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); shiftFocus('input-upiId'); } }} placeholder="Street, Area, Building..." maxLength={200} /></InputWrapper>

                {form.pincode && form.pincode.length === 6 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fadeIn">
                    <CustomSelect id="select-city" label="City" required error={errors.city} icon={Building2} value={form.city} onChange={handleChange('city')} onFocus={() => speakInstruction('यहाँ पर अपनी सिटी चुनें')} options={cityOptions} placeholder="Select City" />
                    <CustomSelect id="select-state" label="State" required error={errors.state} icon={Navigation} value={form.state} onChange={handleChange('state')} onFocus={() => speakInstruction('यहाँ पर अपना राज्य चुनें')} options={indianStates} placeholder="Select State" />
                  </div>
                )}
              </div>
            </section>

            {/* Financials */}
            <section className="bg-neutral-900/20 border border-neutral-800/60 p-5 sm:p-8 rounded-[2rem] sm:rounded-3xl w-full">
              <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] mb-6 sm:mb-8 flex items-center gap-3">
                <div className="h-px w-8 bg-purple-500/30"></div>
                Account & Financials
              </h3>
              <div className="space-y-6">
                <div className="relative">
                  <InputWrapper label="Merchant UPI ID (For Payments)" required error={errors.upiId} icon={CreditCard}><input id="input-upiId" type="text" value={form.upiId} onChange={handleChange('upiId')} onFocus={() => speakInstruction('यहाँ पर पेमेंट लेने के लिए अपनी UPI ID डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); shiftFocus('select-gender'); } }} placeholder="name@bank" maxLength={50} /></InputWrapper>
                  <p className="text-[10px] text-neutral-500 -mt-4 mb-2 italic">
                    Note: Required to generate payment QR codes for your customers to pay you directly.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <CustomSelect id="select-gender" label="Gender" required error={errors.gender} icon={User} value={form.gender} onChange={handleChange('gender')} onFocus={() => speakInstruction('यहाँ पर अपना जेंडर चुनें')} options={genders} placeholder="Select Gender" />
                  <InputWrapper label="GSTIN (Optional)" error={errors.gstNumber} icon={FileText}><input id="input-gstNumber" type="text" value={form.gstNumber} onChange={handleChange('gstNumber')} onFocus={() => speakInstruction('अगर आपके पास GST नंबर है, तो यहाँ डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); shiftFocus('input-whatsappLink'); } }} placeholder="15-digit GSTIN" maxLength={15} /></InputWrapper>
                </div>
                <InputWrapper label="WhatsApp Group Link (Optional)" icon={MessageCircle}><input id="input-whatsappLink" type="text" value={form.whatsappLink} onChange={handleChange('whatsappLink')} onFocus={() => speakInstruction('यहाँ पर अपने व्हाट्सएप ग्रुप का लिंक डालें')} onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); } }} placeholder="e.g. https://chat.whatsapp.com/..." /></InputWrapper>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-12 pb-24 flex flex-col items-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-80 py-4 rounded-2xl font-bold text-sm bg-white text-black hover:bg-neutral-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-white/5 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-neutral-700" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Store Setup</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="mt-8 flex items-center gap-6 text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                <Link to="/terms-conditions" className="hover:text-neutral-400">Terms</Link>
                <Link to="/privacy-policy" className="hover:text-neutral-400">Privacy Policy</Link>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success/Error Message Modals */}
      {formMessage.text && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setFormMessage({ text: '', type: '' })}>
          <div className="bg-[#171717] border border-neutral-800 p-8 rounded-[2.5rem] text-center max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-6 ${formMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {formMessage.type === 'success' ? <Check size={32} /> : <AlertTriangle size={32} />}
            </div>
            <h4 className="text-xl font-bold text-white mb-2">{formMessage.type === 'success' ? 'Success!' : 'Oops!'}</h4>
            <p className="text-sm text-neutral-400 mb-8 leading-relaxed">{formMessage.text}</p>
            <button onClick={() => setFormMessage({ text: '', type: '' })} className="w-full py-3.5 rounded-xl bg-neutral-800 text-xs font-bold uppercase tracking-widest hover:bg-neutral-700 transition-colors">Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerRegistrationForm;
