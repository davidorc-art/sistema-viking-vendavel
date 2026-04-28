import React, { useState, useMemo } from 'react';
import { 
  Link as LinkIcon, 
  Copy, 
  Check, 
  QrCode as QrIcon, 
  Users, 
  DollarSign, 
  Clock, 
  Percent,
  ExternalLink,
  Smartphone,
  CreditCard,
  RefreshCw,
  Info,
  ChevronRight,
  Calendar as CalendarIcon,
  Zap,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { cn, getBaseUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import QRCode from 'qrcode';

export default function GeradorDeLinks() {
  const { professionals, settings } = useData();
  const [selectedProf, setSelectedProf] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [value, setValue] = useState('');
  const [duration, setDuration] = useState('120');
  const [depositPercent, setDepositPercent] = useState('50');
  const [allowDeposit, setAllowDeposit] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedLink('');
    setQrCode('');

    try {
      const baseUrl = getBaseUrl();
      const params = new URLSearchParams();
      
      if (selectedProf) params.append('profId', selectedProf);
      if (serviceName) params.append('service', serviceName);
      if (value) params.append('totalValue', value);
      if (duration) params.append('duration', duration);
      if (depositPercent) params.append('depositPercentage', depositPercent);
      if (!allowDeposit) params.append('allowDeposit', 'false');

      const link = `${baseUrl}/booking?${params.toString()}`;
      setGeneratedLink(link);

      const qrDataUrl = await QRCode.toDataURL(link, { 
        width: 600, 
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCode(qrDataUrl);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[40px] bg-[#0a0a0a] border border-white/5 p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
              <Zap size={12} /> Ferramentas Administrativas
            </div>
            <h1 className="text-6xl md:text-7xl font-serif italic text-primary leading-tight">
              Gerador de <span className="text-white not-italic font-sans font-black uppercase tracking-tighter">Links</span>
            </h1>
            <p className="text-gray-500 max-w-md text-sm leading-relaxed uppercase tracking-widest font-medium">
              Crie experiências de agendamento e pagamento personalizadas para seus clientes em segundos.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status da Integração</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-tight">PIX / MP Ativo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Configuration Panel */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 space-y-10 shadow-2xl"
          >
            {/* Professional Selection */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">
                Profissional Designado
              </label>
              <div className="relative group">
                <select 
                  value={selectedProf}
                  onChange={(e) => setSelectedProf(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer group-hover:border-white/20"
                >
                  <option value="">Qualquer Profissional (Opcional)</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <Users size={18} />
                </div>
              </div>
            </div>

            {/* Service/Description */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">
                Serviço
              </label>
              <div className="relative group">
                {settings.services && settings.services.length > 0 ? (
                  <select
                    value={serviceName}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setServiceName(selectedName);
                      
                      const selectedService = settings.services?.find(s => s.name === selectedName);
                      if (selectedService) {
                        // Auto-select professional based on category
                        if (selectedService.category === 'Tattoo') {
                          const david = professionals.find(p => p.name.toLowerCase().includes('david'));
                          if (david) setSelectedProf(david.id);
                        } else if (selectedService.category === 'Piercing') {
                          const jeynne = professionals.find(p => p.name.toLowerCase().includes('jeynne'));
                          if (jeynne) setSelectedProf(jeynne.id);
                        }
                        
                        // Set recommended price and duration
                        if (selectedService.price) setValue(String(selectedService.price));
                        if (selectedService.duration) setDuration(String(selectedService.duration));
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer group-hover:border-white/20"
                  >
                    <option value="">Selecione um serviço...</option>
                    {settings.services.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    placeholder="Ex: Tattoo Realismo Blackwork"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm focus:border-primary outline-none transition-all group-hover:border-white/20"
                  />
                )}
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <Smartphone size={18} />
                </div>
              </div>
            </div>

            {/* Value Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">
                Valor Total (R$)
              </label>
              <div className="relative group">
                <input 
                  type="number"
                  placeholder="0.00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm focus:border-primary outline-none transition-all group-hover:border-white/20 font-mono"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500">
                  <DollarSign size={18} />
                </div>
              </div>
            </div>

            {/* Duration Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">
                Duração Estimada
              </label>
              <div className="relative group">
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-sm focus:border-primary outline-none transition-all appearance-none cursor-pointer group-hover:border-white/20"
                >
                  <option value="30">30 Minutos</option>
                  <option value="60">1 Hora</option>
                  <option value="120">2 Horas</option>
                  <option value="180">3 Horas</option>
                  <option value="240">4 Horas</option>
                  <option value="300">5 Horas</option>
                  <option value="360">6 Horas</option>
                  <option value="480">8 Horas (Sessão)</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <Clock size={18} />
                </div>
              </div>
            </div>

            {/* Deposit Percentage */}
            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">
                Opções de Pagamento no Link
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setDepositPercent('50'); setAllowDeposit(true); }}
                  className={cn(
                    "p-6 rounded-3xl border text-left transition-all relative overflow-hidden group",
                    (depositPercent === '50' && allowDeposit) 
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                      : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-black uppercase tracking-widest",
                      (depositPercent === '50' && allowDeposit) ? "text-primary" : "text-white"
                    )}>Sinal (50%) ou Integral</span>
                    {(depositPercent === '50' && allowDeposit) && <ShieldCheck size={18} className="text-primary" />}
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Cliente escolhe</p>
                </button>

                <button
                  onClick={() => { setDepositPercent('100'); setAllowDeposit(false); }}
                  className={cn(
                    "p-6 rounded-3xl border text-left transition-all relative overflow-hidden group",
                    !allowDeposit
                      ? "bg-primary/10 border-primary shadow-lg shadow-primary/10" 
                      : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-black uppercase tracking-widest",
                      !allowDeposit ? "text-primary" : "text-white"
                    )}>Apenas 100%</span>
                    {!allowDeposit && <ShieldCheck size={18} className="text-primary" />}
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pagamento Total</p>
                </button>
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-6 bg-primary text-black rounded-[24px] font-black text-xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(197,160,89,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:hover:scale-100 group"
            >
              {isGenerating ? (
                <RefreshCw size={24} className="animate-spin" />
              ) : (
                <Zap size={24} className="group-hover:animate-pulse" />
              )}
              Gerar Link Viking
            </button>
          </motion.div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-5 sticky top-8">
          <AnimatePresence mode="wait">
            {generatedLink ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                      <Check size={32} />
                    </div>
                    <h3 className="text-2xl font-serif italic text-white">Link Pronto para Uso</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Envie agora para seu cliente</p>
                  </div>

                  {/* QR Code Container */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-white p-8 rounded-[32px] mx-auto w-fit shadow-2xl">
                      {qrCode && <img src={qrCode} alt="QR Code" className="w-56 h-56" />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-4">
                    <div className="p-5 bg-black/60 border border-white/5 rounded-2xl break-all text-[10px] text-gray-500 font-mono leading-relaxed">
                      {generatedLink}
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={copyToClipboard}
                        className={cn(
                          "flex-[2] py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all",
                          copySuccess ? "bg-green-500 text-white" : "bg-white text-black hover:bg-gray-200"
                        )}
                      >
                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                        {copySuccess ? 'Copiado!' : 'Copiar Link'}
                      </button>
                      <a 
                        href={generatedLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex-1 py-5 bg-primary/10 border border-primary/20 text-primary rounded-2xl hover:bg-primary/20 transition-all flex items-center justify-center"
                      >
                        <ExternalLink size={20} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Integration Info Card */}
                <div className="bg-primary/5 border border-primary/10 rounded-[32px] p-8 flex items-start gap-6">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Segurança Pix</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed uppercase font-medium tracking-tight">
                      O agendamento pode ser pago com checkout integrado ou leitura de QR Code.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full min-h-[600px] border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center p-12 text-center space-y-8 bg-black/20"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative p-10 bg-[#0a0a0a] border border-white/5 rounded-full text-gray-700">
                    <LinkIcon size={64} />
                  </div>
                </div>
                <div className="space-y-4 max-w-xs">
                  <h3 className="text-xl font-serif italic text-gray-400">Aguardando Configuração</h3>
                  <p className="text-xs text-gray-600 uppercase font-bold tracking-[0.2em] leading-relaxed">
                    Preencha os dados à esquerda para gerar o seu link personalizado.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-primary/40 pt-4">
                    <ArrowRight size={16} className="animate-bounce-x" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
