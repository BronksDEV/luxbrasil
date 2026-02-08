import { createClient } from '@supabase/supabase-js';
import { Prize, SpinResult, UserProfile, WinnerLog, Challenge, Referral, AdminRedemptionRequest, SystemThemeConfig, Mission } from '../types';

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

// Helper functions
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
    return clean.length >= 10 && clean.length <= 11;
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

      // CRÍTICO: Processa login diário E verifica missão de login
      try {
        await api.auth.processDailyLogin();
        // Força verificação da ação de login para missões
        await api.challenges.checkAction('login');
      } catch (e) {
        console.warn('Erro ao processar login diário:', e);
      }

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
          throw new Error("O telefone é inválido.");
      }

      try {
          const { data: checkData } = await supabase.rpc('check_registration_data', {
              p_email: userData.email,
              p_cpf: cleanCpf,
              p_phone: cleanPhone
          });
          if (checkData && checkData.available === false) {
              throw new Error(checkData.message);
          }
      } catch (e: any) {
          if (e.message && e.message !== 'check_registration_data not found') console.warn("Reg check warning:", e);
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
      
      if (data.user && !data.session) {
          throw new Error("CONFIRM_EMAIL");
      }
      
      if (data.session) {
          await new Promise(r => setTimeout(r, 1000));
          // Processa login diário e missões (server-side)
          try {
            await api.auth.processDailyLogin();
            await api.challenges.checkAction('login');
          } catch (e) {
            console.warn('Erro ao processar registro:', e);
          }
          return api.auth.getCurrentUser();
      }

      throw new Error("Erro desconhecido no registro.");
    },

    getCurrentUser: async (): Promise<UserProfile> => {
       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
       const user = session?.user;
       if (sessionError || !user) throw new Error("Sem sessão ativa.");

       let { data: profile } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', user.id)
         .maybeSingle(); 
       
       if (!profile) {
           await new Promise(r => setTimeout(r, 1500));
           const retry = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
           profile = retry.data;
       }

       if (!profile) throw new Error("Perfil não encontrado.");
       
       return {
         ...profile,
         id: user.id,
         email: user.email!,
         is_admin: profile.role === 'admin',
         available_spins: (profile.spins_remaining !== undefined) ? profile.spins_remaining : 0,
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
    
    logout: async () => {
      await supabase.auth.signOut();
    },

    // FUNÇÃO CORRIGIDA: Agora retorna o resultado e permite verificação externa
    processDailyLogin: async (): Promise<{ new_day: boolean; login_count: number } | null> => {
      try {
        const { data, error } = await supabase.rpc('process_daily_login');
        if (error) {
          console.error('Erro ao processar login diário:', error);
          return null;
        }
        console.log('Login diário processado:', data);
        return data;
      } catch (e) {
        console.error('Erro ao processar login diário:', e);
        return null;
      }
    },

    forgotPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://roletalux.com.br/#/reset-password`
      });
      if (error) throw new Error(error.message);
    },

    resetPassword: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },

    updateProfile: async (userId: string, data: any) => {
      const { error } = await supabase.from('profiles').update(data).eq('id', userId);
      if (error) throw new Error(error.message);
    }
  },

  prizes: {
    list: async (): Promise<Prize[]> => {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('active', true);
      
      if (error) throw new Error(error.message);
      return data || [];
    },
    create: async (prize: any) => {
      const { data, error } = await supabase.from('prizes').insert(prize).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    update: async (prize: Prize) => {
      const { error } = await supabase.from('prizes').update(prize).eq('id', prize.id);
      if (error) throw new Error(error.message);
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('prizes').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
  },

  game: {
    spin: async (userId?: string): Promise<SpinResult> => {
      const { data, error } = await supabase
        .rpc('play_spin');
      
      if (error) throw new Error(error.message);
      return data;
    },

    getHistory: async (userId?: string): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from('spin_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      return data || [];
    },

    requestRedemption: async (historyId: string) => {
      const { data, error } = await supabase
        .from('spin_history')
        .update({ status: 'requested', redemption_requested_at: new Date().toISOString() })
        .eq('id', historyId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },

    purchaseStoreItem: async (item: any) => {
        return api.store.redeemItem(item);
    }
  },

  winners: {
    getRecent: async (): Promise<WinnerLog[]> => {
      const { data } = await supabase
        .from('spin_history')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .not('prize_name', 'eq', 'Tente novamente')
        .order('created_at', { ascending: false })
        .limit(10);

      return (data || []).map((item: any) => ({
        ...item,
        user_name: item.profiles?.full_name || 'Anônimo'
      }));
    }
  },

  referrals: {
    getList: async (): Promise<Referral[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Pega os usuários convidados por este user
      const { data: invited } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, created_at')
        .eq('invited_by', user.id);

      const invitedList = invited || [];
      const invitedIds = invitedList.map((p: any) => p.id).filter(Boolean);

      // Descobre quem já girou pelo menos 1x (spun_roulette)
      let spunSet = new Set<string>();
      if (invitedIds.length > 0) {
        const { data: spins } = await supabase
          .from('spin_history')
          .select('user_id')
          .in('user_id', invitedIds);

        for (const s of (spins || []) as any[]) {
          if (s?.user_id) spunSet.add(s.user_id);
        }
      }

      return invitedList.map((r: any) => {
        const createdAt = r.created_at ?? null;

        return {
          // seus campos atuais
          id: r.cpf ?? r.id,
          name: r.full_name,
          date: createdAt,
          earnings: 0,

          // campos que o type Referral exige (estavam faltando)
          referred: r.id,                     // id do usuário indicado
          spun_roulette: spunSet.has(r.id),   // true se já tem spin_history
          reward_paid: false,                 // ajuste quando tiver regra real
          created_at: createdAt               // mantém compatível com o type
        } as Referral;
      });
    }
  },

  store: {
    redeemItem: async (item: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");
        
        if (item.requiresAddress) {
            // PARA RESGATE FÍSICO: GERAR APENAS A TABELA spin_history → admin pode usar delivery_address
            // Lembre: pede item.deliveryAddress (nome, rua, cidade, estado, cep, phone)
            await supabase.from('spin_history').insert({
                user_id: user.id,
                prize_name: item.name,
                prize_type: item.type,
                prize_value: item.moneyValue || 0,
                status: 'requested',
                redemption_code: `STORE-${Math.random().toString(36).substring(7).toUpperCase()}`,
                created_at: new Date().toISOString(),
                delivery_address: item.deliveryAddress // se o item necessita envio
            });
        } else {
            // PARA PIX: CRIA NA redemption_requests (se a tabela existir) ou spin_history
            await supabase.from('spin_history').insert({
                user_id: user.id,
                prize_name: item.name,
                prize_type: item.type,
                prize_value: item.moneyValue || 0, 
                status: 'pending',
                redemption_code: `STORE-${Math.random().toString(36).substring(7).toUpperCase()}`,
                created_at: new Date().toISOString()
            });
        }
        return true;
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
          const { error: uploadError } = await supabase.storage.from('proofs').upload(fileName, file, { cacheControl: '3600', upsert: false });
          if (uploadError) throw new Error("Falha no upload.");
          const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
          return data.publicUrl;
      },
      
      // Envio de prova manual para análise de Admin
      submitProof: async (challengeId: string, proof: string) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // Apenas insere/atualiza. O status 'in_progress' indica que precisa de validação
          const { data: existing } = await supabase.from('user_challenges')
            .select('id, status').eq('user_id', user.id).eq('challenge_id', challengeId).maybeSingle();
            
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
      
      // SERVER-SIDE CHECK ACTION: O frontend apenas avisa "aconteceu isso"
      checkAction: async (actionType: string): Promise<Challenge[]> => {
          try {
              const { data, error } = await supabase.rpc('check_challenge_action', { action_name: actionType });
              if (error) {
                console.error('Erro ao verificar ação:', error);
                throw error;
              }
              console.log(`Ação '${actionType}' verificada:`, data);
              return data || [];
          } catch (e) {
              console.warn("Check action RPC failed:", e);
              return [];
          }
      },
      
      getCompletedReadyToClaim: async (): Promise<Challenge[]> => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return [];
          const { data } = await supabase.from('user_challenges').select(`*, challenges (*)`).eq('user_id', user.id).eq('status', 'completed'); 
          return data ? data.map((d: any) => d.challenges) : [];
      }
  },
  
  missions: {
      sync: async (): Promise<Mission[]> => {
          try {
              const { data, error } = await supabase.rpc('sync_user_missions');
              if (error) throw error;
              console.log('Missões sincronizadas:', data);
              return data || [];
          } catch(e) {
              console.error('Erro ao sincronizar missões:', e);
              return [];
          }
      },
      
      // Esta função chama o RPC que contém toda a lógica de reset diário/semanal
      // e verificação de recompensa. Sem lógica no frontend.
      registerVisit: async (challengeId: string) => {
          const { error } = await supabase.rpc('register_visit_action', { p_challenge_id: challengeId });
          if (error) {
              console.error("Visit RPC Error:", error);
              throw new Error("Erro ao registrar visita. Tente novamente.");
          }
      },

      claimReward: async (userChallengeId: string) => {
          const { data, error } = await supabase.rpc('claim_mission_reward', { user_challenge_id: userChallengeId });
          if(error) return { success: false, message: error.message };
          return data;
      },
      
      submitProof: async (challengeId: string, proof: string) => {
          return api.challenges.submitProof(challengeId, proof);
      },
      
      uploadProof: async (file: File) => api.challenges.uploadProof(file)
  },
  
  admin: {
      getAuditLogs: async () => {
          const { data } = await supabase.from('admin_audit').select(`*, profiles:admin_id (full_name)`).order('created_at', { ascending: false });
          return data?.map((d: any) => ({ ...d, timestamp: d.created_at, admin_name: d.profiles?.full_name || 'Admin' })) || [];
      },
      getPendingChallengeProofs: async () => {
          const { data } = await supabase.from('user_challenges').select(`*, profiles:user_id(full_name, email), challenges:challenge_id(title, reward_xp, reward_money, reward_spins)`).eq('status', 'in_progress').not('verification_proof', 'is', null);
          return data || [];
      },
      validateChallenge: async (id: string, approved: boolean) => {
          try {
              const { error } = await supabase.rpc('admin_validate_challenge', { uc_id: id, is_approved: approved });
              if (error) throw error;
          } catch (e) {
              if(!approved) {
                  await supabase.from('user_challenges').update({ status: 'pending', verification_proof: null }).eq('id', id);
              } else {
                  const { data: uc } = await supabase.from('user_challenges').select('*, challenges(*)').eq('id', id).single();
                  if(uc) {
                      await supabase.from('user_challenges').update({ status: 'claimed', progress: 100, current_value: uc.challenges.goal }).eq('id', uc.id);
                      await supabase.rpc('distribute_challenge_reward', { 
                          target_user_id: uc.user_id, 
                          r_spins: uc.challenges.reward_spins || 0,
                          r_money: uc.challenges.reward_money || 0,
                          r_xp: uc.challenges.reward_xp || 0
                      });
                  }
              }
          }
      },
      getRedemptionRequests: async (statusFilter?: string): Promise<AdminRedemptionRequest[]> => {
          let query = supabase.from('spin_history').select(`*, profiles:user_id (full_name, cpf, phone, last_ip)`).order('created_at', { ascending: false });
          if (statusFilter) query = query.eq('status', statusFilter);
          else query = query.eq('status', 'requested');

          const { data } = await query;
          return (data || []).map((item: any) => ({
              ...item, timestamp: item.created_at, prize_value: item.prize_value || 0,
              user_details: { full_name: item.profiles?.full_name || 'N/A', cpf: item.profiles?.cpf || 'N/A', phone: item.profiles?.phone || 'N/A', ip_address: item.profiles?.last_ip || 'N/A' }
          }));
      },
      updateRedemptionStatus: async (historyId: string, newStatus: string) => {
          await supabase.from('spin_history').update({ status: newStatus }).eq('id', historyId);
      },
      getUsers: async () => {
          const { data } = await supabase.from('profiles').select('*'); 
          return (data || []).map((u: any) => ({
             ...u, is_admin: u.role === 'admin', available_spins: u.spins_remaining || 0, lux_coins: u.wallet_balance || 0, wallet_balance: u.wallet_balance || 0, referral_code: u.invite_code
          }));
      },
      updateUser: async (userId: string, data: any) => {
          await supabase.from('profiles').update(data).eq('id', userId);
      },
      logAction: async (action: string, target: string, details: any) => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('admin_audit').insert({ admin_id: user.id, action, target, details });
      },
      addSpins: async (userId: string, amount: number) => {
          const { data: u } = await supabase.from('profiles').select('spins_remaining').eq('id', userId).single();
          if(u) await supabase.from('profiles').update({ spins_remaining: (u.spins_remaining || 0) + amount }).eq('id', userId);
      },
      addLuxCoins: async (userId: string, amount: number) => {
          const { data: u } = await supabase.from('profiles').select('wallet_balance').eq('id', userId).single();
          if(u) await supabase.from('profiles').update({ wallet_balance: (u.wallet_balance || 0) + amount }).eq('id', userId);
      },
      banUser: async (userId: string, status: boolean) => {
          await supabase.from('profiles').update({ banned: status }).eq('id', userId);
      },
      banIp: async (ip: string) => {
          await supabase.from('banned_ips').insert({ ip_address: ip });
      },
      getThemeConfig: async (): Promise<SystemThemeConfig> => {
          const { data } = await supabase.from('system_settings').select('value').eq('key', 'active_theme').single();
          return (data?.value as SystemThemeConfig) || { active: false, name: 'default' };
      },
      updateThemeConfig: async (config: SystemThemeConfig): Promise<void> => {
          await supabase.from('system_settings').upsert({ key: 'active_theme', value: config });
      }
  }
};
