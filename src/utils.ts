export const formatFCFA = (amount: number) => {
  return amount.toLocaleString('fr-FR') + ' FCFA';
};

/**
 * Vérification des horaires de retrait :
 * "Les retraits sont disponibles de 10h-18h de lundi au vendredi."
 */
export interface ScheduleStatus {
  isOpen: boolean;
  title: string;
  message: string;
  details: string;
  scheduleText: string;
  currentHourFormatted: string;
}

export const checkWithdrawalAvailability = (): ScheduleStatus => {
  const now = new Date();
  const day = now.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 5 = Vendredi, 6 = Samedi
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hour * 60 + minutes;

  const startMinutes = 10 * 60; // 10h00
  const endMinutes = 18 * 60;   // 18h00

  const isWeekday = day >= 1 && day <= 5;
  const isWithinHours = timeInMinutes >= startMinutes && timeInMinutes < endMinutes;
  const isOpen = isWeekday && isWithinHours;

  const currentHourFormatted = `${hour.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}`;
  const scheduleText = "10h-18h de lundi au vendredi";

  if (isOpen) {
    return {
      isOpen: true,
      title: "Guichet Retraits Ouvert",
      message: "Les retraits sont disponibles de 10h-18h de lundi au vendredi.",
      details: `Guichet actuellement ouvert (fermeture à 18h00). Heure actuelle : ${currentHourFormatted}.`,
      scheduleText,
      currentHourFormatted
    };
  }

  let nextInfo = "";
  if (!isWeekday) {
    nextInfo = "Le guichet rouvrira lundi à 10h00.";
  } else if (timeInMinutes < startMinutes) {
    nextInfo = "Le guichet ouvre aujourd'hui à 10h00.";
  } else {
    nextInfo = day === 5 ? "Le guichet rouvrira lundi à 10h00." : "Le guichet rouvrira demain à 10h00.";
  }

  return {
    isOpen: false,
    title: "Guichet Retraits Fermé",
    message: "Les retraits sont disponibles de 10h-18h de lundi au vendredi.",
    details: `${nextInfo} (Heure : ${currentHourFormatted}).`,
    scheduleText,
    currentHourFormatted
  };
};

/**
 * Vérification des horaires du groupe :
 * "Le groupe est ouvert de 10h-18h"
 */
export const checkGroupAvailability = (): {
  isOpen: boolean;
  message: string;
  scheduleText: string;
  currentHourFormatted: string;
} => {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hour * 60 + minutes;

  const isOpen = timeInMinutes >= 10 * 60 && timeInMinutes < 18 * 60;
  const currentHourFormatted = `${hour.toString().padStart(2, '0')}h${minutes.toString().padStart(2, '0')}`;

  return {
    isOpen,
    message: isOpen ? "Le groupe est actuellement ouvert (10h-18h)" : "Le groupe est ouvert de 10h-18h",
    scheduleText: "10h-18h",
    currentHourFormatted
  };
};

/**
 * Informations sur les dépôts :
 * "Les dépôts sont disponibles 24h/24 ."
 */
export const getDepositScheduleInfo = () => {
  return {
    isAlwaysOpen: true,
    message: "Les dépôts sont disponibles 24h/24.",
    scheduleText: "24h/24 (7j/7)"
  };
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

