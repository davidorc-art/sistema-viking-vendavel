import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Activity, 
  Wifi, 
  Building2, 
  Users, 
  DollarSign, 
  Star, 
  Calendar, 
  Package, 
  ShoppingBag, 
  Beer, 
  ShieldCheck,
  Download,
  Upload,
  Database,
  AlertTriangle,
  Info,
  ChevronRight,
  X,
  Loader2,
  Check,
  Copy,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  CreditCard,
  CheckCircle,
  Plus,
  Trash2,
  Image
} from 'lucide-react';
import { cn, getBaseUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { AppSettings } from '../types';
import { useNavigate } from 'react-router-dom';

// --- Types ---
type SettingsTab = 'estudio' | 'assinatura' | 'profissionais' | 'servicos' | 'financeiro' | 'infinitePay' | 'fidelidade' | 'agenda' | 'estoque' | 'loja' | 'bar' | 'seguranca' | 'backup' | 'whatsapp';

// --- Sub-components ---

const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: (val: boolean) => void }) => (
  <button 
    onClick={() => onChange(!enabled)}
    className={cn(
      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
      enabled ? "bg-primary" : "bg-white/10"
    )}
  >
    <span 
      className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
        enabled ? "translate-x-6" : "translate-x-1"
      )} 
    />
  </button>
);

const InputField = ({ label, placeholder, value, onChange, type = "text" }: { label: string, placeholder?: string, value?: string | number, onChange: (val: string) => void, type?: string }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
    <input 
      type={type} 
      value={(value === undefined || value === null || (typeof value === 'number' && isNaN(value))) ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} 
      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
    />
  </div>
);

const SettingsSection = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card bg-card border-white/5 rounded-[2.5rem] p-8 space-y-8"
  >
    <div className="space-y-1">
      <h3 className="text-xl font-bold tracking-tight uppercase">{title}</h3>
      {description && <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{description}</p>}
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </motion.div>
);

