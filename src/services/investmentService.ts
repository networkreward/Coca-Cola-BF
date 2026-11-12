import { User, ProductItem, UserInvestment, ReferralCommissionLog, Transaction } from '../types';
import { getStoredUsers, saveUsers, adjustUserBalance, updateUser } from './userService';
import { getStoredTransactions, saveTransactions } from './transactionService';
import { getStoredSettings } from './appSettingsService';
import { syncInvestmentToFirestore } from './dbService';
import { formatFCFA } from '../utils';

const STORAGE_INVESTMENTS_KEY = 'coca_app_investments';
const STORAGE_REFERRAL_LOGS_KEY = 'coca_app_referral_logs';
const LEGACY_MY_PRODUCTS_KEY = 'coca_app_my_products';

export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Lit les investissements enregistrés avec migration automatique des anciens produits
 */
export const getStoredInvestments = (): UserInvestment[] => {
  let list: UserInvestment[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_INVESTMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Supprime tout faux investissement lié aux anciens comptes démo
        list = parsed.filter(inv => inv.userId !== 'demo-user' && !inv.id.startsWith('inv-demo-'));
      }
    }
  } catch (e) {
    console.error('Error reading investments:', e);
  }

  // Migration depuis coca_app_my_products si la liste est vide
  if (list.length === 0) {
    try {
      const legacyRaw = localStorage.getItem(LEGACY_MY_PRODUCTS_KEY);
      if (legacyRaw) {
        const legacyList = JSON.parse(legacyRaw);
        if (Array.isArray(legacyList) && legacyList.length > 0) {
          let currentUserId = 'demo-user';
          try {
            const u = localStorage.getItem('coca_app_user');
            if (u) currentUserId = JSON.parse(u).id || currentUserId;
          } catch {}

          list = legacyList.map((item: any, idx: number) => {
            const purchaseDate = item.date || new Date().toISOString();
            return {
              id: item.id ? `inv-mig-${item.id}-${idx}` : `inv-mig-${Date.now()}-${idx}`,
              userId: currentUserId,
              productId: Number(item.id) || 1,
              productName: item.name || 'Pack Franchise Coca-Cola',
              category: item.category || 'BOTTLES',
              price: Number(item.price) || 0,
              daily: Number(item.daily) || 0,
              duration: Number(item.duration) || 90,
              daysElapsed: Number(item.daysElapsed) || 0,
              totalEarned: Number(item.totalEarned) || 0,
              purchaseDate: purchaseDate,
              lastCreditDate: item.lastCreditDate || purchaseDate,
              status: (item.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE') as 'ACTIVE' | 'COMPLETED',
              image: item.image,
              source: (item.source || 'USER_PURCHASE') as 'USER_PURCHASE' | 'ADMIN_GIFT',
              referralCommissionPaid: true
            };
          });
          saveInvestments(list);
        }
      }
    } catch (e) {
      console.error('Error migrating legacy products:', e);
    }
  }

  return list;
};

/**
 * Sauvegarde les investissements et synchronise avec legacy coca_app_my_products
 */
export const saveInvestments = (investments: UserInvestment[]) => {
  localStorage.setItem(STORAGE_INVESTMENTS_KEY, JSON.stringify(investments));
  
  // Synchronisation avec Firestore pour haute résilience (> 5000 membres)
  try {
    investments.slice(0, 10).forEach(inv => {
      syncInvestmentToFirestore(inv).catch(() => {});
    });
  } catch {}

  // Synchronisation avec coca_app_my_products pour rétro-compatibilité
  try {
    const formattedForLegacy = investments.map(inv => ({
      id: inv.productId,
      investmentId: inv.id,
      name: inv.productName,
      category: inv.category,
      price: inv.price,
      daily: inv.daily,
      duration: inv.duration,
      daysElapsed: inv.daysElapsed,
      totalEarned: inv.totalEarned,
      image: inv.image,
      date: inv.purchaseDate,
      lastCreditDate: inv.lastCreditDate,
      status: inv.status,
      source: inv.source
    }));
    localStorage.setItem(LEGACY_MY_PRODUCTS_KEY, JSON.stringify(formattedForLegacy));
  } catch (e) {
    console.error('Error syncing legacy products:', e);
  }

  window.dispatchEvent(new Event('coca_investments_updated'));
};

