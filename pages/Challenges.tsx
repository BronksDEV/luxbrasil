import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Tabs, Tab, Button, Chip,
  LinearProgress, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Paper, IconButton, Snackbar, Alert
} from '@mui/material';
import { 
    MilitaryTech, Timer, Repeat, WorkspacePremium, 
    CheckCircle, LockClock, UploadFile, ArrowForward, Star, Diamond, Casino, Person, Share, Storefront, AccountBalanceWallet, OpenInNew, Link as LinkIcon
} from '@mui/icons-material';
import { api, supabase } from '../services/api';
import { Challenge } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

const Challenges: React.FC = () => {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofDialog, setProofDialog] = useState(false);
  const [proofText, setProofText] = useState('');
  
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{open: boolean, msg: string}>({ open: false, msg: '' });

  const types = ['daily', 'weekly', 'monthly', 'permanent'];
  const PARTNER_LINK = 'https://www.wgjogo0.com/';

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
             
             let effectiveStatus = prog?.status || 'pending';
             let effectiveProgress = prog?.progress || 0;

             if (c.type === 'daily' && prog && prog.status === 'claimed') {
                 const dateString = prog.updated_at || prog.last_update;
                 
                 if (dateString) {
                     const lastUpdate = new Date(dateString);
                     const now = new Date();
                     
                     const isToday = lastUpdate.getDate() === now.getDate() && 
                                     lastUpdate.getMonth() === now.getMonth() &&
                                     lastUpdate.getFullYear() === now.getFullYear();
                     
                     if (!isToday) {
                         effectiveStatus = 'pending';
                         effectiveProgress = 0;
                     }
                 }
             }

             return { ...c, progress: effectiveProgress, status: effectiveStatus };
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
              await refreshUser();
              fetchChallenges();
          }
      } catch(e) { console.error(e); }
  };

  const handleVisit = async (challenge: Challenge) => {
      window.open(PARTNER_LINK, '_blank');
      
      if (challenge.verification_type === 'automatic') {
          setVerifyingId(challenge.id);
          
          setTimeout(async () => {
              await api.challenges.submitProof(challenge.id, "AUTO_VISIT"); 
              setVerifyingId(null);
              
              setToast({ open: true, msg: "Acesso validado! Recompensa creditada." });
              
              fetchChallenges();
              
              await refreshUser();
          }, 10000);
      }
  };

  const handleSubmitProof = async () => {
      if(!selectedChallenge) return;
      await api.challenges.submitProof(selectedChallenge.id, proofText);
      setProofDialog(false);
      setProofText('');
      setToast({ open: true, msg: "Comprovante enviado para análise!" });
      fetchChallenges();
  };

  const getIcon = (iconName: string) => {
      switch(iconName) {
          case 'Casino': return <Casino fontSize="large" />;
          case 'Person': return <Person fontSize="large" />;
          case 'Share': return <Share fontSize="large" />;
          case 'Storefront': return <Storefront fontSize="large" />;
          case 'AccountBalanceWallet': return <AccountBalanceWallet fontSize="large" />;
          default: return <WorkspacePremium fontSize="large" />;
      }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: '#050510', overflowX: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box sx={{ position: 'absolute', top: '10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </Box>

        <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        
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

        <Paper sx={{ 
            bgcolor: 'rgba(15, 18, 29, 0.8)', 
            backdropFilter: 'blur(10px)',
            borderRadius: 4, 
            p: 1, 
            mb: 5, 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
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
                    '& .MuiTabs-indicator': { height: 3, borderRadius: 2, boxShadow: '0 0 10px #D4AF37', bottom: 5 },
                    '& .MuiTab-root': { 
                        fontWeight: 800, 
                        fontSize: '0.85rem', 
                        mx: 1,
                        minHeight: 60,
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
            <AnimatePresence mode='wait'>
            {challenges.map((c) => {
                const isClaimed = c.status === 'claimed';
                const isCompleted = c.status === 'completed' || isClaimed; 
                const isInProgress = c.status === 'in_progress';
                const isVisitMission = c.category === 'visit';
                const isVerifying = verifyingId === c.id;
                
                return (
                    <Grid item xs={12} md={6} key={c.id} component={motion.div} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Paper sx={{ 
                        position: 'relative',
                        height: '100%', 
                        background: 'linear-gradient(145deg, #13131F 0%, #0b0b12 100%)',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        '&:hover': {
                            transform: 'translateY(-5px) scale(1.01)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(212, 175, 55, 0.3)',
                        }
                    }}>
                        {isCompleted && !isClaimed && (
                            <Box sx={{ position: 'absolute', inset: 0, animation: 'pulse-bg 2s infinite', opacity: 0.1, background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }} />
                        )}

                        <Box p={3} display="flex" flexDirection="column" height="100%" position="relative" zIndex={2}>
                            
                            <Box display="flex" gap={2.5} mb={2}>
                                <Box sx={{ 
                                    width: 60, height: 60, 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, #222 0%, #111 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: `2px solid ${isCompleted ? '#D4AF37' : '#333'}`,
                                    color: isCompleted ? '#D4AF37' : '#666',
                                    boxShadow: isCompleted ? '0 0 20px rgba(212,175,55,0.3)' : 'none'
                                }}>
                                    {getIcon(c.icon)}
                                </Box>
                                <Box flexGrow={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                        <Typography variant="h6" fontWeight={800} color="white" lineHeight={1.2} sx={{ fontSize: '1.1rem' }}>
                                            {c.title}
                                        </Typography>
                                        {isClaimed && <CheckCircle color="success" />}
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        {c.description}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ 
                                display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3, 
                                p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)' 
                            }}>
                                {c.reward_xp > 0 && (
                                    <Chip 
                                        icon={<Star sx={{ color: '#D4AF37 !important', fontSize: 16 }} />}
                                        label={`${c.reward_xp} XP`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', fontWeight: 800, border: '1px solid rgba(212, 175, 55, 0.2)' }}
                                    />
                                )}
                                {c.reward_money > 0 && (
                                    <Chip 
                                        icon={<Diamond sx={{ color: '#90CAF9 !important', fontSize: 16 }} />}
                                        label={`${c.reward_money} LC`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#90CAF9', fontWeight: 800, border: '1px solid rgba(33, 150, 243, 0.2)' }}
                                    />
                                )}
                                {c.reward_spins > 0 && (
                                    <Chip 
                                        icon={<Casino sx={{ color: '#4CAF50 !important', fontSize: 16 }} />}
                                        label={`+${c.reward_spins} GIROS`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', fontWeight: 800, border: '1px solid rgba(76, 175, 80, 0.2)' }}
                                    />
                                )}
                            </Box>

                            <Box mt="auto">
                                {c.verification_type === 'automatic' && !isClaimed && !isVisitMission && (
                                    <Box mb={2}>
                                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="caption" color="#888" fontWeight={600}>PROGRESSO</Typography>
                                            <Typography variant="caption" color="white" fontWeight={700}>{c.progress}%</Typography>
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={c.progress || 0} 
                                            sx={{ 
                                                height: 8, 
                                                borderRadius: 4, 
                                                bgcolor: '#222',
                                                '& .MuiLinearProgress-bar': { 
                                                    bgcolor: isCompleted ? '#4CAF50' : '#D4AF37',
                                                    borderRadius: 4
                                                }
                                            }} 
                                        />
                                    </Box>
                                )}

                                {isClaimed ? (
                                    <Button fullWidth disabled variant="outlined" sx={{ borderColor: '#333', color: '#555', fontWeight: 700 }}>
                                        {c.type === 'daily' ? "VOLTE AMANHÃ" : t('btn_completed')}
                                    </Button>
                                ) : isVisitMission ? (
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        endIcon={isVerifying ? <CircularProgress size={20} color="inherit" /> : <OpenInNew />}
                                        onClick={() => handleVisit(c)}
                                        disabled={isVerifying}
                                        sx={{ 
                                            bgcolor: isVerifying ? '#333' : '#D4AF37', 
                                            color: isVerifying ? '#888' : '#000', 
                                            fontWeight: 800,
                                            '&:hover': { bgcolor: isVerifying ? '#333' : '#F3E5AB' } 
                                        }}
                                    >
                                        {isVerifying ? "VERIFICANDO ACESSO..." : "VISITAR E VALIDAR"}
                                    </Button>
                                ) : c.verification_type === 'manual' ? (
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Button
                                            fullWidth
                                            size="small"
                                            color="info"
                                            startIcon={<LinkIcon />}
                                            onClick={() => window.open(PARTNER_LINK, '_blank')}
                                            sx={{ fontSize: '0.75rem', color: '#90CAF9' }}
                                        >
                                            ACESSAR PLATAFORMA
                                        </Button>
                                        {isInProgress ? (
                                            <Button fullWidth disabled variant="outlined" sx={{ borderColor: '#2196F3', color: '#2196F3', fontWeight: 700 }}>
                                                EM ANÁLISE...
                                            </Button>
                                        ) : (
                                            <Button 
                                                fullWidth
                                                variant="outlined" 
                                                endIcon={<UploadFile />}
                                                onClick={() => { setSelectedChallenge(c); setProofDialog(true); }}
                                                sx={{ borderColor: '#555', color: '#AAA', '&:hover': { borderColor: '#D4AF37', color: '#D4AF37' } }}
                                            >
                                                {t('btn_proof')}
                                            </Button>
                                        )}
                                    </Box>
                                ) : (
                                    <Button 
                                        fullWidth
                                        disabled 
                                        startIcon={<LockClock />}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#666' }}
                                    >
                                        {t('btn_in_progress')}
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    </Paper>
                    </Grid>
                );
            })}
            </AnimatePresence>
            </Grid>
        )}

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
                    placeholder="Cole aqui o link do print ou descreva sua ação (ex: Nome de usuário na plataforma parceira)..." 
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
        
        <Snackbar 
            open={toast.open} 
            autoHideDuration={6000} 
            onClose={() => setToast({...toast, open: false})}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert 
                severity="success" 
                sx={{ 
                    bgcolor: '#4CAF50', color: '#FFF', fontWeight: 700, 
                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.5)' 
                }}
            >
                {toast.msg}
            </Alert>
        </Snackbar>

        <style>
            {`@keyframes pulse-bg { 0% { opacity: 0.1; } 50% { opacity: 0.3; } 100% { opacity: 0.1; } }`}
        </style>
        </Container>
    </Box>
  );
};
export default Challenges;