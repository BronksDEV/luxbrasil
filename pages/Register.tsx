import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, InputAdornment, IconButton, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { PageRoute, UserProfile } from '../types';
import { Visibility, VisibilityOff, ArrowBack, Diamond, MarkEmailRead } from '@mui/icons-material';

// Validador simples para feedback visual rápido, mas a validação real ocorre no api.ts
const isValidCPFFormat = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    return cpf.length === 11 && !/^(\d)\1+$/.test(cpf);
};

const registerSchema = z.object({
  full_name: z.string().min(3, "Nome muito curto"),
  cpf: z.string().refine(isValidCPFFormat, "Formato de CPF inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
  inviteCode: z.string().optional(),
  // Campo Honeypot - deve vir vazio
  website: z.string().optional() 
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterProps { setUser: (user: UserProfile) => void; }

const Register: React.FC<RegisterProps> = ({ setUser }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        inviteCode: searchParams.get('code') || '',
        website: '' // Inicializa vazio
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);
    try {
      const user = await api.auth.register({
        full_name: data.full_name,
        email: data.email,
        cpf: data.cpf,
        phone: data.phone,
        password: data.password,
        inviteCode: data.inviteCode,
        honeypot: data.website // Envia o valor do honeypot para a API verificar
      });
      setUser(user);
      navigate(PageRoute.DASHBOARD);
    } catch (error: any) {
      if (error.message === 'CONFIRM_EMAIL') {
          setSuccessMessage(true);
      } else {
          setGlobalError(error.message || "Erro ao criar conta.");
      }
    }
  };

  const inputStyle = {
      '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' },
      '& label': { color: '#888' },
      '& input': { color: '#FFF' }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative',
      overflow: 'hidden',
      bgcolor: '#050510',
      py: 4
    }}>
      {/* Background FX */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #050510 100%)', zIndex: 2 }} />
          <Box sx={{ position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.08) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10 }}>
        <Paper elevation={0} sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 4, 
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
        }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(PageRoute.LOGIN)} sx={{ mb: 3, color: '#AAA' }}>{t('login')}</Button>
          
          <Box mb={4} display="flex" alignItems="center" gap={2}>
              <Box p={1.5} borderRadius="50%" border="1px solid rgba(212, 175, 55, 0.5)" bgcolor="rgba(0,0,0,0.4)">
                  <Diamond sx={{ color: '#D4AF37', fontSize: 28 }} />
              </Box>
              <Box>
                  <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 700 }}>LUX BRASIL</Typography>
                  <Typography variant="h4" sx={{ fontFamily: 'Montserrat', fontWeight: 800, color: '#FFF' }}>{t('register_title')}</Typography>
              </Box>
          </Box>
          
          {successMessage ? (
            <Box textAlign="center" py={4}>
                <MarkEmailRead sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
                <Typography variant="h5" color="#FFF" fontWeight={800} gutterBottom>
                    Verifique seu E-mail
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Enviamos um link de confirmação exclusivo para o seu endereço.
                </Typography>
                <Alert severity="warning" sx={{ mt: 3, textAlign: 'left', border: '1px solid #ed6c02', bgcolor: 'rgba(237, 108, 2, 0.1)', color: '#ffb74d' }}>
                    <strong>Atenção:</strong> Procure por um e-mail da <u>LUX BRASIL</u>. Se não encontrar, verifique sua caixa de <strong>Spam</strong> ou Lixo Eletrônico.
                </Alert>
                <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ mt: 4, borderColor: '#D4AF37', color: '#D4AF37' }}
                    onClick={() => navigate(PageRoute.LOGIN)}
                >
                    Voltar para Login
                </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                {globalError && <Alert severity="error" sx={{ mb: 2 }}>{globalError}</Alert>}
                
                {/* HONEYPOT FIELD (Hidden) - Anti-Bot */}
                <TextField
                    {...register('website')}
                    sx={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                />

                <TextField margin="normal" required fullWidth label={t('name_label')} {...register('full_name')} error={!!errors.full_name} helperText={errors.full_name?.message} sx={inputStyle} />
                
                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField margin="normal" required fullWidth label={t('cpf_label')} placeholder="000.000.000-00" {...register('cpf')} error={!!errors.cpf} helperText={errors.cpf?.message} sx={inputStyle} />
                    <TextField margin="normal" required fullWidth label={t('phone_label')} {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} sx={inputStyle} />
                </Box>
                
                <TextField margin="normal" required fullWidth label="E-mail" {...register('email')} error={!!errors.email} helperText={errors.email?.message} sx={inputStyle} />
                
                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField margin="normal" required fullWidth label={t('pass_label')} type={showPassword ? 'text' : 'password'} {...register('password')} error={!!errors.password} helperText={errors.password?.message} sx={inputStyle} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} sx={{ color: '#888' }}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
                    <TextField margin="normal" required fullWidth label={t('confirm_pass_label')} type="password" {...register('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} sx={inputStyle} />
                </Box>
                
                <TextField margin="normal" fullWidth label={t('invite_label')} {...register('inviteCode')} error={!!errors.inviteCode} helperText={errors.inviteCode?.message} sx={{ mb: 4, ...inputStyle }} />
                
                <Button 
                    type="submit" 
                    fullWidth 
                    variant="contained" 
                    size="large" 
                    disabled={isSubmitting} 
                    sx={{ 
                        py: 2,
                        borderRadius: 50,
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #D4AF37, #AA8C2C)',
                        color: '#000',
                        boxShadow: '0 0 25px rgba(212, 175, 55, 0.4)',
                        '&:hover': { background: 'linear-gradient(90deg, #F3E5AB, #D4AF37)' }
                    }}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('create_account_btn')}
                </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};
export default Register;