/**
 * Récupère les investissements d'un utilisateur spécifique
 */
export const getUserInvestments = (userId: string): UserInvestment[] => {
  const all = getStoredInvestments();
  return all.filter(inv => inv.userId === userId);
};

/**
 * Vérifie si l'utilisateur a déjà effectué un achat de produit auparavant (Règle du 1er investissement)
 */
export const hasUserEverInvested = (userId: string): boolean => {
  const users = getStoredUsers();
  const user = users.find(u => u.id === userId);
  if (user?.hasPurchasedFirstProduct) {
    return true;
  }

  const investments = getStoredInvestments();
  // Seul un investissement payé par l'utilisateur compte comme achat réel
  return investments.some(inv => inv.userId === userId && inv.source === 'USER_PURCHASE');
};

/**
 * Récupère l'historique des commissions de parrainage
 */
export const getReferralLogs = (sponsorId?: string): ReferralCommissionLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_REFERRAL_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (sponsorId) {
          return parsed.filter((log: ReferralCommissionLog) => log.sponsorId === sponsorId);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading referral logs:', e);
  }
  return [];
};

export const saveReferralLogs = (logs: ReferralCommissionLog[]) => {
  localStorage.setItem(STORAGE_REFERRAL_LOGS_KEY, JSON.stringify(logs));
  window.dispatchEvent(new Event('coca_referral_logs_updated'));
};

/**
 * Trouve la chaîne de parrains (Niveau 1, Niveau 2, Niveau 3)
 */
export const findUplineSponsors = (referredByCodeOrId?: string): {
  l1?: User;
  l2?: User;
  l3?: User;
} => {
  if (!referredByCodeOrId) return {};

  const users = getStoredUsers();
  const cleanKey = referredByCodeOrId.trim().toUpperCase();

  // Niveau 1 : parrain direct
  const l1 = users.find(u => 
    u.id === referredByCodeOrId || 
    u.referralCode.toUpperCase() === cleanKey
  );

  if (!l1) return {};

  // Niveau 2 : parrain du parrain
  let l2: User | undefined;
  if (l1.referredBy) {
    const cleanL2Key = l1.referredBy.trim().toUpperCase();
    l2 = users.find(u => u.id === l1.referredBy || u.referralCode.toUpperCase() === cleanL2Key);
  }

  // Niveau 3 : parrain du Niveau 2
  let l3: User | undefined;
  if (l2 && l2.referredBy) {
    const cleanL3Key = l2.referredBy.trim().toUpperCase();
    l3 = users.find(u => u.id === l2.referredBy || u.referralCode.toUpperCase() === cleanL3Key);
  }

  return { l1, l2, l3 };
};

/**
 * ACHAT D'UN PRODUIT PAR L'UTILISATEUR
 * Respect strict des règles :
 * 1. Les commissions de parrainage sont calculées UNIQUEMENT sur le PREMIER investissement.
 * 2. Un second investissement ne génère AUCUNE commission de parrainage.
 * 3. Un dépôt sans achat ne génère aucune commission.
 */
