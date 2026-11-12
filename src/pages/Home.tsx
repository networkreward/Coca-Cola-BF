import { useState, useEffect } from 'react';
import { User, ViewState, ProductItem } from '../types';
import { formatFCFA } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, ArrowDownRight, Flame, HeadphonesIcon, 
  CheckCircle2, Activity, Calendar, Gift, Megaphone, 
  Sparkles, Award, ShieldCheck, 
  ChevronRight, ExternalLink, Zap, TrendingUp, Users, Factory, MessageCircle, Send,
  Box, Clock
} from 'lucide-react';
import { getStoredSettings, AppSettings } from '../services/appSettingsService';
import { getStoredProducts } from '../services/productService';
import { getCountryInfo } from '../services/countryService';
import { PWAInstallBanner } from '../components/PWAInstallBanner';

import cokeHeroSplash from '../assets/images/coke_hero_splash_1789991131629.jpg';
import bottlesImg from '../assets/images/coke_glass_bottles_1789988245951.jpg';
import vendingImg from '../assets/images/coke_vending_machine_1789988268340.jpg';
import cansImg from '../assets/images/coke_cans_pack_1789988294244.jpg';

interface HomeProps {
  user: User;
  onTransaction: (type: 'DEPOSIT' | 'WITHDRAW') => void;
  onUpdateBalance: (newBalance: number) => void;
  onChangeView?: (view: ViewState) => void;
}

const PARTNERS = ["LONAB", "SONABEL", "ONEA", "RTB", "BF1", "WAVE CI", "ORANGE MONEY", "MOOV AFRICA", "CORIS BANK"];
const FAKE_OPERATORS = ["Wave CI", "Orange Money", "MTN Money", "Moov Africa", "Coris Money"];
const FAKE_PHONES = [
  "07 48 *** 12", "01 42 *** 89", "07 88 *** 34", "05 50 *** 90", 
  "01 01 *** 45", "05 44 *** 23", "07 00 *** 99", "70 12 *** 56", 
  "76 54 *** 10", "78 99 *** 21", "60 22 *** 11"
];

