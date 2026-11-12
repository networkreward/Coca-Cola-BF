import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Megaphone, Send, Clock } from 'lucide-react';
import { getStoredSettings, AppSettings } from '../services/appSettingsService';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());

  useEffect(() => {
    const handleUpdate = () => setSettings(getStoredSettings());
    window.addEventListener('app_settings_updated', handleUpdate);
    return () => window.removeEventListener('app_settings_updated', handleUpdate);
  }, []);

  if (!settings.welcomeModalActive) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 w-full max-w-sm relative shadow-2xl border border-gray-100 dark:border-[#333]"
          >
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-[#2A2A2A] p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mb-4 text-[#F40009] mx-auto">
              <Megaphone className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-['Poppins'] font-bold text-center text-gray-900 dark:text-white mb-2">
              {settings.welcomeModalTitle}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {settings.welcomeModalText}
            </p>
            
            <div className="space-y-2.5">
              {(settings.whatsappGroupLink || settings.supportWhatsappGroupLink) && (
                <a 
                  href={settings.whatsappGroupLink || settings.supportWhatsappGroupLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-xs sm:text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Rejoindre le Groupe WhatsApp</span>
                </a>
              )}
              {(settings.telegramChannelLink || settings.supportTelegramLink) && (
                <a 
                  href={settings.telegramChannelLink || settings.supportTelegramLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-xs sm:text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Rejoindre le Canal Telegram</span>
                </a>
              )}
              {settings.telegramGroupLink && (
                <a 
                  href={settings.telegramGroupLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-xs sm:text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Rejoindre le Groupe Telegram</span>
                </a>
              )}
              {(settings.customerServiceWhatsapp || settings.supportWhatsappNumber) && (
                <a 
                  href={
                    (settings.customerServiceWhatsapp || settings.supportWhatsappNumber).startsWith('http')
                      ? (settings.customerServiceWhatsapp || settings.supportWhatsappNumber)
                      : `https://wa.me/${(settings.customerServiceWhatsapp || settings.supportWhatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent("Bonjour Service Client Coca-Cola Invest, j'ai une question.")}`
                  }
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 font-bold py-2.5 rounded-xl transition-colors text-xs"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>Contacter le Service Client</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

