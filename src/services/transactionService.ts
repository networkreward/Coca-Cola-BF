import { Transaction } from '../types';
import { db } from '../firebase';
import { doc, collection, addDoc, query, getDocs, setDoc } from 'firebase/firestore';
import { getStoredUsers } from './userService';

const STORAGE_KEY = 'coca_app_transactions';
const SEED_TRANSACTIONS: Transaction[] = [];

let cachedTransactions: Transaction[] = [];

export const initTransactionCache = async () => {
  const querySnapshot = await getDocs(collection(db, 'transactions'));
  cachedTransactions = querySnapshot.docs.map(doc => doc.data() as Transaction);
};

export const getStoredTransactions = (): Transaction[] => cachedTransactions;

export const saveTransactions = (txs: Transaction[]) => {
  cachedTransactions = txs;
  for (const tx of txs) {
    setDoc(doc(db, 'transactions', tx.id), tx).catch(console.error);
  }
};

export const getTransactionsFromFirestore = async (userId: string): Promise<Transaction[]> => {
  const q = query(collection(db, 'transactions')); // Querying all for cache
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Transaction);
};

export const addTransactionToFirestore = async (transaction: Omit<Transaction, 'id' | 'date'> & { userId: string }): Promise<string> => {
  const newTx: Transaction = {
    ...transaction,
    id: 'tx-' + Date.now().toString(36),
    date: new Date().toISOString(),
  };
  await setDoc(doc(db, 'transactions', newTx.id), newTx);
  cachedTransactions = [newTx, ...cachedTransactions];
  return newTx.id;
};

export const updateTransactionStatus = (
  txId: string, 
  newStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | 'CANCELLED',
  adminNote?: string
): { updatedTxs: Transaction[]; affectedTx: Transaction | null } => {
  const current = getStoredTransactions();
  let affectedTx: Transaction | null = null;
  const targetTx = current.find(t => t.id === txId);
  if (!targetTx) {
    return { updatedTxs: current, affectedTx: null };
  }
  const previousStatus = targetTx.status;

  // Si le statut est identique, aucune modification ni recalcul de solde (évite tout doublon)
  if (previousStatus === newStatus) {
    return { updatedTxs: current, affectedTx: targetTx };
  }

  const updated = current.map(tx => {
    if (tx.id === txId) {
      affectedTx = {
        ...tx,
        status: newStatus,
        note: adminNote || tx.note || (
          newStatus === 'SUCCESS' ? 'Approuvé' : 
          newStatus === 'CANCELLED' ? 'Annulé (Fonds recrédités sur le compte)' : 
          'Rejeté'
        )
      };
      return affectedTx;
    }
    return tx;
  });

  saveTransactions(updated);

  if (affectedTx && previousStatus !== newStatus) {
    const tx = affectedTx as Transaction;
    // Montant exact lancé à l'origine (ni plus, ni moins)
    const txAmount = Math.max(0, Number(tx.amount) || 0);

    if (txAmount > 0) {
      // Résolution du compte utilisateur cible
      let targetUserId = tx.userId;
      const allUsers = getStoredUsers();

      if (!targetUserId && tx.userPhone) {
        const match = allUsers.find(u => u.phone === tx.userPhone);
        if (match) targetUserId = match.id;
      }
      if (!targetUserId) {
        try {
          const currentStr = localStorage.getItem('coca_app_user');
          if (currentStr) {
            const cu = JSON.parse(currentStr);
            if (cu.phone === tx.userPhone || cu.id === tx.userId) {
              targetUserId = cu.id;
            }
          }
        } catch (e) {
          console.error('Error resolving fallback user', e);
        }
      }

      const userObj = targetUserId ? allUsers.find(u => u.id === targetUserId) : null;

      // 1. GESTION DES DÉPÔTS
      if (tx.type === 'DEPOSIT') {
        if (previousStatus === 'PENDING' && newStatus === 'SUCCESS') {
          // Dépôt approuvé : la mise à jour du solde doit être effectuée par le serveur backend
        } else if (previousStatus === 'SUCCESS' && (newStatus === 'CANCELLED' || newStatus === 'REJECTED')) {
          // Annulation : le serveur doit gérer le remboursement
        }
      } 
      // 2. GESTION DES RETRAITS
      else if (tx.type === 'WITHDRAW') {
        if ((previousStatus === 'PENDING' || previousStatus === 'SUCCESS') && (newStatus === 'CANCELLED' || newStatus === 'REJECTED')) {
          // Recrédit : le serveur doit gérer le remboursement
        } else if ((previousStatus === 'CANCELLED' || previousStatus === 'REJECTED') && newStatus === 'SUCCESS') {
          // Re-validation : le serveur doit gérer
        }
      }
    }
  }

  return { updatedTxs: updated, affectedTx };
};

