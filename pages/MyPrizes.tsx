import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Tabs, Tab, Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Alert, Snackbar, useTheme, useMediaQuery, Grid, Divider } from '@mui/material';
import { EmojiEvents, AccessTime, ReceiptLong } from '@mui/icons-material';
import { api } from '../services/api';
import { WinnerLog } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';

const getStatusColor = (status: string) => {
    switch(status) {
        case 'pending': return 'warning';
        case 'requested': return 'info';
        case 'redeemed': return 'success';
        default: return 'default';
    }
};

interface PrizeCardProps {
    prize: WinnerLog;
    t: (key: string, params?: any) => string;
    onRedeem: (id: string) => void;
}

const PrizeCard: React.FC<PrizeCardProps> = ({ prize, t, onRedeem }) => (
    <Paper sx={{ 
        p: 2.5, 
        mb: 2, 
        bgcolor: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(212, 175, 55, 0.2)',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden'
    }}>
        <Box sx={{ 
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, 
            bgcolor: prize.status === 'redeemed' ? '#4CAF50' : prize.status === 'pending' ? '#FFD700' : '#2196f3' 
        }} />

        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} pl={1}>
            <Box>
                <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                    <AccessTime sx={{ fontSize: 14 }} /> {new Date(prize.timestamp).toLocaleDateString()}
                </Typography>
                <Typography variant="h6" color="#FFF" fontWeight={700} sx={{ mt: 0.5 }}>
                    {prize.prize_name}
                </Typography>
            </Box>
            <Chip 
                label={t(`status_${prize.status}`)} 
                color={getStatusColor(prize.status) as any} 
                size="small" 
                variant="filled"
                sx={{ fontWeight: 700, borderRadius: 1 }}
            />
        </Box>

        <Box sx={{ 
            bgcolor: 'rgba(0,0,0,0.3)', 
            p: 1.5, 
            borderRadius: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            border: '1px dashed rgba(255,255,255,0.1)',
            mb: 2,
            ml: 1
        }}>
            <Box display="flex" alignItems="center" gap={1}>
                <ReceiptLong sx={{ color: '#888', fontSize: 18 }} />
                <Typography variant="body2" color="gray">{t('label_code')}</Typography>
            </Box>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#D4AF37', fontWeight: 700, letterSpacing: 1 }}>
                {prize.redemption_code}
            </Typography>
        </Box>

        {prize.status === 'pending' && (
            <Button 
                fullWidth 
                variant="outlined" 
                onClick={() => onRedeem(prize.id)}
                sx={{ 
                    ml: 1,
                    width: 'calc(100% - 8px)',
                    borderColor: '#D4AF37', 
                    color: '#D4AF37',
                    fontWeight: 700,
                    '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.1)', borderColor: '#FFF' }
                }}
            >
                {t('redeem')}
            </Button>
        )}
    </Paper>
);

