import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Button, Chip,
  LinearProgress, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Paper, IconButton
} from '@mui/material';
import { 
    MilitaryTech, Timer, Repeat, WorkspacePremium, 
    CheckCircle, LockClock, UploadFile, ArrowForward 
} from '@mui/icons-material';
import { api, supabase } from '../services/api';
import { Challenge } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const Challenges: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofDialog, setProofDialog] = useState(false);
  const [proofText, setProofText] = useState('');

  const types = ['daily', 'weekly', 'monthly', 'permanent'];

  useEffect(() => {
    fetchChallenges();
  }, [activeTab]);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const type = types[activeTab];
      const data = await api.challenges.list(type);
      
      const { data: userData } = await supabase.auth.getUser();
      if(userData.user) {
         const { data: progressData } = await supabase
            .from('user_challenges')
            .select('*')
            .eq('user_id', userData.user.id);

         const combined = data.map(c => {
             const prog = progressData?.find(p => p.challenge_id === c.id);
             return { ...c, progress: prog?.progress || 0, status: prog?.status || 'pending' };
         });
         setChallenges(combined);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (id: string) => {
      try {
          const res = await api.challenges.claim(id);
          if(res.data?.success) {
              fetchChallenges();
          }
      } catch(e) { console.error(e); }
  };

  const handleSubmitProof = async () => {
      if(!selectedChallenge) return;
      await api.challenges.submitProof(selectedChallenge.id, proofText);
      setProofDialog(false);
      setProofText('');
      fetchChallenges();
  };

  // Helper para cores de dificuldade com tema dark/luxo
  const getDifficultyStyle = (diff: string) => {
      switch(diff) {
          case 'easy': return { color: '#4CAF50', label: t('diff_easy'), border: '1px solid rgba(76, 175, 80, 0.3)', bg: 'rgba(76, 175, 80, 0.1)' };
          case 'medium': return { color: '#FF9800', label: t('diff_medium'), border: '1px solid rgba(255, 152, 0, 0.3)', bg: 'rgba(255, 152, 0, 0.1)' };
          case 'hard': return { color: '#F44336', label: t('diff_hard'), border: '1px solid rgba(244, 67, 54, 0.3)', bg: 'rgba(244, 67, 54, 0.1)' };
          default: return { color: '#FFF', label: 'NORMAL', border: '1px solid #555', bg: '#222' };
      }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: '#050510', overflow: 'hidden' }}>
        {/* Background FX */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box sx={{ position: 'absolute', top: '10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </Box>

        <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        
        {/* Header Section */}
        <Box mb={6} display="flex" flexDirection="column" alignItems="center" textAlign="center">
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4, mb: 1 }}>
                {t('challenges_area')}
            </Typography>
            <Typography variant="h3" sx={{ 
                fontFamily: 'Montserrat', 
                fontWeight: 900, 
                color: '#D4AF37',
                textTransform: 'uppercase',
                textShadow: '0 0 30px rgba(212, 175, 55, 0.2)'
            }}>
                {t('challenges_title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mt: 2 }}>
                {t('challenges_subtitle')}
            </Typography>
        </Box>

        {/* Custom Tabs */}
        <Paper sx={{ 
            bgcolor: 'rgba(15, 18, 29, 0.8)', 
            backdropFilter: 'blur(10px)',
            borderRadius: 4, 
            p: 1, 
            mb: 5, 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'center'
        }}>
            <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)} 
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                textColor="primary" 
                indicatorColor="primary"
                sx={{
                    '& .MuiTabs-indicator': { height: 4, borderRadius: 2, boxShadow: '0 0 10px #D4AF37' },
                    '& .MuiTab-root': { 
                        fontWeight: 700, 
                        fontSize: '0.9rem', 
                        mx: 1,
                        transition: 'all 0.3s',
                        '&.Mui-selected': { color: '#FFF' } 
                    }
                }}
            >
                <Tab icon={<Timer sx={{ mb: 0.5 }} />} label={t('tab_daily')} />
                <Tab icon={<Repeat sx={{ mb: 0.5 }} />} label={t('tab_weekly')} />
                <Tab icon={<WorkspacePremium sx={{ mb: 0.5 }} />} label={t('tab_monthly')} />
                <Tab icon={<MilitaryTech sx={{ mb: 0.5 }} />} label={t('tab_career')} />
            </Tabs>
        </Paper>

        {loading ? (
            <Box display="flex" justifyContent="center" p={10}>
                <CircularProgress color="primary" />
            </Box>
        ) : (
            <Grid container spacing={3}>
            {challenges.map((c) => {
                const diffStyle = getDifficultyStyle(c.difficulty);
                return (
                    <Grid size={{ xs: 12, md: 6 }} key={c.id}>
                    <Paper sx={{ 
                        position: 'relative',
                        height: '100%', 
                        bgcolor: 'rgba(14, 16, 21, 0.6)',
                        backdropFilter: 'blur(5px)',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-5px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            borderColor: 'rgba(212, 175, 55, 0.3)'
                        }
                    }}>
                        {/* Status Strip */}
                        <Box sx={{ 
                            height: 4, 
                            width: '100%', 
                            bgcolor: c.status === 'claimed' ? '#4CAF50' : c.status === 'completed' ? '#FFD700' : 'rgba(255,255,255,0.1)' 
                        }} />

                        <Box p={3} display="flex" flexDirection="column" height="100%">
                            
                            {/* Header: Icon & Badge */}
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                <Box display="flex" gap={2}>
                                    <Box sx={{ 
                                        width: 48, height: 48, 
                                        borderRadius: 2, 
                                        bgcolor: 'rgba(255,255,255,0.03)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#D4AF37'
                                    }}>
                                        {/* Mapear ícones reais se possível, usando o texto por enquanto ou um ícone genérico sofisticado */}
                                        <WorkspacePremium />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight={800} color="white" lineHeight={1.2}>
                                            {c.title}
                                        </Typography>
                                        <Chip 
                                            label={diffStyle.label} 
                                            size="small" 
                                            sx={{ 
                                                mt: 0.5,
                                                height: 20,
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                color: diffStyle.color,
                                                bgcolor: diffStyle.bg,
                                                border: diffStyle.border
                                            }} 
                                        />
                                    </Box>
                                </Box>
                                {c.status === 'claimed' && <CheckCircle color="success" />}
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1, lineHeight: 1.6 }}>
                                {c.description}
                            </Typography>

                            {/* Progress Section */}
                            {c.verification_type === 'automatic' && c.status !== 'claimed' && (
                                <Box mb={3}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="text.secondary">{t('progress')}</Typography>
                                        <Typography variant="caption" color="white" fontWeight="bold">{c.progress}%</Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={c.progress || 0} 
                                        sx={{ 
                                            height: 6, 
                                            borderRadius: 3, 
                                            bgcolor: 'rgba(255,255,255,0.1)',
                                            '& .MuiLinearProgress-bar': { bgcolor: '#D4AF37' }
                                        }} 
                                    />
                                </Box>
                            )}

                            {/* Reward & Action Footer */}
                            <Box 
                                mt="auto" 
                                pt={2} 
                                borderTop="1px solid rgba(255,255,255,0.05)" 
                                display="flex" 
                                alignItems="center" 
                                justifyContent="space-between"
                            >
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">{t('reward_label')}</Typography>
                                    <Typography variant="body2" color="#D4AF37" fontWeight={800}>
                                        {c.reward_spins > 0 && `+${c.reward_spins} ${t('spinsAvailable').toUpperCase()}`}
                                        {c.reward_spins > 0 && c.reward_money > 0 && ' & '}
                                        {c.reward_money > 0 && `R$ ${c.reward_money}`}
                                    </Typography>
                                </Box>

                                <Box>
                                    {c.status === 'claimed' ? (
                                        <Button disabled size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#555' }}>
                                            {t('btn_completed')}
                                        </Button>
                                    ) : c.status === 'completed' ? (
                                        <Button 
                                            variant="contained" 
                                            size="small"
                                            onClick={() => handleClaim(c.id)}
                                            sx={{ 
                                                bgcolor: '#4CAF50', 
                                                color: '#000', 
                                                fontWeight: 800,
                                                boxShadow: '0 0 15px rgba(76, 175, 80, 0.4)',
                                                animation: 'pulse-gold 2s infinite', // Reusing pulse but green
                                                '&:hover': { bgcolor: '#43A047' }
                                            }}
                                        >
                                            {t('btn_redeem_reward')}
                                        </Button>
                                    ) : c.verification_type === 'manual' ? (
                                        <Button 
                                            variant="outlined" 
                                            size="small"
                                            endIcon={<UploadFile />}
                                            onClick={() => { setSelectedChallenge(c); setProofDialog(true); }}
                                        >
                                            {t('btn_proof')}
                                        </Button>
                                    ) : (
                                        <Button 
                                            disabled 
                                            size="small"
                                            startIcon={<LockClock />}
                                            sx={{ color: 'rgba(255,255,255,0.3)' }}
                                        >
                                            {t('btn_in_progress')}
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                    </Grid>
                );
            })}
            </Grid>
        )}

        {/* Proof Dialog */}
        <Dialog 
            open={proofDialog} 
            onClose={() => setProofDialog(false)} 
            PaperProps={{ 
                sx: { 
                    bgcolor: '#13131F', 
                    color: 'white', 
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    borderRadius: 4,
                    boxShadow: '0 0 50px rgba(0,0,0,0.8)'
                } 
            }}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle sx={{ fontFamily: 'Montserrat', fontWeight: 700 }}>
                {t('proof_dialog_title')}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    {t('proof_dialog_desc')}
                </Typography>
                <TextField 
                    fullWidth 
                    multiline 
                    rows={4} 
                    placeholder="Ex: https://instagram.com/..." 
                    value={proofText} 
                    onChange={e => setProofText(e.target.value)} 
                    sx={{ 
                        bgcolor: 'rgba(0,0,0,0.2)',
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: '#D4AF37' },
                            '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                            color: 'white'
                        }
                    }} 
                />
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={() => setProofDialog(false)} sx={{ color: 'gray' }}>{t('btn_cancel')}</Button>
                <Button 
                    onClick={handleSubmitProof} 
                    variant="contained"
                    endIcon={<ArrowForward />}
                    sx={{ fontWeight: 800, bgcolor: '#D4AF37', color: '#000' }}
                >
                    {t('btn_send_analysis')}
                </Button>
            </DialogActions>
        </Dialog>
        </Container>
    </Box>
  );
};
export default Challenges;