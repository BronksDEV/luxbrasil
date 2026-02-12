import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, InputAdornment, IconButton, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { api } from '../services/api';
import { PageRoute, UserProfile } from '../types';
import { Visibility, VisibilityOff, ArrowBack, MarkEmailRead } from '@mui/icons-material';
import { motion } from 'framer-motion';

const isValidCPFFormat = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    return cpf.length === 11 && !/^(\d)\1+$/.test(cpf);
};

const getOrCreateDeviceId = (): string => {
  const key = 'device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};

const registerSchema = z.object({
  full_name: z.string().min(3, "Nome muito curto").refine(val => val.trim().split(/\s+/).length >= 2, "Digite seu nome completo (Nome e Sobrenome)"),
  cpf: z.string().refine(isValidCPFFormat, "Formato de CPF inválido"),
  phone: z.string().min(14, "Telefone incompleto").max(15, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string(),
  inviteCode: z.string().optional(),
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
  
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        inviteCode: searchParams.get('code') || '',
        website: ''
    }
  });

  const onSubmit = async (data: RegisterFormData) => {
    setGlobalError(null);
    try {
      const cleanPhone = data.phone.replace(/\D/g, '');
      const cleanCpf = data.cpf.replace(/\D/g, '');
      const deviceId = getOrCreateDeviceId();

      const user = await api.auth.register({
        full_name: data.full_name.toUpperCase(),
        email: data.email,
        cpf: cleanCpf,
        phone: cleanPhone,
        password: data.password,
        inviteCode: data.inviteCode,
        honeypot: data.website,
        deviceId: deviceId,
      });
      setUser(user);
      navigate(PageRoute.DASHBOARD);
    } catch (error: any) {
      if (error.message === 'CONFIRM_EMAIL') {
          setSuccessMessage(true);
      } else {
          setGlobalError(t(error.message) || t('err_create_account'));
      }
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const upper = e.target.value.toUpperCase();
      setValue('full_name', upper, { shouldValidate: true });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 11) value = value.substring(0, 11);
      if (value.length > 2) value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
      if (value.length > 10) value = `${value.substring(0, 10)}-${value.substring(10)}`;
      setValue('phone', value, { shouldValidate: true });
  };

  const inputStyle = {
      '& .MuiOutlinedInput-root': { 
          bgcolor: 'rgba(0,0,0,0.3)',
          '& fieldset': { borderColor: 'rgba(212, 175, 55, 0.2)' },
          '&:hover fieldset': { borderColor: 'rgba(212, 175, 55, 0.5)' },
          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
      },
      '& label': { color: '#888' },
      '& label.Mui-focused': { color: '#D4AF37' },
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
        {/* Background Video */}
        <video
            autoPlay
            loop
            muted
            playsInline
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
                opacity: 0.3
            }}
            src="/videos/gold-particles.mp4"
        />
        <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, transparent 0%, #050510 80%)', zIndex: 1 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 10 }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
        <Paper elevation={0} sx={{ 
            p: { xs: 4, md: 6 }, 
            borderRadius: 4, 
            bgcolor: 'rgba(5, 5, 16, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.6)'
        }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(PageRoute.LOGIN)} sx={{ mb: 3, color: '#AAA' }}>{t('login')}</Button>
          
          <Box textAlign="center" mb={4}>
            <Typography variant="h5" className="logo-shimmer" sx={{ fontFamily: 'Montserrat', fontWeight: 900, letterSpacing: 2, mb: 1 }}>
                LUX BRASIL
            </Typography>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 4 }}>
                {t('register_title')}
            </Typography>
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
                <Alert severity="warning" variant="filled" sx={{ mt: 3, textAlign: 'left' }}>
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
                {globalError && <Alert severity="error" variant="filled" sx={{ mb: 2 }}>{globalError}</Alert>}
                
                <TextField {...register('website')} sx={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

                <TextField margin="normal" required fullWidth label={t('name_label')} placeholder="NOME COMPLETO" {...register('full_name')} onChange={handleNameChange} error={!!errors.full_name} helperText={errors.full_name?.message} sx={inputStyle} />
                
                <Box display="flex" gap={2} flexDirection={{ xs: 'column', sm: 'row' }}>
                    <TextField margin="normal" required fullWidth label={t('cpf_label')} placeholder="000.000.000-00" {...register('cpf')} error={!!errors.cpf} helperText={errors.cpf?.message} sx={inputStyle} />
                    <TextField margin="normal" required fullWidth label={t('phone_label')} placeholder="(DDD) 9XXXX-XXXX" {...register('phone')} onChange={handlePhoneChange} error={!!errors.phone} helperText={errors.phone?.message} sx={inputStyle} />
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
                    sx={{ py: 2, borderRadius: 50, fontWeight: 800, color: '#000' }}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('create_account_btn')}
                </Button>
            </Box>
          )}
        </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};
export default Register;
