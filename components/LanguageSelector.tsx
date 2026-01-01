import React from 'react';
import { Select, MenuItem, Box, Typography } from '@mui/material';
import { useLanguage } from '../hooks/useLanguage';

const languages = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

interface LanguageSelectorProps {
  mobile?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ mobile = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <Select
      value={language}
      onChange={(e) => setLanguage(e.target.value as any)}
      variant="outlined"
      sx={{
        minWidth: mobile ? '100%' : 120,
        height: mobile ? 50 : 40,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: 'white',
        borderRadius: 2,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212, 175, 55, 0.3)' },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' },
        '& .MuiSvgIcon-root': { color: 'white' },
      }}
    >
      {languages.map((lang) => (
        <MenuItem key={lang.code} value={lang.code}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography fontSize="1.2rem">{lang.flag}</Typography>
            <Typography fontSize="0.9rem" fontWeight={500}>{lang.name}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
};

export default LanguageSelector;