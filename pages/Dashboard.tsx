import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Container, Paper, Typography, Chip, Button, Snackbar, Alert, useMediaQuery, Grid, CircularProgress, ListItem, ListItemText, Stack, Divider, ListItemIcon } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { History, TrendingUp, EmojiEvents, Diamond, Star, MilitaryTech, Bolt, CardGiftcard } from '@mui/icons-material';
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
import { gsap } from 'gsap';
import '../components/MagicBento.css';
import { calculateLevelInfo } from '../utils/levelsystem';

// --- HELPERS & COMPONENTES PARA EFEITO SPOTLIGHT ---

const calculateSpotlightValues = (radius: number) => ({
  proximity: radius * 0.5,
  fadeDistance: radius * 0.75
});

const updateCardGlowProperties = (card: HTMLElement, mouseX: number, mouseY: number, glow: number, radius: number) => {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;

  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', glow.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
};

const GlobalSpotlight: React.FC<{
  gridRef: React.RefObject<HTMLDivElement | null>;
  disableAnimations?: boolean;
  enabled?: boolean;
  spotlightRadius?: number;
  glowColor?: string;
}> = ({
  gridRef,
  disableAnimations = false,
  enabled = true,
  spotlightRadius = 400,
  glowColor = '212, 175, 55'
}) => {
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const isInsideSection = useRef(false);

  useEffect(() => {
    if (disableAnimations || !gridRef?.current || !enabled) return;

    const spotlight = document.createElement('div');
    spotlight.className = 'global-spotlight';
    spotlight.style.cssText = `
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${glowColor}, 0.15) 0%,
        rgba(${glowColor}, 0.08) 15%,
        rgba(${glowColor}, 0.04) 25%,
        rgba(${glowColor}, 0.02) 40%,
        rgba(${glowColor}, 0.01) 65%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
    document.body.appendChild(spotlight);
    spotlightRef.current = spotlight;

    const handleMouseMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !gridRef.current) return;

      const section = gridRef.current.closest('.bento-section');
      const rect = section?.getBoundingClientRect();
      const mouseInside =
        rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;

      isInsideSection.current = mouseInside || false;
      const cards = gridRef.current.querySelectorAll('.magic-bento-card');

      if (!mouseInside) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
        cards.forEach(card => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
        return;
      }

      const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);
      let minDistance = Infinity;

      cards.forEach(card => {
        const cardElement = card as HTMLElement;
        const cardRect = cardElement.getBoundingClientRect();
        const centerX = cardRect.left + cardRect.width / 2;
        const centerY = cardRect.top + cardRect.height / 2;
        const distance =
          Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2;
        const effectiveDistance = Math.max(0, distance);

        minDistance = Math.min(minDistance, effectiveDistance);

        let glowIntensity = 0;
        if (effectiveDistance <= proximity) {
          glowIntensity = 1;
        } else if (effectiveDistance <= fadeDistance) {
          glowIntensity = (fadeDistance - effectiveDistance) / (fadeDistance - proximity);
        }

        updateCardGlowProperties(cardElement, e.clientX, e.clientY, glowIntensity, spotlightRadius);
      });

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        duration: 0.1,
        ease: 'power2.out'
      });

      const targetOpacity =
        minDistance <= proximity
          ? 0.8
          : minDistance <= fadeDistance
            ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
            : 0;

      gsap.to(spotlightRef.current, {
        opacity: targetOpacity,
        duration: targetOpacity > 0 ? 0.2 : 0.5,
        ease: 'power2.out'
      });
    };

    const handleMouseLeave = () => {
      isInsideSection.current = false;
      gridRef.current?.querySelectorAll('.magic-bento-card').forEach(card => {
        (card as HTMLElement).style.setProperty('--glow-intensity', '0');
      });
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current!);
    };
  }, [gridRef, disableAnimations, enabled, spotlightRadius, glowColor]);

  return null;
};

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
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<WinnerLog[]>([]);
  const [spinsAvailable, setSpinsAvailable] = useState(user.available_spins);
  
  const [notification, setNotification] = useState<{open: boolean, message: string}>({ open: false, message: '' });

  const effectContainerRef = useRef<HTMLDivElement>(null);
  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  useEffect(() => {
    setSpinsAvailable(user.available_spins);
  }, [user.available_spins]);

  // Lógica de filtro consistente com a página MyPrizes
  const isWinningLog = (log: WinnerLog) => {
      const name = log.prize_name.toLowerCase();
      // Se o nome contiver termos de perda, não exibe
      if (name.includes('tente') || name.includes('tnt') || name.includes('não foi')) return false;
      // Se o valor for 0 e não for físico (ex: mensagem de sistema), ignora
      if ((!log.prize_value || log.prize_value <= 0) && log.prize_type !== 'physical') return false;
      return true;
  };

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
        
        const freshUser = await api.auth.getCurrentUser();
        if (freshUser) {
          setSpinsAvailable(freshUser.available_spins);
        }

        // await api.auth.processDailyLogin();
        // const completedLogin = await api.challenges.checkAction('login');
        const completedInvites = await api.challenges.checkAction('check_invites');
        const approvedChallenges = await api.challenges.getCompletedReadyToClaim();

        const allCompleted = [...completedInvites];
        
        if (approvedChallenges.length > 0) {
             setNotification({
                open: true,
                message: t('notification_missions_approved', { count: approvedChallenges.length })
            });
        } else if (allCompleted.length > 0) {
            const names = allCompleted.map(c => c.title).join(', ');
            setNotification({
                open: true,
                message: t('notification_mission_completed', { name: names })
            });
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleSpinResult = async (result: SpinResult) => {
    setSpinsAvailable(result.remaining_spins);
    const h = await api.game.getHistory();
    setHistory(h.filter(isWinningLog));
    api.auth.getCurrentUser().then(u => {
      if (u) {
        setSpinsAvailable(u.available_spins);
      }
    });
  };
  
  const levelInfo = calculateLevelInfo(user.xp || 0);
  const { level: currentLevel, tierInfo, progress, xpToNextLevel } = levelInfo;
  const levelName = t(tierInfo.nameKey);
  let borderColor = tierInfo.color;

  // Theme Override
  if (isCarnival) {
      borderColor = '#9C27B0'; // Purple for all in Carnival mode
  }

  const getPrizeIcon = (type: WinnerLog['prize_type']) => {
    switch (type) {
      case 'money': return <Diamond />;
      case 'spins': return <MilitaryTech />;
      case 'physical': return <CardGiftcard />;
      default: return <Star />;
    }
  };


  if (loading) return <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress color="primary" /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 }, bgcolor: '#050510' }}>
      <GlobalSpotlight
          gridRef={effectContainerRef}
          enabled={!isMobile}
          spotlightRadius={400}
          glowColor={isCarnival ? "156, 39, 176" : "212, 175, 55"}
      />
      
      {/* --- HERO HEADER --- */}
      <Box mb={4} px={{ xs: 1, md: 2 }}>
          <Typography variant="h5" color="text.secondary" fontWeight={300}>
              Olá, <Typography component="span" variant="h5" color="#FFF" fontWeight={700}>{user.full_name.split(' ')[0]}!</Typography>
          </Typography>
          <Typography variant="body1" color="text.secondary">
              Sua jornada de prêmios continua aqui.
          </Typography>
      </Box>

      <Box ref={effectContainerRef} className="bento-section">
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
                      className="magic-bento-card magic-bento-card--border-glow"
                      timerDate={user.roulette_timer}
                      spinsRemaining={spinsAvailable}
                  />
              </Box>
            )}

            <Box mt={{ xs: 4, md: 6 }}>
                <InviteSystem />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
              
              {/* --- PAINEL VIP (REFORMULADO) --- */}
              <Paper 
                  className="magic-bento-card magic-bento-card--border-glow"
                  sx={{ 
                  aspectRatio: 'auto',
                  minHeight: 'unset',
                  p: 3, 
                  mb: 4, 
                  borderRadius: 4, 
                  border: `1px solid ${borderColor}`,
                  boxShadow: `0 0 30px ${borderColor}30`, 
                  position: 'relative',
                  overflow: 'hidden',
                  background: `radial-gradient(circle at 100% 0%, ${borderColor}10, transparent 40%), linear-gradient(145deg, #0F121D 0%, #000 100%)`
              }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="overline" color="text.secondary" fontWeight={700}>PAINEL VIP</Typography>
                      <Chip 
                          label={levelName} 
                          sx={{ 
                              bgcolor: borderColor, color: '#000',
                              fontWeight: 900, border: '1px solid rgba(255,255,255,0.2)'
                          }} 
                      />
                  </Box>
                  
                  <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                      <CircularProgress
                          variant="determinate"
                          value={100}
                          size={140}
                          thickness={2}
                          sx={{ color: 'rgba(255, 255, 255, 0.1)', position: 'absolute' }}
                      />
                      <CircularProgress
                          variant="determinate"
                          value={progress}
                          size={140}
                          thickness={4}
                          sx={{ color: borderColor, transform: 'rotate(-90deg)', filter: `drop-shadow(0 0 8px ${borderColor}80)` }}
                      />
                      <Box
                          sx={{
                              top: 0, left: 0, bottom: 0, right: 0,
                              position: 'absolute', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              flexDirection: 'column'
                          }}
                      >
                          <Typography variant="caption" color="text.secondary">NÍVEL</Typography>
                          <Typography variant="h3" fontWeight={900} color={borderColor} sx={{ lineHeight: 1 }}>{currentLevel}</Typography>
                      </Box>
                  </Box>

                  <Stack spacing={2} divider={<Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}>
                      <Box textAlign="center">
                          <Typography variant="h5" fontWeight={800} color="white" display="flex" alignItems="center" justifyContent="center" gap={1}>
                              <Star sx={{ color: borderColor }} /> {user.xp || 0} XP
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {t('next_level', { xp: xpToNextLevel })}
                          </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" pt={2}>
                          <Typography variant="overline" color="text.secondary" fontWeight={700} display="flex" alignItems="center" gap={1}>
                              <Diamond sx={{ fontSize: 16 }} /> {t('lux_coins')}
                          </Typography>
                          <Typography variant="h6" fontWeight={800} color="#FFF" fontFamily="monospace">{user.lux_coins}</Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" pt={2}>
                          <Typography variant="overline" color="text.secondary" fontWeight={700} display="flex" alignItems="center" gap={1}>
                              <Bolt sx={{ fontSize: 18 }} /> {t('spinsAvailable')}
                          </Typography>
                          <Typography variant="h6" fontWeight={800} color="#FFF" fontFamily="monospace">{user.available_spins}</Typography>
                      </Box>
                  </Stack>
              </Paper>

              {isDesktop && (
                  <Box mb={4}>
                      <RouletteTimer 
                          className="magic-bento-card magic-bento-card--border-glow"
                          timerDate={user.roulette_timer}
                          spinsRemaining={spinsAvailable}
                      />
                  </Box>
              )}

              {/* --- LOG DE PRÊMIOS (ATIVIDADE RECENTE REFORMULADO) --- */}
              <Paper 
                  className="magic-bento-card magic-bento-card--border-glow"
                  sx={{ 
                  aspectRatio: 'auto',
                  minHeight: 'unset',
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
                              Log de Prêmios
                          </Typography>
                      </Box>
                      <TrendingUp sx={{ color: 'rgba(255,255,255,0.2)' }} />
                  </Box>

                  <Box>
                      {history.slice(0, 5).map((h) => (
                          <ListItem key={h.id} sx={{ '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.05)', transform: 'translateX(4px)', transition: 'transform 0.2s' } }}>
                              <ListItemIcon sx={{ minWidth: 40 }}>
                                  <Box sx={{ 
                                      width: 32, height: 32, borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      bgcolor: `rgba(212, 175, 55, 0.1)`,
                                      color: `#D4AF37`
                                  }}>
                                      {getPrizeIcon(h.prize_type)}
                                  </Box>
                              </ListItemIcon>
                              <ListItemText 
                                  primary={
                                      <Typography variant="body2" color="#FFF" fontWeight={600}>
                                          {h.prize_name}
                                          {h.prize_value && h.prize_value > 0 && 
                                              <Typography component="span" variant="body2" fontWeight={800} color="#4CAF50" ml={1}>
                                                  +{h.prize_value} {h.prize_type === 'spins' ? 'Giros' : 'LC'}
                                              </Typography>
                                          }
                                      </Typography>
                                  }
                                  secondary={<Typography variant="caption" color="text.secondary">{new Date(h.timestamp).toLocaleString()}</Typography>}
                              />
                          </ListItem>
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
      </Box>
      
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