export default function Home({ user, onTransaction, onUpdateBalance, onChangeView }: HomeProps) {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [liveFeed, setLiveFeed] = useState<{ id: number, text: string, type: 'DEPOSIT' | 'WITHDRAW', operator: string }[]>([]);

  // Daily check-in
  const [streak, setStreak] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const REWARDS = settings.checkinRewards || [100, 150, 200, 250, 350, 500, 1000];

  useEffect(() => {
    const handleSettingsUpdate = () => setSettings(getStoredSettings());
    window.addEventListener('app_settings_updated', handleSettingsUpdate);
    return () => window.removeEventListener('app_settings_updated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    // Load products
    const storedProds = getStoredProducts();
    setProducts(storedProds.slice(0, 3));

    // Daily streak logic
    const today = new Date().toDateString();
    const lastCheckin = localStorage.getItem('coca_last_checkin_date');
    const currentStreak = parseInt(localStorage.getItem('coca_checkin_streak') || '0', 10);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastCheckin === today) {
      setHasCheckedInToday(true);
      setStreak(currentStreak);
    } else if (lastCheckin === yesterday.toDateString()) {
      setHasCheckedInToday(false);
      setStreak(currentStreak >= 7 ? 0 : currentStreak);
    } else {
      setHasCheckedInToday(false);
      setStreak(0);
    }

    // Initial simulated live activity
    const initialFeed = Array.from({ length: 4 }).map((_, i) => createFakeTransaction(i));
    setLiveFeed(initialFeed);

    const interval = setInterval(() => {
      setLiveFeed(prev => {
        const newTx = createFakeTransaction(Date.now());
        return [newTx, ...prev.slice(0, 3)];
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const createFakeTransaction = (id: number) => {
    const isDeposit = Math.random() > 0.45;
    const amount = Math.floor(Math.random() * 45) * 1000 + 6000;
    const phone = FAKE_PHONES[Math.floor(Math.random() * FAKE_PHONES.length)];
    const operator = FAKE_OPERATORS[Math.floor(Math.random() * FAKE_OPERATORS.length)];
    return {
      id,
      type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
      operator,
      text: `${phone} a ${isDeposit ? 'déposé' : 'reçu'} ${formatFCFA(amount)}`
    } as const;
  };

  const handleCheckInClick = () => {
    if (hasCheckedInToday || checkinLoading) return;
    setCheckinLoading(true);
    
    setTimeout(() => {
      const nextStreak = streak >= 7 ? 1 : streak + 1;
      const reward = REWARDS[nextStreak - 1] || 150;
      
      onUpdateBalance(user.balance + reward);
      setStreak(nextStreak);
      setHasCheckedInToday(true);
      
      localStorage.setItem('coca_last_checkin_date', new Date().toDateString());
      localStorage.setItem('coca_checkin_streak', nextStreak.toString());
      
      setCheckinLoading(false);
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="pb-28 text-gray-900 dark:text-gray-100"
    >
      {/* ========================================================================= */}
      {/* 1. COCA-COLA SIGNATURE HERO HEADER */}
      {/* ========================================================================= */}
      <div className="relative w-full bg-gradient-to-b from-[#8C0005] via-[#BA0008] to-[#E4000F] text-white pt-6 pb-14 px-5 rounded-b-[2.5rem] shadow-2xl overflow-hidden">
        {/* Cinematic Backdrop Image with Cold Refreshing Splash */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img 
            src={cokeHeroSplash} 
            alt="Coca-Cola Heritage" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-35 mix-blend-overlay scale-105 filter contrast-125"
          />
          {/* Coca-Cola Dynamic Ribbon Wave Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#B00007] via-transparent to-black/30"></div>
          
          {/* Subtle Ambient Fizz Bubbles */}
          <div className="absolute top-4 right-10 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-6 left-6 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Top Bar: Brand Badge & Hub Indicator */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center space-x-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-white font-mono">
                {getCountryInfo(user.country).flag} Hub {getCountryInfo(user.country).name}
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] font-semibold text-white/90">
              <Award className="w-3 h-3 text-amber-300" />
              <span>Franchise Certifiée</span>
            </div>
          </div>

          {/* Quick Service Client Pill */}
          <a
            href={
              (settings.customerServiceWhatsapp || settings.supportWhatsappNumber || '').startsWith('http')
                ? (settings.customerServiceWhatsapp || settings.supportWhatsappNumber)
                : `https://wa.me/${(settings.customerServiceWhatsapp || settings.supportWhatsappNumber || '2250700000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Bonjour Service Client Coca-Cola Invest, j'ai besoin d'assistance.")}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full bg-white text-[#F40009] hover:bg-red-50 text-[11px] font-bold shadow-md flex items-center space-x-1.5 transition-transform active:scale-95"
          >
            <HeadphonesIcon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Service Client</span>
          </a>
        </div>

        {/* Brand Display & Greeting */}
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="inline-block bg-white/20 backdrop-blur-sm px-3 py-0.5 rounded-lg mb-2">
              <p className="font-['Poppins'] text-[11px] font-black uppercase tracking-widest text-red-100 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                The Coca-Cola Bottling Investment Co.
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-['Poppins'] font-black tracking-tight text-white leading-tight drop-shadow-md">
              Bienvenue, {user.name}
            </h1>
            <p className="text-red-100/90 text-xs mt-1 font-medium flex items-center gap-1">
              Partenaire Franchisé Agréé • Réf: <span className="font-mono font-bold text-white bg-black/20 px-1.5 py-0.5 rounded">{user.referralCode}</span>
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#F40009] flex items-center justify-center font-['Poppins'] font-black text-2xl shadow-2xl border-2 border-white/60">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow border border-white">
              VIP
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 -mt-8 relative z-20 space-y-6">

        {/* Admin Broadcast Flash Banner */}
        {settings.isBroadcastBannerActive && settings.broadcastBannerText && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500 via-red-600 to-[#F40009] text-white p-3 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-semibold border border-amber-300/30"
          >
            <div className="p-2 bg-white/20 rounded-xl flex-shrink-0 animate-bounce">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <p className="truncate font-medium leading-snug">{settings.broadcastBannerText}</p>
            </div>
          </motion.div>
        )}

        {/* PWA Install Banner on Mobile */}
        <PWAInstallBanner />

        {/* ========================================================================= */}
        {/* 2. PRESTIGE INVESTOR METALLIC PASS (Solde Card) */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl p-6 shadow-2xl text-white overflow-hidden bg-gradient-to-br from-[#1c1a1a] via-[#141212] to-[#0a0a0a] border border-neutral-700/60">
          {/* Coca-Cola Deep Red Swirl Accent Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F40009]/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none translate-y-1/3"></div>

          {/* Card Header & Brand Ribbon */}
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                  Compte Investisseur Coca-Cola
                </span>
                <span className="bg-red-600/30 text-red-400 border border-red-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  Actif
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-['Poppins'] font-extrabold text-white mt-1 tracking-tight">
                {formatFCFA(user.balance)}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-neutral-400 uppercase">Rendement estimé</span>
              <div className="flex items-center justify-end text-emerald-400 font-bold text-xs mt-0.5">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                <span>+18.5% / cycle</span>
              </div>
            </div>
          </div>

          {/* Quick Financial Action Buttons */}
          <div className="grid grid-cols-2 gap-3 relative z-10 pt-2">
            <button 
              onClick={() => onTransaction('DEPOSIT')}
              className="bg-gradient-to-r from-[#F40009] to-[#D60008] hover:from-[#d60008] hover:to-[#b00007] text-white py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 shadow-lg shadow-red-600/40 active:scale-98 cursor-pointer"
            >
              <div className="p-1 bg-white/20 rounded-lg">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div className="text-left leading-none">
                <span className="block font-bold">Dépôt Express</span>
                <span className="text-[9px] text-emerald-200 font-semibold">Disponible 24h/24</span>
              </div>
            </button>

            <button 
              onClick={() => onTransaction('WITHDRAW')}
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <div className="p-1 bg-neutral-700 rounded-lg text-emerald-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
              <div className="text-left leading-none">
                <span className="block font-bold">Retrait Rapide</span>
                <span className="text-[9px] text-amber-400 font-semibold">Lun-Ven 10h-18h</span>
              </div>
            </button>
          </div>

          {/* Sub bar: Direct catalog CTA */}
          <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-300 relative z-10">
            <span className="flex items-center space-x-1.5 text-[11px] text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Capital garanti sous franchise officielle</span>
            </span>
            <button
              onClick={() => onChangeView?.('PRODUCTS')}
              className="text-red-400 hover:text-red-300 font-bold flex items-center space-x-1 text-[11px] cursor-pointer"
            >
              <span>Voir Catalogue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. CAPSULE ROUGE : POINTAGE JOURNALIER COCA-COLA */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-neutral-800 relative overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-red-500/10 text-[#F40009] flex items-center justify-center">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-['Poppins'] text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  Pointage Journalier
                  <span className="text-[10px] bg-red-100 dark:bg-red-950/60 text-[#F40009] font-bold px-2 py-0.5 rounded-full">
                    Gains Gratuits
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Série actuelle : <strong className="text-[#F40009]">{streak} jour{streak > 1 ? 's' : ''}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckInClick}
              disabled={hasCheckedInToday || checkinLoading}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow cursor-pointer ${
                hasCheckedInToday 
                  ? 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-neutral-500 cursor-not-allowed' 
                  : 'bg-[#F40009] hover:bg-[#d60008] text-white shadow-red-500/30 active:scale-95'
              }`}
            >
              {checkinLoading ? 'Validation...' : hasCheckedInToday ? '✓ Déjà pointé' : 'Pointer maintenant'}
            </button>
          </div>
          
          {/* Crown Bottle Cap Day Rewards */}
          <div className="grid grid-cols-4 gap-2">
            {REWARDS.map((reward, idx) => {
              const dayNumber = idx + 1;
              const isPast = streak > idx;
              const isCurrent = streak === idx && !hasCheckedInToday;
              const isGoldenCap = dayNumber === 7;
              
              return (
                <div 
                  key={idx} 
                  className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-center border transition-all ${
                    isGoldenCap ? 'col-span-2 flex-row justify-around bg-gradient-to-r from-amber-500/15 via-red-500/10 to-amber-500/15 border-amber-400/50 text-amber-500' :
                    isPast 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-600' 
                      : isCurrent 
                        ? 'bg-red-50 dark:bg-red-950/30 border-[#F40009] text-[#F40009] shadow-md ring-2 ring-red-500/20 scale-102 z-10' 
                        : 'bg-gray-50 dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 text-gray-400 dark:text-neutral-500'
                  }`}
                >
                  {isPast && (
                    <div className="absolute top-1.5 right-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider mb-0.5">
                      {isGoldenCap ? 'Jour 7 Capsule Or' : `Jour ${dayNumber}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      {isGoldenCap && <Gift className="w-4 h-4 text-amber-500 animate-bounce mr-1" />}
                      <span className={`font-['Poppins'] font-black ${isGoldenCap ? 'text-base text-amber-500' : 'text-xs'}`}>
                        +{reward} F
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. FRANCHISES PHARES EN VEDETTE (TOP INVESTMENTS) */}
        {/* ========================================================================= */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="font-['Poppins'] text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-[#F40009]" />
                Franchises Coca-Cola en Vedette
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rendements journaliers garantis versés chaque 24h</p>
            </div>
            
            <button
              onClick={() => onChangeView?.('PRODUCTS')}
              className="text-[#F40009] text-xs font-bold hover:underline flex items-center space-x-0.5 cursor-pointer"
            >
              <span>Tout voir</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {products.map((prod, i) => {
              const packNum = prod.packNumber || (i + 1);
              const defaultImg = i === 0 ? bottlesImg : i === 1 ? vendingImg : cansImg;
              return (
                <div 
                  key={prod.id || i}
                  className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* En-tête rouge conforme à l'affiche */}
                    <div className="bg-[#BA0008] text-white px-3 py-2 flex items-center space-x-2 shadow-sm">
                      <div className="bg-[#8A0005] border border-red-300/40 rounded-lg px-2 py-0.5 flex flex-col items-center justify-center shrink-0 min-w-[38px]">
                        <span className="text-[8px] font-black uppercase tracking-wider text-red-200 leading-none">PACK</span>
                        <span className="text-sm font-black text-white leading-tight">{packNum}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-['Poppins'] font-bold text-xs sm:text-sm text-white leading-tight truncate">
                          {prod.name}
                        </h3>
                        <p className="text-[10px] text-red-100 font-medium truncate opacity-90">
                          {prod.subtitle || prod.categoryLabel}
                        </p>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="relative overflow-hidden h-32 bg-neutral-900">
                      <img 
                        src={prod.image || defaultImg} 
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* 3 Lignes de caractéristiques */}
                    <div className="p-3 space-y-1.5 bg-white dark:bg-[#1A1A1A] text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-gray-500 dark:text-neutral-400">
                          <Box className="w-3.5 h-3.5 text-[#BA0008]" />
                          <span className="text-[11px]">Investissement</span>
                        </div>
                        <span className="font-bold font-mono text-gray-900 dark:text-white">
                          {formatFCFA(prod.price)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-gray-500 dark:text-neutral-400">
                          <TrendingUp className="w-3.5 h-3.5 text-[#BA0008]" />
                          <span className="text-[11px]">Revenu quotidien</span>
                        </div>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          +{formatFCFA(prod.daily)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-gray-500 dark:text-neutral-400">
                          <Clock className="w-3.5 h-3.5 text-[#BA0008]" />
                          <span className="text-[11px]">Durée</span>
                        </div>
                        <span className="font-bold font-mono text-gray-900 dark:text-white">
                          {prod.duration} jours
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bouton d'action rouge + 90 jours */}
                  <div className="p-3 pt-0">
                    <button
                      onClick={() => onChangeView?.('PRODUCTS')}
                      className="w-full bg-[#E51B24] hover:bg-[#C8000D] active:scale-98 text-white text-xs font-bold py-2 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>+ {prod.duration} jours</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. LIVE REVENUE FLUX (Activité des investisseurs en direct) */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-3">
            <div className="flex items-center text-[#F40009]">
              <Activity className="w-4 h-4 mr-2 animate-pulse" />
              <span>Paiements en direct (CI & BF)</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              En temps réel
            </span>
          </div>

          <div className="space-y-2 relative h-[100px] overflow-hidden">
            <AnimatePresence>
              {liveFeed.map((tx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs font-medium px-3.5 py-2.5 rounded-xl flex items-center justify-between border ${
                    tx.type === 'DEPOSIT' 
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40' 
                      : 'bg-red-50/70 dark:bg-red-950/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/40'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      {tx.operator}
                    </span>
                    <span className="truncate">{tx.text}</span>
                  </div>
                  {tx.type === 'DEPOSIT' ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. CHIFFRES CLÉS & CONFIANCE DU RÉSEAU COCA-COLA */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white dark:bg-[#1A1A1A] p-3.5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            <span className="text-xl font-['Poppins'] font-black text-[#F40009]">14+</span>
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-0.5">Centres Dépôts</span>
            <span className="text-[9px] text-gray-400">CI & BF</span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] p-3.5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            <span className="text-xl font-['Poppins'] font-black text-[#F40009]">1 850+</span>
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-0.5">Distributeurs</span>
            <span className="text-[9px] text-gray-400">En exploitation</span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] p-3.5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            <span className="text-xl font-['Poppins'] font-black text-emerald-500">&lt; 10 min</span>
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-0.5">Retrait Moyen</span>
            <span className="text-[9px] text-gray-400">Mobile Money</span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1A] p-3.5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
            <span className="text-xl font-['Poppins'] font-black text-[#F40009]">100%</span>
            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-0.5">Franchise Légale</span>
            <span className="text-[9px] text-gray-400">Contrat Agréé</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 7. COMMUNAUTÉ OFFICIELLE WHATSAPP & TELEGRAM */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-red-600 to-[#B00007] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                <Users className="w-4 h-4 text-amber-300" />
                <h3 className="font-['Poppins'] text-base font-bold text-white">
                  Rejoignez le Groupe VIP Officiel
                </h3>
                <span className="text-[10px] font-extrabold bg-amber-400 text-neutral-900 px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-neutral-900" />
                  <span>Le groupe est ouvert de 10h-18h</span>
                </span>
              </div>
              <p className="text-xs text-red-100 max-w-sm">
                Partagez avec des milliers d'investisseurs, recevez les preuves de paiement et les annonces exclusives ! Horaires du groupe : 10h00 à 18h00.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {(settings.whatsappGroupLink || settings.supportWhatsappGroupLink) && (
                <a
                  href={settings.whatsappGroupLink || settings.supportWhatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Groupe WhatsApp (10h-18h)</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              {(settings.telegramChannelLink || settings.supportTelegramLink) && (
                <a
                  href={settings.telegramChannelLink || settings.supportTelegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Canal Telegram</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}

              {settings.telegramGroupLink && (
                <a
                  href={settings.telegramGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Groupe Telegram (10h-18h)</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Partners Marquee */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-2.5 px-1">
            Partenaires Financiers & Télécoms
          </h3>
          <div className="w-full overflow-hidden bg-white dark:bg-[#1A1A1A] py-3 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm flex items-center">
            <div className="animate-marquee whitespace-nowrap flex space-x-8 px-4">
              {PARTNERS.map((partner, i) => (
                <span key={i} className="text-gray-800 dark:text-gray-200 font-['Poppins'] font-bold text-xs tracking-widest opacity-60">
                  {partner}
                </span>
              ))}
              {PARTNERS.map((partner, i) => (
                <span key={`dup-${i}`} className="text-gray-800 dark:text-gray-200 font-['Poppins'] font-bold text-xs tracking-widest opacity-60">
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Card Direct Link */}
        <div 
          onClick={() => onChangeView?.('MISSIONS')}
          className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-neutral-800 hover:border-red-300 rounded-3xl p-5 shadow-sm transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#F40009] flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                Missions & Primes de Parrainage
              </h4>
            </div>
            <span className="bg-[#F40009] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm">
              Jusqu'à 10 000 FCFA
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-10">
            Parrainez des partenaires ou souscrivez à des franchises pour débloquer des commissions directes jusqu'à 3 niveaux.
          </p>
        </div>

      </div>
    </motion.div>
  );
}
