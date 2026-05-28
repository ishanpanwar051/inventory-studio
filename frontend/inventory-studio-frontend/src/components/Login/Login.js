import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, ActionTypes } from '../../context/AppContext';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import { initDB } from '../../utils/indexedDB';
import { getSellerId } from '../../utils/api';
import { AlertTriangle, ArrowRight, Loader2, Zap, ShieldCheck, Globe } from 'lucide-react';

const Login = () => {
  const { dispatch } = useApp();
  const logoSrc = `${process.env.PUBLIC_URL || ''}/assets/inventory-studio-logo-removebg.png`;
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSigningInRef = useRef(false);
  const isAuthenticatingRef = useRef(false);

  const handleUserAuthentication = async (user) => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;
    if (!user || !user.email) {
      setError('Invalid user data received.');
      setIsLoading(false);
      return;
    }
    try {
      const idToken = await user.getIdToken();
      const sellerAuthResult = await getSellerId(user.email, user.uid, user.displayName, user.photoURL, idToken);
      if (sellerAuthResult && sellerAuthResult.success) {
        await proceedWithAuthentication(sellerAuthResult, 'seller', user);
      } else {
        setError('No account found for this email. Please register first.');
        setIsLoading(false);
      }
    } catch (error) {
      setError(`Authentication failed: ${error.message}`);
      setIsLoading(false);
    } finally {
      isAuthenticatingRef.current = false;
    }
  };

  const proceedWithAuthentication = async (authResult, userType, user) => {
    try {
      const userData = authResult[userType];
      let sellerId = userData.sellerId;
      if (userType === 'staff' && authResult.seller?._id) {
        sellerId = authResult.seller._id;
      }
      const payload = {
        ...userData,
        sellerId: sellerId,
        userType: userType,
        email: user?.email || userData.email || '',
        uid: user?.uid || ''
      };
      dispatch({ type: ActionTypes.LOGIN, payload: payload });
      setIsLoading(false);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
    } catch (error) {
      setError(`Authentication failed: ${error.message}`);
      setIsLoading(false);
      try { await auth.signOut(); } catch (e) { }
    }
  };

  useEffect(() => {
    initDB();
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading || isSigningInRef.current) return;
    try {
      isSigningInRef.current = true;
      setIsLoading(true);
      setError('');

      const result = await signInWithPopup(auth, googleProvider);
      await handleUserAuthentication(result.user);
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Another sign-in popup is already open.');
      } else {
        setError(`Sign-in failed: ${error.message}`);
      }
      setIsLoading(false);
    } finally {
      isSigningInRef.current = false;
    }
  };


  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden font-sans m-0 p-4 sm:p-8 text-white">
      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        
        {/* Login Card */}
        <div className="w-full">
          <LoginCard 
            logoSrc={logoSrc}
            handleGoogleSignIn={handleGoogleSignIn}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Footer / Powered By */}
        <div className="flex flex-col items-center gap-3 opacity-40 mt-10">
          <div className="flex items-center gap-5">
            {[Zap, ShieldCheck, Globe].map((Icon, i) => (
              <Icon key={i} size={14} className="text-neutral-500" />
            ))}
          </div>
          <p className="text-[9px] uppercase tracking-[0.3em] font-black text-neutral-500">
            Powered by Easy Kit
          </p>
        </div>

      </div>
    </div>
  );
};

// Reusable Login Card Component
const LoginCard = ({ logoSrc, handleGoogleSignIn, isLoading, error }) => (
  <div className="w-full bg-neutral-900/60 backdrop-blur-xl border border-white/5 p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl">
    
    {/* Internal Branding */}
    <div className="mb-8 text-center flex flex-col items-center">
      <img src={logoSrc} alt="Chitrgupt Logo" className="h-16 w-16 sm:h-20 sm:w-20 object-contain mb-3" />
      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">Chitrgupt</h1>
    </div>

    <div className="text-center mb-8 sm:mb-10">
      <h2 className="text-xl font-bold text-neutral-200 tracking-tight">Welcome Back</h2>
      <p className="text-neutral-500 text-xs mt-1 font-medium">Sign in to manage your business</p>
    </div>

    {error && (
      <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in duration-300">
        <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
        <p className="text-rose-200 text-xs font-bold leading-relaxed text-left">{error}</p>
      </div>
    )}

    <div className="space-y-4">
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="group relative w-full flex items-center justify-center gap-3 sm:gap-4 px-5 py-4 bg-white text-black hover:bg-neutral-100 rounded-2xl sm:rounded-[1.5rem] font-black text-sm transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
      >
        {isLoading ? (
          <Loader2 size={24} className="animate-spin text-neutral-700" />
        ) : (
          <>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
            <span className="flex-1 text-center">Continue with Google</span>
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>


    </div>

    <div className="mt-10 sm:mt-12 text-center">
      <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-relaxed flex flex-col items-center">
        <span>By continuing, you agree to our</span>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Link to="/terms-conditions" className="text-neutral-400 hover:text-white transition-colors">Terms</Link>
          <span className="text-neutral-800">&bull;</span>
          <Link to="/privacy-policy" className="text-neutral-400 hover:text-white transition-colors">Privacy</Link>
        </div>
      </div>
    </div>
  </div>
);

export default Login;
