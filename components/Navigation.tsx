
import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem, 
  IconButton, Drawer, List, ListItemButton, 
  ListItemIcon, ListItemText, Divider, Chip, useScrollTrigger, useTheme, useMediaQuery, Container
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, PageRoute } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSelector from './LanguageSelector';
import { 
  AccountBalanceWallet, EmojiEvents, Menu as MenuIcon, Dashboard as DashboardIcon, 
  AdminPanelSettings, Logout, Close, MilitaryTech, Bolt, Storefront, Diamond
} from '@mui/icons-material';

interface NavigationProps {
  user: UserProfile | null;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const theme = useTheme() as any;
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll effect for dynamic opacity
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleDesktopMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNavClick = (path: string) => { navigate(path); setMobileOpen(false); setAnchorEl(null); };

  const avatarUrl = user 
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name.replace(/\s/g, '')}&backgroundColor=000000&clothing=blazerAndShirt&clothingColor=d4af37&hairColor=d4af37&skinColor=edb98a&top=shortFlat`
    : '';

  const isActive = (path: string) => location.pathname === path;

  // Safe Balance Display (LuxCoins agora)
  const displayCoins = user?.lux_coins != null ? user.lux_coins : 0;

  // Level Logic
  let levelBorderColor = '#C0C0C0'; // Default Silver
  let currentLevel = 1;
  if (user) {
      const xp = user.xp || 0;
      currentLevel = Math.min(Math.floor(xp / 1000) + 1, 15);
      if (currentLevel >= 6 && currentLevel <= 10) levelBorderColor = '#D4AF37'; // Gold
      else if (currentLevel >= 11) levelBorderColor = '#E5E4E2'; // Platinum
  }

  // Custom Styled Link Button
  const NavLink = ({ to, icon, label }: { to: string, icon?: React.ReactNode, label: string }) => (
      <Button 
          onClick={() => navigate(to)}
          startIcon={icon}
          sx={{ 
              color: isActive(to) ? '#D4AF37' : '#E0E0E0', 
              fontFamily: 'Montserrat',
              fontWeight: isActive(to) ? 800 : 600,
              fontSize: '0.85rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              mx: 1,
              position: 'relative',
              '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  width: isActive(to) ? '100%' : '0%',
                  height: '2px',
                  bgcolor: '#D4AF37',
                  transform: 'translateX(-50%)',
                  transition: 'width 0.3s ease',
                  boxShadow: '0 0 8px #D4AF37'
              },
              '&:hover': {
                  bgcolor: 'transparent',
                  color: '#D4AF37',
                  '&::after': { width: '60%' }
              }
          }}
      >
          {label}
      </Button>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', background: 'linear-gradient(180deg, #0F121D 0%, #050510 100%)', color: '#FFF', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: '#D4AF37' }}>MENU</Typography>
            <IconButton onClick={handleDrawerToggle} sx={{ color: '#FFF' }}><Close /></IconButton>
        </Box>

        {user ? (
            <>
                <Box sx={{ p: 4, textAlign: 'center', background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.1) 0%, transparent 80%)' }}>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar 
                            src={avatarUrl}
                            alt={user.full_name}
                            sx={{ 
                                width: 80, height: 80, 
                                mx: 'auto', mb: 2,
                                border: `3px solid ${levelBorderColor}`,
                                boxShadow: `0 0 20px ${levelBorderColor}60`
                            }} 
                        />
                        {/* Level Badge Mobile */}
                        <Box sx={{ 
                            position: 'absolute', 
                            bottom: 12, 
                            right: -5, 
                            width: 28, 
                            height: 28, 
                            bgcolor: levelBorderColor, 
                            borderRadius: '50%', 
                            border: '2px solid #000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            zIndex: 2,
                            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                        }}>
                            {currentLevel}
                        </Box>
                    </Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: 1 }}>{user.full_name}</Typography>
                    
                    <Box display="flex" justifyContent="center" gap={2} mt={3}>
                        <Chip 
                            icon={<Diamond sx={{ color: '#000 !important' }} />} 
                            label={`${displayCoins} LC`} 
                            sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 800 }} 
                        />
                    </Box>
                </Box>

                <List sx={{ px: 2 }}>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.DASHBOARD)} sx={{ borderRadius: 2, mb: 1, '&.Mui-selected': { bgcolor: 'rgba(212,175,55,0.1)' } }} selected={isActive(PageRoute.DASHBOARD)}>
                        <ListItemIcon><DashboardIcon sx={{ color: isActive(PageRoute.DASHBOARD) ? '#D4AF37' : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('dashboard')} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.VAULT)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.VAULT)}>
                        <ListItemIcon><Storefront sx={{ color: isActive(PageRoute.VAULT) ? '#D4AF37' : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('vault')} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.MY_PRIZES)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.MY_PRIZES)}>
                        <ListItemIcon><EmojiEvents sx={{ color: isActive(PageRoute.MY_PRIZES) ? '#D4AF37' : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('myPrizes')} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.CHALLENGES)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.CHALLENGES)}>
                        <ListItemIcon><MilitaryTech sx={{ color: isActive(PageRoute.CHALLENGES) ? '#D4AF37' : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('challenge')} primaryTypographyProps={{ fontWeight: 600 }} />
                    </ListItemButton>
                    
                    {user.is_admin && (
                        <ListItemButton onClick={() => handleNavClick(PageRoute.ADMIN)} sx={{ borderRadius: 2, mb: 1, bgcolor: 'rgba(255,0,0,0.05)' }}>
                            <ListItemIcon><AdminPanelSettings color="error" /></ListItemIcon>
                            <ListItemText primary={t('admin')} primaryTypographyProps={{ fontWeight: 600, color: '#ff6666' }} />
                        </ListItemButton>
                    )}
                </List>

                <Box mt="auto" p={3}>
                    <LanguageSelector mobile />
                    <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<Logout />} 
                        onClick={() => { onLogout(); setMobileOpen(false); }}
                        sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.1)', color: 'gray', '&:hover': { borderColor: '#FFF', color: '#FFF' } }}
                    >
                        {t('logout')}
                    </Button>
                </Box>
            </>
        ) : (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                <LanguageSelector mobile />
                <Button variant="outlined" fullWidth onClick={() => handleNavClick(PageRoute.LOGIN)} sx={{ color: '#FFF', borderColor: '#FFF' }}>{t('login')}</Button>
                <Button variant="contained" fullWidth onClick={() => handleNavClick(PageRoute.REGISTER)} sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 800 }}>{t('getStarted')}</Button>
            </Box>
        )}
    </Box>
  );

  return (
    <>
        <AppBar 
            position="fixed" 
            sx={{ 
                bgcolor: trigger ? 'rgba(5, 5, 16, 0.95)' : 'rgba(5, 5, 16, 0.5)',
                borderBottom: '1px solid',
                borderColor: trigger ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.3s ease-in-out',
                boxShadow: trigger ? '0 10px 30px rgba(0,0,0,0.5)' : 'none'
            }} 
            elevation={0}
        >
<Container maxWidth="xl">
    <Toolbar disableGutters sx={{ height: 80, justifyContent: 'space-between' }}>
        
        {/* LOGO */}
        <Box 
            onClick={() => navigate(PageRoute.HOME)}
            sx={{ 
                display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 0
            }}
        >
            <Box 
                component="img"
                src="/logo.png" 
                alt="Lux Brasil"
                sx={{ 
                    height: { xs: 120, md: 165 }, // LOGO RESPONSIVA
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.3))' 
                }}
            />
            <Typography 
                variant="h5" 
                className="logo-shimmer" 
                sx={{ 
                    fontFamily: 'Montserrat', 
                    fontWeight: 900, 
                    letterSpacing: 2,
                    ml: { xs: -3, md: -5 }, // Ajuste margem mobile
                    fontSize: { xs: '1rem', md: '1.5rem' } // TEXTO LOGO RESPONSIVO
                }}
            >
                LUX BRASIL
            </Typography>
        </Box>

                {/* DESKTOP NAV */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                    {user ? (
                        <>
                            <Box sx={{ display: 'flex', mr: 4, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 50, px: 2, py: 0.5 }}>
                                <NavLink to={PageRoute.DASHBOARD} label={t('dashboard')} />
                                <NavLink to={PageRoute.VAULT} label={t('vault')} />
                                <NavLink to={PageRoute.CHALLENGES} label={t('challenges_tab')} />
                            </Box>

                            {/* LUX COINS & SPINS DISPLAY */}
                            <Box sx={{ 
                                display: 'flex', alignItems: 'center', gap: 2, mr: 2,
                                borderRight: '1px solid rgba(255,255,255,0.1)', pr: 3
                            }}>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1 }}>{t('lux_coins')}</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#FFF', fontFamily: 'Montserrat', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                        <Diamond sx={{ fontSize: 16, color: '#D4AF37' }} />
                                        <span style={{ color: '#D4AF37' }}>{displayCoins}</span>
                                    </Typography>
                                </Box>
                                
                                <Button 
                                    onClick={() => navigate(PageRoute.DASHBOARD)}
                                    sx={{ 
                                        background: 'linear-gradient(90deg, #D4AF37 0%, #AA8C2C 100%)', 
                                        color: '#000', 
                                        px: 2.5, py: 0.8, 
                                        borderRadius: 3, 
                                        fontSize: '0.8rem', 
                                        fontWeight: 800, 
                                        boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 5px 20px rgba(212, 175, 55, 0.6)' }
                                    }}
                                >
                                    <Bolt sx={{ fontSize: 18 }} />
                                    {user.available_spins ?? 0} SPINS
                                </Button>
                            </Box>

                            <LanguageSelector />

                            {/* PROFILE DESKTOP */}
                            <Box onClick={handleDesktopMenu} sx={{ cursor: 'pointer', ml: 2, position: 'relative' }}>
                                <Avatar 
                                    src={avatarUrl}
                                    sx={{ 
                                        bgcolor: '#000', width: 44, height: 44, 
                                        border: `2px solid ${levelBorderColor}`,
                                        boxShadow: `0 0 10px ${levelBorderColor}40`,
                                        transition: 'border-color 0.2s',
                                        '&:hover': { borderColor: '#D4AF37' }
                                    }}
                                />
                                {/* Level Badge Desktop */}
                                <Box sx={{ 
                                    position: 'absolute', 
                                    bottom: -2, 
                                    right: -4, 
                                    width: 18, 
                                    height: 18, 
                                    bgcolor: levelBorderColor, 
                                    borderRadius: '50%', 
                                    border: '1px solid #000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#000',
                                    fontWeight: 900,
                                    fontSize: '0.6rem',
                                    zIndex: 2
                                }}>
                                    {currentLevel}
                                </Box>
                            </Box>

                            <Menu 
                                anchorEl={anchorEl} 
                                open={Boolean(anchorEl)} 
                                onClose={() => setAnchorEl(null)} 
                                PaperProps={{ 
                                    sx: { 
                                        mt: 2, 
                                        bgcolor: 'rgba(15, 18, 29, 0.95)', 
                                        border: '1px solid rgba(212, 175, 55, 0.2)', 
                                        color: '#FFF',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                                        minWidth: 180
                                    } 
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <Box px={2} py={1}>
                                    <Typography variant="caption" color="gray">CONTA</Typography>
                                    <Typography variant="body2" fontWeight={600} noWrap>{user.email}</Typography>
                                </Box>
                                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 1 }} />
                                <MenuItem onClick={() => { navigate(PageRoute.MY_PRIZES); setAnchorEl(null); }}>
                                    <AccountBalanceWallet fontSize="small" sx={{ mr: 1.5 }} /> {t('myPrizes')}
                                </MenuItem>
                                {user.is_admin && <MenuItem onClick={() => { navigate(PageRoute.ADMIN); setAnchorEl(null); }} sx={{ color: '#ff6666' }}><AdminPanelSettings fontSize="small" sx={{ mr: 1.5 }} /> {t('admin')}</MenuItem>}
                                <MenuItem onClick={() => { onLogout(); setAnchorEl(null); }} sx={{ '&:hover': { color: '#D4AF37' } }}>
                                    <Logout fontSize="small" sx={{ mr: 1.5 }} /> {t('logout')}
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Box display="flex" gap={2} alignItems="center">
                            <LanguageSelector />
                            <Button 
                                color="inherit" 
                                onClick={() => navigate(PageRoute.LOGIN)} 
                                sx={{ color: '#AAA', fontWeight: 600, '&:hover': { color: '#FFF' } }}
                            >
                                {t('login')}
                            </Button>
                            <Button 
                                variant="contained" 
                                onClick={() => navigate(PageRoute.REGISTER)}
                                sx={{
                                    bgcolor: '#FFF', color: '#000', fontWeight: 800,
                                    px: 3, borderRadius: 50,
                                    '&:hover': { bgcolor: '#D4AF37' }
                                }}
                            >
                                {t('getStarted')}
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* MOBILE MENU ICON */}
                <IconButton 
                    color="inherit" 
                    onClick={handleDrawerToggle} 
                    sx={{ display: { md: 'none' }, color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
                >
                    <MenuIcon />
                </IconButton>
            </Toolbar>
        </Container>
        </AppBar>
        <Toolbar sx={{ height: 80 }} /> {/* Spacer */}
        
        <Drawer 
            variant="temporary" 
            anchor="right" 
            open={mobileOpen} 
            onClose={handleDrawerToggle} 
            ModalProps={{ keepMounted: true }}
            sx={{ 
                display: { xs: 'block', md: 'none' }, 
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300, borderLeft: '1px solid rgba(212,175,55,0.2)' } 
            }}
        >
            {drawerContent}
        </Drawer>
    </>
  );
};
export default Navigation;
