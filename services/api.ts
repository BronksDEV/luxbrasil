import { createClient } from '@supabase/supabase-js';
import { Prize, SpinResult, UserProfile, WinnerLog, Challenge, Referral, AdminRedemptionRequest } from '../types';

const SUPABASE_URL = 'https://isrkqhpbfppifhfkrzbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzcmtxaHBiZnBwaWZoZmtyemJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODQ4NDAsImV4cCI6MjA4MjQ2MDg0MH0.F6BIoSMdNFtOjvDGstEImN_v0DYHkolcAWOo1idyaLM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Helper interno para entregar recompensas de forma segura
const distributeRewards = async (userId: string, challenge: Challenge | any) => {
    // Busca perfil atual
    const { data: profile, error: profileError } = await supabase.from('profiles').select('spins_remaining, wallet_balance, xp').eq('id', userId).single();
    
    if (profileError || !profile) {
        console.error("Erro ao buscar perfil para recompensa:", profileError);
        throw new Error("Perfil do usuário não encontrado para entrega de recompensa.");
    }

    const updates: any = {};
    
    // Garante que são números (converte null/undefined para 0)
    const rSpins = Number(challenge.reward_spins || 0);
    const rMoney = Number(challenge.reward_money || 0);
    const rXp = Number(challenge.reward_xp || 0);
    
    if (rSpins > 0) {
        updates.spins_remaining = (profile.spins_remaining || 0) + rSpins;
    }
    if (rMoney > 0) {
        updates.wallet_balance = (profile.wallet_balance || 0) + rMoney;
    }
    if (rXp > 0) {
        updates.xp = (profile.xp || 0) + rXp;
    }

    if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (updateError) {
            console.error("Erro ao atualizar recompensas no perfil:", updateError);
            throw updateError;
        }
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
          throw new Error("Erro de processamento automático."); 
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

      const { data: checkData, error: checkError } = await supabase.rpc('check_registration_data', {
          p_email: userData.email,
          p_cpf: cleanCpf,
          p_phone: cleanPhone
      });

      if (checkError) {
          console.error("Erro RPC:", checkError);
      } else if (checkData && checkData.available === false) {
          throw new Error(checkData.message);
      }

      const userIp = await getPublicIP();

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            cpf: cleanCpf, 
            phone: cleanPhone,
            invite_code: cleanInvite,
            ip_address: userIp
          },
          emailRedirectTo: `https://roletalux.com.br/#/login`
        }
      });

      if (error) {
          if (error.message.includes('already registered') || error.message.includes('unique')) {
              throw new Error("Este e-mail ou CPF já está cadastrado.");
          }
          throw new Error(error.message);
      }
      
      if (data.user) {
          try {
              const { error: profileError } = await supabase.from('profiles').insert({
                  id: data.user.id,
                  email: userData.email,
                  full_name: userData.full_name,
                  cpf: cleanCpf,
                  phone: cleanPhone,
                  invite_code: cleanInvite,
                  last_ip: userIp,
                  role: 'user',
                  spins_remaining: 1, 
                  wallet_balance: 0,
                  xp: 0
              });
              
              if (profileError && !profileError.message.includes('duplicate')) {
                  console.error("Erro ao criar perfil manual:", profileError);
              }
          } catch (e) {
              console.error("Erro fallback profile:", e);
          }
      }

      if (data.user && !data.session) {
          throw new Error("CONFIRM_EMAIL");
      }
      
      if (data.session) {
          await new Promise(r => setTimeout(r, 1000));
          return api.auth.getCurrentUser();
      }

      throw new Error("Erro desconhecido no registro.");
    },

    getCurrentUser: async (): Promise<UserProfile> => {
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       if (userError || !user) throw new Error("Sem sessão ativa.");

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
           console.error("User ID:", user.id, "Profile Check Failed. Verify RLS policies.");
           throw new Error("Perfil não encontrado. Verifique se confirmou seu e-mail.");
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
         last_login: profile.last_login
       };
    },
    
    processDailyLogin: async (): Promise<{ new_day: boolean, login_count: number }> => {
        const { data, error } = await supabase.rpc('process_daily_login');
        if (error) {
            console.error("Erro no process_daily_login:", error);
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
            color: prize.color, value: prize.value, type: prize.type
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
          console.error("Spin Error:", error);
          if (error.message.includes('Saldo de giros insuficiente')) {
              throw new Error("Sem giros disponíveis.");
          }
          throw new Error("Erro ao processar giro. Tente novamente.");
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

        const { data: profile } = await supabase.from('profiles').select('wallet_balance, spins_remaining').eq('id', user.user.id).single();
        
        if (!profile || (profile.wallet_balance || 0) < item.cost) {
            throw new Error(`Saldo insuficiente. Você precisa de ${item.cost} LuxCoins.`);
        }

        const newBalance = (profile.wallet_balance || 0) - item.cost;
        
        if (item.type === 'spins') {
            const { error } = await supabase.from('profiles').update({
                wallet_balance: newBalance,
                spins_remaining: (profile.spins_remaining || 0) + 1
            }).eq('id', user.user.id);
            if (error) throw error;
        } 
        else {
             const { error: balanceError } = await supabase.from('profiles').update({
                wallet_balance: newBalance
            }).eq('id', user.user.id);
            if (balanceError) throw balanceError;

            const { error: historyError } = await supabase.from('spin_history').insert({
                user_id: user.user.id,
                prize_name: item.name,
                prize_type: item.type,
                prize_value: item.moneyValue || 0, 
                status: 'pending',
                redemption_code: `STORE-${Math.random().toString(36).substring(7).toUpperCase()}`,
                created_at: new Date().toISOString()
            });

            if (historyError) {
                await supabase.from('profiles').update({ wallet_balance: profile.wallet_balance }).eq('id', user.user.id);
                throw new Error("Erro ao processar entrega do item. Saldo estornado.");
            }
        }
        return true;
    },

    exchangeCoinsForSpins: async (): Promise<boolean> => {
        return api.game.purchaseStoreItem({ name: 'Giro Extra', cost: 100, type: 'spins', id: 'spin-1' });
    }
  },

  challenges: {
      list: async (type: string): Promise<Challenge[]> => {
          const { data } = await supabase.from('challenges').select('*').eq('type', type).eq('active', true);
          return data || [];
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
            
          // Se for prova automática (AUTO_VISIT), completa e entrega recompensa Imediatamente
          if (proof === 'AUTO_VISIT') {
              const { data: challenge } = await supabase.from('challenges').select('*').eq('id', challengeId).single();
              
              if (challenge) {
                  // Atualiza tabela de desafio para 'claimed' (já que é automático)
                  if (existing) {
                      await supabase.from('user_challenges').update({
                          status: 'claimed',
                          progress: 100,
                          current_value: challenge.goal,
                          verification_proof: 'AUTO_VISIT',
                          updated_at: new Date().toISOString()
                      }).eq('id', existing.id);
                  } else {
                      await supabase.from('user_challenges').insert({
                          user_id: user.id,
                          challenge_id: challengeId,
                          status: 'claimed',
                          progress: 100,
                          current_value: challenge.goal,
                          verification_proof: 'AUTO_VISIT',
                          updated_at: new Date().toISOString()
                      });
                  }
                  // ENTREGA RECOMPENSA
                  await distributeRewards(user.id, challenge);
              }
              return;
          }

          // Se for prova manual, segue fluxo normal de análise
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

          const { data: challenges } = await supabase
            .from('challenges')
            .select('*')
            .eq('category', actionType) 
            .eq('active', true);

          if (!challenges || challenges.length === 0) return [];

          const completedNow: Challenge[] = [];
          const now = new Date();

          for (const challenge of challenges) {
              let { data: existing } = await supabase
                .from('user_challenges')
                .select('*')
                .eq('user_id', user.id)
                .eq('challenge_id', challenge.id)
                .maybeSingle();

              // Lógica de Reset Diário
              if (existing && challenge.type === 'daily') {
                  const lastUpdate = new Date(existing.updated_at || existing.last_update || 0);
                  const isToday = lastUpdate.getDate() === now.getDate() && 
                                  lastUpdate.getMonth() === now.getMonth() && 
                                  lastUpdate.getFullYear() === now.getFullYear();
                  
                  // Se for um registro de um dia anterior, RESETAMOS para permitir completar hoje
                  if (!isToday) {
                      // Se estava claimed ontem, reseta para começar de novo hoje
                      // Se estava em progresso ontem, reseta também (missão diária tem que terminar no dia)
                      const { data: updated } = await supabase.from('user_challenges').update({
                          current_value: 0,
                          status: 'pending',
                          progress: 0,
                          last_update: now.toISOString(),
                          updated_at: now.toISOString()
                      }).eq('id', existing.id).select().single();
                      existing = updated;
                  }
                  
                  // Se já está claimed HOJE, não faz nada
                  if (existing.status === 'claimed' && isToday) {
                      continue;
                  }
              } else if (existing && existing.status === 'claimed') {
                  // Se não for diária e já foi reclamada, ignora
                  continue;
              }

              // CORREÇÃO "STUCK STATE": Se já atingiu a meta mas status não é final, finaliza agora
              // Isso corrige o problema da "Sorte lançada" que pode ter incrementado mas não pago
              if (existing && (existing.current_value || 0) >= challenge.goal && existing.status !== 'claimed' && existing.status !== 'completed') {
                   await supabase.from('user_challenges').update({
                          status: 'claimed',
                          progress: 100,
                          current_value: challenge.goal,
                          updated_at: now.toISOString()
                   }).eq('id', existing.id);
                   await distributeRewards(user.id, challenge);
                   completedNow.push(challenge);
                   continue; // Próximo challenge
              }

              // Lógica de Incremento Normal
              let isComplete = false;

              if (!existing) {
                  // Primeira vez
                  isComplete = challenge.goal <= 1;
                  const newStatus = isComplete ? 'claimed' : 'in_progress';
                  
                  await supabase.from('user_challenges').insert({
                      user_id: user.id,
                      challenge_id: challenge.id,
                      status: newStatus,
                      progress: isComplete ? 100 : Math.floor((1 / challenge.goal) * 100),
                      current_value: 1,
                      last_update: now.toISOString(),
                      updated_at: now.toISOString()
                  });
                  if (isComplete) completedNow.push(challenge);

              } else {
                  // Incremento
                  let shouldIncrement = false;
                  
                  if (forceIncrement) shouldIncrement = true;
                  else if (actionType === 'spin' || actionType === 'check_invites') shouldIncrement = true;
                  else if (actionType === 'login' && challenge.type === 'daily') {
                      // Para login diário, se já existe e não está claimed (e já passou pelo reset acima),
                      // significa que é a ação de hoje que deve completar.
                      shouldIncrement = true;
                  } else {
                      // Outros tipos, verifica data
                      const lastUpdateDate = existing.last_update ? new Date(existing.last_update) : new Date(0);
                      const isToday = lastUpdateDate.getDate() === now.getDate() && 
                                      lastUpdateDate.getMonth() === now.getMonth() && 
                                      lastUpdateDate.getFullYear() === now.getFullYear();
                      shouldIncrement = !isToday; 
                  }

                  if (shouldIncrement) {
                      const newVal = (existing.current_value || 0) + 1;
                      isComplete = newVal >= challenge.goal;
                      const newStatus = isComplete ? 'claimed' : 'in_progress';

                      await supabase.from('user_challenges').update({
                          current_value: newVal,
                          progress: Math.min(Math.floor((newVal / challenge.goal) * 100), 100),
                          status: newStatus,
                          last_update: now.toISOString(),
                          updated_at: now.toISOString()
                      }).eq('id', existing.id);

                      if (isComplete) completedNow.push(challenge);
                  }
              }

              // ENTREGA RECOMPENSA
              if (isComplete) {
                  await distributeRewards(user.id, challenge);
              }
          }

          return completedNow;
      },
      
      getCompletedReadyToClaim: async (): Promise<Challenge[]> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];

          const { data } = await supabase
            .from('user_challenges')
            .select(`*, challenges (*)`)
            .eq('user_id', user.id)
            .eq('status', 'completed'); // Busca manuais aprovados

          if (!data) return [];
          
          const uniqueChallenges = new Map();
          data.forEach((item: any) => {
              if (item.challenges && !uniqueChallenges.has(item.challenges.id)) {
                  uniqueChallenges.set(item.challenges.id, item.challenges);
              }
          });
          return Array.from(uniqueChallenges.values());
      },
      
      validateChallenge: async (id: string, approved: boolean) => {
          console.log('🔄 Validando missão:', id, 'Aprovado:', approved);
          
          if(!approved) {
              const { error } = await supabase.from('user_challenges').update({ status: 'pending', verification_proof: null }).eq('id', id);
              if (error) console.error('❌ Erro ao rejeitar:', error);
              else console.log('✅ Missão rejeitada');
              return;
          }
          
          const { data: uc, error: ucError } = await supabase
            .from('user_challenges')
            .select('*')
            .eq('id', id)
            .single();
            
          if(ucError || !uc) {
              console.error('❌ Erro ao buscar user_challenge:', ucError);
              throw new Error("Challenge info not found");
          }
          
          console.log('📋 User Challenge encontrado:', uc);
          
          const { data: challenge, error: challengeError } = await supabase
            .from('challenges')
            .select('*')
            .eq('id', uc.challenge_id)
            .single();
          
          if(challengeError || !challenge) {
              console.error('❌ Erro ao buscar challenge:', challengeError);
              throw new Error("Challenge details missing");
          }
          
          console.log('🎯 Challenge encontrado:', challenge);
          
          const { error: updateError } = await supabase
            .from('user_challenges')
            .update({ 
                status: 'claimed', 
                progress: 100, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', id);
          
          if (updateError) {
              console.error('❌ Erro ao atualizar status:', updateError);
              throw updateError;
          }
          
          console.log('✅ Status atualizado para claimed');
          
          await distributeRewards(uc.user_id, challenge);
          console.log('✅ Recompensas distribuídas');
      },
  },
  
  admin: {
      getAuditLogs: async () => {
          const { data, error } = await supabase
            .from('admin_audit')
            .select(`
              *,
              profiles!admin_audit_admin_id_fkey (
                full_name
              )
            `)
            .order('created_at', { ascending: false });
          if (error) return [];
          return data.map((d: any) => ({ ...d, timestamp: d.created_at, admin_name: d.profiles?.full_name || 'Sistema/Admin' }));
      },
      getPendingChallengeProofs: async () => {
          const { data: userChallenges, error } = await supabase
            .from('user_challenges')
            .select('*')
            .eq('status', 'in_progress')
            .not('verification_proof', 'is', null);
          
          if (error || !userChallenges || userChallenges.length === 0) {
              console.log('Nenhuma missão pendente ou erro:', error);
              return [];
          }
          
          console.log('User challenges encontrados:', userChallenges.length);
          
          const enriched = await Promise.all(userChallenges.map(async (uc: any) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', uc.user_id)
                .single();
              
              const { data: challenge } = await supabase
                .from('challenges')
                .select('title, reward_xp, reward_money, reward_spins')
                .eq('id', uc.challenge_id)
                .single();
              
              return {
                  ...uc,
                  profiles: profile || { full_name: 'Usuário', email: '' },
                  challenges: challenge || { title: 'Desafio', reward_xp: 0, reward_money: 0, reward_spins: 0 }
              };
          }));
          
          console.log('Missões enriched:', enriched);
          return enriched;
      },
      validateChallenge: async (id: string, approved: boolean) => {
          return api.challenges.validateChallenge(id, approved);
      },
      getRedemptionRequests: async (statusFilter?: string): Promise<AdminRedemptionRequest[]> => {
          let query = supabase.from('spin_history').select(`
            *,
            profiles!spin_history_user_id_fkey (
              full_name,
              cpf,
              phone,
              last_ip
            )
          `).order('created_at', { ascending: false });
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
      logAction: async (action: string, target: string, details: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('admin_audit').insert({ admin_id: user.id, action, target, details });
      },
      addSpins: async (userId: string, amount: number) => {
          const { data: u } = await supabase.from('profiles').select('spins_remaining').eq('id', userId).single();
          if (u) await supabase.from('profiles').update({ spins_remaining: u.spins_remaining + amount }).eq('id', userId);
          await api.admin.logAction('ADD_SPINS', userId, { amount });
      },
      addLuxCoins: async (userId: string, amount: number) => {
          const { data: u } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
          if (u) await supabase.from('profiles').update({ wallet_balance: (u.wallet_balance || 0) + amount }).eq('id', userId);
          await api.admin.logAction('ADD_COINS', userId, { amount });
      },
      banUser: async (userId: string, status: boolean) => {
          await supabase.from('profiles').update({ banned: status }).eq('id', userId);
          await api.admin.logAction(status ? 'BAN_USER' : 'UNBAN_USER', userId, {});
      },
      banIp: async (ip: string) => {
          const { error } = await supabase.from('banned_ips').insert({ ip_address: ip });
          if (!error) await api.admin.logAction('BAN_IP', ip, {});
      }
  }
};