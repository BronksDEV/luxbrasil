import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import MyPrizes from './pages/MyPrizes';
import Challenges from './pages/Challenges';
import Legal from './pages/Legal';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Login from './pages/Login';
import SupportAvatar from './components/SupportAvatar';
import { PageRoute, UserProfile } from './types';
import { api } from './services/api';
import { LanguageProvider } from './hooks/useLanguage';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
        try {
            const u = await api.auth.getCurrentUser();
            setUser(u);
        } catch (e) {
        } finally {
            setLoading(false);
        }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  if (loading) {
      return (
          <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#050510' }}>
              <CircularProgress color="primary" />
          </Box>
      )
  }

  return (
    <LanguageProvider>
        <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="#050510" color="white">
            <Navigation user={user} onLogout={handleLogout} />
            <Box component="main" flexGrow={1}>
                <Routes>
                    <Route path={PageRoute.HOME} element={!user ? <Landing /> : <Navigate to={PageRoute.DASHBOARD} />} />
                    <Route path={PageRoute.LOGIN} element={<Login setUser={setUser} />} />
                    <Route path={PageRoute.REGISTER} element={<Register setUser={setUser} />} />
                    <Route path={PageRoute.DASHBOARD} element={user ? <Dashboard user={user} /> : <Navigate to={PageRoute.LOGIN} />} />
                    <Route path={PageRoute.MY_PRIZES} element={user ? <MyPrizes /> : <Navigate to={PageRoute.LOGIN} />} />
                    <Route path={PageRoute.CHALLENGES} element={user ? <Challenges /> : <Navigate to={PageRoute.LOGIN} />} />
                    <Route path={PageRoute.ADMIN} element={user?.is_admin ? <Admin /> : <Navigate to={PageRoute.HOME} />} />
                    <Route path={PageRoute.LEGAL_PRIVACY} element={<Legal type={PageRoute.LEGAL_PRIVACY} />} />
                    <Route path={PageRoute.LEGAL_TERMS} element={<Legal type={PageRoute.LEGAL_TERMS} />} />
                    <Route path={PageRoute.LEGAL_DATA} element={<Legal type={PageRoute.LEGAL_DATA} />} />
                </Routes>
            </Box>
            <SupportAvatar />
            <Footer />
        </Box>
    </LanguageProvider>
  );
};

export default App;