import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Appointment, AppSettings, Professional } from '../types';
import { 
  CreditCard, 
  Loader2, 
  AlertCircle,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle,
  Copy
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Pagamento() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        if (!appointmentId) throw new Error('ID do agendamento não fornecido');

        // Load appointment
        const { data: appt, error: apptError } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .single();

        if (apptError) throw apptError;
        setAppointment(appt);

        // Load settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (settingsError) throw settingsError;
        setSettings(settingsData);

        // Load professional
        if (appt.professional_id) {
          const { data: prof, error: profError } = await supabase
            .from('professionals')
            .select('*')
            .eq('id', appt.professional_id)
            .single();
          
          if (!profError) setProfessional(prof);
        }

      } catch (err: any) {
        console.error('Erro ao carregar dados de pagamento:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [appointmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c5a059]" size={48} />
      </div>
    );
  }

  if (error || !appointment || !settings) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-4">
        <div className="bg-[#151619] border border-red-500/20 p-8 rounded-[40px] max-w-md w-full text-center space-y-6">
          <AlertCircle className="mx-auto text-red-500" size={64} />
          <h1 className="text-2xl font-bold text-white uppercase italic">Erro no Pagamento</h1>
          <p className="text-gray-400">{error || 'Agendamento não encontrado'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-[#c5a059] text-black rounded-2xl font-bold uppercase tracking-widest"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const query = new URLSearchParams(window.location.search);
  const amountParam = query.get('amount');
  
  const valueToPay = amountParam ? parseFloat(amountParam) : appointment.value;

  const pixKey = professional?.pixKey || settings.pixKey;
  const pixName = professional?.pixName || settings.pixName;

  const handleCopyPix = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0d8d0] font-sans selection:bg-[#c5a059]/30 p-4 md:p-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-[#c5a059]/10 rounded-full border border-[#c5a059]/20 mb-4">
            <ShieldCheck className="text-[#c5a059]" size={48} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif italic text-[#c5a059] uppercase tracking-tighter">Checkout Seguro</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">{settings.studioName || 'Estúdio de Tatuagem'}</p>
        </div>

        {/* Appointment Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#151619] border border-white/5 rounded-[40px] p-8 space-y-6"
        >
          <h2 className="text-xl font-bold uppercase italic tracking-tight border-b border-white/5 pb-4">Resumo do Agendamento</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente</p>
              <div className="flex items-center gap-2 text-white font-medium">
                <User size={16} className="text-[#c5a059]" />
                {appointment.clientName}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Profissional</p>
              <div className="flex items-center gap-2 text-white font-medium">
                <User size={16} className="text-[#c5a059]" />
                {appointment.professionalName}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Serviço</p>
              <div className="text-white font-medium">{appointment.service}</div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data e Hora</p>
              <div className="flex items-center gap-2 text-white font-medium">
                <Calendar size={16} className="text-[#c5a059]" />
                {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-between items-center">
            <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Valor a Pagar</p>
            <p className="text-3xl font-serif italic text-[#c5a059]">R$ {valueToPay.toFixed(2)}</p>
          </div>
        </motion.div>

        {/* Payment PIX Area */}
        <div className="space-y-4">
          {pixKey ? (
            <div className="bg-[#151619] border border-white/5 rounded-3xl p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                <CreditCard size={24} />
              </div>
              <h3 className="text-lg font-bold text-white uppercase italic tracking-wider">Pagamento via PIX</h3>
              <p className="text-gray-400 text-sm">Transfira o valor exato de <strong>R$ {valueToPay.toFixed(2)}</strong> para a chave abaixo:</p>
              
              <div className="bg-black/50 border border-white/10 rounded-xl p-4 mt-4">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Chave Pix</p>
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-white break-all">{pixKey}</span>
                  <button 
                    onClick={handleCopyPix}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#c5a059] transition-colors flex-shrink-0"
                  >
                    {copied ? <CheckCircle size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>
                {pixName && (
                  <p className="text-xs text-gray-400 mt-3 border-t border-white/5 pt-2">Beneficiário: {pixName}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-4">Após o pagamento, envie o comprovante para o estúdio.</p>
            </div>
          ) : (
            <div className="bg-[#151619] border border-white/5 rounded-3xl p-6 text-center">
              <Loader2 className="animate-spin text-[#c5a059] mx-auto mb-4" size={24} />
              <p className="text-gray-400">Métodos de pagamento diretos não configurados.</p>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-4 text-gray-600 pt-4">
            <div className="h-px flex-1 bg-white/5"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Pagamento 100% Seguro</span>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 text-center">
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.4em]">{settings.studioName || 'Viking Studio'} &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}
