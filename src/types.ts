export type ViewState = 'LOGIN' | 'HOME' | 'PRODUCTS' | 'TEAM' | 'ACCOUNT' | 'MISSIONS' | 'ABOUT' | 'ADMIN';
export type Country = 'CI' | 'BF' | 'BJ' | 'TG' | 'SN' | 'NE' | 'CM' | 'ML' | string;

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  currency: string;
  placeholder: string;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  country: Country;
  balance: number;
  role: 'USER' | 'ADMIN';
  referralCode: string;
  referredBy?: string;
  hasPurchasedFirstProduct?: boolean;
  firstInvestmentDate?: string;
  isBlocked?: boolean;
  password?: string;
  createdAt?: string;
  totalDeposits?: number;
  totalWithdrawals?: number;
}

export interface UserInvestment {
  id: string;
  userId: string;
  productId: number;
  productName: string;
  category?: string;
  price: number;
  daily: number;
  duration: number;
  daysElapsed: number;
  totalEarned: number;
  purchaseDate: string;
  lastCreditDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  image?: string;
  source: 'USER_PURCHASE' | 'ADMIN_GIFT';
  referralCommissionPaid?: boolean;
}

export interface ReferralCommissionLog {
  id: string;
  sponsorId: string;
  sponsorName: string;
  downlineId: string;
  downlineName: string;
  level: 1 | 2 | 3;
  percentage: number;
  amount: number;
  productId: number;
  productName: string;
  productPrice: number;
  date: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
  country?: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'VIP';
  amount: number;
  method: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REJECTED' | 'CANCELLED';
  date: string;
  reference?: string;
  note?: string;
}

export interface ProductItem {
  id: number;
  packNumber?: number;
  name: string;
  subtitle?: string;
  category: 'BOTTLES' | 'VENDING' | 'STOCKS';
  categoryLabel: string;
  description: string;
  price: number;
  daily: number;
  duration: number;
  tag: string;
  image: string;
  allocation: number;
  isVip?: boolean;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface MissionItem {
  id: number;
  type: 'referral' | 'vip' | 'daily';
  title: string;
  target?: number;
  targetName?: string;
  productId?: number;
  reward: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  country: 'CI' | 'BF' | 'ALL';
  category: 'MOBILE_MONEY' | 'BANK' | 'CRYPTO';
  accountNumber?: string;
  accountName?: string;
  instructions?: string;
  isActive: boolean;
  allowsDeposit: boolean;
  allowsWithdrawal: boolean;
  createdAt: string;
}

export type TchinAction = 'confirm_on_phone' | 'redirect' | 'otp_required';

export interface TchinMethod {
  code: string;
  name: string;
  country: string;
  type?: string;
  available?: boolean;
  action_type?: TchinAction;
  otp_instruction?: string;
  badge?: string;
}

export interface TchinChargeResponse {
  success: boolean;
  token: string;
  status: 'pending' | 'successful' | 'failed';
  action?: TchinAction;
  message?: string;
  redirect_url?: string;
}

