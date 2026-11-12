import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Users, Package, CheckCircle2, ArrowLeft } from 'lucide-react';
import { User, ViewState, MissionItem } from '../types';
import { formatFCFA } from '../utils';
import { getStoredMissions } from '../services/missionsService';
import { getStoredUsers } from '../services/userService';

interface MissionsProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
  onChangeView: (view: ViewState) => void;
}

export default function Missions({ user, onUpdateBalance, onChangeView }: MissionsProps) {
  const [claimed, setClaimed] = useState<number[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [missionsList, setMissionsList] = useState<MissionItem[]>(getStoredMissions());
  const [realActiveReferrals, setRealActiveReferrals] = useState<number>(0);

  useEffect(() => {
    const loadMissions = () => setMissionsList(getStoredMissions());
    window.addEventListener('coca_missions_updated', loadMissions);

    // Calcul du nombre réel de filleuls de l'utilisateur
    try {
      const allUsers = getStoredUsers();
      const userReferrals = allUsers.filter(u => 
        u.referredBy && (u.referredBy.toUpperCase() === user.referralCode.toUpperCase() || u.referredBy === user.id)
      );
      setRealActiveReferrals(userReferrals.length);
    } catch {
      setRealActiveReferrals(0);
    }

    const savedClaimed = localStorage.getItem('coca_app_missions_claimed');
    if (savedClaimed) {
      setClaimed(JSON.parse(savedClaimed));
    }

    const savedProducts = localStorage.getItem('coca_app_my_products');
    if (savedProducts) {
      setMyProducts(JSON.parse(savedProducts));
    }

    return () => window.removeEventListener('coca_missions_updated', loadMissions);
  }, [user]);

  const missions = missionsList.map(m => ({
    ...m,
    current: m.type === 'referral' ? realActiveReferrals : undefined
  }));


  const checkVipEligibility = (targetName: string) => {
    return myProducts.some(p => p.name === targetName);
  };

  const handleClaim = (mission: typeof missions[0]) => {
    if (loadingId || claimed.includes(mission.id)) return;
    
    // Check eligibility
    let eligible = false;
    if (mission.type === 'referral') {
      eligible = (mission.current || 0) >= mission.target;
    } else if (mission.type === 'vip') {
      eligible = checkVipEligibility(mission.targetName!);
    }

    if (!eligible) {
      alert("Vous n'avez pas encore rempli les conditions pour cette mission.");
      return;
    }

    setLoadingId(mission.id);
    setTimeout(() => {
      const newClaimed = [...claimed, mission.id];
      setClaimed(newClaimed);
      localStorage.setItem('coca_app_missions_claimed', JSON.stringify(newClaimed));
      onUpdateBalance(user.balance + mission.reward);
      setLoadingId(null);
      alert(`Félicitations ! Vous avez reçu ${formatFCFA(mission.reward)}.`);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }}
      className="p-6 pb-24"
    >
      <button 
        onClick={() => onChangeView('HOME')}
        className="flex items-center text-gray-600 dark:text-gray-400 mb-6 font-bold text-sm hover:text-[#F40009] dark:hover:text-[#F40009] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
      </button>

      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-red-100 rounded-xl text-[#F40009]">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white">Vos Missions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Accomplissez des tâches pour gagner plus</p>
        </div>
      </div>

      <div className="space-y-4">
        {missions.map((mission) => {
          const isClaimed = claimed.includes(mission.id);
          let isEligible = false;
          let progressText = "";
          let progressPercent = 0;

          if (mission.type === 'referral') {
            isEligible = (mission.current || 0) >= mission.target;
            progressText = `${mission.current}/${mission.target}`;
            progressPercent = Math.min(100, ((mission.current || 0) / mission.target) * 100);
          } else if (mission.type === 'vip') {
            isEligible = checkVipEligibility(mission.targetName!);
            progressText = isEligible ? "1/1" : "0/1";
            progressPercent = isEligible ? 100 : 0;
          }

          return (
            <div key={mission.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${mission.type === 'referral' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                    {mission.type === 'referral' ? <Users className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{mission.title}</h3>
                    <p className="text-[#F40009] font-black text-sm">+{formatFCFA(mission.reward)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">
                    <span>Progression</span>
                    <span>{progressText}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[#2A2A2A] rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full bg-[#F40009] transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(mission)}
                  disabled={isClaimed || (!isEligible && mission.type === 'referral')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                    isClaimed 
                      ? 'bg-green-50 text-green-600 border border-green-200'
                      : isEligible
                        ? 'bg-[#F40009] text-white shadow-md hover:bg-[#d60008]'
                        : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {loadingId === mission.id 
                    ? '...' 
                    : isClaimed 
                      ? <span className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Reçu</span>
                      : 'Réclamer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
