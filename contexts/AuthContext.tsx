
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';

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
            // Atualiza os dados do usuário silenciosamente
            const u = await api.auth.getCurrentUser();
            setUser(u);
        } catch (e: any) {
            // Ignora erro de sessão inexistente (visitante), loga apenas outros erros reais
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
                // Erros já são tratados dentro do refreshUser
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

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
