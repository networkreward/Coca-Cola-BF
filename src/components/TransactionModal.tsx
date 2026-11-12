import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Wallet, CheckCircle2, Info, Smartphone, 
  ArrowLeft, Loader2, ShieldCheck, AlertCircle, RefreshCw,
  Lock, ArrowDownLeft, ArrowUpRight, ChevronRight, Sparkles,
  Copy, Check, ExternalLink, Zap, Globe, Clock, Send
} from 'lucide-react';
import { Country, Transaction, PaymentMethod, TchinMethod, ViewState, CountryConfig } from '../types';
import { getStoredTransactions, saveTransactions } from '../services/transactionService';
import { adjustUserBalance, updateUser, getStoredUsers } from '../services/userService';
import { getStoredSettings } from '../services/appSettingsService';
import { getUserInvestments } from '../services/investmentService';
import { 
  formatPhoneWithCountry, 
  getCountryInfo,
  getActiveCountries,
  validateBeneficiaryName,
  validatePhoneForCountry
} from '../services/countryService';
import { 
  fetchTchinMethods, 
  createTchinPaymentToken, 
  chargeTchinPayment, 
  checkTchinStatus,
  simulateTchinSuccess,
  claimTchinPayment
} from '../services/tchinService';
import { formatFCFA, checkWithdrawalAvailability, getDepositScheduleInfo } from '../utils';

interface TransactionModalProps {
  isOpen: boolean;
  type: 'DEPOSIT' | 'WITHDRAW' | null;
  country: Country;
  onClose: () => void;
  onUpdateBalance?: (newBalance: number) => void;
  currentBalance?: number;
  onNavigateView?: (view: ViewState) => void;
}

type DepositStep = 'AMOUNT_AND_METHOD' | 'WAITING_PAGE' | 'FAILED';

export const COUNTRY_OPERATORS: Record<string, { code: string; name: string }[]> = {
  CI: [
    { code: 'WAVE_CI', name: 'Wave CI' },
    { code: 'OM_CI', name: 'Orange Money CI' },
    { code: 'MTN_CI', name: 'MTN MoMo CI' },
    { code: 'MOOV_CI', name: 'Moov Africa CI' },
  ],
  BF: [
    { code: 'OM_BF', name: 'Orange Money BF' },
    { code: 'MOOV_BF', name: 'Moov Africa BF' },
    { code: 'WAVE_BF', name: 'Wave BF' },
  ],
  BJ: [
    { code: 'MTN_BJ', name: 'MTN MoMo Bénin' },
    { code: 'MOOV_BJ', name: 'Moov Africa Bénin' },
    { code: 'CELTIIS_BJ', name: 'Celtiis Cash Bénin' },
  ],
  TG: [
    { code: 'TMONEY_TG', name: 'T-Money (Togocom)' },
    { code: 'MOOV_TG', name: 'Moov Africa Togo' },
  ],
  SN: [
    { code: 'WAVE_SN', name: 'Wave Sénégal' },
    { code: 'OM_SN', name: 'Orange Money Sénégal' },
    { code: 'FREE_SN', name: 'Free Money SN' },
  ],
  NE: [
    { code: 'AIRTEL_NE', name: 'Airtel Money Niger' },
    { code: 'MOOV_NE', name: 'Moov Africa Niger' },
    { code: 'AL_IZZA_NE', name: 'Al-Izza Niger' },
  ],
  CM: [
    { code: 'MTN_CM', name: 'MTN MoMo Cameroun' },
    { code: 'OM_CM', name: 'Orange Money Cameroun' },
  ],
  ML: [
    { code: 'OM_ML', name: 'Orange Money Mali' },
    { code: 'MOOV_ML', name: 'Moov Africa Mali' },
    { code: 'WAVE_ML', name: 'Wave Mali' },
  ],
};

