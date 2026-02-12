
import React, { useState } from 'react';
import { Box, Typography, Paper, Fade, useTheme, useMediaQuery, IconButton, Tooltip } from '@mui/material';
import { WhatsApp, Telegram } from '@mui/icons-material';
import { useThemeConfig } from '../contexts/ThemeContext';
import { useLanguage } from '../hooks/useLanguage';

const SupportAvatar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { themeConfig } = useThemeConfig();
  const theme = useTheme() as any;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useLanguage();

  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  // URL Padrão vs URL Carnaval (Local)
  const defaultAvatarUrl = "https://img.freepik.com/fotos-gratis/avatar-androgino-de-pessoa-queer-nao-binaria_23-2151100221.jpg?t=st=1766989621~exp=1766993221~hmac=ea77d713b740eee660debc16d5b6ddc88cbb99e7194b8d074cf266900810f9b3";
  // Certifique-se de ter o arquivo 'carnaval.png' na pasta public/ do projeto
  const carnivalAvatarUrl = "/carnaval.png"; 

  const avatarUrl = isCarnival ? carnivalAvatarUrl : defaultAvatarUrl;
  
  const WHATSAPP_SUPPORT = "https://wa.me/5516994244231";
  const WHATSAPP_BENEFITS = "https://whatsapp.com/channel/0029Vb5p8QG0lwgnb0huk10x";
  const WHATSAPP_CHARITY = "https://whatsapp.com/channel/0029Vb71O9w7YSczODjmbq3V";
  const TELEGRAM_VIP = "https://t.me/wgjogovip";

  const FloatingButton = ({ 
    icon, 
    color, 
    tooltip, 
    link, 
    index 
  }: { 
    icon: React.ReactNode; 
    color: string; 
    tooltip: string; 
    link: string;
    index: number;
  }) => (
    <Tooltip title={tooltip} placement="left" arrow children={
      <IconButton
        onClick={() => window.open(link, '_blank')}
        sx={{
          width: { xs: 40, md: 50 },
          height: { xs: 40, md: 50 },
          bgcolor: color,
          color: '#FFF',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '2px solid rgba(255,255,255,0.2)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          animation: `subtle-pulse ${2 + index * 0.3}s ease-in-out infinite`,
          animationDelay: `${index * 0.15}s`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: -2,
            borderRadius: '50%',
            background: `${color}40`,
            animation: `ping ${2 + index * 0.3}s ease-in-out infinite`,
            animationDelay: `${index * 0.15}s`,
          },
          '&:hover': {
            bgcolor: color,
            transform: 'scale(1.3)',
            boxShadow: `0 8px 24px ${color}80`,
            border: '2px solid rgba(255,255,255,0.5)',
            animation: 'none',
            '&::before': {
              display: 'none'
            }
          }
        }}
      >
        {icon}
      </IconButton>
    } />
  );

  return (
    <>
      <style>
        {`
          @keyframes subtle-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes ping {
            0% {
              transform: scale(1);
              opacity: 0.5;
            }
            50% {
              transform: scale(1.15);
              opacity: 0;
            }
            100% {
              transform: scale(1);
              opacity: 0;
            }
          }
          
          @keyframes subtle-float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
        `}
      </style>

      <Box
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          position: 'fixed',
          right: { xs: 16, md: isHovered ? 20 : -20 },
          bottom: { xs: 20, md: '12%' },
          zIndex: 9999,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'flex-end',
          filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))'
        }}
      >
        
        {!isMobile && isHovered && (
          <Fade in={isHovered} children={
            <Paper sx={{ 
              mr: 3, 
              p: 2.5, 
              bgcolor: 'rgba(255,255,255,0.95)', 
              backdropFilter: 'blur(10px)',
              color: '#000', 
              borderRadius: '20px 20px 0 20px',
              maxWidth: 220,
              boxShadow: '0 5px 25px rgba(0,0,0,0.3)',
              border: '1px solid #D4AF37',
              alignSelf: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#AA8C2C', mb: 0.5 }}>
                {t('support_title')}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.3, fontWeight: 500 }}>
                {t('support_greeting')}
              </Typography>
            </Paper>
          } />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
          {!isMobile && (
            <Fade in={true} children={
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1.5, 
                mr: 1,
                opacity: isHovered ? 1 : 0.6,
                transition: 'opacity 0.3s',
                pointerEvents: isHovered ? 'auto' : 'none'
              }}>
                <FloatingButton
                  icon={<WhatsApp sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  color="#25D366"
                  tooltip={t('support_tooltip_benefits')}
                  link={WHATSAPP_BENEFITS}
                  index={0}
                />
                
                <FloatingButton
                  icon={<Telegram sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  color="#229ED9"
                  tooltip={t('support_tooltip_vip')}
                  link={TELEGRAM_VIP}
                  index={1}
                />
                
                <FloatingButton
                  icon={<WhatsApp sx={{ fontSize: { xs: 18, md: 20 } }} />}
                  color="#FF6B35"
                  tooltip={t('support_tooltip_charity')}
                  link={WHATSAPP_CHARITY}
                  index={2}
                />
              </Box>
            } />
          )}

          <Box 
            sx={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => window.open(WHATSAPP_SUPPORT, '_blank')}
          >
            <Box 
              sx={{
                width: { xs: 55, md: 75 },
                height: { xs: 55, md: 75 },
                borderRadius: '50%',
                border: isCarnival ? '3px solid #9C27B0' : '3px solid #D4AF37',
                bgcolor: '#FFF',
                overflow: 'hidden',
                boxShadow: isCarnival ? '0 0 25px rgba(156, 39, 176, 0.5)' : '0 0 25px rgba(212, 175, 55, 0.5)',
                transform: isHovered ? 'scale(1.1) rotate(0deg)' : 'rotate(-5deg)',
                transition: 'transform 0.3s ease',
                animation: !isHovered ? 'subtle-float 4s ease-in-out infinite' : 'none',
                position: 'relative'
              }}
            >
              <Box 
                component="img"
                src={avatarUrl}
                alt="Ana Support"
                onError={(e: any) => {
                    // Fallback se a imagem carnaval.png não existir ou falhar
                    if (e.target.src !== defaultAvatarUrl) {
                        e.target.onerror = null;
                        e.target.src = defaultAvatarUrl;
                    }
                }}
                sx={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  objectPosition: 'center top'
                }}
              />
            </Box>

            <Box sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: { xs: 12, md: 16 },
              height: { xs: 12, md: 16 },
              bgcolor: '#4CAF50',
              borderRadius: '50%',
              border: '3px solid #1a1a1a',
              boxShadow: '0 0 5px #4CAF50'
            }} />
          </Box>
        </Box>

        {isMobile && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'row', 
            gap: 1.5,
            mt: 1
          }}>
            <FloatingButton
              icon={<WhatsApp sx={{ fontSize: 18 }} />}
              color="#25D366"
              tooltip={t('support_tooltip_benefits_short')}
              link={WHATSAPP_BENEFITS}
              index={0}
            />
            
            <FloatingButton
              icon={<Telegram sx={{ fontSize: 18 }} />}
              color="#229ED9"
              tooltip={t('support_tooltip_vip_short')}
              link={TELEGRAM_VIP}
              index={1}
            />
            
            <FloatingButton
              icon={<WhatsApp sx={{ fontSize: 18 }} />}
              color="#FF6B35"
              tooltip={t('support_tooltip_charity_short')}
              link={WHATSAPP_CHARITY}
              index={2}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default SupportAvatar;
