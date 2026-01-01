import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, Link, InputAdornment, IconButton, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { PageRoute, UserProfile } from '../types';
import { Visibility, VisibilityOff, Star } from '@mui/icons-material';

interface LoginProps {
  setUser: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ setUser }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await api.auth.login(email, password);
      setUser(user);
      navigate(PageRoute.DASHBOARD);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Credenciais inválidas ou erro de conexão.");
    } finally {
      setLoading(false);
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
      {/* Animated Background Elements */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050510 100%)', zIndex: 2 }} />
          <Box sx={{ 
              position: 'absolute', top: '-30%', left: '-10%', 
              width: '60vw', height: '60vw', 
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)', 
              filter: 'blur(80px)', animation: 'float-slow 15s infinite alternate' 
          }} />
          <Box sx={{ 
              position: 'absolute', bottom: '-20%', right: '-10%', 
              width: '50vw', height: '50vw', 
              background: 'radial-gradient(circle, rgba(170, 140, 44, 0.08) 0%, transparent 70%)', 
              filter: 'blur(80px)', animation: 'float-slow 20s infinite alternate-reverse' 
          }} />
      </Box>

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 10 }}>
        <Paper elevation={0} sx={{ 
            p: { xs: 4, sm: 5 }, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
        }}>
          
          <Box textAlign="center" mb={4}>
            <Box sx={{ mb: 2, display: 'inline-block', p: 1, borderRadius: '50%', border: '1px solid rgba(212, 175, 55, 0.3)', bgcolor: 'rgba(0,0,0,0.4)' }}>
                <Star sx={{ color: '#D4AF37', fontSize: 30 }} />
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4, display: 'block' }}>
                BEM-VINDO
            </Typography>
            <Typography variant="h4" className="logo-shimmer" sx={{ fontFamily: 'Montserrat', fontWeight: 800, mt: 1, textTransform: 'uppercase' }}>
                {t('login')}
            </Typography>
          </Box>

          {error && <Alert severity="error" variant="filled" sx={{ mb: 3, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2', border: '1px solid rgba(244, 67, 54, 0.3)' }}>{error}</Alert>}

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
                <Link href="#" color="#D4AF37" underline="hover" variant="caption" sx={{ letterSpacing: 0.5 }}>
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
                  background: 'linear-gradient(90deg, #D4AF37, #AA8C2C)',
                  color: '#000',
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)'
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
      <style>
          {`
            @keyframes float-slow {
                0% { transform: translate(0, 0); }
                100% { transform: translate(20px, -20px); }
            }
          `}
      </style>
    </Box>
  );
};

export default Login;