import React, { useState, useEffect } from 'react';
import { 
    Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, 
    Tabs, Tab, Box, Button, TextField, Grid, Slider, Switch, FormControlLabel, 
    Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
    Tooltip, Menu, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { 
    Search, Add, Delete, Block, Casino, PublicOff, Save, Refresh, 
    AdminPanelSettings, Group, History, Settings, MoreVert, Close, Person
} from '@mui/icons-material';
import { api } from '../services/api';
import { Prize, UserProfile } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [logs, setLogs] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Actions State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [spinsDialog, setSpinsDialog] = useState(false);
  const [spinsAmount, setSpinsAmount] = useState<number>(5);
  
  const [prizeDialog, setPrizeDialog] = useState(false);
  const [newPrize, setNewPrize] = useState<Partial<Prize>>({
      name: '',
      color: '#D4AF37',
      probability: 0.05,
      type: 'physical',
      value: 0,
      active: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
        if(tab === 0) {
            const data = await api.admin.getUsers();
            setUsers(data);
        }
        if(tab === 1) {
            const data = await api.prizes.list();
            setPrizes(data);
        }
        if(tab === 2) {
            const data = await api.admin.getAuditLogs();
            setLogs(data);
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  // --- LOGIC HELPERS FOR LOGS ---
  const formatLogAction = (action: string) => {
      const map: any = {
          'UPDATE_PRIZE': 'Edição de Prêmio',
          'CREATE_PRIZE': 'Criação de Prêmio',
          'DELETE_PRIZE': 'Exclusão de Prêmio',
          'BAN_USER': 'Banimento de Usuário',
          'UNBAN_USER': 'Desbloqueio de Usuário',
          'ADD_SPINS': 'Crédito de Giros',
          'BAN_IP': 'Bloqueio de IP'
      };
      return map[action] || action;
  };

  const formatLogDetails = (action: string, details: any, target: string) => {
      let d = details;
      if (typeof details === 'string') {
          try { d = JSON.parse(details); } catch(e) { d = {}; }
      }
      if (!d) d = {};

      switch (action) {
          case 'UPDATE_PRIZE':
          case 'CREATE_PRIZE':
              let changes = [];
              if (d.probability !== undefined) changes.push(`Probabilidade: ${(d.probability * 100).toFixed(1)}%`);
              if (d.active !== undefined) changes.push(`Status: ${d.active ? 'Ativo' : 'Inativo'}`);
              if (d.value !== undefined) changes.push(`Valor: ${d.value}`);
              if (changes.length === 0) return `Item: ${target}`;
              return `${target} — ${changes.join(', ')}`;
          
          case 'DELETE_PRIZE':
              return `Prêmio removido: ${target}`;

          case 'ADD_SPINS':
              return `Adicionou ${d.amount} giros para o usuário (ID: ${target})`;

          case 'BAN_USER':
              return `Bloqueou o acesso do usuário (ID: ${target})`;
          
          case 'UNBAN_USER':
              return `Restaurou o acesso do usuário (ID: ${target})`;

          case 'BAN_IP':
              return `Endereço IP ${target} adicionado à lista negra`;

          default:
              return JSON.stringify(d);
      }
  };

  // --- HANDLERS ---

  const handleAddSpins = async () => {
      if(selectedUser) {
          await api.admin.addSpins(selectedUser.id, spinsAmount);
          setSpinsDialog(false);
          fetchData(); 
          alert(`Adicionado ${spinsAmount} giros para ${selectedUser.full_name}`);
      }
  };

  const handleBanUser = async (user: UserProfile) => {
      const newStatus = !user.is_banned;
      if(window.confirm(`Tem certeza que deseja ${newStatus ? 'BANIR' : 'DESBANIR'} ${user.full_name}?`)) {
          await api.admin.banUser(user.id, newStatus);
          fetchData();
      }
  };

  const handleBanIp = async (ip: string) => {
      if(window.confirm(`Bloquear permanentemente o IP ${ip}? Nenhum usuário com este IP poderá acessar.`)) {
          await api.admin.banIp(ip);
          alert('IP Banido com sucesso.');
      }
  };

  const handleSavePrize = async () => {
      if(!newPrize.name || !newPrize.probability) return alert('Preencha os campos obrigatórios');

      try {
          // @ts-ignore
          await api.prizes.create(newPrize);
          setPrizeDialog(false);
          setNewPrize({ name: '', color: '#D4AF37', probability: 0.05, type: 'physical', value: 0, active: true });
          fetchData();
          alert('Prêmio criado!');
      } catch (e) {
          alert('Erro ao criar prêmio.');
      }
  };

  const handleDeletePrize = async (id: string) => {
      if(window.confirm('Excluir este prêmio permanentemente?')) {
          await api.prizes.delete(id);
          fetchData();
      }
  };

  const handleUpdatePrize = async (prize: Prize) => {
      await api.prizes.update(prize);
      alert('Prêmio atualizado');
  };

  const filteredUsers = users.filter(u => 
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.cpf.includes(searchTerm)
  );

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: '#050510', overflow: 'hidden' }}>
        
        {/* Background FX */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </Box>

        <Container maxWidth="xl" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        
        {/* HEADER */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={6}>
            <Box>
                <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
                    {t('admin_panel')}
                </Typography>
                <Typography variant="h3" sx={{ 
                    color: '#D4AF37', 
                    fontFamily: 'Montserrat', 
                    fontWeight: 900,
                    textShadow: '0 0 30px rgba(212, 175, 55, 0.3)'
                }}>
                    {t('admin_title')}
                </Typography>
            </Box>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>{t('btn_update')}</Button>
        </Box>
        
        {/* TABS */}
        <Paper sx={{ mb: 4, bgcolor: 'rgba(15, 18, 29, 0.8)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <Tabs 
                value={tab} 
                onChange={(_, v) => setTab(v)} 
                textColor="primary" 
                indicatorColor="primary"
                sx={{ '& .MuiTab-root': { py: 3, fontWeight: 700 } }}
            >
                <Tab icon={<Group />} iconPosition="start" label={t('tab_users')} />
                <Tab icon={<Settings />} iconPosition="start" label={t('tab_config')} />
                <Tab icon={<History />} iconPosition="start" label={t('tab_audit')} />
            </Tabs>
        </Paper>

        {/* --- TAB 0: USERS --- */}
        {tab === 0 && (
            <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(15, 18, 29, 0.6)', 
                border: '1px solid rgba(212, 175, 55, 0.1)',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)'
                }}>
                <Box display="flex" justifyContent="space-between" mb={3}>
                    <TextField 
                        placeholder={t('search_placeholder')}
                        variant="outlined"
                        size="small"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{ 
                            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#D4AF37' }} /></InputAdornment>,
                            style: { color: 'white' }
                        }}
                        sx={{ width: 400, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}
                    />
                    <Chip label={`${t('total_label')}: ${users.length}`} color="primary" variant="outlined" />
                </Box>

                <Table sx={{ '& th': { borderColor: 'rgba(255,255,255,0.1)', color: '#D4AF37', fontWeight: 800 }, '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#DDD' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('table_user')}</TableCell>
                            <TableCell>{t('table_cpf')}</TableCell>
                            <TableCell>{t('table_balance')}</TableCell>
                            <TableCell>{t('table_ip')}</TableCell>
                            <TableCell>{t('status_label')}</TableCell>
                            <TableCell align="right">{t('table_actions')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((u) => (
                            <TableRow key={u.id} hover sx={{ bgcolor: u.is_banned ? 'rgba(244, 67, 54, 0.1)' : 'transparent' }}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{u.full_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                </TableCell>
                                <TableCell>{u.cpf}</TableCell>
                                <TableCell>
                                    <Box>
                                        <Chip size="small" label={`R$ ${u.wallet_balance}`} sx={{ mb: 0.5, bgcolor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', fontWeight: 'bold' }} />
                                        <br/>
                                        <Typography variant="caption" color="gray">{u.available_spins} Giros</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" fontFamily="monospace">{u.ip_address}</Typography>
                                </TableCell>
                                <TableCell>
                                    {u.is_banned ? (
                                        <Chip label={t('status_banned')} size="small" color="error" />
                                    ) : (
                                        <Chip label={t('status_active')} size="small" color="success" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <Box display="flex" justifyContent="flex-end" gap={1}>
                                        <Tooltip title="Adicionar Giros">
                                            <IconButton onClick={() => { setSelectedUser(u); setSpinsDialog(true); }} sx={{ color: '#4CAF50', bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                                                <Casino fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Banir IP">
                                            <IconButton onClick={() => handleBanIp(u.ip_address || '')} sx={{ color: '#FF9800', bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
                                                <PublicOff fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title={u.is_banned ? "Desbanir" : "Banir Usuário"}>
                                            <IconButton onClick={() => handleBanUser(u)} color={u.is_banned ? "success" : "error"} sx={{ bgcolor: u.is_banned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}>
                                                <Block fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        )}

        {/* --- TAB 1: PRIZES --- */}
        {tab === 1 && (
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Typography variant="h5" color="text.secondary">Configuração da Roleta</Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />} 
                        size="large"
                        onClick={() => setPrizeDialog(true)}
                        sx={{ fontWeight: 800, background: '#D4AF37', color: '#000' }}
                    >
                        {t('new_prize')}
                    </Button>
                </Box>
                
                <Grid container spacing={3}>
                    {prizes.map((prize) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={prize.id}>
                            <Paper sx={{ 
                                p: 3, 
                                bgcolor: 'rgba(15, 18, 29, 0.6)', 
                                border: `1px solid ${prize.active ? '#D4AF37' : '#333'}`,
                                borderRadius: 4,
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <Box sx={{ position: 'absolute', top: 0, left: 0, width: 6, height: '100%', bgcolor: prize.color }} />
                                
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Box sx={{ 
                                            width: 40, height: 40, 
                                            borderRadius: '50%', 
                                            bgcolor: prize.color, 
                                            border: '2px solid #FFF',
                                            boxShadow: `0 0 10px ${prize.color}` 
                                        }} />
                                        <TextField 
                                            variant="standard"
                                            value={prize.name}
                                            onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, name: e.target.value} : p))}
                                            InputProps={{ style: { color: '#FFF', fontWeight: 700, fontSize: '1.1rem' } }}
                                        />
                                    </Box>
                                    <IconButton color="error" onClick={() => handleDeletePrize(prize.id)}>
                                        <Delete />
                                    </IconButton>
                                </Box>
                                
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" color="text.secondary">{t('lbl_prob')} ({(prize.probability * 100).toFixed(1)}%)</Typography>
                                        <Slider 
                                            value={prize.probability} 
                                            max={1} 
                                            step={0.01} 
                                            onChange={(_, v) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, probability: v as number} : p))} 
                                            sx={{ color: '#D4AF37' }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <TextField 
                                            label={t('lbl_color')} 
                                            size="small" 
                                            value={prize.color} 
                                            fullWidth
                                            onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, color: e.target.value} : p))} 
                                            InputLabelProps={{ style: { color: '#888' } }}
                                            InputProps={{ style: { color: '#FFF' } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 6 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel sx={{ color: '#888' }}>Tipo</InputLabel>
                                            <Select
                                                value={prize.type}
                                                label="Tipo"
                                                onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, type: e.target.value as any} : p))}
                                                sx={{ color: '#FFF', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}
                                            >
                                                <MenuItem value="physical">Físico</MenuItem>
                                                <MenuItem value="money">Dinheiro</MenuItem>
                                                <MenuItem value="spins">Giros</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} pt={2} borderTop="1px solid rgba(255,255,255,0.05)">
                                    <FormControlLabel 
                                        control={
                                            <Switch 
                                                checked={prize.active} 
                                                onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, active: e.target.checked} : p))} 
                                                color="warning"
                                            />
                                        } 
                                        label={t('prize_active')} 
                                        sx={{ color: '#AAA' }}
                                    />
                                    <Button size="small" variant="contained" onClick={() => handleUpdatePrize(prize)}>
                                        {t('btn_save')}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        )}

        {/* --- TAB 2: AUDIT --- */}
        {tab === 2 && (
            <Paper sx={{ 
                p: 3, 
                bgcolor: 'rgba(15, 18, 29, 0.6)', 
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 4,
                backdropFilter: 'blur(10px)'
            }}>
                <Box mb={3}>
                    <Typography variant="h6" color="primary">Relatório de Atividades</Typography>
                    <Typography variant="body2" color="text.secondary">Registro completo de ações administrativas</Typography>
                </Box>

                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { borderColor: 'rgba(255,255,255,0.1)', color: '#D4AF37', fontWeight: 800 } }}>
                            <TableCell width="180">DATA / HORA</TableCell>
                            <TableCell width="200">ADMINISTRADOR</TableCell>
                            <TableCell width="200">AÇÃO</TableCell>
                            <TableCell>DETALHES</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#DDD' } }}>
                                <TableCell>
                                    <Typography variant="body2" color="white">{new Date(log.timestamp).toLocaleDateString()}</Typography>
                                    <Typography variant="caption" color="gray">{new Date(log.timestamp).toLocaleTimeString()}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Person fontSize="small" sx={{ color: '#555' }} />
                                        <Typography variant="body2">{log.admin_name}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={formatLogAction(log.action)} 
                                        size="small"
                                        sx={{ 
                                            bgcolor: log.action.includes('BAN') ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                            color: log.action.includes('BAN') ? '#f44336' : '#2196f3',
                                            fontWeight: 700
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" color="#BBB" sx={{ fontSize: '0.85rem' }}>
                                        {formatLogDetails(log.action, log.details, log.target)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        )}
        </Container>

        <Dialog open={spinsDialog} onClose={() => setSpinsDialog(false)}>
            <DialogTitle>Adicionar Giros</DialogTitle>
            <DialogContent>
                <Typography>Quantos giros adicionar para {selectedUser?.full_name}?</Typography>
                <TextField 
                    type="number" 
                    fullWidth 
                    value={spinsAmount} 
                    onChange={(e) => setSpinsAmount(parseInt(e.target.value))}
                    sx={{ mt: 2 }} 
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSpinsDialog(false)}>Cancelar</Button>
                <Button onClick={handleAddSpins} variant="contained">Confirmar</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={prizeDialog} onClose={() => setPrizeDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{newPrize.id ? 'Editar Prêmio' : 'Novo Prêmio'}</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={2} mt={1}>
                    <TextField label="Nome" value={newPrize.name} onChange={(e) => setNewPrize({...newPrize, name: e.target.value})} fullWidth />
                    <TextField label="Probabilidade (0-1)" type="number" value={newPrize.probability} onChange={(e) => setNewPrize({...newPrize, probability: parseFloat(e.target.value)})} fullWidth />
                    <TextField label="Cor" value={newPrize.color} onChange={(e) => setNewPrize({...newPrize, color: e.target.value})} fullWidth />
                    <TextField label="Valor" type="number" value={newPrize.value} onChange={(e) => setNewPrize({...newPrize, value: parseInt(e.target.value)})} fullWidth />
                    <FormControlLabel control={<Switch checked={newPrize.active} onChange={(e) => setNewPrize({...newPrize, active: e.target.checked})} />} label="Ativo" />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPrizeDialog(false)}>Cancelar</Button>
                <Button onClick={handleSavePrize} variant="contained">Salvar</Button>
            </DialogActions>
        </Dialog>

    </Box>
  );
};

export default Admin;