import { Prize, SpinResult, UserProfile, WinnerLog } from '../types';

// Mock Data
const MOCK_PRIZES: Prize[] = [
  { id: '1', name: 'Lux Weekend Getaway', color: '#1A1A1A', probability: 0.05, active: true, description: 'All-inclusive resort.', type: 'physical', value: 5000 },
  { id: '2', name: 'Dinner at Fasano', color: '#C5A059', probability: 0.15, active: true, description: 'Voucher R$ 800.', type: 'physical', value: 800 },
  { id: '3', name: 'Executive Coaching', color: '#FFFFFF', probability: 0.2, active: true, description: '1 Hour Session.', type: 'physical', value: 500 },
  { id: '4', name: 'Premium Coffee Kit', color: '#8D7032', probability: 0.3, active: true, type: 'physical', value: 150 },
  { id: '5', name: 'Points Multiplier', color: '#BDBDBD', probability: 0.3, active: true, description: '2x Points next week.', type: 'spins', value: 0 },
];

let MOCK_USER: UserProfile = {
  id: 'u-123',
  full_name: 'Alex Corporate',
  email: 'alex@lux.com',
  cpf: '123.456.789-00',
  phone: '11999999999',
  available_spins: 2,
  wallet_balance: 0,
  lux_coins: 100,
  xp: 500,
  is_admin: true,
  referral_code: 'LUX-ALEX'
};

// Initial History
let MOCK_WINNERS: WinnerLog[] = [
  { id: 'w-1', user_id: 'u-123', user_email: 'alex@lux.com', prize_name: 'Premium Coffee Kit', prize_type: 'physical', redeemed: false, status: 'pending', timestamp: '2023-10-25T10:00:00Z', redemption_code: 'COF-882' },
  { id: 'w-2', user_id: 'u-123', user_email: 'alex@lux.com', prize_name: 'Dinner at Fasano', prize_type: 'physical', redeemed: true, status: 'redeemed', timestamp: '2023-10-20T14:30:00Z', redemption_code: 'FAS-991' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email: string): Promise<UserProfile> => {
      await delay(800);
      return { ...MOCK_USER, email };
    },
    register: async (data: any): Promise<UserProfile> => {
      await delay(1200);
      return { ...MOCK_USER, ...data };
    },
    getCurrentUser: async (): Promise<UserProfile | null> => {
      return MOCK_USER;
    }
  },

  prizes: {
    list: async (): Promise<Prize[]> => {
      return MOCK_PRIZES;
    },
    update: async (prize: Prize): Promise<void> => {
      await delay(500);
      console.log('Prize updated:', prize);
    }
  },

  game: {
    spin: async (): Promise<SpinResult> => {
      await delay(1500); // Simulate network latency and server calc
      
      if (MOCK_USER.available_spins <= 0) {
        throw new Error("No spins available");
      }

      const rand = Math.random();
      let cumulative = 0;
      let selectedPrize = MOCK_PRIZES[0];

      for (const prize of MOCK_PRIZES) {
        cumulative += prize.probability;
        if (rand < cumulative) {
          selectedPrize = prize;
          break;
        }
      }

      MOCK_USER.available_spins -= 1;
      
      // Update balance if money prize
      if (selectedPrize.type === 'money') {
        MOCK_USER.wallet_balance += selectedPrize.value;
      } else if (selectedPrize.type === 'spins') {
        MOCK_USER.available_spins += selectedPrize.value;
      }
      
      const newWin: WinnerLog = {
          id: `w-${Date.now()}`,
          user_id: MOCK_USER.id,
          user_email: MOCK_USER.email,
          prize_name: selectedPrize.name,
          prize_type: selectedPrize.type,
          prize_value: selectedPrize.value,
          redeemed: false,
          status: 'pending',
          timestamp: new Date().toISOString(),
          redemption_code: `LUX-${Math.random().toString(36).substring(7).toUpperCase()}`
      };
      
      MOCK_WINNERS.unshift(newWin);

      return {
        prize: selectedPrize,
        redemption_code: newWin.redemption_code!,
        remaining_spins: MOCK_USER.available_spins,
        wallet_balance: MOCK_USER.wallet_balance
      };
    },
    
    getHistory: async (): Promise<WinnerLog[]> => {
      await delay(500);
      return [...MOCK_WINNERS];
    },

    requestRedemption: async (id: string): Promise<WinnerLog> => {
        await delay(1000);
        const win = MOCK_WINNERS.find(w => w.id === id);
        if (win) {
            win.status = 'requested';
            win.redeemed = false; // logic: requested means pending admin approval
        }
        return win!;
    }
  },

  admin: {
    getAuditLogs: async () => {
      await delay(600);
      return [
        { id: 1, action: 'USER_BAN', target: '192.168.1.1', timestamp: '2023-10-26T09:00:00Z' },
        { id: 2, action: 'PRIZE_UPDATE', target: 'Jackpot', timestamp: '2023-10-25T15:00:00Z' }
      ];
    }
  }
};