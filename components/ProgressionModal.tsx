import React from 'react';
import {
  Dialog, DialogContent, DialogTitle, IconButton, Box, Typography,
  Stepper, Step, StepLabel, StepIconProps, Accordion, AccordionSummary,
  AccordionDetails, Chip, LinearProgress
} from '@mui/material';
import { Close, MilitaryTech, WorkspacePremium, Bolt, Savings, TrendingUp, ExpandMore } from '@mui/icons-material';
import { useLanguage } from '../hooks/useLanguage';
import { TIER_CONFIG, calculateLevelInfo, PrestigeTier, TOTAL_XP_FOR_MAX_LEVEL } from '../utils/levelsystem';

interface ProgressionModalProps {
  open: boolean;
  onClose: () => void;
  userXp: number;
}

const tierOrder: PrestigeTier[] = ['bronze', 'gold', 'platinum', 'master'];

const TierStepIcon: React.FC<StepIconProps & { tier: PrestigeTier, currentTier: PrestigeTier }> = (props) => {
  const { active, completed, tier, currentTier } = props;
  const tierInfo = TIER_CONFIG[tier];
  const { t } = useLanguage();

  return (
    <Box sx={{
      width: 50,
      height: 50,
      borderRadius: '50%',
      border: `3px solid ${active || completed ? tierInfo.color : '#444'}`,
      bgcolor: active || completed ? `${tierInfo.color}30` : '#1a1d2e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
      transform: active ? 'scale(1.15)' : 'scale(1)',
      boxShadow: active ? `0 0 20px ${tierInfo.color}80` : completed ? `0 0 10px ${tierInfo.color}40` : 'none',
      position: 'relative',
      zIndex: 2
    }}>
      <MilitaryTech sx={{ color: active || completed ? tierInfo.color : '#666', fontSize: 28 }} />
      {tier === currentTier && (
        <Chip
          label={t('you_are_here')}
          size="small"
          sx={{
            position: 'absolute',
            top: -24,
            bgcolor: tierInfo.color,
            color: '#000',
            fontWeight: 800,
            fontSize: '0.65rem',
            height: 20,
            px: 1
          }}
        />
      )}
    </Box>
  );
};

const PerkItem: React.FC<{ icon: React.ReactNode, text: string, locked?: boolean }> = ({ icon, text, locked = false }) => (
  <Box display="flex" alignItems="center" gap={2} mb={1.5} sx={{ opacity: locked ? 0.5 : 1 }}>
    <Box sx={{ color: locked ? '#666' : '#D4AF37', minWidth: 24 }}>{icon}</Box>
    <Typography variant="body2" sx={{ color: locked ? '#999' : 'inherit' }}>
      {text}
    </Typography>
  </Box>
);

