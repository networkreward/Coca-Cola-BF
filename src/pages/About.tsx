import { motion } from 'motion/react';
import { ArrowLeft, Info, CheckCircle2, ShieldCheck, Zap, HandCoins } from 'lucide-react';
import { ViewState } from '../types';

interface AboutProps {
  onChangeView: (view: ViewState) => void;
}

export default function About({ onChangeView }: AboutProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }}
      className="p-6 pb-24"
    >
      <button 
        onClick={() => onChangeView('ACCOUNT')}
        className="flex items-center text-gray-600 dark:text-gray-400 mb-6 font-bold text-sm hover:text-[#F40009] dark:hover:text-[#F40009] transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
      </button>

      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-red-100 rounded-xl text-[#F40009]">
          <Info className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-['Poppins'] text-2xl font-bold text-gray-900 dark:text-white">À Propos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Découvrez le projet Coca-Cola Invest</p>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Fonctionnement */}
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-[#F40009]" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Comment ça marche ?</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            Coca-Cola Invest est une plateforme innovante permettant à tous de devenir partenaire de la distribution de nos produits phares. 
            Vous achetez un "Pack VIP" (qui représente un lot de produits physiques) et vous recevez des bénéfices quotidiens sur les ventes générées par ces packs dans nos réseaux de distribution.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Rechargez votre compte via Mobile Money.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Achetez un pack VIP (ex: Pack Sprite, Pack Coca-Cola).</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Récoltez vos gains automatiquement chaque jour.</span>
            </li>
          </ul>
        </div>

        {/* Avantages */}
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
          <div className="flex items-center space-x-2 mb-4">
            <HandCoins className="h-5 w-5 text-orange-500" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Vos Avantages</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-500/20">
              <h3 className="font-bold text-orange-700 dark:text-orange-400 text-sm mb-1">Rentabilité</h3>
              <p className="text-xs text-orange-600/80 dark:text-orange-300/70">Générez jusqu'à 3x votre investissement de départ en quelques mois.</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <h3 className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-1">Flexibilité</h3>
              <p className="text-xs text-blue-600/80 dark:text-blue-300/70">Retirez vos gains via Mobile Money quand vous le souhaitez.</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20">
              <h3 className="font-bold text-purple-700 dark:text-purple-400 text-sm mb-1">Parrainage</h3>
              <p className="text-xs text-purple-600/80 dark:text-purple-300/70">Gagnez des bonus importants en invitant vos proches.</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-500/20">
              <h3 className="font-bold text-green-700 dark:text-green-400 text-sm mb-1">Missions</h3>
              <p className="text-xs text-green-600/80 dark:text-green-300/70">Accomplissez des défis simples pour encore plus de récompenses.</p>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#333]">
          <div className="flex items-center space-x-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-blue-500" />
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Conditions d'utilisation</h2>
          </div>
          <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <span className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">1</span>
              <span>Les retraits sont traités du Lundi au Vendredi, de 08h00 à 18h00. Les retraits du weekend seront traités le lundi suivant.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">2</span>
              <span>Frais de retrait : des frais standards de réseau Mobile Money (généralement 1% à 3%) s'appliquent selon l'opérateur.</span>
            </li>
            <li className="flex items-start">
              <span className="bg-gray-100 dark:bg-[#222] text-gray-500 dark:text-gray-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 mt-0.5">3</span>
              <span>L'investissement comporte des risques. N'investissez que ce que vous êtes prêt à engager. En achetant un pack, vous acceptez ces conditions.</span>
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
