import { useState, useEffect } from 'react';
import { User, Transaction, ViewState, UserInvestment, ReferralCommissionLog } from '../types';
import { formatFCFA } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserCircle, Wallet, ArrowDownCircle, ArrowUpCircle, 
  History, Target, CheckSquare, Share2, LogOut, ChevronRight, ArrowLeft,
  CheckCircle2, Clock, Phone, Globe, Users, Gift, Copy, Moon, Sun, Download, 
  Package, MessageCircle, MessageSquare, TrendingUp, Info, HelpCircle, ChevronDown, Sparkles,
  ShieldCheck, Zap, AlertCircle, Undo2, XCircle, Send, ExternalLink
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from '../components/PWAInstallModal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getStoredFaq } from '../services/faqService';
import { getStoredSettings, getPlatformInviteLink } from '../services/appSettingsService';
import { 
  getUserInvestments, getTimeUntilNextCredit, 
  processAutomaticDailyRevenues, getReferralLogs 
} from '../services/investmentService';
import { getStoredUsers } from '../services/userService';
import { cancelWithdrawalByUser, getStoredTransactions } from '../services/transactionService';

interface AccountProps {
  user: User;
  onLogout: () => void;
  onTransaction: (type: 'DEPOSIT' | 'WITHDRAW') => void;
  onUpdateBalance?: (newBalance: number) => void;
  onChangeView?: (view: ViewState) => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export default function Account({ user, onLogout, onTransaction, onUpdateBalance, onChangeView, isDarkMode, toggleTheme }: AccountProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showMyProducts, setShowMyProducts] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<UserInvestment[]>([]);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const [referralLogs, setReferralLogs] = useState<ReferralCommissionLog[]>([]);
  const [referralsCount, setReferralsCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [faqCategory, setFaqCategory] = useState<string>('ALL');
  const [faqList, setFaqList] = useState(getStoredFaq());
  const [settings, setSettings] = useState(getStoredSettings());
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const { isInstallable, isIOS, install } = usePWAInstall();

  const loadTransactions = () => {
    const savedTxs = localStorage.getItem('coca_app_transactions');
    if (savedTxs) {
      try {
        const parsed: Transaction[] = JSON.parse(savedTxs);
        const sorted = parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sorted);
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadTransactions();
    const handleUpdate = () => loadTransactions();
    window.addEventListener('user_balance_updated', handleUpdate);
    window.addEventListener('coca_transactions_updated', handleUpdate);

    return () => {
      window.removeEventListener('user_balance_updated', handleUpdate);
      window.removeEventListener('coca_transactions_updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    const handleFaqUpdate = () => setFaqList(getStoredFaq());
    const handleSettingsUpdate = () => setSettings(getStoredSettings());

    window.addEventListener('coca_faq_updated', handleFaqUpdate);
    window.addEventListener('app_settings_updated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('coca_faq_updated', handleFaqUpdate);
      window.removeEventListener('app_settings_updated', handleSettingsUpdate);
    };
  }, []);

  useEffect(() => {
    if (showHistory) {
      loadTransactions();
    }
  }, [showHistory]);

  const handleCancelWithdrawal = (txId: string, amount: number) => {
    const ok = window.confirm(
      `Voulez-vous vraiment annuler votre demande de retrait de ${formatFCFA(amount)} ?\n\nLe montant sera immédiatement recrédité sur votre solde.`
    );
    if (!ok) return;

    const res = cancelWithdrawalByUser(txId, user.id);
    if (res.success) {
      loadTransactions();
      window.dispatchEvent(new Event('user_balance_updated'));
      alert(res.message);
    } else {
      alert(res.message);
    }
  };

  // Les demandes de retrait en cours pour cet utilisateur
  const pendingWithdrawals = transactions.filter(
    tx => tx.type === 'WITHDRAW' && tx.status === 'PENDING' && (tx.userId === user.id || tx.userPhone === user.phone || tx.userId === 'demo-user')
  );

  useEffect(() => {
    if (showMyProducts) {
      // Vérifier et créditer automatiquement les revenus 24h
      processAutomaticDailyRevenues(user.id);
      setInvestments(getUserInvestments(user.id));
      
      const savedProducts = localStorage.getItem('coca_app_my_products');
      if (savedProducts) {
        setMyProducts(JSON.parse(savedProducts));
      }

      // Intervalle pour faire défiler le compte à rebours 24h en temps réel
      const interval = setInterval(() => {
        setNowTick(Date.now());
      }, 1000);

      const handleInvestmentsUpdate = () => {
        setInvestments(getUserInvestments(user.id));
      };
      window.addEventListener('coca_investments_updated', handleInvestmentsUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener('coca_investments_updated', handleInvestmentsUpdate);
      };
    }
  }, [showMyProducts, user.id]);

  useEffect(() => {
    if (showReferral) {
      const logs = getReferralLogs(user.id);
      setReferralLogs(logs);
      const allUsers = getStoredUsers();
      const count = allUsers.filter(u => 
        (u.referredBy && (u.referredBy.toUpperCase() === user.referralCode.toUpperCase() || u.referredBy === user.id))
      ).length;
      setReferralsCount(count);
    }
  }, [showReferral, user.id, user.referralCode]);

  const handleCheckIn = () => {
    // Navigates directly to the Home screen where the detailed 7-day calendar is located.
    onChangeView?.('HOME');
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const platformLink = getPlatformInviteLink(user.referralCode);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(platformLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (showHistory) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="p-6 pb-24"
      >
        <button 
          onClick={() => setShowHistory(false)}
          className="flex items-center text-gray-600 dark:text-gray-400 mb-6 font-bold text-sm hover:text-[#F40009] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        <h2 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white mb-4">Historique</h2>

        {/* Bannière d'annulation rapide pour retraits en cours */}
        {pendingWithdrawals.length > 0 && (
          <div className="bg-amber-50 dark:bg-[#251e14] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 mb-5 shadow-sm">
            <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-xs mb-2">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Vous avez {pendingWithdrawals.length} demande{pendingWithdrawals.length > 1 ? 's' : ''} de retrait en attente</span>
            </div>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mb-3">
              Vous pouvez annuler un retrait à tout moment : l'argent est immédiatement réintégré dans votre solde.
            </p>
            <div className="space-y-2">
              {pendingWithdrawals.map(pw => (
                <div key={pw.id} className="bg-white dark:bg-[#1a1612] p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/30 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white block">{formatFCFA(pw.amount)}</span>
                    <span className="text-[10px] text-gray-400">{pw.method} • {new Date(pw.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button
                    onClick={() => handleCancelWithdrawal(pw.id, pw.amount)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Annuler le retrait</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-10">Aucune transaction trouvée.</p>
          ) : (
            transactions.map((tx) => {
              const isPendingWithdrawal = tx.type === 'WITHDRAW' && tx.status === 'PENDING';
              return (
                <div key={tx.id} className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] flex flex-col space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${tx.type === 'DEPOSIT' ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
                        {tx.type === 'DEPOSIT' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                          {tx.type === 'DEPOSIT' ? 'Dépôt' : 'Retrait'} ({tx.method})
                        </h4>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block font-bold text-sm ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{formatFCFA(tx.amount)}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-bold ${
                        tx.status === 'SUCCESS' ? 'text-green-600 dark:text-green-400' : 
                        tx.status === 'PENDING' ? 'text-amber-500' : 
                        tx.status === 'CANCELLED' ? 'text-gray-400 dark:text-gray-500' : 
                        'text-red-500'
                      }`}>
                        {tx.status === 'SUCCESS' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                         tx.status === 'PENDING' ? <Clock className="w-3 h-3 mr-1 animate-spin" style={{ animationDuration: '6s' }} /> : 
                         tx.status === 'CANCELLED' ? <Undo2 className="w-3 h-3 mr-1" /> : 
                         <AlertCircle className="w-3 h-3 mr-1" />}
                        {tx.status === 'SUCCESS' ? 'Réussi' : 
                         tx.status === 'PENDING' ? 'En attente' : 
                         tx.status === 'CANCELLED' ? 'Annulé (Remboursé)' : 
                         'Rejeté'}
                      </span>
                    </div>
                  </div>

                  {/* Bouton d'annulation de retrait en attente */}
                  {isPendingWithdrawal && (
                    <div className="pt-2 border-t border-gray-100 dark:border-[#2A2A2A] flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        Fonds bloqués temporairement
                      </span>
                      <button
                        onClick={() => handleCancelWithdrawal(tx.id, tx.amount)}
                        className="bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
                        title="Annuler ce retrait et reverser l'argent sur votre solde"
                      >
                        <Undo2 className="w-3.5 h-3.5 mr-1" />
                        <span>Annuler le retrait</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    );
  }

  if (showProfile) {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="p-6 pb-24"
      >
        <button 
          onClick={() => setShowProfile(false)}
          className="flex items-center text-gray-600 dark:text-gray-400 mb-6 font-bold text-sm hover:text-[#F40009] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        <h2 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white mb-6">Profil Personnel</h2>
        
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-[#333] flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-[#F40009] flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {user.id}</p>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de téléphone</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{user.phone}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pays</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{user.country}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#222] rounded-xl">
              <div className="flex items-center space-x-3">
                <Share2 className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Code Parrainage</span>
              </div>
              <span className="text-sm font-bold text-[#F40009]">{user.referralCode}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (showReferral) {
    const totalBonusesEarned = referralLogs.reduce((acc, l) => acc + l.amount, 0);
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="p-6 pb-24"
      >
        <button 
          onClick={() => setShowReferral(false)}
          className="flex items-center text-gray-600 dark:text-gray-400 mb-6 font-bold text-sm hover:text-[#F40009] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-950/40 rounded-xl text-[#F40009]">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white">Parrainage</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Invitez vos amis et gagnez sur leur 1er investissement</p>
          </div>
        </div>
        
        {/* Code Generator & Display */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-[#333] relative overflow-hidden mb-6 text-center space-y-4">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#F40009] rounded-full blur-3xl opacity-10"></div>
          
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-2">Votre Code Unique</h3>
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="bg-gray-50 dark:bg-[#222] border-2 border-dashed border-gray-200 dark:border-[#444] py-2.5 px-6 rounded-2xl">
                <span className="text-2xl font-black text-[#F40009] tracking-widest">{user.referralCode}</span>
              </div>
            </div>
            
            <button 
              onClick={handleCopyCode}
              className="w-full bg-gray-100 dark:bg-[#222] hover:bg-gray-200 dark:hover:bg-[#2a2a2a] text-gray-800 dark:text-gray-200 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-2 cursor-pointer border border-gray-200 dark:border-[#333]"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500">Code Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-500" />
                  <span>Copier uniquement le code</span>
                </>
              )}
            </button>
          </div>

          {/* Custom Platform Link */}
          <div className="pt-3 border-t border-gray-100 dark:border-[#2a2a2a] text-left">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Lien direct de la plateforme (Rejoindre) :
            </label>
            <div className="flex items-center bg-gray-50 dark:bg-[#222] rounded-xl p-2 border border-gray-200 dark:border-[#333]">
              <input 
                type="text" 
                readOnly 
                value={platformLink}
                className="bg-transparent flex-1 outline-none text-xs font-mono font-bold text-gray-800 dark:text-gray-200 px-2 truncate"
              />
              <button 
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#F40009] hover:bg-[#d60008] text-white rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center space-x-1"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lien Copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier le lien</span>
                  </>
                )}
              </button>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  const msg = `Rejoins la plateforme officielle Coca-Cola Invest pour investir et gagner chaque jour : ${platformLink}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const msg = `Rejoins la plateforme officielle Coca-Cola Invest pour investir et gagner chaque jour : ${platformLink}`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(platformLink)}&text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#333] flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-full flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Filleuls Inscrits</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{referralsCount}</p>
          </div>
          
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#333] flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-full flex items-center justify-center mb-3">
              <Gift className="w-6 h-6" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase mb-1">Bonus Encaissés</p>
            <p className="text-xl font-black text-emerald-600">{formatFCFA(totalBonusesEarned)}</p>
          </div>
        </div>

        {/* Official Rules Box */}
        <div className="bg-amber-50 dark:bg-[#251f15] border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-6 space-y-2 text-xs">
          <div className="flex items-center space-x-2 font-bold text-amber-900 dark:text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Règles strictes de calcul des commissions :</span>
          </div>
          <ul className="space-y-1.5 text-amber-800 dark:text-amber-300/90 pl-1 leading-relaxed">
            <li className="flex items-start space-x-1.5">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>1er Investissement uniquement :</strong> Les commissions de parrainage (18% N1, 2% N2, 1% N3) sont calculées et créditées exclusivement sur le tout premier achat de franchise d'un filleul.</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>Second investissement :</strong> Aucun commissionnement sur les réinvestissements ou achats secondaires.</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>Dépôt sans achat :</strong> Les recharges de compte simples ne génèrent aucune commission.</span>
            </li>
            <li className="flex items-start space-x-1.5">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>Offres gratuites & Ajustements :</strong> Les packs offerts par l'administrateur ou réajustements ne génèrent pas de commission.</span>
            </li>
          </ul>
        </div>

        {/* Commissions Log */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-[#222] border-b border-gray-100 dark:border-[#333] flex items-center justify-between">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
              Historique des Commissions Reçues ({referralLogs.length})
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              1er achat validé
            </span>
          </div>
          {referralLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              Aucune commission de parrainage pour le moment. Partagez votre code pour gagner dès le 1er achat de vos filleuls !
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-[#333]">
              {referralLogs.map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">
                      Filleul : {log.buyerName} <span className="text-[10px] text-gray-400">({log.buyerPhone})</span>
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Niveau {log.level} ({log.ratePercent}%) sur {log.productName} ({formatFCFA(log.productPrice)})
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(log.date).toLocaleDateString('fr-FR')} à {new Date(log.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600">
                      +{formatFCFA(log.amount)}
                    </span>
                    <span className="block text-[10px] text-emerald-500 font-semibold">Crédité</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (showMyProducts) {
    const activeInvestments = investments.length > 0 ? investments : myProducts.map((p, idx) => ({
      id: 'legacy-' + idx,
      userId: user.id,
      productId: p.id || idx,
      productName: p.name || 'Pack Coca-Cola',
      price: p.price || 0,
      daily: p.daily || 0,
      duration: p.duration || 90,
      image: p.image || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200&h=200",
      purchaseDate: p.date || new Date().toISOString(),
      lastCreditDate: p.date || new Date().toISOString(),
      daysElapsed: 0,
      totalEarned: 0,
      source: 'USER_PURCHASE' as const,
      status: 'ACTIVE' as const
    }));

    const generateChartData = () => {
      if (!activeInvestments.length) return [];
      const data = [];
      const today = new Date();
      let cumulative = 0;
      
      for (let i = 0; i <= 14; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        
        let dailySum = 0;
        activeInvestments.forEach(p => {
          dailySum += (p.daily || 0);
        });
        
        cumulative += dailySum;
        
        data.push({
          day: currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
          gains: cumulative
        });
      }
      return data;
    };

    const chartData = generateChartData();

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }}
        className="p-6 pb-24"
      >
        <button 
          onClick={() => setShowMyProducts(false)}
          className="flex items-center text-gray-600 dark:text-gray-400 mb-6 font-bold text-sm hover:text-[#F40009] dark:hover:text-[#F40009] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Retour
        </button>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white">Mes Franchises</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenus crédités automatiquement chaque jour après 24h</p>
          </div>
          <span className="bg-red-50 dark:bg-red-950/40 text-[#F40009] text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/50">
            {activeInvestments.length} actif{activeInvestments.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* 24h Auto-Credit Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10 border border-amber-300/40 dark:border-amber-800/40 rounded-2xl p-3.5 mb-6 flex items-start space-x-3 text-xs">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-gray-900 dark:text-white">
              Crédit Automatique après chaque cycle de 24h
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              Vos gains journaliers sont automatiquement versés sur votre solde toutes les 24 heures sans action requise.
            </p>
          </div>
        </div>
        
        {activeInvestments.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] p-8 rounded-2xl text-center border border-gray-100 dark:border-[#333]">
            <div className="w-16 h-16 bg-gray-50 dark:bg-[#222] rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Vous n'avez pas encore de franchise active.</p>
            <button 
              onClick={() => onChangeView?.('PRODUCTS')}
              className="mt-6 bg-[#F40009] text-white px-6 py-2 rounded-xl font-bold text-sm shadow-md cursor-pointer hover:bg-[#d60008] transition-colors"
            >
              Découvrir les offres
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#333]">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Évolution des gains (15 prochains jours)</h3>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGains" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#333' : '#eee'} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#888' : '#666' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#888' : '#666' }} width={40} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: isDarkMode ? '#1A1A1A' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: isDarkMode ? '#888' : '#666', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: number) => [formatFCFA(value), 'Gains']}
                    />
                    <Area type="monotone" dataKey="gains" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorGains)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              {activeInvestments.map((inv) => {
                const countdown = getTimeUntilNextCredit(inv.lastCreditDate);
                const isCompleted = inv.status === 'COMPLETED';

                return (
                  <div key={inv.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden">
                    <div className="p-4 flex items-center space-x-4 border-b border-gray-50 dark:border-[#333]">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-[#222] rounded-xl flex items-center justify-center flex-shrink-0">
                        <img 
                          src={inv.image || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200&h=200"} 
                          alt="Produit" 
                          className="w-8 h-8 object-contain mix-blend-multiply dark:mix-blend-normal" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate">{inv.productName}</h3>
                          {inv.source === 'ADMIN_GIFT' && (
                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Offre Admin (0 commission)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Souscrit le {new Date(inv.purchaseDate).toLocaleDateString('fr-FR')} à {new Date(inv.purchaseDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                        {isCompleted ? 'Terminé' : 'En cours'}
                      </div>
                    </div>

                    {/* 24h Live Countdown - Crédit 100% Automatique */}
                    {!isCompleted && (
                      <div className="px-4 py-2.5 bg-amber-50 dark:bg-[#221c13] border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                          <span>Prochain versement automatique :</span>
                          <span className="font-mono font-bold text-[#F40009]">{countdown.formatted}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300/50 dark:border-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Crédité auto</span>
                        </span>
                      </div>
                    )}
                    
                    <div className="p-4 grid grid-cols-2 gap-3 bg-gray-50/50 dark:bg-[#1f1f1f]">
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-0.5">Montant investi</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatFCFA(inv.price)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-0.5">Gain Quotidien</p>
                        <p className="text-sm font-bold text-[#F40009]">+{formatFCFA(inv.daily)} / 24h</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-0.5">Progression</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Jour {inv.daysElapsed} / {inv.duration}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase mb-0.5">Total Encaissé</p>
                        <p className="text-sm font-bold text-emerald-600">+{formatFCFA(inv.totalEarned)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  const menuGroups = [
    {
      title: 'Finances & Produits',
      items: [
        { icon: Wallet, label: 'Mon Portefeuille', action: () => onChangeView?.('HOME') },
        { icon: Package, label: 'Mes Produits', action: () => setShowMyProducts(true) },
        { icon: ArrowDownCircle, label: 'Faire un dépôt', action: () => onTransaction('DEPOSIT') },
        { icon: ArrowUpCircle, label: 'Demander un retrait', action: () => onTransaction('WITHDRAW') },
        { icon: History, label: 'Historique des transactions', action: () => setShowHistory(true) },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { icon: Target, label: 'Mes Missions', action: () => onChangeView?.('MISSIONS') },
        { icon: CheckSquare, label: 'Pointage quotidien', action: handleCheckIn },
        { icon: Share2, label: 'Parrainage', action: () => setShowReferral(true) },
      ]
    },
    {
      title: 'Assistance & Communauté',
      items: [
        { icon: Info, label: 'À Propos (Règles & Avantages)', action: () => onChangeView?.('ABOUT') },
        { 
          icon: HelpCircle, 
          label: 'Foire Aux Questions (FAQ)', 
          action: () => {
            const el = document.getElementById('faq-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          } 
        },
        { 
          icon: MessageCircle, 
          label: 'Support WhatsApp', 
          action: () => window.open('https://wa.me/22600000000?text=' + encodeURIComponent('Bonjour Support Coca-Cola Invest, j\'ai une question concernant mon compte.'), '_blank') 
        },
        { icon: MessageSquare, label: 'Canal Officiel', action: () => window.open('https://t.me/coca_cola_invest_channel', '_blank') },
      ]
    },
    {
      title: 'Paramètres',
      items: [
        { 
          icon: Download, 
          label: 'Télécharger l\'application (Installer sur mobile)', 
          action: () => setShowInstallModal(true)
        },
        { icon: isDarkMode ? Sun : Moon, label: isDarkMode ? 'Mode Clair' : 'Mode Sombre', action: () => toggleTheme?.() },
        { icon: UserCircle, label: 'Profil personnel', action: () => setShowProfile(true) },
        { icon: LogOut, label: 'Se déconnecter', action: onLogout },
      ]
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="p-6 pb-24"
    >
      <div className="flex items-center space-x-4 mb-8 bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-[#333]">
        <div className="w-16 h-16 rounded-full bg-[#F40009] flex items-center justify-center text-white font-bold text-2xl shadow-md">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="font-['Poppins'] text-lg font-bold text-gray-900 dark:text-white">{user.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone} ({user.country})</p>
          <div className="mt-1 inline-block bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Code: {user.referralCode}
          </div>
        </div>
      </div>

      {/* Alerte si des demandes de retrait sont en cours d'attente */}
      {pendingWithdrawals.length > 0 && (
        <div className="mb-6 bg-amber-50 dark:bg-[#251e14] border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Demande de retrait en attente ({pendingWithdrawals.length})</span>
            </div>
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full">
              En cours
            </span>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mb-3">
            Vous avez une demande de retrait en attente. Vous pouvez l'annuler ci-dessous à tout moment pour que vos fonds soient immédiatement recrédités.
          </p>
          <div className="space-y-2">
            {pendingWithdrawals.map(pw => (
              <div key={pw.id} className="bg-white dark:bg-[#1a1612] p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/30 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm text-gray-900 dark:text-white block">{formatFCFA(pw.amount)}</span>
                  <span className="text-[10px] text-gray-400">{pw.method} • {new Date(pw.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <button
                  onClick={() => handleCancelWithdrawal(pw.id, pw.amount)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Annuler le retrait</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
              {group.title}
            </h3>
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-50 dark:border-[#333] overflow-hidden">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={itemIdx}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:bg-[#222] transition-colors ${
                      itemIdx !== group.items.length - 1 ? 'border-b border-gray-50 dark:border-[#333]' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                      <Icon className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ & WhatsApp Support Section */}
      <div id="faq-section" className="mt-10 space-y-4">
        <div className="flex items-center space-x-3 px-1">
          <div className="p-2.5 bg-red-100 dark:bg-red-950/60 rounded-xl text-[#F40009]">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-['Poppins'] text-lg font-bold text-gray-900 dark:text-white">
              Foire Aux Questions (FAQ)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Questions & réponses sur les gains, retraits et franchises
            </p>
          </div>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'ALL', label: 'Toutes les questions' },
            { id: 'Gains', label: 'Gains & Produits' },
            { id: 'Retraits', label: 'Retraits & Délais' },
            { id: 'Dépôts', label: 'Dépôts' },
            { id: 'Parrainage', label: 'Parrainage' },
            { id: 'Sécurité', label: 'Sécurité' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFaqCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                faqCategory === cat.id
                  ? 'bg-[#F40009] text-white shadow-sm'
                  : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-[#333] hover:border-red-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion Questions */}
        <div className="space-y-2.5">
          {faqList
            .filter((item) => faqCategory === 'ALL' || item.category.toLowerCase().includes(faqCategory.toLowerCase()))
            .map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div 
                  key={faq.id}
                  className={`bg-white dark:bg-[#1A1A1A] rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'border-red-500/40 shadow-md shadow-red-500/5 dark:border-red-500/40' 
                      : 'border-gray-100 dark:border-[#333] shadow-sm hover:border-gray-200 dark:hover:border-[#444]'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex-1">
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-[#2A2A2A] text-gray-500 dark:text-gray-400 mb-1.5">
                        {faq.category}
                      </span>
                      <h4 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
                        {faq.question}
                      </h4>
                    </div>
                    <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-[#222] text-gray-500 dark:text-gray-400 transform transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-[#F40009] bg-red-50 dark:bg-red-950/40' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-50 dark:border-[#262626]">
                          <div className="flex items-start space-x-2.5 bg-gray-50/70 dark:bg-[#202020] p-3 rounded-xl border border-gray-100 dark:border-[#2a2a2a]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p>{faq.answer}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>

        {/* WhatsApp Customer Support Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0D2418] via-[#103822] to-[#0A1F14] p-5 text-white border border-emerald-500/30 shadow-xl mt-6">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Support & Canaux Officiels
              </span>
            </div>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-200">
              Assistance 7j/7
            </span>
          </div>

          <h4 className="font-['Poppins'] font-bold text-base sm:text-lg text-white mb-1.5 relative z-10">
            Besoin d'aide ou d'échanger avec la communauté ?
          </h4>
          <p className="text-xs text-gray-300 leading-relaxed mb-4 relative z-10">
            Nos agents du service client et nos communautés sont à votre disposition pour vos dépôts, retraits et questions sur vos investissements.
          </p>

          <div className="space-y-2.5 relative z-10">
            {/* Service Client WhatsApp Direct */}
            <button
              id="whatsapp-faq-support-btn"
              onClick={() => {
                const phone = settings.customerServiceWhatsapp || settings.supportWhatsappNumber || '22600000000';
                if (phone.startsWith('http')) {
                  window.open(phone, '_blank');
                  return;
                }
                const cleanPhone = phone.replace(/\D/g, '');
                const msg = encodeURIComponent("Bonjour Service Client Coca-Cola Invest, j'ai une question concernant mon compte.");
                window.open(`https://wa.me/${cleanPhone || '22600000000'}?text=${msg}`, '_blank');
              }}
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <MessageCircle className="w-5 h-5 fill-current" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold">Service Client Direct WhatsApp</div>
                  <div className="text-[10px] text-emerald-100 font-normal">Contact immédiat avec un conseiller officiel</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>

            {/* Service Client Telegram si configuré */}
            {settings.customerServiceTelegram && (
              <a
                href={settings.customerServiceTelegram.startsWith('http') ? settings.customerServiceTelegram : `https://t.me/${settings.customerServiceTelegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-between shadow-md active:scale-98 transition-all"
              >
                <div className="flex items-center space-x-2.5">
                  <Send className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-bold">Service Client Telegram</div>
                    <div className="text-[10px] text-sky-100 font-normal">Assistance directe via Telegram</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </a>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {/* Groupe WhatsApp VIP */}
              {(settings.whatsappGroupLink || settings.supportWhatsappGroupLink) && (
                <a
                  href={settings.whatsappGroupLink || settings.supportWhatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-900/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Groupe WhatsApp VIP (10h-18h)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              )}

              {/* Canal Telegram Officiel */}
              {(settings.telegramChannelLink || settings.supportTelegramLink) && (
                <a
                  href={settings.telegramChannelLink || settings.supportTelegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-sky-950/60 hover:bg-sky-950/80 border border-sky-500/40 text-sky-200 py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>Canal Telegram Officiel</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                </a>
              )}

              {/* Groupe Telegram */}
              {settings.telegramGroupLink && (
                <a
                  href={settings.telegramGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:col-span-2 bg-blue-950/60 hover:bg-blue-950/80 border border-blue-500/40 text-blue-200 py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Groupe Telegram des Investisseurs (10h-18h)</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full mt-8 bg-red-50 dark:bg-red-950/40 text-[#F40009] hover:bg-red-100 dark:hover:bg-red-950/70 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
      >
        <LogOut className="h-5 w-5" />
        <span>Se déconnecter</span>
      </button>

      {/* Discreet Admin Portal Link - Uniquement visible si rôle ADMIN */}
      {user.role === 'ADMIN' && (
        <div className="mt-8 pt-4 pb-2 border-t border-gray-100 dark:border-[#222] text-center">
          <button
            id="secret-admin-portal-link"
            onClick={() => onChangeView?.('ADMIN')}
            className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-gray-400 dark:text-neutral-600 hover:text-[#F40009] dark:hover:text-red-400 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-900"
            title="Accès Administrateur"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Portail Administrateur Privé</span>
          </button>
          <p className="text-[10px] text-gray-300 dark:text-neutral-700 mt-1">
            Connecté en tant qu'Administrateur
          </p>
        </div>
      )}

      <PWAInstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
      />
    </motion.div>
  );
}
