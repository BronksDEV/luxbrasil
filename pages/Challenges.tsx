
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  Chip,
  Grid,
  Stack,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  Remove,
  Star,
  MilitaryTech,
  Groups,
  Diamond
} from '@mui/icons-material';
import { api } from '../services/api';
import { RankingEntry } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useThemeConfig } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';

const RankingPage: React.FC = () => {
  const { t } = useLanguage();
  const { themeConfig } = useThemeConfig();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<RankingEntry | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    fetchRanking();
    
    // Countdown logic for end of current month
    const updateTimer = () => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const diff = endOfMonth.getTime() - now.getTime();
        
        if (diff <= 0) {
            setTimeRemaining("00d 00h 00m");
            return;
        }
        
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeRemaining(`${d}d ${h}h ${m}m`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute is enough
    return () => clearInterval(interval);
  }, []);

  const fetchRanking = async () => {
    try {
      const data = await api.ranking.getMonthlyRanking();
      setRanking(data);
      const me = data.find(r => r.is_current_user);
      if (me) setCurrentUserRank(me);
    } catch (e) {
      console.error("Failed to load ranking", e);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (rank: number) => {
      switch(rank) {
          case 1: return '#D4AF37'; // Gold
          case 2: return '#C0C0C0'; // Silver
          case 3: return '#CD7F32'; // Bronze
          default: return 'rgba(255,255,255,0.1)';
      }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'same') => {
      if (trend === 'up') return <TrendingUp sx={{ color: '#4CAF50', fontSize: 16 }} />;
      if (trend === 'down') return <TrendingDown sx={{ color: '#F44336', fontSize: 16 }} />;
      return <Remove sx={{ color: 'gray', fontSize: 16 }} />;
  };

  // Helper para gerar avatar, agora compatível com múltiplos estilos
  const getAvatarUrl = (avatarId: string | undefined | null, defaultName: string) => {
    if (avatarId) {
        const parts = avatarId.split(':');
        if (parts.length === 2) {
            const [style, seed] = parts;
            return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        }
        // Compatibilidade com avatares antigos (assume 'adventurer')
        return `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }
    
    // Fallback para usuários sem avatar_id, usando o estilo antigo
    const color = isCarnival ? '9c27b0' : 'd4af37';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultName.replace(/\s/g, '')}&backgroundColor=000000&clothing=blazerAndShirt&clothingColor=${color}&hairColor=${color}&skinColor=edb98a&top=shortFlat`;
  };

  const PodiumItem = ({ entry, place }: { entry: RankingEntry, place: number }) => {
      const color = getMedalColor(place);
      const height = place === 1 ? 140 : 110;
      const isMe = entry.is_current_user;
      
      let prize = t('top_3_prize');
      if (place === 1) prize = t('top_1_prize');
      if (place === 2) prize = t('top_2_prize');

      return (
          <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: place * 0.2 }}
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                zIndex: place === 1 ? 2 : 1,
                mt: place === 1 ? 0 : 4,
                mx: { xs: 0.5, sm: 2 }
            }}
          >
              <Box sx={{ position: 'relative' }}>
                  {place === 1 && (
                      <EmojiEvents 
                        sx={{ 
                            position: 'absolute', top: -35, left: '50%', transform: 'translateX(-50%)', 
                            fontSize: 40, color: '#FFD700', filter: 'drop-shadow(0 0 10px #FFD700)' 
                        }} 
                      />
                  )}
                  <Avatar 
                    src={getAvatarUrl(entry.avatar_seed, entry.full_name)}
                    sx={{ 
                        width: place === 1 ? 90 : 70, 
                        height: place === 1 ? 90 : 70,
                        border: `4px solid ${color}`,
                        boxShadow: `0 0 20px ${color}60`,
                        bgcolor: '#000'
                    }} 
                  />
                  <Box sx={{ 
                      position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                      bgcolor: color, color: '#000', fontWeight: 900, borderRadius: '50%',
                      width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.8rem', border: '2px solid #000'
                  }}>
                      {place}
                  </Box>
              </Box>
              
              <Typography 
                variant="subtitle2" 
                sx={{ 
                    mt: 2, fontWeight: 800, color: isMe ? '#D4AF37' : '#FFF',
                    maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
              >
                  {isMe ? 'VOCÊ' : entry.full_name.split(' ')[0]}
              </Typography>
              
              <Chip 
                label={`${entry.invites}`} 
                size="small" 
                icon={<Groups sx={{ fontSize: '12px !important' }} />}
                sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', height: 20, fontSize: '0.65rem', fontWeight: 700 }} 
              />

              <Box sx={{ 
                  mt: 2, width: { xs: 80, sm: 120 }, height: height, 
                  background: `linear-gradient(to bottom, ${color}40, transparent)`,
                  borderTop: `4px solid ${color}`,
                  borderRadius: '8px 8px 0 0',
                  display: 'flex', justifyContent: 'center', pt: 2
              }}>
                  <Typography variant="caption" sx={{ color: '#FFF', fontSize: '0.6rem', textAlign: 'center', px: 1 }}>
                      {prize}
                  </Typography>
              </Box>
          </Box>
      );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#050510', pb: 10 }}>
        {/* HERO SECTION */}
        <Box sx={{ 
            position: 'relative', 
            py: 6, 
            textAlign: 'center',
            background: isCarnival 
                ? 'radial-gradient(circle at center, #2c003e 0%, #050510 100%)' 
                : 'radial-gradient(circle at center, #1a1500 0%, #050510 100%)',
            overflow: 'hidden'
        }}>
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 4, fontWeight: 700 }}>
                    {t('challenges_area')}
                </Typography>
                <Typography variant="h3" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#FFF', textTransform: 'uppercase', mb: 1 }}>
                    {t('ranking_title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                    {t('ranking_subtitle')}
                </Typography>

                <Chip 
                    label={`${t('ranking_ends')} ${timeRemaining}`} 
                    sx={{ 
                        bgcolor: 'rgba(212, 175, 55, 0.1)', 
                        color: '#D4AF37', 
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        fontWeight: 700,
                        letterSpacing: 1
                    }} 
                />
            </Container>
        </Box>

        <Container maxWidth="md" sx={{ mt: -4, position: 'relative', zIndex: 3 }}>
            {loading ? (
                <Box display="flex" justifyContent="center" py={10}>
                    <CircularProgress color="primary" />
                </Box>
            ) : (
                <>
                    {/* PODIUM */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', mb: 6 }}>
                        {ranking.length > 1 && <PodiumItem entry={ranking[1]} place={2} />}
                        {ranking.length > 0 && <PodiumItem entry={ranking[0]} place={1} />}
                        {ranking.length > 2 && <PodiumItem entry={ranking[2]} place={3} />}
                    </Box>

                    {/* CURRENT USER STATUS CARD */}
                    {currentUserRank && (
                        <Paper sx={{ 
                            p: 2, mb: 4, 
                            background: 'linear-gradient(90deg, #1a1a1a 0%, #000 100%)',
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            borderRadius: 3,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
                        }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar 
                                    src={getAvatarUrl(currentUserRank.avatar_seed, currentUserRank.full_name)} 
                                    sx={{ border: '2px solid #D4AF37' }}
                                />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                        {t('your_rank')}
                                    </Typography>
                                    <Typography variant="h5" color="#FFF" fontWeight={900}>
                                        #{currentUserRank.rank}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="subtitle2" color="text.secondary" sx={{ letterSpacing: 1 }}>
                                    {t('invites_valid')}
                                </Typography>
                                <Typography variant="h5" color="#D4AF37" fontWeight={900}>
                                    {currentUserRank.invites}
                                </Typography>
                            </Box>
                        </Paper>
                    )}

                    {/* LIST (4th - 50th) */}
                    <Paper sx={{ bgcolor: '#0F121D', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {ranking.slice(3).map((entry, index) => (
                            <Box 
                                key={entry.user_id}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    p: 2,
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    bgcolor: entry.is_current_user ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Typography variant="body1" sx={{ width: 30, color: '#888', fontWeight: 700 }}>
                                        {entry.rank}
                                    </Typography>
                                    {getTrendIcon(entry.trend)}
                                    <Avatar 
                                        src={getAvatarUrl(entry.avatar_seed, entry.full_name)} 
                                        sx={{ width: 32, height: 32 }}
                                    />
                                    <Typography variant="body2" sx={{ fontWeight: entry.is_current_user ? 700 : 500, color: entry.is_current_user ? '#D4AF37' : '#FFF' }}>
                                        {entry.is_current_user ? 'Você' : entry.full_name}
                                    </Typography>
                                </Box>
                                
                                <Box display="flex" alignItems="center" gap={3}>
                                    <Typography variant="body2" fontWeight={700} sx={{ color: '#FFF' }}>
                                        {entry.invites} <span style={{ color: '#555', fontSize: '0.7em' }}>CONVITES</span>
                                    </Typography>
                                    {entry.rank <= 10 && (
                                        <Chip label={t('top_50_prize')} size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37' }} />
                                    )}
                                </Box>
                            </Box>
                        ))}
                        {ranking.length <= 3 && (
                            <Box p={4} textAlign="center">
                                <Typography color="text.secondary">Mais competidores aparecerão aqui em breve.</Typography>
                            </Box>
                        )}
                    </Paper>
                </>
            )}
        </Container>
    </Box>
  );
};

export default RankingPage;