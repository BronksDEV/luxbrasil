import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel,
  CircularProgress, Accordion, AccordionSummary, AccordionDetails, Chip,
  IconButton, List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Tooltip
} from '@mui/material';
import { ExpandMore, Add, Delete, Public, Dns, Refresh, Save } from '@mui/icons-material';
import { api } from '../services/api';

interface WhitelistItem {
  id: string;
  ip_address: string;
  reason: string;
}

interface IpUsageStat {
  ip_address: string;
  account_count: number;
  user_names: string;
}

const AdminIPControl: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<{ limit: number, active: boolean, whitelist: WhitelistItem[] }>({ limit: 3, active: true, whitelist: [] });
  const [stats, setStats] = useState<IpUsageStat[]>([]);

  const [newWhitelistIp, setNewWhitelistIp] = useState('');
  const [newWhitelistReason, setNewWhitelistReason] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, statsData] = await Promise.all([
        api.admin.getIpConfig(),
        api.admin.getIpUsageStats(),
      ]);
      setConfig(configData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch IP control data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveLimit = async () => {
    try {
      await api.admin.updateIpLimit(config.limit, config.active);
      alert('Configuração de limite salva!');
      fetchData();
    } catch (error) {
      alert('Falha ao salvar configuração.');
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistIp) return;
    try {
      await api.admin.addIpWhitelist(newWhitelistIp, newWhitelistReason);
      setNewWhitelistIp('');
      setNewWhitelistReason('');
      fetchData();
    } catch (error) {
      alert('Falha ao adicionar IP à whitelist.');
    }
  };

  const handleRemoveWhitelist = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este IP da whitelist?')) {
      try {
        await api.admin.removeIpWhitelist(id);
        fetchData();
      } catch (error) {
        alert('Falha ao remover IP.');
      }
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  }

  return (
    <Grid container spacing={4}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, bgcolor: '#0F121D', borderRadius: 3 }}>
          <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>Configuração de Limite</Typography>
          <Divider sx={{ mb: 2 }} />
          <FormControlLabel
            control={<Switch checked={config.active} onChange={(e) => setConfig(c => ({ ...c, active: e.target.checked }))} />}
            label={config.active ? 'Limite de IP Ativo' : 'Limite de IP Inativo'}
          />
          <TextField
            label="Máximo de contas por IP"
            type="number"
            value={config.limit}
            onChange={(e) => setConfig(c => ({ ...c, limit: parseInt(e.target.value, 10) || 0 }))}
            fullWidth
            margin="normal"
          />
          <Button startIcon={<Save />} variant="contained" onClick={handleSaveLimit} sx={{ mt: 2 }}>
            Salvar Limite
          </Button>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: '#0F121D', borderRadius: 3, mt: 4 }}>
          <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>Whitelist de IPs</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box display="flex" gap={2} mb={2}>
            <TextField label="Endereço IP" value={newWhitelistIp} onChange={(e) => setNewWhitelistIp(e.target.value)} size="small" />
            <TextField label="Motivo (Opcional)" value={newWhitelistReason} onChange={(e) => setNewWhitelistReason(e.target.value)} size="small" fullWidth />
          </Box>
          <Button startIcon={<Add />} variant="outlined" onClick={handleAddWhitelist}>Adicionar à Whitelist</Button>

          <List sx={{ mt: 2 }}>
            {config.whitelist.map(item => (
              <ListItem key={item.id} divider sx={{ bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 1 }}>
                <ListItemText primary={item.ip_address} secondary={item.reason} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemoveWhitelist(item.id)}>
                    <Delete color="error" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Paper sx={{ p: 3, bgcolor: '#0F121D', borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>IPs com Múltiplas Contas</Typography>
            <Tooltip title="Atualizar dados">
              <IconButton onClick={fetchData}><Refresh /></IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            IPs que estão sendo usados por mais de uma conta.
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {stats.map((stat, index) => (
            <Accordion key={index} sx={{ bgcolor: 'rgba(0,0,0,0.2)', backgroundImage: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                  <Typography sx={{ fontFamily: 'monospace' }}>{stat.ip_address}</Typography>
                  <Chip label={`${stat.account_count} Contas`} color="warning" size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="caption" color="text.secondary">Contas associadas:</Typography>
                <Typography>{stat.user_names}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          {stats.length === 0 && <Typography align="center" color="text.secondary" p={3}>Nenhum IP com múltiplas contas encontrado.</Typography>}
        </Paper>
      </Grid>
    </Grid>
  );
};

export default AdminIPControl;
