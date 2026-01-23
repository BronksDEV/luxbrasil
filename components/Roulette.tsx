
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import { Box, Button, Typography, Modal, Paper, useMediaQuery, useTheme } from '@mui/material';
import { Prize, SpinResult, PageRoute } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { MilitaryTech, Lock, SentimentDissatisfied, EmojiEvents, Savings } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ElectricBorder from './ElectricBorder';

interface RouletteProps {
  prizes: Prize[];
  onSpinComplete: (result: SpinResult) => void;
  isSpinning: boolean;
  setIsSpinning: (state: boolean) => void;
  userId: string;
  spinsRemaining: number;
}

// Auxiliares de coordenadas e imagem
const getCoordinatesForPercent = (percent: number) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const getImageSrc = (filename?: string): string | null => {
  if (!filename || filename.trim() === '') return null;
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `/${encodeURIComponent(cleanFilename)}`;
};

// Componente SVG Interno da Roleta
const WheelSVG = ({ prizes, rotation, wheelRef }: { prizes: Prize[], rotation: number, wheelRef: React.RefObject<HTMLDivElement> }) => {
  if (prizes.length === 0) return null;

  const numSlices = prizes.length;
  const angleRad = (2 * Math.PI) / numSlices;

  // CÁLCULOS DE POSICIONAMENTO E TAMANHO
  
  // 1. Posição da Imagem: Mover para 0.30 (mais perto do centro) para dar gap do texto
  const distFromCenterImg = 0.35; 
  
  // 2. Tamanho seguro da imagem dentro do ângulo da fatia
  const maxImgWidthByAngle = 2 * distFromCenterImg * Math.tan(angleRad / 2);
  const safeImgSize = Math.min(maxImgWidthByAngle * 0.8, 0.20); 
  const bgCircleSize = safeImgSize * 0.6; 

  // 3. Posição do Texto (Anchor Middle):
  // Mover para 0.70 (mais para a borda) para afastar da imagem
  const textPositionX = 0.73;

  return (
    <div 
      ref={wheelRef}
      style={{
        width: '100%',
        height: '100%',
        transform: `rotate(${rotation}deg)`,
        transition: rotation === 0 ? 'none' : 'transform 6s cubic-bezier(0.12, 0, 0.10, 1)', 
        willChange: 'transform'
    }}>
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <defs>
            <radialGradient id="sliceGloss" cx="0.5" cy="0.5" r="0.8" fx="0.25" fy="0.25">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="40%" stopColor="white" stopOpacity="0.1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sliceShadow" cx="0.5" cy="0.5" r="0.8">
                <stop offset="80%" stopColor="black" stopOpacity="0" />
                <stop offset="100%" stopColor="black" stopOpacity="0.3" />
            </radialGradient>
            <filter id="dropShadowText" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.005" />
                <feOffset dx="0.002" dy="0.002" result="offsetblur" />
                <feFlood floodColor="rgba(0,0,0,0.8)" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        {prizes.map((prize, index) => {
          const startPercent = index / prizes.length;
          const endPercent = (index + 1) / prizes.length;
          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
          
          const midAngleRad = 2 * Math.PI * (startPercent + endPercent) / 2;
          const midAngleDeg = midAngleRad * (180 / Math.PI);

          const pathData = [
            `M ${startX} ${startY}`,
            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            `L 0 0`,
          ].join(' ');

          const isNameLoss = ['não foi', 'tente', 'loss', 'azar', 'tnt'].some(term => prize.name.toLowerCase().includes(term));
          const fillColor = isNameLoss ? '#101010' : prize.color;
          const isDark = ['#1A1A1A', '#000000', '#333333', '#000', '#111', '#222', '#101010'].includes(fillColor);
          const textColor = isDark ? '#FFFFFF' : '#000000';
          const strokeColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
          const hasImage = prize.image_url && prize.image_url.trim() !== '';
          const imageSrc = getImageSrc(prize.image_url);
          const textLength = prize.name.length;
          const fontFamily = "'Orbitron', 'Montserrat', sans-serif";

          // Lógica Fina de Tamanho de Fonte
          let fontSize;
          if (hasImage) {
              // Diminuí levemente para garantir que não toque no ícone
              if (textLength > 14) fontSize = "0.035";      
              else if (textLength > 9) fontSize = "0.042";  
              else fontSize = "0.050";                      
          } else {
              // Diminuí drasticamente conforme solicitado (antes era 0.045, 0.060, 0.075)
              if (textLength > 18) fontSize = "0.035";      // "Não foi dessa vez"
              else if (textLength > 10) fontSize = "0.045"; 
              else fontSize = "0.055";
          }

          return (
            <g key={prize.id}>
              {/* Fundo da Fatia */}
              <path d={pathData} fill={fillColor} stroke={strokeColor} strokeWidth="0.005" />
              <path d={pathData} fill="url(#sliceGloss)" style={{ mixBlendMode: 'overlay' }} />
              <path d={pathData} fill="url(#sliceShadow)" />
              
              <g transform={`rotate(${midAngleDeg})`}>
                  
                  {hasImage && imageSrc ? (
                    // === COM IMAGEM ===
                    <g>
                      {/* Grupo Imagem - Posição 0.30 */}
                      <g transform={`translate(${distFromCenterImg}, 0)`}> 
                        <circle cx="0" cy="0" r={bgCircleSize} fill="rgba(255,255,255,0.95)" stroke="#D4AF37" strokeWidth="0.005" style={{ filter: 'drop-shadow(0px 0px 5px rgba(0,0,0,0.5))' }} />
                        <image 
                            href={imageSrc} xlinkHref={imageSrc} 
                            x={-safeImgSize/2} y={-safeImgSize/2} 
                            width={safeImgSize} height={safeImgSize} 
                            preserveAspectRatio="xMidYMid meet" crossOrigin="anonymous"
                        />
                      </g>
                      
                      {/* Texto - Posição 0.70 (Mais afastado da imagem) */}
                      <text 
                          x={textPositionX}
                          y="0" 
                          fill={textColor} 
                          fontSize={fontSize} 
                          fontFamily={fontFamily} 
                          fontWeight="800" 
                          textAnchor="middle" 
                          dominantBaseline="middle" 
                          style={{ 
                              textTransform: 'uppercase', 
                              letterSpacing: '0.04em', 
                              filter: isDark ? 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))' : 'none'
                          }}
                      >
                        {textLength > 16 ? prize.name.substring(0, 15) + '..' : prize.name.toUpperCase()}
                      </text>
                    </g>
                  ) : (
                    // === SEM IMAGEM ===
                    <text
                      x="0.60" 
                      y="0"
                      fill={textColor}
                      fontSize={fontSize}
                      fontFamily={fontFamily}
                      fontWeight="900"
                      textAnchor="middle" 
                      dominantBaseline="middle"
                      style={{ 
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          filter: 'url(#dropShadowText)'
                      }}
                    >
                       {textLength > 20 ? prize.name.substring(0, 19) + '..' : prize.name.toUpperCase()}
                    </text>
                  )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const BackgroundEffects = () => {
    return (
        <Canvas camera={{ position: [0, 0, 5] }}>
            {/* @ts-ignore */}
            <ambientLight intensity={0.5} />
            <Sparkles count={120} scale={10} size={4} speed={0.4} opacity={0.5} color="#FFD700" />
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} />
        </Canvas>
    );
}

const Roulette: React.FC<RouletteProps> = ({ prizes, onSpinComplete, isSpinning, setIsSpinning, userId, spinsRemaining }) => {
  const { t } = useLanguage();
  const theme = useTheme() as any;
  const navigate = useNavigate();
  const { refreshUser, user, setUser } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [rotation, setRotation] = useState(0);
  const [resultModal, setResultModal] = useState<SpinResult | null>(null);
  const [noSpinsModal, setNoSpinsModal] = useState(false);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isTicking, setIsTicking] = useState(false);
  const lastAngleRef = useRef(0);
  
  const sliceSize = 360 / (prizes.length || 1);

  const isLossPrize = (prize: Prize | null | undefined): boolean => {
      if (!prize) return false;
      const name = prize.name.toLowerCase();
      return name.includes('tente') || 
             name.includes('tnt') || 
             name.includes('não foi') ||
             name.includes('azar') ||
             name.includes('loss') ||
             (prize.value === 0 && prize.type !== 'physical');
  };
 
  useEffect(() => {
    let animationFrameId: number;
    const checkRotation = () => {
      if (!wheelRef.current || !isSpinning) return;
      
      const style = window.getComputedStyle(wheelRef.current);
      const matrix = new WebKitCSSMatrix(style.transform);
      let currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
      if (currentAngle < 0) currentAngle += 360;

      const prev = lastAngleRef.current;
      const diff = Math.abs(currentAngle - prev);
      const currentSlice = Math.floor(currentAngle / sliceSize);
      const prevSlice = Math.floor(prev / sliceSize);

      if (currentSlice !== prevSlice && diff < 50) {
        setIsTicking(true);
        setTimeout(() => setIsTicking(false), 80); 
      }
      lastAngleRef.current = currentAngle;
      animationFrameId = requestAnimationFrame(checkRotation);
    };

    if (isSpinning) animationFrameId = requestAnimationFrame(checkRotation);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSpinning, sliceSize]);

  const handleSpin = async () => {
    if (isSpinning) return;
   
    if (spinsRemaining <= 0) {
        setNoSpinsModal(true);
        return;
    }

    setIsSpinning(true);
    setRotation(0); 
    lastAngleRef.current = 0;

    try {
      const result = await api.game.spin(userId);
      const prizeIndex = prizes.findIndex(p => p.id === result.prize.id);
      
      const spins = 10; 
      const baseRotation = 360 * spins;
      const targetWedgeAngle = prizeIndex * sliceSize;
      
      const targetRotation = baseRotation + (360 - targetWedgeAngle) - (sliceSize/2); 
      const finalRotation = targetRotation + (Math.random() * (sliceSize * 0.4) - (sliceSize * 0.2));

      setRotation(finalRotation);

      setTimeout(async () => {
        if (user) {
            const newBalance = result.wallet_balance;
            setUser({
                ...user,
                available_spins: result.remaining_spins,
                lux_coins: newBalance,
                wallet_balance: newBalance
            });
        }
        await refreshUser();
        try {
            await api.challenges.checkAction('spin');
        } catch (e) { console.error("Erro checkAction", e); }

        setResultModal(result);
        onSpinComplete(result);
        setIsSpinning(false);
      }, 6000); 

    } catch (error) {
      console.error(error);
      setIsSpinning(false);
      setNoSpinsModal(true); 
    }
  };

  const handleGoToChallenges = () => {
      setNoSpinsModal(false);
      navigate(PageRoute.CHALLENGES);
  };

  const currentPrize = resultModal?.prize;
  const isCashback = currentPrize && isLossPrize(currentPrize) && currentPrize.type === 'money' && currentPrize.value > 0;
  const isLoss = currentPrize && isLossPrize(currentPrize) && !isCashback;
  const resultImageSrc = currentPrize?.image_url ? getImageSrc(currentPrize.image_url) : null;

  return (
    <Box sx={{ 
        position: 'relative', 
        width: '100%',
        height: { xs: '650px', md: '900px' },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #0a0a0a 0%, #000 100%)',
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        boxShadow: '0 0 120px rgba(0,0,0,0.9), inset 0 0 80px rgba(0,0,0,0.8)'
    }}>
      
      <style>
        {`
          @keyframes tick-hit {
            0% { transform: translateX(-50%) rotate(0deg); }
            30% { transform: translateX(-50%) rotate(-30deg); } 
            100% { transform: translateX(-50%) rotate(0deg); }
          }
          .pointer-tick { animation: tick-hit 0.1s ease-out; }
          
          @keyframes border-chase {
             0% { background-position: 0% 50%; }
             100% { background-position: 100% 50%; }
          }
          
          @keyframes neon-pulse-btn {
             0% { box-shadow: 0 0 10px #D4AF37, 0 0 20px #D4AF37; }
             50% { box-shadow: 0 0 25px #D4AF37, 0 0 50px #D4AF37; }
             100% { box-shadow: 0 0 10px #D4AF37, 0 0 20px #D4AF37; }
          }

          @keyframes reactor-pulse {
             0% { box-shadow: 0 0 15px #D4AF37, inset 0 0 10px #000; transform: translate(-50%, -50%) scale(1); }
             50% { box-shadow: 0 0 35px #FFD700, inset 0 0 15px #D4AF37; transform: translate(-50%, -50%) scale(1.02); }
             100% { box-shadow: 0 0 15px #D4AF37, inset 0 0 10px #000; transform: translate(-50%, -50%) scale(1); }
          }
          
          @keyframes lights-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* 3D Background Layer */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Suspense fallback={null}><BackgroundEffects /></Suspense>
      </Box>

      {/* --- PARTNER LOGO WITH ELECTRIC BORDER --- */}
      <Box sx={{ position: 'relative', zIndex: 20, mb: 4, mt: -1 }}>
          <ElectricBorder color="#00E676" 
                // @ts-ignore
                speed={2} chaos={0.3} borderRadius={20}
          >
              <Box sx={{ 
                  bgcolor: 'rgba(0,0,0,0.8)', 
                  px: 3, py: 1.5, 
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  border: '1px solid rgba(0, 230, 118, 0.2)'
              }}>
                  <Typography variant="overline" color="primary" sx={{ fontWeight: 800, fontSize: '0.7rem', letterSpacing: 1 }}>
                      POWERED BY
                  </Typography>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" sx={{ 
                          color: '#00E676', 
                          fontWeight: 900, 
                          fontFamily: 'Montserrat',
                          letterSpacing: 1,
                          textShadow: '0 0 15px #00E676'
                      }}>
                          WG
                      </Typography>
                  </Box>
              </Box>
          </ElectricBorder>
      </Box>

      {/* Wheel Container - INCREASED SIZE */}
      <Box sx={{
          position: 'relative',
          width: '95%',
          maxWidth: '650px',
          aspectRatio: '1/1', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4, 
          zIndex: 2
      }}>

        {/* Pulse Aura */}
        <Box sx={{
            position: 'absolute',
            inset: '-15px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%)',
            animation: 'pulse-gold 3s infinite',
            zIndex: 0
        }} />

        {/* Outer Ring & Lights */}
        <Box sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 90deg, #1a1a1a, #000, #1a1a1a, #000, #1a1a1a)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,1)',
            border: '6px solid #0a0a0a',
            zIndex: 1
        }}>
             {/* Lights Ring 1 */}
             <Box sx={{
                 position: 'absolute',
                 inset: '8px',
                 borderRadius: '50%',
                 border: '6px dotted #FFD700', 
                 boxShadow: '0 0 20px #D4AF37',
                 animation: 'lights-rotate 30s linear infinite',
                 opacity: 0.9
             }} />
             
             {/* Lights Ring 2 */}
             <Box sx={{
                 position: 'absolute',
                 inset: '18px',
                 borderRadius: '50%',
                 border: '2px dashed rgba(255, 255, 255, 0.2)',
                 animation: 'lights-rotate 20s linear infinite reverse',
             }} />
        </Box>

        {/* The Wheel SVG */}
        <Box sx={{
            position: 'absolute',
            inset: '35px', 
            borderRadius: '50%',
            overflow: 'hidden',
            zIndex: 2,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,1)',
            background: '#000',
            border: '2px solid rgba(212, 175, 55, 0.5)'
        }}>
            <WheelSVG prizes={prizes} rotation={rotation} wheelRef={wheelRef} />
        </Box>

        {/* Center Hub */}
        <Box sx={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20%', 
            height: '20%',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #222, #000)',
            border: '3px solid #D4AF37',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            animation: 'reactor-pulse 2.5s infinite ease-in-out',
            boxShadow: '0 0 30px #D4AF37'
        }}>
            <Typography variant="h5" sx={{ 
                fontWeight: 900, 
                color: '#FFF',
                letterSpacing: 2,
                textShadow: '0 0 15px #FFD700, 0 0 25px #D4AF37',
                fontSize: { xs: '0.9rem', md: '1.4rem' }
            }}>
                LUX
            </Typography>
        </Box>

        {/* Pointer / Needle */}
        <Box 
             className={isTicking ? 'pointer-tick' : ''}
             sx={{
                position: 'absolute',
                top: '-25px', 
                left: '50%',
                transform: { xs: 'translateX(-50%) scale(0.65)', md: 'translateX(-50%) scale(1)' },
                transformOrigin: 'top center',
                zIndex: 10,
                filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.8))',
                width: 60,
                height: 80
             }}
        >
            <Box sx={{
                position: 'absolute', top: 0, left: 10,
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #F3E5AB, #AA8C2C)',
                border: '3px solid #FFF', zIndex: 2
            }} />
            <Box sx={{
                position: 'absolute', top: 25, left: 5,
                width: 0, height: 0,
                borderLeft: '25px solid transparent',
                borderRight: '25px solid transparent',
                borderTop: '60px solid #D4AF37',
                zIndex: 1
            }} />
        </Box>

      </Box>

      {/* Spin Button */}
      <Box sx={{ position: 'relative', zIndex: 10, mt: -1 }}>
        <Button 
            variant="contained" 
            size={isMobile ? "large" : "large"}
            onClick={handleSpin} 
            disabled={isSpinning}
            sx={{ 
                px: { xs: 6, md: 12 }, 
                py: { xs: 1.8, md: 3 }, 
                fontSize: { xs: '1.1rem', md: '1.8rem' },
                fontWeight: 900,
                borderRadius: 50,
                letterSpacing: 4,
                fontFamily: 'Montserrat',
                
                color: isSpinning ? '#555' : '#000',
                background: isSpinning 
                    ? '#222' 
                    : 'linear-gradient(90deg, #D4AF37, #F3E5AB, #D4AF37, #AA8C2C)',
                backgroundSize: '300% 100%',
                animation: isSpinning ? 'none' : 'border-chase 2s linear infinite, neon-pulse-btn 2s infinite',
                
                border: '3px solid #FFF',
                boxShadow: isSpinning ? 'none' : '0 0 50px rgba(212, 175, 55, 0.7), inset 0 0 20px rgba(255,255,255,0.8)',
                
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 0 80px rgba(212, 175, 55, 0.9)'
                },
                '&:disabled': {
                    background: '#222',
                    color: '#444',
                    border: '1px solid #444'
                }
            }}
        >
            {isSpinning ? t('spinning') : t('spin_btn')}
        </Button>
      </Box>

      {/* --- RESULT MODAL --- */}
      <Modal open={!!resultModal} onClose={() => setResultModal(null)}>
        <Paper sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '92%', sm: '420px', md: 500 },
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          p: { xs: 2, md: 6 },
          textAlign: 'center',
          outline: 'none',
          background: isLoss ? '#1a1a1a' : 'linear-gradient(180deg, #111 0%, #000 100%)',
          boxShadow: isLoss ? '0 0 50px rgba(0,0,0,0.8)' : '0 0 100px rgba(212, 175, 55, 0.4)',
          border: isLoss ? '2px solid #444' : '2px solid #D4AF37',
          borderRadius: 4
        }}>
          {isLoss ? (
              <SentimentDissatisfied sx={{ fontSize: { xs: 50, md: 60 }, color: '#aaa', mb: 2 }} />
          ) : isCashback ? (
              <Savings sx={{ 
                  fontSize: { xs: 60, md: 70 }, 
                  color: '#90CAF9', 
                  mb: 1, 
                  filter: 'drop-shadow(0 0 10px rgba(33, 150, 243, 0.6))' 
              }} />
          ) : (
              <EmojiEvents sx={{ fontSize: { xs: 60, md: 70 }, color: '#D4AF37', mb: 2 }} />
          )}

          <Typography variant="overline" color={isLoss ? 'text.secondary' : isCashback ? '#90CAF9' : 'primary'} sx={{ letterSpacing: 3, fontWeight: 700, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
            {isLoss ? t('try_again_title') : isCashback ? t('consolation_prize') : t('congrats')}
          </Typography>
          
          {!isLoss && resultImageSrc && (
            <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: { xs: 120, md: 150 }, height: { xs: 120, md: 150 }, borderRadius: '50%', background: '#FFFFFF', border: '4px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(212, 175, 55, 0.5)', p: 2 }}>
                <img src={resultImageSrc} alt={currentPrize.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
            </Box>
          )}

          <Box my={2} sx={{
              p: 2,
              border: isCashback ? '1px dashed rgba(33, 150, 243, 0.3)' : 'none',
              borderRadius: 2,
              bgcolor: isCashback ? 'rgba(33, 150, 243, 0.05)' : 'transparent'
          }}>
              <Typography variant="h3" sx={{ 
                  color: '#FFF', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  fontSize: { xs: '1.25rem', md: '2.5rem' },
                  lineHeight: 1.2,
                  textShadow: isLoss ? 'none' : '0 0 30px #D4AF37',
                  wordBreak: 'break-word'
              }}>
                {resultModal?.prize.name}
              </Typography>
              
              {isCashback && (
                  <Box mt={2} p={1.5} bgcolor="rgba(33, 150, 243, 0.1)" borderRadius={2} border="1px solid rgba(33, 150, 243, 0.2)">
                      <Typography variant="body2" sx={{ color: '#90CAF9', fontWeight: 600, fontSize: '0.8rem' }}>
                          {t('you_won_label')}
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#FFF', fontWeight: 900, textShadow: '0 0 10px #2196F3', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                          +{resultModal?.prize.value} {t('lux_coins').toUpperCase()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 0.5 }}>
                          {t('balance_updated')}
                      </Typography>
                  </Box>
              )}
          </Box>

          <Button 
            variant={isLoss ? "outlined" : "contained"} 
            fullWidth 
            onClick={() => setResultModal(null)} 
            sx={{ 
                py: { xs: 1.5, md: 2 }, 
                fontWeight: 800, 
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                borderColor: isLoss ? '#555' : undefined,
                color: isLoss ? '#aaa' : undefined,
                '&:hover': isLoss ? { borderColor: '#FFF', color: '#FFF' } : undefined,
                bgcolor: isCashback ? 'rgba(33, 150, 243, 0.2)' : undefined,
                border: isCashback ? '1px solid #2196F3' : undefined
            }}
          >
            {isLoss ? t('btn_close') : isCashback ? t('close_and_continue') : t('redeem_now')}
          </Button>
        </Paper>
      </Modal>

      {/* --- NO SPINS MODAL --- */}
      <Modal open={noSpinsModal} onClose={() => setNoSpinsModal(false)}>
        <Paper sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '92%', sm: '420px', md: 480 },
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          p: { xs: 3, md: 5 },
          textAlign: 'center',
          outline: 'none',
          background: 'linear-gradient(135deg, #1A1A1A 0%, #050510 100%)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 4,
          boxShadow: '0 20px 80px rgba(0,0,0,0.8), 0 0 20px rgba(212, 175, 55, 0.1)'
        }}>
            <Box sx={{
                position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)',
                width: 80, height: 80, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, transparent 70%)',
                filter: 'blur(10px)', zIndex: 0
            }} />
            
            <Lock sx={{ position: 'relative', fontSize: { xs: 50, md: 70 }, color: '#D4AF37', mb: 2, filter: 'drop-shadow(0 0 10px #D4AF37)', zIndex: 1 }} />
            
            <Typography variant="h5" sx={{ 
                color: '#FFF', 
                fontWeight: 900, 
                mb: 1, 
                fontFamily: 'Montserrat', 
                letterSpacing: 1, 
                textTransform: 'uppercase',
                fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}>
                {t('no_spins_title')}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5, px: 1, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                {t('no_spins_desc')}
            </Typography>

            <Button 
                variant="contained" 
                fullWidth 
                size="large"
                startIcon={<MilitaryTech />}
                onClick={handleGoToChallenges}
                sx={{ 
                    py: 2, 
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontWeight: 800, 
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #D4AF37, #AA8C2C)',
                    color: '#000',
                    boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)',
                    transition: 'transform 0.2s',
                    '&:hover': { 
                        background: 'linear-gradient(90deg, #F3E5AB, #D4AF37)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 0 50px rgba(212, 175, 55, 0.5)'
                    }
                }}
            >
                {t('btn_go_challenges')}
            </Button>
            
            <Button 
                onClick={() => setNoSpinsModal(false)} 
                sx={{ mt: 1.5, color: '#888', fontWeight: 600, fontSize: '0.8rem', '&:hover': { color: '#FFF' } }}
            >
                {t('btn_close').toUpperCase()}
            </Button>
        </Paper>
      </Modal>

    </Box>
  );
};

export default Roulette;
