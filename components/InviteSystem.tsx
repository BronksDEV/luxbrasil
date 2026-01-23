import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Snackbar, Alert, List, ListItem, ListItemText, Chip, Button, Grid, Avatar, Tooltip, Divider, Paper, TextField, InputAdornment, ListItemAvatar } from '@mui/material';
import { ContentCopy, WhatsApp, Telegram, Groups, Star, Share, Casino, TrendingUp, Person, EmojiEvents, CheckCircle, AccessTime, HowToReg, Pending } from '@mui/icons-material';
import { supabase, api } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';

interface InviteSystemProps {
  userCode: string;
  inviteCount: number;
  inviteEarnings: number;
}

const InviteSystem: React.FC<InviteSystemProps> = ({ userCode, inviteCount, inviteEarnings }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [notification, setNotification] = useState<{open: boolean, message: string}>({ open: false, message: '' });

  useEffect(() => {
    const fetchRef = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if(user) {
                await api.challenges.checkAction('check_invites').catch(e => console.error(e));

                const { data, error } = await supabase
                    .from('referrals')
                    .select(`
                        *,
                        referred:profiles!referrals_referred_id_fkey (
                            id,
                            full_name,
                            email,
                            created_at
                        )
                    `)
                    .eq('referrer_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (error) {
                    const { data: referralsData } = await supabase.from('referrals').select('*').eq('referrer_id', user.id);
                    if (referralsData && referralsData.length > 0) {
                        const profileIds = referralsData.map((r: any) => r.referred_id);
                        const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, created_at').in('id', profileIds);
                        
                        const combined = referralsData.map((r: any) => {
                            const p = profiles?.find((prof: any) => prof.id === r.referred_id);
                            return { ...r, referred: { full_name: p?.full_name || 'Usuário', email: p?.email || '...', created_at: p?.created_at || r.created_at } };
                        });
                        setReferrals(combined);
                    }
                } else if (data && data.length > 0) {
                    setReferrals(data);
                }
            }
        } catch (e) {
            console.error('Erro ao carregar referrals:', e);
        }
    };
    fetchRef();
  }, []);

  const getBaseUrl = () => {
      const origin = window.location.origin;
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
      return 'https://roletalux.com.br';
  };

  const inviteLink = `${getBaseUrl()}/#/register?code=${userCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setNotification({ open: true, message: t('copied') });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareData = { title: 'Lux Brasil', text: t('invite_share_text'), url: inviteLink };

  return (
    <Box>
        <Paper sx={{ 
            p: { xs: 2, md: 5 }, 
            bgcolor: '#0F121D', 
            border: '2px solid rgba(212, 175, 55, 0.2)',
            borderRadius: 4, 
            position: 'relative', 
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            background: 'linear-gradient(135deg, #0F121D 0%, #1a1f2e 100%)'
        }}>
            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'pulse 4s ease-in-out infinite' }} />
            
            <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={4} flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                        <Box sx={{ width: { xs: 48, md: 60 }, height: { xs: 48, md: 60 }, borderRadius: 3, bgcolor: 'rgba(212, 175, 55, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(212, 175, 55, 0.3)', flexShrink: 0 }}>
                            <Groups sx={{ color: '#D4AF37', fontSize: { xs: 24, md: 36 } }} />
                        </Box>
                        <Box>
                            <Typography variant="overline" sx={{ color: '#D4AF37', letterSpacing: 2, fontSize: { xs: '0.6rem', md: '0.7rem' }, fontWeight: 700 }}>
                                {t('invite_program_vip')}
                            </Typography>
                            <Typography variant="h4" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#FFF', lineHeight: 1, fontSize: { xs: '1.5rem', md: '2.1rem' } }}>
                                {t('invite_premium')}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip icon={<EmojiEvents sx={{ color: '#D4AF37 !important' }} />} label={t('invite_active')} sx={{ bgcolor: 'rgba(212, 175, 55, 0.2)', color: '#D4AF37', fontWeight: 800, border: '1px solid rgba(212, 175, 55, 0.4)', fontSize: '0.75rem', alignSelf: { xs: 'flex-start', sm: 'center' } }} />
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: { xs: '0.9rem', md: '1rem' }, lineHeight: 1.7 }}>
                     {t('invite_desc', { bonus: t('invite_bonus_highlight') })}
                </Typography>

                <Grid container spacing={2} mb={5}>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="h4" color="#D4AF37" fontWeight={900} mb={0.5} fontSize={{ xs: '1.5rem', md: '2rem' }}>{inviteCount}</Typography>
                            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>{t('invite_stats_friends')}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.2)', borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="h4" color="#4CAF50" fontWeight={900} mb={0.5} fontSize={{ xs: '1.5rem', md: '2rem' }}>+{inviteEarnings}</Typography>
                            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>{t('invite_stats_spins')}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.2)', borderRadius: 3, textAlign: 'center' }}>
                            <Typography variant="h4" color="#2196F3" fontWeight={900} mb={0.5} fontSize={{ xs: '1.5rem', md: '2rem' }}>{inviteCount > 0 ? '100' : '0'}%</Typography>
                            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>{t('invite_stats_rate')}</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box mb={4}>
                    <Typography variant="h6" color="#FFF" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Share sx={{ color: '#D4AF37' }} /> {t('invite_link_title')}
                    </Typography>
                    <TextField 
                        fullWidth value={inviteLink} variant="outlined"
                        InputProps={{
                            readOnly: true,
                            sx: { bgcolor: 'rgba(0,0,0,0.4)', color: '#D4AF37', fontFamily: 'monospace', fontWeight: 700, fontSize: { xs: '0.8rem', md: '1rem' }, borderRadius: 3, border: '1px solid rgba(212, 175, 55, 0.3)', '& input': { textAlign: 'center', textOverflow: 'ellipsis' }, paddingRight: 0 },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button onClick={handleCopy} variant="contained" sx={{ bgcolor: copied ? '#4CAF50' : '#D4AF37', color: '#000', fontWeight: 800, height: 56, borderRadius: '0 12px 12px 0', boxShadow: 'none', minWidth: { xs: 80, md: 100 }, fontSize: { xs: '0.7rem', md: '0.875rem' }, '&:hover': { bgcolor: copied ? '#45a049' : '#F3E5AB' } }}>
                                        {copied ? t('copied').toUpperCase() : t('copy').toUpperCase()}
                                    </Button>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap" mb={5} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <Button startIcon={<WhatsApp />} variant="contained" size="large" sx={{ bgcolor: '#25D366', color: '#FFF', fontWeight: 700, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', flexGrow: 1, width: { xs: '100%', sm: 'auto' }, '&:hover': { bgcolor: '#20BA5A' } }} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`)}>WhatsApp</Button>
                    <Button startIcon={<Telegram />} variant="contained" size="large" sx={{ bgcolor: '#229ED9', color: '#FFF', fontWeight: 700, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', flexGrow: 1, width: { xs: '100%', sm: 'auto' }, '&:hover': { bgcolor: '#1A8CC4' } }} onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)}>Telegram</Button>
                </Box>

                {referrals.length > 0 && (
                    <Box mt={4}>
                         <Typography variant="h6" color="#FFF" fontWeight={700} mb={3} display="flex" alignItems="center" gap={1}>
                             <Person sx={{ color: '#D4AF37' }} /> {t('invite_recent_list')}
                         </Typography>
                         <List sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                             {referrals.map((ref) => {
                                 const isPaid = ref.reward_paid || false;
                                 const isRegistered = !!ref.referred; 
                                 return (
                                     <React.Fragment key={ref.id}>
                                         <ListItem alignItems="center">
                                             <ListItemAvatar>
                                                 <Avatar sx={{ bgcolor: isPaid ? '#4CAF50' : 'rgba(212, 175, 55, 0.2)', color: isPaid ? '#FFF' : '#D4AF37' }}>{ref.referred?.full_name?.charAt(0) || 'U'}</Avatar>
                                             </ListItemAvatar>
                                             <ListItemText 
                                                 primary={<Typography color="#FFF" fontWeight={600}>{ref.referred?.full_name || 'Usuário Lux'}</Typography>}
                                                 secondary={<Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}><AccessTime sx={{ fontSize: 12 }} /> {new Date(ref.created_at).toLocaleDateString()}</Typography>}
                                             />
                                             <Chip icon={isPaid ? <CheckCircle sx={{ fontSize: 16 }} /> : (isRegistered ? <HowToReg sx={{ fontSize: 16 }} /> : <Pending sx={{ fontSize: 16 }} />)} label={isPaid ? t('status_rewarded') : (isRegistered ? t('status_registered') : t('status_pending_invite'))} size="small" sx={{ fontWeight: 800, ...(isPaid ? { bgcolor: '#4CAF50', color: '#000', '& .MuiChip-icon': { color: '#000' } } : isRegistered ? { background: 'linear-gradient(45deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.2))', color: '#2196F3', border: '1px solid rgba(33, 150, 243, 0.3)', '& .MuiChip-icon': { color: '#2196F3' } } : { background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)', '& .MuiChip-icon': { color: '#888' } }) }} />
                                         </ListItem>
                                         <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} component="li" />
                                     </React.Fragment>
                                 );
                             })}
                         </List>
                    </Box>
                )}
            </Box>
        </Paper>
        <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification({...notification, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert severity="success" icon={<CheckCircle />} sx={{ bgcolor: '#4CAF50', color: '#FFF', fontWeight: 800, boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)', '& .MuiAlert-icon': { color: '#FFF' } }}>{notification.message}</Alert>
        </Snackbar>
    </Box>
  );
};

export default InviteSystem;