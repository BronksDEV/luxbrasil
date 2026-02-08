import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api, supabase } from '../services/api';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
    setUser: (user: UserProfile | null) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                setUser(null);
                setLoading(false);
                return;
            }

            // 1. Processa Login Diário
            let loginCheck = null;
            try {
                loginCheck = await api.auth.processDailyLogin();
            } catch (err) {
                console.warn("Falha silenciosa no login diário:", err);
            }
            
            // 2. Verifica Missões
            if (loginCheck && loginCheck.new_day) {
                try {
                    await api.challenges.checkAction('login');
                } catch (err) {
                    console.warn('Erro não-bloqueante missão login:', err);
                }
            }

            // 3. Busca perfil
            const u = await api.auth.getCurrentUser();
            setUser(u);
        } catch (e: any) {
            console.error("Auth refresh failed", e);
            if (e.message?.includes('session') || e.message?.includes('JWT')) {
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await api.auth.logout();
        setUser(null);
    };

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session && mounted) {
                    await refreshUser();
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Auth init error", e);
                setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                if (session) await refreshUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // REALTIME LISTENER OTIMIZADO
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`public:profiles:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    const newData = payload.new;
                    
                    setUser((currentUser) => {
                        if (!currentUser) return null;

                        // Verifica se houve mudança real nos valores importantes
                        // para evitar criar um novo objeto e disparar re-render sem necessidade
                        const hasChanges = 
                            currentUser.available_spins !== newData.spins_remaining ||
                            currentUser.lux_coins !== newData.wallet_balance ||
                            currentUser.wallet_balance !== newData.wallet_balance ||
                            currentUser.xp !== newData.xp ||
                            currentUser.is_banned !== newData.banned ||
                            currentUser.invite_count !== newData.invite_count ||
                            currentUser.invite_earnings !== newData.invite_earnings;

                        if (!hasChanges) return currentUser; // Retorna a mesma referência, React não re-renderiza

                        return {
                            ...currentUser,
                            available_spins: newData.spins_remaining ?? currentUser.available_spins,
                            lux_coins: newData.wallet_balance ?? currentUser.lux_coins,
                            wallet_balance: newData.wallet_balance ?? currentUser.wallet_balance,
                            xp: newData.xp ?? currentUser.xp,
                            is_banned: newData.banned ?? currentUser.is_banned,
                            invite_count: newData.invite_count ?? currentUser.invite_count,
                            invite_earnings: newData.invite_earnings ?? currentUser.invite_earnings
                        };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]); // Apenas recria o listener se o ID do usuário mudar

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};