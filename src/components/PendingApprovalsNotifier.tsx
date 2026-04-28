import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { Check, X, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const PendingApprovalsNotifier = () => {
  const { appointments, updateAppointment } = useData();
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pending = appointments.filter(
      a => a.approvalStatus === 'Pendente' || a.approvalStatus === 'Aguardando Pagamento'
    );

    pending.forEach(appt => {
      if (!notifiedIds.current.has(appt.id)) {
        notifiedIds.current.add(appt.id);
        
        const isAwaitingPayment = appt.approvalStatus === 'Aguardando Pagamento';
        
        toast.custom((t) => (
          <div className="bg-[#151619] border border-white/10 rounded-2xl p-4 shadow-2xl w-[350px] animate-in slide-in-from-right duration-300">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAwaitingPayment ? 'bg-yellow-500/20 text-yellow-500' : 'bg-primary/20 text-primary'}`}>
                <Calendar size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  Novo Agendamento {isAwaitingPayment ? '(Pagamento Pendente)' : ''}
                </h3>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <User size={12} /> {appt.clientName}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} /> {(() => {
                    try {
                      const [year, month, day] = appt.date.split('-').map(Number);
                      const d = new Date(year, month - 1, day);
                      if (isNaN(d.getTime())) return appt.date;
                      return format(d, "dd 'de' MMMM", { locale: ptBR });
                    } catch (e) {
                      return appt.date;
                    }
                  })()} às {appt.time}
                </p>
                <p className="text-[10px] text-gray-500 mt-1 italic">
                  Serviço: {appt.service}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateAppointment(appt.id, { approvalStatus: 'Aprovado', status: 'Confirmado' });
                  toast.dismiss(t);
                }}
                className="flex-1 h-9 bg-primary text-black text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <Check size={14} /> Aprovar
              </button>
              <button
                onClick={() => {
                  updateAppointment(appt.id, { approvalStatus: 'Reprovado', status: 'Cancelado' });
                  toast.dismiss(t);
                }}
                className="flex-1 h-9 bg-white/5 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <X size={14} /> Rejeitar
              </button>
            </div>
          </div>
        ), {
          duration: Infinity,
          id: `pending-${appt.id}`,
        });
      }
    });

    // Clean up notifiedIds for appointments that are no longer pending
    const currentPendingIds = new Set(pending.map(a => a.id));
    notifiedIds.current.forEach(id => {
      if (!currentPendingIds.has(id)) {
        notifiedIds.current.delete(id);
        toast.dismiss(`pending-${id}`);
      }
    });
  }, [appointments, updateAppointment]);

  return null;
};