export const purchaseProduct = async (
  user: User, 
  product: ProductItem
): Promise<{
  success: boolean;
  error?: string;
  investment?: UserInvestment;
  isFirstInvestment: boolean;
  commissionDetails?: string[];
  newBalance?: number;
}> => {
  // Vérification du solde
  if (user.balance < product.price) {
    return {
      success: false,
      error: `Solde insuffisant. Prix de la franchise : ${formatFCFA(product.price)}, votre solde : ${formatFCFA(user.balance)}`,
      isFirstInvestment: false
    };
  }

  // Vérifier s'il s'agit du PREMIER investissement
  const isFirst = !hasUserEverInvested(user.id);
  const commissionDetails: string[] = [];

  const settings = getStoredSettings();
  const newTransactions: Transaction[] = [];
  const newReferralLogs: ReferralCommissionLog[] = [];

  // SI PREMIER INVESTISSEMENT : Calcul et versement des commissions aux parrains (Niveau 1, 2, 3)
  if (isFirst) {
    const sponsors = findUplineSponsors(user.referredBy);

    // Niveau 1
    if (sponsors.l1) {
      const percentL1 = settings.referralL1Percent || 18;
      const amountL1 = Math.round(product.price * (percentL1 / 100));
      if (amountL1 > 0) {
        await adjustUserBalance(sponsors.l1.id, 'ADD', amountL1);
        newTransactions.push({
          id: 'tx-com-l1-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
          userId: sponsors.l1.id,
          userName: sponsors.l1.name,
          userPhone: sponsors.l1.phone,
          type: 'DEPOSIT',
          amount: amountL1,
          method: `Commission Parrainage N1 (${percentL1}%)`,
          status: 'SUCCESS',
          date: new Date().toISOString(),
          reference: `COM-N1-${Math.floor(100000 + Math.random() * 900000)}`,
          note: `Commission 1er investissement de ${user.name} sur ${product.name} (+${formatFCFA(amountL1)})`
        });
        newReferralLogs.push({
          id: 'ref-log-' + Date.now().toString(36) + '-1',
          sponsorId: sponsors.l1.id,
          sponsorName: sponsors.l1.name,
          downlineId: user.id,
          downlineName: user.name,
          level: 1,
          percentage: percentL1,
          amount: amountL1,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          date: new Date().toISOString()
        });
        commissionDetails.push(`Niveau 1 (${sponsors.l1.name}): +${formatFCFA(amountL1)} (${percentL1}%)`);
      }
    }

    // Niveau 2
    if (sponsors.l2) {
      const percentL2 = settings.referralL2Percent || 2;
      const amountL2 = Math.round(product.price * (percentL2 / 100));
      if (amountL2 > 0) {
        await adjustUserBalance(sponsors.l2.id, 'ADD', amountL2);
        newTransactions.push({
          id: 'tx-com-l2-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
          userId: sponsors.l2.id,
          userName: sponsors.l2.name,
          userPhone: sponsors.l2.phone,
          type: 'DEPOSIT',
          amount: amountL2,
          method: `Commission Parrainage N2 (${percentL2}%)`,
          status: 'SUCCESS',
          date: new Date().toISOString(),
          reference: `COM-N2-${Math.floor(100000 + Math.random() * 900000)}`,
          note: `Commission Niveau 2 : 1er investissement de ${user.name} sur ${product.name} (+${formatFCFA(amountL2)})`
        });
        newReferralLogs.push({
          id: 'ref-log-' + Date.now().toString(36) + '-2',
          sponsorId: sponsors.l2.id,
          sponsorName: sponsors.l2.name,
          downlineId: user.id,
          downlineName: user.name,
          level: 2,
          percentage: percentL2,
          amount: amountL2,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          date: new Date().toISOString()
        });
        commissionDetails.push(`Niveau 2 (${sponsors.l2.name}): +${formatFCFA(amountL2)} (${percentL2}%)`);
      }
    }

    // Niveau 3
    if (sponsors.l3) {
      const percentL3 = settings.referralL3Percent || 1;
      const amountL3 = Math.round(product.price * (percentL3 / 100));
      if (amountL3 > 0) {
        await adjustUserBalance(sponsors.l3.id, 'ADD', amountL3);
        newTransactions.push({
          id: 'tx-com-l3-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
          userId: sponsors.l3.id,
          userName: sponsors.l3.name,
          userPhone: sponsors.l3.phone,
          type: 'DEPOSIT',
          amount: amountL3,
          method: `Commission Parrainage N3 (${percentL3}%)`,
          status: 'SUCCESS',
          date: new Date().toISOString(),
          reference: `COM-N3-${Math.floor(100000 + Math.random() * 900000)}`,
          note: `Commission Niveau 3 : 1er investissement de ${user.name} sur ${product.name} (+${formatFCFA(amountL3)})`
        });
        newReferralLogs.push({
          id: 'ref-log-' + Date.now().toString(36) + '-3',
          sponsorId: sponsors.l3.id,
          sponsorName: sponsors.l3.name,
          downlineId: user.id,
          downlineName: user.name,
          level: 3,
          percentage: percentL3,
          amount: amountL3,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          date: new Date().toISOString()
        });
        commissionDetails.push(`Niveau 3 (${sponsors.l3.name}): +${formatFCFA(amountL3)} (${percentL3}%)`);
      }
    }

    // Sauvegarder les logs de parrainage
    if (newReferralLogs.length > 0) {
      saveReferralLogs([...newReferralLogs, ...getReferralLogs()]);
    }

    // Marquer l'utilisateur comme ayant effectué son premier investissement
    updateUser(user.id, {
      hasPurchasedFirstProduct: true,
      firstInvestmentDate: new Date().toISOString()
    });
  } else {
    // SECOND OU INVESTISSEMENT ULTÉRIEUR : Règle stricte : AUCUNE commission calculée
    commissionDetails.push("Second investissement : Aucune commission de parrainage calculée selon les règles strictes de la plateforme.");
  }

  // Déduction du solde de l'utilisateur
  const newBalance = user.balance - product.price;
  await adjustUserBalance(user.id, 'SUBTRACT', product.price);

  // Transaction d'achat pour l'utilisateur
  newTransactions.push({
    id: 'tx-inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    userName: user.name,
    userPhone: user.phone,
    type: 'VIP',
    amount: product.price,
    method: 'Souscription Franchise',
    status: 'SUCCESS',
    date: new Date().toISOString(),
    reference: `INV-${product.category.substring(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`,
    note: `Achat ${product.name} (${formatFCFA(product.daily)}/jour pendant ${product.duration}j)`
  });

  // Enregistrer les transactions
  if (newTransactions.length > 0) {
    const existingTxs = getStoredTransactions();
    saveTransactions([...newTransactions, ...existingTxs]);
  }

  // Création de l'investissement
  const now = new Date();
  const newInvestment: UserInvestment = {
    id: 'inv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    userId: user.id,
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: product.price,
    daily: product.daily,
    duration: product.duration,
    daysElapsed: 0,
    totalEarned: 0,
    purchaseDate: now.toISOString(),
    lastCreditDate: now.toISOString(),
    status: 'ACTIVE',
    image: product.image,
    source: 'USER_PURCHASE',
    referralCommissionPaid: isFirst
  };

  const currentInvestments = getStoredInvestments();
  saveInvestments([newInvestment, ...currentInvestments]);

  return {
    success: true,
    investment: newInvestment,
    isFirstInvestment: isFirst,
    commissionDetails,
    newBalance
  };
};

