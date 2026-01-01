import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
import { Box, Button, Typography, Modal, Paper, useMediaQuery, useTheme } from '@mui/material';
import { Prize, SpinResult, PageRoute } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { MilitaryTech, Lock } from '@mui/icons-material';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      mesh: any;
      planeGeometry: any;
      meshStandardMaterial: any;
    }
  }
}

interface RouletteProps {
  prizes: Prize[];
  onSpinComplete: (result: SpinResult) => void;
  isSpinning: boolean;
  setIsSpinning: (state: boolean) => void;
  userId: string;
  spinsRemaining: number;
}

const getCoordinatesForPercent = (percent: number) => {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x, y];
};

const WheelSVG = ({ prizes, rotation, wheelRef }: { prizes: Prize[], rotation: number, wheelRef: React.RefObject<HTMLDivElement> }) => {
  if (prizes.length === 0) return null;

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
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
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

          const fillColor = prize.color;
          const isDark = ['#1A1A1A', '#000000', '#333333', '#000', '#111'].includes(fillColor);
          const textColor = isDark ? '#FFD700' : '#000000';
          const strokeColor = isDark ? '#D4AF37' : 'rgba(0,0,0,0.1)';

          return (
            <g key={prize.id}>
              <path d={pathData} fill={fillColor} stroke={strokeColor} strokeWidth="0.008" />
              
              <path d={pathData} fill="url(#sliceGlass)" style={{ mixBlendMode: 'overlay', opacity: 0.3 }} />
              <g transform={`rotate(${midAngleDeg})`}>
                  {!isDark && (
                    <text
                      x="0.65"
                      y="0"
                      fill="rgba(255,255,255,0.8)"
                      fontSize="0.08"
                      fontFamily="Arial, Helvetica, sans-serif"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      strokeWidth="0.015"
                      stroke="rgba(255,255,255,0.8)"
                      style={{ 
                          textTransform: 'uppercase',
                          letterSpacing: '0.01em'
                      }}
                    >
                      {prize.name.substring(0, 8).toUpperCase()}
                    </text>
                  )}
                  
                  <text
                    x="0.65"
                    y="0"
                    fill={textColor}
                    fontSize="0.08"
                    fontFamily="Arial, Helvetica, sans-serif"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    stroke={isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.9)'}
                    strokeWidth="0.015"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ 
                        textTransform: 'uppercase',
                        letterSpacing: '0.01em',
                        paintOrder: 'stroke fill',
                        filter: isDark ? 'drop-shadow(0px 0px 3px #FFD700)' : 'drop-shadow(0px 0px 2px #000)'
                    }}
                  >
                    {prize.name.substring(0, 8).toUpperCase()}
                  </text>
              </g>
            </g>
          );
        })}
        <defs>
            <radialGradient id="sliceGlass">
                <stop offset="40%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.25" />
            </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

const BackgroundEffects = () => {
    return (
        <Canvas camera={{ position: [0, 0, 5] }}>
            {/* @ts-ignore */}
            <ambientLight intensity={0.5} />
            <Sparkles count={150} scale={10} size={5} speed={0.5} opacity={0.6} color="#FFD700" />
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
               
            </Float>
        </Canvas>
    );
}

