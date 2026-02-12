
import { createClient } from '@supabase/supabase-js';
// FIX: Removed 'Referral' from import as it does not exist in types.ts and was unused.
import { Prize, SpinResult, UserProfile, WinnerLog, Challenge, AdminRedemptionRequest, SystemThemeConfig, RankingEntry } from '../types';

const SUPABASE_URL = 'https://isrkqhpbfppifhfkrzbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzcmtxaHBiZnBwaWZoZmtyemJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODQ4NDAsImV4cCI6MjA4MjQ2MDg0MH0.F6BIoSMdNFtOjvDGstEImN_v0DYHkolcAWOo1idyaLM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': SUPABASE_ANON_KEY
    }
  }
});

const validateCPFStructure = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0, remainder;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i-1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/\D/g, '');
    return /^\d{11}$/.test(clean);
};

const getPublicIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return '0.0.0.0'; 
    }
};

const distributeRewards = async (userId: string, challenge: Challenge | any) => {
    const rSpins = Number(challenge.reward_spins || 0);
    const rMoney = Number(challenge.reward_money || 0);
    const rXp = Number(challenge.reward_xp || 0);
    
    const { error } = await supabase.rpc('distribute_challenge_reward', {
        target_user_id: userId,
        r_spins: rSpins,
        r_money: rMoney,
        r_xp: rXp
    });

    if (error) {
        console.error("Erro ao distribuir recompensas via RPC:", error);
        throw error;
    }
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<UserProfile> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
          if (error.message.includes('Email not confirmed')) {
              throw new Error("Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.");
          }
          if (error.message.includes('Invalid login credentials')) {
              throw new Error("E-mail ou senha incorretos.");
          }
          throw new Error(error.message);
      }
      
      if (!data.user) throw new Error("Usuário não encontrado.");
      
      return api.auth.getCurrentUser();
    },
    
    register: async (userData: any): Promise<UserProfile> => {
        if (userData.honeypot && userData.honeypot.length > 0) {
            await new Promise(r => setTimeout(r, 1500));
            throw new Error("SPAM_DETECTED"); 
        }

        const cleanCpf = userData.cpf ? userData.cpf.replace(/\D/g, '') : '';
        const cleanPhone = userData.phone ? userData.phone.replace(/\D/g, '') : '';
        const cleanInvite = userData.inviteCode && userData.inviteCode.trim() !== '' 
          ? userData.inviteCode.trim().toUpperCase()
          : null;

        if (!validateCPFStructure(cleanCpf)) {
            throw new Error("O CPF informado é inválido.");
        }
        if (!validatePhone(cleanPhone)) {
            throw new Error("O telefone deve ter 11 dígitos (DDD + 9 dígitos).");
        }
        
        const ip = await getPublicIP();
        if (ip === '0.0.0.0') {
            throw new Error('IP_MISSING');
        }

        // 1. Pre-validation with RPC
        const { data: validation, error: validationError } = await supabase.rpc('check_registration_data', {
            p_email: userData.email,
            p_cpf: cleanCpf,
            p_phone: cleanPhone,
            p_ip: ip
        });

        if (validationError) {
            console.error("Erro ao verificar dados:", validationError);
            throw new Error("err_check_data");
        }

        if (!validation.available) {
            throw new Error(validation.reason || "err_duplicate_data");
        }

        // 2. Use standard Supabase Auth signUp
        const { data, error } = await supabase.auth.signUp({
            email: userData.email,
            password: userData.password,
            options: {
                data: {
                    full_name: userData.full_name,
                    cpf: cleanCpf,
                    phone: cleanPhone,
                    invite_code_used: cleanInvite,
                    device_id: userData.deviceId,
                    ip_address: ip
                }
            }
        });

        if (error) {
            console.error('Sign Up Error:', error);
            if (error.message.includes('User already registered')) {
                throw new Error("err_email_exists");
            }
            throw new Error(error.message);
        }

        if (data.user && !data.session) {
            throw new Error("CONFIRM_EMAIL");
        }

        if (data.session) {
            await new Promise(r => setTimeout(r, 1000));
            return api.auth.getCurrentUser();
        }

        throw new Error("err_signup_failed");
    },

    getCurrentUser: async (): Promise<UserProfile> => {
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       if (userError || !user) throw new Error("Sem sessão ativa.");
       
       try { await supabase.rpc('ensure_profile'); } catch (e) { /* O erro é esperado se o e-mail não estiver confirmado, não quebra o fluxo */ }
       try { await supabase.rpc('process_daily_login'); } catch (_) {}

       let { data: profile } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', user.id)
         .maybeSingle(); 
       
       if (!profile) {
           await new Promise(r => setTimeout(r, 1500));
           const retry = await supabase
             .from('profiles')
             .select('*')
             .eq('id', user.id)
             .maybeSingle();
           profile = retry.data;
       }

       if (!profile) {
           throw new Error("Perfil não encontrado.");
       }
       
       return {
         ...profile,
         id: user.id,
         email: user.email!,
         is_admin: profile.role === 'admin',
         available_spins: (profile.spins_remaining !== undefined && profile.spins_remaining !== null) ? profile.spins_remaining : 0,
         lux_coins: profile.wallet_balance || 0, 
         wallet_balance: profile.wallet_balance || 0,
         xp: profile.xp || 0,
         referral_code: profile.invite_code || '',
         ip_address: profile.last_ip || '127.0.0.1',
         is_banned: profile.banned || false,
         invite_count: profile.invite_count || 0,
         invite_earnings: profile.invite_earnings || 0,
         login_count: profile.login_count || 0,
         last_login: profile.last_login,
         created_at: profile.created_at,
         avatar_id: profile.avatar_id
       };
    },
    
    updateProfile: async (userId: string, updates: { full_name?: string, phone?: string, cpf?: string, avatar_id?: string }): Promise<void> => {
        if (updates.cpf && !validateCPFStructure(updates.cpf)) throw new Error("CPF inválido");
        if (updates.phone && !validatePhone(updates.phone)) throw new Error("Telefone inválido");

        const payload: any = {};
        if (updates.full_name) payload.full_name = updates.full_name;
        if (updates.phone) payload.phone = updates.phone;
        if (updates.cpf) payload.cpf = updates.cpf;
        if (updates.avatar_id) payload.avatar_id = updates.avatar_id;

        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userId);
            
        if (error) {
            if (error.message.includes('unique')) throw new Error("CPF ou Telefone já em uso.");
            throw error;
        }
    },
    
    processDailyLogin: async (): Promise<{ new_day: boolean, login_count: number }> => {
        const { data, error } = await supabase.rpc('process_daily_login');
        if (error) {
            return { new_day: false, login_count: 0 };
        }
        return data;
    },

    logout: async () => { await supabase.auth.signOut(); }
  },

  prizes: {
    list: async (): Promise<Prize[]> => {
      const { data, error } = await supabase.from('prizes').select('*').order('probability', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    update: async (prize: Prize): Promise<void> => {
        const { error } = await supabase.from('prizes').update({ 
            name: prize.name, probability: prize.probability, active: prize.active,
            color: prize.color, value: prize.value, type: prize.type, 
            image_url: prize.image_url, description: prize.description
        }).eq('id', prize.id);
        if (error) throw error;
        await api.admin.logAction('UPDATE_PRIZE', prize.name, { probability: prize.probability, active: prize.active });
    },
    create: async (prize: Omit<Prize, 'id'>): Promise<void> => {
        const { error } = await supabase.from('prizes').insert(prize);
        if (error) throw error;
        await api.admin.logAction('CREATE_PRIZE', prize.name, prize);
    },
    delete: async (id: string): Promise<void> => {
        const { error } = await supabase.from('prizes').delete().eq('id', id);
        if (error) throw error;
        await api.admin.logAction('DELETE_PRIZE', id, {});
    }
  },

  game: {
    spin: async (userId: string): Promise<SpinResult> => {
      const { data, error } = await supabase.rpc('spin_roulette');
      
      if (error) {
          console.error("DB Error in Spin:", error);
          if (error.message.includes('Saldo de giros insuficiente')) {
              throw new Error("Sem giros disponíveis.");
          }
          throw new Error(`Erro ao processar giro: ${error.message || "Tente novamente."}`);
      }
      
      const realBalance = data.wallet_balance !== undefined ? data.wallet_balance : 0;

      return {
          prize: data.prize, 
          redemption_code: data.redemption_code,
          remaining_spins: data.remaining_spins, 
          wallet_balance: realBalance,
          lux_coins: realBalance 
      };
    },
    checkDaily: async (): Promise<boolean> => {
        const { data, error } = await supabase.rpc('check_and_add_timer_spin');
        if (error) return false;
        return data?.spin_added || false;
    },
    getHistory: async (userId?: string): Promise<WinnerLog[]> => {
      let query = supabase.from('spin_history').select('*').order('created_at', { ascending: false });
      if (userId) {
          query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data.map((item: any) => ({ ...item, timestamp: item.created_at }));
    },
    requestRedemption: async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data: existing, error: fetchError } = await supabase
            .from('spin_history').select('*').eq('id', id).single();

        if (fetchError || !existing) throw new Error("Prêmio não encontrado.");
        if (existing.user_id !== user.id) throw new Error("Este prêmio não pertence a esta conta.");

        if (['requested', 'redeemed', 'paid'].includes(existing.status)) {
            return { ...existing, timestamp: existing.created_at };
        }

        const { data, error } = await supabase
            .from('spin_history')
            .update({ status: 'requested' })
            .eq('id', id)
            .eq('user_id', user.id)
            .select(); 
            
        if (error) throw new Error(`Erro técnico ao solicitar: ${error.message}`);
        if (!data || data.length === 0) throw new Error("Permissão negada.");

        return { ...data[0], timestamp: data[0].created_at };
    },
    
    purchaseStoreItem: async (item: { name: string, cost: number, type: 'physical' | 'spins' | 'money', id: string, moneyValue?: number }) => {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error("Sessão inválida.");

        const isSpinPurchase = item.type === 'spins';
        const { data: rpcResult, error: rpcError } = await supabase.rpc('process_store_purchase', {
            cost: item.cost,
            is_spin_purchase: isSpinPurchase
        });

        if (rpcError) {
            throw new Error("Erro ao processar compra no servidor.");
        }

        if (!rpcResult || rpcResult.success === false) {
            throw new Error(rpcResult?.message || "Saldo insuficiente ou erro na transação.");
        }

        if (!isSpinPurchase) {
            await supabase.from('spin_history').insert({
                user_id: user.user.id,
                prize_name: item.name,
                prize_type: item.type,
                prize_value: item.moneyValue || 0, 
                status: 'pending',
                redemption_code: `STORE-${Math.random().toString(36).substring(7).toUpperCase()}`,
                created_at: new Date().toISOString()
            });
        }
        
        return true;
    },

    exchangeCoinsForSpins: async (): Promise<boolean> => {
        return api.game.purchaseStoreItem({ name: 'Giro Extra', cost: 100, type: 'spins', id: 'spin-1' });
    }
  },

  ranking: {
      getMonthlyRanking: async (): Promise<RankingEntry[]> => {
          const { data: { user } } = await supabase.auth.getUser();
          
          const { data: topProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, invite_count, avatar_id')
            .order('invite_count', { ascending: false })
            .limit(50);
            
          let mockRanking: RankingEntry[] = (topProfiles || []).map((p: any, index: number) => ({
              rank: index + 1,
              user_id: p.id,
              full_name: p.full_name,
              avatar_seed: p.avatar_id,
              invites: p.invite_count,
              is_current_user: p.id === user?.id,
              trend: Math.random() > 0.5 ? 'up' : 'same'
          }));

          if (user && !mockRanking.find(r => r.user_id === user.id)) {
              const { data: myProfile } = await supabase.from('profiles').select('invite_count, full_name, avatar_id').eq('id', user.id).single();
              if (myProfile) {
                  const fakeRank = 50 + Math.floor(Math.random() * 500); 
                  mockRanking.push({
                      rank: fakeRank,
                      user_id: user.id,
                      full_name: myProfile.full_name || 'Usuário',
                      avatar_seed: myProfile.avatar_id,
                      invites: myProfile.invite_count || 0,
                      is_current_user: true,
                      trend: 'same'
                  });
              }
          }
          
          mockRanking.sort((a, b) => b.invites - a.invites);
          
          return mockRanking.map((r, i) => ({...r, rank: i + 1}));
      }
  },

  challenges: {
      list: async (type: string): Promise<Challenge[]> => {
          const { data } = await supabase.from('challenges').select('*').eq('type', type).eq('active', true);
          return data || [];
      },
      uploadProof: async (file: File): Promise<string> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuário não autenticado");

          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
              .from('proofs')
              .upload(fileName, file, { cacheControl: '3600', upsert: false });

          if (uploadError) throw new Error("Falha no upload da imagem.");

          const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
          return data.publicUrl;
      },
      claim: async (challengeId: string) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return { data: { success: false } };
          
          const { data: existing } = await supabase.from('user_challenges')
            .select('status')
            .eq('user_id', user.id)
            .eq('challenge_id', challengeId)
            .single();
            
          if (existing?.status === 'claimed') return { data: { success: false } };

          const { error } = await supabase.from('user_challenges')
            .update({ status: 'claimed' })
            .eq('user_id', user.id)
            .eq('challenge_id', challengeId);
          
          if(error) throw error;

          const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
          if(challenge) {
               await distributeRewards(user.id, challenge);
          }

          return { data: { success: true } }; 
      },
      submitProof: async (challengeId: string, proof: string) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: existing } = await supabase.from('user_challenges')
            .select('id, status').eq('user_id', user.id).eq('challenge_id', challengeId).maybeSingle();
            
          if (proof === 'AUTO_VISIT') {
              const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
              
              if (challenge) {
                  const nowIso = new Date().toISOString();
                  if (existing) {
                      await supabase.from('user_challenges').update({
                          status: 'claimed',
                          progress: 100,
                          current_value: challenge.goal,
                          verification_proof: 'AUTO_VISIT',
                          last_update: nowIso, 
                          updated_at: nowIso
                      }).eq('id', existing.id);
                  } else {
                      await supabase.from('user_challenges').insert({
                          user_id: user.id,
                          challenge_id: challengeId,
                          status: 'claimed',
                          progress: 100,
                          current_value: challenge.goal,
                          verification_proof: 'AUTO_VISIT',
                          last_update: nowIso, 
                          updated_at: nowIso
                      });
                  }
                  await distributeRewards(user.id, challenge);
              }
              return;
          }

          if (existing) {
             return await supabase.from('user_challenges').update({
                 status: 'in_progress', verification_proof: proof, updated_at: new Date().toISOString()
             }).eq('id', existing.id);
          } else {
             return await supabase.from('user_challenges').insert({
                 user_id: user.id, challenge_id: challengeId, status: 'in_progress', verification_proof: proof
             });
          }
      },
      checkAction: async (actionType: string, forceIncrement: boolean = false): Promise<Challenge[]> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];

          if (actionType === 'login') {
              await supabase.rpc('process_daily_login');
          }

          const pad2 = (n: number) => String(n).padStart(2, '0');
          const dayKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
          const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
          const weekKey = (d: Date) => {
            const x = new Date(d);
            x.setHours(0, 0, 0, 0);
            const dow = (x.getDay() + 6) % 7; // Mon=0
            x.setDate(x.getDate() - dow);
            return dayKey(x);
          };
          const cycleKey = (type: string, d: Date) => {
            if (type === 'daily') return dayKey(d);
            if (type === 'weekly') return weekKey(d);
            if (type === 'monthly') return monthKey(d);
            return 'STATIC';
          };

          const { data: profile } = await supabase.from('profiles').select('invite_count, login_count').eq('id', user.id).single();
          const currentInviteCount = profile?.invite_count || 0;
          const totalLoginCount = profile?.login_count || 0;

          const { data: challenges } = await supabase
            .from('challenges')
            .select('*')
            .eq('category', actionType) 
            .eq('active', true);

          if (!challenges || challenges.length === 0) return [];

          const completedNow: Challenge[] = [];
          const now = new Date();

          for (const challenge of challenges) {
              
              if (challenge.category === 'login') {
                  const t = challenge.title.toLowerCase();
                  if (t.includes('diário') || t.includes('veterano') || t.includes('maratona')) {
                      continue; 
                  }
              }

              let { data: existing } = await supabase
                .from('user_challenges')
                .select('*')
                .eq('user_id', user.id)
                .eq('challenge_id', challenge.id)
                .maybeSingle();

              let shouldReset = false;
              if (existing && (challenge.type === 'daily' || challenge.type === 'weekly' || challenge.type === 'monthly')) {
                  const lastUpdate = new Date(existing.last_update || existing.updated_at || existing.created_at || 0);
                  const keyLast = cycleKey(challenge.type, lastUpdate);
                  const keyNow = cycleKey(challenge.type, now);
                  
                  if (keyLast !== keyNow) {
                      shouldReset = true;
                  }
              }

              if (shouldReset && existing) {
                  await supabase.from('user_challenges').update({
                      current_value: 0,
                      status: 'in_progress', 
                      progress: 0,
                      verification_proof: null, 
                      last_update: now.toISOString(),
                      updated_at: now.toISOString()
                  }).eq('id', existing.id);
                  
                  const { data: updated } = await supabase.from('user_challenges').select('*').eq('id', existing.id).single();
                  existing = updated;
              }

              let newValue = (existing?.current_value || 0);
              let shouldUpdate = false;

              if (existing && existing.status === 'claimed' && !shouldReset) {
                  continue;
              }

              let isComplete = newValue >= challenge.goal;

              if (existing && existing.status === 'completed' && isComplete && !shouldReset) {
                  shouldUpdate = true;
              }

              if (challenge.type === 'career' || challenge.type === 'permanent') {
                  if (actionType === 'check_invites' && newValue !== currentInviteCount) {
                      newValue = currentInviteCount;
                      shouldUpdate = true;
                  }
                  if (actionType === 'login' && newValue !== totalLoginCount) {
                      newValue = totalLoginCount;
                      shouldUpdate = true;
                  }
              } else {
                  if (forceIncrement || actionType === 'spin') {
                      newValue = newValue + 1;
                      shouldUpdate = true;
                  } else if (actionType === 'login' && challenge.type === 'daily') {
                      if (newValue < 1) {
                          newValue = 1;
                          shouldUpdate = true;
                      }
                  }
              }

              isComplete = newValue >= challenge.goal;

              if (!existing) {
                  let startVal = 0;
                  if (challenge.type === 'career' || challenge.type === 'permanent') {
                      if (actionType === 'check_invites') startVal = currentInviteCount;
                      if (actionType === 'login') startVal = totalLoginCount;
                  } else {
                      if (actionType === 'spin' || forceIncrement) startVal = 1;
                      if (actionType === 'login' && challenge.type === 'daily') startVal = 1;
                  }

                  isComplete = startVal >= challenge.goal;
                  
                  await supabase.from('user_challenges').insert({
                      user_id: user.id,
                      challenge_id: challenge.id,
                      status: isComplete ? 'claimed' : 'in_progress',
                      progress: isComplete ? 100 : Math.floor((startVal / challenge.goal) * 100),
                      current_value: startVal,
                      last_update: now.toISOString(),
                      updated_at: now.toISOString()
                  });
                  if (isComplete) {
                      await distributeRewards(user.id, challenge);
                      completedNow.push(challenge);
                  }

              } else if (shouldUpdate) {
                  const newStatus = isComplete ? 'claimed' : 'in_progress';

                  await supabase.from('user_challenges').update({
                      current_value: newValue,
                      progress: Math.min(Math.floor((newValue / challenge.goal) * 100), 100),
                      status: newStatus,
                      last_update: now.toISOString(),
                      updated_at: now.toISOString()
                  }).eq('id', existing.id);

                  if (isComplete && existing.status !== 'completed' && existing.status !== 'claimed') {
                      await distributeRewards(user.id, challenge);
                      completedNow.push(challenge);
                  }
              }
          }

          return completedNow;
      },
      
      getCompletedReadyToClaim: async (): Promise<Challenge[]> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];

          const { data, error } = await supabase
            .from('user_challenges')
            .select(`*, challenges (*)`)
            .eq('user_id', user.id)
            .eq('status', 'completed'); 

          if (error || !data) return [];
          
          const uniqueChallenges = new Map();
          data.forEach((item: any) => {
              const ch = Array.isArray(item.challenges) ? item.challenges[0] : item.challenges;
              if (ch && !uniqueChallenges.has(ch.id)) {
                  uniqueChallenges.set(ch.id, ch);
              }
          });
          return Array.from(uniqueChallenges.values());
      },
      
      validateChallenge: async (id: string, approved: boolean) => {
          if(!approved) {
              await supabase.from('user_challenges').update({ status: 'pending', verification_proof: null }).eq('id', id);
              return;
          }
          
          const { data: uc, error } = await supabase
            .from('user_challenges')
            .select('*, challenges(*)')
            .eq('id', id)
            .single();
            
          if(error || !uc) throw new Error("Challenge info not found");
          
          const challenge = Array.isArray(uc.challenges) ? uc.challenges[0] : uc.challenges;
          if(!challenge) throw new Error("Challenge details missing");
          
          const nowIso = new Date().toISOString();
          const { error: updateError } = await supabase.from('user_challenges').update({ 
              status: 'claimed', 
              progress: 100, 
              current_value: challenge.goal || 1, 
              last_update: nowIso,
              updated_at: nowIso 
          }).eq('id', id);
          
          if (updateError) throw updateError;
          
          await distributeRewards(uc.user_id, challenge);
      },
  },
  
  admin: {
      getAuditLogs: async () => {
          const { data, error } = await supabase
            .from('admin_audit')
            .select(`*, profiles:admin_id (full_name)`)
            .order('created_at', { ascending: false });
          if (error) return [];
          return data.map((d: any) => ({ ...d, timestamp: d.created_at, admin_name: d.profiles?.full_name || 'Sistema/Admin' }));
      },
      getPendingChallengeProofs: async () => {
          const { data, error } = await supabase
            .from('user_challenges')
            .select(`*, profiles:user_id ( full_name, email ), challenges:challenge_id ( title, reward_xp, reward_money, reward_spins )`)
            .eq('status', 'in_progress')
            .not('verification_proof', 'is', null);
          if(error) throw error;
          return data || [];
      },
      validateChallenge: async (id: string, approved: boolean) => {
          return api.challenges.validateChallenge(id, approved);
      },
      getRedemptionRequests: async (statusFilter?: string): Promise<AdminRedemptionRequest[]> => {
          let query = supabase.from('spin_history').select(`*, profiles:user_id (full_name, cpf, phone, last_ip)`).order('created_at', { ascending: false });
          if (statusFilter) query = query.eq('status', statusFilter);
          else query = query.eq('status', 'requested');

          const { data, error } = await query;
          if (error) return [];

          const cleanData = data.filter((item: any) => {
              const name = item.prize_name ? item.prize_name.toLowerCase() : '';
              const isLoss = name.includes('tente') || name.includes('não foi') || name.includes('azar') || name.includes('loss');
              return !isLoss;
          });

          return cleanData.map((item: any) => ({
              ...item, timestamp: item.created_at, prize_value: item.prize_value || 0,
              user_details: { full_name: item.profiles?.full_name || 'Desconhecido', cpf: item.profiles?.cpf || 'N/A', phone: item.profiles?.phone || 'N/A', ip_address: item.profiles?.last_ip || 'N/A' }
          }));
      },
      updateRedemptionStatus: async (historyId: string, newStatus: string) => {
          const { error } = await supabase.from('spin_history').update({ status: newStatus }).eq('id', historyId);
          if(error) throw error;
          await api.admin.logAction('UPDATE_REDEMPTION', historyId, { new_status: newStatus });
      },
      getUsers: async () => {
          const { data, error } = await supabase.from('profiles').select('*'); 
          if (error) throw error;
          return data.map((u: any) => ({
             ...u, is_admin: u.role === 'admin', available_spins: u.spins_remaining || 0, lux_coins: u.wallet_balance || 0, wallet_balance: u.wallet_balance || 0, referral_code: u.invite_code, ip_address: u.last_ip || 'N/A', is_banned: u.banned || false, login_count: u.login_count || 0
          }));
      },
      updateUser: async (userId: string, updates: { full_name?: string, phone?: string, cpf?: string, email?: string, lux_coins?: number, available_spins?: number }): Promise<void> => {
           const dbUpdates: any = {};
           if (updates.full_name) dbUpdates.full_name = updates.full_name;
           if (updates.phone) dbUpdates.phone = updates.phone;
           if (updates.cpf) dbUpdates.cpf = updates.cpf;
           if (updates.email) dbUpdates.email = updates.email;

           if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
                if (error) throw error;
           }

           if (updates.lux_coins !== undefined || updates.available_spins !== undefined) {
               const { error: rpcError } = await supabase.rpc('admin_update_balance', {
                   target_user_id: userId,
                   new_coins: updates.lux_coins !== undefined ? updates.lux_coins : null,
                   new_spins: updates.available_spins !== undefined ? updates.available_spins : null
               });
               if (rpcError) throw rpcError;
           }

           await api.admin.logAction('UPDATE_USER_PROFILE', userId, updates);
      },
      logAction: async (action: string, target: string, details: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('admin_audit').insert({ admin_id: user.id, action, target, details });
      },
      addSpins: async (userId: string, amount: number) => {
          const { error } = await supabase.rpc('admin_update_balance', {
              target_user_id: userId,
              add_spins: amount
          });
          if (error) throw error;
          await api.admin.logAction('ADD_SPINS', userId, { amount });
      },
      addLuxCoins: async (userId: string, amount: number) => {
          const { error } = await supabase.rpc('admin_update_balance', {
              target_user_id: userId,
              add_coins: amount
          });
          if (error) throw error;
          await api.admin.logAction('ADD_COINS', userId, { amount });
      },
      banUser: async (userId: string, status: boolean) => {
          await supabase.from('profiles').update({ banned: status }).eq('id', userId);
          await api.admin.logAction(status ? 'BAN_USER' : 'UNBAN_USER', userId, {});
      },
      banIp: async (ip: string) => {
          const { error } = await supabase.from('banned_ips').insert({ ip_address: ip });
          if (!error) await api.admin.logAction('BAN_IP', ip, {});
      },
      getThemeConfig: async (): Promise<SystemThemeConfig> => {
          const { data, error } = await supabase.from('system_settings').select('value').eq('key', 'active_theme').single();
          if (error) throw error;
          return (data?.value as SystemThemeConfig) || { active: false, name: 'default' };
      },
      updateThemeConfig: async (config: SystemThemeConfig): Promise<void> => {
          const { error } = await supabase.from('system_settings').upsert({ key: 'active_theme', value: config });
          if (error) throw error;
          await api.admin.logAction('UPDATE_THEME', 'system', { theme: config.name });
      },
      // Funções para Controle de IP
      getIpUsageStats: async () => {
          const { data, error } = await supabase.rpc('get_ip_usage_stats');
          if (error) throw error;
          return data;
      },
      getIpConfig: async () => {
          const { data, error } = await supabase.rpc('get_ip_config');
          if (error) throw error;
          return data;
      },
      updateIpLimit: async (limit: number, active: boolean) => {
          const { error } = await supabase.rpc('update_ip_limit', { p_new_limit: limit, p_is_active: active });
          if (error) throw error;
      },
      addIpWhitelist: async (ip: string, reason: string) => {
          const { error } = await supabase.rpc('add_ip_whitelist', { p_ip_address: ip, p_reason: reason });
          if (error) throw error;
      },
      removeIpWhitelist: async (id: string) => {
          const { error } = await supabase.rpc('remove_ip_whitelist', { p_id: id });
          if (error) throw error;
      }
  }
};