import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If already installed as a standalone app or explicitly dismissed, don't show
  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-red-600 to-[#F40009] text-white px-4 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 mb-4 animate-fade-in border border-red-400/30">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-['Poppins'] font-bold text-xs leading-tight">Installer l'application</span>
              <span className="text-[9px] bg-white text-[#F40009] px-1.5 py-0.2 rounded font-extrabold uppercase">App</span>
            </div>
            <p className="text-[11px] text-white/85 truncate">
              Ajoutez Coca-Cola Invest sur votre écran d'accueil
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-white text-[#F40009] hover:bg-white/90 active:scale-95 text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Installer</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-white/70 hover:text-white cursor-pointer"
            aria-label="Fermer la bannière"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