const ProgressionModal: React.FC<ProgressionModalProps> = ({ open, onClose, userXp }) => {
  const { t } = useLanguage();
  const levelInfo = calculateLevelInfo(userXp);

  const activeTierIndex = tierOrder.indexOf(levelInfo.tier);
  const overallProgress = (activeTierIndex / (tierOrder.length - 1)) * 100;

  const getTierPerks = (tier: PrestigeTier, isLocked: boolean) => {
    const perks = [<PerkItem key="levelup" icon={<Savings />} text={t('perk_levelup_reward')} locked={isLocked} />];
    switch (tier) {
      case 'bronze':
        perks.push(<PerkItem key="bronze" icon={<Bolt />} text={t('perk_bronze_consolation')} locked={isLocked} />);
        break;
      case 'gold':
        perks.push(<PerkItem key="gold" icon={<Bolt />} text={t('perk_gold_consolation')} locked={isLocked} />);
        break;
      case 'platinum':
        perks.push(<PerkItem key="platinum" icon={<Bolt />} text={t('perk_platinum_consolation')} locked={isLocked} />);
        break;
      case 'master':
        perks.push(<PerkItem key="master1" icon={<Bolt />} text={t('perk_master_consolation')} locked={isLocked} />);
        perks.push(<PerkItem key="master2" icon={<TrendingUp />} text={t('perk_master_xp_boost')} locked={isLocked} />);
        break;
    }
    return perks;
  };

  const isTierUnlocked = (tier: PrestigeTier) => {
    const tierInfo = TIER_CONFIG[tier];
    return levelInfo.level >= tierInfo.minLevel;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { bgcolor: '#0F121D', borderRadius: 4, border: '1px solid #444' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontSize: '0.9rem', fontWeight: 700 }}>
            {t('progression_title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">{t('progression_subtitle')}</Typography>
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Progress Bar for Current Level */}
        <Box my={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight={800} color="white">Nível {levelInfo.level}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('xp_for_next_level')}: {levelInfo.xpToNextLevel}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={levelInfo.progress}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                background: `linear-gradient(90deg, ${levelInfo.tierInfo.color}60, ${levelInfo.tierInfo.color})`,
                borderRadius: 6
              }
            }}
          />

          <Typography variant="caption" color="text.secondary" align="right" display="block" mt={0.5}>
            {levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP
          </Typography>
        </Box>

        {/* Stepper for Tiers with overall progress bar */}
        <Box sx={{ position: 'relative', mb: 5, pt: 3 }}>
          <Box
            sx={{
              position: 'absolute',
              width: 'calc(100% - 100px)',
              left: '50px',
              top: '48px',
              height: 6,
              bgcolor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              zIndex: 0
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              width: `calc((100% - 100px) * ${overallProgress / 100})`,
              left: '50px',
              top: '48px',
              height: 6,
              background: 'linear-gradient(90deg, #CD7F32, #D4AF37, #E5E4E2, #E040FB)',
              borderRadius: 3,
              zIndex: 1,
              transition: 'width 0.5s ease-in-out'
            }}
          />

          <Stepper
            alternativeLabel
            activeStep={tierOrder.indexOf(levelInfo.tier)}
            sx={{
              bgcolor: 'transparent',
              p: 0,
              position: 'relative',
              zIndex: 2,
              '& .MuiStepConnector-line': { display: 'none' },
              '& .MuiStep-root': { px: 0 }
            }}
          >
            {tierOrder.map((tier) => (
              <Step key={tier}>
                <StepLabel StepIconComponent={(props) => <TierStepIcon {...props} tier={tier} currentTier={levelInfo.tier} />}>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    color={TIER_CONFIG[tier].color}
                    sx={{ display: 'block', mt: 1 }}
                  >
                    {t(TIER_CONFIG[tier].nameKey)}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Níveis {TIER_CONFIG[tier].minLevel}-{TIER_CONFIG[tier].maxLevel}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Accordion for Perks - SEMPRE VISÍVEL */}
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2} color="white">
            {t('level_perks_by_tier')}
          </Typography>

          {tierOrder.map(tier => {
            const tierInfo = TIER_CONFIG[tier];
            const isUnlocked = isTierUnlocked(tier);
            const isCurrent = tier === levelInfo.tier;

            return (
              // FIX: Resolved a "No overload matches this call" error where the 'children' prop was reported as missing. Wrapping AccordionSummary and AccordionDetails in a React Fragment (<>) ensures they are treated as a single child element, satisfying the Accordion component's type definition.
              <Accordion
                key={tier}
                defaultExpanded={isCurrent}
                sx={{
                  bgcolor: isCurrent ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
                  backgroundImage: 'none',
                  border: `1px solid ${isCurrent ? tierInfo.color : isUnlocked ? '#333' : '#222'}`,
                  mb: 1.5,
                  '&:before': { display: 'none' },
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
              >
                <>
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ color: isUnlocked ? tierInfo.color : '#666' }} />}
                    sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                  >
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <WorkspacePremium sx={{ color: tierInfo.color }} />
                      <Box flex={1}>
                        <Typography fontWeight={700} color={isUnlocked ? 'white' : '#999'}>
                          {t(tierInfo.nameKey)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Níveis {tierInfo.minLevel}-{tierInfo.maxLevel}
                        </Typography>
                      </Box>
                      {!isUnlocked && (
                        <Chip
                          label="🔒 Bloqueado"
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#999', fontSize: '0.7rem' }}
                        />
                      )}
                      {isCurrent && (
                        <Chip
                          label="Atual"
                          size="small"
                          sx={{ bgcolor: tierInfo.color, color: '#000', fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ bgcolor: 'rgba(0,0,0,0.3)', pt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      {isUnlocked ? 'Vantagens ativas:' : 'Vantagens disponíveis ao desbloquear:'}
                    </Typography>
                    {getTierPerks(tier, !isUnlocked).map((perk, index) => (
                      <React.Fragment key={index}>{perk}</React.Fragment>
                    ))}
                  </AccordionDetails>
                </>
              </Accordion>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressionModal;