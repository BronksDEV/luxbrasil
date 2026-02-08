import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, Box, Button, TextField, Switch, FormControlLabel, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Select, FormControl, InputLabel, MenuItem, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Card, CardContent, Grid, useMediaQuery, LinearProgress, Stack, Divider, Tooltip, Avatar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Search, Add, Delete, Block, Casino, Refresh, Diamond, Save, CheckCircle, MonetizationOn, Event, Close, Download, Edit, LocalOffer, Print, Person, History, Gavel, MoreVert, ExpandMore, FilterList, Group, Bolt, WhatsApp } from '@mui/icons-material';
import { api, supabase } from '../services/api';
import { Prize, UserProfile, AdminRedemptionRequest, SystemThemeConfig } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useThemeConfig } from '../contexts/ThemeContext';
import ProfileDialog from '../components/ProfileDialog';

interface ChallengeProof {
    id: string;
    user_id: string;
    challenge_id: string;
    verification_proof: string;
    status: string;
    profiles: { full_name: string; email: string };
    challenges: { title: string; reward_xp: number; reward_money: number; reward_spins: number };
}

// --- MOBILE COMPONENTS ---
const MobileCard: React.FC<{ children: React.ReactNode; actions?: React.ReactNode }> = ({ children, actions }) => (
    <Paper sx={{ 
        p: 2, mb: 2, 
        bgcolor: 'rgba(255,255,255,0.03)', 
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 3
    }}>
        <Box>{children}</Box>
        {actions && (
            <>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              <Box display="flex" gap={1} justifyContent="flex-end" flexWrap="wrap">
                  {actions}
              </Box>
            </>
        )}
    </Paper>
);

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { setThemeConfig: setGlobalThemeConfig, refreshTheme } = useThemeConfig();
  
  const [tab, setTab] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [requests, setRequests] = useState<AdminRedemptionRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<string>('requested');
  const [logs, setLogs] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingProofs, setPendingProofs] = useState<ChallengeProof[]>([]);
  
  // User Sorting
  const [sortByCoins, setSortByCoins] = useState(false);
  
  // State Local do formulário de tema
  const [localThemeConfig, setLocalThemeConfig] = useState<SystemThemeConfig>({ active: false, name: 'default' });

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [spinsDialog, setSpinsDialog] = useState(false);
  const [spinsAmount, setSpinsAmount] = useState<number>(5);
  const [coinsDialog, setCoinsDialog] = useState(false);
  const [coinsAmount, setCoinsAmount] = useState<number>(100);
  const [editUserDialog, setEditUserDialog] = useState(false);
  
  // PROOF MODAL STATE
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<ChallengeProof | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [prizeDialog, setPrizeDialog] = useState(false);
  const [newPrize, setNewPrize] = useState<Partial<Prize>>({ 
      name: '', color: '#FFFFFF', probability: 0.05, type: 'physical', value: 0, active: true, image_url: '', description: '' 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
        if(tab === 0) setRequests(await api.admin.getRedemptionRequests(requestFilter));
        if(tab === 1) setUsers(await api.admin.getUsers());
        if(tab === 2) setPrizes(await api.prizes.list());
        if(tab === 3) setPendingProofs(await api.admin.getPendingChallengeProofs() as any);
        if(tab === 4) setLogs(await api.admin.getAuditLogs());
        if(tab === 5) {
            const config = await api.admin.getThemeConfig();
            setLocalThemeConfig(config);
            setGlobalThemeConfig(config);
        }
    } catch (e) { console.error("Erro ao buscar dados admin:", e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab, requestFilter]);

  // --- REALTIME LISTENERS ---
  useEffect(() => {
      // Listener para aba de Usuários: Atualiza saldo/spins na tabela instantaneamente
      if (tab === 1) {
          const channel = supabase.channel('admin-users-live')
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                  const updatedProfile = payload.new;
                  setUsers((prevUsers) => prevUsers.map(u => {
                      if (u.id === updatedProfile.id) {
                          return {
                              ...u,
                              available_spins: updatedProfile.spins_remaining,
                              lux_coins: updatedProfile.wallet_balance,
                              wallet_balance: updatedProfile.wallet_balance,
                              is_banned: updatedProfile.banned,
                              xp: updatedProfile.xp
                          };
                      }
                      return u;
                  }));
              })
              .subscribe();
          return () => { supabase.removeChannel(channel); };
      }
      
      // Listener para aba de Validação: Remove da lista quando aprovado/rejeitado
      if (tab === 3) {
           const channel = supabase.channel('admin-proofs-live')
              .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_challenges' }, (payload) => {
                   // Se o status mudou de 'in_progress', remove da lista de pendentes
                   if (payload.new.status !== 'in_progress') {
                       setPendingProofs(prev => prev.filter(p => p.id !== payload.new.id));
                   }
                   // Se mudou para in_progress (novo envio), faz refetch para pegar os joins
                   if (payload.new.status === 'in_progress') {
                       // Pequeno delay para garantir que o join funcione
                       setTimeout(() => {
                           api.admin.getPendingChallengeProofs().then(data => setPendingProofs(data as any));
                       }, 500);
                   }
              })
              .subscribe();
           return () => { supabase.removeChannel(channel); };       
      }
  }, [tab]);

  // Derived state for Users
  const getFilteredUsers = () => {
      let filtered = users.filter(u => 
          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (sortByCoins) {
          filtered = [...filtered].sort((a, b) => (b.lux_coins || 0) - (a.lux_coins || 0));
      }
      
      return filtered;
  };

  const totalCoinsCirculation = users.reduce((acc, u) => acc + (u.lux_coins || 0), 0);

  const handleSaveTheme = async () => {
      setActionLoading(true);
      try {
          await api.admin.updateThemeConfig(localThemeConfig);
          await refreshTheme();
          alert("Configuração de tema salva e aplicada com sucesso!");
      } catch (e: any) {
          alert("Erro ao salvar tema: " + e.message);
      } finally {
          setActionLoading(false);
      }
  };

  const handleOpenProof = (proof: ChallengeProof) => {
      setSelectedProof(proof);
      setProofModalOpen(true);
  };

  const handleContactUser = (phone: string, name: string) => {
      if (!phone) return alert("Usuário sem telefone cadastrado.");
      // Limpa e formata o telefone
      const cleanPhone = phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      const message = `Olá ${name}! Somos da equipe Lux Brasil. Estamos entrando em contato sobre sua solicitação de prêmio.`;
      
      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleDownloadProof = async () => {
      if (!selectedProof) return;
      
      const proofStr = selectedProof.verification_proof || '';
      const imgMatch = proofStr.match(/IMG:\s*(https?:\/\/[^\s]+)/);
      const url = imgMatch ? imgMatch[1] : null;

      if (!url) {
          alert("Não há imagem para baixar.");
          return;
      }

      setIsDownloading(true);
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `proof-${selectedProof.user_id}-${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(blobUrl);
      } catch (e) {
          console.error("Download falhou", e);
          alert("Erro ao baixar. Tentando abrir em nova aba.");
          window.open(url, '_blank');
      } finally {
          setIsDownloading(false);
      }
  };

  const formatLogAction = (action: string) => { 
      const key = `log_action_${action.toLowerCase()}`;
      return t(key) !== key ? t(key) : action; 
  };
  const formatLogDetails = (action: string, details: any, target: string) => { let d = details; if (typeof details === 'string') { try { d = JSON.parse(details); } catch(e) { d = {}; } } if (!d) d = {}; if (action === 'DELETE_PRIZE') return `ID: ${target}`; if (action.includes('PRIZE')) return `${target}`; return JSON.stringify(d); };

  const handleUpdateStatus = async (id: string, newStatus: string) => { if(!window.confirm(newStatus === 'redeemed' ? t('admin_msg_confirm_payment') : t('admin_msg_refuse_request'))) return; setActionLoading(true); try { await api.admin.updateRedemptionStatus(id, newStatus); await fetchData(); } catch(e) { alert(t('error_generic')); } finally { setActionLoading(false); } };
  
  const handleMissionValidation = async (id: string, approved: boolean) => { 
      setProcessingId(id); 
      try { 
          await api.admin.validateChallenge(id, approved); 
          alert(approved ? t('admin_msg_approved') : t('admin_msg_rejected')); 
          setProofModalOpen(false); 
          // Não precisa chamar fetchData() aqui pois o Realtime atualizará a lista
      } catch (e: any) { 
          alert(`Erro: ${e.message}`); 
      } finally { 
          setProcessingId(null); 
      } 
  };
  
  const handleAddSpins = async () => { 
      if(selectedUser) { 
          await api.admin.addSpins(selectedUser.id, spinsAmount); 
          setSpinsDialog(false); 
          alert(t('admin_msg_added_spins', { amount: spinsAmount })); 
          // O Realtime atualizará a UI automaticamente
      } 
  };
  
  const handleAddCoins = async () => { 
      if(selectedUser) { 
          await api.admin.addLuxCoins(selectedUser.id, coinsAmount); 
          setCoinsDialog(false); 
          alert(t('admin_msg_added_coins', { amount: coinsAmount })); 
          // O Realtime atualizará a UI automaticamente
      } 
  };
  
  const handleBanUser = async (user: UserProfile) => { if(window.confirm(t('admin_msg_ban_confirm', { action: !user.is_banned ? t('admin_msg_ban') : t('admin_msg_unban'), name: user.full_name }))) { await api.admin.banUser(user.id, !user.is_banned); fetchData(); } };
  const handleBanIp = async (ip: string) => { if(window.confirm(t('admin_msg_ip_ban', { ip }))) { await api.admin.banIp(ip); alert('IP Banido.'); } };
  
  const handleSavePrize = async () => { 
      if(!newPrize.name || newPrize.probability === undefined) return alert(t('err_req')); 
      setActionLoading(true); 
      try { 
          if (newPrize.id) {
              await api.prizes.update(newPrize as Prize);
          } else {
              await api.prizes.create(newPrize as any); 
          }
          setPrizeDialog(false); 
          setNewPrize({ name: '', color: '#FFFFFF', probability: 0.05, type: 'physical', value: 0, active: true, image_url: '', description: '' }); 
          await fetchData(); 
          alert(newPrize.id ? 'Prêmio atualizado!' : t('admin_msg_prize_created')); 
      } catch (e: any) { 
          alert('Erro: ' + e.message); 
      } finally { 
          setActionLoading(false); 
      } 
  };

  const handleEditPrize = (prize: Prize) => {
      setNewPrize({ ...prize });
      setPrizeDialog(true);
  };

  const handleDeletePrize = async (id: string) => { if(window.confirm(t('admin_msg_prize_delete_confirm'))) { setActionLoading(true); try { await api.prizes.delete(id); setPrizes(await api.prizes.list()); } catch (e: any) { alert('Erro: ' + e.message); } finally { setActionLoading(false); } } };

  const handlePrintLabels = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;
    let html = `<html><head><title>Etiquetas</title><style>body{font-family:Arial;padding:20px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:15px}.label-card{border:2px solid #000;padding:15px;border-radius:8px}.label-name{text-transform:uppercase;font-weight:bold;font-size:16px;margin-bottom:5px}.label-info{font-size:14px;margin-bottom:3px}.label-prize{margin-top:10px;font-weight:bold;border-top:1px dashed #999;padding-top:5px;font-size:14px}@media print{@page{margin:0.5cm}.no-print{display:none}}</style></head><body><div class="no-print" style="margin-bottom:20px"><button onclick="window.print()" style="padding:10px 20px;font-size:16px;font-weight:bold;cursor:pointer">IMPRIMIR</button></div><div class="grid">`;
    requests.forEach(req => {
       html += `<div class="label-card"><div class="label-name">${req.user_details.full_name?.toUpperCase() || 'N/A'}</div><div class="label-info">CPF: ${req.user_details.cpf}</div><div class="label-info">TEL: ${req.user_details.phone}</div><div class="label-prize">PRÊMIO: ${req.prize_name}</div><div class="label-info" style="font-size:10px;margin-top:5px">Cod: ${req.redemption_code}</div></div>`;
    });
    html += `</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const getProbabilityColor = (prob: number) => {
      if (prob <= 0.05) return '#D4AF37';
      if (prob <= 0.15) return '#E040FB';
      if (prob <= 0.30) return '#2196F3';
      return '#888';
  };

  const getRarityLabel = (prob: number) => {
      if (prob <= 0.05) return 'LEGENDÁRIO';
      if (prob <= 0.15) return 'ÉPICO';
      if (prob <= 0.30) return 'RARO';
      return 'COMUM';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexDirection={isMobile ? 'column' : 'row'} gap={2}>
            <Box textAlign={isMobile ? 'center' : 'left'}>
                <Typography variant="overline" color="text.secondary">{t('admin_panel')}</Typography>
                <Typography variant="h4" fontWeight={800} color="#D4AF37">{t('admin_title')}</Typography>
            </Box>
            <Button startIcon={<Refresh />} onClick={fetchData} variant="outlined" fullWidth={isMobile}>{t('btn_update')}</Button>
        </Box>

        <Paper sx={{ mb: 4, bgcolor: '#0F121D', borderRadius: 3, overflow: 'hidden' }}>
            <Tabs 
                value={tab} 
                onChange={(_, v) => setTab(v)} 
                variant="scrollable" 
                scrollButtons="auto" 
                textColor="primary" 
                indicatorColor="primary"
                allowScrollButtonsMobile
                sx={{
                    '& .MuiTab-root': { fontWeight: 700, minHeight: 64 }
                }}
            >
                <Tab label={t('admin_central_requests')} icon={<LocalOffer sx={{ mb: 0.5 }} />} iconPosition="start" />
                <Tab label={t('tab_users')} icon={<Person sx={{ mb: 0.5 }} />} iconPosition="start" />
                <Tab label={t('tab_config')} icon={<Casino sx={{ mb: 0.5 }} />} iconPosition="start" />
                <Tab label={t('tab_validate')} icon={<CheckCircle sx={{ mb: 0.5 }} />} iconPosition="start" />
                <Tab label={t('tab_audit')} icon={<History sx={{ mb: 0.5 }} />} iconPosition="start" />
                <Tab label="EVENTOS / TEMAS" icon={<Event sx={{ mb: 0.5 }} />} iconPosition="start" />
            </Tabs>
        </Paper>

        {loading ? <Box display="flex" justifyContent="center" p={8}><CircularProgress color="primary" /></Box> : (
            <>
                {/* --- TAB 0: REQUESTS --- */}
                {tab === 0 && (
                    <Box>
                        <Box display="flex" gap={2} mb={2} justifyContent="space-between" flexWrap="wrap">
                            <ToggleButtonGroup value={requestFilter} exclusive onChange={(_, v) => v && setRequestFilter(v)} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                                <ToggleButton value="requested" sx={{ color: 'white' }}>{t('filter_pending')}</ToggleButton>
                                <ToggleButton value="redeemed" sx={{ color: 'white' }}>{t('filter_paid')}</ToggleButton>
                            </ToggleButtonGroup>
                            <Button variant="contained" startIcon={<Print />} onClick={handlePrintLabels} sx={{ bgcolor: '#FFF', color: '#000', fontWeight: 800 }}>{t('btn_print_labels')}</Button>
                        </Box>
                        
                        {isMobile ? (
                            <Box>
                                {requests.map(req => (
                                    <MobileCard 
                                        key={req.id}
                                        actions={
                                            <Box display="flex" gap={1} width="100%" justifyContent="flex-end">
                                                <Button size="small" variant="contained" color="success" startIcon={<WhatsApp />} onClick={() => handleContactUser(req.user_details.phone, req.user_details.full_name)}>Contato</Button>
                                                {req.status === 'requested' && (
                                                    <>
                                                        <Button size="small" variant="contained" color="primary" onClick={() => handleUpdateStatus(req.id, 'redeemed')}>{t('btn_pay')}</Button>
                                                        <Button size="small" variant="outlined" color="error" onClick={() => handleUpdateStatus(req.id, 'pending')}>{t('btn_refuse')}</Button>
                                                    </>
                                                )}
                                            </Box>
                                        }
                                    >
                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Typography variant="caption" color="text.secondary">{new Date(req.timestamp).toLocaleDateString()}</Typography>
                                            <Chip label={t(`status_${req.status}`)} color={req.status === 'redeemed' ? 'success' : 'warning'} size="small" />
                                        </Box>
                                        <Typography variant="subtitle1" fontWeight={700} color="white">{req.user_details.full_name}</Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>CPF: {req.user_details.cpf}</Typography>
                                        <Paper sx={{ p: 1, bgcolor: 'rgba(212, 175, 55, 0.1)', mt: 1, border: '1px dashed rgba(212,175,55,0.3)' }}>
                                            <Typography variant="body2" fontWeight={700} color="#D4AF37">{req.prize_name}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontFamily: 'monospace' }}>COD: {req.redemption_code}</Typography>
                                        </Paper>
                                    </MobileCard>
                                ))}
                                {requests.length === 0 && <Typography align="center" color="text.secondary" py={4}>{t('empty_requests')}</Typography>}
                            </Box>
                        ) : (
                            <Paper sx={{ width: '100%', overflow: 'hidden', bgcolor: '#0F121D' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>{t('header_date')}</TableCell>
                                            <TableCell>{t('header_user')}</TableCell>
                                            <TableCell>{t('header_prize')}</TableCell>
                                            <TableCell>{t('header_status')}</TableCell>
                                            <TableCell>{t('header_action')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {requests.map(req => (
                                            <TableRow key={req.id}>
                                                <TableCell sx={{ color: '#AAA' }}>{new Date(req.timestamp).toLocaleDateString()}</TableCell>
                                                <TableCell sx={{ color: 'white' }}>
                                                    {req.user_details.full_name}<br/>
                                                    <Typography variant="caption" color="text.secondary">{req.user_details.cpf} | {req.user_details.phone}</Typography>
                                                </TableCell>
                                                <TableCell sx={{ color: '#D4AF37' }}>{req.prize_name}</TableCell>
                                                <TableCell><Chip label={t(`status_${req.status}`)} color={req.status === 'redeemed' ? 'success' : 'warning'} size="small" /></TableCell>
                                                <TableCell>
                                                    <Box display="flex" gap={1}>
                                                        <Tooltip title="Contatar no WhatsApp">
                                                            <IconButton size="small" color="success" onClick={() => handleContactUser(req.user_details.phone, req.user_details.full_name)}>
                                                                <WhatsApp />
                                                            </IconButton>
                                                        </Tooltip>
                                                        {req.status === 'requested' && (
                                                            <>
                                                                <Button size="small" variant="contained" color="primary" onClick={() => handleUpdateStatus(req.id, 'redeemed')}>{t('btn_pay')}</Button>
                                                                <Button size="small" variant="outlined" color="error" onClick={() => handleUpdateStatus(req.id, 'pending')}>{t('btn_refuse')}</Button>
                                                            </>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {requests.length === 0 && <TableRow><TableCell colSpan={5} align="center">{t('empty_requests')}</TableCell></TableRow>}
                                    </TableBody>
                                </Table>
                            </Paper>
                        )}
                    </Box>
                )}

                {/* --- TAB 1: USERS (VISUAL GRID MODERNO) --- */}
                {tab === 1 && (
                    <Box>
                        {/* Stats Cards */}
                        <Grid container spacing={2} mb={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box p={1.5} borderRadius={3} bgcolor="rgba(33, 150, 243, 0.1)">
                                        <Group sx={{ color: '#2196F3' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={800} color="white">{users.length}</Typography>
                                        <Typography variant="caption" color="text.secondary">{t('stats_total_users')}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box p={1.5} borderRadius={3} bgcolor="rgba(212, 175, 55, 0.1)">
                                        <MonetizationOn sx={{ color: '#D4AF37' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" fontWeight={800} color="white">{totalCoinsCirculation}</Typography>
                                        <Typography variant="caption" color="text.secondary">{t('stats_coins_circulation')}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                         <Box display="flex" gap={2} mb={3}>
                            <TextField 
                                fullWidth 
                                placeholder={t('search_placeholder')} 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                                sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                            />
                            <Tooltip 
                                title={sortByCoins ? "Ordenado por Saldo (Maior)" : "Ordenar por Saldo"}
                                children={
                                    <Box component="div">
                                        <ToggleButton 
                                            value="check"
                                            selected={sortByCoins}
                                            onChange={() => setSortByCoins(!sortByCoins)}
                                            sx={{ 
                                                color: '#AAA', 
                                                '&.Mui-selected': { color: '#D4AF37', bgcolor: 'rgba(212,175,55,0.1)' } 
                                            }}
                                        >
                                            <FilterList />
                                        </ToggleButton>
                                    </Box>
                                }
                            />
                        </Box>
                        
                        {/* USER GRID CARDS */}
                        <Grid container spacing={2}>
                            {getFilteredUsers().map(u => (
                                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={u.id}>
                                    <Paper sx={{ 
                                        p: 2, 
                                        bgcolor: '#0F121D', 
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: 3,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: '#D4AF37',
                                            transform: 'translateY(-2px)'
                                        }
                                    }}>
                                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#AAA' }}>
                                                {u.full_name?.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box overflow="hidden">
                                                <Typography variant="subtitle2" fontWeight={700} color="white" noWrap>{u.full_name}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" noWrap>{u.email}</Typography>
                                            </Box>
                                            <IconButton 
                                                size="small" 
                                                sx={{ ml: 'auto', color: '#D4AF37' }} 
                                                onClick={() => { setSelectedUser(u); setEditUserDialog(true); }}
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box display="flex" justifyContent="space-between" mb={2} px={1}>
                                            <Box>
                                                <Typography variant="caption" color="#D4AF37" fontWeight={700}>SPINS: {u.available_spins}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="#2196F3" fontWeight={700}>COINS: {u.lux_coins}</Typography>
                                            </Box>
                                        </Box>

                                        <Box display="flex" gap={1}>
                                            <Button 
                                                fullWidth 
                                                variant="outlined" 
                                                startIcon={<Casino fontSize="small" />} 
                                                size="small"
                                                onClick={() => { setSelectedUser(u); setSpinsDialog(true); }}
                                                sx={{ fontSize: '0.7rem', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}
                                            >
                                                Add Spins
                                            </Button>
                                            <Button 
                                                fullWidth 
                                                variant="outlined" 
                                                startIcon={<MonetizationOn fontSize="small" />} 
                                                size="small"
                                                onClick={() => { setSelectedUser(u); setCoinsDialog(true); }}
                                                sx={{ fontSize: '0.7rem', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}
                                            >
                                                Add Coins
                                            </Button>
                                            <IconButton 
                                                size="small" 
                                                color={u.is_banned ? 'success' : 'error'} 
                                                onClick={() => handleBanUser(u)}
                                                sx={{ border: '1px solid rgba(255,255,255,0.1)' }}
                                            >
                                                {u.is_banned ? <CheckCircle fontSize="small" /> : <Block fontSize="small" />}
                                            </IconButton>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* --- TAB 2: PRIZES (CONFIG) --- */}
                {tab === 2 && (
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexDirection={isMobile ? 'column' : 'row'} gap={2}>
                            <Box textAlign={isMobile ? 'center' : 'left'}>
                                <Typography variant="h5" color="white" fontWeight={700}>Configuração da Roleta</Typography>
                                <Typography variant="body2" color="text.secondary">Gerencie os itens, probabilidades e pesos.</Typography>
                            </Box>
                            <Button 
                                startIcon={<Add />} 
                                variant="contained" 
                                onClick={() => { 
                                    setNewPrize({ name: '', color: '#FFFFFF', probability: 0.05, type: 'physical', value: 0, active: true, image_url: '', description: '' }); 
                                    setPrizeDialog(true); 
                                }} 
                                fullWidth={isMobile}
                                sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 800 }}
                            >
                                {t('new_prize')}
                            </Button>
                        </Box>

                        <Grid container spacing={3}>
                            {prizes.map(p => {
                                const percentage = (p.probability * 10).toFixed(1);
                                const rarityColor = getProbabilityColor(p.probability);
                                
                                return (
                                    <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={p.id}>
                                        <Card sx={{ 
                                            bgcolor: 'rgba(255,255,255,0.03)', 
                                            backdropFilter: 'blur(10px)',
                                            border: `1px solid ${p.active ? 'rgba(255,255,255,0.1)' : 'rgba(255,0,0,0.3)'}`,
                                            borderRadius: 4,
                                            position: 'relative',
                                            overflow: 'hidden',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateY(-5px)', borderColor: rarityColor }
                                        }}>
                                            <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 6, bgcolor: p.color }} />
                                            <CardContent sx={{ pl: 3 }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                                    <Chip 
                                                        label={getRarityLabel(p.probability)} 
                                                        size="small" 
                                                        sx={{ bgcolor: `${rarityColor}20`, color: rarityColor, fontWeight: 900, fontSize: '0.65rem', border: `1px solid ${rarityColor}40` }} 
                                                    />
                                                    <Chip 
                                                        label={p.active ? "ATIVO" : "INATIVO"} 
                                                        size="small" 
                                                        color={p.active ? "success" : "default"} 
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.2 }}>{p.name}</Typography>
                                                
                                                <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                    <LocalOffer sx={{ fontSize: 14, color: '#888' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Tipo: <span style={{ color: '#FFF' }}>{t(`type_${p.type}`)}</span>
                                                    </Typography>
                                                    {p.value > 0 && <Typography variant="body2" color="text.secondary">| Valor: {p.value}</Typography>}
                                                </Box>

                                                <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', p: 1.5, borderRadius: 2, mb: 2 }}>
                                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                        <Typography variant="caption" color="text.secondary">Chance de Drop</Typography>
                                                        <Typography variant="caption" color="white" fontWeight={700}>{percentage}%</Typography>
                                                    </Box>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={Math.min(p.probability * 10 * 10, 100)}
                                                        sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: rarityColor } }}
                                                    />
                                                </Box>

                                                <Box display="flex" justifyContent="flex-end" gap={1}>
                                                    <IconButton size="small" onClick={() => handleEditPrize(p)} sx={{ color: '#AAA', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { color: '#FFF' } }}><Edit fontSize="small" /></IconButton>
                                                    <IconButton size="small" onClick={() => handleDeletePrize(p.id)} disabled={actionLoading} sx={{ color: '#ff6666', bgcolor: 'rgba(255,0,0,0.1)', '&:hover': { bgcolor: 'rgba(255,0,0,0.2)' } }}><Delete fontSize="small" /></IconButton>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </Box>
                )}

                {/* --- TAB 3: PENDING PROOFS --- */}
                {tab === 3 && (
                    <Box>
                        {pendingProofs.length === 0 ? <Typography align="center" color="text.secondary" py={4}>{t('empty_proofs')}</Typography> : (
                            <Grid container spacing={2}>
                                {pendingProofs.map(p => (
                                    <Grid size={{ xs: 12, md: 6 }} key={p.id}>
                                        <Card sx={{ bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography variant="subtitle1" color="white" fontWeight={700}>{p.challenges.title}</Typography>
                                                    <Chip label="Pendente" color="warning" size="small" />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary" mb={2}>User: {p.profiles.full_name}</Typography>
                                                <Button variant="outlined" size="small" fullWidth onClick={() => handleOpenProof(p)}>{t('link_view_proof')}</Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                )}
                
                {/* --- TAB 4: AUDIT LOGS --- */}
                {tab === 4 && (
                    <Box>
                        <Typography variant="h6" mb={2} color="white">{t('audit_report')}</Typography>
                        {isMobile ? (
                            <Box>
                                {logs.map(log => (
                                    <MobileCard key={log.id}>
                                        <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleString()}</Typography>
                                        <Box display="flex" justifyContent="space-between" my={1}>
                                            <Typography variant="body2" color="#D4AF37" fontWeight={700}>{formatLogAction(log.action)}</Typography>
                                            <Typography variant="body2" color="white">{log.admin_name}</Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                                            Alvo: {log.target} | {formatLogDetails(log.action, log.details, log.target)}
                                        </Typography>
                                    </MobileCard>
                                ))}
                            </Box>
                        ) : (
                            <Paper sx={{ bgcolor: '#0F121D', overflow: 'hidden' }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Data</TableCell>
                                            <TableCell>Admin</TableCell>
                                            <TableCell>Ação</TableCell>
                                            <TableCell>Alvo</TableCell>
                                            <TableCell>Detalhes</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {logs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell sx={{ color: '#AAA' }}>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                                <TableCell sx={{ color: 'white' }}>{log.admin_name}</TableCell>
                                                <TableCell sx={{ color: '#D4AF37' }}>{formatLogAction(log.action)}</TableCell>
                                                <TableCell sx={{ color: 'white' }}>{log.target}</TableCell>
                                                <TableCell sx={{ color: '#AAA', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {formatLogDetails(log.action, log.details, log.target)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        )}
                    </Box>
                )}

                {/* --- TAB 5: THEMES --- */}
                {tab === 5 && (
                    <Box>
                        <Paper sx={{ p: { xs: 2, md: 4 }, bgcolor: '#0F121D', border: '1px solid rgba(212,175,55,0.2)' }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>Configuração de Temas & Eventos</Typography>
                            <FormControlLabel 
                                control={<Switch checked={localThemeConfig.active} onChange={(e) => setLocalThemeConfig({...localThemeConfig, active: e.target.checked})} color="warning" />} 
                                label={localThemeConfig.active ? "Tema Ativo" : "Tema Desativado"} 
                                sx={{ mb: 3, color: 'white' }}
                            />
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel children="Selecione o Tema" />
                                <Select value={localThemeConfig.name} onChange={(e) => setLocalThemeConfig({...localThemeConfig, name: e.target.value as any})} label="Selecione o Tema">
                                    <MenuItem value="default">Padrão (Nenhum)</MenuItem>
                                    <MenuItem value="carnival">Carnaval (Confete + Roxo/Verde)</MenuItem>
                                    <MenuItem value="custom">Customizado (Script/CSS)</MenuItem>
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={handleSaveTheme} disabled={actionLoading} fullWidth={isMobile} sx={{ mt: 2, bgcolor: '#D4AF37', color: '#000', fontWeight: 800 }}>Salvar Configuração</Button>
                        </Paper>
                    </Box>
                )}
            </>
        )}

        {/* --- DIALOGS --- */}
        <Dialog open={prizeDialog} onClose={() => setPrizeDialog(false)} fullWidth maxWidth="sm">
            <DialogTitle>{newPrize.id ? "Editar Prêmio" : t('new_prize')}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <TextField label={t('lbl_prize_name')} fullWidth value={newPrize.name} onChange={e => setNewPrize({...newPrize, name: e.target.value})} />
                <Box>
                    <Typography variant="caption" color="text.secondary">Probabilidade (0.1 = 1%, 1.0 = 10%)</Typography>
                    <TextField 
                        type="number" fullWidth value={newPrize.probability} 
                        onChange={e => setNewPrize({...newPrize, probability: parseFloat(e.target.value)})} 
                        inputProps={{ step: 0.01, min: 0, max: 1 }}
                    />
                </Box>
                <TextField label={t('lbl_color')} fullWidth value={newPrize.color} onChange={e => setNewPrize({...newPrize, color: e.target.value})} type="color" sx={{ input: { height: 50 } }} />
                <FormControl fullWidth>
                    <InputLabel children="Tipo" />
                    <Select value={newPrize.type} onChange={(e) => setNewPrize({...newPrize, type: e.target.value as any})}>
                        <MenuItem value="physical">{t('type_physical')}</MenuItem>
                        <MenuItem value="money">{t('type_money')}</MenuItem>
                        <MenuItem value="spins">{t('type_spins')}</MenuItem>
                    </Select>
                </FormControl>
                {newPrize.type !== 'physical' && (
                    <TextField label="Valor (Qtd)" type="number" fullWidth value={newPrize.value} onChange={e => setNewPrize({...newPrize, value: parseFloat(e.target.value)})} />
                )}
                <TextField label="URL da Imagem" fullWidth value={newPrize.image_url} onChange={e => setNewPrize({...newPrize, image_url: e.target.value})} />
                <TextField label="Descrição" fullWidth multiline rows={2} value={newPrize.description} onChange={e => setNewPrize({...newPrize, description: e.target.value})} />
                <FormControlLabel control={<Switch checked={newPrize.active} onChange={e => setNewPrize({...newPrize, active: e.target.checked})} />} label={t('prize_active')} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPrizeDialog(false)}>{t('btn_cancel')}</Button>
                <Button onClick={handleSavePrize} variant="contained" disabled={actionLoading}>{t('btn_save')}</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={spinsDialog} onClose={() => setSpinsDialog(false)}>
            <DialogTitle>{t('dialog_add_spins_title')}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body2" mb={2}>Usuário: <b>{selectedUser?.full_name}</b></Typography>
                <TextField label="Quantidade" type="number" fullWidth value={spinsAmount} onChange={e => setSpinsAmount(Number(e.target.value))} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setSpinsDialog(false)}>{t('btn_cancel')}</Button>
                <Button onClick={handleAddSpins} variant="contained">{t('btn_save')}</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={coinsDialog} onClose={() => setCoinsDialog(false)}>
            <DialogTitle>{t('dialog_add_coins_title')}</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Typography variant="body2" mb={2}>Usuário: <b>{selectedUser?.full_name}</b></Typography>
                <TextField label="Quantidade" type="number" fullWidth value={coinsAmount} onChange={e => setCoinsAmount(Number(e.target.value))} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setCoinsDialog(false)}>{t('btn_cancel')}</Button>
                <Button onClick={handleAddCoins} variant="contained">{t('btn_save')}</Button>
            </DialogActions>
        </Dialog>

        <Dialog open={proofModalOpen} onClose={() => setProofModalOpen(false)} fullWidth maxWidth="md">
            <DialogTitle>Análise de Comprovante</DialogTitle>
            <DialogContent dividers>
                {selectedProof && (
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary">Usuário</Typography>
                            <Typography variant="body1" gutterBottom>{selectedProof.profiles?.full_name} ({selectedProof.profiles?.email})</Typography>
                            
                            <Typography variant="subtitle2" color="text.secondary" mt={2}>Desafio</Typography>
                            <Typography variant="body1" gutterBottom>{selectedProof.challenges?.title}</Typography>
                            
                            <Typography variant="subtitle2" color="text.secondary" mt={2}>Mensagem / Contexto</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.2)', mt: 1 }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                    {selectedProof.verification_proof?.split('||')[0]?.replace('CTX:', '').trim()}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" color="text.secondary" mb={1}>Comprovante Visual</Typography>
                            <Box sx={{ 
                                width: '100%', height: 300, 
                                bgcolor: '#000', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: 2, overflow: 'hidden', border: '1px solid #333'
                            }}>
                                {selectedProof.verification_proof?.includes('IMG:') ? (
                                    <img 
                                        src={selectedProof.verification_proof.match(/IMG:\s*(https?:\/\/[^\s]+)/)?.[1]} 
                                        alt="Proof" 
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                    />
                                ) : (
                                    <Typography color="error">Sem imagem</Typography>
                                )}
                            </Box>
                            <Box display="flex" justifyContent="center" mt={2}>
                                <Button startIcon={isDownloading ? <CircularProgress size={16} /> : <Download />} onClick={handleDownloadProof} disabled={isDownloading}>
                                    Baixar Imagem
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setProofModalOpen(false)} color="inherit">Cancelar</Button>
                <Button 
                    onClick={() => selectedProof && handleMissionValidation(selectedProof.id, false)} 
                    color="error" 
                    disabled={!!processingId}
                >
                    Rejeitar
                </Button>
                <Button 
                    onClick={() => selectedProof && handleMissionValidation(selectedProof.id, true)} 
                    variant="contained" 
                    color="success"
                    disabled={!!processingId}
                >
                    {processingId === selectedProof?.id ? 'Processando...' : 'Aprovar'}
                </Button>
            </DialogActions>
        </Dialog>

        {selectedUser && (
            <ProfileDialog 
                open={editUserDialog} 
                onClose={() => setEditUserDialog(false)} 
                user={selectedUser} 
                isAdminMode 
                onSuccess={fetchData}
            />
        )}

    </Container>
  );
};

export default Admin;