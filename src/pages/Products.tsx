import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, ArrowRight, TrendingUp, Clock, ShieldCheck, 
  Layers, Wine, Store, Flame, Crown, CheckCircle2, AlertCircle, Sparkles,
  Package, Wallet, ArrowUpRight, Zap, Calendar, Truck, Snowflake, Box, Globe
} from 'lucide-react';
import { formatFCFA } from '../utils';
import { User, ProductItem, UserInvestment } from '../types';
import { getStoredProducts } from '../services/productService';
import { 
  purchaseProduct, getUserInvestments, getTimeUntilNextCredit 
} from '../services/investmentService';
import { CocaColaScriptLogo } from '../components/CocaColaLogo';
import catalogueHeroImg from '../assets/images/coke_catalogue_banner_1790508679635.jpg';

interface ProductsProps {
  user: User | null;
  onUpdateBalance?: (newBalance: number) => void;
  onTransaction?: (type: 'DEPOSIT' | 'WITHDRAW') => void;
}

type MainTab = 'CATALOG' | 'INVESTMENTS';
type ProductCategory = 'ALL' | 'BOTTLES' | 'VENDING' | 'STOCKS';

export default function Products({ user, onUpdateBalance, onTransaction }: ProductsProps) {
  const [mainTab, setMainTab] = useState<MainTab>('CATALOG');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('ALL');
  const [products, setProducts] = useState<ProductItem[]>(getStoredProducts());
  const [investments, setInvestments] = useState<UserInvestment[]>(() => user ? getUserInvestments(user.id) : []);

  // Modal d'achat réussi
  const [purchaseModal, setPurchaseModal] = useState<{
    show: boolean;
    product?: ProductItem;
    isFirst?: boolean;
    commissionDetails?: string[];
  }>({ show: false });

  // Modal de solde insuffisant
  const [insufficientModal, setInsufficientModal] = useState<{
    show: boolean;
    product?: ProductItem;
    neededAmount?: number;
  }>({ show: false });

  // Ticker 1s pour le compte à rebours en temps réel des versements 24h
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Synchronisation des produits et des investissements
  useEffect(() => {
    setProducts(getStoredProducts());
    const handleStorage = () => {
      setProducts(getStoredProducts());
      if (user) setInvestments(getUserInvestments(user.id));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('coca_products_updated', handleStorage);
    window.addEventListener('user_balance_updated', handleStorage);
    window.addEventListener('coca_revenue_credited', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('coca_products_updated', handleStorage);
      window.removeEventListener('user_balance_updated', handleStorage);
      window.removeEventListener('coca_revenue_credited', handleStorage);
    };
  }, [user?.id]);

  const filteredProducts = activeCategory === 'ALL' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const activeInvestmentsCount = investments.filter(i => i.status === 'ACTIVE').length;
  const totalInvestedAmount = investments.reduce((sum, i) => sum + i.price, 0);
  const totalDailyEarn = investments.filter(i => i.status === 'ACTIVE').reduce((sum, i) => sum + i.daily, 0);
  const totalAccumulatedEarned = investments.reduce((sum, i) => sum + i.totalEarned, 0);

  const handleInvest = async (product: ProductItem) => {
    if (!user) return;
    
    // 1. Si l'utilisateur n'a pas assez d'argent -> afficher Solde insuffisant
    if (user.balance < product.price) {
      setInsufficientModal({
        show: true,
        product,
        neededAmount: product.price - user.balance
      });
      return;
    }

    setLoadingId(product.id);
    
    try {
        const result = await purchaseProduct(user, product);
        
        if (!result.success) {
          if (result.error && result.error.toLowerCase().includes('solde')) {
            setInsufficientModal({
              show: true,
              product,
              neededAmount: Math.max(0, product.price - user.balance)
            });
          } else {
            alert(result.error || "Une erreur est survenue lors de la souscription.");
          }
          setLoadingId(null);
          return;
        }

        // Déduction immédiate du solde
        if (onUpdateBalance && result.newBalance !== undefined) {
          onUpdateBalance(result.newBalance);
        }

        // Actualisation des investissements
        setInvestments(getUserInvestments(user.id));
        
        // 2. Afficher Achat effectué avec succès
        setPurchaseModal({
          show: true,
          product,
          isFirst: result.isFirstInvestment,
          commissionDetails: result.commissionDetails
        });
      } catch (error: any) {
        alert("Une erreur est survenue : " + (error?.message || "Erreur inconnue"));
      } finally {
        setLoadingId(null);
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="p-4 sm:p-6 pb-28 max-w-4xl mx-auto"
    >
      {/* Sélecteur principal : Catalogue vs Mes Investissements */}
      <div className="flex bg-white dark:bg-[#1A1A1A] p-1.5 rounded-2xl mb-6 shadow-sm border border-gray-100 dark:border-[#333]">
        <button
          id="btn-tab-catalog"
          onClick={() => setMainTab('CATALOG')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'CATALOG'
              ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Catalogue Franchises ({products.length})</span>
        </button>

        <button
          id="btn-tab-my-investments"
          onClick={() => setMainTab('INVESTMENTS')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            mainTab === 'INVESTMENTS'
              ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Mes Investissements</span>
          {investments.length > 0 && (
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ml-1 ${
              mainTab === 'INVESTMENTS' ? 'bg-white text-[#F40009]' : 'bg-red-100 text-[#F40009] dark:bg-red-950/60'
            }`}>
              {investments.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* VUE 1 : CATALOGUE DES FRANCHISES & PRODUITS                   */}
      {/* ============================================================== */}
      {mainTab === 'CATALOG' && (
        <>
          {/* Header Banner Officiel (Conforme à l'affiche officielle) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#9B0005] via-[#C40008] to-[#E6000F] text-white p-5 sm:p-7 shadow-2xl mb-6 border border-red-700/50">
            {/* Visual background blend */}
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay">
              <img 
                src={catalogueHeroImg} 
                alt="Catalogue Officiel Coca-Cola" 
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top row: Coca-Cola cursive logo + Catalogue Officiel Ribbon */}
            <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center space-x-2">
                <CocaColaScriptLogo className="h-10 sm:h-12 text-white drop-shadow-md" />
              </div>
              <div className="bg-[#8B0005] border border-white/30 text-white font-extrabold text-[10px] sm:text-xs uppercase px-3.5 py-1 rounded-full shadow-md tracking-wider flex items-center space-x-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>CATALOGUE OFFICIEL</span>
              </div>
            </div>

            {/* Titles & Slogans matching flyer */}
            <div className="relative z-10 max-w-xl">
              <h1 className="font-['Poppins'] text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                Catalogue des Packs Partenaires
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-relaxed">
                Investissez dans la distribution, la logistique et la chaîne du froid Coca-Cola.
              </p>
              <p className="mt-2 text-sm sm:text-base italic font-serif text-amber-200 font-bold tracking-wide">
                « Plus qu'une boisson, une opportunité ! »
              </p>
            </div>

            {/* Visual Bottles & Delivery Truck Banner strip */}
            <div className="relative z-10 mt-5 rounded-2xl overflow-hidden border border-white/20 shadow-lg max-h-36 sm:max-h-44">
              <img 
                src={catalogueHeroImg} 
                alt="Gamme Coca-Cola et Flotte Logistique" 
                className="w-full h-full object-cover object-center filter contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-3">
                <div className="flex items-center justify-between w-full text-[11px] text-white font-bold">
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contrats certifiés 90 jours</span>
                  </span>
                  <span className="text-amber-300 font-mono">Paiement journalier chaque 24h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Raccourci vers mes investissements si l'utilisateur en possède */}
          {investments.length > 0 && (
            <div className="mb-6 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                    Vous avez {activeInvestmentsCount} pack{activeInvestmentsCount > 1 ? 's' : ''} actif{activeInvestmentsCount > 1 ? 's' : ''}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Revenus cumulés : <strong className="text-emerald-600">+{formatFCFA(totalDailyEarn)} / jour</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMainTab('INVESTMENTS')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-sm"
              >
                <span>Voir mes packs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
            <button
              id="tab-all-products"
              onClick={() => setActiveCategory('ALL')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'ALL'
                  ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
                  : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 hover:border-red-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tous les 11 packs ({products.length})</span>
            </button>

            <button
              id="tab-bottles"
              onClick={() => setActiveCategory('BOTTLES')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'BOTTLES'
                  ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
                  : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 hover:border-red-300'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              <span>Distribution locale</span>
            </button>

            <button
              id="tab-vending"
              onClick={() => setActiveCategory('VENDING')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'VENDING'
                  ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
                  : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 hover:border-red-300'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Camions & Froid</span>
            </button>

            <button
              id="tab-stocks"
              onClick={() => setActiveCategory('STOCKS')}
              className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === 'STOCKS'
                  ? 'bg-[#F40009] text-white shadow-md shadow-red-500/20'
                  : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-neutral-800 hover:border-red-300'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>Stockage & Logistique</span>
            </button>
          </div>

          {/* Grille des 11 Packs + 12ème Carte explicative (Conforme à l'affiche officielle) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const packNum = product.packNumber || product.id;
                const dailyPercent = ((product.daily / product.price) * 100).toFixed(1);

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    key={product.id} 
                    id={`product-card-${product.id}`}
                    className="group bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-200 dark:border-neutral-800 shadow-md hover:shadow-2xl hover:border-red-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* EN-TÊTE ROUGE DE LA CARTE (Style exact de l'affiche) */}
                      <div className="bg-[#BA0008] text-white px-3.5 py-2.5 flex items-center space-x-2.5 shadow-sm">
                        {/* Badge Rouge foncé PACK + Chiffre */}
                        <div className="bg-[#8A0005] border border-red-300/40 rounded-xl px-2 py-0.5 flex flex-col items-center justify-center shrink-0 min-w-[44px]">
                          <span className="text-[9px] font-black uppercase tracking-wider text-red-200 leading-none">PACK</span>
                          <span className="text-base sm:text-lg font-black text-white leading-tight">{packNum}</span>
                        </div>
                        {/* Titre et Sous-titre officiel */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-['Poppins'] font-bold text-sm sm:text-base text-white leading-tight truncate">
                            {product.name}
                          </h3>
                          <p className="text-[11px] text-red-100 font-medium truncate opacity-90 mt-0.5">
                            {product.subtitle || product.categoryLabel}
                          </p>
                        </div>
                      </div>

                      {/* Image du Pack */}
                      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-neutral-900">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20">
                          +{dailyPercent}% / jour
                        </div>
                      </div>

                      {/* Corps des caractéristiques (3 lignes avec icônes de l'affiche) */}
                      <div className="p-3.5 space-y-2 bg-white dark:bg-[#1A1A1A]">
                        {/* 1. Investissement */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400">
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-[#BA0008] flex items-center justify-center shrink-0">
                              <Box className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-semibold">Investissement</span>
                          </div>
                          <span className="font-black text-xs sm:text-sm text-gray-900 dark:text-white font-mono">
                            {formatFCFA(product.price)}
                          </span>
                        </div>

                        {/* 2. Revenu quotidien */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400">
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-[#BA0008] flex items-center justify-center shrink-0">
                              <TrendingUp className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-semibold">Revenu quotidien</span>
                          </div>
                          <span className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                            +{formatFCFA(product.daily)}
                          </span>
                        </div>

                        {/* 3. Durée */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2 text-gray-500 dark:text-neutral-400">
                            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 text-[#BA0008] flex items-center justify-center shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-semibold">Durée</span>
                          </div>
                          <span className="font-black text-xs sm:text-sm text-gray-900 dark:text-white font-mono">
                            {product.duration} jours
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BOUTON D'ACTION ROUGE : + 90 jours (Comme sur l'affiche) */}
                    <div className="p-3.5 pt-1">
                      <button 
                        id={`invest-btn-${product.id}`}
                        onClick={() => handleInvest(product)}
                        disabled={loadingId === product.id}
                        className="w-full bg-[#E51B24] hover:bg-[#C8000D] active:scale-98 text-white font-bold py-2.5 px-3 rounded-xl shadow-md hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
                      >
                        {loadingId === product.id ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Activation...
                          </span>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5 text-white" />
                            <span>+ {product.duration} jours</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* 12ÈME CARTE : POURQUOI CHOISIR CES PACKS ? (Reproduction fidèle de l'affiche) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#B80007] via-[#D6000C] to-[#990005] text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-red-700/50 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-['Poppins'] font-black text-base sm:text-lg leading-tight mb-3">
                    Pourquoi choisir ces packs ?
                  </h3>

                  <div className="space-y-2.5 text-xs text-white/95">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Globe className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-semibold">Une marque mondiale de confiance</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Truck className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-semibold">Un réseau logistique puissant</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Wine className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-semibold">Des produits phares et variés</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-semibold">Une croissance stable et durable</span>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-semibold">Un accompagnement partenaire</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/20 text-center">
                  <p className="text-[11px] italic font-serif text-white/90">
                    « Ensemble, faisons grandir le goût du succès ! »
                  </p>
                  <div className="mt-1 flex justify-center">
                    <CocaColaScriptLogo className="h-7 text-white" />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* BANDEAU NOIR DU CATALOGUE (Conforme au bas de l'affiche officielle) */}
          <div className="mt-8 bg-[#0D0D0D] text-white p-4 sm:p-5 rounded-2xl border border-neutral-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <CocaColaScriptLogo className="h-8 text-white" />
              <div className="h-6 w-px bg-neutral-700 hidden sm:block" />
              <span className="text-[11px] text-neutral-400 font-medium">Partenaire Officiel</span>
            </div>

            {/* 5 pôles d'activités avec icônes de l'affiche */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-neutral-300">
              <div className="flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-red-500" />
                <span>Distribution</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-red-500" />
                <span>Logistique</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Snowflake className="w-3.5 h-3.5 text-red-500" />
                <span>Chambre froide</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Box className="w-3.5 h-3.5 text-red-500" />
                <span>Stockage</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Truck className="w-3.5 h-3.5 text-red-500" />
                <span>Livraison</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] sm:text-xs font-bold text-amber-300">
                « Votre investissement d'aujourd'hui, votre revenu de demain ! »
              </p>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* VUE 2 : MES INVESTISSEMENTS (ACCESSIBLE DIRECTEMENT D'ICI)    */}
      {/* ============================================================== */}
      {mainTab === 'INVESTMENTS' && (
        <div className="space-y-6">
          {/* Bannière de statistiques globales */}
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#111] text-white p-5 rounded-3xl border border-gray-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#F40009]/20 text-[#F40009] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Poppins'] font-bold text-base text-white">Mes Franchises Actives</h3>
                  <p className="text-xs text-gray-400">{activeInvestmentsCount} franchise{activeInvestmentsCount > 1 ? 's' : ''} en cours de rendement</p>
                </div>
              </div>
              <button
                onClick={() => setMainTab('CATALOG')}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>+ Acheter</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center pt-2 border-t border-white/10">
              <div className="bg-white/5 p-2.5 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Investi</p>
                <p className="font-bold text-sm sm:text-base text-white">{formatFCFA(totalInvestedAmount)}</p>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Revenu / 24h</p>
                <p className="font-bold text-sm sm:text-base text-[#F40009]">+{formatFCFA(totalDailyEarn)}</p>
              </div>
              <div className="bg-white/5 p-2.5 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Encaissé</p>
                <p className="font-bold text-sm sm:text-base text-emerald-400">+{formatFCFA(totalAccumulatedEarned)}</p>
              </div>
            </div>
          </div>

          {/* Liste des investissements */}
          {investments.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1A1A] p-10 rounded-3xl text-center border border-gray-100 dark:border-[#333] shadow-sm">
              <div className="w-16 h-16 bg-gray-50 dark:bg-[#222] rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Package className="w-8 h-8" />
              </div>
              <h4 className="font-['Poppins'] font-bold text-lg text-gray-900 dark:text-white mb-1">
                Aucun investissement pour le moment
              </h4>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                Souscrivez à un pack dans le catalogue pour commencer à percevoir des revenus automatiques crédités toutes les 24h.
              </p>
              <button
                onClick={() => setMainTab('CATALOG')}
                className="bg-[#F40009] hover:bg-[#d60008] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer inline-flex items-center space-x-2"
              >
                <span>Découvrir le catalogue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((inv) => {
                const countdown = getTimeUntilNextCredit(inv.lastCreditDate);
                const isCompleted = inv.status === 'COMPLETED';
                const progressPercent = Math.min(100, Math.round((inv.daysElapsed / inv.duration) * 100));

                return (
                  <div 
                    key={inv.id} 
                    className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-sm border border-gray-100 dark:border-[#333] overflow-hidden transition-all hover:shadow-md"
                  >
                    <div className="p-4 sm:p-5 flex items-center space-x-4 border-b border-gray-50 dark:border-[#2A2A2A]">
                      <div className="w-14 h-14 bg-gray-50 dark:bg-[#222] rounded-2xl flex items-center justify-center flex-shrink-0 p-1.5 border border-gray-100 dark:border-[#333]">
                        <img 
                          src={inv.image || "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200&h=200"} 
                          alt="Produit" 
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">
                            {inv.productName}
                          </h4>
                          {inv.source === 'ADMIN_GIFT' && (
                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              Offre Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Souscrit le {new Date(inv.purchaseDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-600 dark:bg-[#2A2A2A] dark:text-gray-400' 
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      }`}>
                        {isCompleted ? 'Terminé' : 'En cours'}
                      </div>
                    </div>

                    {/* Compte à rebours du crédit automatique 24h */}
                    {!isCompleted && (
                      <div className="px-4 sm:px-5 py-2.5 bg-amber-50 dark:bg-[#221c13] border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                          <span>Prochain versement automatique :</span>
                          <span className="font-mono font-bold text-[#F40009]">{countdown.formatted}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/70 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300/50 dark:border-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Crédité auto</span>
                        </span>
                      </div>
                    )}

                    {/* Barre de progression */}
                    <div className="px-4 sm:px-5 pt-3 pb-1">
                      <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                        <span>Cycle d'amortissement</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">Jour {inv.daysElapsed} sur {inv.duration} ({progressPercent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-[#2A2A2A] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-full transition-all duration-500" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Métriques financières */}
                    <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 dark:bg-[#1f1f1f]">
                      <div className="bg-white dark:bg-[#252525] p-2.5 rounded-xl border border-gray-100 dark:border-[#333]">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Montant investi</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatFCFA(inv.price)}</p>
                      </div>
                      <div className="bg-white dark:bg-[#252525] p-2.5 rounded-xl border border-gray-100 dark:border-[#333]">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Gain Quotidien</p>
                        <p className="text-sm font-bold text-[#F40009]">+{formatFCFA(inv.daily)} / 24h</p>
                      </div>
                      <div className="bg-white dark:bg-[#252525] p-2.5 rounded-xl border border-gray-100 dark:border-[#333]">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Jours révolus</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{inv.daysElapsed}j / {inv.duration}j</p>
                      </div>
                      <div className="bg-white dark:bg-[#252525] p-2.5 rounded-xl border border-gray-100 dark:border-[#333]">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Total Encaissé</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+{formatFCFA(inv.totalEarned)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1 : SOLDE INSUFFISANT (EXIGENCE UTILISATEUR STRICTE)     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {insufficientModal.show && insufficientModal.product && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-red-100 dark:border-red-900/40 space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-[#F40009] rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
                  <AlertCircle className="w-9 h-9" />
                </div>
                <h3 className="font-['Poppins'] font-black text-xl text-gray-900 dark:text-white">
                  Solde insuffisant
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Votre solde actuel ne vous permet pas de souscrire à ce pack.
                </p>
              </div>

              {/* Détails chiffrés */}
              <div className="bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#333] rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Pack sélectionné :</span>
                  <span className="font-bold text-gray-900 dark:text-white">{insufficientModal.product.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Prix requis :</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatFCFA(insufficientModal.product.price)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-[#333]">
                  <span className="text-gray-500 dark:text-gray-400">Votre solde disponible :</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatFCFA(user?.balance || 0)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-[#333] bg-red-50 dark:bg-red-950/30 -mx-3.5 -mb-3.5 p-3 rounded-b-2xl">
                  <span className="text-red-800 dark:text-red-300 font-semibold">Montant manquant :</span>
                  <span className="font-extrabold text-[#F40009] text-sm">
                    {formatFCFA(insufficientModal.neededAmount || (insufficientModal.product.price - (user?.balance || 0)))}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setInsufficientModal({ show: false });
                    onTransaction?.('DEPOSIT');
                  }}
                  className="w-full bg-[#F40009] hover:bg-[#d60008] text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Recharger mon compte (Dépôt)</span>
                </button>

                <button
                  onClick={() => setInsufficientModal({ show: false })}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2A2A2A] dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL 2 : ACHAT EFFECTUÉ AVEC SUCCÈS (EXIGENCE STRICTE)        */}
      {/* ============================================================== */}
      <AnimatePresence>
        {purchaseModal.show && purchaseModal.product && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="font-['Poppins'] font-black text-xl text-gray-900 dark:text-white">
                  Achat effectué avec succès !
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Votre franchise est activée et commence à produire ses bénéfices dès aujourd'hui.
                </p>
                <p className="text-sm font-bold text-[#F40009] mt-1.5">
                  {purchaseModal.product.name}
                </p>
              </div>

              {/* Récapitulatif du rendement */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Revenus crédités automatiquement toutes les 24h</span>
                </div>
                <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  Votre gain quotidien de <strong className="text-emerald-900 dark:text-white font-extrabold">+{formatFCFA(purchaseModal.product.daily)}</strong> sera versé automatiquement sur votre solde après chaque cycle de 24 heures pendant {purchaseModal.product.duration} jours.
                </p>
              </div>

              {/* Referral Commission Status */}
              <div className="bg-gray-50 dark:bg-[#222] border border-gray-100 dark:border-[#333] rounded-2xl p-3 text-xs space-y-1">
                <div className="flex items-center space-x-1.5 font-bold text-gray-800 dark:text-gray-200">
                  <Sparkles className="w-3.5 h-3.5 text-[#F40009]" />
                  <span>Commissions de parrainage</span>
                </div>
                {purchaseModal.isFirst ? (
                  <p className="text-emerald-600 dark:text-emerald-400 leading-tight text-[11px]">
                    ✓ <strong>Premier investissement :</strong> Les commissions de parrainage ont été créditées à votre parrain conformément au barème.
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 leading-tight text-[11px]">
                    ℹ️ <strong>Investissement secondaire :</strong> Conformément aux règles, aucune commission n'est déduite sur les achats secondaires.
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setPurchaseModal({ show: false });
                    setMainTab('INVESTMENTS');
                  }}
                  className="w-full bg-[#F40009] hover:bg-[#d60008] text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Voir mes investissements</span>
                </button>

                <button
                  onClick={() => setPurchaseModal({ show: false })}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-[#2A2A2A] dark:hover:bg-[#333] text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-xs"
                >
                  Continuer mes achats
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
