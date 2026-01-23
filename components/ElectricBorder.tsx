import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

interface ElectricBorderProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  disableAnimationOnMobile?: boolean;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  color = '#00E676',
  className,
  style,
  disableAnimationOnMobile = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const shouldAnimate = !disableAnimationOnMobile || !isMobile;
  const animationSpeed = isMobile ? '4s' : '3s';
  const gradientSize = isMobile ? '200%' : '250%';
  const glowIntensity = isMobile ? `${color}30` : `${color}40`;
  
  return (
    <Box 
        className={className}
        sx={{ 
            position: 'relative',
            display: 'inline-flex',
            padding: { xs: '1.5px', md: '2px' },
            borderRadius: { xs: '16px', md: '20px' },
            overflow: 'hidden',
            isolation: 'isolate',
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
            ...style
        }}
    >
      <style>{`
        @keyframes rotate-gradient {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .electric-border-gradient {
            animation: none !important;
          }
        }
      `}</style>

      {/* Fundo Rotativo (Efeito de Raio/Borda) */}
      <Box 
        className="electric-border-gradient"
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: gradientSize,
          height: gradientSize,
          background: `conic-gradient(
            transparent 0deg, 
            transparent 270deg, 
            ${color} 300deg, 
            ${color} 360deg
          )`,
          animation: shouldAnimate ? `rotate-gradient ${animationSpeed} linear infinite` : 'none',
          zIndex: 0,
          willChange: shouldAnimate ? 'transform' : 'auto',
          pointerEvents: 'none',
          WebkitTransform: 'translate3d(0,0,0)',
          transform: 'translate3d(0,0,0)'
        }} 
      />
      
      {/* Glow Estático - Reduzido em mobile */}
      <Box sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: { xs: '16px', md: '20px' },
          boxShadow: {
            xs: `inset 0 0 15px ${glowIntensity}`,
            md: `inset 0 0 20px ${color}40`
          },
          zIndex: 1,
          pointerEvents: 'none'
      }} />

      {/* Conteúdo */}
      <Box sx={{ 
          position: 'relative', 
          zIndex: 2, 
          bgcolor: '#000', 
          borderRadius: { xs: '14px', md: '18px' },
          width: '100%',
          height: '100%'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default ElectricBorder;