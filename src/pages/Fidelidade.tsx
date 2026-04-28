import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Star, 
  Gift, 
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronRight,
  Plus,
  X,
  CheckCircle2,
  Award,
  History,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Copy,
  ExternalLink,
  Edit2,
  Coffee,
  Scissors,
  Heart,
  Crown,
  Sparkles,
  RefreshCw,
  Trash2,
  Wrench,
  CheckCircle
} from 'lucide-react';
import { cn, getBaseUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useLoyalty, ClientWithLoyalty } from '../hooks/useLoyalty';
import { Client, Reward, LoyaltyTransaction } from '../types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Sub-components ---

const ClientLoyaltyDetailModal = ({ 
  client, 
  isOpen, 
  onClose,
  loyaltyTransactions,
  onUpdatePoints,
  onAddTransaction,
  onRecalculate
}: { 
  client: Client | null, 
  isOpen: boolean, 
  onClose: () => void,
  loyaltyTransactions: LoyaltyTransaction[],
  onUpdatePoints: (clientId: string, points: number) => void,
  onAddTransaction: (data: Omit<LoyaltyTransaction, 'id'>) => void,
  onRecalculate: (clientId: string) => Promise<void>
}) => {
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [newPoints, setNewPoints] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);

  React.useEffect(() => {
    if (client) {
      setNewPoints(client.points);
    }
  }, [client, isOpen]);

  if (!client || !isOpen) return null;

  const clientTransactions = loyaltyTransactions.filter(t => t.clientId === client.id);

  const pointsFromSpend = (client as any)?.loyaltyStats?.earnedPointsFromSpend || 0;
  const legacyFallbackSpend = (client as any)?.loyaltyStats?.totalSpent || 0;
  const displayTransactions = [...clientTransactions];
  
  if (pointsFromSpend > 0) {
    // Only display if the user actually spent money or was imported with a legacy value.
    displayTransactions.push({
      id: 'mock-earned-spend',
      clientId: client.id,
      description: `Pontos acumulados (R$ ${legacyFallbackSpend.toFixed(2)})`,
      points: pointsFromSpend,
      type: 'Ganho',
      date: (client as any)?.computedFirstVisit || client.createdAt || new Date().toISOString()
    } as any);
  }

  // Sorting strictly latest first
  displayTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tenureDays = (client as any).computedFirstVisit 
    ? differenceInDays(new Date(), new Date((client as any).computedFirstVisit))
    : differenceInDays(new Date(), new Date(client.createdAt || client.lastVisit || new Date()));
    
  const lastVisitDays = (client as any).computedLastVisit 
    ? differenceInDays(new Date(), parseISO((client as any).computedLastVisit))
    : (client.lastVisit ? differenceInDays(new Date(), parseISO(client.lastVisit)) : null);

  const handleUpdatePoints = () => {
    const diff = newPoints - client.points;
    if (diff !== 0) {
      onUpdatePoints(client.id, newPoints);
      onAddTransaction({
        clientId: client.id,
        points: Math.abs(diff),
        type: diff > 0 ? 'Ganho' : 'Resgate',
        description: 'Ajuste manual de pontos',
        date: new Date().toISOString()
      });
    }
    setIsEditingPoints(false);
  };

  const handleCopyLink = () => {
    const origin = window.location.origin;
    const url = `${origin}/loyalty/${client.id}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const origin = window.location.origin;
    const url = `${origin}/loyalty/${client.id}`;
    const text = `Olá ${client.name.split(' ')[0]}! Acesse seu Portal de Fidelidade Viking para ver seus pontos e resgatar prêmios:\n\n${url}`;
    
    if (client.phone) {
      const cleanPhone = client.phone.replace(/\D/g, '');
      const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-[70] p-8 overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold uppercase italic tracking-tight">Detalhes de Fidelidade</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Client Profile Summary */}
              <div className="flex flex-col gap-4 p-6 bg-white/5 rounded-[32px] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{client.name}</h3>
                    <p className="text-sm text-gray-500">{client.phone || client.email}</p>
                    <div className="mt-1">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                        (client as any).loyaltyStats?.level === 'Viking' ? "bg-primary text-white" :
                        (client as any).loyaltyStats?.level === 'Ouro' ? "bg-yellow-500/20 text-yellow-500" :
                        (client as any).loyaltyStats?.level === 'Prata' ? "bg-gray-400/20 text-gray-400" :
                        "bg-orange-900/20 text-orange-900"
                      )}>
                        {(client as any).loyaltyStats?.level || 'Bronze'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={handleCopyLink}
                    className={cn(
                      "flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5",
                      copySuccess ? "bg-success/20 text-success border-success/30" : "bg-black/40 text-white hover:bg-white/10"
                    )}
                  >
                    {copySuccess ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {copySuccess ? 'Copiado!' : 'Copiar Link'}
                    </span>
                  </button>
                  <button 
                    onClick={handleWhatsAppShare}
                    className="flex-1 p-3 rounded-xl transition-all flex items-center justify-center gap-2 bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/30"
                  >
                    <Share2 size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      WhatsApp
                    </span>
                  </button>
                </div>
              </div>

              {/* Loyalty Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2 relative group md:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saldo Atual</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-primary">{(client as any)?.loyaltyStats?.availablePoints}</p>
                  </div>
                </div>
                <div className="col-span-2 p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1 relative group md:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Gasto Total no Estúdio</p>
                  <div className="flex items-center justify-between">
                    <p className="text-3xl font-bold text-success">R$ {(client as any)?.loyaltyStats?.totalSpent?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tempo de Casa</p>
                  <p className="text-2xl font-bold">{tenureDays} dias</p>
                </div>
                <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Última Visita</p>
                  <p className="text-2xl font-bold">{lastVisitDays !== null ? `${lastVisitDays} dias` : 'N/A'}</p>
                </div>
              </div>

              {/* Transaction History */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase italic tracking-widest flex items-center gap-2">
                  <History size={16} className="text-primary" /> Histórico de Pontos
                </h4>
                <div className="space-y-3">
                  {displayTransactions.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 text-sm italic">Nenhuma transação encontrada.</p>
                  ) : (
                    displayTransactions.map(t => (
                      <div key={t.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl",
                            t.type === 'Ganho' ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          )}>
                            {t.type === 'Ganho' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{t.description}</p>
                            <p className="text-[10px] text-gray-500">{(() => {
                              try {
                                const d = parseISO(t.date);
                                if (isNaN(d.getTime())) return t.date;
                                return format(d, "dd 'de' MMMM, yyyy", { locale: ptBR });
                              } catch (e) {
                                return t.date;
                              }
                            })()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-bold",
                            t.type === 'Ganho' ? "text-success" : "text-destructive"
                          )}>
                            {t.type === 'Ganho' ? '+' : '-'}{t.points}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const RewardModal = ({ 
  reward, 
  isOpen, 
  onClose,
  onSave,
  onDelete
}: { 
  reward: Reward | null, 
  isOpen: boolean, 
  onClose: () => void,
  onSave: (data: Partial<Reward>) => void,
  onDelete: (id: string) => void
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Reward>>(
    reward || {
      title: '',
      points: 0,
      description: 'Serviço',
      icon: 'Gift'
    }
  );

  React.useEffect(() => {
    if (reward) {
      setFormData(reward);
    } else {
      setFormData({
        title: '',
        points: 0,
        description: 'Serviço',
        icon: 'Gift'
      });
    }
    setShowDeleteConfirm(false);
  }, [reward, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      points: Number(formData.points) || 0
    });
    onClose();
  };

  const handleDelete = () => {
    if (reward?.id) {
      onDelete(reward.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">{reward?.id ? 'Editar Recompensa' : 'Nova Recompensa'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Título da Recompensa</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Tatuagem Pequena Grátis" 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pontos Necessários</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    value={isNaN(formData.points as number) ? '' : formData.points}
                    onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Descrição</label>
                  <input 
                    type="text" 
                    required
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                    placeholder="Ex: Tatuagem de até 10cm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ícone</label>
                <div className="grid grid-cols-8 gap-2">
                  {[
                    { id: 'Gift', icon: Gift },
                    { id: 'Star', icon: Star },
                    { id: 'Award', icon: Award },
                    { id: 'Coffee', icon: Coffee },
                    { id: 'Scissors', icon: Scissors },
                    { id: 'Heart', icon: Heart },
                    { id: 'Crown', icon: Crown },
                    { id: 'Sparkles', icon: Sparkles }
                  ].map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: id })}
                      className={cn(
                        "p-3 rounded-xl flex items-center justify-center transition-colors",
                        formData.icon === id 
                          ? "bg-primary text-white" 
                          : "bg-black/40 border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon size={20} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button 
                  type="submit"
                  className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                >
                  Salvar Recompensa
                </button>
                
                {reward?.id && (
                  showDeleteConfirm ? (
                    <div className="space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                      <p className="text-xs font-bold text-destructive text-center uppercase tracking-widest">Confirmar exclusão?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button"
                          onClick={handleDelete}
                          className="py-2 bg-destructive text-white rounded-xl text-xs font-bold hover:bg-destructive/80 transition-colors"
                        >
                          Sim, Excluir
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Excluir Recompensa
                    </button>
                  )
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const LoyaltyModal = ({ 
  isOpen, 
  onClose,
  clients,
  rewards,
  onRedeem
}: { 
  isOpen: boolean, 
  onClose: () => void,
  clients: Client[],
  rewards: Reward[],
  onRedeem: (clientId: string, rewardId: string) => void
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const filteredClients = clients
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedReward = rewards.find(r => r.id === selectedRewardId);

  const canRedeem = selectedClient && selectedReward && selectedClient.points >= selectedReward.points;

  const handleRedeem = () => {
    if (canRedeem) {
      onRedeem(selectedClientId, selectedRewardId);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Resgatar Recompensa</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Client Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                
                {searchQuery && filteredClients.length > 0 && !selectedClientId && (
                  <div className="bg-black/40 border border-white/5 rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                    {filteredClients.map(client => (
                      <button 
                        key={client.id}
                        onClick={() => {
                          setSelectedClientId(client.id);
                          setSearchQuery(client.name);
                        }}
                        className="w-full p-4 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">{client.name}</span>
                          <span className="text-xs text-primary font-bold">{client.points} pts</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {selectedClientId && (
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-primary">{selectedClient?.name}</p>
                      <p className="text-xs text-primary/70">{selectedClient?.points} pontos disponíveis</p>
                    </div>
                    <button onClick={() => { setSelectedClientId(null); setSearchQuery(''); }} className="text-primary/70 hover:text-primary">
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Rewards Grid */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Escolha a Recompensa</label>
                <div className="grid grid-cols-1 gap-3">
                  {rewards.map(reward => {
                    const isAffordable = selectedClient ? selectedClient.points >= reward.points : true;
                    const Icon = {
                      Gift, Star, Award, Coffee, Scissors, Heart, Crown, Sparkles
                    }[reward.icon] || Gift;

                    return (
                      <button 
                        key={reward.id} 
                        disabled={!isAffordable}
                        onClick={() => setSelectedRewardId(reward.id)}
                        className={cn(
                          "flex items-center justify-between p-4 bg-white/5 border rounded-2xl transition-all group",
                          selectedRewardId === reward.id ? "border-primary bg-primary/10" : "border-white/5 hover:border-white/20",
                          !isAffordable && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-2 rounded-xl transition-colors",
                            selectedRewardId === reward.id ? "bg-primary text-white" : "bg-primary/20 text-primary"
                          )}>
                            <Icon size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">{reward.title}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{reward.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-bold",
                            selectedRewardId === reward.id ? "text-primary" : "text-primary/70"
                          )}>
                            {reward.points} pts
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={!canRedeem}
                  onClick={handleRedeem}
                  className={cn(
                    "w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all",
                    canRedeem ? "bg-primary shadow-primary/30 hover:scale-[1.02]" : "bg-gray-800 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Confirmar Resgate
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function Fidelidade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  
  const { 
    settings, 
    rewards: dataRewards, 
    clients: dataClients, 
    loyaltyTransactions,
    addReward, 
    updateReward, 
    deleteReward, 
    updateClient,
    addLoyaltyTransaction
  } = (useData as any)();
  
  const clientsWithLoyalty = useLoyalty() as ClientWithLoyalty[];

  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientWithLoyalty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (clientIdParam && clientsWithLoyalty.length > 0) {
      const client = clientsWithLoyalty.find((c: ClientWithLoyalty) => c.id === clientIdParam);
      if (client) {
        setSelectedClient(client);
        setIsDetailModalOpen(true);
      }
    }
  }, [clientIdParam, clientsWithLoyalty]);

  if (!settings.loyaltyActive) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center">
        <div className="p-6 bg-white/5 rounded-full text-gray-500">
          <Award size={64} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold uppercase italic">Programa de Fidelidade Desativado</h2>
          <p className="text-gray-500 max-w-md">Habilite o sistema de pontos nas configurações para começar a recompensar seus clientes.</p>
        </div>
        <button 
          onClick={() => navigate('/configuracoes')}
          className="px-8 py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_30px_rgba(139,92,246,0.3)]"
        >
          Ir para Configurações
        </button>
      </div>
    );
  }

  const filteredClients = clientsWithLoyalty
    .filter((c: ClientWithLoyalty) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSaveReward = (data: Partial<Reward>) => {
    if (selectedReward?.id) {
      updateReward(selectedReward.id, data);
    } else {
      addReward(data as Omit<Reward, 'id'>);
    }
    setIsRewardModalOpen(false);
  };

  const handleRedeem = (clientId: string, rewardId: string) => {
    const client = clientsWithLoyalty.find((c: ClientWithLoyalty) => c.id === clientId);
    const reward = dataRewards.find((r: Reward) => r.id === rewardId);

    if (client && reward && client.loyaltyStats.availablePoints >= reward.points) {
      // NOTE: We don't update client.points directly anymore since points are derived!
      // We ONLY add the redemption transaction.
      
      addLoyaltyTransaction({
        clientId,
        points: reward.points,
        type: 'Resgate',
        description: `Resgate: ${reward.title}`,
        date: new Date().toISOString()
      });

      console.log(`Recompensa "${reward.title}" resgatada com sucesso para ${client.name}!`);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-serif italic text-primary uppercase tracking-tighter">FIDELIDADE</h1>
          <p className="text-gray-500 text-sm font-medium">Recompense seus clientes mais fiéis</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => {
              setSelectedReward(null);
              setIsRewardModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm hover:bg-white/10 transition-colors"
          >
            <Plus size={20} /> Nova Recompensa
          </button>
          <button 
            onClick={() => setIsRedeemModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
          >
            <Gift size={20} /> Resgatar Pontos
          </button>
        </div>
      </div>

      {/* Rewards List */}
      <div className="bg-card border border-white/5 rounded-[40px] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold italic uppercase tracking-tight">Recompensas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {dataRewards.map(reward => {
            const Icon = {
              Gift, Star, Award, Coffee, Scissors, Heart, Crown, Sparkles
            }[reward.icon] || Gift;
            
            return (
              <div 
                key={reward.id} 
                onClick={() => {
                  setSelectedReward(reward);
                  setIsRewardModalOpen(true);
                }}
                className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-xl text-gray-500 group-hover:text-primary transition-colors">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{reward.title}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{reward.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{reward.points} pts</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-white/5 p-8 rounded-[40px] space-y-4">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="p-2 bg-white/5 rounded-xl"><Star size={20} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Pontos Distribuídos</span>
          </div>
          <p className="text-4xl font-bold">
            {dataClients.reduce((acc, c) => acc + c.points, 0).toLocaleString()}
          </p>
          <p className="text-xs text-success font-bold flex items-center gap-1">
            <TrendingUp size={14} /> +12% este mês
          </p>
        </div>

        <div className="bg-card border border-white/5 p-8 rounded-[40px] space-y-4">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="p-2 bg-white/5 rounded-xl"><Award size={20} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Clientes Engajados</span>
          </div>
          <p className="text-4xl font-bold">{dataClients.filter(c => c.points > 0).length}</p>
          <p className="text-xs text-gray-500 font-medium">
            {Math.round((dataClients.filter(c => c.points > 0).length / Math.max(dataClients.length, 1)) * 100)}% da base ativa
          </p>
        </div>

        <div className="bg-primary/10 border border-primary/20 p-8 rounded-[40px] space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <div className="p-2 bg-primary/20 rounded-xl"><Users size={20} /></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Top Cliente</span>
          </div>
          {dataClients.length > 0 ? (
            <>
              <p className="text-2xl font-bold truncate">{dataClients.sort((a, b) => b.points - a.points)[0].name}</p>
              <p className="text-sm text-primary font-bold">{dataClients.sort((a, b) => b.points - a.points)[0].points} pontos acumulados</p>
            </>
          ) : (
            <p className="text-gray-500 italic">Nenhum cliente</p>
          )}
        </div>
      </div>

      {/* Missing History Warning */}
      {dataClients.some(c => c.points > 0) && loyaltyTransactions.length === 0 && (
        <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 text-orange-500 rounded-2xl">
              <History size={24} />
            </div>
            <div>
              <p className="font-bold text-orange-500 uppercase tracking-tight">Histórico não encontrado</p>
              <p className="text-sm text-gray-500">A tabela de histórico de pontos ainda não foi criada no banco de dados. Os pontos estão sendo salvos, mas o histórico detalhado não aparecerá até que a tabela seja criada.</p>
            </div>
          </div>
          <div className="text-xs font-mono bg-black/40 p-3 rounded-xl border border-white/5 text-gray-400 max-w-xs overflow-hidden">
            SQL: CREATE TABLE loyalty_transactions (...)
          </div>
        </div>
      )}

      {/* Advanced Repair/Maintenance Row Removed */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* Clients Table */}
        <div className="bg-card border border-white/5 rounded-[40px] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-bold italic uppercase tracking-tight">Ranking de Pontos</h3>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs focus:border-primary/50 outline-none transition-colors"
              />
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {filteredClients.map((client: ClientWithLoyalty) => {
              const level = client.loyaltyStats?.level;
              return (
                <div 
                  key={client.id} 
                  onClick={() => {
                    setSelectedClient(client);
                    setIsDetailModalOpen(true);
                  }}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{client.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                          level === 'Viking' ? "bg-primary text-white" :
                          level === 'Ouro' ? "bg-yellow-500/20 text-yellow-500" :
                          level === 'Prata' ? "bg-gray-400/20 text-gray-400" :
                          "bg-orange-900/20 text-orange-900"
                        )}>
                          {level || 'Bronze'}
                        </span>
                        <span className="text-[10px] text-gray-500">Última visita: {client.lastVisit ? format(parseISO(client.lastVisit), "dd/MM/yyyy") : 'Nunca'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                    <div className="text-left md:text-right">
                      <p className="text-lg font-bold text-success">R$ {client.loyaltyStats?.totalSpent?.toFixed(2)}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Gasto Total ({client.loyaltyStats?.availablePoints} pts disponíveis)</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-600 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <LoyaltyModal 
        isOpen={isRedeemModalOpen} 
        onClose={() => setIsRedeemModalOpen(false)} 
        clients={clientsWithLoyalty}
        rewards={dataRewards}
        onRedeem={handleRedeem}
      />
      
      <RewardModal 
        isOpen={isRewardModalOpen} 
        onClose={() => setIsRewardModalOpen(false)} 
        reward={selectedReward}
        onSave={handleSaveReward}
        onDelete={deleteReward}
      />

      <ClientLoyaltyDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        client={selectedClient}
        loyaltyTransactions={loyaltyTransactions}
        onUpdatePoints={() => {}} // Disabled
        onAddTransaction={addLoyaltyTransaction}
        onRecalculate={async () => {}} // Disabled
      />
    </div>
  );
}
