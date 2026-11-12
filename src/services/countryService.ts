import { CountryConfig } from '../types';

export const DEFAULT_COUNTRIES: CountryConfig[] = [
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    dialCode: '+225',
    currency: 'FCFA (XOF)',
    placeholder: '0701020304',
    isActive: true, // Activé par défaut
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    dialCode: '+226',
    currency: 'FCFA (XOF)',
    placeholder: '70112233',
    isActive: true, // Activé par défaut
  },
  {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    dialCode: '+229',
    currency: 'FCFA (XOF)',
    placeholder: '97000000',
    isActive: false, // Désactivé par défaut, l'admin peut l'activer
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    dialCode: '+228',
    currency: 'FCFA (XOF)',
    placeholder: '90000000',
    isActive: false, // Désactivé par défaut, l'admin peut l'activer
  },
  {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    dialCode: '+221',
    currency: 'FCFA (XOF)',
    placeholder: '770000000',
    isActive: false, // Désactivé par défaut, l'admin peut l'activer
  },
  {
    code: 'NE',
    name: 'Niger',
    flag: '🇳🇪',
    dialCode: '+227',
    currency: 'FCFA (XOF)',
    placeholder: '90000000',
    isActive: false, // Désactivé par défaut, l'admin peut l'activer
  },
  {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    dialCode: '+237',
    currency: 'FCFA (XAF)',
    placeholder: '690000000',
    isActive: false, // Désactivé par défaut, l'admin peut l'activer
  },
  {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    dialCode: '+223',
    currency: 'FCFA (XOF)',
    placeholder: '70000000',
    isActive: false, // Désactivé par défaut, l'admin peut l'activer
  },
];

const STORAGE_KEY = 'coca_app_countries';

/**
 * Récupère tous les pays configurés dans l'application
 */
export function getStoredCountries(): CountryConfig[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saveCountries(DEFAULT_COUNTRIES);
      return DEFAULT_COUNTRIES;
    }
    const parsed: CountryConfig[] = JSON.parse(saved);
    
    // S'assurer que tous les pays par défaut existent dans la liste sauvegardée
    let hasChanges = false;
    const merged = [...parsed];

    DEFAULT_COUNTRIES.forEach((def) => {
      const existingIndex = merged.findIndex((c) => c.code.toUpperCase() === def.code.toUpperCase());
      if (existingIndex === -1) {
        merged.push({ ...def });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      saveCountries(merged);
    }
    return merged;
  } catch (e) {
    console.error('Erreur lecture pays:', e);
    return DEFAULT_COUNTRIES;
  }
}

/**
 * Sauvegarde la liste complète des pays et déclenche l'événement global
 */
export function saveCountries(countries: CountryConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(countries));
    window.dispatchEvent(new CustomEvent('app_countries_updated', { detail: countries }));
  } catch (e) {
    console.error('Erreur sauvegarde pays:', e);
  }
}

/**
 * Récupère uniquement les pays actuellement activés par l'administrateur
 */
export function getActiveCountries(): CountryConfig[] {
  const all = getStoredCountries();
  const active = all.filter((c) => c.isActive);
  // Si par erreur tous sont désactivés, on s'assure qu'au moins la Côte d'Ivoire est active
  if (active.length === 0) {
    const fallback = all.map((c) => (c.code === 'CI' ? { ...c, isActive: true } : c));
    saveCountries(fallback);
    return fallback.filter((c) => c.isActive);
  }
  return active;
}

/**
 * Active ou désactive un pays par son code
 */
export function toggleCountryActive(code: string, activeState?: boolean): CountryConfig[] {
  const all = getStoredCountries();
  const updated = all.map((c) => {
    if (c.code.toUpperCase() === code.toUpperCase()) {
      return {
        ...c,
        isActive: activeState !== undefined ? activeState : !c.isActive,
      };
    }
    return c;
  });
  saveCountries(updated);
  return updated;
}

/**
 * Ajoute un nouveau pays personnalisé
 */
export function addCountry(newCountry: CountryConfig): CountryConfig[] {
  const all = getStoredCountries();
  const existing = all.find((c) => c.code.toUpperCase() === newCountry.code.toUpperCase());
  if (existing) {
    return updateCountry(newCountry.code, newCountry);
  }
  const updated = [...all, newCountry];
  saveCountries(updated);
  return updated;
}

/**
 * Met à jour les informations d'un pays existant
 */
export function updateCountry(code: string, updates: Partial<CountryConfig>): CountryConfig[] {
  const all = getStoredCountries();
  const updated = all.map((c) => {
    if (c.code.toUpperCase() === code.toUpperCase()) {
      return { ...c, ...updates };
    }
    return c;
  });
  saveCountries(updated);
  return updated;
}

