import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Transaction } from '../types';

interface CashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactions: Transaction[];
  initialBalance: number;
}

export const CashierModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transactions, 
  initialBalance 
}: CashierModalProps) => {
  const totalIncome = transactions
    .filter(t => t.type === 'Receita')
    .reduce((acc, curr) => acc + curr.value, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Despesa')
    .reduce((acc, curr) => acc + curr.value, 0);

  const netBalance = totalIncome - totalExpense;

  const pixTotal = transactions
    .filter(t => t.method === 'Pix')
    .reduce((acc, curr) => acc + curr.value, 0);

  const cardTotal = transactions
    .filter(t => t.method.includes('Cartão'))
    .reduce((acc, curr) => acc + curr.value, 0);

  const cashTotal = transactions
    .filter(t => t.method === 'Dinheiro')
    .reduce((acc, curr) => acc + curr.value, 0);

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
              <h2 className="text-xl font-bold">Fechar Caixa</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Summary */}
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                  <span className="text-sm text-gray-400">Saldo Inicial</span>
                  <span className="font-bold">R$ {initialBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-success/10 rounded-2xl text-success">
                  <span className="text-sm font-bold">Total Entradas</span>
                  <span className="font-bold">R$ {totalIncome.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-2xl text-destructive">
                  <span className="text-sm font-bold">Total Saídas</span>
                  <span className="font-bold">R$ {totalExpense.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-primary/10 rounded-3xl border border-primary/20">
                  <span className="text-lg font-bold text-primary">Saldo Final</span>
                  <span className="text-2xl font-bold text-primary">R$ {(initialBalance + netBalance).toFixed(2)}</span>
                </div>
              </div>

              {/* Method Breakdown */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Por Meio de Pagamento</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">PIX</p>
                    <p className="text-lg font-bold">R$ {pixTotal.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Cartão</p>
                    <p className="text-lg font-bold">R$ {cardTotal.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Dinheiro</p>
                    <p className="text-lg font-bold">R$ {cashTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  onClick={onConfirm}
                  className="w-full py-4 bg-destructive rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(239,68,68,0.2)] hover:scale-[1.02] transition-transform"
                >
                  Confirmar Fechamento
                </button>
                <p className="text-[10px] text-gray-500 text-center px-8">
                  Ao fechar o caixa, um relatório será enviado para o e-mail do administrador.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