/**
 * OFFRE DE PRODUIT PAR L'ADMINISTRATEUR
 * Règle stricte : "Le offre de produits, ajustement par l'administrateur ne doit pas être calculé comme commissions de parrainage."
 * Aucune commission de parrainage n'est générée !
 */
export const giftProductByAdmin = (
  targetUserId: string,
  product: ProductItem,
  adminNote?: string
): { success: boolean; investment: UserInvestment } => {
  const users = getStoredUsers();
  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) {
    throw new Error("Utilisateur introuvable");
  }

  const now = new Date();
  const giftedInvestment: UserInvestment = {
    id: 'inv-gift-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    userId: targetUserId,
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: product.price,
    daily: product.daily,
    duration: product.duration,
    daysElapsed: 0,
    totalEarned: 0,
    purchaseDate: now.toISOString(),
    lastCreditDate: now.toISOString(),
    status: 'ACTIVE',
    image: product.image,
    source: 'ADMIN_GIFT',
    referralCommissionPaid: false // STRICTEMENT AUCUNE COMMISSION DE PARRAINAGE
  };

  const currentInvestments = getStoredInvestments();
  saveInvestments([giftedInvestment, ...currentInvestments]);

  // Ajouter une transaction informative gratuite
  const tx: Transaction = {
    id: 'tx-gift-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
    userId: targetUserId,
    userName: targetUser.name,
    userPhone: targetUser.phone,
    type: 'DEPOSIT',
    amount: 0,
    method: 'Offre Franchise (Admin)',
    status: 'SUCCESS',
    date: now.toISOString(),
    reference: `GIFT-${Math.floor(100000 + Math.random() * 900000)}`,
    note: adminNote || `Franchise ${product.name} offerte gracieusement par l'administration (aucune commission de parrainage applicable).`
  };

  const existingTxs = getStoredTransactions();
  saveTransactions([tx, ...existingTxs]);

  return { success: true, investment: giftedInvestment };
};

