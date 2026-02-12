
export type PrestigeTier = 'bronze' | 'gold' | 'platinum' | 'master';

export interface TierInfo {
    nameKey: string;
    color: string;
    minLevel: number;
    maxLevel: number;
    xpPerLevel: number;
}

export const TIER_CONFIG: Record<PrestigeTier, TierInfo> = {
    bronze: { nameKey: 'tier_bronze', color: '#CD7F32', minLevel: 1, maxLevel: 4, xpPerLevel: 700 },
    gold: { nameKey: 'tier_gold', color: '#D4AF37', minLevel: 5, maxLevel: 9, xpPerLevel: 1000 },
    platinum: { nameKey: 'tier_platinum', color: '#E5E4E2', minLevel: 10, maxLevel: 19, xpPerLevel: 1500 },
    master: { nameKey: 'tier_master', color: '#E040FB', minLevel: 20, maxLevel: 30, xpPerLevel: 2000 },
};

export const MAX_LEVEL = 30;
export const LEVEL_UP_REWARD_LC = 50;

// Função para calcular o XP total necessário para atingir um determinado nível
const calculateTotalXpForLevel = (level: number): number => {
    let totalXp = 0;
    for (let i = 1; i < level; i++) {
        if (i <= TIER_CONFIG.bronze.maxLevel) totalXp += TIER_CONFIG.bronze.xpPerLevel;
        else if (i <= TIER_CONFIG.gold.maxLevel) totalXp += TIER_CONFIG.gold.xpPerLevel;
        else if (i <= TIER_CONFIG.platinum.maxLevel) totalXp += TIER_CONFIG.platinum.xpPerLevel;
        else totalXp += TIER_CONFIG.master.xpPerLevel;
    }
    return totalXp;
};

export const TOTAL_XP_FOR_MAX_LEVEL = calculateTotalXpForLevel(MAX_LEVEL + 1);

export const calculateLevelInfo = (currentXp: number) => {
    let level = 1;
    let tier: PrestigeTier = 'bronze';
    
    // Calcula o nível atual iterando sobre os requisitos de XP
    while (level < MAX_LEVEL) {
        const xpForNextLevel = calculateTotalXpForLevel(level + 1);
        if (currentXp < xpForNextLevel) {
            break;
        }
        level++;
    }

    // Determina o patamar com base no nível calculado
    if (level >= TIER_CONFIG.master.minLevel) tier = 'master';
    else if (level >= TIER_CONFIG.platinum.minLevel) tier = 'platinum';
    else if (level >= TIER_CONFIG.gold.minLevel) tier = 'gold';
    else tier = 'bronze';
    
    const tierInfo = TIER_CONFIG[tier];
    const xpForThisTierLevel = tierInfo.xpPerLevel;

    const startOfLevelXp = calculateTotalXpForLevel(level);
    const xpIntoLevel = currentXp - startOfLevelXp;
    
    const progress = (level === MAX_LEVEL) 
      ? 100 
      : Math.max(0, Math.min(100, (xpIntoLevel / xpForThisTierLevel) * 100));

    const endOfLevelXp = calculateTotalXpForLevel(level + 1);

    return {
        level,
        tier,
        tierInfo,
        progress,
        xpIntoLevel,
        xpForNextLevel: xpForThisTierLevel,
        currentXp,
        xpToNextLevel: level === MAX_LEVEL ? 0 : endOfLevelXp - currentXp,
    };
};
