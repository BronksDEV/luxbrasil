import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogContent, TextField, Button, Alert, CircularProgress, 
    Box, Typography, Avatar, IconButton, Snackbar, Grid, Paper, Divider, 
    Fade, Chip 
} from '@mui/material';
import { UserProfile, Badge as BadgeType } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { 
    Close, Edit, VerifiedUser, Phone, Badge, Email, 
    EmojiEvents, Bolt, AccessTime, ArrowBack, WorkspacePremium, Info 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { AVATAR_STYLES } from '../constants';
import ProgressionModal from './ProgressionModal';
import { calculateLevelInfo, MAX_LEVEL } from '../utils/levelsystem';

interface ProfileDialogProps {
    open: boolean;
    onClose: () => void;
    user: UserProfile;
    isAdminMode?: boolean; 
    onSuccess?: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose, user, isAdminMode = false, onSuccess }) => {
    const { t } = useLanguage();
    const { refreshUser } = useAuth();
    
    // States
    const [view, setView] = useState<'profile' | 'avatars'>('profile');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        cpf: '',
        phone: '',
        lux_coins: 0,
        available_spins: 0,
        avatar_id: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [missionToast, setMissionToast] = useState<string | null>(null);
    const [progressionOpen, setProgressionOpen] = useState(false);

    // Initial Data Load
    useEffect(() => {
        if (open && user) {
            setView('profile'); // Reset to main view
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                cpf: user.cpf || '',
                phone: user.phone || '',
                lux_coins: user.lux_coins || 0,
                available_spins: user.available_spins || 0,
                avatar_id: user.avatar_id || ''
            });
            setError(null);

            // Valida Missão "Visitante VIP" ao abrir
            if (!isAdminMode) {
                const checkVisitMission = async () => {
                    try {
                        const completed = await api.challenges.checkAction('visit_profile', true);
                        if (completed && completed.length > 0) {
                            await refreshUser();
                            setMissionToast(`Missão Cumprida: ${completed[0].title}! Recompensa creditada.`);
                        }
                    } catch (e) {
                        console.error("Erro ao validar missão de perfil", e);
                    }
                };
                checkVisitMission();
            }
        }
    }, [open, user, isAdminMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isAdminMode) {
                await api.admin.updateUser(user.id, {
                    full_name: formData.full_name,
                    email: formData.email,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    lux_coins: Number(formData.lux_coins),
                    available_spins: Number(formData.available_spins)
                });
            } else {
                await api.auth.updateProfile(user.id, {
                    full_name: formData.full_name,
                    phone: formData.phone,
                    cpf: formData.cpf,
                    avatar_id: formData.avatar_id // Salva o avatar selecionado
                });
            }
            if (onSuccess) onSuccess();
            await refreshUser();
            onClose();
        } catch (e: any) {
            setError(e.message || t('error_generic'));
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarSelect = (style: string, seed: string) => {
        setFormData({ ...formData, avatar_id: `${style}:${seed}` });
        setView('profile');
    };
    
    const getAvatarUrl = (avatarId: string | undefined | null, defaultName: string) => {
        if (avatarId) {
            const parts = avatarId.split(':');
            if (parts.length === 2) {
                const [style, seed] = parts;
                return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
            }
            // Backward compatibility for old seeds
            return `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
        }
        // Fallback for users without any ID
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultName.replace(/\s/g, '')}`;
    };

    const currentAvatarUrl = getAvatarUrl(formData.avatar_id, user.full_name);
    const levelInfo = calculateLevelInfo(user.xp || 0);

    const userBadges: BadgeType[] = [];
    if (levelInfo.level === MAX_LEVEL) {
        userBadges.push({
            id: 'master_roulette',
            name: t('badge_master_roulette_name'),
            description: t('badge_master_roulette_desc'),
            icon: 'WorkspacePremium'
        });
    }

    // --- RENDER VIEWS ---

    const renderProfileView = () => (
        // FIX: The Fade component was producing a TypeScript error about a missing 'children' prop, despite being used correctly as a wrapper. To resolve this, I've explicitly passed the content via the `children` prop, which satisfies the type-checker.
        <Fade in={view === 'profile'} children={
            <Box>
                {/* Visual Header */}
                <Box display="flex" flexDirection="column" alignItems="center" mb={4} sx={{ position: 'relative', mt: 4 }}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                        <Avatar 
                            src={currentAvatarUrl} 
                            sx={{ 
                                width: 140, height: 140, 
                                border: `4px solid ${levelInfo.tierInfo.color}`, 
                                boxShadow: `0 0 30px ${levelInfo.tierInfo.color}60`,
                                bgcolor: '#000'
                            }} 
                        />
                        <IconButton 
                            onClick={() => setView('avatars')}
                            sx={{ 
                                position: 'absolute', bottom: 5, right: 5, 
                                bgcolor: '#D4AF37', borderRadius: '50%', p: 1, 
                                border: '3px solid #0F121D',
                                '&:hover': { bgcolor: '#F3E5AB' }
                            }}
                        >
                            <Edit sx={{ fontSize: 18, color: '#000' }} />
                        </IconButton>
                    </Box>
                    
                    <Typography variant="h5" color="white" fontWeight={800} sx={{ textTransform: 'uppercase' }}>{user.full_name}</Typography>
                    <Chip 
                        icon={<VerifiedUser sx={{ fontSize: 14, color: '#000 !important' }} />} 
                        label={`${t(levelInfo.tierInfo.nameKey)} MEMBER`}
                        size="small"
                        sx={{ mt: 1, bgcolor: levelInfo.tierInfo.color, color: '#000', fontWeight: 800, fontSize: '0.65rem' }} 
                    />
                </Box>

                {/* Stats Row */}
                <Box 
                    onClick={() => setProgressionOpen(true)}
                    sx={{ cursor: 'pointer' }}
                >
                    <Box 
                        display="flex" 
                        justifyContent="center" 
                        gap={2} 
                        mb={1} 
                        sx={{ '& > *': { transition: 'all 0.2s', '&:hover': { transform: 'scale(1.05)', borderColor: '#D4AF37' } } }}
                    >
                        <Paper sx={{ p: 1.5, minWidth: 90, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="caption" color="text.secondary">NÍVEL</Typography>
                            <Typography variant="h6" fontWeight={800} color={levelInfo.tierInfo.color}>{levelInfo.level}</Typography>
                        </Paper>
                        <Paper sx={{ p: 1.5, minWidth: 90, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="caption" color="text.secondary">GIROS</Typography>
                            <Typography variant="h6" fontWeight={800} color="#FFF" display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                <Bolt sx={{ fontSize: 16, color: '#D4AF37' }} /> {user.available_spins}
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 1.5, minWidth: 90, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="caption" color="text.secondary">XP TOTAL</Typography>
                            <Typography variant="h6" fontWeight={800} color="#FFF">{user.xp || 0}</Typography>
                        </Paper>
                    </Box>
                    <Typography variant="caption" color="text.secondary" align="center" display="flex" alignItems="center" justifyContent="center" gap={0.5} sx={{ mb: 4, opacity: 0.7 }}>
                        <Info sx={{ fontSize: 12 }} /> Clique para ver sua Jornada de Prestígio
                    </Typography>
                </Box>

                <Typography variant="overline" color="#D4AF37" sx={{ fontWeight: 700, mb: 2, display: 'block' }}>
                    {t('profile_info_edit')}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box display="flex" flexDirection="column" gap={2.5}>
                    <TextField
                        label={t('name_label')}
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        InputProps={{ disableUnderline: true }}
                        sx={inputStyle}
                    />
                    
                    <TextField
                        label="E-mail"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        disabled={!isAdminMode}
                        InputProps={{ disableUnderline: true, startAdornment: <Email sx={{ color: '#666', mr: 1.5 }} /> }}
                        sx={{ ...inputStyle, opacity: isAdminMode ? 1 : 0.6 }}
                    />

                    <Box display="flex" gap={2}>
                        <TextField
                            label={t('cpf_label')}
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            fullWidth
                            variant="filled"
                            InputProps={{ disableUnderline: true, startAdornment: <Badge sx={{ color: '#666', mr: 1.5 }} /> }}
                            sx={inputStyle}
                        />
                        <TextField
                            label={t('phone_label')}
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            fullWidth
                            variant="filled"
                            InputProps={{ disableUnderline: true, startAdornment: <Phone sx={{ color: '#666', mr: 1.5 }} /> }}
                            sx={inputStyle}
                        />
                    </Box>
                    
                    {isAdminMode && (
                        <Paper variant="outlined" sx={{ p: 2, borderColor: '#D4AF37', bgcolor: 'rgba(212, 175, 55, 0.05)' }}>
                            <Typography variant="caption" fontWeight={800} color="#D4AF37" gutterBottom>ADMIN OVERRIDE</Typography>
                            <Box display="flex" gap={2} mt={1}>
                                <TextField label="LuxCoins" name="lux_coins" type="number" value={formData.lux_coins} onChange={handleChange} fullWidth variant="standard" />
                                <TextField label="Spins" name="available_spins" type="number" value={formData.available_spins} onChange={handleChange} fullWidth variant="standard" />
                            </Box>
                        </Paper>
                    )}

                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

                    <Typography variant="overline" color="#D4AF37" sx={{ fontWeight: 700, display: 'block' }}>
                        {t('badges_title')}
                    </Typography>

                    {userBadges.length > 0 ? (
                        <Grid container spacing={2}>
                            {userBadges.map(badge => (
                                <Grid size={{ xs: 12 }} key={badge.id}>
                                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                        <WorkspacePremium sx={{ color: '#D4AF37', fontSize: 40 }} />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight={700} color="white">{badge.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{badge.description}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography variant="body2" color="text.secondary" align="center">{t('no_badges')}</Typography>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <AccessTime sx={{ fontSize: 12 }} /> {t('joined_date')}: {new Date(user.created_at || Date.now()).toLocaleDateString()}
                        </Typography>
                        
                        <Button 
                            onClick={handleSave} 
                            variant="contained" 
                            size="large"
                            disabled={loading}
                            sx={{ 
                                px: 4,
                                bgcolor: '#D4AF37',
                                color: '#000',
                                fontWeight: 800,
                                borderRadius: 50,
                                boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                                '&:hover': { bgcolor: '#F3E5AB' }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('save')}
                        </Button>
                    </Box>
                </Box>
            </Box>
        } />
    );

    const renderAvatarSelection = () => (
        // FIX: The Fade component was producing a TypeScript error about a missing 'children' prop, despite being used correctly as a wrapper. To resolve this, I've explicitly passed the content via the `children` prop, which satisfies the type-checker.
        <Fade in={view === 'avatars'} children={
            <Box>
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => setView('profile')} sx={{ color: 'white', mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" fontWeight={800} color="white">{t('choose_avatar')}</Typography>
                </Box>

                <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                    {Object.entries(AVATAR_STYLES).map(([category, { style, seeds }]) => (
                        <Box key={category} mb={3}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>{category}</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                {seeds.map((seed) => {
                                    const avatarId = `${style}:${seed}`;
                                    const isSelected = formData.avatar_id === avatarId;
                                    const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                                    return (
                                        <Grid size={{ xs: 4, sm: 3 }} key={avatarId}>
                                            <Paper 
                                                onClick={() => handleAvatarSelect(style, seed)}
                                                elevation={isSelected ? 10 : 1}
                                                sx={{ 
                                                    p: 1, 
                                                    borderRadius: '50%',
                                                    bgcolor: isSelected ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255,255,255,0.03)',
                                                    border: isSelected ? '3px solid #D4AF37' : '1px solid rgba(255,255,255,0.1)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': { transform: 'scale(1.05)', borderColor: '#D4AF37' },
                                                    aspectRatio: '1/1',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Avatar 
                                                    src={avatarUrl} 
                                                    sx={{ width: '100%', height: '100%', bgcolor: 'transparent' }} 
                                                />
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    ))}
                </Box>
                
                <Box mt={3} textAlign="center">
                    <Typography variant="caption" color="text.secondary">
                        Selecione um personagem para representar sua identidade Lux.
                    </Typography>
                </Box>
            </Box>
        } />
    );

    const inputStyle = { 
        '& .MuiFilledInput-root': { 
            bgcolor: 'rgba(255,255,255,0.03)', 
            borderRadius: 2,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            '&.Mui-focused': { bgcolor: 'rgba(255,255,255,0.05)' }
        },
        '& label': { color: '#666' },
        '& label.Mui-focused': { color: '#D4AF37' }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            fullWidth 
            maxWidth="sm"
            PaperProps={{
                sx: {
                    bgcolor: '#0F121D',
                    borderRadius: 4,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(212, 175, 55, 0.2)',
                    overflow: 'hidden',
                    maxHeight: '90vh'
                }
            }}
        >
            {/* Header Background */}
            <Box sx={{ 
                height: 100, 
                background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
                position: 'relative',
                display: 'flex',
                justifyContent: 'flex-end',
                p: 2,
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <IconButton onClick={onClose} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', width: 32, height: 32, borderRadius: '50%', zIndex: 2 }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ mt: -6, px: { xs: 3, sm: 4 }, pb: 4, overflowY: 'auto' }}>
                {view === 'profile' ? renderProfileView() : renderAvatarSelection()}
            </DialogContent>
            
            <Snackbar 
                open={!!missionToast} 
                autoHideDuration={4000} 
                onClose={() => setMissionToast(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setMissionToast(null)} 
                    severity="success" 
                    icon={<EmojiEvents fontSize="inherit" />}
                    sx={{ width: '100%', bgcolor: '#D4AF37', color: '#000', fontWeight: 800, boxShadow: '0 0 20px rgba(212, 175, 55, 0.5)' }}
                >
                    {missionToast}
                </Alert>
            </Snackbar>

            <ProgressionModal open={progressionOpen} onClose={() => setProgressionOpen(false)} userXp={user.xp || 0} />
        </Dialog>
    );
};

export default ProfileDialog;