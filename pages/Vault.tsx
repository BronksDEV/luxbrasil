import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Button, CircularProgress, Alert, Chip, Grid } from '@mui/material';
import { Diamond, Handshake } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useThemeConfig } from '../contexts/ThemeContext';

const getStoreItems = (t: any) => [
    { id: 'spin-pack-1', name: t('store_item_spin_name'), description: t('store_item_spin_desc'), cost: 500, type: 'spins' as const, image: 'giro.png', highlight: false, label: t('label_virtual') },
    { id: 'FOO36-BRA', name: t('store_item_headphone_name'), description: t('store_item_headphone_desc'), cost: 2500, type: 'physical' as const, image: 'fone1.png', highlight: true, label: t('label_physical') },
    { id: 'FOO42-BRA', name: t('store_item_earbuds_name'), description: t('store_item_earbuds_desc'), cost: 3500, type: 'physical' as const, image: 'fone2.png', highlight: true, label: t('label_physical') },
    { id: 'CASH-500', name: t('store_item_money_name'), description: t('store_item_money_desc', { amount: '500,00' }), cost: 6000, type: 'money' as const, moneyValue: 500, image: 'money.png', highlight: true, label: t('label_money') }
];

const Vault: React.FC = () => {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();
  const { themeConfig } = useThemeConfig();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string}|null>(null);
  
  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';
  const themeColor = isCarnival ? '#9C27B0' : '#D4AF37';
  
  const items = getStoreItems(t);

  const handlePurchase = async (item: typeof items[0]) => {
    setLoading(item.id);
    setMessage(null);
    try {
        await api.game.purchaseStoreItem({ name: item.name, cost: item.cost, type: item.type, id: item.id, moneyValue: item.moneyValue });
        await refreshUser();
        let successMsg = "";
        if (item.type === 'spins') successMsg = t('vault_exchange_success');
        else if (item.type === 'money') successMsg = t('purchase_money_success', { amount: item.moneyValue });
        else successMsg = t('purchase_success', { item: item.name });
        setMessage({ type: 'success', text: successMsg });
    } catch (e: any) {
        setMessage({ type: 'error', text: e.message || t('vault_exchange_error') });
    } finally {
        setLoading(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#050510', py: 6 }}>
        <Container maxWidth="lg">
            <Box textAlign="center" mb={6}>
                <Box display="inline-flex" alignItems="center" justifyContent="center" gap={2} sx={{ mb: 3, px: 3, py: 1, borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(90deg, rgba(212,175,55,0.1) 0%, rgba(0, 230, 118, 0.1) 100%)', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                    <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700, lineHeight: 1 }}>LUX STORE</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#555', fontSize: '0.8rem' }}><Handshake fontSize="small" /></Box>
                    <Typography variant="overline" sx={{ color: '#00E676', letterSpacing: 2, fontWeight: 900, lineHeight: 1, textShadow: '0 0 10px rgba(0, 230, 118, 0.4)' }}>WG</Typography>
                </Box>
                <Typography variant="h3" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#FFF' }}>{t('vault_title')}
                </Typography>
                <Typography variant="body1" color="text.secondary" mt={2}>{t('vault_subtitle')}</Typography>
                {user && (
                    <Chip 
                        icon={<Diamond sx={{ color: '#000 !important' }} />} 
                        label={`${t('wallet').toUpperCase()}: ${user.lux_coins} LC`} 
                        sx={{ 
                            mt: 3, 
                            bgcolor: themeColor, 
                            color: '#000', 
                            fontWeight: 800, 
                            fontSize: '1rem', 
                            px: 2, py: 2.5, 
                            borderRadius: 50,
                            boxShadow: isCarnival ? '0 0 20px rgba(156, 39, 176, 0.5)' : 'none'
                        }} 
                    />
                )}
            </Box>
            {message && <Alert severity={message.type} sx={{ mb: 4, bgcolor: 'rgba(0,0,0,0.5)', color: '#FFF', border: `1px solid ${message.type === 'success' ? '#4CAF50' : '#f44336'}` }}>{message.text}</Alert>}
            <Grid container spacing={4} justifyContent="center">
                {items.map((item) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                        <Paper sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            bgcolor: 'rgba(15, 18, 29, 0.8)', 
                            border: isCarnival 
                                ? (item.highlight ? '1px solid #9C27B0' : '1px solid rgba(156, 39, 176, 0.3)')
                                : (item.highlight ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)'),
                            borderRadius: 4, 
                            position: 'relative', 
                            overflow: 'hidden', 
                            transition: 'transform 0.3s', 
                            boxShadow: isCarnival && item.highlight ? '0 0 25px rgba(156, 39, 176, 0.2)' : 'none',
                            '&:hover': { 
                                transform: 'translateY(-5px)', 
                                boxShadow: isCarnival ? '0 10px 40px rgba(156, 39, 176, 0.4)' : '0 10px 30px rgba(0,0,0,0.5)',
                                borderColor: themeColor 
                            } 
                        }}>
                            <Box sx={{ width: '100%', height: 220, backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                                <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 18, 29, 1), transparent 50%)' }} />
                                <Box sx={{ position: 'absolute', top: 15, right: 15 }}><Chip label={item.label} size="small" sx={{ bgcolor: item.type === 'money' ? '#4CAF50' : '#000', color: '#FFF', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' }} /></Box>
                            </Box>
                            <Box p={3} width="100%" display="flex" flexDirection="column" flexGrow={1}>
                                <Typography variant="h6" fontWeight={800} color="#FFF" gutterBottom>{item.name}</Typography>
                                <Typography variant="body2" color="text.secondary" mb={3} flexGrow={1}>{item.description}</Typography>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={1.5} bgcolor="rgba(0,0,0,0.3)" borderRadius={2}>
                                        <Typography variant="body2" color="gray">{t('cost_label')}</Typography>
                                        <Typography variant="h6" fontWeight={900} color={themeColor} display="flex" alignItems="center" gap={0.5}><Diamond fontSize="small" /> {item.cost}</Typography>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    fullWidth 
                                    onClick={() => handlePurchase(item)} 
                                    disabled={loading !== null || (user?.lux_coins || 0) < item.cost} 
                                    sx={{ 
                                        bgcolor: themeColor, 
                                        color: '#000', 
                                        fontWeight: 800, 
                                        py: 1.5, 
                                        '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: '#555' }, 
                                        '&:hover': { bgcolor: isCarnival ? '#E040FB' : '#F3E5AB' } 
                                    }}
                                >
                                    {loading === item.id ? <CircularProgress size={24} color="inherit" /> : t('btn_redeem_item')}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Container>
    </Box>
  );
};

export default Vault;
