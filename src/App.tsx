import { useState, useEffect } from 'react';
import { ViewState, User, Transaction } from './types';
import Login from './components/Login';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Products from './pages/Products';
import Team from './pages/Team';
import Account from './pages/Account';
import Missions from './pages/Missions';
import About from './pages/About';
import Admin from './pages/Admin';
import WelcomeModal from './components/WelcomeModal';
import TransactionModal from './components/TransactionModal';
import LiveNotification from './components/LiveNotification';
import { getStoredSettings, AppSettings } from './services/appSettingsService';
import { processAutomaticDailyRevenues } from './services/investmentService';
import { checkTchinStatus, claimTchinPayment } from './services/tchinService';
import { adjustUserBalance, updateUser, verifyServerSession, logoutUser } from './services/userService';
import { getTransactionsFromFirestore, addTransactionToFirestore } from './services/transactionService';
import { formatFCFA } from './utils';
import { Wrench, ShieldAlert, Sparkles, Clock, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [user, setUser] = useState<User | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [transactionType, setTransactionType] = useState<'DEPOSIT' | 'WITHDRAW' | null>(null);
  const [loadingInitialAuth, setLoadingInitialAuth] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [revenueNotification, setRevenueNotification] = useState<{ amount: number; count: number; date: string } | null>(null);
  const [tchinReturnNotice, setTchinReturnNotice] = useState<{
    status: 'checking' | 'success' | 'pending' | 'failed' | 'canceled';
    message: string;
    token?: string;
    amount?: number;
  } | null>(null);

  const checkAdminUrl = () => {
    try {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      return (
        path.endsWith('/admin') ||
        path.endsWith('/admin/') ||
        search.includes('admin=') ||
        search.includes('?admin') ||
        hash.includes('admin')
      );
    } catch {
      return false;
    }
  };

  useEffect(() => {
    // Listen to settings update
    const handleSettingsUpdate = () => setSettings(getStoredSettings());
    window.addEventListener('app_settings_updated', handleSettingsUpdate);

    // Listen to user updates
    const handleUserBalanceSync = () => {
      const savedUser = localStorage.getItem('coca_app_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error(e);
        }
      }
    };
    window.addEventListener('user_balance_updated', handleUserBalanceSync);

    const initAuth = async () => {
      try {
        const verifiedUser = await verifyServerSession();
        if (verifiedUser) {
          setUser(verifiedUser);
          
          if (checkAdminUrl()) {
            setView('ADMIN');
          } else {
            setView('HOME');
          }
        } else {
          setUser(null);
          localStorage.removeItem('coca_app_user');
          if (checkAdminUrl()) {
            setView('ADMIN');
          } else {
            setView('LOGIN');
          }
        }
      } catch (err) {
        console.error(err);
        setUser(null);
        setView('LOGIN');
      } finally {
        setLoadingInitialAuth(false);
      }
    };

    initAuth();
    
    // ... theme and popstate logic ...

    const savedTheme = localStorage.getItem('coca_app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-black');
      document.body.classList.remove('bg-white');
    } else {
      document.body.classList.add('bg-white');
      document.body.classList.remove('bg-black');
    }

    // Listen to URL changes (back/forward or hash change)
    const handleUrlChange = () => {
      if (checkAdminUrl()) {
        setView('ADMIN');
      } else {
        // Si l'utilisateur tente de naviguer via l'historique sans session valide, refuser et renvoyer à login
        const token = localStorage.getItem('coca_app_session_token');
        if (!token) {
          setUser(null);
          setView('LOGIN');
        }
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('app_settings_updated', handleSettingsUpdate);
      window.removeEventListener('user_balance_updated', handleUserBalanceSync);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Automated Daily Revenue Credit Loop (credits automatically every 24h)
  useEffect(() => {
    if (!user) return;

    // Process immediately
    processAutomaticDailyRevenues(user.id);

    // Re-check periodically every 25 seconds
    const interval = setInterval(() => {
      processAutomaticDailyRevenues(user.id);
    }, 25000);

    const handleRevenueCredited = (e: any) => {
      const amt = e.detail?.amount ?? e.detail?.totalAmountCredited ?? 0;
      if (e.detail && amt > 0) {
        setRevenueNotification({
          ...e.detail,
          amount: amt,
          count: e.detail.count ?? e.detail.creditedCount ?? 1
        });
        setTimeout(() => {
          setRevenueNotification(null);
        }, 7000);
      }
    };

    window.addEventListener('coca_revenue_credited', handleRevenueCredited);

    return () => {
      clearInterval(interval);
      window.removeEventListener('coca_revenue_credited', handleRevenueCredited);
    };
  }, [user?.id]);

  // Handle return from Tchin Payment Page (?status=success&token=... or ?status=cancel)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      const statusParam = searchParams.get('status');

      if (!token && !statusParam) return;

      if (statusParam === 'cancel') {
        setTchinReturnNotice({
          status: 'canceled',
          message: "Paiement annulé sur la page Tchin. Aucun montant n'a été débité.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setTchinReturnNotice(null), 5000);
        return;
      }

      if (token) {
        const processedKey = 'tchin_processed_' + token;
        if (sessionStorage.getItem(processedKey)) {
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }

        setTchinReturnNotice({
          status: 'checking',
          message: "Vérification de votre paiement Tchin auprès de l'opérateur Mobile Money...",
          token,
        });

        let pollCount = 0;
        const verifyPayment = async () => {
          try {
            const res = await checkTchinStatus(token);
            if (res.status === 'successful') {
              const depositAmount = Number(res.amount) || 6000;
              
              // Load active user
              const savedUserStr = localStorage.getItem('coca_app_user');
              if (savedUserStr) {
                const currentUser: User = JSON.parse(savedUserStr);

                // Lock and claim atomically on the server
                const claimRes = await claimTchinPayment(token, currentUser.id, depositAmount);
                if (!claimRes.success && claimRes.alreadyClaimed) {
                  sessionStorage.setItem(processedKey, '1');
                  window.history.replaceState({}, document.title, window.location.pathname);
                  return;
                }

                sessionStorage.setItem(processedKey, '1');
                adjustUserBalance(currentUser.id, 'ADD', depositAmount);
                updateUser(currentUser.id, {
                  totalDeposits: (currentUser.totalDeposits || 0) + depositAmount,
                });

                addTransactionToFirestore({
                  userId: currentUser.id,
                  userName: currentUser.name,
                  userPhone: currentUser.phone,
                  type: 'DEPOSIT',
                  amount: depositAmount,
                  method: 'Page Tchin Sécurisée',
                  status: 'SUCCESS',
                  reference: `TCHIN-${token.substring(0, 8).toUpperCase()}`,
                  note: `Recharge Mobile Money validée et vérifiée avec succès auprès de l'opérateur (Réf: ${token}).`,
                });

                setUser({
                  ...currentUser,
                  balance: currentUser.balance + depositAmount,
                  totalDeposits: (currentUser.totalDeposits || 0) + depositAmount,
                });
              }

              setTchinReturnNotice({
                status: 'success',
                message: `Paiement vérifié avec succès ! Votre portefeuille a été crédité de ${formatFCFA(depositAmount)}.`,
                amount: depositAmount,
                token,
              });

              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => setTchinReturnNotice(null), 8000);
              return;
            }

            if (res.status === 'failed') {
              setTchinReturnNotice({
                status: 'failed',
                message: "Le paiement a été rejeté ou annulé par l'opérateur Mobile Money.",
                token,
              });
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => setTchinReturnNotice(null), 6000);
              return;
            }

            // Still pending: check twice more at 3-second intervals
            pollCount++;
            if (pollCount < 3) {
              setTimeout(verifyPayment, 3000);
            } else {
              setTchinReturnNotice({
                status: 'pending',
                message: "Paiement en attente de confirmation par votre opérateur Mobile Money. Le crédit sera effectif dès réception de la confirmation.",
                token,
              });
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => setTchinReturnNotice(null), 8000);
            }
          } catch (e) {
            console.warn("Erreur vérification retour Tchin", e);
          }
        };

        verifyPayment();
      }
    } catch (e) {
      console.error("Erreur parsing retour Tchin", e);
    }
  }, []);

  const handleNavigateView = (newView: ViewState) => {
    if (newView === 'ADMIN') {
      if (!window.location.pathname.includes('/admin') && !window.location.search.includes('admin')) {
        try {
          window.history.pushState({}, '', '/admin');
        } catch {
          window.location.hash = '#admin';
        }
      }
    } else if (view === 'ADMIN') {
      try {
        window.history.pushState({}, '', '/');
      } catch {
        window.location.hash = '';
      }
    }
    setView(newView);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('bg-black');
        document.body.classList.remove('bg-white');
        localStorage.setItem('coca_app_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.add('bg-white');
        document.body.classList.remove('bg-black');
        localStorage.setItem('coca_app_theme', 'light');
      }
      return newTheme;
    });
  };

  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('coca_app_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setView('HOME');
    setShowWelcome(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setView('LOGIN');
    // Remplacer l'historique du navigateur pour empêcher le retour en arrière vers les pages privées
    window.history.replaceState({}, document.title, '/');
  };

  const handleUpdateBalance = (newBalance: number) => {
    if (user) {
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      localStorage.setItem('coca_app_user', JSON.stringify(updatedUser));
    }
  };

  if (loadingInitialAuth) {
    return <div className="flex flex-col h-screen max-w-md mx-auto items-center justify-center bg-[#F40009] text-white">Chargement...</div>;
  }

  // Render Admin interface if view is ADMIN (accessible only to admin or direct authorized portal)
  if (view === 'ADMIN') {
    if (user && user.role !== 'ADMIN') {
      return (
        <div className="flex flex-col h-screen max-w-md mx-auto items-center justify-center bg-gray-50 dark:bg-[#111] p-6 text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mb-3" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Accès Restreint</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Cet espace est strictement réservé aux administrateurs autorisés.
          </p>
          <button
            onClick={() => setView('HOME')}
            className="px-5 py-2.5 bg-[#F40009] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Retourner à l'accueil
          </button>
        </div>
      );
    }
    return (
      <Admin 
        onBackToApp={() => handleNavigateView(user ? 'HOME' : 'LOGIN')} 
        onChangeView={handleNavigateView} 
      />
    );
  }

  // Maintenance screen if activated by Admin
  if (settings.isMaintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen max-w-md mx-auto items-center justify-center p-6 bg-gradient-to-b from-gray-900 to-black text-white text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-6 text-amber-400">
          <Wrench className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="font-['Poppins'] text-2xl font-bold mb-3">Maintenance en cours</h1>
        <p className="text-sm text-gray-300 leading-relaxed mb-8 max-w-xs">
          {settings.maintenanceMessage}
        </p>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-400">
          Nos équipes techniques travaillent activement pour rétablir les services. Merci de votre patience.
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => handleNavigateView('ADMIN')}
            className="mt-12 text-[11px] text-gray-600 hover:text-gray-400 underline cursor-pointer"
          >
            Accès Administration
          </button>
        )}
      </div>
    );
  }

  // If user account is suspended by Admin
  if (user && user.isBlocked) {
    return (
      <div className="flex flex-col min-h-screen max-w-md mx-auto items-center justify-center p-6 bg-white dark:bg-[#111] text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/40 text-[#F40009] flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Compte Suspendu</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
          Votre compte a été temporairement restreint par l'administration. Veuillez contacter le service client WhatsApp pour régulariser votre situation.
        </p>
        <button 
          onClick={handleLogout}
          className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  if (view === 'LOGIN' || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 dark:bg-[#111] shadow-2xl overflow-hidden relative transition-colors duration-300">
      <LiveNotification />
      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Floating Tchin Payment Return Notification Banner */}
      {tchinReturnNotice && (
        <div className={`absolute top-4 left-4 right-4 z-50 p-4 rounded-2xl shadow-2xl flex items-start space-x-3 border backdrop-blur-md transition-all ${
          tchinReturnNotice.status === 'success'
            ? 'bg-emerald-600 text-white border-emerald-400'
            : tchinReturnNotice.status === 'checking'
            ? 'bg-blue-600 text-white border-blue-400'
            : tchinReturnNotice.status === 'pending'
            ? 'bg-amber-600 text-white border-amber-400'
            : 'bg-red-600 text-white border-red-400'
        }`}>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
            {tchinReturnNotice.status === 'success' && <CheckCircle2 className="w-6 h-6 text-white" />}
            {tchinReturnNotice.status === 'checking' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
            {tchinReturnNotice.status === 'pending' && <Clock className="w-6 h-6 text-white" />}
            {(tchinReturnNotice.status === 'failed' || tchinReturnNotice.status === 'canceled') && (
              <AlertCircle className="w-6 h-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-sm text-white">
              {tchinReturnNotice.status === 'success' && 'Recharge Tchin confirmée !'}
              {tchinReturnNotice.status === 'checking' && 'Vérification du paiement...'}
              {tchinReturnNotice.status === 'pending' && 'Validation en cours'}
              {tchinReturnNotice.status === 'canceled' && 'Paiement annulé'}
              {tchinReturnNotice.status === 'failed' && 'Échec du paiement'}
            </p>
            <p className="opacity-90 mt-0.5 leading-relaxed">{tchinReturnNotice.message}</p>
          </div>
          <button 
            onClick={() => setTchinReturnNotice(null)}
            className="text-white/80 hover:text-white p-1 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating 24h Automatic Revenue Notification */}
      {revenueNotification && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-emerald-600 text-white p-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-400">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <p className="font-bold text-sm text-white">Revenus 24h crédités automatiquement !</p>
            <p className="text-emerald-100">
              +{formatFCFA(revenueNotification.amount)} ajoutés à votre solde ({revenueNotification.count} franchise{revenueNotification.count > 1 ? 's' : ''}).
            </p>
          </div>
          <button 
            onClick={() => setRevenueNotification(null)}
            className="text-white/80 hover:text-white p-1 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      
      <TransactionModal 
        isOpen={transactionType !== null} 
        type={transactionType} 
        country={user.country}
        onClose={() => setTransactionType(null)} 
        onUpdateBalance={handleUpdateBalance}
        currentBalance={user.balance}
        onNavigateView={handleNavigateView}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {view === 'HOME' && <Home user={user} onTransaction={setTransactionType} onUpdateBalance={handleUpdateBalance} />}
        {view === 'PRODUCTS' && <Products user={user} onUpdateBalance={handleUpdateBalance} onTransaction={setTransactionType} />}
        {view === 'TEAM' && <Team user={user} />}
        {view === 'ACCOUNT' && <Account user={user} onLogout={handleLogout} onTransaction={setTransactionType} onUpdateBalance={handleUpdateBalance} onChangeView={handleNavigateView} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
        {view === 'MISSIONS' && <Missions user={user} onUpdateBalance={handleUpdateBalance} onChangeView={handleNavigateView} />}
        {view === 'ABOUT' && <About onChangeView={handleNavigateView} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav currentView={view} onViewChange={handleNavigateView} />
    </div>
  );
}