const BackupCenter = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { exportData, importData, clearAllData } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viking_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (await importData(content)) {
        setFeedback({ type: 'success', message: 'Dados restaurados com sucesso!' });
        setTimeout(() => {
          setFeedback(null);
          onClose();
        }, 2000);
      } else {
        setFeedback({ type: 'error', message: 'Erro ao restaurar dados. Verifique o arquivo.' });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async () => {
    setIsResetting(true);
    setFeedback(null);
    try {
      const success = await clearAllData();
      if (success) {
        setFeedback({ type: 'success', message: 'Banco de dados resetado com sucesso!' });
        setTimeout(() => {
          setFeedback(null);
          setShowConfirmReset(false);
          onClose();
        }, 2000);
      } else {
        setFeedback({ type: 'error', message: 'Erro ao resetar banco de dados.' });
        setIsResetting(false);
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      setFeedback({ type: 'error', message: 'Erro fatal ao resetar banco de dados.' });
      setIsResetting(false);
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
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass-card bg-card border-t border-white/10 rounded-t-[2.5rem] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Centro de Backup e Segurança</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/10 text-success rounded-2xl border border-success/20">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Proteja seus dados contra perdas acidentais.
                </p>
              </div>

              {/* Export */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <Download size={20} />
                  <h3 className="font-bold">Exportar Dados</h3>
                </div>
                <p className="text-xs text-gray-500">Baixe uma cópia completa de todos os seus dados em formato JSON.</p>
                <ul className="space-y-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest list-disc pl-4">
                  <li>Clientes e Profissionais</li>
                  <li>Agenda e Financeiro</li>
                  <li>Financeiro e Estoque</li>
                </ul>
                <button 
                  onClick={handleExport}
                  className="w-full py-4 bg-success rounded-2xl text-black font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Download size={18} /> Baixar Backup Completo
                </button>
              </div>

              {/* Restore */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Upload size={20} />
                  <h3 className="font-bold">Restaurar Dados</h3>
                </div>
                <p className="text-xs text-gray-500">Recupere dados a partir de um arquivo de backup (.json).</p>
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex gap-3">
                  <AlertTriangle size={20} className="text-orange-500 shrink-0" />
                  <p className="text-[10px] text-orange-200/70 font-medium leading-relaxed">
                    A restauração irá sobrescrever ou adicionar dados. Use apenas se tiver certeza da integridade do arquivo.
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".json" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-gray-400 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Package size={18} /> Selecionar Arquivo de Backup
                </button>
              </div>

              {/* Reset */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle size={20} />
                  <h3 className="font-bold">Resetar Banco de Dados</h3>
                </div>
                <p className="text-xs text-gray-500">Apague permanentemente todos os dados para começar do zero.</p>
                
                {feedback && (
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium",
                    feedback.type === 'success' ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
                  )}>
                    {feedback.message}
                  </div>
                )}

                {!showConfirmReset ? (
                  <button 
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full py-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive font-bold text-sm flex items-center justify-center gap-2 hover:bg-destructive hover:text-white transition-all"
                  >
                    <AlertTriangle size={18} /> Apagar Tudo (Resetar)
                  </button>
                ) : (
                  <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-3xl space-y-4">
                    <p className="text-xs text-destructive font-bold text-center uppercase tracking-widest">
                      Você tem certeza absoluta?
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowConfirmReset(false)}
                        disabled={isResetting}
                        className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={handleReset}
                        disabled={isResetting}
                        className="flex-1 py-3 bg-destructive rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-destructive/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isResetting ? <Loader2 className="animate-spin" size={14} /> : "Sim, Apagar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Why? */}
              <div className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Info size={16} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Por que fazer backup?</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Embora o sistema seja robusto, erros humanos ou falhas de configuração podem levar à perda de dados. Recomendamos exportar seus dados semanalmente e guardar o arquivo em um local seguro (Google Drive, Dropbox ou HD Externo).
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function Configuracoes() {
  const { settings, updateSettings, isSyncing: isDataSyncing } = useData();
  const { subscription, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('estudio');
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    setIsSaving(true);
    updateSettings(localSettings);
    setTimeout(() => {
      setIsSaving(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    }, 500);
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const updatePaymentMethod = (method: keyof AppSettings['paymentMethods'], value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: value
      }
    }));
  };

  const tabs: { id: SettingsTab, label: string, icon: React.ReactNode }[] = [
    { id: 'estudio', label: 'Estúdio', icon: <Building2 size={18} /> },
    { id: 'assinatura', label: 'Assinatura', icon: <CreditCard size={18} /> },
    { id: 'profissionais', label: 'Profissionais', icon: <Users size={18} /> },
    { id: 'servicos', label: 'Serviços', icon: <Star size={18} /> },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={18} /> },
    { id: 'infinitePay', label: 'InfinitePay', icon: <CreditCard size={18} /> },
    { id: 'fidelidade', label: 'Fidelidade', icon: <Star size={18} /> },
    { id: 'agenda', label: 'Agenda', icon: <Calendar size={18} /> },
    { id: 'estoque', label: 'Estoque', icon: <Package size={18} /> },
    { id: 'loja', label: 'Loja', icon: <ShoppingBag size={18} /> },
    { id: 'bar', label: 'Bar', icon: <Beer size={18} /> },
    { id: 'seguranca', label: 'Segurança', icon: <ShieldCheck size={18} /> },
    { id: 'backup', label: 'Backup', icon: <Database size={18} /> },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="space-y-4 lg:space-y-6 px-2 lg:px-0">
        <div className="flex items-center gap-4">
          <div className="p-2 lg:p-3 bg-primary/20 text-primary rounded-xl lg:rounded-2xl shrink-0">
            <Settings size={24} className="lg:w-8 lg:h-8" />
          </div>
          <div className="space-y-0.5 lg:space-y-1">
            <h1 className="text-3xl lg:text-5xl font-bold tracking-tighter text-primary uppercase">Configurações</h1>
            <p className="text-gray-500 text-[10px] lg:text-sm font-medium uppercase tracking-widest leading-none">Personalize seu estúdio</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:gap-4">
          <div className="glass-card bg-card border-white/5 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[8px] lg:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</p>
              <div className="flex items-center gap-1.5 text-success">
                <Activity size={14} className="lg:w-[18px] lg:h-[18px]" />
                <span className="text-sm lg:text-xl font-bold">Ativo</span>
              </div>
            </div>
          </div>
          <div className="glass-card bg-card border-white/5 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[8px] lg:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Conexão</p>
              <div className={cn(
                "flex items-center gap-1.5 transition-colors",
                isDataSyncing ? "text-orange-500" : "text-blue-500"
              )}>
                <Wifi size={14} className={cn("lg:w-[18px] lg:h-[18px]", isDataSyncing ? "animate-pulse" : "")} />
                <span className="text-sm lg:text-xl font-bold">{isDataSyncing ? "Sync..." : "ON"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fixed bottom-24 left-4 right-4 z-[60] lg:relative lg:bottom-0 lg:left-0 lg:right-0 lg:z-0">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={cn(
              "w-full py-4 rounded-2xl text-white font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl",
              saveFeedback ? "bg-success shadow-success/20" : "bg-primary shadow-primary/20 hover:scale-[1.01]"
            )}
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
              saveFeedback ? <><Check size={20} /> Salvo!</> : <><Save size={20} /> Salvar Tudo</>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-card bg-card border-white/5 rounded-2xl lg:rounded-[2.5rem] p-2 lg:p-4 overflow-x-auto custom-scrollbar sticky top-4 z-50 backdrop-blur-md mx-2 lg:mx-0">
        <div className="flex flex-nowrap lg:flex-wrap gap-1.5 lg:gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-row lg:flex-col items-center justify-center gap-2 p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all min-w-[110px] lg:min-w-0 lg:flex-1 shrink-0",
                activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              )}
            >
              <div className="shrink-0">{tab.icon}</div>
              <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="space-y-6 lg:space-y-8 px-2 lg:px-0">
        {activeTab === 'estudio' && (
          <SettingsSection title="Dados do Estúdio" description="Informações básicas do seu negócio">
            <InputField label="Nome do Estúdio" value={localSettings.studioName} onChange={(v) => updateSetting('studioName', v)} />
            <InputField label="Telefone / WhatsApp" value={localSettings.phone} onChange={(v) => updateSetting('phone', v)} />
            <InputField label="Instagram" value={localSettings.instagram} placeholder="@vikingtattoo" onChange={(v) => updateSetting('instagram', v)} />
            <InputField label="Endereço Completo" value={localSettings.address} placeholder="Rua das Tintas, 123 - Centro" onChange={(v) => updateSetting('address', v)} />
            <InputField label="Link do Google Maps" value={localSettings.mapsLink} placeholder="https://maps.app.goo.gl/..." onChange={(v) => updateSetting('mapsLink', v)} />
            <InputField label="Horário de Funcionamento" value={localSettings.openingHours} onChange={(v) => updateSetting('openingHours', v)} />
          </SettingsSection>
        )}

        {activeTab === 'assinatura' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 glass-panel overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Sua Assinatura</h3>
                  <p className="text-gray-400 text-sm">Controle seu acesso e faturamento de forma transparente</p>
                </div>
                <div className={cn(
                  "px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-2",
                  subscription?.status === 'active' || (subscription?.status === 'trialing' && new Date(subscription?.trial_ends_at || '') > new Date())
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                )}>
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full animate-pulse",
                    subscription?.status === 'active' || (subscription?.status === 'trialing' && new Date(subscription?.trial_ends_at || '') > new Date())
                      ? "bg-success"
                      : "bg-destructive"
                  )} />
                  {subscription?.status === 'trialing' ? 'Período Experimental Free' : 
                   subscription?.status === 'active' ? 'Assinatura Ativa (70/mês)' : 'Assinatura Expirada'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative z-10">
                <div className="bg-black/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 block">Plano Atual</span>
                  <p className="text-2xl font-bold mb-1">Viking Professional</p>
                  <p className="text-primary font-bold text-lg">R$ 70,00 <span className="text-xs text-gray-500 font-normal">/ mês</span></p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-3xl p-8 hover:border-white/10 transition-colors">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 block">
                    {subscription?.status === 'trialing' ? 'Expira em' : 'Próxima Cobrança'}
                  </span>
                  <p className="text-2xl font-bold mb-1">
                    {subscription?.status === 'trialing' 
                      ? new Date(subscription?.trial_ends_at || '').toLocaleDateString('pt-BR')
                      : subscription?.current_period_end 
                        ? new Date(subscription?.current_period_end).toLocaleDateString('pt-BR')
                        : 'Pendente'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {subscription?.status === 'trialing' && (
                      <span className="flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-primary" />
                        Restam {Math.max(0, Math.ceil((new Date(subscription?.trial_ends_at || '').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} dias de teste
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <h4 className="font-bold text-lg flex items-center gap-2">
                  <Star size={20} className="text-primary" />
                  Recursos Premium Viking Studio
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Agenda Multi-profissional',
                    'Dashboard de Performance AI',
                    'Controle de Estoque Inteligente',
                    'Gestão Financeira e Comissões',
                    'Portal de Agendamento Online',
                    'Fidelização de Clientes',
                    'WhatsApp Business Automation',
                    'Relatórios Exportáveis',
                    'Segurança de Dados Camaleão'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                      <CheckCircle size={16} className="text-success shrink-0" />
                      <span className="text-xs text-gray-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col gap-1">
                  <button 
                    className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-10 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                    onClick={() => {
                      const planId = import.meta.env.VITE_MP_PLAN_ID;
                      if (!planId || planId === 'VOSSO_PLAN_ID') {
                        alert('Atenção Administrador: O ID do Plano (VITE_MP_PLAN_ID) não foi configurado. Crie o plano no Mercado Pago e adicione o ID nas variáveis de ambiente (.env).');
                        return;
                      }
                      const mpUrl = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${planId}&external_reference=${user?.id}`;
                      window.open(mpUrl, '_blank');
                    }}
                  >
                    <CreditCard size={20} />
                    {subscription?.status === 'active' ? 'Gerenciar Assinatura' : 'Assinar Plano Mercado Pago'}
                  </button>
                  <span className="text-[10px] text-gray-400 text-center md:text-left mt-2 flex items-center justify-center md:justify-start gap-1">
                    <CheckCircle size={10} className="text-success" />
                    Pagamento processado via Mercado Pago.
                  </span>
                </div>
                
                <div className="flex items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Segurança</p>
                    <p className="text-xs font-bold italic">Mercado Pago</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'profissionais' && (
          <SettingsSection title="Regras para Profissionais">
            <InputField label="Comissão Padrão (%)" value={localSettings.defaultCommission} type="number" onChange={(v) => updateSetting('defaultCommission', Number(v))} />
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Comissão Personalizada</p>
                <p className="text-xs text-gray-500">Permitir comissões diferentes por profissional</p>
              </div>
              <Toggle enabled={localSettings.customCommission} onChange={(v) => updateSetting('customCommission', v)} />
            </div>
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Ranking de Profissionais</p>
                <p className="text-xs text-gray-500">Mostrar ranking de desempenho no dashboard</p>
              </div>
              <Toggle enabled={localSettings.professionalRanking} onChange={(v) => updateSetting('professionalRanking', v)} />
            </div>
          </SettingsSection>
        )}

        {activeTab === 'servicos' && (
          <SettingsSection title="Serviços Oferecidos" description="Defina os serviços que aparecem para os clientes no portal">
            <div className="space-y-6">
              {(localSettings.services || []).map((service, index) => (
                <div key={service.id || index} className="p-6 glass-card bg-black/40 rounded-[2rem] border border-white/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/20 text-primary rounded-xl">
                        <Star size={18} />
                      </div>
                      <h4 className="font-bold uppercase tracking-tight">{service.name || 'Novo Serviço'}</h4>
                    </div>
                    <button 
                      onClick={() => {
                        const newServices = [...(localSettings.services || [])];
                        newServices.splice(index, 1);
                        updateSetting('services', newServices);
                      }}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label="Nome do Serviço" 
                      value={service.name} 
                      onChange={(v) => {
                        const newServices = [...(localSettings.services || [])];
                        newServices[index] = { ...service, name: v };
                        updateSetting('services', newServices);
                      }} 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField 
                        label="Preço (R$)" 
                        value={service.price} 
                        onChange={(v) => {
                          const newServices = [...(localSettings.services || [])];
                          newServices[index] = { ...service, price: v };
                          updateSetting('services', newServices);
                        }} 
                      />
                      <InputField 
                        label="Duração (min)" 
                        type="number"
                        value={service.duration} 
                        onChange={(v) => {
                          const newServices = [...(localSettings.services || [])];
                          newServices[index] = { ...service, duration: Number(v) };
                          updateSetting('services', newServices);
                        }} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Categoria</label>
                      <select 
                        value={service.category}
                        onChange={(e) => {
                          const newServices = [...(localSettings.services || [])];
                          newServices[index] = { ...service, category: e.target.value as any };
                          updateSetting('services', newServices);
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                      >
                        <option value="Tattoo">Tatuagem</option>
                        <option value="Piercing">Piercing</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <InputField 
                      label="URL da Imagem" 
                      value={service.image} 
                      placeholder="https://exemplo.com/imagem.jpg"
                      onChange={(v) => {
                        const newServices = [...(localSettings.services || [])];
                        newServices[index] = { ...service, image: v };
                        updateSetting('services', newServices);
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Descrição</label>
                    <textarea 
                      value={service.description || ''}
                      onChange={(e) => {
                        const newServices = [...(localSettings.services || [])];
                        newServices[index] = { ...service, description: e.target.value };
                        updateSetting('services', newServices);
                      }}
                      placeholder="Descrição longa ou curta do serviço..."
                      className="w-full bg-black/40 border border-white/5 rounded-[2rem] py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors min-h-[100px] resize-y"
                    />
                  </div>
                </div>
              ))}

              <button 
                onClick={() => {
                  const newService = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: '',
                    price: '',
                    duration: 60,
                    category: 'Tattoo' as const,
                    image: ''
                  };
                  updateSetting('services', [...(localSettings.services || []), newService]);
                }}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-[2rem] text-gray-500 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs"
              >
                <Plus size={18} /> Adicionar Novo Serviço
              </button>
            </div>
          </SettingsSection>
        )}

        {activeTab === 'financeiro' && (
          <SettingsSection title="Regras Financeiras">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Formas de Pagamento Habilitadas no Estúdio</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'pix', label: 'Pix' },
                    { id: 'dinheiro', label: 'Dinheiro' },
                    { id: 'debito', label: 'Débito' },
                    { id: 'credito', label: 'Crédito' },
                  ].map((method) => (
                    <div key={method.id} className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
                      <span className="text-sm font-bold">{method.label}</span>
                      <Toggle enabled={localSettings.paymentMethods[method.id as keyof AppSettings['paymentMethods']]} onChange={(v) => updatePaymentMethod(method.id as keyof AppSettings['paymentMethods'], v)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <RefreshCw size={20} />
                  <h3 className="font-bold italic uppercase tracking-tight">Configuração de Pagamento Padrão</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Configure sua chave Pix padrão do estúdio. Para que cada profissional receba direto na sua conta, 
                  peça para ele preencher os dados de PIX no seu perfil da aba <strong className="text-white">Profissionais</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Chave Pix (CPF, Celular, E-mail ou Aleatória)" value={localSettings.pixKey} onChange={(v) => updateSetting('pixKey', v)} />
                  <InputField label="Nome do Beneficiário" value={localSettings.pixName} placeholder="Seu Nome ou Nome do Estúdio" onChange={(v) => updateSetting('pixName', v)} />
                  <InputField label="Cidade (Pix)" value={localSettings.city} placeholder="Ex: Sao Paulo" onChange={(v) => updateSetting('city', v)} />
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeTab === 'infinitePay' && (
          <SettingsSection title="Configurações InfinitePay" description="Integre sua conta InfinitePay para agendamentos rápidos">
            <div className="space-y-6">
              <div className="p-6 bg-primary/10 border border-primary/20 rounded-[2rem] flex items-center gap-4">
                <div className="p-3 bg-primary text-white rounded-xl">
                  <Activity size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Pagamento Automático via TAG</h4>
                  <p className="text-xs text-gray-400">Ao inserir sua TAG, o link de agendamento incluirá automaticamente a opção de pagamento via InfinitePay.</p>
                </div>
              </div>

              <InputField 
                label="Sua TAG InfinitePay" 
                placeholder="Ex: vikingtattoo" 
                value={localSettings.infinitePayTag} 
                onChange={(v) => updateSetting('infinitePayTag', v)} 
              />
              
              <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Onde encontrar minha TAG?</p>
                <p className="text-xs text-gray-400">Entre no seu App InfinitePay, vá em Perfil ou Configurações de Link e procure pela sua TAG personalizada.</p>
              </div>
            </div>
          </SettingsSection>
        )}

        {activeTab === 'fidelidade' && (
          <SettingsSection title="Programa de Fidelidade">
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Ativar Sistema de Pontos</p>
                <p className="text-xs text-gray-500">Habilitar acumulação e resgate de pontos</p>
              </div>
              <Toggle enabled={localSettings.loyaltyActive} onChange={(v) => updateSetting('loyaltyActive', v)} />
            </div>
            <InputField label="Pontos por Real gasto (R$ 1,00)" value={localSettings.pointsPerReal} onChange={(v) => updateSetting('pointsPerReal', Number(v))} />
            <InputField label="Valor de 1 Ponto em Reais (R$)" value={localSettings.pointValue} onChange={(v) => updateSetting('pointValue', Number(v))} />
            <p className="text-[10px] text-gray-600 font-medium">Define quanto vale cada ponto ao pagar no Bar ou Loja.</p>
            <InputField label="Pontos por Indicação" value={localSettings.pointsPerReferral} onChange={(v) => updateSetting('pointsPerReferral', Number(v))} />
            <InputField label="Pontos por Aniversário" value={localSettings.pointsPerBirthday} onChange={(v) => updateSetting('pointsPerBirthday', Number(v))} />
          </SettingsSection>
        )}

        {activeTab === 'agenda' && (
          <SettingsSection title="Configurações da Agenda">
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <Calendar className="text-blue-400" size={24} />
                <div>
                  <h4 className="text-lg font-bold">Sincronização com Google Agenda</h4>
                  <p className="text-xs text-gray-400">Adicione todos os seus agendamentos automaticamente ao seu Google Agenda.</p>
                </div>
              </div>

              {window.location.origin.includes('ais-dev') && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-400">URL de Desenvolvimento Detectada</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      O Google Agenda não consegue acessar esta URL privada. Para sincronizar:
                      <br />1. Clique no botão <strong className="text-white">"Share"</strong> no topo da tela.
                      <br />2. Abra o link gerado (Shared App).
                      <br />3. Copie o link da agenda lá.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Link de Sincronização (Feed ICS):</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${getBaseUrl()}/api/calendar/feed?nocache=${Date.now()}`}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 focus:outline-none"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${getBaseUrl()}/api/calendar/feed?nocache=${Date.now()}`);
                      alert('Link copiado! Cole no Google Agenda em "Adicionar da URL".');
                    }}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold"
                  >
                    <Copy size={16} /> Copiar
                  </button>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-gray-300">Como usar no Google Agenda:</p>
                  <ol className="text-[11px] text-gray-500 list-decimal list-inside space-y-1">
                    <li>Abra o <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google Agenda</a> no computador.</li>
                    <li>No menu lateral, clique no <strong className="text-gray-300">+</strong> ao lado de "Outras agendas".</li>
                    <li>Selecione <strong className="text-gray-300">"Do URL"</strong>.</li>
                    <li>Cole o link copiado acima e clique em <strong className="text-gray-300">"Adicionar agenda"</strong>.</li>
                  </ol>
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-amber-500/90 leading-relaxed">
                      <strong>Aviso:</strong> O Google Agenda pode levar até 24 horas para sincronizar automaticamente. Para forçar uma atualização imediata, exclua a agenda antiga no Google e adicione este novo link (ele contém um código único para forçar a atualização).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <InputField label="Duração Padrão (minutos)" value={localSettings.defaultDuration} type="number" onChange={(v) => updateSetting('defaultDuration', Number(v))} />
            <InputField label="Intervalo entre Atendimentos (min)" value={localSettings.appointmentInterval} type="number" onChange={(v) => updateSetting('appointmentInterval', Number(v))} />
            
            <div className="pt-6 border-t border-white/5 space-y-6">
              <h3 className="text-sm font-bold uppercase italic tracking-widest text-primary flex items-center gap-2">
                <CreditCard size={20} /> Regras de Reserva e Depósito
              </h3>
              
              <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold">Exigir Sinal (Reserva)</p>
                  <p className="text-xs text-gray-500">Solicitar pagamento antecipado para confirmar horário</p>
                </div>
                <Toggle enabled={localSettings.allowDeposit} onChange={(v) => updateSetting('allowDeposit', v)} />
              </div>

              {localSettings.allowDeposit && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField 
                    label="Porcentagem Padrão do Sinal (%)" 
                    type="number" 
                    value={localSettings.depositPercentage} 
                    onChange={(v) => updateSetting('depositPercentage', Number(v))} 
                  />
                  <div className="p-4 bg-primary/5 rounded-2xl flex items-center justify-center text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-medium leading-relaxed">
                      O cliente poderá escolher pagar este valor ou o total (100%) no ato do agendamento.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Permitir Overbooking</p>
                <p className="text-xs text-gray-500">Agendar mais de um cliente no mesmo horário</p>
              </div>
              <Toggle enabled={localSettings.allowOverbooking} onChange={(v) => updateSetting('allowOverbooking', v)} />
            </div>
          </SettingsSection>
        )}

        {activeTab === 'estoque' && (
          <SettingsSection title="Controle de Estoque">
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Alerta de Estoque Baixo</p>
                <p className="text-xs text-gray-500">Avisar quando produtos atingirem o mínimo</p>
              </div>
              <Toggle enabled={localSettings.lowStockAlert} onChange={(v) => updateSetting('lowStockAlert', v)} />
            </div>
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Permitir Estoque Negativo</p>
                <p className="text-xs text-gray-500">Continuar vendendo mesmo sem estoque registrado</p>
              </div>
              <Toggle enabled={localSettings.allowNegativeStock} onChange={(v) => updateSetting('allowNegativeStock', v)} />
            </div>
          </SettingsSection>
        )}

        {activeTab === 'loja' && (
          <SettingsSection title="Regras da Loja">
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Venda sem Cliente</p>
                <p className="text-xs text-gray-500">Permitir vendas rápidas sem cadastro</p>
              </div>
              <Toggle enabled={localSettings.sellWithoutClient} onChange={(v) => updateSetting('sellWithoutClient', v)} />
            </div>
          </SettingsSection>
        )}

        {activeTab === 'bar' && (
          <SettingsSection title="Regras do Bar">
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Permitir Cortesias</p>
                <p className="text-xs text-gray-500">Habilitar opção de cortesia no bar</p>
              </div>
              <Toggle enabled={localSettings.allowCourtesy} onChange={(v) => updateSetting('allowCourtesy', v)} />
            </div>
            <InputField label="Limite Diário de Cortesias" value={localSettings.courtesyLimit} type="number" onChange={(v) => updateSetting('courtesyLimit', Number(v))} />
          </SettingsSection>
        )}

        {activeTab === 'seguranca' && (
          <SettingsSection title="Segurança e Acesso">
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Autenticação de Dois Fatores</p>
                <p className="text-xs text-gray-500">Adicionar camada extra de segurança</p>
              </div>
              <Toggle enabled={localSettings.twoFactor} onChange={(v) => updateSetting('twoFactor', v)} />
            </div>
            <div className="p-6 glass-card bg-black/40 rounded-[2rem] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-bold">Registro de Atividades</p>
                <p className="text-xs text-gray-500">Manter log de todas as ações do sistema</p>
              </div>
              <Toggle enabled={localSettings.activityLog} onChange={(v) => updateSetting('activityLog', v)} />
            </div>
          </SettingsSection>
        )}


        {activeTab === 'backup' && (
          <SettingsSection title="Backup e Importação" description="Gerencie seus dados e importe backups de versões anteriores">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-8 glass-card bg-black/40 rounded-[2.5rem] space-y-4">
                <div className="p-3 bg-primary/20 text-primary w-fit rounded-2xl">
                  <Database size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold">Importar Backup Legado</h4>
                  <p className="text-xs text-gray-500">Se você possui dados de uma versão anterior do sistema, use esta ferramenta para importar clientes, profissionais e agenda.</p>
                </div>
                <button 
                  onClick={() => navigate('/importar-legado')}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all border border-white/5"
                >
                  Abrir Ferramenta de Importação
                </button>
              </div>

              <div className="p-8 glass-card bg-black/40 rounded-[2.5rem] space-y-4">
                <div className="p-3 bg-blue-500/20 text-blue-500 w-fit rounded-2xl">
                  <Download size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold">Exportar Dados Atuais</h4>
                  <p className="text-xs text-gray-500">Baixe uma cópia completa de todos os seus dados atuais em formato JSON para segurança.</p>
                </div>
                <button 
                  onClick={() => setIsBackupOpen(true)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all border border-white/5"
                >
                  Gerenciar Backups
                </button>
              </div>
            </div>
          </SettingsSection>
        )}
      </div>

      {/* Backup Center Modal */}
      <BackupCenter isOpen={isBackupOpen} onClose={() => setIsBackupOpen(false)} />
    </div>
  );
}
