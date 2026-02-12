
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Link, InputAdornment, IconButton, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { PageRoute, UserProfile } from '../types';
import { Visibility, VisibilityOff, TheaterComedy } from '@mui/icons-material';
import { useThemeConfig } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

interface LoginProps {
  setUser: (user: UserProfile) => void;
}

const fireConfetti = () => {
    // ... (implementation remains the same)
};

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const { t } = useLanguage();
  const { themeConfig } = useThemeConfig();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  useEffect(() => {
    const storedError = localStorage.getItem('auth_error');
    if (storedError) {
        if (storedError.includes('unexpected_failure') || storedError.includes('Database error')) {
            setError("Ocorreu um conflito ao criar sua conta. Tente fazer login ou contate o suporte.");
        } else {
            setError(storedError);
        }
        localStorage.removeItem('auth_error');
        return;
    }

    const hash = location.hash;
    if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.replace('#', '?'));
        const errorDesc = params.get('error_description');
        if (errorDesc) setError(decodeURIComponent(errorDesc));
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await api.auth.login(email, password);
      setUser(user);
      
      if (isCarnival) {
          fireConfetti();
          setTimeout(() => navigate(PageRoute.DASHBOARD), 800);
      } else {
          navigate(PageRoute.DASHBOARD);
      }

    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Perfil não encontrado')) {
          setError("Erro de permissão. Contate o administrador.");
      } else if (err.message.includes('No API key found')) {
          setError("Erro interno de conexão. Tente atualizar a página.");
      } else {
          setError(err.message || "Credenciais inválidas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
      '& .MuiOutlinedInput-root': { 
          bgcolor: 'rgba(0,0,0,0.3)',
          '& fieldset': { borderColor: 'rgba(212, 175, 55, 0.2)' },
          '&:hover fieldset': { borderColor: 'rgba(212, 175, 55, 0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
      },
      '& label': { color: '#888' },
      '& label.Mui-focused': { color: '#D4AF37' },
      '& input': { color: '#FFF' }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center', 
      position: 'relative',
      overflow: 'hidden',
      bgcolor: '#050510'
    }}>
      {/* Background Video */}
      <video
          autoPlay
          loop
          muted
          playsInline
          style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              opacity: 0.3
          }}
          src="/videos/gold-particles.mp4"
      />
      <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 0%, #050510 80%)', zIndex: 1 }} />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        <Paper elevation={0} sx={{ 
            p: { xs: 4, sm: 5 }, 
            borderRadius: 4, 
            bgcolor: 'rgba(5, 5, 16, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
        }}>
          
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" className="logo-shimmer" sx={{ fontFamily: 'Montserrat', fontWeight: 900, letterSpacing: 2, mb: 1 }}>
                LUX BRASIL
            </Typography>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4 }}>
                BEM-VINDO DE VOLTA
            </Typography>
          </Box>

          {error && <Alert severity="error" variant="filled" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="E-mail"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
              sx={inputStyle}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label={t('pass_label')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={inputStyle}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#888' }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box textAlign="right" mt={1} mb={4}>
                <Link href="#" color="primary" underline="hover" variant="caption" sx={{ letterSpacing: 0.5, color: '#888', '&:hover': { color: '#D4AF37' } }}>
                    {t('forgot_pass')}
                </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ 
                  py: 1.8, 
                  fontSize: '1rem', 
                  fontWeight: 800,
                  borderRadius: 50,
                  color: '#000',
                  boxShadow: '0 0 20px rgba(0,0,0,0.3)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('login').toUpperCase()}
            </Button>
            
            <Box mt={5} textAlign="center" borderTop="1px solid rgba(255,255,255,0.05)" pt={3}>
              <Typography variant="body2" color="text.secondary">
                 {t('not_member')}
              </Typography>
              <Button onClick={() => navigate(PageRoute.REGISTER)} sx={{ mt: 1, color: '#FFF', fontWeight: 700, '&:hover': { color: '#D4AF37' } }}>
                {t('getStarted')}
              </Button>
            </Box>
          </Box>
        </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;