/**
 * AUTOMATISATION DES REVENUS QUOTIDIENS APRÈS 24H
 * Règle stricte : "Les revenus doivent être crédité automatiquement chaque jour après 24h."
 * 
 * Calcule pour chaque investissement actif les cycles de 24h révolus depuis le dernier crédit,
 * crédite automatiquement le solde de l'utilisateur, crée les transactions et met à jour l'investissement.
 */
export const processAutomaticDailyRevenues = async (
  targetUserId?: string
): Promise<{
  creditedCount: number;
  totalAmountCredited: number;
  details: string[];
}> => {
  const investments = getStoredInvestments();
  if (investments.length === 0) {
    return { creditedCount: 0, totalAmountCredited: 0, details: [] };
  }

  const now = Date.now();
  let hasChanges = false;
  let creditedCount = 0;
  let totalAmountCredited = 0;
  const details: string[] = [];
  const newTransactions: Transaction[] = [];

  const updatedInvestments = [];
  for (const inv of investments) {
    // Ne traiter que les investissements actifs
    if (inv.status !== 'ACTIVE') {
      updatedInvestments.push(inv);
      continue;
    }

    // Filtrer par utilisateur si spécifié
    if (targetUserId && inv.userId !== targetUserId) {
      updatedInvestments.push(inv);
      continue;
    }

    const lastCreditTime = new Date(inv.lastCreditDate).getTime();
    const elapsedMs = now - lastCreditTime;

    // Nombre de cycles de 24h pleins écoulés
    const fullCycles = Math.floor(elapsedMs / TWENTY_FOUR_HOURS_MS);

    if (fullCycles <= 0) {
      updatedInvestments.push(inv);
      continue;
    }

    // Nombre de jours restant sur la durée totale du produit
    const remainingDays = Math.max(0, inv.duration - inv.daysElapsed);
    if (remainingDays <= 0) {
      hasChanges = true;
      updatedInvestments.push({ ...inv, status: 'COMPLETED' as const });
      continue;
    }

    // Nombre de cycles effectivement à créditer
    const cyclesToCredit = Math.min(fullCycles, remainingDays);
    if (cyclesToCredit <= 0) {
      updatedInvestments.push(inv);
      continue;
    }

    const amountToCredit = cyclesToCredit * inv.daily;
    const newDaysElapsed = inv.daysElapsed + cyclesToCredit;
    const isCompleted = newDaysElapsed >= inv.duration;

    // Avancement de la date du dernier crédit par tranches exactes de 24h
    const newLastCreditDate = new Date(lastCreditTime + cyclesToCredit * TWENTY_FOUR_HOURS_MS).toISOString();

    // Créditer le solde de l'utilisateur
    await adjustUserBalance(inv.userId, 'ADD', amountToCredit);

    // Récupérer le nom de l'utilisateur pour la transaction
    const users = getStoredUsers();
    const owner = users.find(u => u.id === inv.userId);

    // Créer la transaction de crédit automatique 24h
    newTransactions.push({
      id: 'tx-rev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      userId: inv.userId,
      userName: owner?.name || 'Titulaire Franchise',
      userPhone: owner?.phone || '',
      type: 'DEPOSIT',
      amount: amountToCredit,
      method: 'Revenu Quotidien (24h)',
      status: 'SUCCESS',
      date: new Date().toISOString(),
      reference: `REV-24H-${Math.floor(100000 + Math.random() * 900000)}`,
      note: `Rendement 24h automatique : ${inv.productName} (+${formatFCFA(amountToCredit)}) [${cyclesToCredit} cycle(s) 24h crédité(s), Jour ${newDaysElapsed}/${inv.duration}]`
    });

    creditedCount += cyclesToCredit;
    totalAmountCredited += amountToCredit;
    details.push(`${inv.productName}: +${formatFCFA(amountToCredit)} (${cyclesToCredit}x 24h)`);
    hasChanges = true;

    updatedInvestments.push({
      ...inv,
      daysElapsed: newDaysElapsed,
      totalEarned: inv.totalEarned + amountToCredit,
      lastCreditDate: newLastCreditDate,
      status: isCompleted ? ('COMPLETED' as const) : ('ACTIVE' as const)
    });
  }

  if (hasChanges) {
    saveInvestments(updatedInvestments);

    if (newTransactions.length > 0) {
      const existingTxs = getStoredTransactions();
      saveTransactions([...newTransactions, ...existingTxs]);
    }

    window.dispatchEvent(new Event('user_balance_updated'));
    window.dispatchEvent(new CustomEvent('coca_revenue_credited', {
      detail: { creditedCount, totalAmountCredited, details }
    }));
  }

  return { creditedCount, totalAmountCredited, details };
};

