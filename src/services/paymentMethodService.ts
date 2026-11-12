import { PaymentMethod } from '../types';

const STORAGE_KEY = 'coca_app_payment_methods';

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  // Côte d'Ivoire (CI)
  {
    id: 'pm-om-ci',
    name: 'Orange Money CI',
    code: 'OM_CI',
    country: 'CI',
    category: 'MOBILE_MONEY',
    accountNumber: '+225 07 00 00 00 00',
    accountName: 'COCA-COLA DISTRIBUTION CI',
    instructions: 'Transférez le montant par Orange Money au numéro marchand puis entrez la référence de transaction.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pm-mtn-ci',
    name: 'MTN CI (MoMo)',
    code: 'MTN_CI',
    country: 'CI',
    category: 'MOBILE_MONEY',
    accountNumber: '+225 05 00 00 00 00',
    accountName: 'COCA-COLA DISTRIBUTION CI',
    instructions: 'Envoyez les fonds sur le numéro MTN MoMo indiqué ci-dessus.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pm-wave-ci',
    name: 'Wave CI',
    code: 'WAVE_CI',
    country: 'CI',
    category: 'MOBILE_MONEY',
    accountNumber: '+225 01 00 00 00 00',
    accountName: 'COCA-COLA CI SARL',
    instructions: 'Scannez le QR Code Wave ou transférez directement au numéro Wave officiel.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pm-moov-ci',
    name: 'Moov Money CI',
    code: 'MOOV_CI',
    country: 'CI',
    category: 'MOBILE_MONEY',
    accountNumber: '+225 01 50 00 00 00',
    accountName: 'COCA-COLA DISTRIBUTION CI',
    instructions: 'Effectuez votre dépôt via Moov Money au numéro indiqué.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },

  // Burkina Faso (BF)
  {
    id: 'pm-om-bf',
    name: 'Orange Money BF',
    code: 'OM_BF',
    country: 'BF',
    category: 'MOBILE_MONEY',
    accountNumber: '+226 76 00 00 00',
    accountName: 'COCA-COLA BF DISTRIBUTION',
    instructions: 'Effectuez le transfert Orange Money au numéro marchand officiel *144*.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pm-moov-bf',
    name: 'Moov Africa BF',
    code: 'MOOV_BF',
    country: 'BF',
    category: 'MOBILE_MONEY',
    accountNumber: '+226 70 00 00 00',
    accountName: 'COCA-COLA BF DISTRIBUTION',
    instructions: 'Dépôt via Moov Money au numéro marchand officiel.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pm-coris-bf',
    name: 'Coris Money',
    code: 'CORIS_BF',
    country: 'BF',
    category: 'MOBILE_MONEY',
    accountNumber: '+226 60 00 00 00',
    accountName: 'CORIS MONEY COCA-COLA',
    instructions: 'Recharge directe via votre compte Coris Money.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'pm-wave-bf',
    name: 'Wave BF',
    code: 'WAVE_BF',
    country: 'BF',
    category: 'MOBILE_MONEY',
    accountNumber: '+226 75 00 00 00',
    accountName: 'WAVE COCA-COLA BF',
    instructions: 'Transfert sans frais via Wave Burkina Faso.',
    isActive: true,
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },

  // Crypto / International (ALL)
  {
    id: 'pm-usdt-trc20',
    name: 'USDT (TRC-20)',
    code: 'USDT_TRC20',
    country: 'ALL',
    category: 'CRYPTO',
    accountNumber: 'TY7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    accountName: 'COCA-COLA INVEST TREASURY',
    instructions: 'Envoyez uniquement des USDT sur le réseau TRC-20. 1 USDT = 600 FCFA.',
    isActive: false, // Inactif par défaut, l'admin peut l'activer
    allowsDeposit: true,
    allowsWithdrawal: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

const isNotBankMethod = (m: PaymentMethod): boolean => {
  if (m.category === 'BANK') return false;
  const lowerName = (m.name || '').toLowerCase();
  if (lowerName.includes('bancaire') || lowerName.includes('virement')) return false;
  return true;
};

export const getStoredPaymentMethods = (): PaymentMethod[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Mode de paiement : exclusion stricte de tout paiement bancaire
        const nonBank = parsed.filter(isNotBankMethod);
        if (nonBank.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nonBank));
        }
        return nonBank.length > 0 ? nonBank : DEFAULT_PAYMENT_METHODS.filter(isNotBankMethod);
      }
    }
  } catch (e) {
    console.error('Error reading payment methods:', e);
  }
  return DEFAULT_PAYMENT_METHODS.filter(isNotBankMethod);
};

export const savePaymentMethods = (methods: PaymentMethod[]) => {
  const filtered = methods.filter(isNotBankMethod);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event('coca_payment_methods_updated'));
};

export const addPaymentMethod = (
  data: Omit<PaymentMethod, 'id' | 'createdAt'>
): PaymentMethod => {
  const existing = getStoredPaymentMethods();
  const newMethod: PaymentMethod = {
    ...data,
    id: 'pm-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString()
  };
  savePaymentMethods([newMethod, ...existing]);
  return newMethod;
};

export const updatePaymentMethod = (
  id: string,
  updates: Partial<PaymentMethod>
): PaymentMethod | null => {
  const existing = getStoredPaymentMethods();
  const index = existing.findIndex(m => m.id === id);
  if (index === -1) return null;

  const updated: PaymentMethod = { ...existing[index], ...updates };
  existing[index] = updated;
  savePaymentMethods([...existing]);
  return updated;
};

export const deletePaymentMethod = (id: string): boolean => {
  const existing = getStoredPaymentMethods();
  const filtered = existing.filter(m => m.id !== id);
  if (filtered.length === existing.length) return false;
  savePaymentMethods(filtered);
  return true;
};

export const togglePaymentMethodStatus = (id: string): PaymentMethod | null => {
  const existing = getStoredPaymentMethods();
  const index = existing.findIndex(m => m.id === id);
  if (index === -1) return null;

  existing[index].isActive = !existing[index].isActive;
  savePaymentMethods([...existing]);
  return existing[index];
};

/**
 * Récupère les modes de paiement actifs pour un pays donné et un type donné (dépôt ou retrait)
 */
export const getActivePaymentMethods = (
  country?: 'CI' | 'BF' | string,
  type?: 'DEPOSIT' | 'WITHDRAW'
): PaymentMethod[] => {
  const all = getStoredPaymentMethods();
  return all.filter(method => {
    if (!method.isActive) return false;
    
    // Filtre pays : ALL s'applique à tout le monde
    if (country && method.country !== 'ALL' && method.country !== country) {
      return false;
    }

    // Filtre type de transaction
    if (type === 'DEPOSIT' && !method.allowsDeposit) return false;
    if (type === 'WITHDRAW' && !method.allowsWithdrawal) return false;

    return true;
  });
};

export const resetPaymentMethodsToDefault = (): PaymentMethod[] => {
  savePaymentMethods(DEFAULT_PAYMENT_METHODS);
  return DEFAULT_PAYMENT_METHODS;
};
