import React, { useState } from 'react';
import { Box, Container, Typography, Link, IconButton, Divider, Stack, Grid } from '@mui/material';
import { Facebook, Twitter, Instagram, YouTube, Email, Phone, Handshake } from '@mui/icons-material';
import { COMPANY_INFO } from '../constants';
import { PageRoute } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const SocialButton = ({ icon, link }: { icon: React.ReactNode, link?: string }) => (
    <IconButton onClick={() => link && window.open(link, '_blank')} sx={{ color: '#FFF', bgcolor: 'rgba(255,255,255,0.05)', transition: 'all 0.3s', '&:hover': { bgcolor: '#D4AF37', color: '#000', transform: 'translateY(-3px)' } }}>
        {icon}
    </IconButton>
);

const FooterLink = ({ children, onClick }: { children?: React.ReactNode, onClick: (e: React.MouseEvent) => void }) => (
    <Link href="#" onClick={onClick} color="text.secondary" underline="none" sx={{ transition: 'color 0.2s', fontSize: '0.9rem', '&:hover': { color: '#D4AF37' } }}>
        {children}
    </Link>
);

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleNav = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <Box component="footer" sx={{ bgcolor: '#020205', pt: 10, pb: 4, borderTop: '1px solid #1a1a1a', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
      <Container maxWidth="lg">
        <Grid container spacing={8}>
            <Grid size={{ xs: 12, md: 4 }}>
                <Box display="flex" alignItems="center" mb={2} sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <Box component="img" src="/logo.png" alt="Lux Brasil" sx={{ height: 85, mr: 0.5, display: 'block' }} />
                    <Typography variant="h5" className="logo-shimmer" sx={{ fontFamily: 'Montserrat', fontWeight: 900, letterSpacing: 2, lineHeight: 1 }}>LUX BRASIL</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3, maxWidth: 300 }}>{t('footer_desc')}</Typography>
                <Stack direction="row" spacing={1}>
                    <SocialButton icon={<Instagram />} link="https://www.instagram.com/luxbrasiloficial/" />
                    <SocialButton icon={<Facebook />} />
                    <SocialButton icon={<Twitter />} />
                    <SocialButton icon={<YouTube />} />
                </Stack>
                <Box mt={4} pt={3} borderTop="1px solid rgba(255,255,255,0.05)">
                    <Box display="inline-flex" alignItems="center" justifyContent="center" gap={2} sx={{ px: 2, py: 1, borderRadius: 50, border: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(90deg, rgba(212,175,55,0.1) 0%, rgba(0, 230, 118, 0.1) 100%)', boxShadow: '0 0 20px rgba(0,0,0,0.5)', cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }} onClick={() => window.open('https://www.wgjogo0.com/', '_blank')}>
                        <Typography variant="caption" color="primary" sx={{ letterSpacing: 1, fontWeight: 700, lineHeight: 1 }}>LUX BRASIL</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', color: '#555', fontSize: '0.8rem' }}><Handshake fontSize="small" /></Box>
                        {/* WG BRAND - ONLY WG (SPONSOR) */}
                        <Typography variant="caption" sx={{ color: '#00E676', letterSpacing: 1, fontWeight: 900, lineHeight: 1, textShadow: '0 0 10px #00E676, 0 0 20px rgba(0, 230, 118, 0.6)' }}>WG</Typography>
                    </Box>
                </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle1" color="#FFF" sx={{ fontWeight: 700, mb: 3, letterSpacing: 1 }}>{t('footer_contact')}</Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                    <Box display="flex" gap={2} alignItems="center"><Email sx={{ color: '#D4AF37', fontSize: 20 }} /><Typography variant="body2" color="text.secondary">{COMPANY_INFO.email}</Typography></Box>
                    <Box display="flex" gap={2} alignItems="center"><Phone sx={{ color: '#D4AF37', fontSize: 20 }} /><Typography variant="body2" color="text.secondary">{COMPANY_INFO.phone}</Typography></Box>
                    <Box mt={2}>
                        <Typography variant="caption" color="#555" display="block">{t('footer_address_label')}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }}>{COMPANY_INFO.address}</Typography>
                    </Box>
                </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="subtitle1" color="#FFF" sx={{ fontWeight: 700, mb: 3, letterSpacing: 1 }}>{t('footer_legal_title')}</Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                    <FooterLink onClick={handleNav(PageRoute.LEGAL_PRIVACY)}>{t('legal_privacy')}</FooterLink>
                    <FooterLink onClick={handleNav(PageRoute.LEGAL_TERMS)}>{t('legal_terms')}</FooterLink>
                    <FooterLink onClick={handleNav(PageRoute.LEGAL_DATA)}>{t('legal_data')}</FooterLink>
                    <FooterLink onClick={handleNav(PageRoute.CHALLENGES)}>{t('legal_rules')}</FooterLink>
                </Box>
                <Box mt={4} p={2} border="1px solid rgba(255,255,255,0.05)" borderRadius={2} bgcolor="rgba(255,255,255,0.02)">
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>CNPJ: {COMPANY_INFO.cnpj}<br/>DPO: {COMPANY_INFO.dpo}</Typography>
                </Box>
            </Grid>
        </Grid>
        <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.05)' }} />
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
          <Typography variant="caption" color="text.secondary" textAlign={{ xs: 'center', md: 'left' }}>© {new Date().getFullYear()} {COMPANY_INFO.name} {t('footer_rights')}</Typography>
          <Typography variant="caption" color="#444">{t('developed_by')}</Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
