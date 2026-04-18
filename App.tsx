
import React, { useState, useEffect, useMemo } from 'react';
import { User } from './types';
import { TRANSLATIONS } from './constants';
import Profile from './components/Profile';
import Warpers from './components/Warpers';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { 
  X, Loader2, CheckCircle2, AlertTriangle, Sun, Moon, Package, User as UserIcon, RefreshCw
} from 'lucide-react';

const Toast: React.FC<{ message: string; show: boolean; onClose: () => void; isError?: boolean }> = ({ message, show, onClose, isError }) => {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);
    if (!show) return null;
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500">
            <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md ${isError ? 'bg-red-600 border-red-500 text-white' : 'bg-green-600 border-green-500 text-white'}`}>
                {isError ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                <span className="font-bold text-sm tamil-font whitespace-nowrap">{message}</span>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'warpers' | 'profile'>('warpers');
  const GUEST_USER: User = useMemo(() => ({ uid: '', email: 'guest@warper.local', name: 'Guest', isLoggedIn: false }), []);
  const [user, setUser] = useState<User>(GUEST_USER);
  const [language, setLanguage] = useState<'ta' | 'en'>(() => {
    const savedLang = localStorage.getItem('warper_lang');
    return (savedLang === 'ta' || savedLang === 'en') ? savedLang : 'ta';
  });
  const [toast, setToast] = useState<{ msg: string, show: boolean, isError?: boolean }>({ msg: '', show: false });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [customAppName, setCustomAppName] = useState(() => localStorage.getItem('warper_custom_app_name') || '');
  const [themeColor, setThemeColor] = useState(() => {
    try {
      const savedUser = localStorage.getItem('warper_active_user');
      const u = savedUser ? JSON.parse(savedUser) : GUEST_USER;
      return localStorage.getItem(`warper_theme_color_${u.uid || 'guest'}`) || 'bg-zinc-50';
    } catch {
      return 'bg-zinc-50';
    }
  });
  const [buttonColor, setButtonColor] = useState(() => {
    try {
      const savedUser = localStorage.getItem('warper_active_user');
      const u = savedUser ? JSON.parse(savedUser) : GUEST_USER;
      return localStorage.getItem(`warper_button_color_${u.uid || 'guest'}`) || 'bg-zinc-600 hover:bg-zinc-700';
    } catch {
      return 'bg-zinc-600 hover:bg-zinc-700';
    }
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('warper_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('warper_theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#09090b');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#4f46e5');
    }
  }, [theme]);

  useEffect(() => {
    (window as any).isLoggedIn = user?.isLoggedIn;
  }, [user?.isLoggedIn]);

  useEffect(() => {
    // These are now handled by state initializers
  }, [user.uid]);

  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    if (user) {
      localStorage.setItem(`warper_theme_color_${user.uid || 'guest'}`, color);
    }
  };

  const handleButtonColorChange = (color: string) => {
    setButtonColor(color);
    if (user) {
      localStorage.setItem(`warper_button_color_${user.uid || 'guest'}`, color);
    }
  };

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent | MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.cursor-pointer')) {
        if (navigator.vibrate) {
          // Provide a subtle haptic feedback on touch
          navigator.vibrate(15);
        }
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        if (user.uid) {
            setToast({ msg: language === 'ta' ? 'ஆன்லைன் இணைக்கப்பட்டது' : 'Online Connected', show: true });
        }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user.uid, language]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ 
          uid: session.user.id, 
          email: session.user.email || '', 
          name: session.user.user_metadata.full_name || session.user.user_metadata.name || 'User', 
          avatar: session.user.user_metadata.avatar_url,
          mobile: session.user.user_metadata.mobile,
          address: session.user.user_metadata.address,
          isLoggedIn: true 
        });
      } else {
        const savedUser = localStorage.getItem('warper_active_user');
        if (savedUser) { 
            try { setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem('warper_active_user'); setUser(GUEST_USER); } 
        } else {
            setUser(GUEST_USER);
        }
      }
      setIsAppLoading(false);
    }).catch(err => {
      console.error('Supabase session error:', err);
      setIsAppLoading(false);
    });

    // Safety timeout for loading screen
    const safetyTimeout = setTimeout(() => {
      setIsAppLoading(prev => {
        if (prev) {
          console.warn('App loading safety timeout triggered');
          return false;
        }
        return prev;
      });
    }, 5000);

    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [GUEST_USER]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (activeTab !== 'warpers') {
        e.preventDefault();
        setActiveTab('warpers');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const t = TRANSLATIONS[language];
  
  if (isAppLoading) {
      return (
          <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
              <Loader2 size={48} className="animate-spin mb-4 text-zinc-400" />
              <h1 className="text-2xl font-black tamil-font animate-pulse tracking-tight">{t.appName} {t.loading}</h1>
          </div>
      );
  }

  return (
    <div className={`min-h-screen ${themeColor} flex flex-col md:flex-row font-sans text-zinc-900`}>
      <Toast message={toast.msg} show={toast.show} isError={toast.isError} onClose={() => setToast({ ...toast, show: false })} />
      
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-rose-600 text-white text-[10px] font-bold py-1 text-center z-[100] animate-in slide-in-from-top duration-300">
          {language === 'ta' ? 'ஆஃப்லைனில் உள்ளீர்கள் - சில வசதிகள் வேலை செய்யாது' : 'You are offline - some features may be limited'}
        </div>
      )}
      
      {/* Desktop Sidebar */}
      <aside className="sidebar-container hidden md:flex flex-col w-64 bg-zinc-950 text-zinc-300 h-screen sticky top-0 z-50 border-r border-zinc-800">
        <div className="p-6 flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full bg-white p-0.5" onError={(e) => e.currentTarget.style.display = 'none'} />
          <h1 className="text-2xl font-black tamil-font truncate text-white tracking-tight">{customAppName || t.appName}</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto hide-scrollbar">
          <button onClick={() => setActiveTab('warpers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'warpers' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 active:scale-95' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
            <Package size={18} />
            <span className="text-sm tracking-wide">{t.warpers}</span>
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300 ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 active:scale-95' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
            <UserIcon size={18} />
            <span className="text-sm tracking-wide">{t.profile}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white text-zinc-900 p-4 sticky top-0 z-40 border-b border-zinc-200 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-full bg-white p-0.5 shadow-sm" onError={(e) => e.currentTarget.style.display = 'none'} />
              <h1 className="text-xl font-black tamil-font truncate tracking-tight">{customAppName || t.appName}</h1>
              <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-zinc-200 transition" onClick={() => setActiveTab('profile')}>
                  {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover border border-zinc-200" />
                  ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                      </div>
                  )}
                  <span className="text-sm font-semibold hidden sm:block truncate max-w-[80px]">{user.name}</span>
              </div>
          </div>
          <div className="flex gap-3 items-center">
              <button onClick={toggleTheme} className="p-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-full transition">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              {isOnline && user.uid && <button onClick={() => window.location.reload()} className={`p-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 rounded-full transition ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>}
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex bg-white border-b border-zinc-200 p-5 sticky top-0 z-40 items-center justify-between">
          <h2 className="text-2xl font-black text-zinc-900 tamil-font tracking-tight">
            {activeTab === 'warpers' && t.warpers}
            {activeTab === 'profile' && t.profile}
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full transition">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {isOnline && user.uid && (
              <button onClick={() => window.location.reload()} className={`p-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-full transition ${isSyncing ? 'animate-spin' : ''}`}>
                <RefreshCw size={18} />
              </button>
            )}
              <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-full cursor-pointer hover:bg-zinc-200 transition border border-zinc-200" onClick={() => setActiveTab('profile')}>
                {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="text-sm font-semibold text-zinc-800 truncate max-w-[120px]">{user.name}</span>
              </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto p-0 md:p-8 ${themeColor} pb-20 md:pb-8`}>
          <div className="max-w-7xl mx-auto w-full">
            {activeTab === 'warpers' && <Warpers user={user} language={language} buttonColor={buttonColor} setToast={setToast} />}
            {activeTab === 'profile' && <Profile user={user} updateUser={(u) => { setUser(u); localStorage.setItem('warper_active_user', JSON.stringify(u)); }} onLogout={async () => { 
                await supabase.auth.signOut(); 
                setUser(GUEST_USER); 
                localStorage.removeItem('warper_active_user'); 
                sessionStorage.clear();
                window.location.reload(); 
            }} onLoginClick={() => setShowAuthModal(true)} onRestore={() => {}} language={language} onLanguageChange={(l) => { setLanguage(l); localStorage.setItem('warper_lang', l); }} onResetApp={() => {}} customAppName={customAppName} setCustomAppName={(name) => {
                setCustomAppName(name);
                localStorage.setItem('warper_custom_app_name', name);
            }} themeColor={themeColor} onThemeChange={handleThemeChange} buttonColor={buttonColor} onButtonColorChange={handleButtonColorChange} onBack={() => setActiveTab('warpers')} showInstallBtn={showInstallBtn} onInstall={handleInstallClick} />}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-zinc-100 flex justify-around items-center p-2 z-50 pb-safe-area shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button 
            onClick={() => setActiveTab('warpers')} 
            className={`flex flex-col items-center gap-1 p-2 px-6 rounded-2xl transition-all duration-300 ${activeTab === 'warpers' ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400'}`}
          >
            <Package size={22} className={activeTab === 'warpers' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black tamil-font">{t.warpers}</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center gap-1 p-2 px-6 rounded-2xl transition-all duration-300 ${activeTab === 'profile' ? 'text-emerald-600 bg-emerald-50' : 'text-zinc-400'}`}
          >
            <UserIcon size={22} className={activeTab === 'profile' ? 'scale-110' : ''} />
            <span className="text-[10px] font-black tamil-font">{t.profile}</span>
          </button>
        </nav>
      </div>
      {isLoading && <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[110] backdrop-blur-[1px]"><div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300"><Loader2 className="animate-spin text-zinc-600" size={40}/><p className="font-black text-gray-800 tamil-font">{t.saving}</p></div></div>}
      {showAuthModal && (
          <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm auth-modal">
              <div className="relative w-full max-w-sm">
                  <button onClick={() => setShowAuthModal(false)} className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition z-10">
                      <X size={24} />
                  </button>
                  <AuthScreen onLogin={u => { setUser(u); localStorage.setItem('warper_active_user', JSON.stringify(u)); setShowAuthModal(false); window.location.reload(); }} language={language} t={t} isOnline={isOnline} isModal={true} buttonColor={buttonColor} themeColor={themeColor} setToast={setToast} />
              </div>
          </div>
      )}
    </div>
  );
};

const AuthScreen: React.FC<{ onLogin: (u: User) => void; language: 'ta' | 'en'; t: any; isOnline: boolean; isModal?: boolean; buttonColor: string; themeColor: string; setToast: (t: { message: string; type: 'success' | 'error' | 'info' } | null) => void }> = ({ onLogin, t, isModal, buttonColor, themeColor, setToast }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
    const [loginId, setLoginId] = useState(''); // Email or Mobile for Login
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isSupabaseConfigured) {
          setToast({ message: t.dbNotConfiguredAlert, type: 'error' });
          return;
      }
      setIsLoading(true);
      try {
        if (mode === 'REGISTER') {
           const signUpData: any = { 
               email, 
               password, 
               options: { data: { name, mobile } } 
           };
           if (mobile) {
               signUpData.phone = mobile;
           }
           const { error } = await supabase.auth.signUp(signUpData);
           if (error) {
               if (error.message.toLowerCase().includes('phone') || error.message.toLowerCase().includes('provider')) {
                   const fallback = await supabase.auth.signUp({ email, password, options: { data: { name, mobile } } });
                   if (fallback.error) throw fallback.error;
                   setToast({ message: t.regSuccessPhoneNote, type: 'info' });
               } else {
                   throw error;
               }
           } else {
               setToast({ message: t.regSuccessLoginNow, type: 'success' });
           }
           setMode('LOGIN');
        } else if (mode === 'LOGIN') {
           const isMobile = /^\+?[0-9]{10,15}$/.test(loginId.trim());
           let authPromise;
           if (isMobile) {
               authPromise = supabase.auth.signInWithPassword({ phone: loginId.trim(), password });
           } else {
               authPromise = supabase.auth.signInWithPassword({ email: loginId.trim(), password });
           }
           
           const { data, error } = await authPromise;
           if (error) throw error;
           if (data.user) onLogin({ uid: data.user.id, email: data.user.email || '', name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || 'User', avatar: data.user.user_metadata?.avatar_url, mobile: data.user.user_metadata?.mobile, address: data.user.user_metadata?.address, isLoggedIn: true });
        } else {
           const { error } = await supabase.auth.resetPasswordForEmail(loginId);
           if (error) throw error;
           setToast({ message: t.resetLinkSent, type: 'success' });
           setMode('LOGIN');
        }
      } catch (err: any) { 
          if (err.message.includes('Invalid login credentials')) {
              setToast({ message: t.invalidCredentials, type: 'error' });
          } else {
              setToast({ message: err.message, type: 'error' }); 
          }
      }
      finally { setIsLoading(false); }
    };
    
    const content = (
         <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-gray-800 shadow-2xl">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-zinc-600 tamil-font mb-2">{t.loginRequired}</h2>
                    <p className="text-sm text-gray-500 font-bold">{t.pleaseLoginToContinue}</p>
                </div>
                <div className="flex gap-4 mb-6 bg-gray-100 p-1 rounded-2xl">
                    <button onClick={() => setMode('LOGIN')} className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${mode === 'LOGIN' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-400'}`}>{t.loginLabel}</button>
                    <button onClick={() => setMode('REGISTER')} className={`flex-1 py-2 rounded-xl font-bold text-sm transition ${mode === 'REGISTER' ? 'bg-white text-zinc-600 shadow-sm' : 'text-gray-400'}`}>{t.signUpLabel}</button>
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                  {mode === 'REGISTER' && (
                      <>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border focus:border-zinc-200" placeholder={t.name} required />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border focus:border-zinc-200" placeholder="Email" required />
                        <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border focus:border-zinc-200" placeholder={t.phone} required />
                      </>
                  )}
                  {mode === 'LOGIN' && (
                      <input type="text" value={loginId} onChange={e => setLoginId(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border focus:border-zinc-200" placeholder={t.emailOrMobile} required />
                  )}
                  {mode === 'FORGOT' && (
                      <input type="email" value={loginId} onChange={e => setLoginId(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border focus:border-zinc-200" placeholder="Email" required />
                  )}
                  {mode !== 'FORGOT' && <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-50 p-4 rounded-2xl font-bold outline-none border focus:border-zinc-200" placeholder="Password" required />}
                  
                  <button disabled={isLoading} className={`w-full ${buttonColor} text-white p-4 rounded-2xl font-black shadow-lg transition`}>
                      {isLoading ? <Loader2 className="animate-spin mx-auto"/> : mode === 'LOGIN' ? t.loginSignUp.split(' / ')[0] : mode === 'REGISTER' ? t.loginSignUp.split(' / ')[1] : t.sendResetLink}
                  </button>
                </form>
                
                {mode === 'LOGIN' && (
                   <div className="mt-4 text-center">
                       <button type="button" onClick={() => setMode('FORGOT')} className="text-sm font-bold text-gray-400 hover:text-zinc-600 transition">{t.forgotPassword}</button>
                   </div>
                )}
                
                {mode === 'FORGOT' && (
                   <div className="mt-4 text-center">
                       <button type="button" onClick={() => setMode('LOGIN')} className="text-sm font-bold text-gray-400 hover:text-zinc-600 transition">{t.backToLogin}</button>
                   </div>
                )}

                <div className="mt-6 text-center border-t pt-4">
                    <button type="button" onClick={() => onLogin({ uid: '', email: 'guest@warper.local', name: 'Guest', isLoggedIn: false })} className="text-zinc-600 font-bold text-sm hover:underline w-full">{t.skipLogin}</button>
                </div>
         </div>
    );

    if (isModal) {
        return content;
    }

    return (
      <div className={`min-h-screen ${themeColor} flex flex-col items-center justify-center p-6 text-white`}>
         <h1 className="text-4xl font-black tamil-font mb-8">Warper</h1>
         {content}
      </div>
    );
};

export default App;
