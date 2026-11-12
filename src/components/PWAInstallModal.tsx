import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Apple, 
  Share2, 
  PlusSquare, 
  MoreVertical, 
  CheckCircle2, 
  X, 
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'direct'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    try {
      setInstalling(true);
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Erreur lors du prompt d\'installation:', err);
    } finally {
      setInstalling(false);
    }
  };

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 dark:border-[#333] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F40009] to-[#b30006] p-5 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-13 h-13 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center">
              <img 
                src="/icon.svg" 
                alt="Coca-Cola Logo" 
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  // Fallback
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-['Poppins'] font-extrabold text-lg text-white">Installer l'application</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">PWA Officielle</span>
              </div>
              <p className="text-white/80 text-xs mt-0.5">Coca-Cola Invest Mobile • Gratuit & Sécurisé</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-gray-800 dark:text-gray-200">
          
          {/* App Status Banner */}
          {isInstalled || installSuccess ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-300">Application installée !</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  L'icône Coca-Cola Invest est disponible sur votre écran d'accueil.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Native 1-Click Install Button if supported by browser */}
              {isInstallable ? (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2 text-[#F40009]">
                    <Zap className="w-5 h-5 fill-[#F40009]" />
                    <span className="text-xs font-bold uppercase tracking-wide">Installation instantanée prête</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Votre navigateur prend en charge l'installation directe en 1 clic.
                  </p>
                  <button
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="w-full py-3.5 px-4 bg-[#F40009] hover:bg-[#d60008] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-red-500/30 flex items-center justify-center space-x-2 transition-all cursor-pointer text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installation en cours...' : 'Installer sur mon téléphone'}</span>
                  </button>
                </div>
              ) : null}

              {/* Warning if running in preview iframe */}
              {isIframe && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl space-y-2">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                    💡 Vous visualisez l'application dans un cadre intégré. Pour l'installer directement sur votre écran, ouvrez-la dans votre navigateur habituel :
                  </p>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#F40009] hover:underline"
                  >
                    <span>Ouvrir en plein écran dans Safari / Chrome</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Advantages of PWA */}
              <div className="grid grid-cols-3 gap-2 py-1">
                <div className="bg-gray-50 dark:bg-[#222] p-2.5 rounded-xl text-center border border-gray-100 dark:border-[#333]">
                  <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <span className="block text-[11px] font-bold text-gray-800 dark:text-gray-200">Ultra Rapide</span>
                  <span className="block text-[9px] text-gray-500 dark:text-gray-400">0 Mo de stockage</span>
                </div>
                <div className="bg-gray-50 dark:bg-[#222] p-2.5 rounded-xl text-center border border-gray-100 dark:border-[#333]">
                  <ShieldCheck className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                  <span className="block text-[11px] font-bold text-gray-800 dark:text-gray-200">100% Sécurisé</span>
                  <span className="block text-[9px] text-gray-500 dark:text-gray-400">Sans virus ni pub</span>
                </div>
                <div className="bg-gray-50 dark:bg-[#222] p-2.5 rounded-xl text-center border border-gray-100 dark:border-[#333]">
                  <Smartphone className="w-4 h-4 mx-auto text-blue-500 mb-1" />
                  <span className="block text-[11px] font-bold text-gray-800 dark:text-gray-200">Plein écran</span>
                  <span className="block text-[9px] text-gray-500 dark:text-gray-400">Comme une app native</span>
                </div>
              </div>

              {/* OS Tabs */}
              <div>
                <div className="flex border-b border-gray-200 dark:border-[#333] mb-3">
                  <button
                    onClick={() => setActiveTab('android')}
                    className={`flex-1 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'android'
                        ? 'border-[#F40009] text-[#F40009]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android / Chrome</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ios')}
                    className={`flex-1 py-2 text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === 'ios'
                        ? 'border-[#F40009] text-[#F40009]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Apple className="w-3.5 h-3.5" />
                    <span>iPhone / Safari</span>
                  </button>
                </div>

                {/* Tab: Android Instructions */}
                {activeTab === 'android' && (
                  <div className="space-y-3 bg-gray-50 dark:bg-[#222] p-4 rounded-2xl border border-gray-100 dark:border-[#333]">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#F40009] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">Ouvrez le menu du navigateur</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          Appuyez sur les 3 points <MoreVertical className="w-3.5 h-3.5 inline text-gray-700 dark:text-gray-300" /> en haut à droite de Google Chrome.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#F40009] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">Sélectionnez l'option d'installation</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                          Touchez <strong className="text-gray-800 dark:text-gray-200">« Installer l'application »</strong> ou <strong className="text-gray-800 dark:text-gray-200">« Ajouter à l'écran d'accueil »</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#F40009] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">Confirmez</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                          L'icône Coca-Cola Invest apparaît immédiatement sur votre écran d'accueil avec vos autres applications !
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: iOS Instructions */}
                {activeTab === 'ios' && (
                  <div className="space-y-3 bg-gray-50 dark:bg-[#222] p-4 rounded-2xl border border-gray-100 dark:border-[#333]">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#F40009] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        1
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">Touchez le bouton Partager</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          En bas de Safari, appuyez sur l'icône de partage <Share2 className="w-3.5 h-3.5 inline text-blue-500" /> (un carré avec une flèche vers le haut).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#F40009] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        2
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">Défilez vers le bas</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          Sélectionnez <PlusSquare className="w-3.5 h-3.5 inline text-gray-700 dark:text-gray-300" /> <strong className="text-gray-800 dark:text-gray-200">« Sur l'écran d'accueil »</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#F40009] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        3
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-gray-900 dark:text-white">Appuyez sur « Ajouter »</p>
                        <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                          En haut à droite. L'application Coca-Cola Invest est maintenant installée comme une vraie application iPhone !
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#151515] border-t border-gray-100 dark:border-[#333] flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Application certifiée PWA</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-[#333] hover:bg-gray-300 dark:hover:bg-[#444] text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
