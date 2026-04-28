import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Scissors, DollarSign, CreditCard, Wallet, User, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Appointment } from '../types';
import { cn } from '../lib/utils';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAppointment?: Appointment | null;
}

export const NewSaleModal = ({ 
  isOpen, 
  onClose, 
  initialAppointment 
}: NewSaleModalProps) => {
  const { appointments, transactions, addTransaction, updateAppointment } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Dinheiro');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialAppointment) {
      const calculatedPaidValue = transactions
        .filter(t => t.appointmentId === initialAppointment.id && t.status === 'Pago')
        .reduce((sum, t) => sum + t.value, 0);
        
      setSelectedAppointment(initialAppointment);
      setPaymentAmount((initialAppointment.value - calculatedPaidValue).toString());
    } else if (!isOpen) {
      setSelectedAppointment(null);
      setPaymentAmount('');
      setSearchTerm('');
      setLoading(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialAppointment, transactions]);

  const pendingAppointments = appointments.filter(a => {
    const isNotCancelled = a.status !== 'Cancelado';
    const isNotFinalized = a.status !== 'Finalizado';
    const isNotPaid = a.paymentStatus !== 'Pago';
    const calculatedPaidValue = transactions
      .filter(t => t.appointmentId === a.id && t.status === 'Pago')
      .reduce((sum, t) => sum + t.value, 0);
      
    const totalValue = a.totalValue || a.value;
    const isNotFullyPaid = calculatedPaidValue < totalValue;
    
    const matchesSearch = (a.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                         (a.service?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const isNotReprovado = a.approvalStatus !== 'Reprovado';
    return isNotCancelled && isNotFullyPaid && matchesSearch && isNotReprovado;
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
    const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();
    return dateA - dateB;
  });

  const handleSelectAppointment = (appt: Appointment) => {
    const calculatedPaidValue = transactions
      .filter(t => t.appointmentId === appt.id && t.status === 'Pago')
      .reduce((sum, t) => sum + t.value, 0);
      
    const totalValue = appt.totalValue || appt.value;
    setSelectedAppointment(appt);
    setPaymentAmount((totalValue - calculatedPaidValue).toString());
  };

  const handleProcessPayment = async () => {
    setErrorMsg(null);
    const parsedAmount = parseFloat(paymentAmount.replace(',', '.'));
    if (loading || !selectedAppointment || !paymentAmount || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setLoading(true);
    try {
      const currentAppt = appointments.find(a => a.id === selectedAppointment.id);
      if (!currentAppt) {
        onClose();
        return;
      }

      const amount = parsedAmount;
      const calculatedPaidValue = transactions
        .filter(t => t.appointmentId === currentAppt.id && t.status === 'Pago')
        .reduce((sum, t) => sum + t.value, 0);
        
      const totalValue = currentAppt.totalValue || currentAppt.value;
      
      if (calculatedPaidValue >= totalValue) {
        onClose();
        return;
      }

      const newPaidValue = calculatedPaidValue + amount;
      const newStatus = newPaidValue >= totalValue ? 'Finalizado' : currentAppt.status;

      await addTransaction({
        description: `Pagamento: ${currentAppt.service} - ${currentAppt.clientName}`,
        value: amount,
        type: 'Receita',
        category: 'Serviços',
        date: new Date().toISOString().split('T')[0],
        status: 'Pago',
        method: paymentMethod,
        appointmentId: currentAppt.id
      });

      await updateAppointment(currentAppt.id, {
        status: newStatus as any,
        paymentStatus: newPaidValue >= totalValue ? 'Pago' : currentAppt.paymentStatus
      });

      if (newStatus === 'Finalizado') {
        onClose();
        setSelectedAppointment(null);
        setPaymentAmount('');
        setSearchTerm('');
      } else {
        const updatedAppointment = {
          ...currentAppt,
          status: newStatus as any
        };
        setSelectedAppointment(updatedAppointment);
        setPaymentAmount((totalValue - newPaidValue).toFixed(2));
      }
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      setErrorMsg(error.message || 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[90vh] bg-card border border-white/10 rounded-[40px] z-[70] p-8 overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold italic uppercase tracking-tight">Receber Agendamento</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            {!selectedAppointment ? (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input 
                    type="text"
                    placeholder="Buscar por cliente ou serviço..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:border-primary/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Agendamentos Pendentes</p>
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {pendingAppointments.map(appt => {
                      const calculatedPaidValue = transactions
                        .filter(t => t.appointmentId === appt.id && t.status === 'Pago')
                        .reduce((sum, t) => sum + t.value, 0);
                      return (
                      <button 
                        key={appt.id}
                        onClick={() => handleSelectAppointment(appt)}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <Scissors size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{appt.clientName}</p>
                            <p className="text-xs text-gray-500">{appt.service} • {appt.date} às {appt.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">R$ {(appt.totalValue || appt.value).toFixed(2)}</p>
                          {calculatedPaidValue > 0 && (
                            <p className="text-[10px] text-success font-bold uppercase tracking-widest">Pago: R$ {calculatedPaidValue.toFixed(2)}</p>
                          )}
                        </div>
                      </button>
                    )})}
                    {pendingAppointments.length === 0 && (
                      <div className="py-12 text-center text-gray-500">
                        <AlertCircle size={40} className="mx-auto mb-4 opacity-20" />
                        <p className="text-sm font-medium">Nenhum agendamento pendente encontrado.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
                      <User size={24} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{selectedAppointment.clientName}</p>
                      <p className="text-sm text-primary/70 font-medium">{selectedAppointment.service}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedAppointment(null)}
                    className="text-xs font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    Alterar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Valor Total</p>
                    <p className="text-xl font-bold">R$ {(selectedAppointment.totalValue || selectedAppointment.value).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Restante</p>
                    <p className="text-xl font-bold text-primary">R$ {((selectedAppointment.totalValue || selectedAppointment.value) - transactions.filter(t => t.appointmentId === selectedAppointment.id && t.status === 'Pago').reduce((sum, t) => sum + t.value, 0)).toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Valor a Receber</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-primary">R$</span>
                      <input 
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-3xl py-6 pl-14 pr-8 text-2xl font-bold focus:border-primary/50 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Meio de Pagamento</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Dinheiro', 'Pix', 'Cartão'] as const).map(method => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={cn(
                            "py-4 rounded-2xl font-bold text-sm border transition-all flex flex-col items-center gap-2",
                            paymentMethod === method 
                              ? "bg-primary border-primary text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]" 
                              : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          {method === 'Pix' ? <DollarSign size={20} /> : method === 'Cartão' ? <CreditCard size={20} /> : <Wallet size={20} />}
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleProcessPayment}
                    disabled={loading || !paymentAmount || isNaN(parseFloat(paymentAmount.replace(',', '.'))) || parseFloat(paymentAmount.replace(',', '.')) <= 0}
                    className="w-full py-6 bg-success rounded-[32px] text-white font-bold text-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                    Confirmar Recebimento
                  </button>

                  <button 
                    onClick={() => {
                      const baseUrl = window.location.origin;
                      const link = `${baseUrl}/pagamento/${selectedAppointment.id}?amount=${paymentAmount}`;
                      navigator.clipboard.writeText(link);
                      alert("Link de pagamento (R$ " + paymentAmount + ") copiado com sucesso!");
                    }}
                    disabled={!paymentAmount || isNaN(parseFloat(paymentAmount.replace(',', '.'))) || parseFloat(paymentAmount.replace(',', '.')) <= 0}
                    className="w-full py-4 bg-orange-500/10 border border-orange-500/30 rounded-[32px] text-orange-500 font-bold text-sm hover:bg-orange-500 hover:text-black transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={18} />
                    Gerar e Copiar Link de Pagamento
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
