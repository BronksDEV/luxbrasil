import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, IconButton, Snackbar, Alert, List, ListItem, ListItemText, Chip, Button, Grid, Avatar, Tooltip, Divider, Paper } from '@mui/material';
import { ContentCopy, WhatsApp, Telegram, Groups, Star, Share, Casino, TrendingUp, Person, EmojiEvents, CheckCircle } from '@mui/icons-material';
import { supabase } from '../services/api';
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
                const { data, error } = await supabase
                    .from('referrals')
                    .select('*') 
                    .eq('referrer_id', user.id);
                
                if (data && data.length > 0) {
                    const profileIds = data.map((r: any) => r.referred_id);
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, created_at')
                        .in('id', profileIds);
                        
                    const combined = data.map((r: any) => {
                        const p = profiles?.find((prof: any) => prof.id === r.referred_id);
                        return {
                            ...r,
                            referred: {
                                full_name: p?.full_name || 'Usuário',
                                email: p?.email || '...',
                                created_at: p?.created_at || r.created_at
                            }
                        };
                    });
                    
                    combined.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    setReferrals(combined);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };
    fetchRef();
  }, []);

  const inviteLink = `${window.location.origin}/#/register?code=${userCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setNotification({ open: true, message: 'Link copiado com sucesso!' });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareData = {
      title: 'Lux Brasil',
      text: 'Venha girar a roleta e ganhar prêmios incríveis na Lux Brasil!',
      url: inviteLink
  };

  const handleShare = async () => {
      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (e) {}
      } else {
          handleCopy();
      }
  };

  return (
    <Box>
        <Paper sx={{ 
            p: { xs: 3, md: 5 }, 
            bgcolor: '#0F121D', 
            border: '2px solid rgba(212, 175, 55, 0.2)',
            borderRadius: 4, 
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            background: 'linear-gradient(135deg, #0F121D 0%, #1a1f2e 100%)'
        }}>
            <Box sx={{ 
                position: 'absolute', 
                top: -50, 
                right: -50, 
                width: 300, 
                height: 300, 
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', 
                filter: 'blur(60px)',
                animation: 'pulse 4s ease-in-out infinite'
            }} />
            
            <Box sx={{ 
                position: 'absolute', 
                bottom: -30, 
                left: -30, 
                width: 200, 
                height: 200, 
                background: 'radial-gradient(circle, rgba(76, 175, 80, 0.1) 0%, transparent 70%)', 
                filter: 'blur(50px)'
            }} />

            <Box position="relative" zIndex={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: 3, 
                            bgcolor: 'rgba(212, 175, 55, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(212, 175, 55, 0.3)'
                        }}>
                            <Groups sx={{ color: '#D4AF37', fontSize: 36 }} />
                        </Box>
                        <Box>
                            <Typography variant="overline" sx={{ color: '#D4AF37', letterSpacing: 2, fontSize: '0.7rem', fontWeight: 700 }}>
                                PROGRAMA VIP
                            </Typography>
                            <Typography variant="h4" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#FFF', lineHeight: 1 }}>
                                Indicação Premium
                            </Typography>
                        </Box>
                    </Box>
                    <Chip 
                        icon={<EmojiEvents sx={{ color: '#D4AF37 !important' }} />}
                        label="Ativo"
                        sx={{ 
                            bgcolor: 'rgba(212, 175, 55, 0.2)', 
                            color: '#D4AF37',
                            fontWeight: 800,
                            border: '1px solid rgba(212, 175, 55, 0.4)',
                            fontSize: '0.75rem'
                        }}
                    />
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, fontSize: '1rem', lineHeight: 1.7 }}>
                    Convide seus amigos e receba <strong style={{color: '#4CAF50'}}>+1 giro grátis</strong> para cada cadastro confirmado. 
                    Quanto mais amigos, mais chances de ganhar prêmios exclusivos!
                </Typography>

                <Grid container spacing={3} mb={5}>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ 
                            p: 3, 
                            bgcolor: 'rgba(212, 175, 55, 0.08)', 
                            border: '1px solid rgba(212, 175, 55, 0.2)',
                            borderRadius: 3,
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            '&:hover': { 
                                bgcolor: 'rgba(212, 175, 55, 0.12)',
                                transform: 'translateY(-5px)',
                                boxShadow: '0 10px 30px rgba(212, 175, 55, 0.2)'
                            }
                        }}>
                            <Avatar sx={{ 
                                width: 56, 
                                height: 56, 
                                bgcolor: 'rgba(212, 175, 55, 0.2)', 
                                color: '#D4AF37',
                                mx: 'auto',
                                mb: 2,
                                border: '2px solid rgba(212, 175, 55, 0.3)'
                            }}>
                                <Person sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="h3" color="#D4AF37" fontWeight={900} mb={1}>
                                {inviteCount}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>
                                Amigos Ativos
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ 
                            p: 3, 
                            bgcolor: 'rgba(76, 175, 80, 0.08)', 
                            border: '1px solid rgba(76, 175, 80, 0.2)',
                            borderRadius: 3,
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            '&:hover': { 
                                bgcolor: 'rgba(76, 175, 80, 0.12)',
                                transform: 'translateY(-5px)',
                                boxShadow: '0 10px 30px rgba(76, 175, 80, 0.2)'
                            }
                        }}>
                            <Avatar sx={{ 
                                width: 56, 
                                height: 56, 
                                bgcolor: 'rgba(76, 175, 80, 0.2)', 
                                color: '#4CAF50',
                                mx: 'auto',
                                mb: 2,
                                border: '2px solid rgba(76, 175, 80, 0.3)'
                            }}>
                                <Casino sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="h3" color="#4CAF50" fontWeight={900} mb={1}>
                                +{inviteEarnings}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>
                                Giros Conquistados
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ 
                            p: 3, 
                            bgcolor: 'rgba(33, 150, 243, 0.08)', 
                            border: '1px solid rgba(33, 150, 243, 0.2)',
                            borderRadius: 3,
                            textAlign: 'center',
                            transition: 'all 0.3s',
                            '&:hover': { 
                                bgcolor: 'rgba(33, 150, 243, 0.12)',
                                transform: 'translateY(-5px)',
                                boxShadow: '0 10px 30px rgba(33, 150, 243, 0.2)'
                            }
                        }}>
                            <Avatar sx={{ 
                                width: 56, 
                                height: 56, 
                                bgcolor: 'rgba(33, 150, 243, 0.2)', 
                                color: '#2196F3',
                                mx: 'auto',
                                mb: 2,
                                border: '2px solid rgba(33, 150, 243, 0.3)'
                            }}>
                                <TrendingUp sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="h3" color="#2196F3" fontWeight={900} mb={1}>
                                {inviteCount * 100}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary" textTransform="uppercase" fontWeight={600} letterSpacing={1}>
                                Taxa de Conversão
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

                <Box mb={4}>
                    <Typography variant="h6" color="#FFF" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Share sx={{ color: '#D4AF37' }} />
                        Seu Link Exclusivo
                    </Typography>
                    
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            bgcolor: 'rgba(0,0,0,0.4)', 
                            border: '2px solid rgba(212, 175, 55, 0.3)', 
                            borderRadius: 3,
                            p: 2,
                            transition: 'all 0.3s',
                            '&:hover': {
                                borderColor: 'rgba(212, 175, 55, 0.5)',
                                boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)'
                            }
                        }}
                    >
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                flexGrow: 1, 
                                fontFamily: 'monospace', 
                                color: '#D4AF37',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mr: 2
                            }}
                        >
                            {inviteLink}
                        </Typography>
                        <Tooltip title={copied ? "Copiado!" : "Copiar Link"}>
                            <IconButton 
                                onClick={handleCopy} 
                                sx={{ 
                                    bgcolor: copied ? 'rgba(76, 175, 80, 0.2)' : 'rgba(212, 175, 55, 0.15)',
                                    color: copied ? '#4CAF50' : '#D4AF37',
                                    '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.25)' },
                                    transition: 'all 0.3s'
                                }}
                            >
                                {copied ? <CheckCircle /> : <ContentCopy />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Compartilhar">
                            <IconButton 
                                onClick={handleShare} 
                                sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    color: '#FFF',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                                }}
                            >
                                <Share />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                    <Button 
                        startIcon={<WhatsApp />} 
                        variant="contained"
                        size="large"
                        sx={{ 
                            bgcolor: '#25D366',
                            color: '#FFF',
                            fontWeight: 700,
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: '0 8px 20px rgba(37, 211, 102, 0.3)',
                            '&:hover': { 
                                bgcolor: '#20BA5A',
                                boxShadow: '0 12px 30px rgba(37, 211, 102, 0.4)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s'
                        }}
                        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`)}
                    >
                        Compartilhar no WhatsApp
                    </Button>
                    <Button 
                        startIcon={<Telegram />} 
                        variant="contained"
                        size="large"
                        sx={{ 
                            bgcolor: '#229ED9',
                            color: '#FFF',
                            fontWeight: 700,
                            px: 4,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: '0 8px 20px rgba(34, 158, 217, 0.3)',
                            '&:hover': { 
                                bgcolor: '#1A8CC4',
                                boxShadow: '0 12px 30px rgba(34, 158, 217, 0.4)',
                                transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s'
                        }}
                        onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)}
                    >
                        Compartilhar no Telegram
                    </Button>
                </Box>

                <Box mt={5}>
                    <Typography variant="h6" color="#FFF" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star sx={{ color: '#D4AF37' }} />
                        Últimos Cadastros
                    </Typography>
                    
                    {referrals.length === 0 ? (
                        <Paper sx={{ 
                            p: 5, 
                            textAlign: 'center',
                            bgcolor: 'rgba(0,0,0,0.2)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            borderRadius: 3
                        }}>
                            <Groups sx={{ fontSize: 64, color: 'rgba(255,255,255,0.1)', mb: 2 }} />
                            <Typography color="text.secondary" variant="body1" fontWeight={600}>
                                Você ainda não possui indicações
                            </Typography>
                            <Typography color="text.secondary" variant="caption">
                                Compartilhe seu link e comece a ganhar giros extras!
                            </Typography>
                        </Paper>
                    ) : (
                        <List sx={{ bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            {referrals.slice(0, 5).map((ref, i) => (
                                <ListItem 
                                    key={i} 
                                    sx={{ 
                                        borderBottom: i !== Math.min(referrals.length, 5) - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                        py: 2,
                                        transition: 'all 0.2s',
                                        '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.05)' }
                                    }}
                                >
                                    <Avatar sx={{ 
                                        bgcolor: 'rgba(212, 175, 55, 0.2)', 
                                        color: '#D4AF37',
                                        mr: 2,
                                        width: 44,
                                        height: 44,
                                        fontWeight: 800
                                    }}>
                                        {ref.referred.full_name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <ListItemText 
                                        primary={
                                            <Typography color="#FFF" fontWeight={700} fontSize="1rem">
                                                {ref.referred.full_name}
                                            </Typography>
                                        }
                                        secondary={
                                            <Typography variant="caption" color="gray" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                                Cadastrado em {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        }
                                    />
                                    <Chip 
                                        icon={ref.reward_paid ? <CheckCircle sx={{ fontSize: 16 }} /> : undefined}
                                        label={ref.reward_paid ? "+1 Giro" : "Pendente"} 
                                        size="small" 
                                        sx={{
                                            bgcolor: ref.reward_paid ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)',
                                            color: ref.reward_paid ? '#4CAF50' : '#AAA',
                                            fontWeight: 800,
                                            border: ref.reward_paid ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '0.7rem'
                                        }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Box>
        </Paper>

        <Snackbar 
            open={notification.open} 
            autoHideDuration={3000} 
            onClose={() => setNotification({...notification, open: false})}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert 
                severity="success" 
                icon={<CheckCircle />}
                sx={{ 
                    bgcolor: '#4CAF50', 
                    color: '#FFF', 
                    fontWeight: 800,
                    boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
                    '& .MuiAlert-icon': { color: '#FFF' }
                }}
            >
                {notification.message}
            </Alert>
        </Snackbar>

        <style>
            {`
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.6; }
                }
            `}
        </style>
    </Box>
  );
};

export default InviteSystem;