import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, Box, Avatar, Menu, MenuItem, 
  IconButton, Drawer, List, ListItemButton, 
  ListItemIcon, ListItemText, Divider, Chip, useScrollTrigger, useMediaQuery, Container, Snackbar, Alert, Paper, SvgIcon, Skeleton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, PageRoute } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import LanguageSelector from './LanguageSelector';
import ProfileDialog from './ProfileDialog';
import { useAuth } from '../contexts/AuthContext';
import { useThemeConfig } from '../contexts/ThemeContext';
import { 
  Menu as MenuIcon, Dashboard as DashboardIcon, 
  Close, MilitaryTech, Bolt, Storefront, Diamond, Edit, Star
} from '@mui/icons-material';

// --- CUSTOM ICONS (Baseado nos SVGs fornecidos) ---

const WalletIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 1024 1024">
    <path d="M224 295.68c-42.24 0-64-21.76-64-64s21.76-64 64-64h665.6s25.6 0 25.6 25.6v102.4h-691.2z" fill="currentColor" opacity="0.8"></path>
    <path d="M915.2 308.48h-691.2c-49.92 0-76.8-26.88-76.8-76.8s26.88-76.8 76.8-76.8h665.6c15.36 0 38.4 10.24 38.4 38.4v102.4c0 7.68-6.4 12.8-12.8 12.8z m-25.6-128h-665.6c-35.84 0-51.2 15.36-51.2 51.2s15.36 51.2 51.2 51.2h678.4v-89.6c0-10.24-7.68-12.8-12.8-12.8z" fill="currentColor"></path>
    <path d="M907.52 494.08c2.56 14.08-6.4 26.88-20.48 30.72l-601.6 122.88c-14.08 2.56-26.88-6.4-30.72-20.48l-74.24-363.52c-2.56-14.08 6.4-26.88 20.48-30.72l601.6-122.88c14.08-2.56 26.88 6.4 30.72 20.48l74.24 363.52z" fill="currentColor" opacity="0.6"></path>
    <path d="M229.12 422.4c-16.64 0-30.72-8.96-33.28-23.04l-8.96-40.96c-3.84-16.64 10.24-33.28 32-37.12l601.6-122.88c20.48-3.84 39.68 5.12 43.52 21.76l8.96 42.24c3.84 16.64-10.24 33.28-32 37.12l-601.6 122.88h-10.24z m601.6-199.68h-5.12l-601.6 122.88c-7.68 1.28-11.52 5.12-11.52 7.68l8.96 40.96c1.28 1.28 6.4 2.56 12.8 1.28l601.6-122.88c7.68-1.28 11.52-5.12 11.52-6.4l-8.96-40.96c0-1.28-2.56-2.56-7.68-2.56z" fill="currentColor"></path>
    <path d="M953.6 615.68H803.84c-30.72 0-55.04-23.04-55.04-51.2v-25.6c0-28.16 24.32-51.2 55.04-51.2h151.04v128z" fill="currentColor"></path>
  </SvgIcon>
);

const AdminIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 444 501">
    <path d="M0.710022 72.41L222.16 0.109985V500.63C63.98 433.89 0.710022 305.98 0.710022 233.69V72.41Z" fill="currentColor" opacity="0.5"/>
    <path d="M443.62 72.41L222.17 0.109985V500.63C380.35 433.89 443.62 305.98 443.62 233.69V72.41Z" fill="currentColor"/>
  </SvgIcon>
);

const ProfileIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
     <path opacity="0.4" d="M12.1207 12.78C12.0507 12.77 11.9607 12.77 11.8807 12.78C10.1207 12.72 8.7207 11.28 8.7207 9.50998C8.7207 7.69998 10.1807 6.22998 12.0007 6.22998C13.8107 6.22998 15.2807 7.69998 15.2807 9.50998C15.2707 11.28 13.8807 12.72 12.1207 12.78Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path> 
     <path opacity="0.34" d="M18.7398 19.3801C16.9598 21.0101 14.5998 22.0001 11.9998 22.0001C9.39977 22.0001 7.03977 21.0101 5.25977 19.3801C5.35977 18.4401 5.95977 17.5201 7.02977 16.8001C9.76977 14.9801 14.2498 14.9801 16.9698 16.8001C18.0398 17.5201 18.6398 18.4401 18.7398 19.3801Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path> 
     <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"></path> 
  </SvgIcon>
);

const ExitIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 128 128">
    <path fill="currentColor" opacity="0.5" d="M120,0H24c-4.422,0-8,3.582-8,8v22.234c2.367-2.133,5.063-3.738,8-4.781V8h96v112H24v-17.453 c-2.938-1.043-5.633-2.648-8-4.781V120c0,4.418,3.578,8,8,8h96c4.422,0,8-3.582,8-8V8C128,3.582,124.422,0,120,0z"></path> 
    <path fill="currentColor" d="M32,40c2.047,0,4.094,0.781,5.656,2.344c3.125,3.125,3.125,8.188,0,11.313L35.313,56H64c4.422,0,8,3.582,8,8 s-3.578,8-8,8H35.313l2.344,2.344c3.125,3.125,3.125,8.188,0,11.313C36.094,87.219,34.047,88,32,88s-4.094-0.781-5.656-2.344l-16-16 c-3.125-3.125-3.125-8.188,0-11.313l16-16C27.906,40.781,29.953,40,32,40 M32,32c-4.273,0-8.289,1.664-11.313,4.688l-16,16 C1.664,55.711,0,59.727,0,64s1.664,8.289,4.688,11.313l16,16C23.711,94.336,27.727,96,32,96s8.289-1.664,11.313-4.688 c3.117-3.117,4.68-7.215,4.68-11.313H64c8.82,0,16-7.176,16-16c0-8.82-7.18-16-16-16H47.992c0-4.098-1.563-8.195-4.68-11.313 C40.289,33.664,36.273,32,32,32L32,32z"></path>
  </SvgIcon>
);

interface NavigationProps {
  user: UserProfile | null;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { refreshUser, loading } = useAuth(); // Usando loading do AuthContext
  const { themeConfig } = useThemeConfig();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';
  const themeColor = isCarnival ? '#9C27B0' : '#D4AF37';
  const secondaryColor = isCarnival ? '#00E676' : '#AA8C2C';

  // Scroll effect for dynamic opacity
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleDesktopMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleNavClick = (path: string) => { navigate(path); setMobileOpen(false); setAnchorEl(null); };
  
  const handleProfileUpdate = async () => {
    await refreshUser();
    setSuccessMsg(t('profile_updated'));
  };

