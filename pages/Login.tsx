import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Link, InputAdornment, IconButton, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { PageRoute, UserProfile } from '../types';
import { Visibility, VisibilityOff, TheaterComedy } from '@mui/icons-material'; 
import { useThemeConfig } from '../contexts/ThemeContext';

interface LoginProps {
  setUser: (user: UserProfile) => void;
}

const fireConfetti = () => {
    const colors = ['#FFD700', '#9C27B0', '#00E676', '#E040FB'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9999';
    document.body.appendChild(container);

    for (let i = 0; i < 100; i++) {
        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.width = '10px';
        el.style.height = '10px';
        el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        el.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 200 + Math.random() * 300;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        el.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
        ], {
            duration: 1000 + Math.random() * 1000,
            easing: 'cubic-bezier(0, .9, .57, 1)',
            fill: 'forwards'
        });
        container.appendChild(el);
    }
    
    setTimeout(() => container.remove(), 2500);
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
      
      if (isCarnival) {
          fireConfetti();
          setTimeout(() => {
              setUser(user);
              navigate(PageRoute.DASHBOARD);
          }, 800);
      } else {
          setUser(user);
          navigate(PageRoute.DASHBOARD);
      }

    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Perfil não encontrado')) {
          setError("Erro de permissão ou conta incompleta. Contate o suporte.");
      } else if (err.message.includes('No API key found')) {
          setError("Erro interno de conexão. Tente atualizar a página.");
      } else {
          setError(err.message || "Credenciais inválidas.");
      }
      setLoading(false); // Garante que pare de girar em caso de erro
    } finally {
      // Se não for carnaval (que tem delay), libera o loading imediatamente se não tiver navegado
      if(!isCarnival && error) setLoading(false);
    }
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
      {/* Background Elements */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050510 100%)', zIndex: 2 }} />
          {isCarnival && (
              <>
                <Box sx={{ position: 'absolute', top: '10%', left: '5%', opacity: 0.4, animation: 'float-slow 6s infinite ease-in-out' }}>
                    <TheaterComedy sx={{ fontSize: 100, color: '#9C27B0' }} />
                </Box>
                <Box sx={{ position: 'absolute', bottom: '10%', right: '5%', opacity: 0.4, animation: 'float-slow 8s infinite ease-in-out reverse' }}>
                    <TheaterComedy sx={{ fontSize: 120, color: '#00E676', transform: 'rotate(180deg)' }} />
                </Box>
              </>
          )}
          <Box sx={{ 
              position: 'absolute', top: '-30%', left: '-10%', 
              width: '60vw', height: '60vw', 
              background: isCarnival ? 'radial-gradient(circle, rgba(156, 39, 176, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', 
              filter: 'blur(80px)', animation: 'float-slow 15s infinite alternate' 
          }} />
      </Box>

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <Paper elevation={0} sx={{ 
            p: { xs: 4, sm: 5 }, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.02)', 
            border: isCarnival ? '1px solid rgba(156, 39, 176, 0.3)' : '1px solid rgba(212, 175, 55, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: isCarnival ? '0 0 50px rgba(156, 39, 176, 0.3)' : '0 20px 80px rgba(0,0,0,0.6)',
            animation: isCarnival ? 'neon-pulse 3s infinite' : 'none'
        }}>
          
          <Box textAlign="center" mb={4}>
            <Box sx={{ mb: 2, display: 'inline-block', p: 2, borderRadius: '50%', border: isCarnival ? '1px solid #00E676' : '1px solid rgba(212, 175, 55, 0.3)', bgcolor: 'rgba(0,0,0,0.4)', animation: 'sway 3s infinite ease-in-out' }}>
                {isCarnival ? (
                    <TheaterComedy sx={{ color: '#E040FB', fontSize: 40 }} /> 
                ) : (
                    <img src="/logo.png" alt="Lux" style={{ height: 40, width: 40, objectFit: 'contain' }} /> 
                )}
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4, display: 'block' }}>
                BEM-VINDO
            </Typography>
            <Typography variant="h4" className="logo-shimmer" sx={{ fontFamily: 'Montserrat', fontWeight: 800, mt: 1, textTransform: 'uppercase' }}>
                {t('login')}
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
              sx={{ 
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' },
                  '& label': { color: '#888' },
                  '& input': { color: '#FFF' }
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              label={t('pass_label')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                  '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' },
                  '& label': { color: '#888' },
                  '& input': { color: '#FFF' }
              }}
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
                <Link href="#" color="primary" underline="hover" variant="caption" sx={{ letterSpacing: 0.5 }}>
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
      </Container>
    </Box>
  );
};

export default Login;