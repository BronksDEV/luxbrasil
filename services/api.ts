import { createClient } from '@supabase/supabase-js';
import { Prize, SpinResult, UserProfile, WinnerLog, Challenge, Referral } from '../types';

const SUPABASE_URL = 'https://isrkqhpbfppifhfkrzbv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzcmtxaHBiZnBwaWZoZmtyemJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4ODQ4NDAsImV4cCI6MjA4MjQ2MDg0MH0.F6BIoSMdNFtOjvDGstEImN_v0DYHkolcAWOo1idyaLM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

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

const getPublicIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return '0.0.0.0'; 
    }
};

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<UserProfile> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Usuário não encontrado.");
      await new Promise(r => setTimeout(r, 500));
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

      if (!validateCPFStructure(cleanCpf)) throw new Error("O CPF informado é inválido.");

      const { data: existingCpf } = await supabase
          .from('profiles')
          .select('id')
          .eq('cpf', cleanCpf)
          .maybeSingle();
      if (existingCpf) throw new Error("Este CPF já está cadastrado em nossa plataforma.");

      if (cleanInvite) {
          const { data: referrerProfile } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('invite_code', cleanInvite)
              .maybeSingle();
          
          if (!referrerProfile) {
              throw new Error("Código de convite inválido. Verifique e tente novamente.");
          }
      }

      const userIp = await getPublicIP();
      if (userIp !== '0.0.0.0') {
          const { count, error: countError } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('last_ip', userIp);

          if (!countError && count !== null && count >= 2) {
              throw new Error("Limite de segurança atingido: Máximo de 2 contas permitidas por endereço IP.");
          }
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            cpf: cleanCpf, 
            phone: cleanPhone,
            role: 'user',
            ip_address: userIp,
            invite_code: cleanInvite
          }
        }
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Falha no registro.");
      
      if (data.session) {
          await supabase.from('profiles').update({ last_ip: userIp }).eq('id', data.user.id);
          await new Promise(r => setTimeout(r, 2500));
          return api.auth.getCurrentUser();
      } else {
          throw new Error("CONFIRM_EMAIL");
      }
    },

    getCurrentUser: async (): Promise<UserProfile> => {
       const { data: { user }, error: userError } = await supabase.auth.getUser();
       if (userError) throw new Error("Erro ao verificar sessão: " + userError.message);
       if (!user) throw new Error("Sem sessão ativa.");

       let profile = null;
       let attempts = 0;
       while (attempts < 5 && !profile) {
           try {
               const { data } = await supabase
                 .from('profiles')
                 .select('*')
                 .eq('id', user.id)
                 .maybeSingle(); 
               if (data) profile = data;
               else { attempts++; await new Promise(r => setTimeout(r, 1000)); }
           } catch (err) { attempts++; await new Promise(r => setTimeout(r, 1000)); }
       }
         
       if (!profile) {
           return {
               id: user.id, email: user.email!, full_name: user.user_metadata?.full_name || 'Usuário',
               cpf: '', phone: '', available_spins: 0, wallet_balance: 0,
               is_admin: false, referral_code: '', is_banned: false
           };
       }
       
       return {
         ...profile,
         id: user.id, email: user.email!, is_admin: profile.role === 'admin',
         available_spins: profile.spins_remaining || 0, referral_code: profile.invite_code,
         ip_address: profile.last_ip || '127.0.0.1', is_banned: profile.banned || false,
         invite_count: profile.invite_count || 0, invite_earnings: profile.invite_earnings || 0
       };
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
      if (error) throw new Error(error.message || "Erro ao processar giro.");
      return {
          prize: data.prize, redemption_code: data.redemption_code,
          remaining_spins: data.remaining_spins, wallet_balance: data.wallet_balance
      };
    },
    checkDaily: async (): Promise<boolean> => {
        const { data, error } = await supabase.rpc('check_and_add_timer_spin');
        if (error) return false;
        return data?.spin_added || false;
    },
    getHistory: async (): Promise<WinnerLog[]> => {
      const { data, error } = await supabase.from('spin_history').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((item: any) => ({ ...item, timestamp: item.created_at }));
    },
    requestRedemption: async (id: string) => {
        const { data, error } = await supabase.from('spin_history').update({ status: 'requested' }).eq('id', id).select().single();
        if (error) throw error;
        return { ...data, timestamp: data.created_at };
    }
  },

  challenges: {
      list: async (type: string): Promise<Challenge[]> => {
          const { data } = await supabase.from('challenges').select('*').eq('type', type).eq('active', true);
          return data || [];
      },
      claim: async (challengeId: string) => {
          return await supabase.rpc('claim_challenge_reward', { p_challenge_id: challengeId });
      },
      submitProof: async (challengeId: string, proof: string) => {
          const { data: { user } } = await supabase.auth.getUser();
          const { data: existing } = await supabase.from('user_challenges')
            .select('id').eq('user_id', user?.id).eq('challenge_id', challengeId).maybeSingle();
            
          if (existing) {
             return await supabase.from('user_challenges').update({
                 status: 'in_progress', verification_proof: proof, updated_at: new Date().toISOString()
             }).eq('id', existing.id);
          } else {
             return await supabase.from('user_challenges').insert({
                 user_id: user?.id, challenge_id: challengeId, status: 'in_progress', verification_proof: proof
             });
          }
      },
      
      checkAction: async (actionType: string): Promise<Challenge[]> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];

          const ACTION_KEYWORDS: Record<string, string[]> = {
              'login': ['check-in', 'login', 'semana', 'weekly', 'platinum', 'membro', 'member', 'daily', 'diário'],
              'visit_wallet': ['análise', 'explorador', 'carteira', 'saldo', 'financeiro', 'wallet', 'analysis'],
              'share_link': ['networking', 'compartilhar', 'espalhe', 'convidar', 'share', 'invite'],
              'check_invites': ['embaixador', 'império', 'influencer', 'convites', 'empire', 'ambassador', 'invites']
          };

          const keywords = ACTION_KEYWORDS[actionType] || [];
          if (keywords.length === 0) return [];

          const { data: challenges } = await supabase.from('challenges').select('*').eq('active', true);
          if (!challenges || challenges.length === 0) return [];

          const matchedChallenges = challenges.filter(c => {
              const titleLower = c.title.toLowerCase();
              return keywords.some(k => titleLower.includes(k));
          });

          if (matchedChallenges.length === 0) return [];

          let inviteCount = 0;
          if (actionType === 'check_invites') {
              const { data: profile } = await supabase.from('profiles').select('invite_count').eq('id', user.id).single();
              inviteCount = profile?.invite_count || 0;
          }

          const completedNow: Challenge[] = [];

          for (const challenge of matchedChallenges) {
              let targetCount = 1;
              let isAccumulative = false;

              if (actionType === 'login') {
                  switch (challenge.type) {
                      case 'weekly': targetCount = 5; isAccumulative = true; break;
                      case 'monthly': targetCount = 20; isAccumulative = true; break;
                      case 'permanent': 
                          if (challenge.title.toLowerCase().includes('platinum') || challenge.title.includes('20')) {
                              targetCount = 20; isAccumulative = true;
                          }
                          break;
                      default: targetCount = 1; isAccumulative = false; break;
                  }
              }

              if (actionType === 'check_invites') {
                   const numbers = challenge.title.match(/\d+/);
                   const requiredInvites = numbers ? parseInt(numbers[0]) : 1;
                   if (inviteCount < requiredInvites) continue;
              }

              const { data: existing } = await supabase
                  .from('user_challenges')
                  .select('*')
                  .eq('user_id', user.id)
                  .eq('challenge_id', challenge.id)
                  .maybeSingle(); 

              let shouldUpdate = false;
              let newProgress = 0;
              let newStatus = 'in_progress';
              
              if (!existing) {
                  const currentCount = 1;
                  newProgress = Math.min((currentCount / targetCount) * 100, 100);
                  newStatus = currentCount >= targetCount ? 'completed' : 'in_progress';
                  shouldUpdate = true;
              } else {
                  const lastUpdate = new Date(existing.updated_at || existing.created_at);
                  const today = new Date();
                  const alreadyUpdatedToday = isSameDay(lastUpdate, today);

                  if (existing.status !== 'completed' && existing.status !== 'claimed') {
                      if (isAccumulative) {
                          if (!alreadyUpdatedToday) {
                              const previousDays = Math.round((existing.progress / 100) * targetCount);
                              const nextDay = previousDays + 1;
                              newProgress = Math.min((nextDay / targetCount) * 100, 100);
                              newStatus = nextDay >= targetCount ? 'completed' : 'in_progress';
                              shouldUpdate = true;
                          }
                      } else {
                          if (actionType !== 'login' || challenge.type === 'daily') {
                              if (!alreadyUpdatedToday || actionType !== 'login') {
                                  newProgress = 100;
                                  newStatus = 'completed';
                                  shouldUpdate = true;
                              }
                          }
                      }
                  }
              }

              if (shouldUpdate) {
                  try {
                      if (existing) {
                           await supabase.from('user_challenges').update({
                              progress: newProgress, status: newStatus, updated_at: new Date().toISOString()
                           }).eq('id', existing.id);
                      } else {
                           await supabase.from('user_challenges').insert({
                              user_id: user.id, challenge_id: challenge.id,
                              progress: newProgress, status: newStatus
                           });
                      }

                      if (newStatus === 'completed') completedNow.push(challenge);
                  } catch (e) { console.error("Update failed", e); }
              }
          }

          return completedNow;
      }
  },
  
  admin: {
      getAuditLogs: async () => {
          const { data, error } = await supabase.from('admin_audit').select('*, profiles(full_name)').order('created_at', { ascending: false });
          if (error) return [];
          return data.map((d: any) => ({ ...d, timestamp: d.created_at, admin_name: d.profiles?.full_name || 'Sistema/Admin' }));
      },
      getUsers: async () => {
          const { data, error } = await supabase.from('profiles').select('*');
          if (error) throw error;
          return data.map((u: any) => ({
             ...u, is_admin: u.role === 'admin', available_spins: u.spins_remaining || 0,
             referral_code: u.invite_code, ip_address: u.last_ip || 'N/A', is_banned: u.banned || false
          }));
      },
      logAction: async (action: string, target: string, details: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await supabase.from('admin_audit').insert({ admin_id: user.id, action, target, details });
          }
      },
      addSpins: async (userId: string, amount: number) => {
          const { error } = await supabase.rpc('admin_add_spins', { p_user_id: userId, p_amount: amount });
          if (error) {
              const { data: u } = await supabase.from('profiles').select('spins_remaining').eq('id', userId).single();
              if (u) await supabase.from('profiles').update({ spins_remaining: u.spins_remaining + amount }).eq('id', userId);
          }
          await api.admin.logAction('ADD_SPINS', userId, { amount });
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