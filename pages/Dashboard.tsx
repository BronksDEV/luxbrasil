import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Paper, Typography, LinearProgress, Chip, Button, Avatar, Snackbar, Alert } from '@mui/material';
import { History, TrendingUp, Circle, EmojiEvents } from '@mui/icons-material';
import Roulette from '../components/Roulette';
import InviteSystem from '../components/InviteSystem';
import RouletteTimer from '../components/RouletteTimer';
import { api } from '../services/api';
import { Prize, UserProfile, SpinResult, WinnerLog, Challenge } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useNavigate } from 'react-router-dom';
import { PageRoute } from '../types';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { requestPermission } = usePushNotifications();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<WinnerLog[]>([]);
  const [spinsAvailable, setSpinsAvailable] = useState(user.available_spins);
  
  // Notification State
  const [notification, setNotification] = useState<{open: boolean, message: string}>({ open: false, message: '' });

  useEffect(() => {
    requestPermission(); 
    const fetchData = async () => {
      try {
        const [prizesData, historyData] = await Promise.all([
            api.prizes.list(),
            api.game.getHistory()
        ]);
        setPrizes(prizesData);
        setHistory(historyData);
        
        // Check for updates on user data (background fetch)
        api.auth.getCurrentUser().then(u => setSpinsAvailable(u.available_spins));

        // --- GATILHOS DE DESAFIOS ---
        
        // 1. Verifica Login Diário / Frequência
        const completedLogin = await api.challenges.checkAction('login');
        
        // 2. Verifica Conquistas de Convite
        const completedInvites = await api.challenges.checkAction('check_invites');

        const allCompleted = [...completedLogin, ...completedInvites];
        
        if (allCompleted.length > 0) {
            const names = allCompleted.map(c => c.title).join(', ');
            setNotification({
                open: true,
                message: `Missão Concluída: ${names}! Resgate sua recompensa.`
            });
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSpinResult = async (result: SpinResult) => {
    setSpinsAvailable(result.remaining_spins);
    const h = await api.game.getHistory();
    setHistory(h);
    // Reload to update timer logic safely
    api.auth.getCurrentUser().then(u => setSpinsAvailable(u.available_spins));
  };
  
  if (loading) return <LinearProgress color="primary" />;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, bgcolor: '#050510' }}>
      <Grid container spacing={4}>
        
        {/* Left Column: Roulette */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ 
              p: { xs: 2, md: 6 }, 
              textAlign: 'center', 
              bgcolor: '#080808', 
              borderRadius: 4, 
              position: 'relative', 
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(0,0,0,0.8)',
              border: '1px solid rgba(212, 175, 55, 0.15)'
            }}>
             <Box sx={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
            
            <Box mb={4} mt={1}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4, fontSize: { xs: '0.7rem', md: '0.9rem' } }}>
                    {t('member_area')}
                </Typography>
                <Typography variant="h3" gutterBottom sx={{ mt: 0, color: '#FFF', fontSize: { xs: '1.8rem', md: '3rem' }, textShadow: '0 0 20px rgba(212,175,55,0.3)' }}>
                    {t('spin')}
                </Typography>
            </Box>
            
            <Roulette 
              prizes={prizes} 
              onSpinComplete={handleSpinResult} 
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
              userId={user.id}
              spinsRemaining={spinsAvailable}
            />
          </Paper>

          {/* Invite System Section */}
          <Box mt={4}>
              <InviteSystem 
                userCode={user.referral_code || '...'} 
                inviteCount={user.invite_count || 0}
                inviteEarnings={user.invite_earnings || 0}
              />
          </Box>
        </Grid>

        {/* Right Column: Status & History */}
        <Grid item xs={12} lg={4}>
            
            {/* New Status Card Component */}
            <RouletteTimer 
                timerDate={user.roulette_timer}
                spinsRemaining={spinsAvailable}
            />

            {/* Recent History - Redesigned */}
            <Paper sx={{ 
                bgcolor: '#0F121D', 
                borderRadius: 4, 
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <History sx={{ color: '#D4AF37' }} />
                        <Typography variant="subtitle1" fontWeight={700} color="#FFF">
                            {t('recent_activity')}
                        </Typography>
                    </Box>
                    <TrendingUp sx={{ color: 'rgba(255,255,255,0.2)' }} />
                </Box>

                <Box>
                    {history.slice(0, 6).map((h, index) => (
                        <Box key={h.id} sx={{ 
                            p: 2, 
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'background 0.2s',
                            '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.05)' }
                        }}>
                            {/* Icon Indicator */}
                            <Box sx={{ 
                                width: 36, height: 36, 
                                borderRadius: '50%', 
                                bgcolor: h.prize_type === 'spins' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                                color: h.prize_type === 'spins' ? '#4CAF50' : '#D4AF37',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Circle sx={{ fontSize: 12 }} />
                            </Box>

                            <Box flexGrow={1}>
                                <Typography variant="body2" color="#FFF" fontWeight={600}>
                                    {h.prize_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                    {new Date(h.timestamp).toLocaleDateString()} • {new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Typography>
                            </Box>

                            <Chip 
                                label={t(`status_${h.status}`)} 
                                size="small" 
                                sx={{ 
                                    height: 20, 
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                    bgcolor: h.status === 'redeemed' ? '#4CAF50' : 'rgba(255,255,255,0.1)',
                                    color: h.status === 'redeemed' ? '#000' : '#AAA',
                                    borderRadius: 1
                                }} 
                            />
                        </Box>
                    ))}
                    {history.length === 0 && (
                        <Box p={4} textAlign="center">
                            <Typography variant="caption" color="text.secondary">Nenhuma atividade recente.</Typography>
                        </Box>
                    )}
                </Box>
                
                <Box p={2} textAlign="center" sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Button 
                        size="small" 
                        sx={{ color: '#D4AF37', fontSize: '0.75rem' }} 
                        onClick={() => navigate(PageRoute.MY_PRIZES)}
                    >
                        VER HISTÓRICO COMPLETO
                    </Button>
                </Box>
            </Paper>

        </Grid>
      </Grid>
      
      {/* NOTIFICATION SNACKBAR */}
      <Snackbar 
          open={notification.open} 
          autoHideDuration={6000} 
          onClose={() => setNotification({...notification, open: false})}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
          <Alert 
              onClose={() => setNotification({...notification, open: false})} 
              severity="success" 
              icon={<EmojiEvents fontSize="inherit" />}
              sx={{ 
                  width: '100%', 
                  bgcolor: '#D4AF37', 
                  color: '#000', 
                  fontWeight: 800,
                  boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)'
              }}
          >
              {notification.message}
          </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;