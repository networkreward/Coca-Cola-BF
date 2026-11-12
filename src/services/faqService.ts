import { FaqItem } from '../types';

export const INITIAL_FAQ: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Gains & Produits',
    question: 'Comment fonctionnent les gains quotidiens et quand sont-ils versés ?',
    answer: 'Dès que vous souscrivez à une franchise ou un pack de produits (bouteilles, distributeurs, stocks), les revenus quotidiens sont calculés et crédités automatiquement sur votre solde chaque 24 heures. La durée de contrat de chaque produit est de 90 jours.'
  },
  {
    id: 'faq-2',
    category: 'Retraits & Délais',
    question: 'Quelles sont les conditions et délais pour retirer mon argent ?',
    answer: 'Pour effectuer un retrait, vous devez impérativement avoir au moins un investissement (pack franchise) actif en cours. Le montant minimum de retrait est de 1 000 FCFA, avec des frais de gestion de 10% appliqués sur chaque retrait. Les paiements sont envoyés directement sur votre portefeuille Mobile Money (Orange Money, Wave, Moov, MTN) sous 24h ouvrées.'
  },
  {
    id: 'faq-3',
    category: 'Dépôts',
    question: 'Comment recharger mon solde pour acquérir un produit ?',
    answer: 'Allez dans l\'onglet "Compte" ou "Accueil", cliquez sur "Faire un dépôt". Le dépôt minimum est de 6 000 FCFA. Les paiements s\'effectuent exclusivement par Mobile Money (Orange Money, Wave, MTN, Moov). Aucun virement bancaire n\'est accepté. Le crédit sur votre solde est immédiat.'
  },
  {
    id: 'faq-4',
    category: 'Parrainage',
    question: 'Quel est le pourcentage de commission sur mon équipe de parrainage ?',
    answer: 'Vous bénéficiez d\'un plan de commissions sur 3 niveaux : 18% sur le montant des souscriptions de vos filleuls directs (Niveau 1), 2% sur le Niveau 2 et 1% sur le Niveau 3. Les commissions sont immédiatement disponibles pour retrait.'
  },
  {
    id: 'faq-5',
    category: 'Sécurité',
    question: 'Mes fonds et mes investissements sont-ils sécurisés ?',
    answer: 'Oui. Toutes les opérations de franchise correspondent à des unités matérielles réelles (machines de distribution réfrigérées, palettes de bouteilles consignées et flottes de livraison) assurées et suivies par des équipes logistiques dédiées.'
  },
  {
    id: 'faq-6',
    category: 'Support',
    question: 'Que faire si une transaction tarde ou si j\'ai besoin d\'assistance ?',
    answer: 'Notre service client officiel est disponible en continu sur WhatsApp et Telegram. Cliquez sur les boutons d\'assistance dans votre profil pour contacter un agent officiel muni de votre numéro de référence.'
  }
];

const FAQ_STORAGE_KEY = 'coca_app_faq_items';

export const getStoredFaq = (): FaqItem[] => {
  try {
    const saved = localStorage.getItem(FAQ_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Mettre à jour les règles clés de retrait et dépôt
        const updated = parsed.map((item: FaqItem) => {
          if (item.id === 'faq-2') {
            return INITIAL_FAQ.find(f => f.id === 'faq-2') || item;
          }
          if (item.id === 'faq-3') {
            return INITIAL_FAQ.find(f => f.id === 'faq-3') || item;
          }
          return item;
        });
        return updated;
      }
    }
  } catch (e) {
    console.error('Error reading FAQ items', e);
  }
  return INITIAL_FAQ;
};

export const saveFaq = (items: FaqItem[]) => {
  localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('coca_faq_updated'));
};

export const addFaqItem = (category: string, question: string, answer: string): FaqItem[] => {
  const current = getStoredFaq();
  const newItem: FaqItem = {
    id: 'faq-' + Date.now(),
    category: category || 'Général',
    question,
    answer
  };
  const updated = [newItem, ...current];
  saveFaq(updated);
  return updated;
};

export const updateFaqItem = (id: string, updates: Partial<FaqItem>): FaqItem[] => {
  const current = getStoredFaq();
  const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
  saveFaq(updated);
  return updated;
};

export const deleteFaqItem = (id: string): FaqItem[] => {
  const current = getStoredFaq();
  const updated = current.filter(item => item.id !== id);
  saveFaq(updated);
  return updated;
};

export const resetFaqToDefault = (): FaqItem[] => {
  localStorage.removeItem(FAQ_STORAGE_KEY);
  window.dispatchEvent(new Event('coca_faq_updated'));
  return INITIAL_FAQ;
};