  const avatarUrl = user 
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name.replace(/\s/g, '')}&backgroundColor=000000&clothing=blazerAndShirt&clothingColor=${isCarnival ? '9c27b0' : 'd4af37'}&hairColor=${isCarnival ? '9c27b0' : 'd4af37'}&skinColor=edb98a&top=shortFlat`
    : '';

  const isActive = (path: string) => location.pathname === path;

  // Safe Balance Display (LuxCoins agora)
  const displayCoins = user?.lux_coins != null ? user.lux_coins : 0;

  // Level Logic
  let levelBorderColor = '#C0C0C0'; // Default Silver
  let currentLevel = 1;
  let levelName = 'SILVER';
  if (user) {
      const xp = user.xp || 0;
      currentLevel = Math.min(Math.floor(xp / 1000) + 1, 15);
      if (currentLevel >= 6 && currentLevel <= 10) {
          levelBorderColor = '#D4AF37'; // Gold
          levelName = 'GOLD';
      }
      else if (currentLevel >= 11) {
          levelBorderColor = '#E5E4E2'; // Platinum
          levelName = 'PLATINUM';
      }
  }

  // Custom Styled Link Button
  const NavLink = ({ to, icon, label }: { to: string, icon?: React.ReactNode, label: string }) => (
      <Button 
          onClick={() => navigate(to)}
          startIcon={icon}
          sx={{ 
              color: isActive(to) ? themeColor : '#E0E0E0', 
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
                  bgcolor: themeColor,
                  transform: 'translateX(-50%)',
                  transition: 'width 0.3s ease',
                  boxShadow: isActive(to) ? `0 0 8px ${themeColor}` : 'none'
              },
              '&:hover': {
                  bgcolor: 'transparent',
                  color: themeColor,
                  '&::after': { width: '60%' }
              }
          }}
      >
          {label}
      </Button>
  );

  const drawerContent = (
    <Box sx={{ height: '100%', background: 'linear-gradient(180deg, #08090F 0%, #000 100%)', color: '#FFF', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Montserrat', fontWeight: 900, color: themeColor }}>MENU VIP</Typography>
            <IconButton onClick={handleDrawerToggle} sx={{ color: '#FFF' }}><Close /></IconButton>
        </Box>

        {user && !loading ? (
            <>
                <Box sx={{ p: 3 }}>
                    <Paper 
                        elevation={10}
                        onClick={() => setProfileOpen(true)}
                        sx={{ 
                            p: 2.5, 
                            borderRadius: 3,
                            background: isCarnival 
                                ? 'linear-gradient(135deg, #1A001A 0%, #000 100%)' 
                                : 'linear-gradient(135deg, rgba(20,20,20,1) 0%, rgba(35,35,45,1) 100%)',
                            border: `1px solid ${levelBorderColor}`,
                            position: 'relative',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            boxShadow: `0 0 15px ${levelBorderColor}30`,
                            '&:active': { transform: 'scale(0.98)' }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar 
                                    src={avatarUrl} 
                                    sx={{ 
                                        width: 60, height: 60, 
                                        border: `2px solid ${levelBorderColor}`,
                                    }} 
                                />
                                {isCarnival && <Box sx={{ position: 'absolute', top: -15, left: -10, transform: 'rotate(-20deg)', fontSize: 24 }}>🎭</Box>}
                            </Box>
                            <Box flexGrow={1}>
                                <Typography variant="h6" sx={{ fontFamily: 'Montserrat', fontWeight: 800, lineHeight: 1.2, color: '#FFF' }}>
                                    {user.full_name.split(' ')[0]}
                                </Typography>
                                <Typography variant="caption" sx={{ color: levelBorderColor, letterSpacing: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Star sx={{ fontSize: 12 }} /> {levelName} MEMBER
                                </Typography>
                            </Box>
                            <IconButton size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#FFF' }}>
                                <Edit fontSize="small" />
                            </IconButton>
                        </Box>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">SALDO ATUAL</Typography>
                                <Typography variant="body1" fontWeight={800} color="#FFF" display="flex" alignItems="center" gap={0.5}>
                                    <Diamond sx={{ fontSize: 14, color: themeColor }} /> {displayCoins}
                                </Typography>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="caption" color="text.secondary" display="block">GIROS</Typography>
                                <Typography variant="body1" fontWeight={800} color="#FFF" display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                                    <Bolt sx={{ fontSize: 16, color: themeColor }} /> {user.available_spins ?? 0}
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>

                <List sx={{ px: 2 }}>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.DASHBOARD)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.DASHBOARD)}>
                        <ListItemIcon><DashboardIcon sx={{ color: isActive(PageRoute.DASHBOARD) ? themeColor : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('dashboard')} primaryTypographyProps={{ fontWeight: 600, fontFamily: 'Montserrat' }} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.VAULT)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.VAULT)}>
                        <ListItemIcon><Storefront sx={{ color: isActive(PageRoute.VAULT) ? themeColor : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('vault')} primaryTypographyProps={{ fontWeight: 600, fontFamily: 'Montserrat' }} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.MY_PRIZES)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.MY_PRIZES)}>
                        <ListItemIcon><WalletIcon sx={{ color: isActive(PageRoute.MY_PRIZES) ? themeColor : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('myPrizes')} primaryTypographyProps={{ fontWeight: 600, fontFamily: 'Montserrat' }} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleNavClick(PageRoute.CHALLENGES)} sx={{ borderRadius: 2, mb: 1 }} selected={isActive(PageRoute.CHALLENGES)}>
                        <ListItemIcon><MilitaryTech sx={{ color: isActive(PageRoute.CHALLENGES) ? themeColor : 'gray' }} /></ListItemIcon>
                        <ListItemText primary={t('challenge')} primaryTypographyProps={{ fontWeight: 600, fontFamily: 'Montserrat' }} />
                    </ListItemButton>
                    
                    {user.is_admin && (
                        <ListItemButton onClick={() => handleNavClick(PageRoute.ADMIN)} sx={{ borderRadius: 2, mb: 1, bgcolor: 'rgba(255,0,0,0.05)' }}>
                            <ListItemIcon><AdminIcon sx={{ color: '#ff6666' }} /></ListItemIcon>
                            <ListItemText primary={t('admin')} primaryTypographyProps={{ fontWeight: 600, color: '#ff6666', fontFamily: 'Montserrat' }} />
                        </ListItemButton>
                    )}
                </List>

                <Box mt="auto" p={3}>
                    <LanguageSelector mobile />
                    <Button 
                        variant="outlined" 
                        fullWidth 
                        startIcon={<ExitIcon />} 
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
                <Button variant="contained" fullWidth onClick={() => handleNavClick(PageRoute.REGISTER)} sx={{ bgcolor: themeColor, color: '#000', fontWeight: 800 }}>{t('getStarted')}</Button>
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
                borderColor: trigger ? (isCarnival ? 'rgba(156, 39, 176, 0.2)' : 'rgba(212, 175, 55, 0.1)') : 'transparent',
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
                display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 0, position: 'relative'
            }}
        >
            {/* COROA FLUTUANTE (CARNAVAL/VIP) */}
            <Box sx={{ 
                position: 'absolute', top: -25, left: 30, 
                fontSize: 30, transform: 'rotate(-10deg)', 
                animation: 'sway 3s ease-in-out infinite',
                filter: `drop-shadow(0 0 10px ${themeColor})`
            }}>
                👑
            </Box>

            <Box 
                component="img"
                src="/logo.png" 
                alt="Lux Brasil"
                sx={{ 
                    height: { xs: 120, md: 165 }, 
                    objectFit: 'contain',
                    filter: `drop-shadow(0 0 5px ${themeColor}40)` 
                }}
            />
            <Typography 
                variant="h5" 
                className="logo-shimmer" 
                sx={{ 
                    fontFamily: 'Montserrat', 
                    fontWeight: 900, 
                    letterSpacing: 2,
                    ml: { xs: -3, md: -5 },
                    fontSize: { xs: '1rem', md: '1.5rem' } 
                }}
            >
                LUX BRASIL
            </Typography>
        </Box>

                {/* DESKTOP NAV */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                    {user && !loading ? (
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
                                        <Diamond sx={{ fontSize: 16, color: themeColor }} />
                                        <span style={{ color: themeColor }}>{displayCoins}</span>
                                    </Typography>
                                </Box>
                                
                                <Button 
                                    onClick={() => navigate(PageRoute.DASHBOARD)}
                                    sx={{ 
                                        background: isCarnival 
                                            ? 'linear-gradient(90deg, #9C27B0 0%, #E040FB 100%)' 
                                            : 'linear-gradient(90deg, #D4AF37 0%, #AA8C2C 100%)', 
                                        color: '#000', 
                                        px: 2.5, py: 0.8, 
                                        borderRadius: 3, 
                                        fontSize: '0.8rem', 
                                        fontWeight: 800, 
                                        boxShadow: `0 0 15px ${themeColor}40`,
                                        display: 'flex', alignItems: 'center', gap: 1,
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 5px 20px ${themeColor}60` }
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
                                        '&:hover': { borderColor: themeColor }
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
                                        bgcolor: 'rgba(10, 10, 15, 0.9)', 
                                        border: `1px solid ${themeColor}30`, 
                                        color: '#FFF',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                                        minWidth: 200,
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        animation: 'fade-in 0.3s ease-out'
                                    } 
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                {/* HEADER DO MENU */}
                                <Box sx={{ p: 2, background: isCarnival ? 'linear-gradient(45deg, rgba(156, 39, 176, 0.2), transparent)' : 'linear-gradient(45deg, rgba(212, 175, 55, 0.1), transparent)' }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{t('my_account')}</Typography>
                                    <Typography variant="subtitle1" fontWeight={700} noWrap>{user.full_name}</Typography>
                                    <Chip size="small" label={`${user.lux_coins} LC`} sx={{ mt: 0.5, bgcolor: themeColor, color: '#000', fontWeight: 800, height: 20, fontSize: '0.65rem' }} />
                                </Box>
                                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                                
                                <MenuItem onClick={() => { setProfileOpen(true); setAnchorEl(null); }} sx={{ py: 1.5, gap: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: themeColor } }}>
                                    <ProfileIcon fontSize="small" sx={{ color: 'inherit' }} /> 
                                    <Typography variant="body2" fontWeight={600}>{t('edit_profile')}</Typography>
                                </MenuItem>
                                
                                <MenuItem onClick={() => { navigate(PageRoute.MY_PRIZES); setAnchorEl(null); }} sx={{ py: 1.5, gap: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: themeColor } }}>
                                    <WalletIcon fontSize="small" sx={{ color: 'inherit' }} /> 
                                    <Typography variant="body2" fontWeight={600}>{t('myPrizes')}</Typography>
                                </MenuItem>
                                
                                {user.is_admin && (
                                    <MenuItem onClick={() => { navigate(PageRoute.ADMIN); setAnchorEl(null); }} sx={{ py: 1.5, gap: 2, color: '#ff6666', '&:hover': { bgcolor: 'rgba(255,0,0,0.1)' } }}>
                                        <AdminIcon fontSize="small" sx={{ color: 'inherit' }} /> 
                                        <Typography variant="body2" fontWeight={600}>{t('admin')}</Typography>
                                    </MenuItem>
                                )}
                                
                                <Divider sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                                
                                <MenuItem onClick={() => { onLogout(); setAnchorEl(null); }} sx={{ py: 1.5, gap: 2, color: '#AAA', '&:hover': { color: '#FFF' } }}>
                                    <ExitIcon fontSize="small" sx={{ color: 'inherit' }} /> 
                                    <Typography variant="body2" fontWeight={600}>{t('logout')}</Typography>
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        <Box display="flex" gap={2} alignItems="center">
                            {/* Se estiver carregando, mostra skeleton, senão mostra login/register */}
                            {loading ? (
                                <Skeleton variant="rectangular" width={200} height={40} sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }} />
                            ) : (
                                <>
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
                                            '&:hover': { bgcolor: themeColor }
                                        }}
                                    >
                                        {t('getStarted')}
                                    </Button>
                                </>
                            )}
                        </Box>
                    )}
                </Box>

                {/* MOBILE MENU ICON */}
                <IconButton 
                    color="inherit" 
                    onClick={handleDrawerToggle} 
                    sx={{ display: { md: 'none' }, color: themeColor, border: '1px solid rgba(255,255,255,0.1)' }}
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
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 300, borderLeft: `1px solid ${themeColor}` } 
            }}
        >
            {drawerContent}
        </Drawer>

        {user && (
            <ProfileDialog 
                open={profileOpen} 
                onClose={() => setProfileOpen(false)} 
                user={user}
                onSuccess={handleProfileUpdate}
            />
        )}
        
        <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
            <Alert severity="success" sx={{ bgcolor: '#4CAF50', color: '#FFF' }}>{successMsg}</Alert>
        </Snackbar>
    </>
  );
};
export default Navigation;