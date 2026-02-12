
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  phone: string;
  available_spins: number; // Mapped from spins_remaining in DB
  wallet_balance: number; // Mantido para legado, mas visualmente usaremos lux_coins
  lux_coins: number; // Nova moeda
  xp: number; // Para nível VIP
  is_admin: boolean;
  referral_code: string; // Legacy frontend name, mapped from invite_code
  created_at?: string;
  // New fields
  avatar_url?: string;
  avatar_id?: string; // Novo campo para seleção de avatar da biblioteca
  invite_code?: string;
  invite_count?: number;
  invite_earnings?: number; // Agora representa Giros ganhos por convite
  roulette_timer?: string;
  spins_remaining?: number;
  // Login Tracking
  login_count?: number;
  last_login?: string;
  // Admin fields
  ip_address?: string;
  is_banned?: boolean;
}

export interface Prize {
  id: string;
  name: string;
  color: string;
  probability: number;
  active: boolean;
  description?: string;
  type: 'physical' | 'money' | 'spins';
  value: number; 
  image_url?: string;
}

export interface SpinResult {
  prize: Prize;
  redemption_code: string;
  remaining_spins: number;
  wallet_balance: number;
  lux_coins?: number; // Opcional no retorno
}

export interface WinnerLog {
  id: string;
  user_id: string;
  user_email?: string;
  prize_name: string;
  prize_type: 'physical' | 'money' | 'spins';
  prize_value?: number;
  redeemed: boolean;
  timestamp: string;
  status: 'pending' | 'requested' | 'redeemed' | 'paid';
  redemption_code?: string;
}

// Interface estendida para o Admin ver detalhes do usuário na solicitação
export interface AdminRedemptionRequest extends WinnerLog {
  user_details: {
    full_name: string;
    cpf: string;
    phone: string;
    ip_address?: string;
  };
}

export type Language = 'pt' | 'en' | 'zh';

export interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

export enum PageRoute {
  HOME = '/',
  LOGIN = '/login',
  REGISTER = '/register',
  DASHBOARD = '/dashboard',
  MY_PRIZES = '/my-prizes',
  CHALLENGES = '/challenges', // Mantido nome da rota, mas visualmente é Ranking
  VAULT = '/vault',
  ADMIN = '/admin',
  LEGAL_PRIVACY = '/legal/privacy',
  LEGAL_TERMS = '/legal/terms',
  LEGAL_DATA = '/legal/data'
}

// Interfaces legadas mantidas para compatibilidade se necessário, ou removidas se não usadas
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'permanent';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reward_type: 'spins' | 'money' | 'both';
  reward_spins: number;
  reward_money: number;
  reward_xp: number;
  verification_type: string;
  icon: string;
  progress?: number;
  status?: string;
  active: boolean;
  goal?: number;
  current_value?: number;
}

export interface DetailedReferral {
  id: string;
  created_at: string;
  reward_paid: boolean;
  referred: {
    full_name: string | null;
    created_at: string | null;
    // Assumimos que a confirmação é refletida pelo pagamento da recompensa
  } | null;
}

export interface SystemThemeConfig {
  id?: string;
  active: boolean;
  name: string;
  maintenance_mode?: boolean;
  custom_css?: string;
  custom_html_head?: string;
}

// NOVA INTERFACE PARA RANKING
export interface RankingEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_seed?: string;
  invites: number;
  is_current_user: boolean;
  trend?: 'up' | 'down' | 'same';
  prize_tier?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // MUI icon name
}
