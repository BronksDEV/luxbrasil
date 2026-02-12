
import React from 'react';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { Diamond, Engineering, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageRoute } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const Maintenance: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box 
        sx={{ 
            minHeight: '100vh', 
            bgcolor: '#050510', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {/* Background Effects */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
            <Box sx={{ position: 'absolute', top: '20%', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)', filter: 'blur(80px)', animation: 'pulse-gold 4s infinite alternate' }} />
            <Box sx={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #AA8C2C 0%, transparent 70%)', filter: 'blur(100px)', animation: 'pulse-gold 6s infinite alternate-reverse' }} />
        </Box>

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <Box sx={{ mb: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', p: 3, borderRadius: '50%', border: '2px solid #D4AF37', boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)', bgcolor: 'rgba(0,0,0,0.5)' }}>
                <Diamond sx={{ fontSize: 60, color: '#D4AF37', animation: 'spin-slow 10s linear infinite' }} />
            </Box>

            <Typography variant="overline" color="#D4AF37" sx={{ letterSpacing: 4, fontWeight: 700, display: 'block', mb: 2 }}>
                LUX BRASIL
            </Typography>

            <Typography variant="h2" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#FFF', mb: 2, textTransform: 'uppercase' }}>
                {t('maintenance_title')}
            </Typography>

            <Typography variant="h6" sx={{ color: '#A0A0A0', fontWeight: 400, maxWidth: 600, mx: 'auto', mb: 6, lineHeight: 1.6 }}>
                {t('maintenance_subtitle')}
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
                <Box sx={{ px: 3, py: 1, borderRadius: 2, bgcolor: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Typography variant="caption" color="#D4AF37" fontWeight={700}>
                        {t('maintenance_status')}
                    </Typography>
                </Box>
            </Stack>

            <Box mt={8}>
                <Typography variant="body2" color="#444">
                    {t('maintenance_back_soon')}
                </Typography>
                
                {/* ROTA DE FUGA PARA ADMINS */}
                <Button 
                    startIcon={<Lock sx={{ fontSize: 14 }} />}
                    onClick={() => navigate(PageRoute.LOGIN)}
                    sx={{ 
                        mt: 2, 
                        color: '#333', 
                        fontSize: '0.7rem', 
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        opacity: 0.5,
                        '&:hover': { color: '#D4AF37', opacity: 1, bgcolor: 'transparent' } 
                    }}
                >
                    {t('maintenance_staff_access')}
                </Button>
            </Box>
        </Container>

        <style>{`
            @keyframes pulse-gold {
                0% { opacity: 0.3; transform: scale(1); }
                100% { opacity: 0.6; transform: scale(1.1); }
            }
            @keyframes spin-slow {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </Box>
  );
};

export default Maintenance;