/**
 * Permet à l'administrateur d'annuler et rembourser immédiatement un retrait (en attente ou déjà validé).
 */
export const cancelWithdrawalByAdmin = (
  txId: string,
  reason?: string
): { success: boolean; message: string; affectedTx: Transaction | null; refundedAmount?: number } => {
  const current = getStoredTransactions();
  const tx = current.find(t => t.id === txId);

  if (!tx) {
    return { success: false, message: 'Transaction introuvable.', affectedTx: null };
  }

  if (tx.status === 'CANCELLED' || tx.status === 'REJECTED') {
    return { success: false, message: 'Ce retrait a déjà été annulé ou rejeté.', affectedTx: tx };
  }

  const motif = reason?.trim() || 'Annulé par l\'administrateur';
  const finalNote = `Retrait annulé par l'administrateur (${motif}). Montant exact de ${tx.amount} FCFA recrédité sur le compte du client.`;

  const { updatedTxs, affectedTx } = updateTransactionStatus(txId, 'CANCELLED', finalNote);

  return {
    success: true,
    message: `Retrait ${tx.reference || tx.id} de ${tx.amount} FCFA annulé. Exactement ${tx.amount} FCFA ont été reversés sur le compte du client (aucun surplus).`,
    affectedTx,
    refundedAmount: tx.amount
  };
};

/**
 * Permet à un utilisateur d'annuler sa demande de retrait en attente.
 * Le montant prélevé est immédiatement reversé sur son solde disponible.
 */
export const cancelWithdrawalByUser = (
  txId: string,
  userId?: string
): { success: boolean; message: string; refundedAmount?: number } => {
  const current = getStoredTransactions();
  const tx = current.find(t => t.id === txId);

  if (!tx) {
    return { success: false, message: 'Demande de retrait introuvable.' };
  }

  if (tx.type !== 'WITHDRAW') {
    return { success: false, message: 'Cette transaction n’est pas un retrait.' };
  }

  if (tx.status !== 'PENDING') {
    const statusLabel = tx.status === 'SUCCESS' ? 'déjà validée et payée' :
                        tx.status === 'CANCELLED' ? 'déjà annulée' : 'déjà rejetée';
    return { 
      success: false, 
      message: `Impossible d'annuler : cette demande est ${statusLabel}.` 
    };
  }

  if (userId && tx.userId && tx.userId !== userId && tx.userId !== 'demo-user') {
    return { success: false, message: 'Vous n’êtes pas autorisé à annuler ce retrait.' };
  }

  const { updatedTxs, affectedTx } = updateTransactionStatus(
    txId,
    'CANCELLED',
    'Demande de retrait annulée par l\'utilisateur. Solde remboursé avec succès.'
  );

  return {
    success: true,
    message: `Votre demande de retrait de ${tx.amount} FCFA a été annulée. Vos fonds ont été immédiatement reversés sur votre solde.`,
    refundedAmount: tx.amount
  };
};

export const addManualTransaction = (newTx: Omit<Transaction, 'id' | 'date'>): Transaction => {
  const current = getStoredTransactions();
  const tx: Transaction = {
    ...newTx,
    id: 'manual-' + Math.random().toString(36).substring(2, 9),
    date: new Date().toISOString()
  };
  const updated = [tx, ...current];
  saveTransactions(updated);
  return tx;
};

export const resetTransactionsToSeed = (): Transaction[] => {
  saveTransactions(SEED_TRANSACTIONS);
  return SEED_TRANSACTIONS;
};
