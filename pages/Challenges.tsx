import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Paper,
  IconButton,
  Snackbar,
  Alert,
  Avatar,
  Stack,
  Tabs,
  Tab,
  GridLegacy as Grid
} from '@mui/material';
import {
  EmojiEvents,
  Groups,
  Star,
  Diamond,
  Schedule,
  CheckCircle,
  RocketLaunch,
  Security,
  Casino,
  CloudUpload,
  Close,
  Image as ImageIcon,
  UploadFile,
  LockClock
} from '@mui/icons-material';
import { api } from '../services/api';
import { Mission } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { useThemeConfig } from '../contexts/ThemeContext';

const Challenges: React.FC = () => {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const { themeConfig } = useThemeConfig();

  const [activeTab, setActiveTab] = useState(0);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [proofDialog, setProofDialog] = useState(false);
  const [proofText, setProofText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ open: boolean; msg: string; type?: 'success' | 'error' }>({
    open: false,
    msg: '',
    type: 'success'
  });

  const PARTNER_LINK = 'https://www.wgjogo0.com/';
  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  const colors = {
    primary: isCarnival ? '#A855F7' : '#D4AF37',
    secondary: isCarnival ? '#06B6D4' : '#F3E5AB',
    background: isCarnival
      ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(6, 182, 212, 0.1))'
      : 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(10, 10, 10, 0.6))',
    border: isCarnival ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid rgba(212, 175, 55, 0.2)',
    progressGradient: isCarnival ? 'linear-gradient(90deg, #A855F7, #3B82F6)' : 'linear-gradient(90deg, #D4AF37, #AA8C2C)',
    completedBg: isCarnival
      ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(168, 85, 247, 0.15))'
      : 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0, 0, 0, 0.8))',
    completedBorder: isCarnival ? '1px solid rgba(236, 72, 153, 0.4)' : '1px solid rgba(255, 215, 0, 0.4)',
    btnGradient: isCarnival
      ? 'linear-gradient(90deg, #EC4899, #A855F7, #06B6D4)'
      : 'linear-gradient(90deg, #D4AF37, #F3E5AB, #D4AF37)',
    iconBg: isCarnival ? 'linear-gradient(135deg, #A855F7 0%, #06B6D4 100%)' : 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)'
  };

  const norm = (v?: any) => (v ?? '').toString().trim().toLowerCase();

  useEffect(() => {
    const init = async () => {
      try {
        await fetchMissions();
      } catch (e) {
        console.error('Erro ao inicializar missões:', e);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const data = await api.missions.sync();
      console.log('Missões carregadas:', data);
      setMissions(data);
    } catch (e) {
      console.error('Erro ao carregar missões', e);
    } finally {
      setLoading(false);
    }
  };

  const normalizeFrequency = (f?: string) => {
    const v = norm(f);
    if (v === 'career') return 'permanent';
    return v;
  };

  const getFilteredMissions = () => {
    const tabMap = ['daily', 'weekly', 'monthly', 'permanent'];
    const currentType = tabMap[activeTab];
    return missions.filter(m => normalizeFrequency((m as any).frequency) === currentType);
  };

  const handleVisit = async (mission: Mission) => {
    window.open(PARTNER_LINK, '_blank', 'noopener,noreferrer');
    setVerifyingId((mission as any).challenge_id);

    setTimeout(async () => {
      try {
        await api.missions.registerVisit((mission as any).challenge_id);
        setToast({ open: true, msg: 'Acesso validado!', type: 'success' });
        await fetchMissions();
        await refreshUser();
      } catch (e) {
        console.error(e);
        setToast({ open: true, msg: 'Erro ao registrar visita.', type: 'error' });
      } finally {
        setVerifyingId(null);
      }
    }, 5000);
  };

  const handleClaim = async (mission: Mission) => {
    setClaimingId((mission as any).user_challenge_id);
    try {
      const result = await api.missions.claimReward((mission as any).user_challenge_id);
      if (result.success) {
        setToast({ open: true, msg: result.message, type: 'success' });
        await fetchMissions();
        await refreshUser();
      } else {
        setToast({ open: true, msg: result.message, type: 'error' });
      }
    } catch (e) {
      setToast({ open: true, msg: 'Erro ao resgatar.', type: 'error' });
    } finally {
      setClaimingId(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedMission) return;

    if (!selectedFile) {
      setToast({ open: true, msg: 'É obrigatório enviar uma imagem.', type: 'error' });
      return;
    }
    if (proofText.trim().length < 3) {
      setToast({ open: true, msg: 'Adicione uma descrição.', type: 'error' });
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await api.missions.uploadProof(selectedFile);
      const proofPayload = `CTX: ${proofText} || IMG: ${imageUrl}`;

      await api.missions.submitProof((selectedMission as any).challenge_id, proofPayload);

      setProofDialog(false);
      setProofText('');
      setSelectedFile(null);
      setToast({ open: true, msg: 'Comprovante enviado!', type: 'success' });

      setMissions(prev =>
        prev.map(m =>
          (m as any).challenge_id === (selectedMission as any).challenge_id
            ? ({ ...(m as any), status: 'in_progress', verification_proof: proofPayload } as any)
            : m
        )
      );

      await fetchMissions();
    } catch (error: any) {
      setToast({ open: true, msg: error.message || 'Erro ao enviar.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const style = { fontSize: 28, color: '#FFF' as const };
    switch (iconName) {
      case 'Casino': return <Casino style={style} />;
      case 'Person': return <Groups style={style} />;
      case 'Share': return <RocketLaunch style={style} />;
      case 'Storefront': return <Security style={style} />;
      case 'AccountBalanceWallet': return <Diamond style={style} />;
      case 'Login': return <LockClock style={style} />;
      case 'CalendarToday': return <Schedule style={style} />;
      default: return <EmojiEvents style={style} />;
    }
  };

  const getButtonState = (m: Mission) => {
    const status = norm((m as any).status);
    const category = norm((m as any).category);
    const verificationType = norm((m as any).verification_type);
    const hasProof = !!(m as any).verification_proof;

    if (status === 'claimed') {
      return (
        <Button fullWidth disabled variant="contained" sx={{ opacity: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}>
          CONCLUÍDO
        </Button>
      );
    }

    if (status === 'completed') {
      return (
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleClaim(m)}
          disabled={claimingId === (m as any).user_challenge_id}
          sx={{
            background: colors.btnGradient,
            color: '#000',
            fontWeight: 900,
            animation: 'pulse-gold 2s infinite'
          }}
        >
          {claimingId === (m as any).user_challenge_id ? 'RESGATANDO...' : 'RESGATAR RECOMPENSA'}
        </Button>
      );
    }

    if (verificationType === 'manual') {
      if (status === 'in_progress' && hasProof) {
        return (
          <Button fullWidth disabled variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#AAA' }}>
            EM ANÁLISE
          </Button>
        );
      }

      return (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<UploadFile />}
          onClick={() => { setSelectedMission(m); setProofDialog(true); }}
          sx={{ borderColor: '#FFF', color: '#FFF', '&:hover': { borderColor: colors.primary, color: colors.primary } }}
        >
          ENVIAR PROVA
        </Button>
      );
    }

    if (['login', 'spin', 'invite', 'referral', 'check_invites'].includes(category)) {
      return (
        <Button fullWidth disabled variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#AAA' }}>
          EM PROGRESSO
        </Button>
      );
    }

    if (category === 'visit') {
      const isVerifying = verifyingId === (m as any).challenge_id;
      return (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => handleVisit(m)}
          disabled={isVerifying}
          sx={{ borderColor: colors.primary, color: colors.primary, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
        >
          {isVerifying ? 'VERIFICANDO...' : 'VISITAR'}
        </Button>
      );
    }

    return (
      <Button fullWidth disabled variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#AAA' }}>
        INDISPONÍVEL
      </Button>
    );
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: '#050510', overflowX: 'hidden' }}>
      <Container maxWidth="lg" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        <Box mb={6} textAlign="center">
          <Typography variant="overline" sx={{ color: colors.primary, letterSpacing: 4, fontWeight: 700, mb: 1, display: 'block' }}>
            {t('challenges_area')}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'Montserrat',
              fontWeight: 900,
              color: '#FFF',
              textTransform: 'uppercase',
              textShadow: `0 0 20px ${colors.primary}40`
            }}
          >
            CENTRAL DE <span style={{ color: colors.primary }}>MISSÕES</span>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            textColor="inherit"
            TabIndicatorProps={{ style: { backgroundColor: colors.primary } }}
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: 3,
              '& .MuiTab-root': { fontWeight: 700, color: '#888', '&.Mui-selected': { color: colors.primary } }
            }}
          >
            <Tab label={t('tab_daily')} />
            <Tab label={t('tab_weekly')} />
            <Tab label={t('tab_monthly')} />
            <Tab label={t('tab_permanent')} />
          </Tabs>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={10}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <AnimatePresence mode="wait">
              {getFilteredMissions().map((m) => {
                const status = norm((m as any).status);
                const isClaimed = status === 'claimed';
                const goal = Number((m as any).goal || 0);
                const cur = Number((m as any).current_value || 0);
                const progressPct = goal > 0 ? Math.min(100, Math.floor((cur / goal) * 100)) : 0;

                return (
                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={(m as any).user_challenge_id || (m as any).challenge_id}
                    component={motion.div as any}
                    // @ts-ignore (framer-motion)
                    layout
                    // @ts-ignore (framer-motion)
                    initial={{ opacity: 0, y: 20 }}
                    // @ts-ignore (framer-motion)
                    animate={{ opacity: 1, y: 0 }}
                    // @ts-ignore (framer-motion)
                    exit={{ opacity: 0 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        background: isClaimed ? colors.completedBg : colors.background,
                        backdropFilter: 'blur(20px)',
                        border: isClaimed ? colors.completedBorder : colors.border,
                        borderRadius: 4,
                        p: 3,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 12px 40px ${colors.primary}30`
                        }
                      }}
                    >
                      {isClaimed && (
                        <Chip
                          icon={<CheckCircle sx={{ color: '#fff !important' }} />}
                          label="CONCLUÍDO"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            bgcolor: colors.primary,
                            color: '#000',
                            fontWeight: 900
                          }}
                        />
                      )}

                      <Box display="flex" gap={2.5} mb={3} alignItems="flex-start">
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            background: colors.iconBg,
                            boxShadow: `0 0 20px ${colors.primary}40`,
                            borderRadius: 3
                          }}
                        >
                          {getIcon((m as any).icon)}
                        </Avatar>
                        <Box mt={0.5}>
                          <Typography variant="h6" fontWeight={800} color="#FFF" lineHeight={1.2}>
                            {(m as any).title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.4 }}>
                            {(m as any).description}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={1} mb={3}>
                        {Number((m as any).reward_xp || 0) > 0 && (
                          <Chip
                            icon={<Star sx={{ color: `${colors.primary} !important`, fontSize: 16 }} />}
                            label={`${(m as any).reward_xp} XP`}
                            variant="outlined"
                            sx={{ borderColor: colors.primary, color: colors.primary, fontWeight: 700 }}
                            size="small"
                          />
                        )}
                        {Number((m as any).reward_money || 0) > 0 && (
                          <Chip
                            icon={<Diamond sx={{ color: `${colors.secondary} !important`, fontSize: 16 }} />}
                            label={`${(m as any).reward_money} LC`}
                            variant="outlined"
                            sx={{ borderColor: colors.secondary, color: colors.secondary, fontWeight: 700 }}
                            size="small"
                          />
                        )}
                        {Number((m as any).reward_spins || 0) > 0 && (
                          <Chip
                            icon={<Casino sx={{ color: '#4CAF50 !important', fontSize: 16 }} />}
                            label={`+${(m as any).reward_spins} GIROS`}
                            variant="outlined"
                            sx={{ borderColor: '#4CAF50', color: '#4CAF50', fontWeight: 700 }}
                            size="small"
                          />
                        )}
                      </Stack>

                      <Box sx={{ mb: 3 }}>
                        <Box display="flex" justifyContent="space-between" mb={1} alignItems="center">
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>PROGRESSO</Typography>
                          <Typography variant="caption" color="white" fontWeight={700}>
                            {cur} / {goal}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={progressPct}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            '& .MuiLinearProgress-bar': {
                              background: isClaimed ? '#FFF' : colors.progressGradient,
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>

                      <Box>
                        {getButtonState(m)}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </AnimatePresence>

            {getFilteredMissions().length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent', border: '1px dashed #444' }}>
                  <Typography color="text.secondary">Nenhuma missão disponível nesta categoria no momento.</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        <Dialog
          open={proofDialog}
          onClose={() => !isUploading && setProofDialog(false)}
          PaperProps={{
            sx: {
              bgcolor: '#13131F',
              color: 'white',
              border: `1px solid ${colors.primary}`,
              borderRadius: 4
            }
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {t('proof_dialog_title')}
            {!isUploading && (
              <IconButton onClick={() => setProofDialog(false)} sx={{ color: 'gray' }}>
                <Close />
              </IconButton>
            )}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Para validar esta missão, envie um print ou foto comprovando a ação.
            </Typography>

            <Box mb={3}>
              <input accept="image/*" style={{ display: 'none' }} id="upload-proof" type="file" onChange={handleFileChange} />
              <label htmlFor="upload-proof">
                <Box
                  sx={{
                    border: `2px dashed ${selectedFile ? colors.primary : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 3,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: selectedFile ? `${colors.primary}10` : 'transparent',
                    '&:hover': { borderColor: colors.primary }
                  }}
                >
                  {selectedFile ? (
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <ImageIcon sx={{ color: colors.primary }} />
                      <Typography>{selectedFile.name}</Typography>
                    </Box>
                  ) : (
                    <Box>
                      <CloudUpload sx={{ fontSize: 40, color: '#AAA', mb: 1 }} />
                      <Typography color="#AAA">Clique para selecionar Imagem</Typography>
                    </Box>
                  )}
                </Box>
              </label>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Contexto / Descrição"
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              sx={{
                bgcolor: 'rgba(0,0,0,0.2)',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: colors.primary },
                  '&.Mui-focused fieldset': { borderColor: colors.primary },
                  color: 'white'
                },
                '& label.Mui-focused': { color: colors.primary }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setProofDialog(false)} disabled={isUploading} sx={{ color: 'gray' }}>
              {t('btn_cancel')}
            </Button>
            <Button
              onClick={handleSubmitProof}
              variant="contained"
              disabled={isUploading}
              sx={{ bgcolor: colors.primary, color: '#000', fontWeight: 800 }}
            >
              {isUploading ? 'ENVIANDO...' : t('btn_send_analysis')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={toast.open}
          autoHideDuration={6000}
          onClose={() => setToast({ ...toast, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toast.type || 'success'} sx={{ bgcolor: toast.type === 'error' ? '#d32f2f' : '#4CAF50', color: '#FFF', fontWeight: 700 }}>
            {toast.msg}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Challenges;
