import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Trophy, Percent, Copy, CheckCircle2, HelpCircle, ShieldCheck, AlertCircle, Sparkles, Share2, Send, ExternalLink } from 'lucide-react';
import { formatFCFA } from '../utils';
import { User, ReferralCommissionLog } from '../types';
import { getStoredSettings, getPlatformInviteLink } from '../services/appSettingsService';
import { getStoredUsers } from '../services/userService';
import { getReferralLogs } from '../services/investmentService';

interface TeamProps {
  user: User | null;
}

export default function Team({ user }: TeamProps) {
  const [copied, setCopied] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [settings, setSettings] = useState(getStoredSettings());
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [commissionLogs, setCommissionLogs] = useState<ReferralCommissionLog[]>([]);

  useEffect(() => {
    if (!user) return;
    const allUsers = getStoredUsers();
    // Direct downline (Level 1)
    const direct = allUsers.filter(u => 
      u.referredBy && (u.referredBy.toUpperCase() === user.referralCode.toUpperCase() || u.referredBy === user.id)
    );
    setTeamMembers(direct);

    const logs = getReferralLogs(user.id);
    setCommissionLogs(logs);
  }, [user]);

  const totalCommissions = commissionLogs.reduce((acc, l) => acc + l.amount, 0);
  const referralLink = getPlatformInviteLink(user?.referralCode);
  const platformBaseLink = getPlatformInviteLink();

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsapp = () => {
    const text = `Rejoins-moi sur la plateforme officielle Coca-Cola Invest pour activer ta franchise et générer des revenus quotidiens : ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareTelegram = () => {
    const text = `Rejoins-moi sur la plateforme officielle Coca-Cola Invest pour activer ta franchise et générer des revenus quotidiens : ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="p-6 pb-24"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 dark:bg-red-950/40 rounded-xl text-[#F40009]">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white">Mon Équipe</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Commissions sur le 1er investissement</p>
          </div>
        </div>
        <button 
          onClick={() => setShowTutorial(!showTutorial)}
          className="p-2 bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {showTutorial && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20 mb-6"
        >
          <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-sm flex items-center">
            <HelpCircle className="w-4 h-4 mr-1.5" /> Règles Officielles de Parrainage
          </h3>
          <ul className="text-xs text-blue-700/80 dark:text-blue-200/80 space-y-1.5 list-disc pl-4">
            <li>Copiez et partagez votre lien ou code unique ci-dessous.</li>
            <li><strong>1er investissement :</strong> Dès que votre filleul achète sa toute première franchise, la commission est créditée instantanément sur votre solde.</li>
            <li><strong>Investissements secondaires :</strong> Un second achat par le même filleul ne génère aucune commission.</li>
            <li><strong>Dépôts simples :</strong> Recharger un compte sans acheter de franchise ne génère aucune commission.</li>
            <li><strong>Cadeaux Admin :</strong> Les franchises offertes par l'administrateur ne génèrent aucune commission.</li>
          </ul>
        </motion.div>
      )}

      {/* Referral Link Box */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] p-5 mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">Lien officiel de la plateforme</h3>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
            Lien personnalisé
          </span>
        </div>

        <div className="flex items-center bg-gray-50 dark:bg-[#222] rounded-xl p-2 border border-gray-100 dark:border-[#333]">
          <input 
            type="text" 
            readOnly 
            value={referralLink}
            className="bg-transparent flex-1 outline-none text-xs font-mono font-bold text-gray-800 dark:text-gray-200 px-2 truncate"
          />
          <button 
            onClick={handleCopy}
            className="px-3 py-1.5 bg-[#F40009] hover:bg-[#d60008] text-white rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center space-x-1"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleShareWhatsapp}
            className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={handleShareTelegram}
            className="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Partager Telegram</span>
          </button>
        </div>
      </div>

      {/* Commission Structure & Strict Rules */}
      <div className="bg-gray-900 rounded-2xl p-5 text-white mb-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-['Poppins'] font-bold flex items-center text-sm">
            <Percent className="w-4 h-4 mr-2 text-[#F40009]" />
            Taux de Commissions (1er Achat)
          </h3>
          <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
            3 Niveaux
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xl font-bold text-[#F40009]">{settings.referralL1Percent || 18}%</p>
            <p className="text-xs text-gray-300 mt-0.5">Niveau 1 (Direct)</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xl font-bold text-[#F40009]">{settings.referralL2Percent || 2}%</p>
            <p className="text-xs text-gray-300 mt-0.5">Niveau 2</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-xl font-bold text-[#F40009]">{settings.referralL3Percent || 1}%</p>
            <p className="text-xs text-gray-300 mt-0.5">Niveau 3</p>
          </div>
        </div>

        {/* 4 Rules Reminder Badge */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-gray-300 space-y-1">
          <p className="font-semibold text-white flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Application stricte du système :</span>
          </p>
          <p className="text-gray-400 leading-tight">
            ✓ Commissions calculées uniquement sur le 1er investissement. Aucune commission sur 2e achat, dépôt simple ou produit offert.
          </p>
        </div>
      </div>

      {/* Downline Members List */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden mb-6">
        <div className="p-4 bg-gray-50 dark:bg-[#222] border-b border-gray-100 dark:border-[#333] flex items-center justify-between">
          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
            Filleuls Directs ({teamMembers.length})
          </h3>
          <span className="text-xs font-bold text-emerald-600">
            Total gains : {formatFCFA(totalCommissions)}
          </span>
        </div>

        {teamMembers.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            Vous n'avez pas encore de filleul. Partagez votre lien pour commencer à développer votre équipe !
          </div>
        ) : (
          teamMembers.map((member, index) => {
            const hasInvested = member.hasPurchasedFirstProduct;
            return (
              <div 
                key={member.id} 
                className={`p-4 flex items-center justify-between ${
                  index !== teamMembers.length - 1 ? 'border-b border-gray-50 dark:border-[#333]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-[#F40009] font-bold text-sm">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{member.name}</h4>
                    <p className="text-[11px] text-gray-400">{member.phone}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hasInvested ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}>
                    {hasInvested ? '1er Achat Réalisé' : 'En attente 1er achat'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <button 
        onClick={handleCopy}
        className="w-full bg-[#F40009] hover:bg-[#d60008] text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer shadow-lg flex items-center justify-center space-x-2"
      >
        <Copy className="w-4 h-4" />
        <span>{copied ? 'Lien copié !' : "Copier mon lien d'invitation"}</span>
      </button>
    </motion.div>
  );
}
