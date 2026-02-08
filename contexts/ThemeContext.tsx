
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemThemeConfig } from '../types';
import { api } from '../services/api';

interface ThemeContextType {
  themeConfig: SystemThemeConfig;
  setThemeConfig: (config: SystemThemeConfig) => void;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const CustomThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeConfig, setThemeConfigState] = useState<SystemThemeConfig>({ active: false, name: 'default' });

  const refreshTheme = async () => {
    try {
      const config = await api.admin.getThemeConfig();
      setThemeConfigState(config);
    } catch (e) {
      console.error("Failed to load theme config", e);
    }
  };

  const setThemeConfig = (config: SystemThemeConfig) => {
      setThemeConfigState(config);
  };

  useEffect(() => {
    refreshTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ themeConfig, setThemeConfig, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeConfig = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeConfig must be used within CustomThemeProvider');
  return context;
};
