
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, TextField, Button, Alert, CircularProgress, Box, Typography, Avatar, IconButton } from '@mui/material';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { Close, Edit, VerifiedUser, Diamond, Phone, Badge, Email } from '@mui/icons-material';

interface ProfileDialogProps {
    open: boolean;
    onClose: () => void;
    user: UserProfile;
    isAdminMode?: boolean; // Se true, permite editar dados mais sensíveis ou não restringe
    onSuccess?: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose, user, isAdminMode = false, onSuccess }) => {
    const { t } = useLanguage();
    
    // Safety check - if user is null/undefined, don't render content or crash
    if (!user) return null;

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        cpf: '',
        phone: '',
        // Campos extras para admin
        lux_coins: 0,
        available_spins: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open && user) {
            setFormData({
                full_name: user.full_name || '',
                email: user.email || '',
                cpf: user.cpf || '',
                phone: user.phone || '',
                lux_coins: user.lux_coins || 0,
                available_spins: user.available_spins || 0
            });
            setError(null);
        }
    }, [open, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            if (isAdminMode) {
                // Admin pode editar tudo, incluindo e-mail
                await api.admin.updateUser(user.id, {
                    full_name: formData.full_name,
                    email: formData.email,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    lux_coins: Number(formData.lux_coins),
                    available_spins: Number(formData.available_spins)
                });
            } else {
                // Usuário comum só edita dados cadastrais básicos
                await api.auth.updateProfile(user.id, {
                    full_name: formData.full_name,
                    phone: formData.phone,
                    cpf: formData.cpf
                });
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message || t('error_generic'));
        } finally {
            setLoading(false);
        }
    };

    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.full_name.replace(/\s/g, '')}&backgroundColor=000000&clothing=blazerAndShirt&clothingColor=d4af37&hairColor=d4af37&skinColor=edb98a&top=shortFlat`;

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
                    overflow: 'hidden'
                }
            }}
        >
            {/* Header com Gradiente */}
            <Box sx={{ 
                height: 120, 
                background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
                position: 'relative',
                display: 'flex',
                justifyContent: 'flex-end',
                p: 2
            }}>
                <IconButton 
                    onClick={onClose} 
                    sx={{ 
                        color: 'white', 
                        bgcolor: 'rgba(0,0,0,0.3)', 
                        width: 40, 
                        height: 40,
                        borderRadius: '50%',
                        '&:hover': { bgcolor: 'rgba(212, 175, 55, 0.2)' } 
                    }}
                >
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ mt: -8, px: { xs: 3, sm: 5 }, pb: 5 }}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                    <Box sx={{ position: 'relative', mb: 2 }}>
                        <Avatar 
                            src={avatarUrl} 
                            sx={{ 
                                width: 120, height: 120, 
                                border: '4px solid #0F121D', 
                                boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)'
                            }} 
                        />
                        <Box sx={{ 
                            position: 'absolute', bottom: 5, right: 5, 
                            bgcolor: '#D4AF37', borderRadius: '50%', p: 0.5, 
                            border: '3px solid #0F121D'
                        }}>
                            <Edit sx={{ fontSize: 16, color: '#000' }} />
                        </Box>
                    </Box>
                    
                    <Typography variant="h5" color="white" fontWeight={800}>{user.full_name}</Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <VerifiedUser sx={{ fontSize: 16, color: '#D4AF37' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 1 }}>MEMBRO LUX</Typography>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ffcdd2', border: '1px solid #ef5350' }}>{error}</Alert>}

                <Box display="flex" flexDirection="column" gap={3}>
                    <TextField
                        label={t('name_label')}
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        InputProps={{ disableUnderline: true, startAdornment: <Badge sx={{ color: '#666', mr: 2 }} /> }}
                        sx={{ 
                            '& .MuiFilledInput-root': { 
                                bgcolor: 'rgba(255,255,255,0.03)', 
                                borderRadius: 2,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                                '&.Mui-focused': { bgcolor: 'rgba(255,255,255,0.05)' }
                            },
                            '& label': { color: '#666' },
                            '& label.Mui-focused': { color: '#D4AF37' }
                        }}
                    />
                    
                    <TextField
                        label="E-mail"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        disabled={!isAdminMode} // Apenas admin muda e-mail
                        InputProps={{ disableUnderline: true, startAdornment: <Email sx={{ color: '#666', mr: 2 }} /> }}
                        sx={{ 
                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 },
                            '& label': { color: '#666' },
                            '& label.Mui-focused': { color: '#D4AF37' },
                            opacity: isAdminMode ? 1 : 0.7
                        }}
                    />

                    <TextField
                        label={t('cpf_label')}
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        InputProps={{ disableUnderline: true, startAdornment: <Badge sx={{ color: '#666', mr: 2 }} /> }}
                        sx={{ 
                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 },
                            '& label': { color: '#666' },
                            '& label.Mui-focused': { color: '#D4AF37' }
                        }}
                    />
                    <TextField
                        label={t('phone_label')}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        fullWidth
                        variant="filled"
                        InputProps={{ disableUnderline: true, startAdornment: <Phone sx={{ color: '#666', mr: 2 }} /> }}
                        sx={{ 
                            '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 },
                            '& label': { color: '#666' },
                            '& label.Mui-focused': { color: '#D4AF37' }
                        }}
                    />
                    
                    {isAdminMode && (
                        <Box sx={{ p: 2, border: '1px dashed #D4AF37', borderRadius: 2, mt: 1 }}>
                            <Typography variant="overline" color="#D4AF37" fontWeight={700}>Admin Override</Typography>
                            <Box display="flex" gap={2} mt={2}>
                                <TextField
                                    label="LuxCoins"
                                    name="lux_coins"
                                    type="number"
                                    value={formData.lux_coins}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="filled"
                                    sx={{ '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                                />
                                <TextField
                                    label="Spins"
                                    name="available_spins"
                                    type="number"
                                    value={formData.available_spins}
                                    onChange={handleChange}
                                    fullWidth
                                    variant="filled"
                                    sx={{ '& .MuiFilledInput-root': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                                />
                            </Box>
                        </Box>
                    )}

                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        fullWidth 
                        size="large"
                        disabled={loading}
                        sx={{ 
                            mt: 2,
                            py: 1.8,
                            bgcolor: '#D4AF37',
                            color: '#000',
                            fontWeight: 800,
                            borderRadius: 2,
                            boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)',
                            '&:hover': { bgcolor: '#F3E5AB' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : t('save')}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;
