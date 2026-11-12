import { useState, useEffect, FormEvent, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle, 
  Crown, Save, RotateCcw, Plus, Search, Filter, DollarSign, 
  TrendingUp, Layers, RefreshCw, KeyRound, Eye, EyeOff, Check, Copy, UserCheck,
  Users, Settings, HelpCircle, Target, Lock, Power, Megaphone, Trash2, Edit3, 
  Ban, ShieldAlert, Phone, Smartphone, MessageCircle, Send, CheckSquare,
  Gift, Sparkles, Award, CreditCard, Network, ExternalLink, Link2, ChevronDown, ChevronUp, X, Undo2, Globe, Zap
} from 'lucide-react';
import { Transaction, ProductItem, ViewState, User, FaqItem, MissionItem, Country, CountryConfig, UserInvestment, ReferralCommissionLog, PaymentMethod } from '../types';
import { formatFCFA } from '../utils';
import { 
  getStoredTransactions, 
  updateTransactionStatus, 
  cancelWithdrawalByAdmin,
  addManualTransaction, 
  resetTransactionsToSeed 
} from '../services/transactionService';
import { 
  getStoredProducts, 
  saveCustomProducts, 
  resetProductsToDefault,
  addProduct,
  deleteProduct
} from '../services/productService';
import { 
  getStoredSettings, 
  saveSettings, 
  resetSettingsToDefault, 
  AppSettings 
} from '../services/appSettingsService';
import { 
  getStoredPaymentMethods, 
  addPaymentMethod, 
  updatePaymentMethod, 
  deletePaymentMethod, 
  togglePaymentMethodStatus, 
  resetPaymentMethodsToDefault 
} from '../services/paymentMethodService';
import { updateServerTchinConfig } from '../services/tchinService';
import { 
  getStoredUsers, 
  updateUser, 
  adjustUserBalance, 
  toggleBlockUser, 
  createManualUser, 
  resetUserPassword,
  deleteUser 
} from '../services/userService';
import { 
  getStoredFaq, 
  addFaqItem, 
  updateFaqItem, 
  deleteFaqItem, 
  resetFaqToDefault 
} from '../services/faqService';
import { 
  getStoredMissions, 
  addMission, 
  updateMission, 
  deleteMission, 
  resetMissionsToDefault 
} from '../services/missionsService';
import {
  getAllInvestments,
  getAllReferralLogs,
  processAutomaticDailyRevenues,
  giftProductByAdmin
} from '../services/investmentService';
import { getStoredCountries, getCountryInfo } from '../services/countryService';
import { AdminCountriesTab } from '../components/AdminCountriesTab';

interface AdminProps {
  onBackToApp: () => void;
  onChangeView?: (view: ViewState) => void;
}

type AdminTab = 'TRANSACTIONS' | 'USERS' | 'PRODUCTS' | 'PAYMENTS' | 'COUNTRIES' | 'REFERRALS' | 'INVESTMENTS' | 'SETTINGS' | 'MISSIONS' | 'FAQ' | 'SECURITY';

