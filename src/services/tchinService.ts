import { Country, TchinMethod, TchinChargeResponse } from '../types';

/**
 * Service client pour l'intégration de l'API Tchin (Paiement direct)
 * Tous les appels sont relayés par le serveur (/api/tchin/*) pour sécuriser les clés privées.
 */

export async function fetchTchinMethods(country: Country): Promise<TchinMethod[]> {
  try {
    const res = await fetch(`/api/tchin/methods?country=${country}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.countries)) {
        const countryGroup = data.countries.find(
          (c: any) => c.country && c.country.toUpperCase() === country?.toUpperCase()
        );
        if (countryGroup && Array.isArray(countryGroup.methods)) {
          return countryGroup.methods.map((m: any) => ({
            code: m.code,
            name: m.name,
            country,
            type: 'mobile_money',
            available: m.available !== false,
            action_type: m.flow === 'otp' ? 'otp_required' : m.flow === 'redirect' ? 'redirect' : 'confirm_on_phone',
            badge: m.flow === 'otp' ? 'Code OTP requis' : m.flow === 'redirect' ? 'Redirection' : 'Validation sur téléphone',
          }));
        }
      }
      if (data && Array.isArray(data.methods)) {
        return data.methods;
      }
      if (data && Array.isArray(data.data)) {
        return data.data;
      }
    }
  } catch (e) {
    console.warn('Erreur récupération méthodes Tchin:', e);
  }

  // Fallback si serveur en cours d'initialisation
  if (country === 'BF') {
    return [
      {
        code: 'orange-money-bf',
        name: 'Orange Money Burkina',
        country: 'BF',
        type: 'mobile_money',
        available: true,
        action_type: 'otp_required',
        otp_instruction: 'Composez *144*4*6*montant# sur votre mobile pour générer votre code.',
        badge: 'Code *144*4*6*# requis',
      },
      {
        code: 'moov-bf',
        name: 'Moov Money Burkina',
        country: 'BF',
        type: 'mobile_money',
        available: true,
        action_type: 'confirm_on_phone',
        badge: 'Validation sur téléphone',
      },
      {
        code: 'coris-money-bf',
        name: 'Coris Money BF',
        country: 'BF',
        type: 'mobile_money',
        available: true,
        action_type: 'confirm_on_phone',
        badge: 'Validation sur téléphone',
      },
    ];
  }

  return [
    {
      code: 'wave-ci',
      name: 'Wave Côte d\'Ivoire',
      country: 'CI',
      type: 'mobile_money',
      available: true,
      action_type: 'redirect',
      badge: 'Instantané (Wave App)',
    },
    {
      code: 'orange-money-ci',
      name: 'Orange Money CI',
      country: 'CI',
      type: 'mobile_money',
      available: true,
      action_type: 'otp_required',
      otp_instruction: 'Composez #144*82# sur votre mobile pour obtenir votre code d\'autorisation.',
      badge: 'Code #144*82# requis',
    },
    {
      code: 'mtn-ci',
      name: 'MTN Mobile Money CI',
      country: 'CI',
      type: 'mobile_money',
      available: true,
      action_type: 'confirm_on_phone',
      badge: 'Validation sur téléphone',
    },
    {
      code: 'moov-ci',
      name: 'Moov Money CI',
      country: 'CI',
      type: 'mobile_money',
      available: true,
      action_type: 'confirm_on_phone',
      badge: 'Validation sur téléphone',
    },
  ];
}

export async function createTchinPaymentToken(
  amount: number,
  country: Country,
  customerName?: string,
  customerEmail?: string,
  returnUrl?: string,
  cancelUrl?: string
): Promise<{ success: boolean; token: string; payment_url?: string; env?: string }> {
  const res = await fetch('/api/tchin/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(Number(amount)),
      country,
      currency: 'XOF',
      customer_name: customerName,
      customer_email: customerEmail,
      description: `Recharge Coca-Cola Invest - ${amount} FCFA`,
      return_url: returnUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Impossible d\'initialiser la page de paiement Tchin');
  }

  return await res.json();
}

export async function chargeTchinPayment(params: {
  token: string;
  country: Country;
  operator: string;
  phone: string;
  otp?: string;
  customer_name?: string;
  customer_email?: string;
}): Promise<TchinChargeResponse> {
  const res = await fetch('/api/tchin/charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  return data;
}

export async function checkTchinStatus(token: string): Promise<{
  success: boolean;
  status: 'pending' | 'successful' | 'failed';
  token: string;
  amount?: number;
  message?: string;
}> {
  try {
    const res = await fetch(`/api/tchin/payments/${token}/status`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // continue to fallback
  }

  const fallbackRes = await fetch(`/api/tchin/payments/${token}`);
  if (!fallbackRes.ok) {
    throw new Error('Erreur de consultation du statut Tchin');
  }
  return await fallbackRes.json();
}

export async function simulateTchinSuccess(token: string): Promise<void> {
  await fetch('/api/tchin/simulate-success', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => {});
}

export async function claimTchinPayment(
  token: string, 
  userId?: string, 
  amount?: number
): Promise<{ success: boolean; error?: string; alreadyClaimed?: boolean; amount?: number }> {
  try {
    const res = await fetch(`/api/tchin/payments/${token}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors du verrouillage du paiement' };
  }
}

export async function updateServerTchinConfig(
  publicKey: string,
  privateKey: string,
  environment: 'sandbox' | 'live',
  password?: string
): Promise<any> {
  const res = await fetch('/api/tchin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey, privateKey, environment, password }),
  });
  return await res.json();
}

export interface PayoutRequest {
  amount: number;
  country: string;
  beneficiaryName: string;
  phone: string;
  method?: string;
  userId?: string;
}

export interface PayoutResponse {
  success: boolean;
  status?: 'SUCCESS' | 'PENDING' | 'FAILED';
  payoutId?: string;
  reference?: string;
  message?: string;
  error?: string;
}

/**
 * Exécute un décaissement / virement automatique vers le compte Mobile Money du client
 */
export async function executeTchinPayout(req: PayoutRequest): Promise<PayoutResponse> {
  try {
    const res = await fetch('/api/tchin/payout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Erreur de communication avec l'agrégateur de paiement.",
    };
  }
}
