
import React from 'react';
import { Box } from '@mui/material';

interface ElectricBorderProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  color = '#00E676',
  className,
  style
}) => {
  return (
    <Box 
        className={className}
        sx={{ 
            position: 'relative',
            display: 'inline-flex', // Garante que o tamanho se ajuste ao conteúdo corretamente
            padding: '2px',
            borderRadius: '20px',
            overflow: 'hidden',
            isolation: 'isolate',
            // Fix para safari e alguns browsers mobile para conter overflow com borda arredondada
            transform: 'translateZ(0)',
            ...style
        }}
    >
      <style>{`
        @keyframes rotate-gradient {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

      {/* Fundo Rotativo (Efeito de Raio/Borda) */}
      <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '250%', // Aumentado para garantir cobertura total na rotação
          height: '250%',
          background: `conic-gradient(transparent 0deg, transparent 270deg, ${color} 300deg, ${color} 360deg)`,
          animation: 'rotate-gradient 3s linear infinite',
          zIndex: 0,
          willChange: 'transform', // Otimização de performance
          pointerEvents: 'none'
      }} />
      
      {/* Glow Estático para estabilidade visual */}
      <Box sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '20px',
          boxShadow: `inset 0 0 20px ${color}40`, // Glow interno suave
          zIndex: 1,
          pointerEvents: 'none'
      }} />

      {/* Conteúdo */}
      <Box sx={{ 
          position: 'relative', 
          zIndex: 2, 
          bgcolor: '#000', 
          borderRadius: '18px',
          width: '100%',
          height: '100%'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default ElectricBorder;