export default function Admin({ onBackToApp }: AdminProps) {
  // Global Settings
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());

  // Security Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('coca_app_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('TRANSACTIONS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txFilter, setTxFilter] = useState<'ALL' | 'PENDING' | 'SUCCESS' | 'CANCELLED' | 'REJECTED'>('PENDING');
  const [txTypeFilter, setTxTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAW'>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [manualUser, setManualUser] = useState('');
  const [manualPhone, setManualPhone] = useState('+225 ');
  const [manualType, setManualType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState('Wave CI');
  const [manualNote, setManualNote] = useState('');

  // Transaction Action Modal (Annuler, Rejeter, Valider)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'APPROVE' | 'CANCEL' | 'REJECT';
    tx: Transaction | null;
    reason: string;
  }>({
    isOpen: false,
    type: 'CANCEL',
    tx: null,
    reason: ''
  });

  // 2. Users State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userCountryFilter, setUserCountryFilter] = useState<string>('ALL');
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [balanceEditModalUser, setBalanceEditModalUser] = useState<User | null>(null);
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState('');
  const [balanceAdjustOp, setBalanceAdjustOp] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');

  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('+225 ');
  const [newUserCountry, setNewUserCountry] = useState<string>('CI');
  const [newUserBalance, setNewUserBalance] = useState('0');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserPasswordVisible, setNewUserPasswordVisible] = useState(false);

  // User passwords management
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [passwordEditModalUser, setPasswordEditModalUser] = useState<User | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // 3. Products State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [editingProducts, setEditingProducts] = useState<Record<number, ProductItem>>({});
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState<'BOTTLES' | 'VENDING' | 'STOCKS'>('BOTTLES');
  const [newProdPrice, setNewProdPrice] = useState('25000');
  const [newProdDaily, setNewProdDaily] = useState('4500');
  const [newProdDuration, setNewProdDuration] = useState('90');
  const [newProdTag, setNewProdTag] = useState('Nouveau VIP');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdIsVip, setNewProdIsVip] = useState(false);
  const [newProdImage, setNewProdImage] = useState('https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800');

  // 4. Missions State
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [editingMissions, setEditingMissions] = useState<Record<number, MissionItem>>({});
  const [showNewMissionModal, setShowNewMissionModal] = useState(false);
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionType, setNewMissionType] = useState<'referral' | 'vip' | 'daily'>('referral');
  const [newMissionTarget, setNewMissionTarget] = useState('5');
  const [newMissionReward, setNewMissionReward] = useState('1000');

  // 5. FAQ State
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<Record<string, FaqItem>>({});
  const [showNewFaqModal, setShowNewFaqModal] = useState(false);
  const [newFaqCat, setNewFaqCat] = useState('Général');
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');

  // 6. Security PIN Form State
  const [newPinCode, setNewPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');

  // 7. Investments & Referral Logs State
  const [allInvestments, setAllInvestments] = useState<UserInvestment[]>([]);
  const [allCommissionLogs, setAllCommissionLogs] = useState<ReferralCommissionLog[]>([]);
  const [giftModalUser, setGiftModalUser] = useState<User | null>(null);
  const [giftSelectedProductId, setGiftSelectedProductId] = useState<number>(1);
  const [giftNote, setGiftNote] = useState<string>("Offert par l'administration");

  // 8. Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [pmFilterCountry, setPmFilterCountry] = useState<string>('ALL');
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [newPmName, setNewPmName] = useState('');
  const [newPmCountry, setNewPmCountry] = useState<string>('ALL');
  const [newPmCategory, setNewPmCategory] = useState<'MOBILE_MONEY' | 'CRYPTO'>('MOBILE_MONEY');
  const [newPmAccountNumber, setNewPmAccountNumber] = useState('');
  const [newPmAccountName, setNewPmAccountName] = useState('COCA-COLA DISTRIBUTION');
  const [newPmInstructions, setNewPmInstructions] = useState('');
  const [newPmAllowsDeposit, setNewPmAllowsDeposit] = useState(true);
  const [newPmAllowsWithdrawal, setNewPmAllowsWithdrawal] = useState(true);

  // Country Management State
  const [countriesList, setCountriesList] = useState<CountryConfig[]>(() => getStoredCountries());

  // Tchin Gateway Config State
  const [tchinPk, setTchinPk] = useState(settings.tchinPublicKey || '');
  const [tchinSk, setTchinSk] = useState(settings.tchinPrivateKey || '');
  const [tchinPass, setTchinPass] = useState(settings.tchinPassword || '');
  const [tchinEnv, setTchinEnv] = useState<'sandbox' | 'live'>(settings.tchinEnvironment || 'live');
  const [tchinEnabled, setTchinEnabled] = useState<boolean>(settings.isTchinEnabled ?? true);
  const [tchinSyncLoading, setTchinSyncLoading] = useState(false);
  const [tchinShowSk, setTchinShowSk] = useState(false);

  // 9. Referrals State
  const [referralSearch, setReferralSearch] = useState('');
  const [referralFilter, setReferralFilter] = useState<'ALL' | 'SPONSORS' | 'DOWNLINES'>('ALL');
  const [expandedSponsorId, setExpandedSponsorId] = useState<string | null>(null);

  // Temporary settings edit state
  const [tempSettings, setTempSettings] = useState<AppSettings>(getStoredSettings());

  useEffect(() => {
    loadAllData();
    const handleCountriesUpdate = () => {
      setCountriesList(getStoredCountries());
    };
    window.addEventListener('app_countries_updated', handleCountriesUpdate);
    return () => window.removeEventListener('app_countries_updated', handleCountriesUpdate);
  }, []);

  const loadAllData = () => {
    const currentSettings = getStoredSettings();
    setSettings(currentSettings);
    setTempSettings(currentSettings);

    setTransactions(getStoredTransactions());

    const prods = getStoredProducts();
    setProducts(prods);
    const prodMap: Record<number, ProductItem> = {};
    prods.forEach(p => { prodMap[p.id] = { ...p }; });
    setEditingProducts(prodMap);

    setUsersList(getStoredUsers());
    
    // Fetch live users directly from server database for admin
    const token = localStorage.getItem('coca_app_session_token');
    fetch('/api/admin/users', {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.users)) {
          setUsersList(data.users);
        }
      })
      .catch(() => {});
    setPaymentMethods(getStoredPaymentMethods());

    setTchinPk(currentSettings.tchinPublicKey || '');
    setTchinSk(currentSettings.tchinPrivateKey || '');
    setTchinPass(currentSettings.tchinPassword || '');
    setTchinEnv(currentSettings.tchinEnvironment || 'sandbox');
    setTchinEnabled(currentSettings.isTchinEnabled ?? true);

    const missions = getStoredMissions();
    setMissionsList(missions);
    const missionMap: Record<number, MissionItem> = {};
    missions.forEach(m => { missionMap[m.id] = { ...m }; });
    setEditingMissions(missionMap);

    const faqs = getStoredFaq();
    setFaqList(faqs);
    const faqMap: Record<string, FaqItem> = {};
    faqs.forEach(f => { faqMap[f.id] = { ...f }; });
    setEditingFaq(faqMap);

    setAllInvestments(getAllInvestments());
    setAllCommissionLogs(getAllReferralLogs());
  };

  const handleConfirmGiftProduct = () => {
    if (!giftModalUser) return;
    const prod = products.find(p => p.id === giftSelectedProductId) || products[0];
    if (!prod) return;

    const result = giftProductByAdmin(giftModalUser.id, prod, giftNote);
    if (result.success) {
      showToast(`Franchise ${prod.name} offerte à ${giftModalUser.name} ! (0 commission parrainage générée)`);
      setGiftModalUser(null);
      loadAllData();
    } else {
      alert("Erreur lors de l'attribution du produit");
    }
  };

  const handleTriggerCycleForAll = async () => {
    const report = await processAutomaticDailyRevenues();
    loadAllData();
    showToast(`Cycle 24h exécuté : +${formatFCFA(report.totalAmountCredited)} distribués sur ${report.creditedCount} investissement(s) !`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auth
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const entered = passcode.trim();
    if (!entered) {
      setAuthError("Veuillez saisir le code d'accès administrateur.");
      return;
    }

    try {
      const sessionToken = localStorage.getItem('coca_app_session_token');
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {})
        },
        body: JSON.stringify({ passcode: entered }),
      });

      const body = await res.json();
      if (res.ok && body.success && body.isAdmin) {
        setIsAuthenticated(true);
        sessionStorage.setItem('coca_app_admin_auth', 'true');
        if (body.sessionId) {
          localStorage.setItem('coca_app_session_token', body.sessionId);
        }
        setAuthError('');
        showToast('Accès administrateur validé et déverrouillé par le serveur');
      } else {
        setAuthError(body.error || "Clé incorrecte. Accès strictement réservé à l'administrateur.");
      }
    } catch (err: any) {
      setAuthError("Erreur de communication avec le serveur d'authentification.");
    }
  };

  const handleLogoutAdmin = () => {
    sessionStorage.removeItem('coca_app_admin_auth');
    setIsAuthenticated(false);
    setPasscode('');
  };

  // ==========================================
  // TRANSACTIONS HANDLERS
  // ==========================================
  const handleApproveTransaction = (txId: string) => {
    const current = getStoredTransactions();
    const target = current.find(t => t.id === txId);
    const isWithdraw = target?.type === 'WITHDRAW';
    const note = isWithdraw 
      ? 'Retrait validé et payé au client par l’administrateur' 
      : 'Dépôt validé par l’administrateur';

    const { updatedTxs, affectedTx } = updateTransactionStatus(txId, 'SUCCESS', note);
    setTransactions(updatedTxs);
    loadAllData();
    if (affectedTx) {
      if (isWithdraw) {
        showToast(`✅ Retrait de ${formatFCFA(affectedTx.amount)} validé et marqué comme payé !`);
      } else {
        showToast(`Transaction ${affectedTx.reference || txId} approuvée avec succès !`);
      }
    }
  };

  const handleOpenCancelModal = (tx: Transaction) => {
    setActionModal({
      isOpen: true,
      type: 'CANCEL',
      tx,
      reason: 'Numéro Mobile Money erroné / Annulé par l’administration'
    });
  };

  const handleOpenRejectModal = (tx: Transaction) => {
    setActionModal({
      isOpen: true,
      type: 'REJECT',
      tx,
      reason: 'Dépôt non réceptionné / Rejet administratif'
    });
  };

  const handleConfirmModalAction = () => {
    if (!actionModal.tx) return;
    const tx = actionModal.tx;
    const reason = actionModal.reason.trim();

    if (actionModal.type === 'CANCEL') {
      const res = cancelWithdrawalByAdmin(tx.id, reason || 'Annulé par l’administrateur');
      setTransactions(getStoredTransactions());
      loadAllData();
      if (res.success) {
        showToast(`Retrait de ${formatFCFA(tx.amount)} annulé : exactement ${formatFCFA(tx.amount)} recrédités sans surplus.`);
      } else {
        showToast(res.message);
      }
    } else if (actionModal.type === 'REJECT') {
      const note = reason || 'Rejeté par l’administration';
      const { updatedTxs } = updateTransactionStatus(tx.id, 'REJECTED', note);
      setTransactions(updatedTxs);
      loadAllData();
      showToast(`Transaction ${tx.reference || tx.id} rejetée.`);
    } else if (actionModal.type === 'APPROVE') {
      handleApproveTransaction(tx.id);
    }

    setActionModal({ isOpen: false, type: 'CANCEL', tx: null, reason: '' });
  };

  const handleCreateManualTx = (e: FormEvent) => {
    e.preventDefault();
    const num = Number(manualAmount);
    if (isNaN(num) || num <= 0) {
      alert("Montant invalide");
      return;
    }

    const newTx = addManualTransaction({
      userName: manualUser || 'Client Inconnu',
      userPhone: manualPhone,
      type: manualType,
      amount: num,
      method: manualMethod,
      status: 'SUCCESS',
      note: manualNote || `Transaction manuelle admin`
    });

    setTransactions([newTx, ...transactions]);
    setShowNewTxModal(false);
    setManualAmount('');
    setManualUser('');
    setManualNote('');
    showToast(`Transaction manuelle ${newTx.reference} créée !`);
  };

  const handleResetTransactions = () => {
    if (confirm("Vider entièrement l'historique des transactions (remise à zéro propre pour la production) ?")) {
      const reset = resetTransactionsToSeed();
      setTransactions(reset);
      showToast("Historique des transactions réinitialisé à zéro");
    }
  };

  // ==========================================
  // USERS HANDLERS
  // ==========================================
  const handleApplyBalanceAdjust = () => {
    if (!balanceEditModalUser) return;
    const num = Number(balanceAdjustAmount);
    if (isNaN(num) || num < 0) {
      alert("Montant invalide");
      return;
    }

    const updated = adjustUserBalance(balanceEditModalUser.id, balanceAdjustOp, num);
    setUsersList(updated);
    showToast(`Solde de ${balanceEditModalUser.name} mis à jour`);
    setBalanceEditModalUser(null);
    setBalanceAdjustAmount('');
  };

  const handleToggleBlock = async (userId: string) => {
    const updated = await toggleBlockUser(userId);
    setUsersList(updated);
    const target = updated.find(u => u.id === userId);
    showToast(target?.isBlocked ? `Compte ${target.name} SUSPENDU` : `Compte ${target?.name} RÉACTIVÉ`);
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (confirm(`Supprimer définitivement le compte de ${name} ?`)) {
      const updated = await deleteUser(userId);
      setUsersList(updated);
      showToast(`Compte ${name} supprimé`);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserPhone) {
      alert("Veuillez renseigner le nom et le téléphone");
      return;
    }

    const num = Number(newUserBalance) || 0;
    const newUser = await createManualUser({
      name: newUserName,
      phone: newUserPhone,
      country: newUserCountry,
      balance: num,
      password: newUserPassword?.trim() || '123456'
    });

    setUsersList([newUser, ...usersList]);
    setShowNewUserModal(false);
    setNewUserName('');
    setNewUserPhone('+225 ');
    setNewUserBalance('0');
    setNewUserPassword('123456');
    showToast(`Nouvel utilisateur ${newUser.name} créé avec succès !`);
  };

  const handleResetUserPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!passwordEditModalUser) return;
    if (!newPasswordValue || newPasswordValue.trim().length < 4) {
      alert("Le mot de passe doit comporter au moins 4 caractères.");
      return;
    }

    const updated = resetUserPassword(passwordEditModalUser.id, newPasswordValue.trim());
    setUsersList(updated);
    showToast(`Mot de passe de ${passwordEditModalUser.name} mis à jour !`);
    setPasswordEditModalUser(null);
    setNewPasswordValue('');
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // ==========================================
  // PRODUCTS HANDLERS
  // ==========================================
  const handleProductFieldChange = (id: number, field: keyof ProductItem, value: any) => {
    setEditingProducts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSaveProduct = (id: number) => {
    const itemToSave = editingProducts[id];
    if (!itemToSave) return;

    const updatedList = products.map(p => p.id === id ? itemToSave : p);
    setProducts(updatedList);
    saveCustomProducts(updatedList);

    setSavedSuccessId(id);
    setTimeout(() => setSavedSuccessId(null), 2000);
    showToast(`Produit "${itemToSave.name}" mis à jour`);
  };

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`Supprimer la franchise "${name}" du catalogue ?`)) {
      const updated = deleteProduct(id);
      setProducts(updated);
      showToast(`Produit ${name} retiré du catalogue`);
    }
  };

  const handleCreateProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!newProdName) {
      alert("Nom du produit requis");
      return;
    }

    const price = Number(newProdPrice) || 10000;
    const daily = Number(newProdDaily) || 1500;
    const duration = Number(newProdDuration) || 90;

    const labelMap: Record<string, string> = {
      BOTTLES: 'Canettes & Bouteilles',
      VENDING: 'Distributeurs & Frigos',
      STOCKS: 'Stocks & Logistique'
    };

    const updated = addProduct({
      name: newProdName,
      category: newProdCat,
      categoryLabel: labelMap[newProdCat] || 'Franchise Coca-Cola',
      description: newProdDesc || 'Pack de franchise physique avec rémunération journalière.',
      price,
      daily,
      duration,
      tag: newProdTag || 'VIP',
      image: newProdImage || 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800',
      allocation: 85,
      isVip: newProdIsVip
    });

    setProducts(updated);
    const prodMap: Record<number, ProductItem> = {};
    updated.forEach(p => { prodMap[p.id] = { ...p }; });
    setEditingProducts(prodMap);

    setShowNewProductModal(false);
    setNewProdName('');
    showToast(`Nouveau produit créé avec succès !`);
  };

  const handleResetProducts = () => {
    if (confirm("Rétablir les barèmes et produits par défaut de l'application ?")) {
      const reset = resetProductsToDefault();
      setProducts(reset);
      const map: Record<number, ProductItem> = {};
      reset.forEach(p => { map[p.id] = { ...p }; });
      setEditingProducts(map);
      showToast("Produits réinitialisés aux barèmes de base");
    }
  };

  // ==========================================
  // PAYMENT METHODS HANDLERS
  // ==========================================
  const handleTogglePaymentMethod = (id: string) => {
    const updated = togglePaymentMethodStatus(id);
    setPaymentMethods(updated);
    showToast("Statut du mode de paiement mis à jour !");
  };

  const handleDeletePaymentMethod = (id: string, name: string) => {
    if (confirm(`Confirmer la suppression définitive du mode de paiement "${name}" ?`)) {
      const updated = deletePaymentMethod(id);
      setPaymentMethods(updated);
      showToast(`Mode de paiement "${name}" supprimé avec succès`);
    }
  };

  const handleCreatePaymentMethod = (e: FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) {
      alert("Le nom du mode de paiement est requis.");
      return;
    }
    const code = newPmName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_' + Date.now().toString(36);
    const created = addPaymentMethod({
      name: newPmName.trim(),
      code: code,
      country: newPmCountry,
      category: newPmCategory,
      accountNumber: newPmAccountNumber.trim(),
      accountName: newPmAccountName.trim(),
      instructions: newPmInstructions.trim(),
      allowsDeposit: newPmAllowsDeposit,
      allowsWithdrawal: newPmAllowsWithdrawal,
      isActive: true,
    });
    setPaymentMethods(getStoredPaymentMethods());
    setShowNewPaymentModal(false);
    // Reset form fields
    setNewPmName('');
    setNewPmAccountNumber('');
    setNewPmAccountName('COCA-COLA DISTRIBUTION');
    setNewPmInstructions('');
    setNewPmAllowsDeposit(true);
    setNewPmAllowsWithdrawal(true);
    showToast(`Mode de paiement "${created.name}" ajouté avec succès !`);
  };

  const handleResetPayments = () => {
    if (confirm("Rétablir les modes de paiement officiels par défaut (Wave, Orange, MTN, Moov) ?")) {
      const def = resetPaymentMethodsToDefault();
      setPaymentMethods(def);
      showToast("Modes de paiement réinitialisés par défaut");
    }
  };

  const handleSaveTchinConfig = async (e: FormEvent) => {
    e.preventDefault();
    setTchinSyncLoading(true);
    const current = getStoredSettings();
    const updated: AppSettings = {
      ...current,
      tchinPublicKey: tchinPk.trim(),
      tchinPrivateKey: tchinSk.trim(),
      tchinPassword: tchinPass.trim(),
      tchinEnvironment: tchinEnv,
      isTchinEnabled: tchinEnabled,
    };
    saveSettings(updated);
    setSettings(updated);
    await updateServerTchinConfig(tchinPk.trim(), tchinSk.trim(), tchinEnv, tchinPass.trim());
    setTchinSyncLoading(false);
    showToast("Configuration Tchin enregistrée et synchronisée avec le serveur !");
  };

  // ==========================================
  // SETTINGS HANDLERS
  // ==========================================
  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    const toSave: AppSettings = {
      ...tempSettings,
      supportWhatsappNumber: tempSettings.customerServiceWhatsapp || tempSettings.supportWhatsappNumber,
      supportTelegramLink: tempSettings.telegramChannelLink || tempSettings.supportTelegramLink,
      supportWhatsappGroupLink: tempSettings.whatsappGroupLink || tempSettings.supportWhatsappGroupLink,
      customerServiceWhatsapp: tempSettings.customerServiceWhatsapp || tempSettings.supportWhatsappNumber,
      telegramChannelLink: tempSettings.telegramChannelLink || tempSettings.supportTelegramLink,
      whatsappGroupLink: tempSettings.whatsappGroupLink || tempSettings.supportWhatsappGroupLink,
    };
    saveSettings(toSave);
    setSettings(toSave);
    setTempSettings(toSave);
    showToast("Paramètres, contacts et canaux officiels enregistrés avec succès !");
  };

  const handleResetSettings = () => {
    if (confirm("Rétablir tous les paramètres système par défaut ?")) {
      const def = resetSettingsToDefault();
      setSettings(def);
      setTempSettings(def);
      showToast("Paramètres système réinitialisés");
    }
  };

  // ==========================================
  // MISSIONS HANDLERS
  // ==========================================
  const handleSaveMission = (id: number) => {
    const item = editingMissions[id];
    if (!item) return;
    const updated = updateMission(id, item);
    setMissionsList(updated);
    showToast(`Mission #${id} mise à jour`);
  };

  const handleDeleteMission = (id: number) => {
    if (confirm("Supprimer cette mission ?")) {
      const updated = deleteMission(id);
      setMissionsList(updated);
      showToast("Mission supprimée");
    }
  };

  const handleCreateMission = (e: FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle) {
      alert("Titre requis");
      return;
    }

    const updated = addMission({
      title: newMissionTitle,
      type: newMissionType,
      target: Number(newMissionTarget) || 5,
      reward: Number(newMissionReward) || 1000
    });

    setMissionsList(updated);
    const missionMap: Record<number, MissionItem> = {};
    updated.forEach(m => { missionMap[m.id] = { ...m }; });
    setEditingMissions(missionMap);

    setShowNewMissionModal(false);
    setNewMissionTitle('');
    showToast("Nouvelle mission ajoutée");
  };

  // ==========================================
  // FAQ HANDLERS
  // ==========================================
  const handleSaveFaq = (id: string) => {
    const item = editingFaq[id];
    if (!item) return;
    const updated = updateFaqItem(id, item);
    setFaqList(updated);
    showToast("Question FAQ mise à jour");
  };

  const handleDeleteFaq = (id: string) => {
    if (confirm("Supprimer cette question ?")) {
      const updated = deleteFaqItem(id);
      setFaqList(updated);
      showToast("Question FAQ supprimée");
    }
  };

  const handleCreateFaq = (e: FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion || !newFaqAnswer) {
      alert("Question et réponse requises");
      return;
    }

    const updated = addFaqItem(newFaqCat, newFaqQuestion, newFaqAnswer);
    setFaqList(updated);
    const faqMap: Record<string, FaqItem> = {};
    updated.forEach(f => { faqMap[f.id] = { ...f }; });
    setEditingFaq(faqMap);

    setShowNewFaqModal(false);
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    showToast("Nouvelle entrée FAQ ajoutée");
  };

  // ==========================================
  // SECURITY PIN CHANGE
  // ==========================================
  const handleChangePin = (e: FormEvent) => {
    e.preventDefault();
    if (!newPinCode || newPinCode.length < 4) {
      alert("Le code PIN doit comporter au moins 4 caractères.");
      return;
    }
    if (newPinCode !== confirmPinCode) {
      alert("Les codes PIN saisis ne correspondent pas.");
      return;
    }

    const updatedSettings: AppSettings = {
      ...settings,
      adminPinCode: newPinCode
    };
    saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setTempSettings(updatedSettings);
    setNewPinCode('');
    setConfirmPinCode('');
    showToast("Nouveau code PIN Admin configuré avec succès !");
  };

  // ==========================================
  // FILTERED DATA
  // ==========================================
  const filteredTxs = transactions.filter(t => {
    if (txFilter !== 'ALL' && t.status !== txFilter) return false;
    if (txTypeFilter !== 'ALL' && t.type !== txTypeFilter) return false;
    if (txSearchQuery) {
      const q = txSearchQuery.toLowerCase();
      const matchName = t.userName?.toLowerCase().includes(q);
      const matchPhone = t.userPhone?.toLowerCase().includes(q);
      const matchRef = t.reference?.toLowerCase().includes(q);
      const matchAmount = t.amount.toString().includes(q);
      return matchName || matchPhone || matchRef || matchAmount;
    }
    return true;
  });

  const filteredUsers = Array.isArray(usersList) ? usersList.filter(u => {
    if (userCountryFilter !== 'ALL' && u.country !== userCountryFilter) return false;
    if (userSearch) {
      const q = userSearch.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.phone.toLowerCase().includes(q) || u.referralCode.toLowerCase().includes(q);
    }
    return true;
  }) : [];

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl rounded-3xl p-7 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-red-600/20 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h1 className="font-['Poppins'] text-2xl font-bold text-center text-white mb-1">
            Administration Globale
          </h1>
          <p className="text-neutral-400 text-center text-xs mb-6">
            Espace sécurisé de contrôle intégral • Coca-Cola Invest Partner Network
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Clé d'Accès Sécurisée (Code PIN)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Code secret..."
                  className="w-full bg-neutral-950/80 border border-neutral-700 focus:border-red-500 rounded-xl py-3.5 pl-4 pr-11 text-white text-sm outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 active:scale-98 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Ouvrir le Panneau de Contrôle</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
            <span className="text-[11px] text-neutral-500">
              Système Sécurisé • IP protégée
            </span>
            <button
              onClick={onBackToApp}
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l'App</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN ADMIN DASHBOARD INTERFACE
  // ==========================================
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-2xl flex items-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-900/90 border-b border-neutral-800 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToApp}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer flex items-center space-x-1 text-xs font-semibold"
            title="Retour à l'application mobile"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Coca-Cola Super Admin</span>
                {settings.isMaintenanceMode && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono uppercase">
                    Maintenance ON
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-neutral-400">Contrôle total & Modifiable à 100%</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadAllData}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogoutAdmin}
            className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verrouiller</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-neutral-900/50 border-b border-neutral-800 px-4 pt-2 overflow-x-auto scrollbar-none flex space-x-2">
        {[
          { id: 'TRANSACTIONS', label: 'Transactions', icon: DollarSign, badge: transactions.filter(t => t.status === 'PENDING').length },
          { id: 'USERS', label: 'Utilisateurs & Soldes', icon: Users, badge: usersList.length },
          { id: 'PRODUCTS', label: 'Produits & VIP', icon: Layers, badge: products.length },
          { id: 'PAYMENTS', label: 'Modes de Paiement', icon: CreditCard, badge: paymentMethods.length },
          { id: 'COUNTRIES', label: 'Pays & Régions', icon: Globe, badge: `${countriesList.filter(c => c.isActive).length}/${countriesList.length}` },
          { id: 'REFERRALS', label: 'Parrainages & Équipes', icon: Network, badge: (usersList || []).filter(u => (usersList || []).some(f => f.referrerCode === u.referralCode)).length },
          { id: 'INVESTMENTS', label: 'Investissements & 24h', icon: Sparkles, badge: allInvestments.length },
          { id: 'SETTINGS', label: 'Support & Paramètres', icon: Settings },
          { id: 'MISSIONS', label: 'Missions', icon: Target, badge: missionsList.length },
          { id: 'FAQ', label: 'FAQ', icon: HelpCircle, badge: faqList.length },
          { id: 'SECURITY', label: 'Sécurité PIN', icon: KeyRound }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center space-x-2 py-2.5 px-3.5 rounded-t-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border-b-2 ${
                isActive 
                  ? 'bg-neutral-800 text-white border-red-500 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200 border-transparent hover:bg-neutral-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-red-500' : ''}`} />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-6xl w-full mx-auto pb-20">

        {/* ========================================================================= */}
        {/* TAB 1: TRANSACTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'TRANSACTIONS' && (
          <div className="space-y-4">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">En Attente</p>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {Array.isArray(transactions) ? transactions.filter(t => t.status === 'PENDING').length : 0}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Validées</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {Array.isArray(transactions) ? transactions.filter(t => t.status === 'SUCCESS').length : 0}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Annulées (Remb.)</p>
                <p className="text-xl font-bold text-orange-400 mt-1">
                  {Array.isArray(transactions) ? transactions.filter(t => t.status === 'CANCELLED').length : 0}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Dépôts Attente</p>
                <p className="text-sm font-bold text-white mt-1">
                  {formatFCFA(Array.isArray(transactions) ? transactions.filter(t => t.status === 'PENDING' && t.type === 'DEPOSIT').reduce((acc, c) => acc + c.amount, 0) : 0)}
                </p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Retraits Attente</p>
                <p className="text-sm font-bold text-white mt-1">
                  {formatFCFA(Array.isArray(transactions) ? transactions.filter(t => t.status === 'PENDING' && t.type === 'WITHDRAW').reduce((acc, c) => acc + c.amount, 0) : 0)}
                </p>
              </div>
            </div>

            {/* Pending Withdrawals Alert Banner */}
            {transactions.filter(t => t.status === 'PENDING' && t.type === 'WITHDRAW').length > 0 && (
              <div className="bg-gradient-to-r from-amber-950/70 via-neutral-900 to-neutral-900 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-xl shadow-amber-950/30">
                <div className="flex items-start sm:items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-black text-white text-sm">
                      {transactions.filter(t => t.status === 'PENDING' && t.type === 'WITHDRAW').length} demande(s) de retrait en attente d'envoi
                    </p>
                    <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                      Les retraits sont transmis manuellement par l'administrateur. Effectuez le versement Mobile Money sur le numéro du client puis validez ci-dessous.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTxFilter('PENDING');
                    setTxTypeFilter('WITHDRAW');
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer transition-colors shadow-md shadow-amber-500/20"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Voir les retraits à payer ({Array.isArray(transactions) ? transactions.filter(t => t.status === 'PENDING' && t.type === 'WITHDRAW').length : 0})</span>
                </button>
              </div>
            )}

            {/* Action Bar & Filters */}
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text"
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    placeholder="Chercher client, téléphone, réf..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <select
                  value={txFilter}
                  onChange={(e: any) => setTxFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-2.5 py-1.5 text-neutral-200 outline-none"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="PENDING">En attente uniquement</option>
                  <option value="SUCCESS">Validés</option>
                  <option value="CANCELLED">Annulés & Remboursés</option>
                  <option value="REJECTED">Rejetés</option>
                </select>

                <select
                  value={txTypeFilter}
                  onChange={(e: any) => setTxTypeFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-2.5 py-1.5 text-neutral-200 outline-none"
                >
                  <option value="ALL">Dépôts & Retraits</option>
                  <option value="DEPOSIT">Dépôts uniquement</option>
                  <option value="WITHDRAW">Retraits uniquement</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewTxModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Transaction</span>
                </button>
                <button
                  onClick={handleResetTransactions}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white p-2 rounded-xl text-xs cursor-pointer"
                  title="Réinitialiser données démo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="space-y-2.5">
              {filteredTxs.length === 0 ? (
                <div className="text-center py-12 bg-neutral-900/50 rounded-2xl border border-neutral-800 text-neutral-500 text-xs">
                  Aucune transaction ne correspond à ce filtre.
                </div>
              ) : (
                filteredTxs.map(tx => (
                  <div 
                    key={tx.id}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                        tx.type === 'DEPOSIT' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            tx.type === 'DEPOSIT' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {tx.type === 'DEPOSIT' ? 'Dépôt Client' : 'Demande Retrait'}
                          </span>
                          <span className="font-bold text-sm text-white">{formatFCFA(tx.amount)}</span>
                          {tx.type === 'WITHDRAW' && (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/50 px-2 py-0.5 rounded">
                              Net à virer : {formatFCFA(Math.round(tx.amount * 0.9))}
                            </span>
                          )}
                          <span className="text-xs text-neutral-400">• {tx.method}</span>
                        </div>
                        <p className="text-xs text-neutral-300 font-medium mt-1">
                          Client: <span className="text-white font-semibold">{tx.userName || 'Non spécifié'}</span> ({tx.userPhone || 'Sans tél'})
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-neutral-500 mt-1">
                          <span>Réf: <code className="text-neutral-300 font-mono">{tx.reference || tx.id}</code></span>
                          <span>•</span>
                          <span>{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {tx.note && (
                            <>
                              <span>•</span>
                              <span className="text-neutral-400 italic">"{tx.note}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center flex-wrap gap-y-1">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg ${
                        tx.status === 'SUCCESS' ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40' :
                        tx.status === 'REJECTED' ? 'bg-red-950/50 text-red-300 border border-red-800/40' :
                        tx.status === 'CANCELLED' ? 'bg-orange-950/50 text-orange-300 border border-orange-800/40' :
                        'bg-amber-950/50 text-amber-300 border border-amber-700/40 animate-pulse'
                      }`}>
                        {tx.status === 'SUCCESS' ? 'Validé' : 
                         tx.status === 'REJECTED' ? 'Rejeté' : 
                         tx.status === 'CANCELLED' ? 'Annulé (Remboursé)' : 
                         'En Attente'}
                      </span>

                      {/* 1. Transaction En Attente (PENDING) */}
                      {tx.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApproveTransaction(tx.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-md shadow-emerald-600/20"
                            title={tx.type === 'WITHDRAW' ? 'Valider que le transfert Mobile Money a été envoyé au client' : 'Valider le dépôt (créditer)'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{tx.type === 'WITHDRAW' ? 'Valider Paiement' : 'Valider'}</span>
                          </button>

                          {tx.type === 'WITHDRAW' ? (
                            <button
                              onClick={() => handleOpenCancelModal(tx)}
                              className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-md shadow-amber-600/20"
                              title="Annuler ce retrait et recréditer immédiatement le solde du client"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              <span>Annuler & Rembourser</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRejectModal(tx)}
                              className="bg-red-950 hover:bg-red-900 border border-red-800/60 text-red-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                              title="Rejeter le dépôt"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejeter</span>
                            </button>
                          )}

                          {tx.type === 'WITHDRAW' && (
                            <button
                              onClick={() => handleOpenRejectModal(tx)}
                              className="bg-red-950 hover:bg-red-900 border border-red-800/60 text-red-300 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer"
                              title="Rejeter la demande"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Refuser</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* 2. Retrait déjà Validé (SUCCESS) : L'administrateur peut toujours l'annuler et rembourser le client */}
                      {tx.status === 'SUCCESS' && tx.type === 'WITHDRAW' && (
                        <button
                          onClick={() => handleOpenCancelModal(tx)}
                          className="bg-neutral-800 hover:bg-amber-950 text-neutral-300 hover:text-amber-300 border border-neutral-700 hover:border-amber-800/60 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Annuler ce retrait payé et restituer les fonds au solde du client"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Annuler / Rembourser</span>
                        </button>
                      )}

                      {/* 3. Dépôt déjà Validé (SUCCESS) : L'administrateur peut annuler et débiter en cas d'erreur */}
                      {tx.status === 'SUCCESS' && tx.type === 'DEPOSIT' && (
                        <button
                          onClick={() => handleOpenCancelModal(tx)}
                          className="bg-neutral-800 hover:bg-red-950 text-neutral-400 hover:text-red-300 border border-neutral-700 hover:border-red-800/60 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Annuler ce dépôt et débiter les fonds du client"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Annuler (Débiter)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: UTILISATEURS & SOLDES */}
        {/* ========================================================================= */}
        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input 
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Chercher nom, téléphone, code..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <select
                  value={userCountryFilter}
                  onChange={(e: any) => setUserCountryFilter(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-2.5 py-1.5 text-neutral-200 outline-none"
                >
                  <option value="ALL">🌍 Tous les pays ({usersList.length})</option>
                  {countriesList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({(usersList || []).filter(u => u.country === c.code).length})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowNewUserModal(true)}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Créer Utilisateur</span>
              </button>
            </div>

            {/* Users Cards Grid */}
            {filteredUsers.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center text-neutral-400">
                <Users className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                <p className="font-bold text-base text-neutral-300">Aucun utilisateur pour le moment</p>
                <p className="text-xs text-neutral-500 mt-1">Tous les nouveaux membres inscrits s'afficheront ici en temps réel.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredUsers.map(userItem => (
                  <div 
                    key={userItem.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      userItem.isBlocked 
                        ? 'bg-red-950/20 border-red-900/40' 
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-white">{userItem.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          {getCountryInfo(userItem.country).flag} {getCountryInfo(userItem.country).name}
                        </span>
                        {userItem.isBlocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-900/60 text-red-200">
                            Suspendu
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">{userItem.phone} • Réf: <span className="font-mono text-neutral-300">{userItem.referralCode}</span></p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-neutral-400 uppercase font-semibold">Solde</p>
                      <p className="text-base font-bold text-emerald-400">{formatFCFA(userItem.balance)}</p>
                    </div>
                  </div>

                  {/* Ligne Mot de Passe Utilisateur */}
                  <div className="mt-2.5 px-3 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800/90 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="text-neutral-400 text-[11px]">Mot de passe:</span>
                        <span className="font-mono font-bold text-white text-xs tracking-wider">
                          {visiblePasswords[userItem.id] ? (userItem.password || 'password123') : '••••••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(userItem.id)}
                        className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 cursor-pointer transition-colors"
                        title={visiblePasswords[userItem.id] ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {visiblePasswords[userItem.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPasswordEditModalUser(userItem);
                        setNewPasswordValue(userItem.password || 'password123');
                      }}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-800/50 px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors flex-shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Modifier MDP</span>
                    </button>
                  </div>

                  {/* Actions for this user */}
                  <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => {
                          setBalanceEditModalUser(userItem);
                          setBalanceAdjustAmount('');
                          setBalanceAdjustOp('ADD');
                        }}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Modifier Solde</span>
                      </button>

                      <button
                        onClick={() => {
                          setGiftModalUser(userItem);
                          setGiftSelectedProductId(products[0]?.id || 1);
                          setGiftNote("Offert par l'administration");
                        }}
                        className="bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                        title="Offrir un produit (0 commission de parrainage)"
                      >
                        <Gift className="w-3.5 h-3.5 text-amber-400" />
                        <span>Offrir Franchise</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleToggleBlock(userItem.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer ${
                          userItem.isBlocked 
                            ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900' 
                            : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{userItem.isBlocked ? 'Débloquer' : 'Bloquer'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteUser(userItem.id, userItem.name)}
                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors cursor-pointer"
                        title="Supprimer définitivement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PRODUITS & VIP */}
        {/* ========================================================================= */}
        {activeTab === 'PRODUCTS' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
              <div>
                <h2 className="text-sm font-bold text-white">Barèmes des Franchises & Packs VIP</h2>
                <p className="text-xs text-neutral-400">Modifiez les prix, rendements quotidiens, durées et statuts de chaque produit</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewProductModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Franchise</span>
                </button>
                <button
                  onClick={handleResetProducts}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Barèmes d'origine</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map(product => {
                const draft = editingProducts[product.id] || product;
                const isSavedSuccess = savedSuccessId === product.id;
                const rate = draft.price > 0 ? ((draft.daily / draft.price) * 100).toFixed(1) : '0';
                const totalGains = draft.daily * draft.duration;

                return (
                  <div 
                    key={product.id}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-4 rounded-2xl space-y-3 transition-colors relative overflow-hidden"
                  >
                    {isSavedSuccess && (
                      <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Check className="w-3 h-3" /> Enregistré
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <img 
                        src={draft.image} 
                        alt={draft.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-neutral-800 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <input
                          type="text"
                          value={draft.name}
                          onChange={(e) => handleProductFieldChange(product.id, 'name', e.target.value)}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-red-500"
                        />
                        <div className="flex items-center space-x-2 mt-1.5 text-[11px]">
                          <span className="text-neutral-400">{draft.categoryLabel}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-semibold">+{rate}% / jour</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Prix (FCFA)</label>
                        <input
                          type="number"
                          value={draft.price}
                          onChange={(e) => handleProductFieldChange(product.id, 'price', Number(e.target.value))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Gain/Jour</label>
                        <input
                          type="number"
                          value={draft.daily}
                          onChange={(e) => handleProductFieldChange(product.id, 'daily', Number(e.target.value))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Durée (Jours)</label>
                        <input
                          type="number"
                          value={draft.duration}
                          onChange={(e) => handleProductFieldChange(product.id, 'duration', Number(e.target.value))}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] text-neutral-300">
                          <input
                            type="checkbox"
                            checked={draft.isVip || false}
                            onChange={(e) => handleProductFieldChange(product.id, 'isVip', e.target.checked)}
                            className="rounded bg-neutral-950 border-neutral-700 text-red-600 focus:ring-0"
                          />
                          <span>Badge VIP</span>
                        </label>
                        <input
                          type="text"
                          value={draft.tag}
                          onChange={(e) => handleProductFieldChange(product.id, 'tag', e.target.value)}
                          placeholder="Badge tag..."
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-[11px] text-neutral-300 w-28"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteProduct(product.id, draft.name)}
                          className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 cursor-pointer"
                          title="Supprimer produit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSaveProduct(product.id)}
                          className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer shadow"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: INVESTISSEMENTS & REVENUS 24H */}
        {/* ========================================================================= */}
        {activeTab === 'INVESTMENTS' && (
          <div className="space-y-6">
            {/* Header / KPIs */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5 text-red-500">
                  <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Investissements & Automatisation 24h</h2>
                    <p className="text-xs text-neutral-400">Suivi des cycles de distribution quotidienne et règles strictes de parrainage</p>
                  </div>
                </div>

                <button
                  onClick={handleTriggerCycleForAll}
                  className="bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 cursor-pointer transition-all"
                  title="Vérifie et crédite immédiatement tous les comptes ayant 24h révolues"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Exécuter le cycle 24h pour tous</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Total Franchises Actives</span>
                  <p className="text-xl font-bold text-white font-mono mt-0.5">{allInvestments.length}</p>
                  <span className="text-[10px] text-neutral-400">Tous utilisateurs confondus</span>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Revenus 24h Distribués</span>
                  <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                    {formatFCFA(allInvestments.reduce((acc, i) => acc + (i.totalEarned || 0), 0))}
                  </p>
                  <span className="text-[10px] text-neutral-400">Crédités automatiquement après 24h</span>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-neutral-400">Commissions 1er Achat</span>
                  <p className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                    {formatFCFA(allCommissionLogs.reduce((acc, l) => acc + l.amount, 0))}
                  </p>
                  <span className="text-[10px] text-neutral-400">18% N1 • 2% N2 • 1% N3</span>
                </div>
              </div>

              {/* Strict Business Rules Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center space-x-2 text-white font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Règles de Gestion Automatisées en Vigueur</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-300">
                  <div className="p-2.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="font-semibold text-white">1. Crédit Quotidien Automatique 24h</span>
                    <p className="text-neutral-400 mt-0.5">Les bénéfices journaliers de chaque produit sont automatiquement versés au solde 24 heures après la commande ou le dernier gain.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="font-semibold text-white">2. Commissions sur 1er Investissement Uniquement</span>
                    <p className="text-neutral-400 mt-0.5">Le parrain touche sa prime de niveau (N1/N2/N3) seulement au tout premier achat réel du filleul.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="font-semibold text-white">3. Second Investissement Exclu</span>
                    <p className="text-neutral-400 mt-0.5">Un second achat de franchise par un utilisateur ne génère plus aucune commission pour ses parrains.</p>
                  </div>
                  <div className="p-2.5 bg-neutral-950/60 rounded-lg border border-neutral-800/80">
                    <span className="font-semibold text-white">4. Dépôts & Offres Admin Exclus</span>
                    <p className="text-neutral-400 mt-0.5">Les simples dépôts de solde et les franchises offertes par l'administrateur ne génèrent aucune commission.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table 1: All Investments */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Portefeuille Global des Franchises ({allInvestments.length})</h3>
                  <p className="text-[11px] text-neutral-400">Détail des investissements actifs et de la cadence de rentabilité</p>
                </div>
                <span className="text-[11px] bg-red-950/60 text-red-400 border border-red-800/50 px-2.5 py-1 rounded-full font-bold">
                  Cadence 24H
                </span>
              </div>

              {allInvestments.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Aucun investissement actif enregistré pour le moment.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                        <th className="p-3">Utilisateur</th>
                        <th className="p-3">Franchise</th>
                        <th className="p-3">Origine</th>
                        <th className="p-3">Coût</th>
                        <th className="p-3">Gain / 24h</th>
                        <th className="p-3">Avancement</th>
                        <th className="p-3">Cumul Reçu</th>
                        <th className="p-3">Statut 24h</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {allInvestments.map(inv => {
                        const targetUser = usersList.find(u => u.id === inv.userId);
                        const isGift = inv.source === 'ADMIN_GIFT';
                        const progress = inv.duration > 0 ? Math.min(100, Math.round((inv.daysElapsed / inv.duration) * 100)) : 0;
                        const nextPayTime = new Date(new Date(inv.lastCreditDate).getTime() + 24 * 60 * 60 * 1000);
                        const isDue = Date.now() >= nextPayTime.getTime();

                        return (
                          <tr key={inv.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="p-3">
                              <p className="font-bold text-white">{targetUser ? targetUser.name : `ID: ${inv.userId}`}</p>
                              <p className="text-[10px] text-neutral-400">{targetUser?.phone || ''}</p>
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-neutral-200">{inv.productName}</span>
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isGift ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              }`}>
                                {isGift ? '🎁 Offre Admin' : '💳 Achat Client'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-neutral-300">
                              {formatFCFA(inv.price)}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              +{formatFCFA(inv.daily)}
                            </td>
                            <td className="p-3">
                              <div className="w-24">
                                <div className="flex justify-between text-[10px] text-neutral-400 mb-1">
                                  <span>{inv.daysElapsed}j / {inv.duration}j</span>
                                  <span>{progress}%</span>
                                </div>
                                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-white">
                              {formatFCFA(inv.totalEarned)}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-max ${
                                isDue ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-neutral-800 text-neutral-300'
                              }`}>
                                <Clock className="w-3 h-3" />
                                <span>{isDue ? 'Prêt à créditer' : 'En cours (24h)'}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Table 2: Referral Commission Logs */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Historique des Commissions de Parrainage ({allCommissionLogs.length})</h3>
                  <p className="text-[11px] text-neutral-400">Audit des commissions déclenchées UNIQUEMENT au 1er investissement</p>
                </div>
                <span className="text-[11px] bg-amber-950/60 text-amber-400 border border-amber-800/40 px-2.5 py-1 rounded-full font-bold">
                  1er Achat Exclusif
                </span>
              </div>

              {allCommissionLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Aucune commission de parrainage n'a encore été générée.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                        <th className="p-3">Date</th>
                        <th className="p-3">Parrain Crédité</th>
                        <th className="p-3">Filleul (Acheteur)</th>
                        <th className="p-3">Niveau & Taux</th>
                        <th className="p-3">Franchise</th>
                        <th className="p-3">Montant Reçu</th>
                        <th className="p-3">Règle Validée</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {allCommissionLogs.map(log => {
                        const sponsor = usersList.find(u => u.id === log.sponsorId);
                        const buyer = usersList.find(u => u.id === log.downlineId);

                        return (
                          <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                            <td className="p-3 text-[11px] text-neutral-400 font-mono">
                              {new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {sponsor ? sponsor.name : log.sponsorName}
                            </td>
                            <td className="p-3 text-neutral-300">
                              {buyer ? buyer.name : log.downlineName}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                                Niveau {log.level} ({log.percentage}%)
                              </span>
                            </td>
                            <td className="p-3 text-neutral-300">
                              {log.productName}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              +{formatFCFA(log.amount)}
                            </td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                                <Check className="w-3 h-3" />
                                <span>1er Achat Validé</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MODES DE PAIEMENT (PAYMENTS) */}
        {/* ========================================================================= */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-5 rounded-2xl">
              <div>
                <div className="flex items-center space-x-2 text-red-500 mb-1">
                  <CreditCard className="w-5 h-5" />
                  <h2 className="font-bold text-base text-white">Gestion des Modes de Paiement</h2>
                </div>
                <p className="text-xs text-neutral-400">
                  Ajoutez, activez ou supprimez les passerelles de paiement (Orange Money, Wave, MTN, Moov, etc.) pour les dépôts et retraits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowNewPaymentModal(true)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un mode de paiement</span>
                </button>
                <button
                  onClick={handleResetPayments}
                  className="px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Rétablir les modes par défaut"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Par défaut</span>
                </button>
              </div>
            </div>

            {/* TCHIN DIRECT PAYMENT GATEWAY CARD */}
            <form onSubmit={handleSaveTchinConfig} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-white">Passerelle Tchin — Page de Paiement Hébergée</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tchinEnabled 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' 
                          : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {tchinEnabled ? 'Passerelle Active' : 'Passerelle Désactivée'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Encaisser avec la page de paiement officielle Tchin (POST /payments). Le client choisit son pays et son opérateur sur la page Tchin, paie et revient sur l'application.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setTchinEnabled(!tchinEnabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tchinEnabled
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {tchinEnabled ? 'Activé' : 'Désactivé'}
                  </button>
                </div>
              </div>

              {/* Environment toggle */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1.5">Environnement d'exécution</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setTchinEnv('sandbox')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        tchinEnv === 'sandbox'
                          ? 'bg-amber-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      🧪 Sandbox (Test)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTchinEnv('live')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        tchinEnv === 'live'
                          ? 'bg-red-600 text-white shadow'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      🚀 Live (Production)
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    En Sandbox, le simulateur intégré permet de tester toutes les issues instantanément.
                  </p>
                </div>

                {/* Public Key */}
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1.5">
                    Clé Publique (TCHIN-PUBLIC-KEY)
                  </label>
                  <input
                    type="text"
                    value={tchinPk}
                    onChange={(e) => setTchinPk(e.target.value)}
                    placeholder="tchin_pk_xxxxxxxx"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Identifiant d'accès à l'API Tchin.</p>
                </div>

                {/* Private Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-neutral-400 font-semibold">
                      Clé Privée (TCHIN-PRIVATE-KEY)
                    </label>
                    <button
                      type="button"
                      onClick={() => setTchinShowSk(!tchinShowSk)}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                    >
                      {tchinShowSk ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{tchinShowSk ? 'Masquer' : 'Afficher'}</span>
                    </button>
                  </div>
                  <input
                    type={tchinShowSk ? "text" : "password"}
                    value={tchinSk}
                    onChange={(e) => setTchinSk(e.target.value)}
                    placeholder="tchin_sk_xxxxxxxx"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Sécurisée côté serveur (ne fuite jamais vers le navigateur client).
                  </p>
                </div>

                {/* API Password / PIN (Optional for direct debit API) */}
                <div>
                  <label className="block text-neutral-400 font-semibold mb-1.5">
                    Mot de passe API Marchand (Optionnel)
                  </label>
                  <input
                    type="password"
                    value={tchinPass}
                    onChange={(e) => setTchinPass(e.target.value)}
                    placeholder="Optionnel : Mot de passe marchand Tchin"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Requis uniquement si vous avez configuré un mot de passe pour les débits directs sur votre dashboard Tchin.
                  </p>
                </div>
              </div>

              {/* Supported outcomes badges */}
              <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Page Tchin gère :</span>
                  <span className="px-2 py-0.5 rounded-lg bg-blue-950/40 text-blue-400 border border-blue-800/30 text-[11px] font-mono">
                    Wave CI / SN
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-orange-950/40 text-orange-400 border border-orange-800/30 text-[11px] font-mono">
                    Orange Money CI / BF
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-yellow-950/40 text-yellow-400 border border-yellow-800/30 text-[11px] font-mono">
                    MTN Mobile CI
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 text-[11px] font-mono">
                    Moov Money CI / BF
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={tchinSyncLoading}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center space-x-2 shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
                >
                  {tchinSyncLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer & Synchroniser</span>
                </button>
              </div>
            </form>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: `Tous les pays (${paymentMethods.length})` },
                ...countriesList.map(c => ({
                  id: c.code,
                  label: `${c.flag} ${c.name} (${paymentMethods.filter(p => p.country === c.code || p.country === 'ALL').length})`
                }))
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPmFilterCountry(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    pmFilterCountry === f.id
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Payment Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods
                .filter(pm => pmFilterCountry === 'ALL' || pm.country === pmFilterCountry || pm.country === 'ALL')
                .map((pm) => (
                  <div 
                    key={pm.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      pm.isActive 
                        ? 'bg-neutral-900 border-neutral-800 shadow-sm' 
                        : 'bg-neutral-950/60 border-neutral-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            pm.country === 'ALL'
                              ? 'bg-neutral-800 text-neutral-300'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          }`}>
                            {pm.country === 'ALL' ? '🌍 Tous pays' : `${getCountryInfo(pm.country).flag} ${getCountryInfo(pm.country).name}`}
                          </span>
                          <span className="text-[10px] font-medium text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                            {pm.category === 'MOBILE_MONEY' ? 'Mobile Money' : pm.category === 'BANK' ? 'Banque' : 'Crypto'}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-white mt-1.5">{pm.name}</h3>
                      </div>

                      <button
                        onClick={() => handleTogglePaymentMethod(pm.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          pm.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {pm.isActive ? 'Actif' : 'Désactivé'}
                      </button>
                    </div>

                    {/* Account Info */}
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 space-y-1.5 mb-3 text-xs">
                      {pm.accountNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">Numéro / Compte :</span>
                          <span className="font-mono font-bold text-white text-[11px]">{pm.accountNumber}</span>
                        </div>
                      )}
                      {pm.accountName && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 text-[11px]">Titulaire :</span>
                          <span className="font-semibold text-neutral-300 text-[11px] truncate max-w-[140px]">{pm.accountName}</span>
                        </div>
                      )}
                      {pm.instructions && (
                        <div className="pt-1 border-t border-neutral-800 text-[10px] text-neutral-400 italic">
                          "{pm.instructions}"
                        </div>
                      )}
                    </div>

                    {/* Operations supported */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/60">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          pm.allowsDeposit ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          {pm.allowsDeposit ? '✓ Dépôt' : '✗ Pas de dépôt'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          pm.allowsWithdrawal ? 'bg-sky-950/40 text-sky-400 border border-sky-800/30' : 'bg-neutral-800 text-neutral-500'
                        }`}>
                          {pm.allowsWithdrawal ? '✓ Retrait' : '✗ Pas de retrait'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeletePaymentMethod(pm.id, pm.name)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer ce mode de paiement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: PAYS & RÉGIONS (COUNTRIES) */}
        {/* ========================================================================= */}
        {activeTab === 'COUNTRIES' && (
          <AdminCountriesTab onNotify={(msg) => setToastMessage(msg)} />
        )}

        {/* ========================================================================= */}
        {/* TAB: PARRAINAGES & ÉQUIPES (REFERRALS) */}
        {/* ========================================================================= */}
        {activeTab === 'REFERRALS' && (
          <div className="space-y-6">
            {/* Top KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Total Utilisateurs</p>
                <p className="text-xl font-bold text-white mt-1">{usersList.length}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Inscrits sur la plateforme</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Parrains Actifs</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {(usersList || []).filter(u => (usersList || []).some(down => down.referrerCode === u.referralCode)).length}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Ayant au moins 1 filleul direct</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Filleuls Parrainés</p>
                <p className="text-xl font-bold text-sky-400 mt-1">
                  {(usersList || []).filter(u => !!u.referrerCode).length}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Inscrits via lien d'invitation</p>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                <p className="text-[11px] text-neutral-400 uppercase font-semibold">Commissions Versées</p>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {formatFCFA(allCommissionLogs.reduce((acc, log) => acc + log.amount, 0))}
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{allCommissionLogs.length} transactions validées</p>
              </div>
            </div>

            {/* Commission Rules Info Banner */}
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Barème Officiel Coca-Cola Invest</h4>
                  <p className="text-neutral-400 text-[11px]">
                    Niveau 1: <strong className="text-emerald-400">18%</strong> • Niveau 2: <strong className="text-sky-400">2%</strong> • Niveau 3: <strong className="text-amber-400">1%</strong>
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-neutral-950 px-3 py-1.5 rounded-xl border border-neutral-800 text-neutral-300 font-semibold self-start sm:self-auto">
                Validé UNIQUEMENT au 1er achat de franchise
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={referralSearch}
                  onChange={(e) => setReferralSearch(e.target.value)}
                  placeholder="Rechercher par nom, téléphone ou code parrain..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto">
                {[
                  { id: 'ALL', label: 'Tous' },
                  { id: 'SPONSORS', label: 'Parrains avec Filleuls' },
                  { id: 'DOWNLINES', label: 'Filleuls Parrainés' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReferralFilter(tab.id as 'ALL' | 'SPONSORS' | 'DOWNLINES')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      referralFilter === tab.id
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'text-neutral-400 hover:text-white bg-neutral-900/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Network Table */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Arborescence & Membres Réseau</h3>
                  <p className="text-[11px] text-neutral-400">Visualisez qui a parrainé qui, les équipes et les gains distribués</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Son Code Parrain</th>
                      <th className="p-3">Son Parrain Direct</th>
                      <th className="p-3">Ses Filleuls Directs (N1)</th>
                      <th className="p-3">Commissions Touchées</th>
                      <th className="p-3 text-right">Détails Équipe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {usersList
                      .filter(user => {
                        const directDownlines = (usersList || []).filter(u => u.referrerCode === user.referralCode);
                        if (referralFilter === 'SPONSORS' && directDownlines.length === 0) return false;
                        if (referralFilter === 'DOWNLINES' && !user.referrerCode) return false;
                        if (!referralSearch.trim()) return true;
                        const query = referralSearch.toLowerCase();
                        return (
                          user.name.toLowerCase().includes(query) ||
                          user.phone.toLowerCase().includes(query) ||
                          user.referralCode.toLowerCase().includes(query) ||
                          (user.referrerCode && user.referrerCode.toLowerCase().includes(query))
                        );
                      })
                      .map(user => {
                        const directDownlines = (usersList || []).filter(u => u.referrerCode === user.referralCode);
                        const sponsorUser = usersList.find(u => u.referralCode === user.referrerCode);
                        const userTotalEarned = allCommissionLogs
                          .filter(log => log.sponsorId === user.id)
                          .reduce((acc, log) => acc + log.amount, 0);
                        const isExpanded = expandedSponsorId === user.id;

                        return (
                          <Fragment key={user.id}>
                            <tr className={`hover:bg-neutral-800/30 transition-colors ${isExpanded ? 'bg-neutral-800/20' : ''}`}>
                              <td className="p-3">
                                <div className="font-semibold text-white">{user.name}</div>
                                <div className="text-[11px] text-neutral-400 font-mono flex items-center space-x-1.5">
                                  <span>{getCountryInfo(user.country).flag}</span>
                                  <span>{user.phone}</span>
                                </div>
                              </td>

                              <td className="p-3">
                                <span className="font-mono text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded text-[11px] font-bold">
                                  {user.referralCode}
                                </span>
                              </td>

                              <td className="p-3">
                                {sponsorUser ? (
                                  <div>
                                    <div className="font-semibold text-emerald-400">{sponsorUser.name}</div>
                                    <div className="text-[10px] text-neutral-400 font-mono">Code: {sponsorUser.referralCode}</div>
                                  </div>
                                ) : user.referrerCode ? (
                                  <div className="text-neutral-400 font-mono text-[11px]">
                                    Code: {user.referrerCode}
                                  </div>
                                ) : (
                                  <span className="text-neutral-500 text-[11px] italic">
                                    Inscription Directe
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  directDownlines.length > 0 
                                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' 
                                    : 'bg-neutral-800 text-neutral-400'
                                }`}>
                                  {directDownlines.length} {directDownlines.length > 1 ? 'filleuls' : 'filleul'}
                                </span>
                              </td>

                              <td className="p-3 font-mono font-bold text-amber-400">
                                {userTotalEarned > 0 ? `+${formatFCFA(userTotalEarned)}` : '0 FCFA'}
                              </td>

                              <td className="p-3 text-right">
                                {directDownlines.length > 0 ? (
                                  <button
                                    onClick={() => setExpandedSponsorId(isExpanded ? null : user.id)}
                                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-semibold transition-colors cursor-pointer inline-flex items-center space-x-1"
                                  >
                                    <span>{isExpanded ? 'Masquer' : `Voir ${directDownlines.length} filleuls`}</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                ) : (
                                  <span className="text-neutral-500 text-[10px]">Aucun filleul</span>
                                )}
                              </td>
                            </tr>

                            {/* Accordion: Downlines Details */}
                            {isExpanded && directDownlines.length > 0 && (
                              <tr>
                                <td colSpan={6} className="p-0 bg-neutral-950/80 border-b border-neutral-800">
                                  <div className="p-4 pl-8 space-y-2 border-l-2 border-red-500 ml-4 my-2">
                                    <h5 className="font-bold text-[11px] text-neutral-300 uppercase tracking-wider">
                                      Filleuls directs de {user.name} ({directDownlines.length}) :
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {directDownlines.map(down => {
                                        const hasInvested = allInvestments.some(inv => inv.userId === down.id);
                                        const earnedFromThisDownline = allCommissionLogs
                                          .filter(log => log.sponsorId === user.id && log.downlineId === down.id)
                                          .reduce((acc, log) => acc + log.amount, 0);

                                        return (
                                          <div key={down.id} className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="font-bold text-white text-xs">{down.name}</span>
                                              <span className="text-[10px] text-neutral-400 font-mono">{down.country}</span>
                                            </div>
                                            <div className="text-[11px] text-neutral-400 font-mono">{down.phone}</div>
                                            <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[10px]">
                                              <span className={hasInvested ? 'text-emerald-400 font-semibold' : 'text-neutral-500'}>
                                                {hasInvested ? '✓ A investi' : 'Pas encore investi'}
                                              </span>
                                              <span className="font-mono font-bold text-amber-400">
                                                {earnedFromThisDownline > 0 ? `+${formatFCFA(earnedFromThisDownline)}` : '0 FCFA'}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Detailed Referral Commission History */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 bg-neutral-950/80 border-b border-neutral-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Journal d'Audit des Commissions Versées ({allCommissionLogs.length})</h3>
                  <p className="text-[11px] text-neutral-400">Historique chronologique des bonus crédités automatiquement au 1er achat</p>
                </div>
              </div>

              {allCommissionLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Aucune commission de parrainage enregistrée pour l'instant.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-800 text-[10px] uppercase font-bold text-neutral-400 bg-neutral-950/40">
                        <th className="p-3">Date</th>
                        <th className="p-3">Parrain Bénéficiaire</th>
                        <th className="p-3">Filleul Acheteur</th>
                        <th className="p-3">Niveau & Taux</th>
                        <th className="p-3">Franchise Investie</th>
                        <th className="p-3">Commission Créditée</th>
                        <th className="p-3">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {allCommissionLogs.map(log => (
                        <tr key={log.id} className="hover:bg-neutral-800/30 transition-colors">
                          <td className="p-3 text-[11px] text-neutral-400 font-mono">
                            {new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-3 font-semibold text-white">
                            {log.sponsorName}
                          </td>
                          <td className="p-3 text-neutral-300">
                            {log.downlineName}
                          </td>
                          <td className="p-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.level === 1 ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40' :
                              log.level === 2 ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40' :
                              'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                            }`}>
                              Niveau {log.level} ({log.percentage}%)
                            </span>
                          </td>
                          <td className="p-3 text-neutral-300">
                            {log.productName}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            +{formatFCFA(log.amount)}
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                              <Check className="w-3 h-3" />
                              <span>1er Achat Validé</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SUPPORT & PARAMÈTRES GÉNÉRAUX */}
        {/* ========================================================================= */}
        {activeTab === 'SETTINGS' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
            {/* Section: Support & Canaux Officiels */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-red-500">
                <MessageCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Service Client & Réseaux Sociaux Officiels</h3>
              </div>
              <p className="text-xs text-neutral-400">
                Configurez le Service Client officiel, le Canal Telegram, le Groupe Telegram et le Groupe WhatsApp. Ces coordonnées s'appliquent immédiatement à l'ensemble des boutons et pages de l'application.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Service Client WhatsApp Direct */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-white flex items-center space-x-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Service Client WhatsApp (Numéro / Lien)</span>
                    </label>
                    {tempSettings.customerServiceWhatsapp && (
                      <button
                        type="button"
                        onClick={() => {
                          const val = tempSettings.customerServiceWhatsapp;
                          const url = val.startsWith('http') ? val : `https://wa.me/${val.replace(/\D/g, '')}`;
                          window.open(url, '_blank');
                        }}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tempSettings.customerServiceWhatsapp || tempSettings.supportWhatsappNumber}
                    onChange={(e) => setTempSettings({ 
                      ...tempSettings, 
                      customerServiceWhatsapp: e.target.value,
                      supportWhatsappNumber: e.target.value 
                    })}
                    placeholder="+226 00 00 00 00 ou https://wa.me/22600000000"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-500">Contact direct du conseiller officiel affiché en haut de l'écran d'accueil et dans le profil.</p>
                </div>

                {/* 2. Service Client Telegram (Optionnel) */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-white flex items-center space-x-1.5">
                      <Send className="w-4 h-4 text-sky-400" />
                      <span>Service Client Telegram (Nom d'utilisateur / Lien)</span>
                    </label>
                    {tempSettings.customerServiceTelegram && (
                      <button
                        type="button"
                        onClick={() => {
                          const val = tempSettings.customerServiceTelegram;
                          const url = val.startsWith('http') ? val : `https://t.me/${val.replace('@', '')}`;
                          window.open(url, '_blank');
                        }}
                        className="text-[10px] text-sky-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tempSettings.customerServiceTelegram || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, customerServiceTelegram: e.target.value })}
                    placeholder="@support_coca_officiel ou https://t.me/..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-500">Compte Telegram direct d'assistance client.</p>
                </div>

                {/* 3. Canal Telegram Officiel */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-white flex items-center space-x-1.5">
                      <Send className="w-4 h-4 text-sky-400" />
                      <span>Lien du Canal Télégram Officiel (Diffusion)</span>
                    </label>
                    {tempSettings.telegramChannelLink && (
                      <button
                        type="button"
                        onClick={() => window.open(tempSettings.telegramChannelLink, '_blank')}
                        className="text-[10px] text-sky-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tempSettings.telegramChannelLink || tempSettings.supportTelegramLink}
                    onChange={(e) => setTempSettings({ 
                      ...tempSettings, 
                      telegramChannelLink: e.target.value,
                      supportTelegramLink: e.target.value 
                    })}
                    placeholder="https://t.me/coca_cola_invest_afrique"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-500">Canal de diffusion pour les annonces officielles, preuves de paiements et actualités.</p>
                </div>

                {/* 4. Groupe Telegram des Membres */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-white flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>Lien du Groupe Télégram (Discussion & Entraide)</span>
                    </label>
                    {tempSettings.telegramGroupLink && (
                      <button
                        type="button"
                        onClick={() => window.open(tempSettings.telegramGroupLink, '_blank')}
                        className="text-[10px] text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tempSettings.telegramGroupLink || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, telegramGroupLink: e.target.value })}
                    placeholder="https://t.me/coca_cola_groupe_discussion"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-500">Groupe public ouvert où tous les membres échangent librement.</p>
                </div>

                {/* 5. Groupe WhatsApp VIP */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-white flex items-center space-x-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-400" />
                      <span>Lien du Groupe WhatsApp Officiel (Communauté VIP)</span>
                    </label>
                    {tempSettings.whatsappGroupLink && (
                      <button
                        type="button"
                        onClick={() => window.open(tempSettings.whatsappGroupLink, '_blank')}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Ouvrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tempSettings.whatsappGroupLink || tempSettings.supportWhatsappGroupLink}
                    onChange={(e) => setTempSettings({ 
                      ...tempSettings, 
                      whatsappGroupLink: e.target.value,
                      supportWhatsappGroupLink: e.target.value 
                    })}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-500">Groupe communautaire WhatsApp VIP des investisseurs.</p>
                </div>

                {/* 6. Lien Officiel de la Plateforme (Rejoindre) */}
                <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-white flex items-center space-x-1.5">
                      <Globe className="w-4 h-4 text-[#F40009]" />
                      <span>Lien officiel de la Plateforme (Page Rejoindre / Inscription)</span>
                    </label>
                    {tempSettings.platformLink && (
                      <button
                        type="button"
                        onClick={() => window.open(tempSettings.platformLink, '_blank')}
                        className="text-[10px] text-red-400 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>Tester</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={tempSettings.platformLink || 'https://coca-cola_invest.app/?regoindre'}
                    onChange={(e) => setTempSettings({ ...tempSettings, platformLink: e.target.value })}
                    placeholder="https://coca-cola_invest.app/?regoindre"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                  />
                  <p className="text-[10px] text-neutral-500">Lien personnalisé utilisé pour les parrainages, partages sociaux et redirections vers la page d'inscription.</p>
                </div>
              </div>
            </div>

            {/* Section: Règles Financières */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-emerald-400">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Règles & Limites Financières</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Dépôt Minimum (FCFA)</label>
                  <input
                    type="number"
                    value={tempSettings.minDeposit}
                    onChange={(e) => setTempSettings({ ...tempSettings, minDeposit: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Retrait Minimum (FCFA)</label>
                  <input
                    type="number"
                    value={tempSettings.minWithdrawal}
                    onChange={(e) => setTempSettings({ ...tempSettings, minWithdrawal: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Frais de Retrait (%)</label>
                  <input
                    type="number"
                    value={tempSettings.withdrawalFeePercent}
                    onChange={(e) => setTempSettings({ ...tempSettings, withdrawalFeePercent: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Bonus Inscription (FCFA)</label>
                  <input
                    type="number"
                    value={tempSettings.registrationBonus}
                    onChange={(e) => setTempSettings({ ...tempSettings, registrationBonus: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <h4 className="font-semibold text-neutral-300 text-xs mb-2">Commissions de Parrainage (%)</h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Niveau 1 (%)</label>
                    <input
                      type="number"
                      value={tempSettings.referralL1Percent}
                      onChange={(e) => setTempSettings({ ...tempSettings, referralL1Percent: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Niveau 2 (%)</label>
                    <input
                      type="number"
                      value={tempSettings.referralL2Percent}
                      onChange={(e) => setTempSettings({ ...tempSettings, referralL2Percent: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">Niveau 3 (%)</label>
                    <input
                      type="number"
                      value={tempSettings.referralL3Percent}
                      onChange={(e) => setTempSettings({ ...tempSettings, referralL3Percent: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Mode Maintenance & Bandeau d'alerte */}
            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <Power className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Maintenance & Alertes Utilisateur</h3>
              </div>

              {/* Maintenance Toggle */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-white">Mode Maintenance Général</p>
                    <p className="text-[11px] text-neutral-400">Bloque l'accès aux clients avec message personnalisé (accès admin préservé)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempSettings.isMaintenanceMode}
                    onChange={(e) => setTempSettings({ ...tempSettings, isMaintenanceMode: e.target.checked })}
                    className="w-5 h-5 rounded text-red-600 cursor-pointer"
                  />
                </div>
                {tempSettings.isMaintenanceMode && (
                  <textarea
                    value={tempSettings.maintenanceMessage}
                    onChange={(e) => setTempSettings({ ...tempSettings, maintenanceMessage: e.target.value })}
                    rows={2}
                    placeholder="Message d'information aux clients..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500"
                  />
                )}
              </div>

              {/* Broadcast Announcement Banner */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-white">Bandeau d'Annonce Flash (Accueil)</p>
                    <p className="text-[11px] text-neutral-400">Affiche une alerte ou promotion visible en haut de l'écran d'accueil</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempSettings.isBroadcastBannerActive}
                    onChange={(e) => setTempSettings({ ...tempSettings, isBroadcastBannerActive: e.target.checked })}
                    className="w-5 h-5 rounded text-red-600 cursor-pointer"
                  />
                </div>
                {tempSettings.isBroadcastBannerActive && (
                  <input
                    type="text"
                    value={tempSettings.broadcastBannerText}
                    onChange={(e) => setTempSettings({ ...tempSettings, broadcastBannerText: e.target.value })}
                    placeholder="Texte du bandeau..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500"
                  />
                )}
              </div>

              {/* Welcome Modal Config */}
              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-xs text-white">Pop-up de Bienvenue</p>
                    <p className="text-[11px] text-neutral-400">S'affiche à la première connexion des utilisateurs</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempSettings.welcomeModalActive}
                    onChange={(e) => setTempSettings({ ...tempSettings, welcomeModalActive: e.target.checked })}
                    className="w-5 h-5 rounded text-red-600 cursor-pointer"
                  />
                </div>
                {tempSettings.welcomeModalActive && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tempSettings.welcomeModalTitle}
                      onChange={(e) => setTempSettings({ ...tempSettings, welcomeModalTitle: e.target.value })}
                      placeholder="Titre du pop-up..."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500"
                    />
                    <textarea
                      value={tempSettings.welcomeModalText}
                      onChange={(e) => setTempSettings({ ...tempSettings, welcomeModalText: e.target.value })}
                      rows={2}
                      placeholder="Texte explicatif..."
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer les Paramètres Généraux</span>
              </button>
              <button
                type="button"
                onClick={handleResetSettings}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold py-3 px-4 rounded-xl text-xs cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: MISSIONS */}
        {/* ========================================================================= */}
        {activeTab === 'MISSIONS' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
              <div>
                <h2 className="text-sm font-bold text-white">Gestion des Missions & Récompenses</h2>
                <p className="text-xs text-neutral-400">Définissez les primes et les conditions à remplir par les utilisateurs</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewMissionModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouvelle Mission</span>
                </button>
                <button
                  onClick={() => {
                    const reset = resetMissionsToDefault();
                    setMissionsList(reset);
                    showToast("Missions réinitialisées");
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {missionsList.map(mission => {
                const draft = editingMissions[mission.id] || mission;
                return (
                  <div 
                    key={mission.id}
                    className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => setEditingMissions({
                          ...editingMissions,
                          [mission.id]: { ...draft, title: e.target.value }
                        })}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-red-500"
                      />

                      <div className="flex items-center space-x-3 text-xs">
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase">Cible: </span>
                          <input
                            type="number"
                            value={draft.target || 0}
                            onChange={(e) => setEditingMissions({
                              ...editingMissions,
                              [mission.id]: { ...draft, target: Number(e.target.value) }
                            })}
                            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-white font-mono w-16"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 uppercase">Récompense: </span>
                          <input
                            type="number"
                            value={draft.reward}
                            onChange={(e) => setEditingMissions({
                              ...editingMissions,
                              [mission.id]: { ...draft, reward: Number(e.target.value) }
                            })}
                            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono w-24"
                          />
                          <span className="text-[10px] text-neutral-400 ml-1">FCFA</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleDeleteMission(mission.id)}
                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleSaveMission(mission.id)}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Enregistrer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: FAQ */}
        {/* ========================================================================= */}
        {activeTab === 'FAQ' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
              <div>
                <h2 className="text-sm font-bold text-white">Gestion de la FAQ</h2>
                <p className="text-xs text-neutral-400">Questions et réponses visibles par les clients dans la section Compte</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewFaqModal(true)}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Question</span>
                </button>
                <button
                  onClick={() => {
                    const reset = resetFaqToDefault();
                    setFaqList(reset);
                    showToast("FAQ réinitialisée");
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {faqList.map(faq => {
                const draft = editingFaq[faq.id] || faq;
                return (
                  <div 
                    key={faq.id}
                    className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={draft.category}
                        onChange={(e) => setEditingFaq({
                          ...editingFaq,
                          [faq.id]: { ...draft, category: e.target.value }
                        })}
                        placeholder="Catégorie..."
                        className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 w-36 outline-none focus:border-red-500"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteFaq(faq.id)}
                          className="p-1 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleSaveFaq(faq.id)}
                          className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={draft.question}
                      onChange={(e) => setEditingFaq({
                        ...editingFaq,
                        [faq.id]: { ...draft, question: e.target.value }
                      })}
                      placeholder="Question..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-red-500"
                    />

                    <textarea
                      value={draft.answer}
                      onChange={(e) => setEditingFaq({
                        ...editingFaq,
                        [faq.id]: { ...draft, answer: e.target.value }
                      })}
                      rows={2}
                      placeholder="Réponse..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-neutral-300 outline-none focus:border-red-500 leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: SÉCURITÉ ADMIN */}
        {/* ========================================================================= */}
        {activeTab === 'SECURITY' && (
          <div className="max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-4">
            <div className="flex items-center space-x-2 text-red-500">
              <KeyRound className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Changer la Clé d'Accès Admin</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Modifiez le code secret requis pour déverrouiller cette console d'administration.
            </p>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
              Clé actuelle : <span className="font-mono font-bold text-white">{settings.adminPinCode || 'admin2026'}</span>
            </div>

            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Nouveau Code PIN</label>
                <input
                  type="text"
                  value={newPinCode}
                  onChange={(e) => setNewPinCode(e.target.value)}
                  placeholder="Ex: secret2026"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">Confirmer le Code PIN</label>
                <input
                  type="text"
                  value={confirmPinCode}
                  onChange={(e) => setConfirmPinCode(e.target.value)}
                  placeholder="Confirmer..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-red-600/30 flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Mettre à jour le Code PIN</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Modal: Modifier Solde Utilisateur */}
      <AnimatePresence>
        {balanceEditModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-xs"
            >
              <h3 className="font-bold text-sm text-white mb-1">Ajuster le Solde Client</h3>
              <p className="text-neutral-400 mb-4">{balanceEditModalUser.name} • Solde actuel : <span className="text-emerald-400 font-bold">{formatFCFA(balanceEditModalUser.balance)}</span></p>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustOp('ADD')}
                    className={`py-1.5 rounded-lg font-semibold ${balanceAdjustOp === 'ADD' ? 'bg-emerald-600 text-white' : 'text-neutral-400'}`}
                  >
                    + Créditer
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustOp('SUBTRACT')}
                    className={`py-1.5 rounded-lg font-semibold ${balanceAdjustOp === 'SUBTRACT' ? 'bg-amber-600 text-white' : 'text-neutral-400'}`}
                  >
                    - Débiter
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAdjustOp('SET')}
                    className={`py-1.5 rounded-lg font-semibold ${balanceAdjustOp === 'SET' ? 'bg-red-600 text-white' : 'text-neutral-400'}`}
                  >
                    = Fixer
                  </button>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Montant (FCFA)</label>
                  <input
                    type="number"
                    value={balanceAdjustAmount}
                    onChange={(e) => setBalanceAdjustAmount(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono text-sm outline-none focus:border-red-500"
                    autoFocus
                  />
                </div>

                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-[10px] text-neutral-400">
                  <p className="font-semibold text-neutral-300">Règle de parrainage :</p>
                  <p>Les ajustements administratifs de solde ne constituent pas un achat de franchise et ne génèrent <strong>aucune commission</strong> de parrainage.</p>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    onClick={() => setBalanceEditModalUser(null)}
                    className="w-1/2 py-2 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleApplyBalanceAdjust}
                    className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Offrir un Produit / Franchise (ADMIN_GIFT) */}
      <AnimatePresence>
        {giftModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-xs"
            >
              <div className="flex items-center space-x-2.5 text-amber-400 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Gift className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Offrir une Franchise Coca-Cola</h3>
                  <p className="text-[11px] text-neutral-400">Attribution directe sans débit client</p>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 my-3">
                <p className="text-[11px] text-neutral-400">Bénéficiaire :</p>
                <p className="text-xs font-bold text-white mt-0.5">{giftModalUser.name}</p>
                <p className="text-[11px] text-neutral-400">{giftModalUser.phone}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Sélectionner la franchise</label>
                  <select
                    value={giftSelectedProductId}
                    onChange={(e) => setGiftSelectedProductId(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white outline-none focus:border-amber-500"
                  >
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} — +{formatFCFA(prod.daily)}/jour ({prod.duration}j)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Motif / Note interne</label>
                  <input
                    type="text"
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Ex: Offre promo VIP, Geste commercial..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Explicit Rule Reminder */}
                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-[11px] text-amber-200/90 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Conformité Stricte :</span>
                  </div>
                  <p className="text-neutral-400 leading-tight">
                    Conformément aux règles du système, ce produit sera étiqueté <strong>ADMIN_GIFT</strong>. <strong>Aucune commission de parrainage</strong> ne sera versée au parrain. L'utilisateur recevra ses gains quotidiens toutes les 24h.
                  </p>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setGiftModalUser(null)}
                    className="w-1/2 py-2.5 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmGiftProduct}
                    className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Attribuer Franchise</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Modal: Créer Utilisateur */}
      <AnimatePresence>
        {showNewUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-xs"
            >
              <h3 className="font-bold text-sm text-white mb-3">Ajouter un Client Manuellement</h3>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: Sanogo Abdoulaye"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Numéro Téléphone</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="+225 07..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Pays</label>
                    <select
                      value={newUserCountry}
                      onChange={(e: any) => setNewUserCountry(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-white outline-none"
                    >
                      {countriesList.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.dialCode}) {!c.isActive ? '• Inactif' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Solde de départ</label>
                    <input
                      type="number"
                      value={newUserBalance}
                      onChange={(e) => setNewUserBalance(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Mot de passe du compte</label>
                  <div className="relative">
                    <input
                      type={newUserPasswordVisible ? 'text' : 'password'}
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Ex: 123456"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-3 pr-10 py-2 text-white font-mono outline-none focus:border-red-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setNewUserPasswordVisible(!newUserPasswordVisible)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {newUserPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">Mot de passe communiqué au client pour sa connexion</p>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewUserModal(false)}
                    className="w-1/2 py-2 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Créer Compte
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Modifier le Mot de Passe Utilisateur */}
      <AnimatePresence>
        {passwordEditModalUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-xs"
            >
              <div className="flex items-center space-x-2.5 text-amber-400 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Changer le mot de passe</h3>
                  <p className="text-[11px] text-neutral-400">Modification sécurisée du compte client</p>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 my-3">
                <p className="text-[11px] text-neutral-400">Utilisateur concerné :</p>
                <p className="text-xs font-bold text-white mt-0.5">{passwordEditModalUser.name}</p>
                <p className="text-[11px] text-neutral-400">{passwordEditModalUser.phone}</p>
              </div>

              <form onSubmit={handleResetUserPassword} className="space-y-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Nouveau mot de passe</label>
                  <input
                    type="text"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="Minimum 4 caractères..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-white font-mono outline-none focus:border-amber-500 text-sm"
                    required
                    autoFocus
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">L'utilisateur pourra se connecter immédiatement avec cette nouvelle clé.</p>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordEditModalUser(null);
                      setNewPasswordValue('');
                    }}
                    className="w-1/2 py-2.5 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer font-bold"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Modal: Ajouter Franchise / Produit */}
      <AnimatePresence>
        {showNewProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
            >
              <h3 className="font-bold text-sm text-white mb-3">Créer une Franchise / Pack VIP</h3>

              <form onSubmit={handleCreateProduct} className="space-y-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Nom du Produit</label>
                  <input
                    type="text"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="Ex: Distributeur Coca-Cola Spécial"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Catégorie</label>
                    <select
                      value={newProdCat}
                      onChange={(e: any) => setNewProdCat(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-white outline-none"
                    >
                      <option value="BOTTLES">Canettes & Bouteilles</option>
                      <option value="VENDING">Distributeurs & Frigos</option>
                      <option value="STOCKS">Stocks & Logistique</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1">Badge</label>
                    <input
                      type="text"
                      value={newProdTag}
                      onChange={(e) => setNewProdTag(e.target.value)}
                      placeholder="Ex: Tendance"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Prix (FCFA)</label>
                    <input
                      type="number"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Gain/Jour (FCFA)</label>
                    <input
                      type="number"
                      value={newProdDaily}
                      onChange={(e) => setNewProdDaily(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Durée (Jours)</label>
                    <input
                      type="number"
                      value={newProdDuration}
                      onChange={(e) => setNewProdDuration(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">URL de l'image</label>
                  <input
                    type="text"
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none text-[11px]"
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newProdIsVip}
                    onChange={(e) => setNewProdIsVip(e.target.checked)}
                    className="rounded bg-neutral-950 border-neutral-700 text-red-600"
                  />
                  <span className="text-neutral-300">Marquer comme produit VIP exclusif</span>
                </label>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProductModal(false)}
                    className="w-1/2 py-2 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Ajouter au Catalogue
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Modal: Ajouter Transaction Manuelle */}
      <AnimatePresence>
        {showNewTxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-xs"
            >
              <h3 className="font-bold text-sm text-white mb-3">Nouvelle Transaction Manuelle</h3>

              <form onSubmit={handleCreateManualTx} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Type</label>
                    <select
                      value={manualType}
                      onChange={(e: any) => setManualType(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white outline-none"
                    >
                      <option value="DEPOSIT">Dépôt (Crédit)</option>
                      <option value="WITHDRAW">Retrait (Débit)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Montant (FCFA)</label>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="Ex: 50000"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white font-mono outline-none focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Nom Client</label>
                    <input
                      type="text"
                      value={manualUser}
                      onChange={(e) => setManualUser(e.target.value)}
                      placeholder="Nom..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      placeholder="+225..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Moyen</label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white outline-none"
                  >
                    <option value="Wave CI">Wave CI</option>
                    <option value="Orange Money CI">Orange Money CI</option>
                    <option value="MTN CI">MTN CI</option>
                    <option value="Orange Money BF">Orange Money BF</option>
                    <option value="Moov Africa BF">Moov Africa BF</option>
                    <option value="Coris Money">Coris Money</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Note</label>
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Justificatif..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white outline-none"
                  />
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTxModal(false)}
                    className="w-1/2 py-2 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Créer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Action Transaction (Annuler Retrait / Rejeter / Valider) */}
      <AnimatePresence>
        {actionModal.isOpen && actionModal.tx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-xs space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2.5 rounded-xl ${
                    actionModal.type === 'CANCEL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    actionModal.type === 'REJECT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {actionModal.type === 'CANCEL' ? <Undo2 className="w-5 h-5" /> :
                     actionModal.type === 'REJECT' ? <XCircle className="w-5 h-5" /> :
                     <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {actionModal.type === 'CANCEL' ? 'Annuler le Retrait & Rembourser' :
                       actionModal.type === 'REJECT' ? 'Rejeter la Transaction' :
                       'Valider la Transaction'}
                    </h3>
                    <p className="text-[11px] text-neutral-400">
                      Réf: <span className="font-mono text-neutral-200">{actionModal.tx.reference || actionModal.tx.id}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActionModal({ isOpen: false, type: 'CANCEL', tx: null, reason: '' })}
                  className="text-neutral-500 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transaction details card */}
              <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Client :</span>
                  <span className="font-bold text-white">{actionModal.tx.userName || 'Utilisateur'} ({actionModal.tx.userPhone})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Montant de la demande :</span>
                  <span className="font-mono font-black text-white text-sm">{formatFCFA(actionModal.tx.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Mode de paiement :</span>
                  <span className="text-neutral-200 font-semibold">{actionModal.tx.method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Statut actuel :</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    actionModal.tx.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-300' :
                    actionModal.tx.status === 'CANCELLED' ? 'bg-orange-950 text-orange-300' :
                    actionModal.tx.status === 'REJECTED' ? 'bg-red-950 text-red-300' :
                    'bg-amber-950 text-amber-300'
                  }`}>
                    {actionModal.tx.status === 'SUCCESS' ? 'Validé' :
                     actionModal.tx.status === 'CANCELLED' ? 'Annulé' :
                     actionModal.tx.status === 'REJECTED' ? 'Rejeté' :
                     'En Attente'}
                  </span>
                </div>
                {actionModal.type === 'CANCEL' && (
                  <div className="pt-2 border-t border-neutral-800/80 flex justify-between items-center text-emerald-400 font-bold">
                    <span>Montant recrédité au client :</span>
                    <span className="font-mono text-sm">+{formatFCFA(actionModal.tx.amount)}</span>
                  </div>
                )}
              </div>

              {actionModal.type === 'CANCEL' && (
                <div className="bg-amber-950/40 border border-amber-900/60 p-3 rounded-xl text-amber-300 text-[11px] leading-relaxed">
                  💡 <strong>Remboursement strict à l'identique :</strong> Le montant exact lancé de <strong>{formatFCFA(actionModal.tx.amount)}</strong> sera recrédité sur le compte du client. Aucun surplus n'est appliqué et le montant n'est crédité qu'une seule fois.
                </div>
              )}

              {/* Preset reasons */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">
                  Motif {actionModal.type === 'CANCEL' ? "d'annulation" : 'de rejet'} :
                </label>
                <div className="space-y-1 mb-2">
                  {[
                    "Numéro Mobile Money erroné / inaccessible",
                    "Compte Mobile Money non identifié ou rejet opérateur",
                    "Annulation à la demande du client",
                    "Erreur de saisie / Doublon administratif",
                    "Dépôt non réceptionné sur le compte marchand"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setActionModal(prev => ({ ...prev, reason: preset }))}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                        actionModal.reason === preset
                          ? 'border-amber-500 bg-amber-950/50 text-amber-200 font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      • {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={actionModal.reason}
                  onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ou précisez un autre motif..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500 text-xs"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, type: 'CANCEL', tx: null, reason: '' })}
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleConfirmModalAction}
                  className={`flex-1 font-bold py-2.5 rounded-xl text-white shadow-lg cursor-pointer flex items-center justify-center space-x-1.5 ${
                    actionModal.type === 'CANCEL'
                      ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                      : actionModal.type === 'REJECT'
                      ? 'bg-red-700 hover:bg-red-600 shadow-red-700/30'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {actionModal.type === 'CANCEL' ? (
                    <>
                      <Undo2 className="w-4 h-4" />
                      <span>Confirmer & Rembourser</span>
                    </>
                  ) : actionModal.type === 'REJECT' ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Confirmer le Rejet</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer l'Approbation</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Modal: Ajouter Mission */}
      <AnimatePresence>
        {showNewMissionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-xs"
            >
              <h3 className="font-bold text-sm text-white mb-3">Nouvelle Mission</h3>

              <form onSubmit={handleCreateMission} className="space-y-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Titre de la mission</label>
                  <input
                    type="text"
                    value={newMissionTitle}
                    onChange={(e) => setNewMissionTitle(e.target.value)}
                    placeholder="Ex: Avoir 30 filleuls actifs"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 mb-1">Type</label>
                    <select
                      value={newMissionType}
                      onChange={(e: any) => setNewMissionType(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white outline-none"
                    >
                      <option value="referral">Parrainage</option>
                      <option value="vip">Investissement VIP</option>
                      <option value="daily">Quotidienne</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Cible</label>
                    <input
                      type="number"
                      value={newMissionTarget}
                      onChange={(e) => setNewMissionTarget(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-white font-mono outline-none focus:border-red-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Prime Récompense (FCFA)</label>
                  <input
                    type="number"
                    value={newMissionReward}
                    onChange={(e) => setNewMissionReward(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewMissionModal(false)}
                    className="w-1/2 py-2 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Créer Mission
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Modal: Ajouter FAQ */}
      <AnimatePresence>
        {showNewFaqModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-xs"
            >
              <h3 className="font-bold text-sm text-white mb-3">Ajouter Question FAQ</h3>

              <form onSubmit={handleCreateFaq} className="space-y-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Catégorie</label>
                  <input
                    type="text"
                    value={newFaqCat}
                    onChange={(e) => setNewFaqCat(e.target.value)}
                    placeholder="Ex: Gains & Produits, Retraits, Sécurité..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Question</label>
                  <input
                    type="text"
                    value={newFaqQuestion}
                    onChange={(e) => setNewFaqQuestion(e.target.value)}
                    placeholder="Intitulé de la question..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Réponse détaillée</label>
                  <textarea
                    value={newFaqAnswer}
                    onChange={(e) => setNewFaqAnswer(e.target.value)}
                    rows={3}
                    placeholder="Explication pour l'utilisateur..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-white outline-none focus:border-red-500 leading-relaxed"
                    required
                  />
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewFaqModal(false)}
                    className="w-1/2 py-2 bg-neutral-800 text-neutral-300 font-bold rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Enregistrer FAQ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Modal: Ajouter un Mode de Paiement */}
      <AnimatePresence>
        {showNewPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
                <div className="flex items-center space-x-2 text-red-500">
                  <CreditCard className="w-5 h-5" />
                  <h3 className="font-bold text-sm text-white">Nouveau Mode de Paiement</h3>
                </div>
                <button
                  onClick={() => setShowNewPaymentModal(false)}
                  className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePaymentMethod} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Nom de l'opérateur / Méthode</label>
                    <input
                      type="text"
                      value={newPmName}
                      onChange={(e) => setNewPmName(e.target.value)}
                      placeholder="Ex: Orange Money BF, Wave CI, Moov..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Pays Éligible</label>
                    <select
                      value={newPmCountry}
                      onChange={(e) => setNewPmCountry(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    >
                      <option value="ALL">🌍 Tous les pays</option>
                      {countriesList.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Catégorie</label>
                    <select
                      value={newPmCategory}
                      onChange={(e) => setNewPmCategory(e.target.value as 'MOBILE_MONEY' | 'CRYPTO')}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    >
                      <option value="MOBILE_MONEY">Mobile Money</option>
                      <option value="CRYPTO">Crypto / USDT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">Numéro Récepteur / Marchand</label>
                    <input
                      type="text"
                      value={newPmAccountNumber}
                      onChange={(e) => setNewPmAccountNumber(e.target.value)}
                      placeholder="Ex: +226 70 00 00 00"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Nom du Titulaire / Société</label>
                  <input
                    type="text"
                    value={newPmAccountName}
                    onChange={(e) => setNewPmAccountName(e.target.value)}
                    placeholder="Ex: COCA-COLA DISTRIBUTION SARL"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Instructions pour l'utilisateur (Optionnel)</label>
                  <textarea
                    value={newPmInstructions}
                    onChange={(e) => setNewPmInstructions(e.target.value)}
                    rows={2}
                    placeholder="Ex: Effectuez le transfert direct vers ce numéro et soumettez la référence..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white outline-none focus:border-red-500"
                  />
                </div>

                {/* Operations Allowed */}
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-2">
                  <span className="block text-[11px] font-bold text-neutral-400 uppercase">Autorisations</span>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPmAllowsDeposit}
                        onChange={(e) => setNewPmAllowsDeposit(e.target.checked)}
                        className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                      />
                      <span>Autoriser pour Dépôts</span>
                    </label>

                    <label className="flex items-center space-x-2 text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPmAllowsWithdrawal}
                        onChange={(e) => setNewPmAllowsWithdrawal(e.target.checked)}
                        className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                      />
                      <span>Autoriser pour Retraits</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPaymentModal(false)}
                    className="w-1/2 py-2.5 bg-neutral-800 text-neutral-300 font-bold rounded-xl hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    Créer le mode de paiement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
