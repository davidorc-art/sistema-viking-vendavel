import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  MoreVertical, 
  Filter,
  ChevronRight,
  MessageCircle,
  History,
  CreditCard,
  Star,
  Trash2,
  Edit3,
  X,
  Instagram,
  MapPin,
  Stethoscope,
  UserPlus,
  Sparkles,
  Loader2,
  Link as LinkIcon,
  Copy,
  Check,
  FileText,
  Wand2,
  Share2,
  CheckCircle,
  ShieldCheck,
  Signature as SignatureIcon
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn, getBaseUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Client } from '../types';
import { toast } from 'sonner';
import { openWhatsApp } from '../utils/whatsapp';

// --- Sub-components ---

const ClientModal = ({ 
  client, 
  isOpen, 
  onClose,
  onDelete,
  onSave
}: { 
  client: Client | null, 
  isOpen: boolean, 
  onClose: () => void,
  onDelete: (id: string) => void,
  onSave: (client: Partial<Client>) => void
}) => {
  const navigate = useNavigate();
  const { clients, professionals, consentForms, appointments, updateClient, addLoyaltyTransaction, loyaltyTransactions } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLinkGenerator, setShowLinkGenerator] = useState(false);
  const [showPointsManager, setShowPointsManager] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [activeTab, setActiveTab] = useState<'manual' | 'ai'>('manual');
  const [aiText, setAiText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const referrerMatch = React.useMemo(() => {
    const value = (formData.indicatedBy || '').trim();
    if (value.length < 3) return null;
    const ignored = ['ninguem', 'ninguém', 'nao', 'não', 'ngm', 'sem indicacao', 'sem indicação'];
    if (ignored.includes(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return null;
    const searchUpper = value.toUpperCase();
    const searchPhone = value.replace(/\D/g, '');
    return clients.find(c => {
      if (value.length >= 6 && c.id.substring(0, 6).toUpperCase() === searchUpper) return true;
      if (c.name.toUpperCase() === searchUpper) return true;
      if (searchPhone.length >= 10 && c.phone.replace(/\D/g, '') === searchPhone) return true;
      return false;
    });
  }, [formData.indicatedBy, clients]);

  React.useEffect(() => {
    if (referrerMatch && formData.indicatedBy !== referrerMatch.name) {
      const val = (formData.indicatedBy || '').trim();
      const isCode = val.length === 6 && referrerMatch.id.toUpperCase().startsWith(val.toUpperCase());
      const isPhone = val.replace(/\D/g, '').length >= 10;
      if (isCode || isPhone) {
        setFormData(prev => ({ ...prev, indicatedBy: referrerMatch.name }));
      }
    }
  }, [referrerMatch]);

  // Points adjustment state
  const [pointsAdjustment, setPointsAdjustment] = useState({
    amount: 0,
    description: 'Ajuste manual'
  });

  // Find all signed terms for this client
  const clientTerms = client ? consentForms
    .filter(cf => cf.clientId === client.id)
    .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime()) : [];

  // Find appointments pending signature
  const pendingSignatureAppointments = client ? appointments
    .filter(a => a.clientId === client.id && !a.consentSigned && a.status !== 'Cancelado' && a.status !== 'Falta')
    .sort((a, b) => new Date(`${b.date}T${b.time}:00`).getTime() - new Date(`${a.date}T${a.time}:00`).getTime()) : [];

  // Link Generator State
  const [linkConfig, setLinkConfig] = useState({
    professionalId: '',
    service: '',
    value: 0,
    duration: 60,
    depositPercentage: 50
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'Ativo',
        points: 0,
        totalSpent: 0,
        level: 'Bronze',
        birthDate: '',
        instagram: '',
        city: '',
        medicalNotes: '',
        indicatedBy: '',
        isMinor: false,
        notes: ''
      });
    }
    setIsEditing(!client);
    setShowDeleteConfirm(false);
    setShowLinkGenerator(false);
    setShowPointsManager(false);
    setGeneratedLink('');
    setCopied(false);
    setActiveTab('manual');
    setAiText('');
    setPointsAdjustment({ amount: 0, description: 'Ajuste manual' });
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleGenerateLink = () => {
    if (!client) return;
    if (!linkConfig.professionalId) {
      toast.error('Por favor, selecione um profissional para gerar o link.');
      return;
    }
    const baseUrl = getBaseUrl();
    const params = new URLSearchParams({
      clientId: client.id,
      profId: linkConfig.professionalId,
      service: linkConfig.service,
      totalValue: linkConfig.value.toString(),
      duration: linkConfig.duration.toString(),
      depositPercentage: linkConfig.depositPercentage?.toString() || '50'
    });
    const link = `${baseUrl}/booking?${params.toString()}`;
    setGeneratedLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    if (!client) return;
    const message = `Olá ${client.name}! Preparei um link especial para você agendar seu próximo horário conosco: ${generatedLink}`;
    openWhatsApp(client.phone, message);
  };

  const handleSmartProcess = async () => {
    if (!aiText.trim()) return;
    setIsAiProcessing(true);
    
    try {
      const apiKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) || 
                     (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || '';
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extraia as informações do seguinte texto de cliente e retorne em formato JSON. 
        Texto: "${aiText}"
        Campos: name, phone, email, cpf, instagram, birthDate (YYYY-MM-DD), city, medicalNotes, indicatedBy.
        Se não encontrar algum campo, deixe vazio.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              cpf: { type: Type.STRING },
              instagram: { type: Type.STRING },
              birthDate: { type: Type.STRING },
              city: { type: Type.STRING },
              medicalNotes: { type: Type.STRING },
              indicatedBy: { type: Type.STRING }
            }
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        phone: data.phone || prev.phone,
        email: data.email || prev.email,
        cpf: data.cpf || prev.cpf,
        instagram: data.instagram || prev.instagram,
        birthDate: data.birthDate || prev.birthDate,
        city: data.city || prev.city,
        medicalNotes: data.medicalNotes || prev.medicalNotes,
        indicatedBy: data.indicatedBy || prev.indicatedBy
      }));

      toast.success('Informações extraídas com sucesso!');
      setAiText('');
    } catch (error) {
      console.error('Erro no processamento inteligente:', error);
      // Fallback to basic extraction
      const text = aiText;
      const result: Partial<Client> = {};
      const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
      if (emailMatch) result.email = emailMatch[1].toLowerCase();
      
      setFormData(prev => ({ ...prev, ...result }));
      toast.info('Processamento básico concluído (IA indisponível).');
    } finally {
      setIsAiProcessing(false);
    }
  };

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const validateName = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 && parts.every(p => p.length >= 2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateName(formData.name || '')) {
      toast.error('Por favor, preencha nome e sobrenome (mínimo 2 letras cada).');
      return;
    }

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
      toast.error('Por favor, preencha um telefone válido com DDD.');
      return;
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast.error('CPF informado é inválido.');
      return;
    }

    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        toast.error('Data de nascimento não pode ser no futuro.');
        return;
      }
    }

    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (client?.id) {
      onDelete(client.id);
      onClose();
    }
  };

  const handleNewAppointment = () => {
    // Redirect to agenda with client info
    navigate(`/agenda?clientId=${client?.id}&action=new`);
    onClose();
  };

  const handleAdjustPoints = async () => {
    if (!client || pointsAdjustment.amount === 0) return;

    const newPoints = (client.points || 0) + pointsAdjustment.amount;
    
    try {
      await updateClient(client.id, { points: newPoints });
      await addLoyaltyTransaction({
        clientId: client.id,
        points: Math.abs(pointsAdjustment.amount),
        type: pointsAdjustment.amount > 0 ? 'Ganho' : 'Resgate',
        description: pointsAdjustment.description,
        date: new Date().toISOString()
      });
      
      setPointsAdjustment({ amount: 0, description: 'Ajuste manual' });
      setShowPointsManager(false);
    } catch (error) {
      console.error('Erro ao ajustar pontos:', error);
    }
  };

  const clientLoyaltyHistory = client ? loyaltyTransactions
    .filter(lt => lt.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

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
              <h2 className="text-xl font-bold">{client ? (isEditing ? 'Editar Cliente' : 'Perfil do Cliente') : 'Novo Cliente'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                {!client && (
                  <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-6">
                    <button 
                      onClick={() => setActiveTab('manual')}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                        activeTab === 'manual' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-white"
                      )}
                    >
                      Cadastro Manual
                    </button>
                    <button 
                      onClick={() => setActiveTab('ai')}
                      className={cn(
                        "flex-1 py-2 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                        activeTab === 'ai' ? "bg-primary text-white shadow-lg" : "text-gray-500 hover:text-white"
                      )}
                    >
                      <Wand2 size={14} /> Extração Inteligente
                    </button>
                  </div>
                )}

                {activeTab === 'ai' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Cole o texto aqui</label>
                      <textarea 
                        value={aiText}
                        onChange={e => setAiText(e.target.value)}
                        placeholder="Ex: João Silva, mora em São Paulo, insta @joaosilva, nasceu em 15/05/1990..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 h-40 resize-none"
                      />
                    </div>
                    <button 
                      onClick={handleSmartProcess}
                      disabled={isAiProcessing || !aiText.trim()}
                      className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                      {isAiProcessing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Processando...
                        </>
                      ) : (
                        <>
                          <Wand2 size={18} /> Identificar Informações
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nome Completo *</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            type="text"
                            required
                            placeholder="Ex: João Silva"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Telefone</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                              type="tel"
                              placeholder="(00) 00000-0000"
                              value={formData.phone || ''}
                              onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">CPF</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                              type="text"
                              placeholder="000.000.000-00"
                              value={formData.cpf || ''}
                              onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Instagram</label>
                        <div className="relative">
                          <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            type="text"
                            placeholder="@usuario"
                            value={formData.instagram || ''}
                            onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Cidade</label>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                              type="text"
                              placeholder="Cidade - UF"
                              value={formData.city || ''}
                              onChange={e => setFormData({ ...formData, city: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Data de Nascimento</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                              type="date"
                              value={formData.birthDate || ''}
                              onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 [color-scheme:dark]"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Indicado Por</label>
                        <div className="relative">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            type="text"
                            placeholder="Nome, telefone ou código de quem te indicou"
                            value={formData.indicatedBy || ''}
                            onChange={e => setFormData({ ...formData, indicatedBy: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        {referrerMatch && (
                          <p className="text-xs text-success ml-2 mt-1.5 flex items-center gap-1 font-bold">
                            <CheckCircle size={14} /> Vinculado a: <strong className="text-white">{referrerMatch.name}</strong>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Observações Médicas</label>
                        <div className="relative">
                          <Stethoscope className="absolute left-4 top-4 text-gray-500" size={16} />
                          <textarea 
                            placeholder="Alergias, condições, etc."
                            value={formData.medicalNotes || ''}
                            onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 h-24 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <input 
                          type="checkbox"
                          id="isMinor"
                          checked={formData.isMinor || false}
                          onChange={e => setFormData({ ...formData, isMinor: e.target.checked })}
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                        />
                        <label htmlFor="isMinor" className="text-xs font-bold uppercase tracking-widest text-gray-400 cursor-pointer">
                          Este cliente é menor de idade?
                        </label>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Observações Gerais</label>
                        <textarea 
                          placeholder="Outras informações relevantes..."
                          value={formData.notes || ''}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 h-24 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">E-mail</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            type="email"
                            placeholder="email@exemplo.com"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Status</label>
                        <select 
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Inadimplente">Inadimplente</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={() => client ? setIsEditing(false) : onClose()}
                        className="flex-1 py-3 bg-white/5 border border-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-primary rounded-xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
                      >
                        {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto border-4 border-white/5">
                    <User size={48} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{client?.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        client?.status === 'Ativo' ? "bg-success/20 text-success" :
                        client?.status === 'Inadimplente' ? "bg-destructive/20 text-destructive" :
                        "bg-white/10 text-gray-400"
                      )}>
                        {client?.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Gasto</p>
                    <p className="text-xl font-bold text-success">R$ {client?.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setShowPointsManager(true)}>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 flex justify-between items-center">
                      Pontos Fidelidade
                      <Edit3 size={10} className="text-primary" />
                    </p>
                    <p className="text-xl font-bold text-primary">{client?.points || 0} pts</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Informações de Contato</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                      <Phone size={18} className="text-primary" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Telefone</p>
                        <p className="text-sm font-medium">{client?.phone}</p>
                      </div>
                      <button onClick={() => openWhatsApp(client?.phone || '')} className="p-2 bg-success/20 text-success rounded-xl">
                        <MessageCircle size={18} />
                      </button>
                    </div>
                    {client?.cpf && (
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                        <CreditCard size={18} className="text-primary" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">CPF</p>
                          <p className="text-sm font-medium">{client?.cpf}</p>
                        </div>
                      </div>
                    )}
                    {client?.instagram && (
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                        <Instagram size={18} className="text-primary" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500">Instagram</p>
                          <p className="text-sm font-medium">{client?.instagram}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                      <Mail size={18} className="text-primary" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">E-mail</p>
                        <p className="text-sm font-medium">{client?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                {(client?.birthDate || client?.city || client?.indicatedBy || client?.medicalNotes || clientTerms.length > 0) && (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Detalhes Adicionais</p>
                    <div className="grid grid-cols-1 gap-3">
                      {client?.birthDate && !isNaN(new Date(client.birthDate).getTime()) && (
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                          <Calendar size={18} className="text-primary" />
                          <div>
                            <p className="text-xs text-gray-500">Nascimento</p>
                            <p className="text-sm font-medium">{new Date(client.birthDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* History of Signed Terms */}
                      {pendingSignatureAppointments.length > 0 && (
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={14} /> Aguardando Assinatura ({pendingSignatureAppointments.length})
                          </p>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {pendingSignatureAppointments.map(appt => (
                              <div key={appt.id} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold">{appt.service}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(appt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {appt.time}</p>
                                  </div>
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase">
                                    Pendente
                                  </span>
                                </div>
                                <button 
                                  onClick={() => {
                                    const type = appt.service.toLowerCase().includes('piercing') ? 'Piercing' : 'Tattoo';
                                    window.open(`/consent/${appt.id}?type=${type}`, '_blank');
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-[0_4px_10px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                                >
                                  <SignatureIcon size={14} /> Assinar Agora
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {clientTerms.length > 0 && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Termos Assinados ({clientTerms.length})</p>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {clientTerms.map(term => (
                              <div key={term.id} className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold">{term.type}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(term.signedAt).toLocaleString('pt-BR')}</p>
                                  </div>
                                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold uppercase">
                                    {term.type}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => window.open(`/consent/${term.appointmentId}?type=${term.type}`, '_blank')}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold hover:bg-white/10 transition-colors"
                                  >
                                    <FileText size={12} /> Ver
                                  </button>
                                  <button 
                                    onClick={() => window.open(`/consent/${term.appointmentId}?type=${term.type}&print=true`, '_blank')}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-bold hover:bg-primary/20 transition-colors"
                                  >
                                    <FileText size={12} /> Baixar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {client?.city && (
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                          <MapPin size={18} className="text-primary" />
                          <div>
                            <p className="text-xs text-gray-500">Cidade</p>
                            <p className="text-sm font-medium">{client.city}</p>
                          </div>
                        </div>
                      )}

                      {client && (
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                          <Share2 size={18} className="text-secondary" />
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Código de Indicação (Envie p/ Amigos)</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold font-mono tracking-wider">{client.id.substring(0, 6).toUpperCase()}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(client.id.substring(0, 6).toUpperCase());
                                  toast.success('Código copiado!');
                                }}
                                className="p-1 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                              >
                                <Copy size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {client?.indicatedBy && (
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                          <UserPlus size={18} className="text-primary" />
                          <div>
                            <p className="text-xs text-gray-500">Indicado por</p>
                            <p className="text-sm font-medium">{client.indicatedBy}</p>
                          </div>
                        </div>
                      )}
                      {client?.medicalNotes && (
                        <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl">
                          <Stethoscope size={18} className="text-primary mt-1" />
                          <div>
                            <p className="text-xs text-gray-500">Observações Médicas</p>
                            <p className="text-sm font-medium whitespace-pre-wrap">{client.medicalNotes}</p>
                          </div>
                        </div>
                      )}
                      {client?.isMinor && (
                        <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          <p className="text-xs font-bold text-destructive uppercase tracking-widest">Cliente Menor de Idade</p>
                        </div>
                      )}
                      {client?.notes && (
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Observações Gerais</p>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{client.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Edit3 size={18} /> Editar
                  </button>
                  <button 
                    onClick={() => setShowLinkGenerator(true)}
                    className="flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/20 rounded-2xl text-sm font-bold text-primary hover:bg-primary/20 transition-colors"
                  >
                    <LinkIcon size={18} /> Enviar Link
                  </button>
                  <button 
                    onClick={() => { navigate(`/agenda?clientId=${client?.id}`); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <History size={18} /> Histórico
                  </button>
                  <button 
                    onClick={() => { navigate(`/financeiro?clientId=${client?.id}`); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <CreditCard size={18} /> Financeiro
                  </button>
                  <button 
                    onClick={() => { navigate(`/fidelidade?clientId=${client?.id}`); onClose(); }}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Star size={18} /> Fidelidade
                  </button>
                  
                  {showDeleteConfirm ? (
                    <div className="col-span-2 space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                      <p className="text-xs font-bold text-destructive text-center uppercase tracking-widest">Confirmar exclusão?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={handleDelete}
                          className="py-2 bg-destructive text-white rounded-xl text-xs font-bold hover:bg-destructive/80 transition-colors"
                        >
                          Sim, Excluir
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="col-span-2 flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 size={18} /> Excluir Cliente
                    </button>
                  )}
                </div>

                {/* Points Manager Overlay */}
                <AnimatePresence>
                  {showPointsManager && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-6"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Gerenciar Pontos</h4>
                        <button onClick={() => setShowPointsManager(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => setPointsAdjustment(prev => ({ ...prev, amount: Math.abs(prev.amount) }))}
                            className={cn(
                              "py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              pointsAdjustment.amount >= 0 ? "bg-success/20 border-success text-success" : "bg-white/5 border-white/10 text-gray-500"
                            )}
                          >
                            Adicionar
                          </button>
                          <button 
                            onClick={() => setPointsAdjustment(prev => ({ ...prev, amount: -Math.abs(prev.amount) }))}
                            className={cn(
                              "py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              pointsAdjustment.amount < 0 ? "bg-destructive/20 border-destructive text-destructive" : "bg-white/5 border-white/10 text-gray-500"
                            )}
                          >
                            Remover
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Quantidade de Pontos</label>
                          <input 
                            type="number"
                            value={Math.abs(pointsAdjustment.amount)}
                            onChange={e => setPointsAdjustment(prev => ({ 
                              ...prev, 
                              amount: (prev.amount < 0 ? -1 : 1) * Math.abs(parseInt(e.target.value) || 0) 
                            }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Motivo / Descrição</label>
                          <input 
                            type="text"
                            placeholder="Ex: Bônus de aniversário"
                            value={pointsAdjustment.description}
                            onChange={e => setPointsAdjustment(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                          />
                        </div>

                        <button 
                          onClick={handleAdjustPoints}
                          disabled={pointsAdjustment.amount === 0}
                          className="w-full py-3 bg-primary rounded-xl text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
                        >
                          Confirmar Ajuste
                        </button>

                        {clientLoyaltyHistory.length > 0 && (
                          <div className="pt-4 border-t border-white/5">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Histórico Recente</p>
                            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {clientLoyaltyHistory.slice(0, 5).map(lt => (
                                <div key={lt.id} className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                                  <div>
                                    <p className="text-xs font-medium">{lt.description}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(lt.date).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <p className={cn(
                                    "text-xs font-bold",
                                    lt.type === 'Ganho' ? "text-success" : "text-destructive"
                                  )}>
                                    {lt.type === 'Ganho' ? '+' : '-'}{lt.points}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Link Generator Overlay */}
                <AnimatePresence>
                  {showLinkGenerator && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-6"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Gerador de Link</h4>
                        <button onClick={() => setShowLinkGenerator(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
                      </div>

                      {!generatedLink ? (
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Profissional</label>
                            <select 
                              value={linkConfig.professionalId}
                              onChange={e => setLinkConfig({...linkConfig, professionalId: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                            >
                              <option value="">Selecione...</option>
                              {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Serviço</label>
                            <input 
                              type="text"
                              placeholder="Ex: Tatuagem Realista"
                              value={linkConfig.service}
                              onChange={e => setLinkConfig({...linkConfig, service: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Valor Total (R$)</label>
                              <input 
                                type="number"
                                value={linkConfig.value}
                                onChange={e => setLinkConfig({...linkConfig, value: parseFloat(e.target.value.replace(',', '.'))})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Duração (min)</label>
                              <input 
                                type="number"
                                value={linkConfig.duration}
                                onChange={e => setLinkConfig({...linkConfig, duration: parseInt(e.target.value)})}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Sinal Sugerido</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['50', '100'].map(p => (
                                <button
                                  key={p}
                                  onClick={() => setLinkConfig({...linkConfig, depositPercentage: parseInt(p)})}
                                  className={cn(
                                    "py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                                    (linkConfig.depositPercentage || 50) === parseInt(p) 
                                      ? "bg-primary/20 border-primary text-primary" 
                                      : "bg-white/5 border-white/5 text-gray-500 hover:border-white/10"
                                  )}
                                >
                                  {p}%
                                </button>
                              ))}
                            </div>
                          </div>
                          <button 
                            onClick={handleGenerateLink}
                            disabled={!linkConfig.professionalId || !linkConfig.service}
                            className="w-full py-3 bg-primary rounded-xl text-white font-bold text-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
                          >
                            Gerar Link
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-white/5 border border-white/10 rounded-xl break-all text-[10px] font-mono text-gray-400">
                            {generatedLink}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={copyToClipboard}
                              className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold hover:bg-white/10 transition-colors"
                            >
                              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />} 
                              {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                            <button 
                              onClick={shareViaWhatsApp}
                              className="flex items-center justify-center gap-2 py-3 bg-success/20 border border-success/30 rounded-xl text-xs font-bold text-success hover:bg-success/30 transition-colors"
                            >
                              <MessageCircle size={16} /> WhatsApp
                            </button>
                          </div>
                          <button 
                            onClick={() => setGeneratedLink('')}
                            className="w-full py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors"
                          >
                            Gerar outro link
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* New Appointment Button */}
                <button 
                  onClick={handleNewAppointment}
                  className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:scale-[1.02] transition-transform"
                >
                  Novo Agendamento
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function Clientes() {
  const { clients, addClient, updateClient, deleteClient } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredClients = clients
    .filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'Ativo').length,
    debtor: clients.filter(c => c.status === 'Inadimplente').length,
    newMonth: clients.filter(c => {
      const createdDate = new Date(c.id.length > 10 ? 0 : parseInt(c.id, 36)); // Fallback if ID is not timestamp
      if (isNaN(createdDate.getTime())) return false;
      const now = new Date();
      return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
    }).length
  };

  const handleSave = (data: Partial<Client>) => {
    if (selectedClient) {
      updateClient(selectedClient.id, data);
    } else {
      // Check for duplicate client by CPF or Phone
      const cleanCpf = data.cpf ? data.cpf.replace(/\D/g, '') : '';
      const cleanPhone = data.phone ? data.phone.replace(/\D/g, '') : '';
      
      const existingClientByCpfOrPhone = clients.find(c => {
        const cCpf = (c.cpf || '').replace(/\D/g, '');
        const cPhone = (c.phone || '').replace(/\D/g, '');
        return (cleanCpf && cCpf === cleanCpf) || (cleanPhone && cPhone === cleanPhone);
      });

      if (existingClientByCpfOrPhone) {
      toast.error('Já existe um cliente cadastrado com este CPF ou Telefone.');
        return;
      }

      addClient(data as Omit<Client, 'id'>);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-bold tracking-tighter text-primary">CLIENTES</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Gerencie sua base de contatos</p>
        </div>
        <button 
          onClick={() => {
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-full text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card bg-card border-white/5 p-6 rounded-[2rem] space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="glass-card bg-card border-white/5 p-6 rounded-[2rem] space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ativos</p>
          <p className="text-3xl font-bold text-success">{stats.active}</p>
        </div>
        <div className="glass-card bg-card border-white/5 p-6 rounded-[2rem] space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inadimplentes</p>
          <p className="text-3xl font-bold text-destructive">{stats.debtor}</p>
        </div>
        <div className="glass-card bg-card border-white/5 p-6 rounded-[2rem] space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Novos (Mês)</p>
          <p className="text-3xl font-bold text-secondary">{stats.newMonth}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-card border border-white/5 rounded-2xl text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors">
          <Filter size={20} /> Filtros
        </button>
      </div>

      {/* Clients List */}
      <div className="glass-card bg-card border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Pontos</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Última Visita</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Total Gasto</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClients.map((client) => (
                <tr 
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setIsModalOpen(true);
                  }}
                  className="group cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm group-hover:text-primary transition-colors">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-xs font-bold text-primary">{client.points || 0} pts</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={14} /> {client.lastVisit}
                    </div>
                  </td>
                  <td className="px-8 py-6 hidden md:table-cell">
                    <p className="text-sm font-bold text-success">R$ {client.totalSpent.toFixed(2)}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      client.status === 'Ativo' ? "bg-success/20 text-success" :
                      client.status === 'Inadimplente' ? "bg-destructive/20 text-destructive" :
                      "bg-white/10 text-gray-400"
                    )}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-500 hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ClientModal 
        client={selectedClient} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onDelete={deleteClient}
        onSave={handleSave}
      />
    </div>
  );
}