export default function TransactionModal({ 
  isOpen, 
  type, 
  country, 
  onClose, 
  onUpdateBalance, 
  currentBalance = 0,
  onNavigateView
}: TransactionModalProps) {
  // Modal active tab
  const [activeTab, setActiveTab] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');

  // Shared inputs & state
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Horaires officiels :
  // - Retraits : disponibles de 10h-18h de lundi au vendredi
  // - Dépôts : disponibles 24h/24
  const withdrawalSchedule = checkWithdrawalAvailability();
  const depositSchedule = getDepositScheduleInfo();
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: 'DEPOSIT' | 'WITHDRAW';
    grossAmount: number;
    netAmount?: number;
    feeAmount?: number;
    method: string;
    phone: string;
    isAutomated?: boolean;
    reference?: string;
  } | null>(null);

  // User & Investments info
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeInvestmentsCount, setActiveInvestmentsCount] = useState<number>(0);

  // Deposit specific
  const [tchinOperators, setTchinOperators] = useState<TchinMethod[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<TchinMethod | null>(null);
  const [depositStep, setDepositStep] = useState<DepositStep>('AMOUNT_AND_METHOD');
  const [customerPhone, setCustomerPhone] = useState('');
  const [smsFastRef, setSmsFastRef] = useState('');
  const [statusFeedback, setStatusFeedback] = useState('');
  const [tchinToken, setTchinToken] = useState('');
  const [tchinMessage, setTchinMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Withdrawal specific
  const [withdrawCountry, setWithdrawCountry] = useState<string>(country || 'CI');
  const [activeCountries, setActiveCountries] = useState<CountryConfig[]>(() => getActiveCountries());
  const [withdrawOperator, setWithdrawOperator] = useState<string>('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawBeneficiaryName, setWithdrawBeneficiaryName] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const pollingRef = useRef<any>(null);
  const settings = getStoredSettings();

  useEffect(() => {
    const handleCountriesUpdate = () => {
      setActiveCountries(getActiveCountries());
    };
    window.addEventListener('app_countries_updated', handleCountriesUpdate);
    return () => window.removeEventListener('app_countries_updated', handleCountriesUpdate);
  }, []);

  useEffect(() => {
    if (country) {
      setWithdrawCountry(country);
    }
  }, [country, isOpen]);

  useEffect(() => {
    const cOps = COUNTRY_OPERATORS[withdrawCountry.toUpperCase()] || [
      { code: 'MM', name: 'Mobile Money' },
      { code: 'WAVE', name: 'Wave' },
    ];
    if (cOps.length > 0) {
      setWithdrawOperator(cOps[0].name);
    }
  }, [withdrawCountry]);

  // Constantes de règles financières
  const MIN_DEPOSIT = Math.max(6000, settings.minDeposit || 6000);
  const MIN_WITHDRAWAL = Math.min(1000, settings.minWithdrawal || 1000);
  const WITHDRAWAL_FEE_PERCENT = 10; // 10% de frais sur tous les retraits

  // Synchronisation du type d'ouverture
  useEffect(() => {
    if (type) {
      setActiveTab(type);
      setDepositStep('AMOUNT_AND_METHOD');
      setErrorMessage('');
      setWithdrawError('');
      setAmount('');
      setStatusFeedback('');
      setSmsFastRef('');
    }
  }, [type, isOpen]);

  // Chargement des données utilisateur, investissements et opérateurs
  useEffect(() => {
    if (isOpen) {
      try {
        const u = localStorage.getItem('coca_app_user');
        if (u) {
          const parsed = JSON.parse(u);
          setCurrentUser(parsed);
          
          // Formater numéro par défaut
          if (parsed?.phone) {
            const clean = parsed.phone.replace(/\s+/g, '').replace(/^\+225|^\+226|^\+228/, '');
            setCustomerPhone(clean);
            setWithdrawPhone(clean);
          }
          if (parsed?.name) {
            setWithdrawBeneficiaryName(parsed.name);
          }

          // Vérifier les investissements actifs pour la condition de retrait
          if (parsed?.id) {
            const userInvs = getUserInvestments(parsed.id);
            const activeInvs = userInvs.filter(inv => inv.status === 'ACTIVE');
            setActiveInvestmentsCount(activeInvs.length);
          }
        }
      } catch (e) {
        console.error('Erreur chargement utilisateur', e);
      }

      // Charger opérateurs Tchin (Mobile Money direct)
      const loadOperators = async () => {
        try {
          const ops = await fetchTchinMethods(country);
          // Filtrer rigoureusement : pas de virement ou carte bancaire
          const mmOnly = (Array.isArray(ops) ? ops : []).filter(op => {
            const low = (op.name + ' ' + (op.code || '')).toLowerCase();
            return !low.includes('bank') && !low.includes('carte') && !low.includes('virement');
          });
          setTchinOperators(mmOnly);
          if (mmOnly.length > 0 && !withdrawOperator) {
            setWithdrawOperator(mmOnly[0].name);
          }
        } catch (e) {
          console.error('Erreur chargement opérateurs', e);
        }
      };

      loadOperators();
    }
  }, [isOpen, country]);

  // Nettoyer polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleResetModal = () => {
    stopPolling();
    setDepositStep('AMOUNT_AND_METHOD');
    setSelectedOperator(null);
    setTchinToken('');
    setTchinMessage('');
    setRedirectUrl('');
    setErrorMessage('');
    setWithdrawError('');
    setLoading(false);
    setSuccess(false);
    setSuccessData(null);
    setSmsFastRef('');
    setStatusFeedback('');
  };

  const handleClose = () => {
    handleResetModal();
    onClose();
  };

  // Calculs en temps réel pour le retrait
  const grossWithdrawAmount = Number(amount) || 0;
  const withdrawFeeAmount = Math.round(grossWithdrawAmount * (WITHDRAWAL_FEE_PERCENT / 100));
  const netWithdrawAmount = Math.max(0, grossWithdrawAmount - withdrawFeeAmount);
  const remainingBalanceAfterWithdraw = (currentBalance ?? 0) - grossWithdrawAmount;
  const hasActiveInvestment = activeInvestmentsCount > 0;

  // ==========================================
  // LOGIQUE DE DÉPÔT (SÉCURISÉE & VÉRIFIÉE)
  // ==========================================
  const completeDepositSuccess = async (
    depositAmount: number, 
    opName: string, 
    refToken?: string, 
    customRef?: string
  ) => {
    stopPolling();

    // Verify and claim the token to prevent any double-credit
    if (refToken) {
      try {
        const claimRes = await claimTchinPayment(refToken, currentUser?.id, depositAmount);
        if (!claimRes.success && claimRes.alreadyClaimed) {
          stopPolling();
          setErrorMessage("Cette recharge a déjà été vérifiée et créditée sur votre portefeuille.");
          setDepositStep('FAILED');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Erreur verrouillage claim:", err);
      }
    }

    const generatedRef = customRef 
      ? customRef.trim().toUpperCase() 
      : (refToken ? `TCHIN-${refToken.substring(0, 8).toUpperCase()}` : `DEP-${country}-${Date.now().toString(36).toUpperCase()}`);

    const newTx: Transaction = {
      id: 'tx-dep-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      userId: currentUser?.id || 'demo-user',
      userName: currentUser?.name || 'Utilisateur',
      userPhone: customerPhone ? formatPhoneWithCountry(customerPhone, country) : (currentUser?.phone || 'Non renseigné'),
      type: 'DEPOSIT',
      amount: depositAmount,
      method: opName,
      status: 'SUCCESS',
      date: new Date().toISOString(),
      reference: generatedRef,
      note: `Recharge Mobile Money (${opName}) vérifiée et créditée avec succès. Réf: ${generatedRef}`
    };

    const txs = getStoredTransactions();
    saveTransactions([newTx, ...txs]);

    const newBal = (currentBalance ?? (currentUser?.balance || 0)) + depositAmount;
    if (onUpdateBalance) {
      onUpdateBalance(newBal);
    }

    if (currentUser?.id) {
      adjustUserBalance(currentUser.id, 'ADD', depositAmount);
      const allUsers = getStoredUsers();
      const target = allUsers.find(u => u.id === currentUser.id);
      if (target) {
        updateUser(currentUser.id, {
          totalDeposits: (target.totalDeposits || 0) + depositAmount
        });
      }
    }

    setSuccessData({
      type: 'DEPOSIT',
      grossAmount: depositAmount,
      method: opName,
      phone: customerPhone || currentUser?.phone || 'Compte Mobile Money'
    });
    setSuccess(true);
    setLoading(false);
  };

  const startStatusPolling = (token: string, opName: string, targetAmount: number) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await checkTchinStatus(token);
        if (res.status === 'successful') {
          completeDepositSuccess(targetAmount, opName, token);
        } else if (res.status === 'failed') {
          stopPolling();
          setErrorMessage("La transaction a été rejetée ou a expiré.");
          setDepositStep('FAILED');
        }
      } catch (err) {
        console.warn("Vérification statut Tchin...", err);
      }
    }, 2500);
  };

  const handleStartTchinHostedPayment = async () => {
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage("Veuillez indiquer un montant de recharge.");
      return;
    }
    if (numAmount < MIN_DEPOSIT) {
      setErrorMessage(`Dépôt minimum obligatoire : ${formatFCFA(MIN_DEPOSIT)}.`);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusFeedback("Initialisation de la page de paiement sécurisée Tchin...");

    try {
      const returnUrl = `${window.location.origin}/?status=success`;
      const cancelUrl = `${window.location.origin}/?status=cancel`;

      const res = await createTchinPaymentToken(
        numAmount,
        country,
        currentUser?.name || 'Client Coca-Cola',
        currentUser?.email || undefined,
        returnUrl,
        cancelUrl
      );

      if (res && res.token) {
        setTchinToken(res.token);
        const url = res.payment_url || `https://tchin.tech/pay/${res.token}`;
        setRedirectUrl(url);
        setDepositStep('WAITING_PAGE');
        setLoading(false);
        setStatusFeedback("Page Tchin prête. Choisissez votre pays et opérateur sur la page pour valider.");

        // Automatically open the payment page in a new window or tab
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (e) {
          console.warn("Could not auto-open window:", e);
        }

        // Start polling the official Tchin status endpoint
        startStatusPolling(res.token, 'Page Tchin Sécurisée', numAmount);
      } else {
        throw new Error("L'API Tchin n'a pas retourné d'adresse de paiement.");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || "Erreur lors de l'accès à la page de paiement Tchin.");
      setDepositStep('FAILED');
    }
  };

  const handleCheckManualStatus = async () => {
    if (!tchinToken) return;
    setLoading(true);
    setStatusFeedback("Vérification en temps réel auprès de l'opérateur Mobile Money...");
    try {
      const res = await checkTchinStatus(tchinToken);
      setLoading(false);
      if (res.status === 'successful') {
        const confirmedAmount = Number(res.amount) || Number(amount) || MIN_DEPOSIT;
        await completeDepositSuccess(confirmedAmount, 'Page Tchin Sécurisée', tchinToken);
      } else if (res.status === 'failed') {
        setErrorMessage("Le paiement a été rejeté ou annulé par l'opérateur Mobile Money.");
        setDepositStep('FAILED');
      } else {
        setStatusFeedback("Paiement non encore confirmé par votre opérateur. Veuillez valider la notification reçue sur votre téléphone, puis réessayez.");
      }
    } catch (err) {
      setLoading(false);
      setStatusFeedback("Vérification en cours... Assurez-vous que l'opération a bien été autorisée sur votre téléphone.");
    }
  };

  // ==========================================
  // LOGIQUE DE RETRAIT (TRANSMISSION ADMINISTRATEUR)
  // ==========================================
  const handleExecuteWithdrawal = async () => {
    setWithdrawError('');
    const numAmount = Number(amount);

    // 0. Horaires stricts : "Les retraits sont disponibles de 10h-18h de lundi au vendredi."
    const schedule = checkWithdrawalAvailability();
    if (!schedule.isOpen) {
      setWithdrawError("Les retraits sont disponibles de 10h-18h de lundi au vendredi. Le guichet est actuellement fermé.");
      return;
    }

    // 1. Condition obligatoire : Avoir un investissement en cours
    if (!hasActiveInvestment) {
      setWithdrawError("Retrait impossible : Vous devez détenir au moins un investissement (pack franchise) actif.");
      return;
    }

    // 2. Condition obligatoire : Retrait minimum 1000 FCFA
    if (!amount || isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      setWithdrawError(`Le montant minimum de retrait est de ${formatFCFA(MIN_WITHDRAWAL)}.`);
      return;
    }

    // 3. Vérification du solde disponible
    if (numAmount > currentBalance) {
      setWithdrawError(`Solde insuffisant. Votre solde disponible est de ${formatFCFA(currentBalance)}.`);
      return;
    }

    // 4. Validation du pays sélectionné
    if (!withdrawCountry) {
      setWithdrawError("Veuillez sélectionner votre pays de réception.");
      return;
    }

    // 5. Validation stricte du nom du titulaire
    const nameCheck = validateBeneficiaryName(withdrawBeneficiaryName);
    if (!nameCheck.isValid) {
      setWithdrawError(nameCheck.error || "Nom du bénéficiaire invalide. Veuillez renseigner votre nom complet légal.");
      return;
    }

    // 6. Validation stricte du numéro selon le pays
    const phoneCheck = validatePhoneForCountry(withdrawPhone, withdrawCountry);
    if (!phoneCheck.isValid) {
      setWithdrawError(phoneCheck.error || "Le numéro de téléphone fourni est incorrect pour ce pays.");
      return;
    }

    // Opérateur
    const cOps = COUNTRY_OPERATORS[withdrawCountry.toUpperCase()] || [
      { code: 'MM', name: 'Mobile Money' },
      { code: 'WAVE', name: 'Wave' },
    ];
    const op = withdrawOperator || cOps[0]?.name || 'Mobile Money';
    const fullPhone = formatPhoneWithCountry(phoneCheck.cleanPhone, withdrawCountry);

    setLoading(true);

    try {
      // Les retraits via l'API externe sont annulés :
      // La demande de retrait est directement transmise au panneau administrateur pour validation et exécution manuelle
      await new Promise(r => setTimeout(r, 600));

      const generatedRef = `DEM-WTH-${withdrawCountry.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const txId = 'tx-wth-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

      const newTx: Transaction = {
        id: txId,
        userId: currentUser?.id || 'demo-user',
        userName: withdrawBeneficiaryName.trim(),
        userPhone: fullPhone,
        type: 'WITHDRAW',
        amount: numAmount,
        method: op,
        status: 'PENDING',
        date: new Date().toISOString(),
        reference: generatedRef,
        note: `Demande de retrait transmise à l'administrateur (${op}) pour ${withdrawBeneficiaryName.trim()} (${fullPhone}). Montant brut : ${formatFCFA(numAmount)} - Frais franchise (10%) : ${formatFCFA(withdrawFeeAmount)} - Net à verser : ${formatFCFA(netWithdrawAmount)}`
      };

      const txs = getStoredTransactions();
      saveTransactions([newTx, ...txs]);

      // Débit immédiat du solde pour réserver les fonds pendant l'attente administrative
      if (onUpdateBalance && currentBalance !== undefined) {
        onUpdateBalance(currentBalance - numAmount);
      }
      if (currentUser?.id) {
        adjustUserBalance(currentUser.id, 'SUBTRACT', numAmount);
        const allUsers = getStoredUsers();
        const target = allUsers.find(u => u.id === currentUser.id);
        if (target) {
          updateUser(currentUser.id, {
            totalWithdrawals: (target.totalWithdrawals || 0) + numAmount
          });
        }
      }

      setSuccessData({
        type: 'WITHDRAW',
        grossAmount: numAmount,
        netAmount: netWithdrawAmount,
        feeAmount: withdrawFeeAmount,
        method: op,
        phone: fullPhone,
        isAutomated: false,
        reference: generatedRef
      });

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setWithdrawError(err.message || "Erreur de transmission de la demande. Veuillez réessayer.");
      setLoading(false);
    }
  };

  const handleNavigateToCatalog = () => {
    handleClose();
    if (onNavigateView) {
      onNavigateView('PRODUCTS');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm sm:p-4">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="bg-white dark:bg-[#151515] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md relative shadow-2xl pb-safe max-h-[92vh] overflow-y-auto border border-gray-100 dark:border-neutral-800"
          >
            {/* SUCCESS VIEW */}
            {success && successData ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  successData.type === 'DEPOSIT' 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' 
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-500'
                }`}>
                  {successData.type === 'DEPOSIT' ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <Clock className="w-10 h-10" />
                  )}
                </div>

                <h2 className="text-xl font-['Poppins'] font-black text-gray-900 dark:text-white mb-1">
                  {successData.type === 'DEPOSIT' 
                    ? 'Dépôt Réussi !' 
                    : 'Demande Transmise à l\'Administrateur !'}
                </h2>

                <p className={`text-3xl font-black mb-3 ${
                  successData.type === 'DEPOSIT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {successData.type === 'DEPOSIT' 
                    ? `+${formatFCFA(successData.grossAmount)}` 
                    : formatFCFA(successData.grossAmount)}
                </p>

                {/* Recap card */}
                <div className="w-full bg-gray-50 dark:bg-neutral-900 p-4 rounded-2xl border border-gray-200 dark:border-neutral-800 text-xs text-left mb-4 space-y-2">
                  <div className="flex justify-between items-center text-gray-500 dark:text-neutral-400">
                    <span>Statut de la demande</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      ⏳ En attente de validation admin
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 dark:text-neutral-400">
                    <span>Opérateur Mobile Money</span>
                    <strong className="text-gray-900 dark:text-white">{successData.method}</strong>
                  </div>
                  <div className="flex justify-between items-center text-gray-500 dark:text-neutral-400">
                    <span>Ligne de réception</span>
                    <strong className="text-gray-900 dark:text-white font-mono">{successData.phone}</strong>
                  </div>
                  {successData.reference && (
                    <div className="flex justify-between items-center text-gray-500 dark:text-neutral-400">
                      <span>Référence de dossier</span>
                      <strong className="text-gray-900 dark:text-white font-mono text-[11px]">{successData.reference}</strong>
                    </div>
                  )}
                  {successData.type === 'WITHDRAW' && (
                    <>
                      <div className="flex justify-between items-center text-gray-500 dark:text-neutral-400">
                        <span>Frais de retrait franchise (10%)</span>
                        <strong className="text-red-500 font-bold">-{formatFCFA(successData.feeAmount || 0)}</strong>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                        <span className="font-bold text-gray-800 dark:text-gray-200">Montant net à verser</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                          {formatFCFA(successData.netAmount || 0)}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-neutral-400 px-3 mb-5 leading-relaxed">
                  {successData.type === 'DEPOSIT'
                    ? "Votre portefeuille a été crédité instantanément. Vos fonds sont immédiatement disponibles pour investir."
                    : "Votre demande de retrait a été transmise à l'administrateur avec succès. Votre solde a été mis à jour et les fonds vous seront versés manuellement sur votre compte Mobile Money après validation administrative."}
                </p>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full bg-[#F40009] hover:bg-red-600 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg shadow-red-500/25 cursor-pointer"
                >
                  Terminer
                </button>
              </div>
            ) : (
              <>
                {/* MODAL HEADER WITH BALANCE CARD */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    {activeTab === 'DEPOSIT' && depositStep !== 'AMOUNT_AND_METHOD' && (
                      <button 
                        onClick={() => {
                          stopPolling();
                          setDepositStep('AMOUNT_AND_METHOD');
                        }}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer mr-1"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                    <h2 className="text-lg font-['Poppins'] font-black text-gray-900 dark:text-white">
                      Espace Financier
                    </h2>
                  </div>
                  <button 
                    onClick={handleClose} 
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-full cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* USER BALANCE HEADER BANNER */}
                <div className="bg-neutral-900 text-white p-3.5 rounded-2xl mb-4 flex items-center justify-between border border-neutral-800 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 text-[#F40009] flex items-center justify-center border border-red-600/30">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Solde Actuel Disponible</p>
                      <p className="text-base font-black text-white font-mono">{formatFCFA(currentBalance)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {getCountryInfo(country).flag} {getCountryInfo(country).code}
                  </span>
                </div>

                {/* TAB SWITCHER (DEPOT vs RETRAIT) */}
                <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-neutral-900 p-1 rounded-2xl mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('DEPOSIT');
                      setDepositStep('AMOUNT_AND_METHOD');
                      setErrorMessage('');
                      setWithdrawError('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      activeTab === 'DEPOSIT'
                        ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
                        : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Dépôt</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/25 text-emerald-100 font-bold ml-1">
                      24h/24
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('WITHDRAW');
                      setErrorMessage('');
                      setWithdrawError('');
                    }}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                      activeTab === 'WITHDRAW'
                        ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-md'
                        : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Retrait</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold ml-1">
                      10h-18h Lun-Ven
                    </span>
                  </button>
                </div>

                {/* ============================================================== */}
                {/* 1. DEPOSIT FLOW (DÉPÔT MINIMUM 6 000 FCFA - PAGE TCHIN)         */}
                {/* ============================================================== */}
                {activeTab === 'DEPOSIT' ? (
                  <>
                    {depositStep === 'AMOUNT_AND_METHOD' && (
                      <div className="space-y-4">
                        {/* 24/7 Availability Banner */}
                        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-3 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Les dépôts sont disponibles 24h/24 (7j/7)</span>
                          </div>
                          <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                            Disponible 24h/24
                          </span>
                        </div>

                        {/* Info banner */}
                        <div className="bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-3 rounded-2xl flex items-start space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-gray-700 dark:text-neutral-300">
                            <span className="font-bold text-gray-900 dark:text-white">
                              Recharge Mobile Money par Page Sécurisée Tchin
                            </span>
                            <p className="opacity-90 mt-0.5">
                              Dépôts ouverts 24h/24. Dépôt minimum : <strong className="underline">{formatFCFA(MIN_DEPOSIT)}</strong>. Crédit immédiat de votre portefeuille.
                            </p>
                          </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                              Montant de recharge (FCFA)
                            </label>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-900">
                              Min : {formatFCFA(MIN_DEPOSIT)}
                            </span>
                          </div>

                          <div className="relative">
                            <input 
                              type="number"
                              min={MIN_DEPOSIT}
                              value={amount}
                              onChange={(e) => {
                                setAmount(e.target.value);
                                setErrorMessage('');
                              }}
                              placeholder={`Ex : ${MIN_DEPOSIT}`}
                              className="w-full pl-4 pr-14 py-3 border border-gray-200 dark:border-neutral-700 rounded-2xl text-lg font-black text-gray-900 dark:text-white dark:bg-neutral-900 outline-none focus:border-[#F40009] transition-all"
                            />
                            <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-400 font-mono">FCFA</span>
                          </div>

                          {/* Quick Pack Presets aligned with franchise catalog */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {[6000, 9000, 15000, 30000, 60000, 120000].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setAmount(String(preset));
                                  setErrorMessage('');
                                }}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border cursor-pointer transition-all ${
                                  amount === String(preset)
                                    ? 'bg-[#F40009] text-white border-[#F40009]'
                                    : 'border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-[#F40009] bg-gray-50 dark:bg-neutral-900'
                                }`}
                              >
                                {preset.toLocaleString()} F
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Error Message */}
                        {errorMessage && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                          </div>
                        )}

                        {/* Card presenting Tchin Hosted Payment Page */}
                        <div className="p-4 bg-gradient-to-br from-red-50 via-white to-red-50/30 dark:from-neutral-900 dark:via-neutral-900 dark:to-red-950/20 border border-red-200/80 dark:border-red-900/40 rounded-2xl space-y-3">
                          <div className="flex items-center space-x-2 text-[#F40009]">
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            <h4 className="font-bold text-xs uppercase tracking-wider">
                              Page de Paiement Sécurisée Tchin
                            </h4>
                          </div>
                          <p className="text-xs text-gray-700 dark:text-neutral-300 leading-relaxed">
                            Le paiement s'effectue directement sur la page officielle <strong>Tchin.tech</strong>. Vous y choisissez votre pays et votre opérateur Mobile Money en toute sécurité.
                          </p>

                          {/* Badges of supported operators on the hosted page */}
                          <div className="pt-1">
                            <span className="block text-[10px] font-bold text-gray-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wider">
                              Opérateurs pris en charge sur la page :
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-gray-100 dark:border-neutral-700 flex items-center space-x-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                                <div>
                                  <p className="font-bold text-xs text-gray-900 dark:text-white">Wave</p>
                                  <p className="text-[10px] text-gray-400">Côte d'Ivoire & Sénégal</p>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-gray-100 dark:border-neutral-700 flex items-center space-x-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                                <div>
                                  <p className="font-bold text-xs text-gray-900 dark:text-white">Orange Money</p>
                                  <p className="text-[10px] text-gray-400">CI & Burkina Faso</p>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-gray-100 dark:border-neutral-700 flex items-center space-x-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                                <div>
                                  <p className="font-bold text-xs text-gray-900 dark:text-white">MTN Mobile</p>
                                  <p className="text-[10px] text-gray-400">Côte d'Ivoire</p>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-white dark:bg-neutral-800/80 border border-gray-100 dark:border-neutral-700 flex items-center space-x-2.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                <div>
                                  <p className="font-bold text-xs text-gray-900 dark:text-white">Moov Money</p>
                                  <p className="text-[10px] text-gray-400">CI & Burkina Faso</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Main CTA button to generate Tchin page */}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleStartTchinHostedPayment}
                          className="w-full bg-[#F40009] hover:bg-red-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-500/25 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Génération de la page de paiement...</span>
                            </>
                          ) : (
                            <>
                              <span>Payer {formatFCFA(Number(amount) || MIN_DEPOSIT)} avec Tchin</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* ============================================================== */}
                    {/* STEP: WAITING_PAGE (TCHIN HOSTED PAYMENT PAGE)                 */}
                    {/* ============================================================== */}
                    {depositStep === 'WAITING_PAGE' && (
                      <div className="py-2 space-y-4 text-center">
                        <div className="relative mx-auto w-14 h-14 mb-1">
                          <motion.div 
                            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.15, 0.5] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="absolute inset-0 rounded-full bg-red-500/20"
                          />
                          <div className="relative w-14 h-14 rounded-full bg-red-50 dark:bg-red-950/80 text-[#F40009] flex items-center justify-center border border-red-500/30">
                            <ExternalLink className="w-7 h-7" />
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/30">
                            Page de paiement prête
                          </span>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white mt-2">
                            Finalisez votre paiement
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">
                            Montant : <strong className="text-gray-900 dark:text-white font-mono text-sm">{formatFCFA(Number(amount) || MIN_DEPOSIT)}</strong>
                          </p>
                          {tchinToken && (
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                              Réf Token : {tchinToken}
                            </p>
                          )}
                        </div>

                        {/* Open Page Button */}
                        {redirectUrl && (
                          <a
                            href={redirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#F40009] hover:bg-red-600 text-white font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-500/25 cursor-pointer transition-all hover:scale-[1.01]"
                          >
                            <span>Ouvrir la page de paiement sécurisée Tchin</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {/* Instructions */}
                        <div className="p-3.5 bg-gray-50 dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-neutral-800 text-left space-y-2">
                          <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center space-x-1.5">
                            <Info className="w-3.5 h-3.5 text-[#F40009]" />
                            <span>Comment ça se déroule :</span>
                          </p>
                          <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-600 dark:text-gray-300">
                            <li>Cliquez sur le bouton ci-dessus pour ouvrir la page officielle <strong>Tchin.tech</strong>.</li>
                            <li>Choisissez votre pays (Côte d'Ivoire ou Burkina Faso) et votre opérateur Mobile Money.</li>
                            <li>Saisissez votre numéro de téléphone et validez sur votre mobile.</li>
                            <li>Revenez sur cette page : votre solde est crédité <strong>instantanément</strong>.</li>
                          </ol>
                        </div>

                        {/* Automatic polling indicator */}
                        <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center space-x-2.5 text-xs text-blue-700 dark:text-blue-300">
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600 dark:text-blue-400" />
                          <div className="text-[11px] text-left">
                            <span className="font-bold">Détection automatique active</span>
                            <p className="opacity-80">En attente de votre paiement sur la page Tchin...</p>
                          </div>
                        </div>

                        {statusFeedback && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            {statusFeedback}
                          </p>
                        )}

                        {/* Manual Check Button */}
                        <button
                          type="button"
                          disabled={loading}
                          onClick={handleCheckManualStatus}
                          className="w-full bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer transition-all border border-neutral-700 shadow-sm"
                        >
                          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>J'ai déjà payé sur Tchin — Vérifier le statut</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            stopPolling();
                            setDepositStep('AMOUNT_AND_METHOD');
                          }}
                          className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          ← Modifier le montant ou recommencer
                        </button>
                      </div>
                    )}

                    {/* ============================================================== */}
                    {/* STEP: FAILED STATE                                             */}
                    {/* ============================================================== */}
                    {depositStep === 'FAILED' && (
                      <div className="py-4 text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-950 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
                          <AlertCircle className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            Paiement Non Validé
                          </h3>
                          <p className="text-xs text-red-500 mt-1 px-3">
                            {errorMessage || "La transaction a été interrompue ou rejetée par l'opérateur Mobile Money."}
                          </p>
                        </div>

                        <div className="space-y-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              stopPolling();
                              setTchinToken('');
                              setDepositStep('AMOUNT_AND_METHOD');
                            }}
                            className="w-full bg-[#F40009] hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/20"
                          >
                            Réessayer un nouveau paiement
                          </button>
                          <button
                            type="button"
                            onClick={handleClose}
                            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            Fermer
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* ============================================================== */
                  /* 2. WITHDRAWAL FLOW (CONDITIONS RETRAIT STRICTES)               */
                  /* ============================================================== */
                  <div className="space-y-4">
                    {/* CONDITION 1: INVESTISSEMENT EN COURS OBLIGATOIRE */}
                    {!hasActiveInvestment ? (
                      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 p-4 rounded-2xl space-y-3 text-left">
                        <div className="flex items-center space-x-2.5 text-red-600 dark:text-red-400 font-bold text-sm">
                          <Lock className="w-5 h-5 shrink-0" />
                          <span>Retrait Bloqué : Investissement Requis</span>
                        </div>

                        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                          Conformément aux conditions de la franchise Coca-Cola Invest, <strong>vous devez posséder au moins un investissement (pack franchise) actif en cours</strong> pour pouvoir effectuer un retrait de fonds.
                        </p>

                        <div className="p-2.5 bg-white/70 dark:bg-black/40 rounded-xl text-[11px] text-gray-700 dark:text-neutral-300 border border-red-100 dark:border-red-950">
                          📊 Packs d'investissement actifs : <strong className="text-red-600 font-bold">0 actif</strong>
                        </div>

                        <button
                          type="button"
                          onClick={handleNavigateToCatalog}
                          className="w-full bg-[#F40009] hover:bg-red-600 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Activer un Pack Franchise maintenant</span>
                        </button>
                      </div>
                    ) : (
                      /* Badge rassurant : Éligible au retrait direct */
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>
                            Éligible : {activeInvestmentsCount} pack(s) d'investissement actif(s)
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                          Actif
                        </span>
                      </div>
                    )}

                    {/* CONDITIONS RECAP CARD */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3.5 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold flex items-center text-xs text-amber-800 dark:text-amber-200">
                          <Clock className="w-3.5 h-3.5 mr-1.5 shrink-0 text-amber-600" />
                          Horaires & Conditions de Retrait :
                        </p>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          withdrawalSchedule.isOpen 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' 
                            : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {withdrawalSchedule.isOpen ? 'Ouvert (10h-18h)' : 'Fermé'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/70 dark:bg-neutral-900/60 border border-amber-200/60 dark:border-amber-900/40 text-xs font-semibold">
                        ⏰ <strong>Les retraits sont disponibles de 10h-18h de lundi au vendredi.</strong>
                        <p className="text-[10px] font-normal opacity-85 mt-0.5">{withdrawalSchedule.details}</p>
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-[11px] opacity-90">
                        <li>Votre demande est transmise à l'administrateur pour validation et paiement Mobile Money.</li>
                        <li>Retrait minimum : <strong>{formatFCFA(MIN_WITHDRAWAL)}</strong>.</li>
                        <li>Frais de traitement franchise : <strong>10%</strong> déduits du montant versé.</li>
                        <li>En cas de refus ou annulation, vos fonds sont recrédités immédiatement à 100%.</li>
                      </ul>
                    </div>

                    {/* Saisie du Montant */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                          Montant à retirer (FCFA)
                        </label>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          Min : {formatFCFA(MIN_WITHDRAWAL)}
                        </span>
                      </div>

                      <div className="relative">
                        <input 
                          type="number"
                          disabled={!hasActiveInvestment || loading}
                          value={amount}
                          onChange={(e) => {
                            setAmount(e.target.value);
                            setWithdrawError('');
                          }}
                          placeholder={`Ex : ${MIN_WITHDRAWAL}`}
                          className="w-full pl-4 pr-14 py-3 border border-gray-200 dark:border-neutral-700 rounded-2xl text-lg font-black text-gray-900 dark:text-white dark:bg-neutral-900 outline-none focus:border-[#F40009] disabled:opacity-50 transition-all"
                        />
                        <span className="absolute right-4 top-3.5 text-xs font-bold text-gray-400 font-mono">FCFA</span>
                      </div>

                      {/* Quick Presets for withdrawal */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[1000, 2500, 5000, 10000, 25000, 50000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            disabled={!hasActiveInvestment || loading}
                            onClick={() => {
                              setAmount(String(preset));
                              setWithdrawError('');
                            }}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border cursor-pointer transition-all disabled:opacity-40 ${
                              amount === String(preset)
                                ? 'bg-[#F40009] text-white border-[#F40009]'
                                : 'border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-[#F40009] bg-gray-50 dark:bg-neutral-900'
                            }`}
                          >
                            {preset.toLocaleString()} F
                          </button>
                        ))}
                        {currentBalance > 0 && (
                          <button
                            type="button"
                            disabled={!hasActiveInvestment || loading}
                            onClick={() => {
                              setAmount(String(Math.floor(currentBalance)));
                              setWithdrawError('');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                          >
                            Tout retirer ({Math.floor(currentBalance).toLocaleString()} F)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* LIVE 10% FEE BREAKDOWN CARD */}
                    {grossWithdrawAmount > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-neutral-50 dark:bg-neutral-900 p-3.5 rounded-2xl border border-gray-200 dark:border-neutral-800 text-xs space-y-2 shadow-sm"
                      >
                        <div className="flex justify-between items-center text-gray-600 dark:text-neutral-400">
                          <span>Montant brut demandé</span>
                          <span className="font-bold text-gray-900 dark:text-white font-mono">{formatFCFA(grossWithdrawAmount)}</span>
                        </div>

                        <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                          <span>Frais de retrait franchise (10%)</span>
                          <span className="font-bold font-mono">-{formatFCFA(withdrawFeeAmount)}</span>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-neutral-800 flex justify-between items-center">
                          <span className="font-bold text-gray-900 dark:text-white">Net versé sur Mobile Money</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm font-mono">
                            {formatFCFA(netWithdrawAmount)}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-400 flex justify-between pt-1">
                          <span>Solde restant après retrait</span>
                          <span className={`font-bold font-mono ${remainingBalanceAfterWithdraw < 0 ? 'text-red-500' : ''}`}>
                            {formatFCFA(remainingBalanceAfterWithdraw)}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* ÉTAPE 1 : CHOISIR SON PAYS DE RÉCEPTION */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300 flex items-center space-x-1.5">
                          <Globe className="w-3.5 h-3.5 text-red-500" />
                          <span>1. Choisissez votre pays de réception</span>
                        </label>
                        <span className="text-[10px] text-neutral-400 font-semibold">
                          {activeCountries.length} pays actifs
                        </span>
                      </div>
                      <div className="relative">
                        <select
                          disabled={!hasActiveInvestment || loading}
                          value={withdrawCountry}
                          onChange={(e) => {
                            setWithdrawCountry(e.target.value);
                            setWithdrawError('');
                          }}
                          className="w-full pl-3 pr-8 py-2.5 bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-[#F40009] cursor-pointer disabled:opacity-50"
                        >
                          {activeCountries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name} ({c.dialCode}) - {c.currency}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* ÉTAPE 2 : NOM DU BÉNÉFICIAIRE */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                        2. Nom complet du titulaire de la ligne Mobile Money
                      </label>
                      <input 
                        type="text"
                        disabled={!hasActiveInvestment || loading}
                        value={withdrawBeneficiaryName}
                        onChange={(e) => {
                          setWithdrawBeneficiaryName(e.target.value);
                          setWithdrawError('');
                        }}
                        placeholder="Ex: Kouamé Patrick (Nom officiel enregistré chez l'opérateur)"
                        className="w-full px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-bold dark:bg-neutral-900 dark:text-white outline-none focus:border-[#F40009] disabled:opacity-50"
                        required
                      />
                      <p className="text-[10px] text-gray-400 dark:text-neutral-500 mt-1">
                        Important : Ce nom doit correspondre à la pièce d'identité de votre compte Mobile Money.
                      </p>
                    </div>

                    {/* ÉTAPE 3 : NUMÉRO MOBILE MONEY DE RÉCEPTION */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-gray-700 dark:text-neutral-300">
                          3. Numéro Mobile Money pour recevoir les fonds
                        </label>
                        <span className="text-[10px] font-mono text-neutral-400">
                          Indicatif {getCountryInfo(withdrawCountry).dialCode}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-2.5 bg-gray-100 dark:bg-neutral-800 rounded-xl text-xs font-bold text-gray-600 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 shrink-0">
                          {getCountryInfo(withdrawCountry).flag} {getCountryInfo(withdrawCountry).dialCode}
                        </span>
                        <input 
                          type="tel"
                          disabled={!hasActiveInvestment || loading}
                          value={withdrawPhone}
                          onChange={(e) => {
                            setWithdrawPhone(e.target.value.replace(/\D/g, ''));
                            setWithdrawError('');
                          }}
                          placeholder={getCountryInfo(withdrawCountry).placeholder ? `Ex: ${getCountryInfo(withdrawCountry).placeholder}` : 'Ex: 0701020304'}
                          className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold dark:bg-neutral-900 dark:text-white outline-none focus:border-[#F40009] disabled:opacity-50"
                          required
                        />
                      </div>
                    </div>

                    {/* ÉTAPE 4 : OPÉRATEUR MOBILE MONEY DE RÉCEPTION */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1">
                        4. Opérateur Mobile Money ({getCountryInfo(withdrawCountry).name})
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(COUNTRY_OPERATORS[withdrawCountry.toUpperCase()] || [
                          { code: 'MM', name: 'Mobile Money' },
                          { code: 'WAVE', name: 'Wave' }
                        ]).map((op) => {
                          const isSel = withdrawOperator === op.name || (!withdrawOperator && op === (COUNTRY_OPERATORS[withdrawCountry.toUpperCase()] || [])[0]);
                          return (
                            <button
                              key={op.code}
                              type="button"
                              disabled={!hasActiveInvestment}
                              onClick={() => setWithdrawOperator(op.name)}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-40 ${
                                isSel
                                    ? 'border-[#F40009] bg-red-50/50 dark:bg-red-950/40 text-[#F40009]'
                                    : 'border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-neutral-300 hover:border-gray-300'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span className="truncate">{op.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Error message */}
                    {withdrawError && (
                      <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="font-semibold">{withdrawError}</span>
                      </div>
                    )}

                    {/* BOUTON DE SOUMISSION DE RETRAIT */}
                    <button
                      type="button"
                      disabled={
                        !withdrawalSchedule.isOpen ||
                        !hasActiveInvestment || 
                        loading || 
                        grossWithdrawAmount < MIN_WITHDRAWAL || 
                        grossWithdrawAmount > currentBalance ||
                        !withdrawPhone ||
                        !withdrawBeneficiaryName
                      }
                      onClick={handleExecuteWithdrawal}
                      className="w-full bg-[#F40009] hover:bg-red-600 active:scale-98 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-red-500/25 transition-all"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transmission de la demande à l'administrateur...</span>
                        </>
                      ) : !withdrawalSchedule.isOpen ? (
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-4 h-4 text-white/90" />
                          <span>Guichet Fermé (Disponible Lun-Ven 10h-18h)</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5">
                          <Send className="w-4 h-4 text-white" />
                          <span>
                            {grossWithdrawAmount >= MIN_WITHDRAWAL
                              ? `Envoyer la Demande à l'Admin (${formatFCFA(netWithdrawAmount)} net)`
                              : `Demander un Retrait (Min : ${formatFCFA(MIN_WITHDRAWAL)})`}
                          </span>
                        </div>
                      )}
                    </button>

                    <p className="text-[10px] text-center text-gray-400 dark:text-neutral-500">
                      🔒 Demande transmise à l'administrateur. Remboursement automatique en cas d'annulation.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
