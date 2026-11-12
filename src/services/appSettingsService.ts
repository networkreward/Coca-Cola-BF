export interface AppSettings {
  // Support & Contact Canaux
  customerServiceWhatsapp: string;      // Service Client WhatsApp direct
  customerServiceTelegram: string;      // Service Client Telegram direct
  telegramChannelLink: string;          // Canal Télégram officiel
  telegramGroupLink: string;            // Groupe Télégram officiel
  whatsappGroupLink: string;            // Groupe WhatsApp officiel

  // Aliases pour rétro-compatibilité
  supportWhatsappNumber: string;
  supportTelegramLink: string;
  supportWhatsappGroupLink: string;

  // Financial Rules
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  minDeposit: number;
  registrationBonus: number;

  // Referral Commission Percentages
  referralL1Percent: number;
  referralL2Percent: number;
  referralL3Percent: number;

  // System & Maintenance
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  broadcastBannerText: string;
  isBroadcastBannerActive: boolean;

  // Welcome Popup
  welcomeModalTitle: string;
  welcomeModalText: string;
  welcomeModalActive: boolean;

  // Admin Security
  adminPinCode: string;

  // Daily Checkin Rewards (Day 1 to 7)
  checkinRewards: number[];

  // Custom Platform Link (Rejoindre / Invitation)
  platformLink: string;

  // Tchin API Gateway Configuration
  tchinPublicKey?: string;
  tchinPrivateKey?: string;
  tchinPassword?: string;
  tchinEnvironment?: 'sandbox' | 'live';
  isTchinEnabled?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  customerServiceWhatsapp: '+226 00 00 00 00',
  customerServiceTelegram: 'https://t.me/coca_cola_support',
  telegramChannelLink: 'https://t.me/coca_cola_invest_afrique',
  telegramGroupLink: 'https://t.me/coca_cola_invest_groupe',
  whatsappGroupLink: 'https://chat.whatsapp.com/CocaColaInvestVIP',

  supportWhatsappNumber: '+226 00 00 00 00',
  supportTelegramLink: 'https://t.me/coca_cola_invest_afrique',
  supportWhatsappGroupLink: 'https://chat.whatsapp.com/CocaColaInvestVIP',

  minWithdrawal: 1000,
  maxWithdrawal: 5000000,
  withdrawalFeePercent: 10,
  minDeposit: 6000,
  registrationBonus: 0,

  referralL1Percent: 18,
  referralL2Percent: 2,
  referralL3Percent: 1,

  isMaintenanceMode: false,
  maintenanceMessage: 'Plateforme temporairement en maintenance technique pour optimisation du réseau de distribution. Réouverture dans quelques instants.',
  broadcastBannerText: '🔥 Offre Spéciale : Bonus de 18% sur toutes les commissions de parrainage cette semaine !',
  isBroadcastBannerActive: true,

  welcomeModalTitle: 'Bienvenue sur Coca-Cola Invest !',
  welcomeModalText: 'Devenez partenaire officiel de distribution, touchez des revenus quotidiens garantis et profitez de notre communauté exclusive.',
  welcomeModalActive: true,

  adminPinCode: '@71224956Alas',

  checkinRewards: [50, 100, 150, 200, 250, 300, 500],

  platformLink: 'https://coca-cola_invest.app/?regoindre',

  tchinPublicKey: '',
  tchinPrivateKey: '',
  tchinPassword: '',
  tchinEnvironment: 'live',
  isTchinEnabled: true,
};

const SETTINGS_KEY = 'coca_app_settings';

export const getStoredSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged: AppSettings = { ...DEFAULT_SETTINGS, ...parsed };
      
      // Migration automatique des valeurs par défaut financières
      if (merged.minDeposit === undefined || merged.minDeposit < 6000) {
        merged.minDeposit = 6000;
      }
      if (merged.minWithdrawal === undefined || merged.minWithdrawal > 1000) {
        merged.minWithdrawal = 1000;
      }
      if (merged.withdrawalFeePercent === undefined || merged.withdrawalFeePercent === 0) {
        merged.withdrawalFeePercent = 10;
      }
      if (merged.registrationBonus === undefined || merged.registrationBonus > 0) {
        merged.registrationBonus = 0;
      }
      if (!merged.tchinEnvironment || merged.tchinEnvironment === 'sandbox') {
        merged.tchinEnvironment = 'live';
      }

      // Synchronisation bidirectionnelle des alias pour cohérence absolue
      if (!merged.customerServiceWhatsapp && merged.supportWhatsappNumber) {
        merged.customerServiceWhatsapp = merged.supportWhatsappNumber;
      }
      if (!merged.telegramChannelLink && merged.supportTelegramLink) {
        merged.telegramChannelLink = merged.supportTelegramLink;
      }
      if (!merged.whatsappGroupLink && merged.supportWhatsappGroupLink) {
        merged.whatsappGroupLink = merged.supportWhatsappGroupLink;
      }
      if (!merged.telegramGroupLink) {
        merged.telegramGroupLink = DEFAULT_SETTINGS.telegramGroupLink;
      }
      if (!merged.customerServiceTelegram) {
        merged.customerServiceTelegram = DEFAULT_SETTINGS.customerServiceTelegram;
      }

      // Réciproque pour les anciens composants
      merged.supportWhatsappNumber = merged.customerServiceWhatsapp || DEFAULT_SETTINGS.customerServiceWhatsapp;
      merged.supportTelegramLink = merged.telegramChannelLink || DEFAULT_SETTINGS.telegramChannelLink;
      merged.supportWhatsappGroupLink = merged.whatsappGroupLink || DEFAULT_SETTINGS.whatsappGroupLink;

      return merged;
    }
  } catch (e) {
    console.error('Error reading settings', e);
  }
  return DEFAULT_SETTINGS;
};

export const saveSettings = (newSettings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  window.dispatchEvent(new Event('app_settings_updated'));
};

export const resetSettingsToDefault = (): AppSettings => {
  localStorage.removeItem(SETTINGS_KEY);
  window.dispatchEvent(new Event('app_settings_updated'));
  return DEFAULT_SETTINGS;
};

/**
 * Retourne le lien officiel fonctionnel qui ouvre réellement l'application
 * Par exemple: https://ais-pre-...run.app/?regoindre&ref=4E3LPK
 */
export const getPlatformInviteLink = (referralCode?: string): string => {
  let origin = '';
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    origin = window.location.origin;
  }
  
  const base = origin ? `${origin}/?regoindre` : 'https://coca-cola_invest.app/?regoindre';
  if (!referralCode) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}ref=${referralCode.toUpperCase()}`;
};

/**
 * Retourne le lien de marque personnalisé (alias)
 * Par exemple: https://coca-cola_invest.app/?regoindre&ref=4E3LPK
 */
export const getVanityInviteLink = (referralCode?: string): string => {
  const settings = getStoredSettings();
  const base = settings.platformLink?.trim() || 'https://coca-cola_invest.app/?regoindre';
  if (!referralCode) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}ref=${referralCode.toUpperCase()}`;
};
