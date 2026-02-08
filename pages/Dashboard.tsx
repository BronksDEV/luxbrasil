import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, LinearProgress, Chip, Button, Snackbar, Alert, useMediaQuery, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { History, TrendingUp, Circle, EmojiEvents, Diamond, Star, Bolt } from '@mui/icons-material';
import Roulette from '../components/Roulette';
import InviteSystem from '../components/InviteSystem';
import RouletteTimer from '../components/RouletteTimer';
import { api } from '../services/api';
import { Prize, UserProfile, SpinResult, WinnerLog } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useNavigate } from 'react-router-dom';
import { PageRoute } from '../types';
import { useThemeConfig } from '../contexts/ThemeContext';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { requestPermission } = usePushNotifications();
  const theme = useTheme();
  const { themeConfig } = useThemeConfig();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<WinnerLog[]>([]);
  const [spinsAvailable, setSpinsAvailable] = useState(user.available_spins);
  
  const [notification, setNotification] = useState<{open: boolean, message: string}>({ open: false, message: '' });

  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  useEffect(() => {
    setSpinsAvailable(user.available_spins);
  }, [user.available_spins]);

  const isWinningLog = (log: WinnerLog) => true;

  useEffect(() => {
    requestPermission(); 
    const fetchData = async () => {
      try {
        const [prizesData, historyData] = await Promise.all([
            api.prizes.list(),
            api.game.getHistory()
        ]);
        setPrizes(prizesData);
        setHistory(historyData.filter(isWinningLog));
        
        // REMOVIDO: processDailyLogin e checkAction('login')
        // Motivo: Essas funções já são chamadas no AuthContext/Login.
        // Chamá-las aqui disparava o Realtime Listener, causando Loop Infinito.

        // Apenas verifica se há missões PRONTAS para resgatar (visualização)
        const approvedChallenges = await api.challenges.getCompletedReadyToClaim();
        
        if (approvedChallenges.length > 0) {
             setNotification({
                open: true,
                message: t('notification_missions_approved', { count: approvedChallenges.length })
            });
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]); // Dependências reduzidas para evitar re-execução

  const handleSpinResult = async (result: SpinResult) => {
    setSpinsAvailable(result.remaining_spins);
    const h = await api.game.getHistory();
    setHistory(h.filter(isWinningLog));
    // AuthContext via Realtime atualizará o user global automaticamente
  };
  
  const xp = user.xp || 0;
  const currentLevel = Math.min(Math.floor(xp / 1000) + 1, 15);
  const nextLevelXp = currentLevel * 1000;
  const prevLevelXp = (currentLevel - 1) * 1000;
  const progress = Math.min(((xp - prevLevelXp) / 1000) * 100, 100);

  let borderColor = '#C0C0C0';
  let levelName = t('level_silver');
  
  if (currentLevel >= 6 && currentLevel <= 10) {
      borderColor = '#D4AF37';
      levelName = t('level_gold');
  } else if (currentLevel >= 11) {
      borderColor = '#E5E4E2';
      levelName = t('level_platinum');
  }

  // Theme Override
  if (isCarnival) {
      borderColor = '#9C27B0'; // Purple for all in Carnival mode
  }

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, bgcolor: '#050510' }}>
      <Grid container spacing={4}>
        
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ 
              p: { xs: 2, md: 4 }, 
              textAlign: 'center', 
              bgcolor: '#080808', 
              borderRadius: 4, 
              position: 'relative', 
              overflow: 'hidden',
              boxShadow: isCarnival ? '0 0 50px rgba(156, 39, 176, 0.4)' : '0 0 50px rgba(0,0,0,0.8)',
              border: isCarnival ? '1px solid #9C27B0' : '1px solid rgba(212, 175, 55, 0.15)'
            }}>
             <Box sx={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: isCarnival ? 'linear-gradient(90deg, transparent, #9C27B0, transparent)' : 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
            
            <Box mb={2} mt={1}>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4, fontSize: { xs: '0.7rem', md: '0.8rem' } }}>
                    {t('member_area')}
                </Typography>
                <Typography variant="h4" gutterBottom sx={{ mt: 0, color: '#FFF', fontSize: { xs: '1.5rem', md: '2.2rem' }, textShadow: isCarnival ? '0 0 20px rgba(156, 39, 176, 0.3)' : '0 0 20px rgba(212,175,55,0.3)' }}>
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

          {!isDesktop && (
            <Box mt={4}>
                <RouletteTimer 
                    timerDate={user.roulette_timer}
                    spinsRemaining={spinsAvailable}
                />
            </Box>
          )}

          <Box mt={{ xs: 4, md: 6 }}>
              <InviteSystem 
                userCode={user.referral_code || '...'} 
                inviteCount={user.invite_count || 0}
                inviteEarnings={user.invite_earnings || 0}
              />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
            
            <Paper sx={{ 
                p: 3, 
                mb: 4, 
                bgcolor: '#0F121D', 
                borderRadius: 4, 
                border: `1px solid ${borderColor}`,
                boxShadow: `0 0 15px ${borderColor}40`, 
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="overline" color="text.secondary" fontWeight={700}>{t('level_label', { level: currentLevel })}</Typography>
                    <Chip 
                        label={levelName} 
                        sx={{ 
                            bgcolor: borderColor,
                            color: '#000',
                            fontWeight: 900,
                            border: '1px solid rgba(255,255,255,0.2)'
                        }} 
                    />
                </Box>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Star sx={{ color: borderColor }} />
                    <Typography variant="h5" fontWeight={800} color="white">{xp} XP</Typography>
                </Box>
                <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                        height: 8, 
                        borderRadius: 4, 
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': { bgcolor: borderColor }
                    }} 
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {t('next_level', { xp: nextLevelXp })}
                </Typography>
            </Paper>

            {isDesktop && (
                <Box mb={4}>
                    <RouletteTimer 
                        timerDate={user.roulette_timer}
                        spinsRemaining={spinsAvailable}
                    />
                </Box>
            )}

            <Paper sx={{ 
                mt: isDesktop ? 0 : 4,
                bgcolor: '#0F121D', 
                borderRadius: 4, 
                border: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <History sx={{ color: isCarnival ? '#9C27B0' : '#D4AF37' }} />
                        <Typography variant="subtitle1" fontWeight={700} color="#FFF">
                            {t('recent_activity')}
                        </Typography>
                    </Box>
                    <TrendingUp sx={{ color: 'rgba(255,255,255,0.2)' }} />
                </Box>

                <Box>
                    {history.slice(0, 6).map((h) => (
                        <Box key={h.id} sx={{ 
                            p: 2, 
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'background 0.2s',
                            '&:hover': { bgcolor: isCarnival ? 'rgba(156, 39, 176, 0.05)' : 'rgba(212, 175, 55, 0.05)' }
                        }}>
                            <Box sx={{ 
                                width: 36, height: 36, 
                                borderRadius: '50%', 
                                bgcolor: h.prize_type === 'money' ? (isCarnival ? 'rgba(156, 39, 176, 0.1)' : 'rgba(212, 175, 55, 0.1)') : 'rgba(76, 175, 80, 0.1)',
                                color: h.prize_type === 'money' ? (isCarnival ? '#9C27B0' : '#D4AF37') : '#4CAF50',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {h.prize_type === 'money' ? <Diamond sx={{ fontSize: 14 }} /> : <Circle sx={{ fontSize: 12 }} />}
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
                            <Typography variant="caption" color="text.secondary">{t('no_activity')}</Typography>
                        </Box>
                    )}
                </Box>
                
                <Box p={2} textAlign="center" sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
                    <Button 
                        size="small" 
                        sx={{ color: isCarnival ? '#9C27B0' : '#D4AF37', fontSize: '0.75rem' }} 
                        onClick={() => navigate(PageRoute.MY_PRIZES)}
                    >
                        {t('view_all')}
                    </Button>
                </Box>
            </Paper>

        </Grid>
      </Grid>
      
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
                  bgcolor: isCarnival ? '#9C27B0' : '#D4AF37', 
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