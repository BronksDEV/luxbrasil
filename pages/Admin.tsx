import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tab, Box, Button, TextField, Grid, Slider, Switch, FormControlLabel, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment, Tooltip, Select, FormControl, InputLabel, MenuItem, CircularProgress, Alert, ToggleButton, ToggleButtonGroup, Avatar, Card, CardContent } from '@mui/material';
import { Search, Add, Delete, Block, Casino, PublicOff, Refresh, Group, History, Settings, Person, Diamond, SentimentDissatisfied, Save, ReceiptLong, CheckCircle, Cancel, WhatsApp, AssignmentInd, Cancel as CancelIcon } from '@mui/icons-material';
import { api } from '../services/api';
import { Prize, UserProfile, AdminRedemptionRequest } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface ChallengeProof {
    id: string;
    user_id: string;
    challenge_id: string;
    verification_proof: string;
    status: string;
    profiles: { full_name: string; email: string };
    challenges: { title: string; reward_xp: number; reward_money: number; reward_spins: number };
}

const Admin: React.FC = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [requests, setRequests] = useState<AdminRedemptionRequest[]>([]);
  const [requestFilter, setRequestFilter] = useState<string>('requested');
  const [logs, setLogs] = useState<any[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingProofs, setPendingProofs] = useState<ChallengeProof[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [spinsDialog, setSpinsDialog] = useState(false);
  const [spinsAmount, setSpinsAmount] = useState<number>(5);
  const [coinsDialog, setCoinsDialog] = useState(false);
  const [coinsAmount, setCoinsAmount] = useState<number>(100);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [prizeDialog, setPrizeDialog] = useState(false);
  const [newPrize, setNewPrize] = useState<Partial<Prize>>({ name: '', color: '#FFFFFF', probability: 0.05, type: 'physical', value: 0, active: true });

  const fetchData = async () => {
    setLoading(true);
    try {
        if(tab === 0) setRequests(await api.admin.getRedemptionRequests(requestFilter));
        if(tab === 1) setUsers(await api.admin.getUsers());
        if(tab === 2) setPrizes(await api.prizes.list());
        if(tab === 3) {
            const proofs = await api.admin.getPendingChallengeProofs() as any;
            console.log('🔍 Pending Proofs:', proofs);
            setPendingProofs(proofs);
        }
        if(tab === 4) setLogs(await api.admin.getAuditLogs());
    } catch (e) { 
        console.error("Erro ao buscar dados admin:", e); 
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [tab, requestFilter]);

  const isLossPrize = (p: Partial<Prize>) => { const name = p.name?.toLowerCase() || ''; return name.includes('não foi') || name.includes('tente') || name.includes('loss'); };
  const formatLogAction = (action: string) => { const map: any = { 'UPDATE_PRIZE': 'Edição de Prêmio', 'CREATE_PRIZE': 'Criação de Prêmio', 'DELETE_PRIZE': 'Exclusão de Prêmio', 'BAN_USER': 'Banimento de Usuário', 'UNBAN_USER': 'Desbloqueio de Usuário', 'ADD_SPINS': 'Crédito de Giros', 'ADD_COINS': 'Crédito de LuxCoins', 'BAN_IP': 'Bloqueio de IP', 'UPDATE_REDEMPTION': 'Status de Solicitação' }; return map[action] || action; };
  const formatLogDetails = (action: string, details: any, target: string) => { let d = details; if (typeof details === 'string') { try { d = JSON.parse(details); } catch(e) { d = {}; } } if (!d) d = {}; if (action === 'DELETE_PRIZE') return `ID: ${target}`; if (action.includes('PRIZE')) return `${target}`; return JSON.stringify(d); };

  const handleUpdateStatus = async (id: string, newStatus: string) => { if(!window.confirm(newStatus === 'redeemed' ? 'Confirmar pagamento?' : 'Recusar solicitação?')) return; setActionLoading(true); try { await api.admin.updateRedemptionStatus(id, newStatus); await fetchData(); } catch(e) { alert('Erro ao atualizar'); } finally { setActionLoading(false); } };
  const handleMissionValidation = async (id: string, approved: boolean) => { setProcessingId(id); try { await api.admin.validateChallenge(id, approved); alert(approved ? "Aprovado!" : "Rejeitado."); fetchData(); } catch (e: any) { alert(`Erro: ${e.message}`); } finally { setProcessingId(null); } };
  const handleAddSpins = async () => { if(selectedUser) { await api.admin.addSpins(selectedUser.id, spinsAmount); setSpinsDialog(false); fetchData(); alert(`Adicionado ${spinsAmount} giros`); } };
  const handleAddCoins = async () => { if(selectedUser) { await api.admin.addLuxCoins(selectedUser.id, coinsAmount); setCoinsDialog(false); fetchData(); alert(`Adicionado ${coinsAmount} coins`); } };
  const handleBanUser = async (user: UserProfile) => { if(window.confirm(`Tem certeza que deseja ${!user.is_banned ? 'BANIR' : 'DESBANIR'} ${user.full_name}?`)) { await api.admin.banUser(user.id, !user.is_banned); fetchData(); } };
  const handleBanIp = async (ip: string) => { if(window.confirm(`Bloquear IP ${ip}?`)) { await api.admin.banIp(ip); alert('IP Banido.'); } };
  const handleSavePrize = async () => { if(!newPrize.name || newPrize.probability === undefined) return alert('Preencha os campos'); setActionLoading(true); try { await api.prizes.create(newPrize as any); setPrizeDialog(false); setNewPrize({ name: '', color: '#FFFFFF', probability: 0.05, type: 'physical', value: 0, active: true }); await fetchData(); alert('Prêmio criado!'); } catch (e: any) { alert('Erro: ' + e.message); } finally { setActionLoading(false); } };
  const handleDeletePrize = async (id: string) => { if(window.confirm('Excluir prêmio?')) { setActionLoading(true); try { await api.prizes.delete(id); setPrizes(await api.prizes.list()); } catch (e: any) { alert('Erro: ' + e.message); } finally { setActionLoading(false); } } };
  const handleUpdatePrize = async (prize: Prize) => { setActionLoading(true); try { await api.prizes.update(prize); setPrizes(await api.prizes.list()); alert('Atualizado'); } catch(e) { alert('Erro'); } finally { setActionLoading(false); } };
  const handlePreset = (type: string) => { if(type === 'loss') setNewPrize({ ...newPrize, name: 'Não foi dessa vez', color: '#1A1A1A', type: 'money', value: 10, probability: 0.4 }); else if (type === 'gold') setNewPrize({ ...newPrize, name: 'Prêmio Gold', color: '#D4AF37', type: 'physical', value: 100, probability: 0.01 }); else if (type === 'silver') setNewPrize({ ...newPrize, name: 'Prêmio Silver', color: '#C0C0C0', type: 'physical', value: 50, probability: 0.05 }); };

  const filteredUsers = users.filter(u => u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.cpf?.includes(searchTerm));

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: '#050510', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <Box sx={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)', filter: 'blur(80px)' }} />
            <Box sx={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </Box>
        <Container maxWidth="xl" sx={{ py: 6, position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={6}>
            <Box><Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>{t('admin_panel')}</Typography><Typography variant="h3" sx={{ color: '#D4AF37', fontFamily: 'Montserrat', fontWeight: 900, textShadow: '0 0 30px rgba(212, 175, 55, 0.3)' }}>{t('admin_title')}</Typography></Box>
            <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData} disabled={loading}>{t('btn_update')}</Button>
        </Box>
        <Paper sx={{ mb: 4, bgcolor: 'rgba(15, 18, 29, 0.8)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" variant="scrollable" scrollButtons="auto" sx={{ '& .MuiTab-root': { py: 3, fontWeight: 700 } }}>
                <Tab icon={<ReceiptLong />} iconPosition="start" label="SOLICITAÇÕES" />
                <Tab icon={<Group />} iconPosition="start" label={t('tab_users')} />
                <Tab icon={<Settings />} iconPosition="start" label={t('tab_config')} />
                <Tab icon={<AssignmentInd />} iconPosition="start" label="APROVAÇÕES" />
                <Tab icon={<History />} iconPosition="start" label={t('tab_audit')} />
            </Tabs>
        </Paper>
        {loading && <Box display="flex" justifyContent="center" mb={4}><CircularProgress color="primary" /></Box>}

        {tab === 0 && (
            <Paper sx={{ p: 3, bgcolor: 'rgba(15, 18, 29, 0.6)', border: '1px solid rgba(212, 175, 55, 0.1)', boxShadow: '0 0 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', maxHeight: '75vh', overflow: 'auto' }}>
                <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" color="primary">Central de Resgates</Typography>
                    <ToggleButtonGroup value={requestFilter} exclusive onChange={(e, newFilter) => { if(newFilter) setRequestFilter(newFilter); }} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                        <ToggleButton value="requested" sx={{ color: 'white', '&.Mui-selected': { bgcolor: '#D4AF37', color: 'black' } }}>Pendentes</ToggleButton>
                        <ToggleButton value="redeemed" sx={{ color: 'white', '&.Mui-selected': { bgcolor: '#4CAF50', color: 'black' } }}>Pagos</ToggleButton>
                    </ToggleButtonGroup>
                </Box>
                <Table stickyHeader sx={{ '& th': { bgcolor: '#0F121D', borderColor: 'rgba(255,255,255,0.1)', color: '#D4AF37', fontWeight: 800 }, '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#DDD' } }}>
                    <TableHead><TableRow><TableCell>DATA</TableCell><TableCell>USUÁRIO</TableCell><TableCell>PRÊMIO</TableCell><TableCell>CÓDIGO</TableCell><TableCell>STATUS</TableCell><TableCell align="right">AÇÕES</TableCell></TableRow></TableHead>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req.id} hover sx={{ bgcolor: req.status === 'requested' ? 'rgba(33, 150, 243, 0.05)' : 'transparent' }}>
                                <TableCell><Typography variant="body2">{new Date(req.timestamp).toLocaleDateString()}</Typography><Typography variant="caption" color="gray">{new Date(req.timestamp).toLocaleTimeString()}</Typography></TableCell>
                                <TableCell><Box><Typography variant="body2" fontWeight="bold" color="#FFF">{req.user_details.full_name}</Typography><Typography variant="caption" display="block" color="gray">CPF: {req.user_details.cpf}</Typography><Box display="flex" alignItems="center" gap={0.5}><Typography variant="caption" color="gray">Tel: {req.user_details.phone}</Typography><IconButton size="small" onClick={() => window.open(`https://wa.me/55${req.user_details.phone}`, '_blank')} sx={{ p: 0.5, color: '#25D366' }}><WhatsApp fontSize="inherit" /></IconButton></Box></Box></TableCell>
                                <TableCell><Typography variant="body2" fontWeight="600" color="#D4AF37">{req.prize_name}</Typography><Typography variant="caption" color="gray">{req.prize_type === 'physical' ? 'Físico' : req.prize_type === 'money' ? `R$ ${req.prize_value}` : 'Giros'}</Typography></TableCell>
                                <TableCell><Chip label={req.redemption_code} size="small" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.1)', color: '#FFF' }} /></TableCell>
                                <TableCell><Chip label={t(`status_${req.status}`)} size="small" color={req.status === 'requested' ? 'info' : req.status === 'redeemed' ? 'success' : 'default'} variant="filled" sx={{ fontWeight: 'bold' }} /></TableCell>
                                <TableCell align="right"><Box display="flex" justifyContent="flex-end" gap={1}>{req.status === 'requested' && (<><Button size="small" variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => handleUpdateStatus(req.id, 'redeemed')} disabled={actionLoading}>Pagar</Button><Button size="small" variant="outlined" color="error" startIcon={<Cancel />} onClick={() => handleUpdateStatus(req.id, 'pending')} disabled={actionLoading}>Recusar</Button></>)}{req.status === 'redeemed' && (<Button size="small" variant="text" color="warning" onClick={() => handleUpdateStatus(req.id, 'requested')} disabled={actionLoading}>Reabrir</Button>)}</Box></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        )}

        {tab === 1 && (
            <Box>
                <Grid container spacing={2} mb={4}>
                    <Grid item xs={12} md={4}><Paper sx={{ p: 3, bgcolor: '#1a1a1a', border: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}><Typography color="text.secondary" variant="overline" fontWeight={700} letterSpacing={2}>TOTAL USUÁRIOS</Typography><Typography variant="h3" color="white" fontWeight={800}>{users.length}</Typography></Paper></Grid>
                    <Grid item xs={12} md={4}><Paper sx={{ p: 3, bgcolor: '#1a1a1a', border: '1px solid #D4AF37', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}><Typography color="primary" variant="overline" fontWeight={700} letterSpacing={2}>COINS EM CIRCULAÇÃO</Typography><Typography variant="h3" color="#D4AF37" fontWeight={800}>{users.reduce((acc, u) => acc + (u.lux_coins || 0), 0).toLocaleString()}</Typography></Paper></Grid>
                    <Grid item xs={12} md={4}><Paper sx={{ p: 3, bgcolor: '#1a1a1a', border: '1px solid #d32f2f', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 4 }}><Typography color="error" variant="overline" fontWeight={700} letterSpacing={2}>USUÁRIOS BANIDOS</Typography><Typography variant="h3" color="#ef5350" fontWeight={800}>{users.filter(u => u.is_banned).length}</Typography></Paper></Grid>
                </Grid>
                <Paper sx={{ p: 3, bgcolor: 'rgba(15, 18, 29, 0.6)', border: '1px solid rgba(212, 175, 55, 0.1)', boxShadow: '0 0 50px rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', maxHeight: '70vh', overflow: 'auto' }}>
                    <Box display="flex" justifyContent="space-between" mb={3}><TextField placeholder={t('search_placeholder')} variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#D4AF37' }} /></InputAdornment>, style: { color: 'white' } }} sx={{ width: 400, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }} /><Chip label={`${t('total_label')}: ${users.length}`} color="primary" variant="outlined" /></Box>
                    <Table stickyHeader sx={{ '& th': { bgcolor: '#0F121D', borderColor: 'rgba(255,255,255,0.1)', color: '#D4AF37', fontWeight: 800 }, '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#DDD' } }}>
                        <TableHead><TableRow><TableCell>{t('table_user')}</TableCell><TableCell>{t('table_cpf')}</TableCell><TableCell>{t('table_balance')}</TableCell><TableCell>{t('table_ip')}</TableCell><TableCell>{t('status_label')}</TableCell><TableCell align="right">{t('table_actions')}</TableCell></TableRow></TableHead>
                        <TableBody>
                            {filteredUsers.map((u) => (
                                <TableRow key={u.id} hover sx={{ bgcolor: u.is_banned ? 'rgba(244, 67, 54, 0.1)' : 'transparent' }}>
                                    <TableCell><Typography variant="body2" fontWeight="bold">{u.full_name}</Typography><Typography variant="caption" color="text.secondary">{u.email}</Typography></TableCell>
                                    <TableCell>{u.cpf}</TableCell>
                                    <TableCell><Box><Chip size="small" label={`LC ${u.lux_coins}`} sx={{ mb: 0.5, bgcolor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', fontWeight: 'bold' }} /><br/><Typography variant="caption" color="gray">{u.available_spins} Giros</Typography></Box></TableCell>
                                    <TableCell><Typography variant="body2" fontFamily="monospace">{u.ip_address}</Typography></TableCell>
                                    <TableCell>{u.is_banned ? <Chip label={t('status_banned')} size="small" color="error" /> : <Chip label={t('status_active')} size="small" color="success" variant="outlined" />}</TableCell>
                                    <TableCell align="right"><Box display="flex" justifyContent="flex-end" gap={1}><Tooltip title={t('admin_add_spins')} children={<IconButton onClick={() => { setSelectedUser(u); setSpinsDialog(true); }} sx={{ color: '#4CAF50', bgcolor: 'rgba(76, 175, 80, 0.1)' }}><Casino fontSize="small" /></IconButton>} /><Tooltip title={t('admin_add_coins')} children={<IconButton onClick={() => { setSelectedUser(u); setCoinsDialog(true); }} sx={{ color: '#D4AF37', bgcolor: 'rgba(212, 175, 55, 0.1)' }}><Diamond fontSize="small" /></IconButton>} /><Tooltip title="Banir IP" children={<IconButton onClick={() => handleBanIp(u.ip_address || '')} sx={{ color: '#FF9800', bgcolor: 'rgba(255, 152, 0, 0.1)' }}><PublicOff fontSize="small" /></IconButton>} /><Tooltip title={u.is_banned ? "Desbanir" : "Banir Usuário"} children={<IconButton onClick={() => handleBanUser(u)} color={u.is_banned ? "success" : "error"} sx={{ bgcolor: u.is_banned ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)' }}><Block fontSize="small" /></IconButton>} /></Box></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            </Box>
        )}

        {tab === 2 && (
            <Box>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#90CAF9' }}>Dica: Se um prêmio já saiu na roleta, você não conseguirá excluí-lo. Nesse caso, desative a opção <b>"Ativo na Roleta"</b>.</Alert>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}><Typography variant="h5" color="text.secondary">Configuração da Roleta</Typography><Button variant="contained" startIcon={<Add />} size="large" onClick={() => setPrizeDialog(true)} sx={{ fontWeight: 800, background: '#D4AF37', color: '#000' }}>{t('new_prize')}</Button></Box>
                <Grid container spacing={3}>
                    {prizes.map((prize) => {
                        const isLoss = isLossPrize(prize);
                        return (
                            <Grid item xs={12} md={6} lg={4} key={prize.id}>
                                <Paper sx={{ p: 3, bgcolor: isLoss ? 'rgba(10, 10, 10, 0.8)' : 'rgba(15, 18, 29, 0.6)', border: `1px solid ${isLoss ? '#333' : (prize.active ? '#D4AF37' : '#333')}`, borderRadius: 4, position: 'relative', overflow: 'hidden', opacity: prize.active ? 1 : 0.6 }}>
                                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: 6, height: '100%', bgcolor: prize.color }} />
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}><Box display="flex" alignItems="center" gap={2}><Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: prize.color, border: '2px solid #FFF', boxShadow: isLoss ? 'none' : `0 0 10px ${prize.color}` }} /><TextField variant="standard" value={prize.name} onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, name: e.target.value} : p))} InputProps={{ style: { color: '#FFF', fontWeight: 700, fontSize: '1.1rem' } }} /></Box><IconButton color="error" onClick={() => handleDeletePrize(prize.id)} title="Excluir Prêmio"><Delete /></IconButton></Box>
                                    <Grid container spacing={2} sx={{ mt: 1 }}><Grid item xs={12}><Typography variant="caption" color="text.secondary">{t('lbl_prob')} ({(prize.probability * 100).toFixed(1)}%)</Typography><Slider value={prize.probability} max={1} step={0.01} onChange={(_, v) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, probability: v as number} : p))} sx={{ color: isLoss ? '#888' : '#D4AF37' }} /></Grid><Grid item xs={6}><TextField label={t('lbl_color')} size="small" value={prize.color} fullWidth onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, color: e.target.value} : p))} InputLabelProps={{ style: { color: '#888' } }} InputProps={{ style: { color: '#FFF' } }} /></Grid><Grid item xs={6}><FormControl fullWidth size="small"><InputLabel sx={{ color: '#888' }}>Tipo</InputLabel><Select value={prize.type} label="Tipo" onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, type: e.target.value as any} : p))} sx={{ color: '#FFF', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}><MenuItem value="physical">Físico</MenuItem><MenuItem value="money">Dinheiro/LC</MenuItem><MenuItem value="spins">Giros</MenuItem></Select></FormControl></Grid></Grid>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} pt={2} borderTop="1px solid rgba(255,255,255,0.05)"><FormControlLabel control={<Switch checked={prize.active} onChange={(e) => setPrizes(prev => prev.map(p => p.id === prize.id ? {...p, active: e.target.checked} : p))} color="warning" />} label={t('prize_active')} sx={{ color: '#AAA' }} /><Button size="small" variant="contained" startIcon={<Save />} onClick={() => handleUpdatePrize(prize)} sx={{ bgcolor: isLoss ? '#555' : '#D4AF37', color: isLoss ? '#FFF' : '#000', fontWeight: 'bold' }}>{t('btn_save')}</Button></Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        )}

        {tab === 3 && (
            <Grid container spacing={2}>
              {pendingProofs.length === 0 ? (<Grid item xs={12}><Box p={8} textAlign="center" border="1px dashed #333" borderRadius={2}><Typography color="text.secondary">Nenhuma missão aguardando aprovação.</Typography></Box></Grid>) : (
                  pendingProofs.map((proof) => (
                      <Grid item xs={12} md={6} key={proof.id}>
                          <Paper sx={{ p: 3, bgcolor: '#111', border: '1px solid #333' }}>
                              <Box display="flex" justifyContent="space-between" mb={2}><Box display="flex" gap={2}><Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${proof.profiles?.full_name}`} /><Box><Typography color="white" fontWeight={700}>{proof.profiles?.full_name || 'Usuário Desconhecido'}</Typography><Typography color="gray" variant="caption">{proof.profiles?.email}</Typography></Box></Box><Chip label="PENDENTE" color="warning" size="small" /></Box>
                              <Typography color="#D4AF37" variant="subtitle2" gutterBottom>DESAFIO: {proof.challenges?.title || 'Erro ao carregar desafio'}</Typography>
                              <Box bgcolor="rgba(255,255,255,0.05)" p={2} borderRadius={2} mb={3}><Typography color="gray" variant="caption" display="block" mb={1}>PROVA ENVIADA:</Typography><Typography color="white" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>{proof.verification_proof}</Typography>{(proof.verification_proof.startsWith('http') && (proof.verification_proof.match(/\.(jpeg|jpg|gif|png)$/) != null)) && (<Box component="img" src={proof.verification_proof} sx={{ mt: 2, maxWidth: '100%', borderRadius: 1, maxHeight: 200 }} />)}</Box>
                              <Box display="flex" gap={2}><Button fullWidth variant="contained" color="success" startIcon={processingId === proof.id ? <CircularProgress size={20} /> : <CheckCircle />} onClick={() => handleMissionValidation(proof.id, true)} disabled={!!processingId}>APROVAR</Button><Button fullWidth variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleMissionValidation(proof.id, false)} disabled={!!processingId}>REJEITAR</Button></Box>
                              <Box mt={2} display="flex" gap={1} justifyContent="center"><Chip size="small" label={`+${proof.challenges?.reward_money || 0} LC`} sx={{ bgcolor: '#333', color: '#FFF' }} /><Chip size="small" label={`+${proof.challenges?.reward_spins || 0} GIROS`} sx={{ bgcolor: '#333', color: '#FFF' }} /><Chip size="small" label={`+${proof.challenges?.reward_xp || 0} XP`} sx={{ bgcolor: '#333', color: '#FFF' }} /></Box>
                          </Paper>
                      </Grid>
                  ))
              )}
          </Grid>
        )}

        {tab === 4 && (
            <Paper sx={{ p: 3, bgcolor: 'rgba(15, 18, 29, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, backdropFilter: 'blur(10px)' }}>
                <Box mb={3}><Typography variant="h6" color="primary">Relatório de Atividades</Typography><Typography variant="body2" color="text.secondary">Registro completo de ações administrativas</Typography></Box>
                <Table>
                    <TableHead><TableRow sx={{ '& th': { borderColor: 'rgba(255,255,255,0.1)', color: '#D4AF37', fontWeight: 800 } }}><TableCell width="180">DATA / HORA</TableCell><TableCell width="200">ADMINISTRADOR</TableCell><TableCell width="200">AÇÃO</TableCell><TableCell>DETALHES</TableCell></TableRow></TableHead>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)', color: '#DDD' } }}><TableCell><Typography variant="body2" color="white">{new Date(log.timestamp).toLocaleDateString()}</Typography><Typography variant="caption" color="gray">{new Date(log.timestamp).toLocaleTimeString()}</Typography></TableCell><TableCell><Box display="flex" alignItems="center" gap={1}><Person fontSize="small" sx={{ color: '#555' }} /><Typography variant="body2">{log.admin_name}</Typography></Box></TableCell><TableCell><Chip label={formatLogAction(log.action)} size="small" sx={{ bgcolor: log.action.includes('BAN') ? 'rgba(244, 67, 54, 0.1)' : 'rgba(33, 150, 243, 0.1)', color: log.action.includes('BAN') ? '#f44336' : '#2196f3', fontWeight: 600 }} /></TableCell><TableCell><Typography variant="body2" sx={{ color: '#AAA' }}>{formatLogDetails(log.action, log.details, log.target)}</Typography></TableCell></TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        )}

        <Dialog open={spinsDialog} onClose={() => setSpinsDialog(false)} PaperProps={{ sx: { bgcolor: '#1e1e1e', color: '#FFF' } }}><DialogTitle>{t('admin_add_spins')}</DialogTitle><DialogContent><Typography variant="body2" color="gray" mb={2}>Adicionando para: <b>{selectedUser?.full_name}</b></Typography><TextField label="Quantidade" type="number" fullWidth value={spinsAmount} onChange={(e) => setSpinsAmount(Number(e.target.value))} InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#888' } }} /></DialogContent><DialogActions><Button onClick={() => setSpinsDialog(false)}>{t('btn_cancel')}</Button><Button onClick={handleAddSpins} variant="contained" color="success">{t('confirm')}</Button></DialogActions></Dialog>
        <Dialog open={coinsDialog} onClose={() => setCoinsDialog(false)} PaperProps={{ sx: { bgcolor: '#1e1e1e', color: '#FFF' } }}><DialogTitle>{t('admin_add_coins')}</DialogTitle><DialogContent><Typography variant="body2" color="gray" mb={2}>Creditando para: <b>{selectedUser?.full_name}</b></Typography><TextField label={t('admin_coins_amount')} type="number" fullWidth value={coinsAmount} onChange={(e) => setCoinsAmount(Number(e.target.value))} InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#888' } }} /></DialogContent><DialogActions><Button onClick={() => setCoinsDialog(false)}>{t('btn_cancel')}</Button><Button onClick={handleAddCoins} variant="contained" sx={{ bgcolor: '#D4AF37', color: '#000', fontWeight: 'bold' }}>{t('confirm')}</Button></DialogActions></Dialog>
        <Dialog open={prizeDialog} onClose={() => setPrizeDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: isLossPrize(newPrize) ? '#111' : '#1e1e1e', color: '#FFF', border: isLossPrize(newPrize) ? '1px solid #333' : '1px solid #D4AF37' } }}>
            <DialogTitle sx={{ color: isLossPrize(newPrize) ? '#AAA' : '#D4AF37', fontWeight: 800 }}>{isLossPrize(newPrize) ? 'Novo Prêmio de Consolação' : t('new_prize')}</DialogTitle>
            <DialogContent>
                <Box display="flex" flexDirection="column" gap={3} mt={1}>
                    <Box display="flex" gap={1}><Button size="small" variant="outlined" startIcon={<SentimentDissatisfied />} sx={{ borderColor: '#555', color: '#AAA' }} onClick={() => handlePreset('loss')}>{t('admin_preset_loss')}</Button><Button size="small" variant="outlined" sx={{ color: '#D4AF37', borderColor: '#D4AF37' }} onClick={() => handlePreset('gold')}>{t('admin_preset_gold')}</Button><Button size="small" variant="outlined" sx={{ color: '#C0C0C0', borderColor: '#C0C0C0' }} onClick={() => handlePreset('silver')}>{t('admin_preset_silver')}</Button></Box>
                    <TextField label={t('lbl_prize_name')} fullWidth value={newPrize.name} onChange={(e) => setNewPrize({...newPrize, name: e.target.value})} InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#888' } }} />
                    <Grid container spacing={2}><Grid item xs={6}><FormControl fullWidth><InputLabel sx={{ color: '#888' }}>Tipo</InputLabel><Select value={newPrize.type} label="Tipo" onChange={(e) => setNewPrize({...newPrize, type: e.target.value as any})} sx={{ color: '#FFF', '.MuiOutlinedInput-notchedOutline': { borderColor: '#444' } }}><MenuItem value="physical">Físico</MenuItem><MenuItem value="money">Dinheiro/LC</MenuItem><MenuItem value="spins">Giros</MenuItem></Select></FormControl></Grid><Grid item xs={6}><TextField label={newPrize.type === 'physical' ? 'Valor Estimado (R$)' : 'Valor / Qtd'} type="number" fullWidth value={newPrize.value} onChange={(e) => setNewPrize({...newPrize, value: Number(e.target.value)})} InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#888' } }} /></Grid></Grid>
                    <Box><Typography gutterBottom color="gray">{t('lbl_prob')} ({(newPrize.probability! * 100).toFixed(1)}%)</Typography><Slider value={newPrize.probability} max={1} step={0.01} onChange={(_, v) => setNewPrize({...newPrize, probability: v as number})} sx={{ color: isLossPrize(newPrize) ? '#555' : '#D4AF37' }} /></Box>
                    <Box display="flex" gap={2} alignItems="center"><TextField label={t('lbl_color')} value={newPrize.color} onChange={(e) => setNewPrize({...newPrize, color: e.target.value})} sx={{ width: 150 }} InputProps={{ style: { color: '#FFF' } }} InputLabelProps={{ style: { color: '#888' } }} /><Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: newPrize.color, border: '1px solid #FFF' }} /></Box>
                </Box>
            </DialogContent>
            <DialogActions><Button onClick={() => setPrizeDialog(false)} disabled={actionLoading}>{t('btn_cancel')}</Button><Button onClick={handleSavePrize} variant="contained" disabled={actionLoading} sx={{ bgcolor: isLossPrize(newPrize) ? '#333' : '#D4AF37', color: isLossPrize(newPrize) ? '#FFF' : '#000', fontWeight: 'bold' }}>{actionLoading ? <CircularProgress size={24} /> : t('btn_save')}</Button></DialogActions>
        </Dialog>
        </Container>
    </Box>
  );
};

export default Admin;