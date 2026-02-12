import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Snackbar, List, ListItem, ListItemText, Chip,
  Button, Avatar, TextField, InputAdornment, CircularProgress
} from '@mui/material';
import {
  WhatsApp, Telegram, HourglassEmpty, CheckCircle, PersonAdd,
  Bolt, Star, Diamond, Leaderboard
} from '@mui/icons-material';
import { supabase, api } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { DetailedReferral, RankingEntry } from '../types';
import { motion } from 'framer-motion';
import MagicBento, { BentoCardProps } from './MagicBento';
import { useAuth } from '../contexts/AuthContext';
import { useThemeConfig } from '../contexts/ThemeContext';

// Tipos “reais” que podem vir do Supabase nesse select (às vezes object, às vezes array)
type ReferredMaybe =
  | { full_name: string; created_at: string }
  | { full_name: string; created_at: string }[]
  | null;

type ReferralRowFromDb = {
  id: string;
  created_at: string;
  reward_paid: boolean | null;
  referred: ReferredMaybe;
};

function normalizeReferral(row: ReferralRowFromDb): DetailedReferral {
  const referred =
    Array.isArray(row.referred) ? (row.referred[0] ?? null) : row.referred;

  // Agora garante que `referred` é objeto ou null, como seu DetailedReferral espera
  return {
    ...(row as any),
    referred,
  } as DetailedReferral;
}

