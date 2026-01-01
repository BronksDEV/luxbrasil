import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Tabs, Tab, Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Chip, Alert, Snackbar } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { api } from '../services/api';
import { WinnerLog } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const MyPrizes: React.FC = () => {
    const { t } = useLanguage();
    const [prizes, setPrizes] = useState<WinnerLog[]>([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{msg: string, type: 'success' | 'info'} | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            
            // Executa em paralelo para performance e garantia de execução
            const [histData, completedChallenges] = await Promise.all([
                api.game.getHistory().catch(e => { console.error(e); return []; }),
                api.challenges.checkAction('visit_wallet').catch(e => { console.error("Erro desafio", e); return []; })
            ]);

            setPrizes(histData);
            setLoading(false);

            if (completedChallenges && completedChallenges.length > 0) {
                // Notifica sobre todos os completados (normalmente 1)
                const challenge = completedChallenges[0];
                const rewardText = challenge.reward_spins > 0 ? ` +${challenge.reward_spins} Giros!` : '!';
                setToast({
                    msg: `Missão "${challenge.title}" Concluída!${rewardText}`,
                    type: 'success'
                });
            }
        };
        load();
    }, []);

    const handleRedeem = async (id: string) => {
        try {
            const updated = await api.game.requestRedemption(id);
            setPrizes(prev => prev.map(p => p.id === id ? updated : p));
            setToast({ msg: 'Solicitação enviada. Nosso concierge entrará em contato.', type: 'info' });
        } catch (e) {
            console.error(e);
        }
    };

    const filterPrizes = () => {
        if (tabIndex === 0) return prizes; // All
        if (tabIndex === 1) return prizes.filter(p => p.status === 'pending');
        if (tabIndex === 2) return prizes.filter(p => p.status === 'requested');
        if (tabIndex === 3) return prizes.filter(p => p.status === 'redeemed');
        return prizes;
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'pending': return 'warning';
            case 'requested': return 'info';
            case 'redeemed': return 'success';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Typography variant="h3" gutterBottom color="primary.dark">{t('prizes_title')}</Typography>
            
            <Paper sx={{ mb: 4, bgcolor: 'transparent', boxShadow: 'none' }}>
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} textColor="primary" indicatorColor="primary">
                    <Tab label="Todos" />
                    <Tab label={t('status_pending')} />
                    <Tab label={t('status_requested')} />
                    <Tab label={t('status_redeemed')} />
                </Tabs>
            </Paper>

            <Paper sx={{ p: 0, overflow: 'hidden', bgcolor: '#0F121D', border: '1px solid rgba(255,255,255,0.05)' }}>
                {loading ? <Box p={4} color="white">{t('loading')}</Box> : (
                    filterPrizes().length === 0 ? (
                        <Box p={6} textAlign="center">
                            <Typography variant="h6" color="text.secondary">{t('prizes_empty')}</Typography>
                        </Box>
                    ) : (
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
                                                    sx={{ borderRadius: 0, borderColor: 'rgba(255,255,255,0.3)', color: '#FFF' }}
                                                >
                                                    {t('redeem')}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )
                )}
            </Paper>

            <Snackbar 
                open={!!toast} 
                autoHideDuration={6000} 
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setToast(null)} 
                    severity={toast?.type === 'success' ? 'success' : 'info'} 
                    icon={toast?.type === 'success' ? <EmojiEvents fontSize="inherit" /> : undefined}
                    sx={{ 
                        width: '100%',
                        bgcolor: toast?.type === 'success' ? '#D4AF37' : '#2196f3',
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