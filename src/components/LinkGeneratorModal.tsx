import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { Professional } from '../types';
import { getBaseUrl } from '../lib/utils';

const SERVICES = [
  'Tatuagem',
  'Piercing',
  'Orçamento'
];

const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 30);

export const LinkGeneratorModal = ({ 
  isOpen, 
  onClose, 
  professionals,
  clientId,
  clientName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  professionals: Professional[],
  clientId?: string,
  clientName?: string
}) => {
  const [profId, setProfId] = useState('');
  const [service, setService] = useState('');
  const [duration, setDuration] = useState(60);
  const [value, setValue] = useState('');
  const [depositPercent, setDepositPercent] = useState('50');
  const [allowDeposit, setAllowDeposit] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');

  const generateLink = () => {
    if (!profId) {
      alert('Por favor, selecione um profissional.');
      return;
    }
    const baseUrl = getBaseUrl() + '/booking';
    const params = new URLSearchParams({ profId, service, value, duration: duration.toString(), depositPercentage: depositPercent });
    if (clientId) {
      params.append('clientId', clientId);
    }
    if (!allowDeposit) {
      params.append('allowDeposit', 'false');
    }
    setGeneratedLink(`${baseUrl}?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">
                {clientId && clientName ? `Link para ${clientName}` : 'Gerar Link de Agendamento'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Profissional</label>
                <select 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-colors" 
                  value={profId}
                  onChange={e => setProfId(e.target.value)}
                >
                  <option value="">Selecione o profissional...</option>
                  {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Serviço</label>
                  <select 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-colors" 
                    value={service}
                    onChange={e => setService(e.target.value)}
                  >
                    <option value="">Selecione o serviço...</option>
                    {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Duração</label>
                  <select 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-colors" 
                    value={duration}
                    onChange={e => setDuration(Number(e.target.value))}
                  >
                    {DURATION_OPTIONS.map(d => (
                      <option key={d} value={d}>
                        {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 > 0 ? ` ${d % 60}min` : ''}` : `${d} min`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Valor (R$)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 150.00" 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-colors" 
                  value={value}
                  onChange={e => setValue(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Opções de Pagamento no Link</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setDepositPercent('50'); setAllowDeposit(true); }}
                    className={`p-4 rounded-xl border text-left transition-colors relative ${
                      (depositPercent === '50' && allowDeposit)
                        ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(197,160,89,0.15)] text-primary'
                        : 'bg-black/40 border-white/5 hover:border-white/20 text-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold uppercase tracking-wide">50% ou 100%</span>
                      {(depositPercent === '50' && allowDeposit) && <ShieldCheck size={14} className="text-primary" />}
                    </div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Cliente escolhe</p>
                  </button>
                  <button
                    onClick={() => { setDepositPercent('100'); setAllowDeposit(false); }}
                    className={`p-4 rounded-xl border text-left transition-colors relative ${
                      !allowDeposit
                        ? 'bg-primary/10 border-primary shadow-[0_0_15px_rgba(197,160,89,0.15)] text-primary'
                        : 'bg-black/40 border-white/5 hover:border-white/20 text-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold uppercase tracking-wide">Apenas 100%</span>
                      {!allowDeposit && <ShieldCheck size={14} className="text-primary" />}
                    </div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Pagamento Total</p>
                  </button>
                </div>
              </div>

              <button onClick={generateLink} className="w-full py-4 bg-primary text-black rounded-2xl font-bold hover:bg-primary/80 transition-all active:scale-[0.98] mt-4">
                Gerar Link
              </button>
              {generatedLink && (
                <div className="mt-4 p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                  <span className="text-xs truncate">{generatedLink}</span>
                  <button onClick={() => navigator.clipboard.writeText(generatedLink)} className="p-2 hover:bg-white/10 rounded-full"><Copy size={18} /></button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
