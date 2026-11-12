import { useState, useEffect, FormEvent } from 'react';
import { User, Country, CountryConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, ArrowRight, Globe, Lock, User as UserIcon, Eye, EyeOff, 
  Share2, AlertCircle, CheckCircle2, KeyRound, Sparkles, ArrowLeft, Download, Smartphone,
  Headphones, MessageCircle, ExternalLink, Send
} from 'lucide-react';
import { authenticateUser, registerUser, resetPasswordByPhone } from '../services/userService';
import { getActiveCountries, getCountryInfo } from '../services/countryService';
import { getStoredSettings } from '../services/appSettingsService';
import { PWAInstallModal } from './PWAInstallModal';

interface LoginProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD';

export default function Login({ onLogin }: LoginProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');
  const [country, setCountry] = useState<Country>('CI');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [hasInviteParam, setHasInviteParam] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [activeCountries, setActiveCountries] = useState<CountryConfig[]>(() => getActiveCountries());

  const settings = getStoredSettings();
  const rawSupportPhone = settings.customerServiceWhatsapp || settings.supportWhatsappNumber || '22600000000';
  const cleanSupportPhone = rawSupportPhone.replace(/\D/g, '');
  const userPhoneMention = phone.trim() ? ` pour mon compte ${phone.trim()}` : '';
  const defaultForgotMsg = `Bonjour Service Client Coca-Cola Invest, j'ai oublié mon mot de passe de connexion${userPhoneMention}. Pouvez-vous m'aider à le réinitialiser s'il vous plaît ?`;
  const whatsappSupportUrl = `https://wa.me/${cleanSupportPhone}?text=${encodeURIComponent(defaultForgotMsg)}`;
  const telegramSupportRaw = settings.customerServiceTelegram || settings.supportTelegramLink;
  const telegramSupportUrl = telegramSupportRaw 
    ? (telegramSupportRaw.startsWith('http') ? telegramSupportRaw : `https://t.me/${telegramSupportRaw.replace('@', '')}`)
    : null;

  useEffect(() => {
    const handleCountriesUpdate = () => {
      const active = getActiveCountries();
      setActiveCountries(active);
      if (!active.some(c => c.code === country)) {
        if (active.length > 0) {
          setCountry(active[0].code as Country);
        }
      }
    };
    window.addEventListener('app_countries_updated', handleCountriesUpdate);
    return () => window.removeEventListener('app_countries_updated', handleCountriesUpdate);
  }, [country]);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const isRejoindre = searchParams.has('regoindre') || searchParams.has('rejoindre') || searchParams.has('join');
      const ref = searchParams.get('ref') || searchParams.get('code');

      // Also check if ?regoindre=COCA-1234 or ?rejoindre=COCA-1234
      const paramVal = searchParams.get('regoindre') || searchParams.get('rejoindre');
      const resolvedRef = ref || (paramVal && paramVal !== 'true' && paramVal !== '1' ? paramVal : '');

      if (isRejoindre || resolvedRef) {
        setAuthMode('REGISTER'); // Direct to register view if coming with custom link
        setHasInviteParam(true);
      }

      if (resolvedRef && typeof resolvedRef === 'string' && resolvedRef.trim().length > 0) {
        setReferralCode(resolvedRef.trim().toUpperCase());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    try {
      if (authMode === 'LOGIN') {
        const result = await authenticateUser(phone, country, password);
        if (result.error) {
          setFormError(result.error);
          setLoading(false);
          return;
        }
        if (result.user) {
          onLogin(result.user);
        }
      } else if (authMode === 'REGISTER') {
        if (!name.trim()) {
          setFormError("Le nom complet est obligatoire pour l'inscription.");
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setFormError("Le numéro de téléphone est obligatoire.");
          setLoading(false);
          return;
        }
        if (!password || password.trim().length < 4) {
          setFormError("Le mot de passe doit comporter au moins 4 caractères.");
          setLoading(false);
          return;
        }

        const res = await registerUser({
          name: name.trim(),
          phone: phone.trim(),
          country: country,
          password: password.trim(),
          referralCodeInput: referralCode.trim()
        });
        onLogin(res.user);
      } else if (authMode === 'FORGOT_PASSWORD') {
        if (!phone.trim()) {
          setFormError("Veuillez renseigner votre numéro de téléphone.");
          setLoading(false);
          return;
        }
        if (!newPassword || newPassword.trim().length < 4) {
          setFormError("Le nouveau mot de passe doit comporter au moins 4 caractères.");
          setLoading(false);
          return;
        }

        const res = resetPasswordByPhone(phone.trim(), newPassword.trim());
        if (!res.success || !res.user) {
          setFormError(res.error || "Impossible de réinitialiser le mot de passe pour ce numéro.");
          setLoading(false);
          return;
        }

        setFormSuccess("Mot de passe mis à jour avec succès ! Connexion en cours...");
        setTimeout(() => {
          onLogin(res.user!);
        }, 800);
      }
    } catch (error: any) {
      setFormError(error.message || "Une erreur est survenue lors de l'opération.");
    } finally {
      if (authMode !== 'FORGOT_PASSWORD' || formError) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F40009] text-white relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-black opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 flex flex-col items-center"
        >
          {/* Coca-Cola Invest Header */}
          <div className="mb-2 bg-white px-6 py-2.5 rounded-2xl shadow-xl rotate-[-2deg]">
            <h1 className="font-['Poppins'] text-2xl sm:text-3xl font-extrabold text-[#F40009] tracking-tighter italic">
              Coca-Cola Invest
            </h1>
          </div>
          <p className="text-red-100 font-medium text-xs sm:text-sm">
            Investissez dans nos franchises et percevez des revenus quotidiens
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl text-gray-900 border border-red-100"
        >
          {/* HEADER MODES */}
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center space-x-2">
              {authMode === 'FORGOT_PASSWORD' && (
                <button
                  type="button"
                  onClick={() => handleModeChange('LOGIN')}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer mr-0.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="font-['Poppins'] text-lg sm:text-xl font-bold text-gray-900">
                {authMode === 'LOGIN' && 'Connexion'}
                {authMode === 'REGISTER' && 'Inscription'}
                {authMode === 'FORGOT_PASSWORD' && 'Mot de passe oublié'}
              </h2>
            </div>

            {authMode !== 'FORGOT_PASSWORD' && (
              <button 
                type="button"
                onClick={() => handleModeChange(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                className="text-[#F40009] text-xs font-bold hover:underline cursor-pointer"
              >
                {authMode === 'LOGIN' ? "Créer un compte" : "Se connecter"}
              </button>
            )}
          </div>

          {/* INLINE ERROR BANNER */}
          <AnimatePresence>
            {formError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] leading-relaxed">
                  <p className="font-semibold">{formError}</p>
                  {formError.includes("Mot de passe incorrect") && authMode === 'LOGIN' && (
                    <button 
                      type="button" 
                      onClick={() => handleModeChange('FORGOT_PASSWORD')}
                      className="text-[#F40009] font-bold underline mt-1 block cursor-pointer"
                    >
                      Mot de passe oublié ? Contacter le Service Client
                    </button>
                  )}
                  {formError.includes("Un compte existe déjà") && (
                    <button 
                      type="button" 
                      onClick={() => handleModeChange('LOGIN')}
                      className="text-[#F40009] font-bold underline mt-1 block cursor-pointer"
                    >
                      Se connecter avec ce numéro
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {formSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[11px]">{formSuccess}</span>
              </motion.div>
            )}

            {hasInviteParam && authMode === 'REGISTER' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2.5 text-xs text-red-800"
              >
                <Sparkles className="w-4 h-4 text-[#F40009] shrink-0" />
                <div>
                  <span className="font-bold">Lien officiel : https://coca-cola_invest.app/?regoindre</span>
                  <p className="text-[11px] text-red-700/90 mt-0.5">Finalisez votre inscription pour activer vos franchises Coca-Cola et percevoir vos dividendes quotidiens.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* VUE FORGOT_PASSWORD : CONTACT DIRECT DU SERVICE CLIENT */}
          {authMode === 'FORGOT_PASSWORD' ? (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-[#F40009] shadow-inner">
                  <Headphones className="w-7 h-7" />
                </div>
                <h3 className="font-['Poppins'] font-bold text-base text-gray-900">
                  Assistance Service Client
                </h3>
                <div className="mt-2.5 p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-[#F40009] font-extrabold text-center leading-relaxed shadow-sm">
                  ⚠️ Ceux qui ont oublié leur Mot de passe de connexion doivent contacter le service client.
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Pour des raisons strictes de sécurité financière et de protection de votre capital, la réinitialisation de votre mot de passe de connexion s'effectue directement auprès du Service Client officiel.
                </p>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700 p-3 rounded-2xl text-[11px] text-gray-700 dark:text-neutral-300 space-y-1">
                <p className="font-bold text-gray-900 dark:text-white flex items-center space-x-1">
                  <span>🔒</span>
                  <span>Procédure de réinitialisation sécurisée :</span>
                </p>
                <p className="opacity-90 leading-relaxed">
                  Cliquez ci-dessous pour joindre notre assistance officielle sur WhatsApp ou Telegram. Indiquez votre numéro pour qu'un agent vérifie et débloque votre compte sans délai.
                </p>
              </div>

              {/* Numéro de téléphone pour pré-remplir le message */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Votre numéro de téléphone de compte
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-xs font-mono font-bold"
                    placeholder="Ex: 07 48 92 10"
                  />
                </div>
              </div>

              {/* Bouton Contact WhatsApp */}
              <a
                href={whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 cursor-pointer text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contacter le Service Client WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              {/* Bouton Telegram si configuré */}
              {telegramSupportUrl && (
                <a
                  href={telegramSupportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-md shadow-sky-500/25 cursor-pointer text-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Contacter le Support Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              )}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleModeChange('LOGIN')}
                  className="text-xs text-gray-500 hover:text-gray-900 font-bold hover:underline cursor-pointer"
                >
                  ← Retour à la connexion
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* FULL NAME (REGISTER ONLY) */}
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nom complet</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFormError('');
                    }}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-xs font-medium"
                    placeholder="Ex: Kouamé Patrick"
                    required
                  />
                </div>
              </div>
            )}

            {/* COUNTRY & PHONE */}
            <div className="grid grid-cols-[1.1fr_2fr] gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Globe className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <select 
                    value={country}
                    onChange={(e) => setCountry(e.target.value as Country)}
                    className="block w-full pl-7 pr-2 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none appearance-none bg-gray-50 focus:bg-white text-xs font-bold"
                  >
                    {activeCountries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro Mobile</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFormError('');
                    }}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-xs font-mono font-bold"
                    placeholder={getCountryInfo(country).placeholder || "0701020304"}
                    required
                  />
                </div>
              </div>
            </div>

            {/* PASSWORD (LOGIN & REGISTER) */}
            {authMode !== 'FORGOT_PASSWORD' && (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-700">Mot de passe</label>
                  {authMode === 'LOGIN' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('FORGOT_PASSWORD')}
                      className="text-[10px] text-[#F40009] font-bold hover:underline cursor-pointer"
                    >
                      Oublié ? (Service Client)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError('');
                    }}
                    className="block w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-xs"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* NEW PASSWORD (FORGOT_PASSWORD ONLY) */}
            {authMode === 'FORGOT_PASSWORD' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setFormError('');
                    }}
                    className="block w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white text-xs"
                    placeholder="Nouveau mot de passe (min 4 car.)"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* REFERRAL CODE (REGISTER ONLY) */}
            {authMode === 'REGISTER' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Code de parrainage <span className="text-gray-400 font-normal text-[10px]">(Optionnel)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Share2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input 
                    type="text" 
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white uppercase font-mono tracking-wider text-xs"
                    placeholder="COCA-XXXX"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#F40009] hover:bg-[#d60008] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2 mt-4 disabled:opacity-50 shadow-md shadow-red-500/25 cursor-pointer text-xs"
            >
              <span>
                {loading ? 'Traitement en cours...' : (
                  authMode === 'LOGIN' ? 'Se connecter' : 
                  authMode === 'REGISTER' ? "Créer mon compte" : 
                  'Enregistrer le mot de passe et se connecter'
                )}
              </span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        )}
        </motion.div>

        {/* Mobile App Download Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs py-2.5 px-4 rounded-xl backdrop-blur-sm border border-white/20 transition-all cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Télécharger l'application (Installer sur mobile)</span>
          </button>
        </div>
      </div>

      <PWAInstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
      />
    </div>
  );
}