/**
 * Réinitialise la liste des pays à l'état par défaut
 */
export function resetCountriesToDefault(): CountryConfig[] {
  saveCountries(DEFAULT_COUNTRIES);
  return DEFAULT_COUNTRIES;
}

/**
 * Récupère les infos d'un pays précis (ou fallback CI)
 */
export function getCountryInfo(code: string | undefined): CountryConfig {
  if (!code) return DEFAULT_COUNTRIES[0];
  const all = getStoredCountries();
  const found = all.find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (found) return found;
  // Fallback
  return DEFAULT_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) || DEFAULT_COUNTRIES[0];
}

/**
 * Formate un numéro de téléphone avec l'indicatif du pays
 */
export function formatPhoneWithCountry(phone: string, countryCode: string): string {
  const clean = phone.trim();
  if (clean.startsWith('+')) return clean;
  const country = getCountryInfo(countryCode);
  return `${country.dialCode} ${clean}`;
}

/**
 * Valide le nom du bénéficiaire
 */
export function validateBeneficiaryName(name: string): { isValid: boolean; error?: string } {
  const clean = name.trim();
  if (!clean || clean.length < 2) {
    return { isValid: false, error: 'Le nom du bénéficiaire doit comporter au moins 2 caractères.' };
  }
  return { isValid: true };
}

/**
 * Valide et nettoie le numéro de téléphone selon le pays
 */
export function validatePhoneForCountry(phone: string, countryCode: string): { isValid: boolean; error?: string; cleanPhone: string } {
  let digits = phone.replace(/[\s\-\.\(\)]/g, '');
  const country = getCountryInfo(countryCode);
  const rawDial = country.dialCode.replace('+', '');

  if (digits.startsWith(`+${rawDial}`)) {
    digits = digits.slice(1 + rawDial.length);
  } else if (digits.startsWith(`00${rawDial}`)) {
    digits = digits.slice(2 + rawDial.length);
  } else if (digits.startsWith(rawDial) && digits.length > 9) {
    digits = digits.slice(rawDial.length);
  } else if (digits.startsWith('+')) {
    digits = digits.replace(/^\+\d{1,4}/, '');
  }

  digits = digits.replace(/\D/g, '');
  const code = countryCode.toUpperCase();

  if (code === 'CI') {
    // Si l'utilisateur saisit 8 chiffres, on normalise
    if (digits.length === 8) {
      digits = '07' + digits;
    }
    if (digits.length !== 10 && digits.length !== 8) {
      return { isValid: false, error: "Le numéro en Côte d'Ivoire doit comporter 8 ou 10 chiffres (ex: 07 01 02 03 04).", cleanPhone: digits };
    }
  } else if (code === 'BF') {
    if (digits.length !== 8) {
      return { isValid: false, error: 'Le numéro au Burkina Faso doit comporter 8 chiffres (ex: 70 11 22 33).', cleanPhone: digits };
    }
  } else if (code === 'BJ') {
    if (digits.length !== 8) {
      return { isValid: false, error: 'Le numéro au Bénin doit comporter 8 chiffres (ex: 97 00 00 00).', cleanPhone: digits };
    }
  } else if (code === 'TG') {
    if (digits.length !== 8) {
      return { isValid: false, error: 'Le numéro au Togo doit comporter 8 chiffres (ex: 90 00 00 00).', cleanPhone: digits };
    }
  } else if (code === 'SN') {
    if (digits.length !== 9 && digits.length !== 8) {
      return { isValid: false, error: 'Le numéro au Sénégal doit comporter 9 chiffres (ex: 77 123 45 67).', cleanPhone: digits };
    }
  } else if (code === 'NE') {
    if (digits.length !== 8) {
      return { isValid: false, error: 'Le numéro au Niger doit comporter 8 chiffres (ex: 90 12 34 56).', cleanPhone: digits };
    }
  } else if (code === 'CM') {
    if (digits.length !== 9) {
      return { isValid: false, error: 'Le numéro au Cameroun doit comporter 9 chiffres (ex: 690 12 34 56).', cleanPhone: digits };
    }
  } else if (code === 'ML') {
    if (digits.length !== 8) {
      return { isValid: false, error: 'Le numéro au Mali doit comporter 8 chiffres (ex: 70 12 34 56).', cleanPhone: digits };
    }
  } else {
    if (digits.length < 7 || digits.length > 12) {
      return { isValid: false, error: 'Format de numéro invalide pour ce pays.', cleanPhone: digits };
    }
  }

  return { isValid: true, cleanPhone: digits };
}
