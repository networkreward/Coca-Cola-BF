import { MissionItem } from '../types';

export const INITIAL_MISSIONS: MissionItem[] = [
  { id: 1, type: 'referral', target: 5, title: 'Avoir 05 filleuls actifs', reward: 500 },
  { id: 2, type: 'referral', target: 10, title: 'Avoir 10 filleuls actifs', reward: 1500 },
  { id: 3, type: 'referral', target: 20, title: 'Avoir 20 filleuls actifs', reward: 5000 },
  { id: 4, type: 'vip', targetName: 'Pack Minute Maid', productId: 6, title: 'Investir au produit VIP 6', reward: 1000 },
  { id: 5, type: 'vip', targetName: 'Pack Coca-Cola Zero', productId: 7, title: 'Investir au produit VIP 7', reward: 2000 },
  { id: 6, type: 'vip', targetName: 'Pack Monster Energy', productId: 9, title: 'Investir au produit VIP 9', reward: 10000 },
];

const MISSIONS_STORAGE_KEY = 'coca_app_missions_config';

export const getStoredMissions = (): MissionItem[] => {
  try {
    const saved = localStorage.getItem(MISSIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading missions', e);
  }
  return INITIAL_MISSIONS;
};

export const saveMissions = (missions: MissionItem[]) => {
  localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
  window.dispatchEvent(new Event('coca_missions_updated'));
};

export const addMission = (mission: Omit<MissionItem, 'id'>): MissionItem[] => {
  const current = getStoredMissions();
  const newMission: MissionItem = {
    ...mission,
    id: Date.now()
  };
  const updated = [...current, newMission];
  saveMissions(updated);
  return updated;
};

export const updateMission = (id: number, updates: Partial<MissionItem>): MissionItem[] => {
  const current = getStoredMissions();
  const updated = current.map(m => m.id === id ? { ...m, ...updates } : m);
  saveMissions(updated);
  return updated;
};

export const deleteMission = (id: number): MissionItem[] => {
  const current = getStoredMissions();
  const updated = current.filter(m => m.id !== id);
  saveMissions(updated);
  return updated;
};

export const resetMissionsToDefault = (): MissionItem[] => {
  localStorage.removeItem(MISSIONS_STORAGE_KEY);
  window.dispatchEvent(new Event('coca_missions_updated'));
  return INITIAL_MISSIONS;
};
