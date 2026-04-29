import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const isFree = searchParams.get('free') === 'true';
  const appointmentId = searchParams.get('appointmentId') || searchParams.get('apptId');
  const serviceName = searchParams.get('service') || '';
  
  const method = searchParams.get('method') || 'mp';
  const isInfinitePay = method === 'infinitePay';
  
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending'>(
    isFree || isInfinitePay ? 'paid' : 
    (appointmentId ? 'checking' : 'pending')
  );

  useEffect(() => {
    if (!appointmentId || isFree || isInfinitePay) return;

    let attempts = 0;
    const maxAttempts = 15; // 30 seconds total (every 2s)

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status/${appointmentId}`);
        const data = await res.json();
        
        if (data.payment_status === 'Pago' || data.status === 'Confirmado') {
          setStatus('paid');
          return true; // stop polling
        }
      } catch (err) {
        console.error('Status check error', err);
      }
      return false; // continue polling
    };

    const interval = setInterval(async () => {
      attempts++;
      const isPaid = await checkStatus();
      
      if (isPaid || attempts >= maxAttempts) {
        clearInterval(interval);
        if (!isPaid && attempts >= maxAttempts) {
          setStatus('pending');
        }
      }
    }, 2000);

    // Initial check
    checkStatus();

    return () => clearInterval(interval);
  }, [appointmentId, isFree]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0d8d0] p-4 md:p-8 font-sans flex items-center justify-center">
      <div className="max-w-lg w-full bg-[#151619] border border-[#3a3a3a] rounded-[40px] p-8 shadow-2xl text-center">
        {status === 'checking' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8 relative"
            >
              <div className="absolute inset-0 rounded-full border-4 border-accent/30 border-t-accent animate-spin" />
              <Clock size={40} className="text-accent" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-serif italic text-accent mb-4">
              Verificando Pagamento
            </h1>
            <p className="text-[#8e9299] mb-8">
              Aguardando a confirmação do pagamento... Isso pode demorar alguns instantes.
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <AlertCircle size={48} className="text-accent" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-serif italic text-accent mb-4">
              Agendamento Solicitado
            </h1>
            <p className="text-[#8e9299] mb-8">
              Sua solicitação de agendamento {serviceName ? `para ${serviceName}` : ''} foi recebida, mas o pagamento ainda não foi processado.
              Ele entrará na fila de aprovação assim que o valor for identificado.
            </p>
          </>
        )}

        {status === 'paid' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle size={48} className="text-success" />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-serif italic text-accent mb-4 text-[#c5a059]">
              {isFree || isInfinitePay ? 'Agendamento Recebido!' : 'Pagamento Confirmado!'}
            </h1>
            <p className="text-[#8e9299] mb-8">
              Skål! {isFree || isInfinitePay ? 'Seu agendamento foi recebido com sucesso' : 'Seu pagamento foi processado com sucesso'} e sua reserva foi enviada para o clã.
            </p>
            {isInfinitePay && (
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest -mt-4 mb-8 border border-white/5 p-4 rounded-2xl bg-white/5">
                Nota: O pagamento via InfinitePay é processado manualmente. Assim que o valor for identificado em nosso sistema, seu status será atualizado.
              </p>
            )}
          </>
        )}

        {status !== 'checking' && (
          <div className="bg-[#0a0a0a] border border-[#3a3a3a] rounded-3xl p-6 mb-8 text-left space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Missão Cumprida</h4>
                <p className="text-xs text-[#8e9299] mt-1">
                  Não é necessário fazer mais nada. Mantenha seu WhatsApp por perto para receber a confirmação final do profissional.
                </p>
              </div>
            </div>
          </div>
        )}

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#c5a059] text-black rounded-2xl font-bold hover:bg-[#b08d4a] transition-all"
        >
          Voltar ao Início <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
