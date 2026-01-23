import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import MyPrizes from './pages/MyPrizes';
import Challenges from './pages/Challenges';
import Vault from './pages/Vault'; 
import Legal from './pages/Legal';
import Admin from './pages/Admin';
import Register from './pages/Register';
import Login from './pages/Login';
import SupportAvatar from './components/SupportAvatar';
import { PageRoute } from './types';
import { LanguageProvider } from './hooks/useLanguage';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { user, loading, logout, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('error=')) {
        const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;
        const params = new URLSearchParams(cleanHash);
        const errorDesc = params.get('error_description');
        const errorCode = params.get('error_code');

        if (errorCode || errorDesc) {
            console.error("Supabase Auth Redirect Error:", errorCode, errorDesc);
            navigate(PageRoute.LOGIN);
            localStorage.setItem('auth_error', decodeURIComponent(errorDesc || 'Erro desconhecido na autenticação.'));
        }
    }
  }, [navigate]);

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
            <Navigation user={user} onLogout={logout} />
            <Box component="main" flexGrow={1}>
                <Routes>
                    <Route path={PageRoute.HOME} element={!user ? <Landing /> : <Navigate to={PageRoute.DASHBOARD} />} />
                    <Route path={PageRoute.LOGIN} element={<Login setUser={setUser} />} />
                    <Route path={PageRoute.REGISTER} element={<Register setUser={setUser} />} />
                    <Route path={PageRoute.DASHBOARD} element={user ? <Dashboard user={user} /> : <Navigate to={PageRoute.LOGIN} />} />
                    <Route path={PageRoute.MY_PRIZES} element={user ? <MyPrizes /> : <Navigate to={PageRoute.LOGIN} />} />
                    <Route path={PageRoute.CHALLENGES} element={user ? <Challenges /> : <Navigate to={PageRoute.LOGIN} />} />
                    <Route path={PageRoute.VAULT} element={user ? <Vault /> : <Navigate to={PageRoute.LOGIN} />} />
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