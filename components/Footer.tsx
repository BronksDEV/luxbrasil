import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Divider, Stack } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn, YouTube, Email, Phone } from '@mui/icons-material';
import { APP_NAME, COMPANY_INFO } from '../constants';
import { PageRoute } from '../types';
import { useNavigate } from 'react-router-dom';

const SocialButton = ({ icon }: { icon: React.ReactNode }) => (
    <IconButton sx={{ 
        color: '#FFF', 
        bgcolor: 'rgba(255,255,255,0.05)', 
        transition: 'all 0.3s',
        '&:hover': { bgcolor: '#D4AF37', color: '#000', transform: 'translateY(-3px)' } 
    }}>
        {icon}
    </IconButton>
);

const FooterLink = ({ children, onClick }: { children?: React.ReactNode, onClick: (e: React.MouseEvent) => void }) => (
    <Link 
        href="#" 
        onClick={onClick} 
        color="text.secondary" 
        underline="none" 
        sx={{ 
            transition: 'color 0.2s', 
            fontSize: '0.9rem',
            '&:hover': { color: '#D4AF37' } 
        }}
    >
        {children}
    </Link>
);

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <Box component="footer" sx={{ bgcolor: '#020205', pt: 10, pb: 4, borderTop: '1px solid #1a1a1a', position: 'relative' }}>
      
      {/* Golden Top Line */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />

<Container maxWidth="lg">
  <Grid container spacing={8}>
    
    {/* Brand Column */}
    <Grid item xs={12} md={4}>
      <Box 
        display="flex" 
        alignItems="center" // Isso centraliza verticalmente
        mb={2} 
        sx={{ cursor: 'pointer' }} 
        onClick={() => navigate('/')}
      >
        <Box 
          component="img"
          src="/logo.png" 
          alt="Lux Brasil"
          sx={{ 
            height: 85, 
            mr: 0.5,
            display: 'block' // Remove espaço extra abaixo da imagem
          }}
        />
        <Typography 
          variant="h5" 
          className="logo-shimmer" 
          sx={{ 
            fontFamily: 'Montserrat', 
            fontWeight: 900, 
            letterSpacing: 2,
            lineHeight: 1 // Garante altura consistente do texto
          }}
        >
          LUX BRASIL
        </Typography>
      </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3, maxWidth: 300 }}>
              A plataforma líder em recompensas premium. Transformando sorte em experiências inesquecíveis com segurança e transparência.
            </Typography>
            <Stack direction="row" spacing={1}>
                <SocialButton icon={<Instagram />} />
                <SocialButton icon={<Facebook />} />
                <SocialButton icon={<Twitter />} />
                <SocialButton icon={<YouTube />} />
            </Stack>
          </Grid>

          {/* Contact Column */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="#FFF" sx={{ fontWeight: 700, mb: 3, letterSpacing: 1 }}>
              CONTATO & SUPORTE
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" gap={2} alignItems="center">
                    <Email sx={{ color: '#D4AF37', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">{COMPANY_INFO.email}</Typography>
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                    <Phone sx={{ color: '#D4AF37', fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">{COMPANY_INFO.phone}</Typography>
                </Box>
                <Box mt={2}>
                    <Typography variant="caption" color="#555" display="block">ENDEREÇO CORPORATIVO</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }}>
                        {COMPANY_INFO.address}
                    </Typography>
                </Box>
            </Box>
          </Grid>

          {/* Legal Column */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="#FFF" sx={{ fontWeight: 700, mb: 3, letterSpacing: 1 }}>
              LEGAL & COMPLIANCE
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <FooterLink onClick={handleNav(PageRoute.LEGAL_PRIVACY)}>Política de Privacidade</FooterLink>
              <FooterLink onClick={handleNav(PageRoute.LEGAL_TERMS)}>Termos de Uso</FooterLink>
              <FooterLink onClick={handleNav(PageRoute.LEGAL_DATA)}>LGPD & Proteção de Dados</FooterLink>
              <FooterLink onClick={handleNav(PageRoute.CHALLENGES)}>Regras dos Desafios</FooterLink>
            </Box>
            
            <Box mt={4} p={2} border="1px solid rgba(255,255,255,0.05)" borderRadius={2} bgcolor="rgba(255,255,255,0.02)">
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    CNPJ: {COMPANY_INFO.cnpj}<br/>
                    DPO: {COMPANY_INFO.dpo}
                </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.05)' }} />

        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
          <Typography variant="caption" color="text.secondary" textAlign={{ xs: 'center', md: 'left' }}>
            © {new Date().getFullYear()} {COMPANY_INFO.name} Todos os direitos reservados.
          </Typography>
          <Typography variant="caption" color="#444">
            Desenvolvido com Tecnologia Lux Secure™
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;