
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
        try {

            const u = await api.auth.getCurrentUser();
            setUser(u);
        } catch (e: any) {
            if (e.message === "Sem sessão ativa." || e.message?.includes("Auth session missing")) {
                return;
            }
            console.error("Failed to refresh user data", e);
        }
    };

    const logout = async () => {
        await api.auth.logout();
        setUser(null);
    };

    useEffect(() => {
        const init = async () => {
            try {
                await refreshUser();
            } catch (e) {
                // Erros tratados no refreshUser
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // --- REALTIME LISTENER + POLLING ---
    useEffect(() => {
        if (!user) return;

        // 1. WebSocket Realtime (Instantâneo)
        const channel = supabase
            .channel(`profile-updates-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`
                },
                (payload) => {
                    const newData = payload.new;
                    
                    setUser((currentUser) => {
                        if (!currentUser) return null;
                        return {
                            ...currentUser,
                            available_spins: newData.spins_remaining ?? currentUser.available_spins,
                            lux_coins: newData.wallet_balance ?? currentUser.lux_coins,
                            wallet_balance: newData.wallet_balance ?? currentUser.wallet_balance,
                            xp: newData.xp ?? currentUser.xp,
                            invite_count: newData.invite_count ?? currentUser.invite_count,
                            is_banned: newData.banned ?? currentUser.is_banned
                        };
                    });
                }
            )
            .subscribe();

        // 2. Fallback Polling (Garantia a cada 10s)
        const interval = setInterval(() => {
            refreshUser();
        }, 10000); 

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, [user?.id]); // Recria apenas se o ID do usuário mudar (login/logout)

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