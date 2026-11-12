import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  Power, 
  Edit3, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Phone, 
  Coins, 
  X,
  AlertCircle
} from 'lucide-react';
import { CountryConfig } from '../types';
import { 
  getStoredCountries, 
  toggleCountryActive, 
  addCountry, 
  updateCountry, 
  resetCountriesToDefault 
} from '../services/countryService';

interface AdminCountriesTabProps {
  onNotify?: (message: string) => void;
}

export const AdminCountriesTab: React.FC<AdminCountriesTabProps> = ({ onNotify }) => {
  const [countries, setCountries] = useState<CountryConfig[]>(() => getStoredCountries());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  
  // Modal: Add Country
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newFlag, setNewFlag] = useState('');
  const [newDial, setNewDial] = useState('');
  const [newCurrency, setNewCurrency] = useState('FCFA (XOF)');
  const [newPlaceholder, setNewPlaceholder] = useState('');
  const [newActive, setNewActive] = useState(true);

  // Modal: Edit Country
  const [editingCountry, setEditingCountry] = useState<CountryConfig | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setCountries(getStoredCountries());
    };
    window.addEventListener('app_countries_updated', handleUpdate);
    return () => window.removeEventListener('app_countries_updated', handleUpdate);
  }, []);

  const handleToggle = (code: string, currentActive: boolean) => {
    const updated = toggleCountryActive(code, !currentActive);
    setCountries(updated);
    const country = updated.find((c) => c.code === code);
    const msg = !currentActive
      ? `✅ ${country?.name || code} est maintenant ACTIF pour les utilisateurs !`
      : `⚠️ ${country?.name || code} est maintenant DÉSACTIVÉ.`;
    onNotify?.(msg);
  };

  const handleCreateCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !newDial.trim()) {
      alert("Veuillez renseigner le code pays, le nom et l'indicatif.");
      return;
    }

    const item: CountryConfig = {
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      flag: newFlag.trim() || '🌍',
      dialCode: newDial.trim().startsWith('+') ? newDial.trim() : `+${newDial.trim()}`,
      currency: newCurrency.trim() || 'FCFA (XOF)',
      placeholder: newPlaceholder.trim() || '00000000',
      isActive: newActive,
    };

    const updated = addCountry(item);
    setCountries(updated);
    setShowAddModal(false);
    setNewCode('');
    setNewName('');
    setNewFlag('');
    setNewDial('');
    setNewPlaceholder('');
    onNotify?.(`✅ Pays ${item.name} ajouté avec succès !`);
  };

  const handleUpdateCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;
    const updated = updateCountry(editingCountry.code, editingCountry);
    setCountries(updated);
    setEditingCountry(null);
    onNotify?.(`✅ Informations du pays ${editingCountry.name} mises à jour !`);
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Réinitialiser tous les pays par défaut ? (Côte d'Ivoire et Burkina Faso actifs, Bénin, Togo, Sénégal, Niger, Cameroun, Mali désactivés)"
      )
    ) {
      const reset = resetCountriesToDefault();
      setCountries(reset);
      onNotify?.("Pays réinitialisés à la configuration d'origine.");
    }
  };

  // Filtered countries
  const filteredCountries = countries.filter((c) => {
    if (filterStatus === 'ACTIVE' && !c.isActive) return false;
    if (filterStatus === 'INACTIVE' && c.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = countries.filter((c) => c.isActive).length;
  const inactiveCount = countries.filter((c) => !c.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-red-500 mb-1">
              <Globe className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Gestion Internationale</span>
            </div>
            <h2 className="text-xl font-extrabold text-white font-['Poppins']">
              Pays & Régions Autorisés
            </h2>
            <p className="text-neutral-400 text-xs mt-1 max-w-2xl">
              Activez ou désactivez les pays dans lesquels vos investisseurs peuvent s'inscrire, se connecter 
              et déposer/retirer des fonds. Les nouveaux pays (Bénin, Togo, Sénégal, Niger, Cameroun, Mali) 
              sont actuellement désactivés par défaut et peuvent être activés en 1 clic.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Pays</span>
            </button>
            <button
              onClick={handleReset}
              title="Réinitialiser par défaut"
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 p-2.5 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-400 uppercase font-semibold">Total Pays Référencés</p>
            <p className="text-2xl font-black text-white mt-0.5">{countries.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-emerald-900/40 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-emerald-400 uppercase font-semibold">Pays Actifs sur l'App</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-neutral-900 border border-amber-900/40 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] text-amber-400 uppercase font-semibold">Désactivés / Prêts à activer</p>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{inactiveCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Tous ({countries.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'ACTIVE'
                ? 'bg-emerald-950 border border-emerald-800/60 text-emerald-300'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Actifs ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus('INACTIVE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'INACTIVE'
                ? 'bg-amber-950 border border-amber-800/60 text-amber-300'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Désactivés ({inactiveCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher Bénin, Togo, Sénégal, +229..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Notice info */}
      <div className="bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl flex items-start space-x-3 text-xs text-neutral-300">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-white">Comment fonctionne l'ajout de pays ?</p>
          <p className="text-neutral-400 mt-0.5">
            Dès que vous cliquez sur le bouton <strong className="text-emerald-400">« Activer »</strong> d'un pays, 
            celui-ci apparaît immédiatement dans la liste déroulante d'inscription et de connexion pour tous les investisseurs. 
            Son indicatif téléphonique (+229, +228, +221, etc.) et sa devise sont pris en charge automatiquement.
          </p>
        </div>
      </div>

      {/* Countries Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCountries.map((c) => {
          return (
            <div
              key={c.code}
              className={`p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                c.isActive
                  ? 'bg-neutral-900/90 border-neutral-700/80 shadow-md hover:border-neutral-600'
                  : 'bg-neutral-950/70 border-neutral-900 opacity-80 hover:opacity-100 hover:border-neutral-800'
              }`}
            >
              {/* Top Row: Flag, Name, Status Badge */}
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl select-none" role="img" aria-label={c.name}>
                      {c.flag}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-['Poppins'] font-bold text-base text-white">{c.name}</h3>
                        <span className="text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded">
                          {c.code}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-neutral-400 mt-0.5">Indicatif : {c.dialCode}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      c.isActive
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                        : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                    }`}
                  >
                    {c.isActive ? 'Actif sur l\'app' : 'Désactivé'}
                  </span>
                </div>

                {/* Country details */}
                <div className="bg-neutral-950/80 rounded-2xl p-3 border border-neutral-800/80 space-y-1.5 text-xs text-neutral-300 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Devise :</span>
                    </span>
                    <span className="font-semibold text-white">{c.currency}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Exemple numéro :</span>
                    </span>
                    <span className="font-mono text-neutral-300 font-medium">
                      {c.dialCode} {c.placeholder || '00000000'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-2 border-t border-neutral-800/80">
                <button
                  onClick={() => handleToggle(c.code, c.isActive)}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                    c.isActive
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white shadow-emerald-600/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{c.isActive ? 'Désactiver' : 'Activer ce pays'}</span>
                </button>

                <button
                  onClick={() => setEditingCountry({ ...c })}
                  className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
                  title="Modifier les réglages du pays"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Country */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
              <div className="flex items-center space-x-2 text-red-500">
                <Globe className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white font-['Poppins']">Ajouter un Nouveau Pays</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCountry} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Code ISO (2 lettres)</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="Ex: GA, GN, CD"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white uppercase font-mono font-bold outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Drapeau Emoji</label>
                  <input
                    type="text"
                    value={newFlag}
                    onChange={(e) => setNewFlag(e.target.value)}
                    placeholder="Ex: 🇬🇦 ou 🌍"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500 text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nom du pays</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Gabon, Guinée Conakry..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Indicatif téléphonique</label>
                  <input
                    type="text"
                    value={newDial}
                    onChange={(e) => setNewDial(e.target.value)}
                    placeholder="Ex: +241 ou +224"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Devise locale</label>
                  <input
                    type="text"
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    placeholder="Ex: FCFA (XAF)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Exemple de numéro (placeholder)</label>
                <input
                  type="text"
                  value={newPlaceholder}
                  onChange={(e) => setNewPlaceholder(e.target.value)}
                  placeholder="Ex: 07000000"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="newActiveCheck"
                  checked={newActive}
                  onChange={(e) => setNewActive(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-950 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="newActiveCheck" className="text-neutral-300 font-semibold cursor-pointer">
                  Activer immédiatement sur l'application
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-red-600/30"
                >
                  Créer le pays
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Country */}
      {editingCountry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
              <div className="flex items-center space-x-2 text-red-500">
                <Edit3 className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white font-['Poppins']">
                  Modifier : {editingCountry.name} ({editingCountry.code})
                </h3>
              </div>
              <button
                onClick={() => setEditingCountry(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCountry} className="space-y-3">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Nom du pays</label>
                <input
                  type="text"
                  value={editingCountry.name}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Drapeau Emoji</label>
                  <input
                    type="text"
                    value={editingCountry.flag}
                    onChange={(e) => setEditingCountry({ ...editingCountry, flag: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white text-center text-lg outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Indicatif</label>
                  <input
                    type="text"
                    value={editingCountry.dialCode}
                    onChange={(e) => setEditingCountry({ ...editingCountry, dialCode: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Devise</label>
                  <input
                    type="text"
                    value={editingCountry.currency}
                    onChange={(e) => setEditingCountry({ ...editingCountry, currency: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Exemple de numéro</label>
                  <input
                    type="text"
                    value={editingCountry.placeholder}
                    onChange={(e) => setEditingCountry({ ...editingCountry, placeholder: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="editActiveCheck"
                  checked={editingCountry.isActive}
                  onChange={(e) => setEditingCountry({ ...editingCountry, isActive: e.target.checked })}
                  className="rounded border-neutral-700 bg-neutral-950 text-red-600 focus:ring-red-500 h-4 w-4"
                />
                <label htmlFor="editActiveCheck" className="text-neutral-300 font-semibold cursor-pointer">
                  Pays actif pour les utilisateurs
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingCountry(null)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold cursor-pointer shadow-lg shadow-red-600/30"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