const Roulette: React.FC<RouletteProps> = ({ prizes, onSpinComplete, isSpinning, setIsSpinning, userId, spinsRemaining }) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [rotation, setRotation] = useState(0);
  const [resultModal, setResultModal] = useState<SpinResult | null>(null);
  const [noSpinsModal, setNoSpinsModal] = useState(false);
  
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isTicking, setIsTicking] = useState(false);
  const lastAngleRef = useRef(0);
  
  const sliceSize = 360 / (prizes.length || 1);

 
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

      setTimeout(() => {
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

  return (
    <Box sx={{ 
        position: 'relative', 
        width: '100%',
        height: { xs: '600px', md: '780px' },
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

      
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Suspense fallback={null}><BackgroundEffects /></Suspense>
      </Box>

      
      <Box sx={{
          position: 'relative',
          width: '90%',
          maxWidth: '550px',
          aspectRatio: '1/1', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4, 
          zIndex: 2
      }}>

        
        <Box sx={{
            position: 'absolute',
            inset: '-15px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 215, 0, 0.2) 0%, transparent 70%)',
            animation: 'pulse-gold 3s infinite',
            zIndex: 0
        }} />

        
        <Box sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'conic-gradient(from 90deg, #1a1a1a, #000, #1a1a1a, #000, #1a1a1a)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.9), inset 0 0 30px rgba(0,0,0,1)',
            border: '6px solid #0a0a0a',
            zIndex: 1
        }}>
             
             <Box sx={{
                 position: 'absolute',
                 inset: '8px',
                 borderRadius: '50%',
                 border: '6px dotted #FFD700', 
                 boxShadow: '0 0 20px #D4AF37',
                 animation: 'lights-rotate 30s linear infinite',
                 opacity: 0.9
             }} />
             
             
             <Box sx={{
                 position: 'absolute',
                 inset: '18px',
                 borderRadius: '50%',
                 border: '2px dashed rgba(255, 255, 255, 0.2)',
                 animation: 'lights-rotate 20s linear infinite reverse',
             }} />
        </Box>

        
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

        
        <Box sx={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '24%',
            height: '24%',
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
                fontSize: { xs: '1rem', md: '1.4rem' }
            }}>
                LUX
            </Typography>
        </Box>

        
        <Box 
             className={isTicking ? 'pointer-tick' : ''}
             sx={{
                position: 'absolute',
                top: '-20px', 
                left: '50%',
                transform: 'translateX(-50%)',
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
            <Box sx={{
                position: 'absolute', top: 10, left: '50%',
                width: 20, height: 20, borderRadius: '50%',
                background: 'red', boxShadow: '0 0 10px red', zIndex: 3,
                transform: 'translateX(-50%)'
            }} />
        </Box>

      </Box>

      
      <Box sx={{ position: 'relative', zIndex: 10, mt: 3 }}>
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

      
      <Modal open={!!resultModal} onClose={() => setResultModal(null)}>
        <Paper sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', md: 500 },
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          outline: 'none',
          background: 'linear-gradient(180deg, #111 0%, #000 100%)',
          boxShadow: '0 0 100px rgba(212, 175, 55, 0.4)',
          border: '2px solid #D4AF37',
          borderRadius: 4
        }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 4, fontWeight: 700 }}>
            {t('congrats')}
          </Typography>
          
          <Box my={4}>
              <Typography variant="h3" sx={{ 
                  color: '#FFF', 
                  fontWeight: 900, 
                  textTransform: 'uppercase', 
                  textShadow: '0 0 30px #D4AF37'
              }}>
                {resultModal?.prize.name}
              </Typography>
          </Box>

          <Button variant="contained" fullWidth onClick={() => setResultModal(null)} sx={{ py: 2, fontWeight: 800, fontSize: '1.1rem' }}>
            {t('add_wallet')}
          </Button>
        </Paper>
      </Modal>

      
      <Modal open={noSpinsModal} onClose={() => setNoSpinsModal(false)}>
        <Paper sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '85%', md: 450 },
          p: 4,
          textAlign: 'center',
          outline: 'none',
          bgcolor: '#1a1a1a',
          border: '1px solid #D4AF37',
          borderRadius: 4,
          boxShadow: '0 0 50px rgba(0,0,0,0.8)'
        }}>
            <Lock sx={{ fontSize: 60, color: '#F44336', mb: 2 }} />
            <Typography variant="h5" sx={{ color: '#FFF', fontWeight: 800, mb: 1 }}>
                SEM GIROS DISPONÍVEIS
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Você usou todos os seus giros diários. Complete missões para ganhar mais agora mesmo!
            </Typography>

            <Button 
                variant="contained" 
                fullWidth 
                size="large"
                startIcon={<MilitaryTech />}
                onClick={handleGoToChallenges}
                sx={{ 
                    py: 2, 
                    fontWeight: 800, 
                    background: 'linear-gradient(90deg, #4CAF50, #81C784)',
                    color: '#000',
                    '&:hover': { background: '#4CAF50' }
                }}
            >
                IR PARA DESAFIOS
            </Button>
            <Button onClick={() => setNoSpinsModal(false)} sx={{ mt: 2, color: 'gray' }}>
                Fechar
            </Button>
        </Paper>
      </Modal>

    </Box>
  );
};

export default Roulette;