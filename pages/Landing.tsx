import React from 'react';
import { Box, Container, Typography, Button, Grid, Paper, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageRoute } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { Diamond, Security, Speed, Casino, VerifiedUser, Star } from '@mui/icons-material';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <Box sx={{ bgcolor: '#050510', color: '#FFF', overflowX: 'hidden' }}>
      
      {/* --- HERO SECTION --- */}
      <Box sx={{ 
          position: 'relative', 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden'
      }}>
        
        {/* Animated Background Elements */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            {/* Dark Gradient Overlay */}
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050510 100%)', zIndex: 2 }} />
            
            {/* Golden Orb 1 */}
            <Box sx={{ 
                position: 'absolute', top: '-20%', left: '-10%', 
                width: '60vw', height: '60vw', 
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%)', 
                filter: 'blur(60px)', animation: 'float-slow 10s infinite alternate' 
            }} />
            
            {/* Golden Orb 2 */}
            <Box sx={{ 
                position: 'absolute', bottom: '-10%', right: '-10%', 
                width: '50vw', height: '50vw', 
                background: 'radial-gradient(circle, rgba(170, 140, 44, 0.1) 0%, transparent 70%)', 
                filter: 'blur(80px)', animation: 'float-slow 15s infinite alternate-reverse' 
            }} />

            {/* Grid Pattern */}
            <Box sx={{
                position: 'absolute', inset: 0, opacity: 0.05,
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }} />
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 3, textAlign: 'center', pt: 10 }}>
            <Box sx={{ mb: 4, display: 'inline-block', px: 3, py: 1, borderRadius: 50, border: '1px solid rgba(212, 175, 55, 0.3)', bgcolor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(5px)' }}>
                <Typography variant="caption" sx={{ color: '#D4AF37', letterSpacing: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star fontSize="small" /> CHEGOU SUA HORA DE GANHAR
                </Typography>
            </Box>

            <Typography variant="h1" sx={{ 
                fontFamily: 'Montserrat', 
                fontWeight: 900, 
                fontSize: { xs: '3.5rem', md: '6rem' }, 
                lineHeight: 1,
                mb: 2,
                textTransform: 'uppercase',
                background: 'linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.1))'
            }}>
                GIRE E <br />
                <span className="logo-shimmer" style={{ WebkitTextFillColor: 'transparent' }}>GANHE</span>
            </Typography>

            <Typography variant="h5" sx={{ 
                maxWidth: 800, 
                mx: 'auto', 
                color: '#A0A0A0', 
                fontWeight: 400, 
                lineHeight: 1.6, 
                mb: 6,
                fontSize: { xs: '1rem', md: '1.25rem' }
            }}>
                A experiência definitiva em sorteios de luxo. Cadastre-se, gire a roleta exclusiva e conquiste prêmios reais instantaneamente com total segurança.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                <Button 
                    variant="contained" 
                    size="large" 
                    onClick={() => navigate(PageRoute.REGISTER)}
                    sx={{ 
                        px: 6, py: 2, 
                        fontSize: '1.1rem', 
                        borderRadius: 50,
                        background: 'linear-gradient(90deg, #D4AF37 0%, #F3E5AB 50%, #D4AF37 100%)',
                        color: '#000',
                        fontWeight: 800,
                        boxShadow: '0 0 30px rgba(212, 175, 55, 0.4)',
                        '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 50px rgba(212, 175, 55, 0.6)' }
                    }}
                >
                    CRIAR CONTA
                </Button>
                <Button 
                    variant="outlined" 
                    size="large" 
                    onClick={() => navigate(PageRoute.LOGIN)}
                    sx={{ 
                        px: 6, py: 2, 
                        fontSize: '1.1rem', 
                        borderRadius: 50,
                        borderColor: 'rgba(255,255,255,0.2)',
                        color: '#FFF',
                        '&:hover': { borderColor: '#FFF', bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    JÁ SOU MEMBRO
                </Button>
            </Stack>

            {/* Stats Strip */}
            <Grid container spacing={4} sx={{ mt: 10, justifyContent: 'center' }}>
                <StatBox number="10k+" label="MEMBROS ATIVOS" />
                <StatBox number="R$ 500k" label="PRÊMIOS PAGOS" />
                <StatBox number="100%" label="SEGURO & AUDITADO" />
            </Grid>
        </Container>
      </Box>

      {/* --- FEATURES SECTION --- */}
      <Box sx={{ py: 15, position: 'relative', bgcolor: '#08090F' }}>
          <Container maxWidth="lg">
              <Box textAlign="center" mb={10}>
                  <Typography variant="overline" color="primary" sx={{ letterSpacing: 3, fontWeight: 700 }}>POR QUE A LUX BRASIL?</Typography>
                  <Typography variant="h2" sx={{ mt: 1, fontFamily: 'Montserrat', fontWeight: 800 }}>Exclusividade em <span style={{ color: '#D4AF37' }}>Cada Detalhe</span></Typography>
              </Box>

              <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                      <FeatureCard 
                          icon={<Speed sx={{ fontSize: 50 }} />}
                          title="Acesso Imediato"
                          desc="Sem espera. Cadastre-se e receba seu primeiro giro gratuito instantaneamente para começar a ganhar."
                      />
                  </Grid>
                  <Grid item xs={12} md={4}>
                      <FeatureCard 
                          icon={<Diamond sx={{ fontSize: 50 }} />}
                          title="Prêmios"
                          desc="De experiências gastronômicas a produtos exclusivos, ou PIX na conta. Escolha sem erro."
                      />
                  </Grid>
                  <Grid item xs={12} md={4}>
                      <FeatureCard 
                          icon={<Security sx={{ fontSize: 50 }} />}
                          title="Segurança de Elite"
                          desc="Seus dados são criptografados. Nossos algoritmos de sorteio são transparentes e auditáveis."
                      />
                  </Grid>
              </Grid>
          </Container>
      </Box>

      {/* --- CTA BOTTOM --- */}
      <Box sx={{ py: 12, background: 'linear-gradient(180deg, #08090F 0%, #000 100%)', borderTop: '1px solid #222' }}>
          <Container maxWidth="md" sx={{ textAlign: 'center' }}>
              <Casino sx={{ fontSize: 80, color: '#D4AF37', mb: 3, opacity: 0.8 }} />
              <Typography variant="h3" gutterBottom sx={{ fontFamily: 'Montserrat', fontWeight: 800 }}>
                  Pronto para a sua sorte mudar?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
                  Junte-se a milhares de vencedores hoje mesmo.
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                onClick={() => navigate(PageRoute.REGISTER)}
                sx={{ 
                    background: '#FFF', 
                    color: '#000', 
                    fontWeight: 900, 
                    px: 8, py: 2.5,
                    fontSize: '1.2rem',
                    borderRadius: 2,
                    '&:hover': { background: '#D4AF37' }
                }}
              >
                  GIRAR ROLETA AGORA
              </Button>
          </Container>
      </Box>

      <style>
          {`
            @keyframes float-slow {
                0% { transform: translate(0, 0); }
                100% { transform: translate(20px, -20px); }
            }
          `}
      </style>
    </Box>
  );
};

const StatBox = ({ number, label }: { number: string, label: string }) => (
    <Grid item xs={6} md={3}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#D4AF37' }}>{number}</Typography>
        <Typography variant="caption" sx={{ color: '#888', letterSpacing: 1 }}>{label}</Typography>
    </Grid>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <Paper sx={{ 
        p: 5, 
        height: '100%', 
        bgcolor: 'rgba(255,255,255,0.02)', 
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 4,
        transition: 'all 0.3s',
        '&:hover': { 
            transform: 'translateY(-10px)', 
            bgcolor: 'rgba(212, 175, 55, 0.05)',
            borderColor: '#D4AF37',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)' 
        }
    }}>
        <Box sx={{ color: '#D4AF37', mb: 3 }}>{icon}</Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: '#FFF' }}>{title}</Typography>
        <Typography variant="body2" sx={{ color: '#A0A0A0', lineHeight: 1.7 }}>{desc}</Typography>
    </Paper>
);

export default Landing;