import React, { useState } from 'react';
import { Box, Typography, Paper, Fade } from '@mui/material';

const SupportAvatar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  const avatarUrl = "https://img.freepik.com/fotos-gratis/avatar-androgino-de-pessoa-queer-nao-binaria_23-2151100221.jpg?t=st=1766989621~exp=1766993221~hmac=ea77d713b740eee660debc16d5b6ddc88cbb99e7194b8d074cf266900810f9b3";

  return (
    <Box 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'fixed',
        right: isHovered ? 20 : -20,
        bottom: '15%',
        zIndex: 9999,
        cursor: 'pointer',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', 
        display: 'flex',
        alignItems: 'center',
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))'
      }}
      onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
    >
      
      {/* Balão de Fala */}
      <Fade in={isHovered}>
        <Paper sx={{ 
            mr: 3, 
            p: 2.5, 
            bgcolor: 'rgba(255,255,255,0.95)', 
            backdropFilter: 'blur(10px)',
            color: '#000', 
            borderRadius: '20px 20px 0 20px',
            maxWidth: 220,
            boxShadow: '0 5px 25px rgba(0,0,0,0.3)',
            border: '1px solid #D4AF37'
        }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#AA8C2C', mb: 0.5 }}>
                Suporte Lux
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.3, fontWeight: 500 }}>
                Olá! Sou a Ana. 
                <br/>
                <span style={{ color: '#555', fontSize: '0.75rem' }}>Clique para atendimento.</span>
            </Typography>
        </Paper>
      </Fade>

      {/* Container do Avatar */}
      <Box sx={{ position: 'relative' }}>
          <style>
              {`
                @keyframes subtle-float {
                    0% { transform: translateY(0px) rotate(-5deg); }
                    50% { transform: translateY(-5px) rotate(-5deg); }
                    100% { transform: translateY(0px) rotate(-5deg); }
                }
                .ana-avatar-container {
                    animation: subtle-float 4s ease-in-out infinite;
                }
              `}
          </style>
          
          <Box 
            className={!isHovered ? "ana-avatar-container" : ""}
            sx={{
                width: 75,
                height: 75,
                borderRadius: '50%',
                border: '3px solid #D4AF37',
                bgcolor: '#FFF',
                overflow: 'hidden',
                boxShadow: '0 0 25px rgba(212, 175, 55, 0.5)',
                transform: isHovered ? 'scale(1.1) rotate(0deg)' : 'rotate(-5deg)',
                transition: 'transform 0.3s ease',
                position: 'relative'
            }}
          >
              <Box 
                component="img"
                src={avatarUrl}
                alt="Ana Support"
                sx={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    objectPosition: 'center top' // Foca no rosto
                }}
              />
          </Box>

          {/* Status Dot */}
          <Box sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 16,
              height: 16,
              bgcolor: '#4CAF50',
              borderRadius: '50%',
              border: '3px solid #1a1a1a',
              boxShadow: '0 0 5px #4CAF50'
          }} />
      </Box>
    </Box>
  );
};

export default SupportAvatar;