const MyPrizes: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const theme = useTheme() as any;
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [prizes, setPrizes] = useState<WinnerLog[]>([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'info' | 'error'} | null>(null);

    const isRealPrize = (log: WinnerLog) => {
        const name = log.prize_name.toLowerCase();
        if (name.includes('tente') || name.includes('tnt') || name.includes('não foi')) return false;
        if ((!log.prize_value || log.prize_value <= 0) && log.prize_type !== 'physical') return false;
        return true;
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            
            const [histData, completedChallenges] = await Promise.all([
                api.game.getHistory(user?.id).catch(e => { console.error(e); return []; }),
                api.challenges.checkAction('visit_wallet').catch(e => { console.error("Erro desafio", e); return []; })
            ]);

            setPrizes(histData.filter(isRealPrize));
            setLoading(false);

            if (completedChallenges && completedChallenges.length > 0) {
                const challenge = completedChallenges[0];
                const rewardText = challenge.reward_spins > 0 ? ` +${challenge.reward_spins} Giros!` : '!';
                setToast({
                    msg: t('notification_mission_completed', { name: challenge.title }) + rewardText,
                    type: 'success'
                });
            }
        };
        if (user) {
            load();
        }
    }, [user, t]);

    const handleRedeem = async (id: string) => {
        try {
            const updated = await api.game.requestRedemption(id);
            setPrizes(prev => prev.map(p => p.id === id ? updated : p));
            setToast({ msg: t('msg_redemption_sent'), type: 'info' });
        } catch (e: any) {
            console.error(e);
            setToast({ msg: e.message || t('error_generic'), type: 'error' });
        }
    };

    const filterPrizes = () => {
        if (tabIndex === 0) return prizes;
        if (tabIndex === 1) return prizes.filter(p => p.status === 'pending');
        if (tabIndex === 2) return prizes.filter(p => p.status === 'requested');
        if (tabIndex === 3) return prizes.filter(p => p.status === 'redeemed');
        return prizes;
    };

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
            <Box mb={4}>
                <Typography variant="overline" color="text.secondary">{t('member_area')}</Typography>
                <Typography variant="h4" color="primary.dark" fontWeight={800}>{t('prizes_title')}</Typography>
            </Box>
            
            <Paper sx={{ mb: 4, bgcolor: 'transparent', boxShadow: 'none' }}>
                <Tabs 
                    value={tabIndex} 
                    onChange={(_, v) => setTabIndex(v)} 
                    textColor="primary" 
                    indicatorColor="primary"
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                >
                    <Tab label={t('total_label')} sx={{ fontWeight: 600 }} />
                    <Tab label={t('status_pending')} sx={{ fontWeight: 600 }} />
                    <Tab label={t('status_requested')} sx={{ fontWeight: 600 }} />
                    <Tab label={t('status_redeemed')} sx={{ fontWeight: 600 }} />
                </Tabs>
            </Paper>

            {loading ? <Box p={4} color="white" textAlign="center">{t('loading')}</Box> : (
                filterPrizes().length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed #444' }}>
                        <Typography variant="h6" color="text.secondary">{t('prizes_empty')}</Typography>
                    </Paper>
                ) : (
                    <>
                        <Paper sx={{ 
                            display: { xs: 'none', md: 'block' },
                            p: 0, 
                            overflow: 'hidden', 
                            bgcolor: '#0F121D', 
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 3
                        }}>
                            <Table>
                                <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>{t('table_date')}</TableCell>
                                        <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>{t('table_prize')}</TableCell>
                                        <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>{t('table_code')}</TableCell>
                                        <TableCell sx={{ color: '#D4AF37', fontWeight: 700 }}>{t('table_status')}</TableCell>
                                        <TableCell align="right" sx={{ color: '#D4AF37', fontWeight: 700 }}>{t('table_action')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filterPrizes().map((prize) => (
                                        <TableRow key={prize.id} hover sx={{ '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.05)' } }}>
                                            <TableCell sx={{ color: '#FFF' }}>{new Date(prize.timestamp).toLocaleDateString()}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#FFF' }}>{prize.prize_name}</TableCell>
                                            <TableCell>
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.1)', color: '#FFF', px: 1, py: 0.5, borderRadius: 1 }}>
                                                    {prize.redemption_code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={t(`status_${prize.status}`)} 
                                                    color={getStatusColor(prize.status) as any} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ fontWeight: 600 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {prize.status === 'pending' && (
                                                    <Button 
                                                        size="small" 
                                                        variant="outlined" 
                                                        onClick={() => handleRedeem(prize.id)}
                                                        sx={{ borderRadius: 4, borderColor: 'rgba(255,255,255,0.3)', color: '#FFF', '&:hover': { borderColor: '#D4AF37', color: '#D4AF37' } }}
                                                    >
                                                        {t('redeem')}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>

                        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column' }}>
                            {filterPrizes().map((prize) => (
                                <PrizeCard key={prize.id} prize={prize} t={t} onRedeem={handleRedeem} />
                            ))}
                        </Box>
                    </>
                )
            )}

            <Snackbar 
                open={!!toast} 
                autoHideDuration={6000} 
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setToast(null)} 
                    severity={toast?.type === 'success' ? 'success' : (toast?.type === 'error' ? 'error' : 'info')} 
                    icon={toast?.type === 'success' ? <EmojiEvents fontSize="inherit" /> : undefined}
                    sx={{ 
                        width: '100%',
                        bgcolor: toast?.type === 'success' ? '#D4AF37' : (toast?.type === 'error' ? '#D32F2F' : '#2196f3'),
                        color: toast?.type === 'success' ? '#000' : '#FFF',
                        fontWeight: toast?.type === 'success' ? 800 : 500,
                        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                    }}
                >
                    {toast?.msg}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default MyPrizes;