/**
 * Calcul du temps restant avant le prochain crédit automatique 24h pour un investissement
 */
export const getTimeUntilNextCredit = (lastCreditDate: string): {
  msRemaining: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
  isReady: boolean;
} => {
  const lastTime = new Date(lastCreditDate).getTime();
  const nextTime = lastTime + TWENTY_FOUR_HOURS_MS;
  const now = Date.now();
  const msRemaining = Math.max(0, nextTime - now);

  if (msRemaining === 0) {
    return {
      msRemaining: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: '00:00:00 (Prêt au crédit)',
      isReady: true
    };
  }

  const totalSeconds = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return {
    msRemaining,
    hours,
    minutes,
    seconds,
    formatted,
    isReady: false
  };
};

/**
 * Outil de simulation/test : avance le temps de 24h pour tester le crédit automatique immédiatement
 */
export const simulateAdvance24h = async (investmentId: string): Promise<{ success: boolean; result: any; creditedAmount?: number }> => {
  const investments = getStoredInvestments();
  const idx = investments.findIndex(inv => inv.id === investmentId);
  if (idx === -1) {
    return { success: false, result: 'Investissement non trouvé' };
  }

  // Reculer la date du dernier crédit de 24h + 1 minute pour que le cycle soit atteint
  const currentLast = new Date(investments[idx].lastCreditDate).getTime();
  investments[idx].lastCreditDate = new Date(currentLast - (TWENTY_FOUR_HOURS_MS + 60000)).toISOString();
  saveInvestments(investments);

  // Déclencher le traitement immédiat
  const result = await processAutomaticDailyRevenues(investments[idx].userId);
  return { success: true, result, creditedAmount: result.totalAmountCredited };
};

export const getAllInvestments = getStoredInvestments;
export const getAllReferralLogs = (): ReferralCommissionLog[] => getReferralLogs();
