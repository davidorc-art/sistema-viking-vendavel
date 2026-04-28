import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const SubscriptionBlock = () => {
  const { subscription, signOut, user } = useAuth();
  
  const isTrialFinished = subscription?.status === 'trialing' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date();
  const isExpired = subscription?.status === 'canceled' || subscription?.status === 'past_due' || subscription?.status === 'unpaid' || isTrialFinished;

  if (!isExpired) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full bg-card/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
            <Lock className="w-10 h-10 text-primary" />
            <div className="absolute -bottom-2 -right-2 bg-destructive border border-black text-white w-8 h-8 rounded-full flex items-center justify-center">
              !
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-heading font-bold text-center mb-2">
          {isTrialFinished ? 'Seu período de teste acabou' : 'Assinatura Pendente'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          Para continuar usando o sistema com todos os recursos liberados, assine por apenas <strong className="text-white">R$ 70/mês</strong>.
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span>Gestão completa de horários e financeiro</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span>Controle total de estoque automático</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <CheckCircle className="w-5 h-5 text-primary" />
            <span>Página online para seus clientes</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark hover:brightness-110 text-white font-bold py-4 px-6 rounded-xl transition-all"
            onClick={() => {
              const planId = import.meta.env.VITE_MP_PLAN_ID || 'VOSSO_PLAN_ID';
              const mpUrl = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${planId}&external_reference=${user?.id}`;
              window.open(mpUrl, '_blank');
            }}
          >
            <CreditCard className="w-5 h-5" />
            Assinar Agora (Mercado Pago)
          </button>
          
          <button 
            onClick={signOut}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors text-sm"
          >
            Sair da conta
          </button>
        </div>
      </motion.div>
    </div>
  );
};