const InviteSystem: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { themeConfig } = useThemeConfig();
  const isCarnival = themeConfig.active && themeConfig.name === 'carnival';

  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<DetailedReferral[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<RankingEntry | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [referralsRes, rankingData] = await Promise.all([
        supabase
          .from('referrals')
          .select(
            `id, created_at, reward_paid,
             referred:profiles!referrals_referred_id_fkey(full_name, created_at)`
          )
          .eq('referrer_id', user.id)
          .order('created_at', { ascending: false })
          .returns<ReferralRowFromDb[]>(),
        api.ranking.getMonthlyRanking(),
      ]);

      if (referralsRes.error) throw referralsRes.error;

      const normalized = (referralsRes.data ?? []).map(normalizeReferral);
      setReferrals(normalized);

      if (rankingData) {
        const me = rankingData.find((r) => r.is_current_user);
        if (me) setCurrentUserRank(me);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do sistema de convite:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-referrals-for-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${user.id}`,
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" py={5}>
        <CircularProgress />
      </Box>
    );
  }

  // ✅ aqui estava errado: você usa invite_code no banco (e no SQL novo).
  const {
    invite_count: inviteCount = 0,
    invite_earnings: inviteEarnings = 0,
    invite_code: userCode = '', // <-- era referral_code
    full_name,
  } = user as any;

  const firstName = (full_name || 'Usuário').split(' ')[0];

  const getBaseUrl = () => {
    const origin = window.location.origin;
    return origin.includes('localhost') ? origin : 'https://roletalux.com.br';
  };

  const inviteLink = `${getBaseUrl()}/#/register?code=${userCode}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error('Falha ao copiar com a API moderna:', err);
      });
    } else {
      // Fallback para navegadores mais antigos ou contextos não seguros
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = "fixed";  // Evita rolar a página
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
      } catch (err) {
        console.error('Fallback: Falha ao copiar', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const shareData = {
    title: 'Lux Brasil',
    text: t('invite_share_text', { name: firstName }),
    url: inviteLink,
  };

  const confirmedCount = referrals.filter((r) => !!r.referred?.created_at).length;

  // ⚠️ observação: no seu SQL novo, invite_count sobe quando CONFIRMA e paga.
  // então conversionRate tende a ficar 100%. Mantive sua lógica como está.
  const conversionRate =
    inviteCount > 0 ? ((confirmedCount / inviteCount) * 100).toFixed(0) : '0';

  const getAvatarUrl = (avatarId: string | undefined | null, defaultName: string) => {
    if (avatarId) {
      const parts = avatarId.split(':');
      if (parts.length === 2) {
        const [style, seed] = parts;
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
      }
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarId}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }

    const color = isCarnival ? '9c27b0' : 'd4af37';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${defaultName.replace(
      /\s/g,
      ''
    )}&backgroundColor=000000&clothing=blazerAndShirt&clothingColor=${color}&hairColor=${color}&skinColor=edb98a&top=shortFlat`;
  };

  const getReferralStatus = (ref: DetailedReferral) => {
    if (ref.referred?.created_at) {
      return {
        icon: <CheckCircle />,
        label: t('status_confirmed_paid'),
        color: 'success' as const,
      };
    }
    return {
      icon: <HourglassEmpty />,
      label: t('status_pending_confirmation'),
      color: 'warning' as const,
    };
  };

  const avatarUrl = getAvatarUrl((user as any)?.avatar_id, (user as any).full_name);

  const GradientText = (props: any) => (
    <Typography
      component="h2"
      {...props}
      sx={{
        background: 'linear-gradient(90deg, #9C27B0, #D4AF37, #00E676)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 800,
        fontSize: { xs: '0.9rem', md: '1.1rem' },
        mb: 1,
        ...props.sx,
      }}
    />
  );

  const cards: BentoCardProps[] = [
    {
      label: t('invite_competition'),
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div className="magic-bento-card__header">
            <div className="magic-bento-card__label">{t('invite_competition')}</div>
          </div>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            <Avatar src={avatarUrl} sx={{ width: { xs: 40, sm: 56 }, height: { xs: 40, sm: 56 }, border: '2px solid #D4AF37' }} />
            <Box>
              <GradientText>{t('your_rank')}</GradientText>
              <Typography variant="h4" fontWeight={900} color="white">
                {currentUserRank ? `#${currentUserRank.rank}` : 'N/A'}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      label: t('invite_performance'),
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div className="magic-bento-card__header">
            <div className="magic-bento-card__label">{t('invite_performance')}</div>
          </div>
          <Box>
            <GradientText>{t('invite_stats_total')}</GradientText>
            <Typography variant="h4" fontWeight={900} color="white">{inviteCount}</Typography>
            <Typography variant="body2" color="text.secondary">{t('invite_friends_unit')}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="magic-bento-card__header">
            <GradientText sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 0, fontSize: '1.1rem' }}>
              <Leaderboard sx={{ fontSize: 18 }} />
              {t('invite_manager_title')}
            </GradientText>
          </div>

          {referrals.length > 0 ? (
            <List sx={{ overflowY: 'auto', flex: 1, p: 0, mt: 2 }}>
              {referrals.map((ref, index) => {
                const status = getReferralStatus(ref);
                return (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ListItem sx={{ p: 1, mb: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)' }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(212, 175, 55, 0.1)',
                          color: '#D4AF37',
                          mr: 1.5,
                          width: 32,
                          height: 32,
                          fontSize: '0.9rem',
                        }}
                      >
                        {ref.referred?.full_name?.charAt(0) || '?'}
                      </Avatar>

                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} color="#FFF" noWrap>
                            {ref.referred?.full_name || t('invite_new_player')}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </Typography>
                        }
                      />

                      <Chip icon={status.icon} label={status.label} color={status.color} size="small" variant="outlined" sx={{ height: 22 }} />
                    </ListItem>
                  </motion.div>
                );
              })}
            </List>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
              <PersonAdd sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="caption" sx={{ textAlign: 'center' }}>
                {t('invite_no_referrals')}
              </Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div>
            <div className="magic-bento-card__header">
              <div className="magic-bento-card__label">{t('invite_vip_access')}</div>
            </div>
            <Box className="magic-bento-card__content">
              <GradientText>{t('invite_link_title')}</GradientText>
              <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
                {t('invite_share_to_earn')}
              </Typography>
            </Box>
          </div>

          <Box mt={2}>
            <TextField
              fullWidth
              value={inviteLink}
              variant="outlined"
              size="small"
              InputProps={{
                readOnly: true,
                sx: {
                  bgcolor: 'rgba(0,0,0,0.4)',
                  color: '#D4AF37',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  borderRadius: 2,
                  pr: 0,
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={handleCopy}
                      variant="contained"
                      sx={{
                        bgcolor: copied ? '#4CAF50' : '#D4AF37',
                        color: '#000',
                        fontWeight: 800,
                        height: 40,
                        borderRadius: '0 8px 8px 0',
                        boxShadow: 'none',
                      }}
                    >
                      {copied ? t('copied') : t('copy')}
                    </Button>
                  </InputAdornment>
                ),
              }}
            />

            <Box display="flex" gap={1} mt={1.5}>
              <Button
                fullWidth
                size="small"
                startIcon={<WhatsApp />}
                variant="contained"
                sx={{ bgcolor: '#25D366' }}
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`)}
              >
                WhatsApp
              </Button>

              <Button
                fullWidth
                size="small"
                startIcon={<Telegram />}
                variant="contained"
                sx={{ bgcolor: '#229ED9' }}
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`)}
              >
                Telegram
              </Button>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      label: t('invite_total_earnings'),
      content: (
        <>
          <div className="magic-bento-card__header">
            <div className="magic-bento-card__label">{t('invite_total_earnings')}</div>
          </div>

          <Box className="magic-bento-card__content">
            <GradientText>{t('invite_your_achievements')}</GradientText>
          </Box>

          <Box display="flex" justifyContent="space-around" textAlign="center">
            <Box>
              <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <Bolt sx={{ color: '#D4AF37' }} /> {inviteEarnings}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('spinsAvailable')}</Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <Diamond sx={{ color: '#D4AF37' }} /> {inviteCount * 75}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('lux_coins')}</Typography>
            </Box>

            <Box>
              <Typography variant="h5" fontWeight={700} display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                <Star sx={{ color: '#D4AF37' }} /> {inviteCount * 100}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('xp_label')}</Typography>
            </Box>
          </Box>
        </>
      ),
    },
    {
      label: t('invite_effectiveness'),
      content: (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div className="magic-bento-card__header">
            <div className="magic-bento-card__label">{t('invite_effectiveness')}</div>
          </div>
          <Box>
            <GradientText>{t('invite_confirmation_rate')}</GradientText>
            <Typography variant="h4" fontWeight={900} color="white">{conversionRate}%</Typography>
            <Typography variant="body2" color="text.secondary">{t('invite_of_invites')}</Typography>
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" color="#D4AF37" fontWeight={800} sx={{ mb: 1 }}>
        {t('invite_program_vip')}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('invite_desc', { bonus: t('invite_bonus_highlight') })}
      </Typography>

      <Box display="flex" justifyContent="center">
        <MagicBento
          cards={cards}
          textAutoHide
          enableStars
          enableSpotlight
          enableBorderGlow
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="212, 175, 55"
          disableAnimations={false}
        />
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message={t('copied')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default InviteSystem;