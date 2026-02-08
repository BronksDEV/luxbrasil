
import React from 'react';
import { Box, Typography, Button, Chip } from '@mui/material';
import { Wallet, VerifiedUser } from '@mui/icons-material'; // Ícone Wallet mais limpo
import { useRouletteTimer } from '../hooks/useRouletteTimer';
import { useNavigate } from 'react-router-dom';
import { PageRoute } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { useThemeConfig } from '../contexts/ThemeContext';

interface RouletteTimerProps {
  timerDate: string | null | undefined;
  spinsRemaining: number;
}

const RouletteTimer: React.FC<RouletteTimerProps> = ({ timerDate, spinsRemaining }) => {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();
  const { themeConfig } = useThemeConfig();
  const { formatTime, canClaim, claimSpin } = useRouletteTimer(timerDate);
  const navigate = useNavigate();

  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  const handleClaim = () => {
      claimSpin(() => {
          // Callback chamado após sucesso no RPC
          refreshUser();
      });
  };

  return (
    <Box sx={{ position: 'relative', mb: 4 }}>
        {/* Glow Background */}
        <Box sx={{
            position: 'absolute',
            inset: 0,
            background: isCarnival ? 'rgba(156, 39, 176, 0.1)' : 'rgba(212, 175, 55, 0.05)',
            filter: 'blur(20px)',
            borderRadius: 4,
            zIndex: 0
        }} />

        {/* Main Card Container */}
        <Box sx={{
            position: 'relative',
            background: 'linear-gradient(145deg, #0F121D 0%, #050510 100%)',
            borderRadius: 4,
            border: isCarnival ? '1px solid rgba(156, 39, 176, 0.3)' : '1px solid rgba(212, 175, 55, 0.2)',
            overflow: 'hidden',
            zIndex: 1,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            {/* Header Strip */}
            <Box sx={{ 
                p: 2, 
                borderBottom: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <VerifiedUser sx={{ color: '#4CAF50', fontSize: 20 }} />
                    <Typography variant="overline" color="text.secondary" fontWeight={700} letterSpacing={1}>
                        {t('status_label')}
                    </Typography>
                </Box>
                <Chip 
                    label={t('status_active_user')}
                    size="small" 
                    sx={{ 
                        bgcolor: isCarnival ? 'rgba(156, 39, 176, 0.1)' : 'rgba(212, 175, 55, 0.1)', 
                        color: isCarnival ? '#E040FB' : '#D4AF37', 
                        border: isCarnival ? '1px solid rgba(156, 39, 176, 0.3)' : '1px solid rgba(212, 175, 55, 0.3)',
                        fontWeight: 800,
                        fontSize: '0.7rem'
                    }} 
                />
            </Box>

            <Box sx={{ p: 3, textAlign: 'center' }}>
                {/* Spins Counter Block */}
                <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 3, 
                    background: isCarnival 
                        ? 'linear-gradient(90deg, rgba(156, 39, 176, 0.1) 0%, rgba(0,0,0,0) 100%)' 
                        : 'linear-gradient(90deg, rgba(212,175,55,0.1) 0%, rgba(0,0,0,0) 100%)',
                    borderLeft: isCarnival ? '4px solid #E040FB' : '4px solid #D4AF37',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box textAlign="left">
                        <Typography variant="caption" color="gray" display="block" sx={{ lineHeight: 1 }}>
                            {t('your_spins')}
                        </Typography>
                        <Typography variant="h5" sx={{ color: '#FFF', fontWeight: 800, letterSpacing: 1 }}>
                            {t('available')}
                        </Typography>
                    </Box>
                    <Box sx={{
                        width: 50, height: 50,
                        borderRadius: '50%',
                        bgcolor: isCarnival ? '#E040FB' : '#D4AF37',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: isCarnival ? '0 0 15px rgba(156, 39, 176, 0.4)' : '0 0 15px rgba(212, 175, 55, 0.4)'
                    }}>
                        <Typography variant="h5" sx={{ color: '#000', fontWeight: 900 }}>
                            {spinsRemaining}
                        </Typography>
                    </Box>
                </Box>

                {/* Timer Section */}
                {spinsRemaining === 0 ? (
                    <Box sx={{ position: 'relative', py: 2 }}>
                         <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 2, mb: 1, display: 'block' }}>
                            {t('next_refill_in')}
                         </Typography>
                         
                         {/* Digital Clock Effect */}
                         <Typography variant="h3" sx={{ 
                             fontFamily: 'monospace', 
                             fontWeight: 700, 
                             color: canClaim ? '#4CAF50' : '#FFF',
                             textShadow: canClaim ? '0 0 20px rgba(76, 175, 80, 0.5)' : '0 0 10px rgba(255,255,255,0.2)',
                             letterSpacing: -2
                         }}>
                            {formatTime}
                         </Typography>

                         {canClaim ? (
                             <Button 
                                variant="contained" 
                                fullWidth 
                                size="large" 
                                onClick={handleClaim} 
                                sx={{ 
                                    mt: 3,
                                    fontWeight: 900, 
                                    background: 'linear-gradient(90deg, #4CAF50, #81C784)',
                                    color: '#000',
                                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                                    animation: 'pulse-gold 2s infinite'
                                }}
                             >
                                {t('redeem_now')}
                             </Button>
                         ) : (
                             <Box sx={{ mt: 3, height: 4, bgcolor: '#222', borderRadius: 2, overflow: 'hidden' }}>
                                 <Box sx={{ 
                                     width: '100%', 
                                     height: '100%', 
                                     background: isCarnival 
                                        ? 'linear-gradient(90deg, transparent, #E040FB, transparent)'
                                        : 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                                     animation: 'loading-bar 2s infinite linear' 
                                 }} />
                                 <style>{`@keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
                             </Box>
                         )}
                    </Box>
                ) : (
                    <Box sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('ready_to_use')}
                        </Typography>
                        <Button 
                            variant="outlined" 
                            fullWidth 
                            sx={{ mt: 2, borderColor: isCarnival ? '#E040FB' : '#D4AF37', color: isCarnival ? '#E040FB' : '#D4AF37' }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            {t('go_to_roulette')}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Footer Button - Wallet */}
            <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)' }}>
                <Button 
                    fullWidth 
                    startIcon={<Wallet />} 
                    onClick={() => navigate(PageRoute.MY_PRIZES)}
                    sx={{ 
                        color: '#FFF', 
                        opacity: 0.7, 
                        fontWeight: 700,
                        '&:hover': { opacity: 1, background: 'rgba(255,255,255,0.05)', color: isCarnival ? '#E040FB' : '#D4AF37' } 
                    }}
                >
                    {t('open_wallet')}
                </Button>
            </Box>
        </Box>
    </Box>
  );
};

export default RouletteTimer;
