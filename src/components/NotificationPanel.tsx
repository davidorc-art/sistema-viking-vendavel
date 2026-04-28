import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  X, 
  MessageCircle, 
  Clock, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { Appointment } from '../types';
import { openWhatsApp } from '../utils/whatsapp';
import { parseISO } from 'date-fns';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type NotificationType = 'FollowUp' | 'NewBooking' | 'RewardRedemption' | 'Reschedule';

interface BaseNotification {
  id: string;
  type: NotificationType;
  date: string; // for sorting
}

interface FollowUpNotification extends BaseNotification {
  type: 'FollowUp';
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  service: string;
  daysPassed: number;
  serviceType: 'Tattoo' | 'Piercing';
}

interface RescheduleNotification extends BaseNotification {
  type: 'Reschedule';
  appointmentId: string;
  clientName: string;
  service: string;
  appointmentDate: string;
  appointmentTime: string;
  rescheduledAt: string;
}

interface NewBookingNotification extends BaseNotification {
  type: 'NewBooking';
  appointmentId: string;
  clientName: string;
  service: string;
  value: number;
  appointmentDate: string;
  appointmentTime: string;
  isPaid: boolean;
}

interface RewardRedemptionNotification extends BaseNotification {
  type: 'RewardRedemption';
  clientId: string;
  clientName: string;
  rewardTitle: string;
  points: number;
}

type AppNotification = FollowUpNotification | NewBookingNotification | RewardRedemptionNotification | RescheduleNotification;

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { appointments, clients, loyaltyTransactions, dismissedNotifications, dismissNotification, markAsViewed } = useData();
  const navigate = useNavigate();

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allNotifs: AppNotification[] = [];

    // Follow-ups
    appointments.filter(a => a.status === 'Finalizado').forEach(appt => {
      if (!appt.date) return;
      const [year, month, day] = appt.date.split('-').map(Number);
      const apptDate = new Date(year, month - 1, day);
      apptDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - apptDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const isPiercing = appt.service.toLowerCase().includes('piercing');
      const isTattoo = !isPiercing; // Default to tattoo if not piercing

      const client = clients.find(c => c.id === appt.clientId);
      if (!client) return;

      let shouldNotify = false;
      if (isTattoo) {
        if ([1, 7, 15].includes(diffDays)) shouldNotify = true;
      } else {
        if ([7, 30].includes(diffDays)) shouldNotify = true;
      }

      if (shouldNotify) {
        const id = `${appt.id}-followup-${diffDays}`;
        if (!dismissedNotifications.includes(id)) {
          allNotifs.push({
            id,
            type: 'FollowUp',
            appointmentId: appt.id,
            clientName: appt.clientName,
            clientPhone: client.phone,
            service: appt.service,
            daysPassed: diffDays,
            serviceType: isTattoo ? 'Tattoo' : 'Piercing',
            date: appt.date
          });
        }
      }
    });

    // New Bookings (Paid via link) or Pending Requests
    appointments.forEach(appt => {
      // 1. Paid online bookings
      if (appt.paymentStatus === 'Pago' && appt.paymentUrl) {
        const id = `new-booking-${appt.id}`;
        if (!dismissedNotifications.includes(id)) {
          allNotifs.push({
            id,
            type: 'NewBooking',
            appointmentId: appt.id,
            clientName: appt.clientName,
            service: appt.service,
            value: appt.value,
            appointmentDate: appt.date,
            appointmentTime: appt.time,
            date: appt.date,
            isPaid: true
          });
        }
      }
      
      // 2. Pending Requests (Solicitações)
      if (appt.approvalStatus === 'Pendente' || appt.approvalStatus === 'Aguardando Pagamento') {
        const id = `pending-req-${appt.id}`;
        if (!dismissedNotifications.includes(id)) {
          allNotifs.push({
            id,
            type: 'NewBooking',
            appointmentId: appt.id,
            clientName: appt.clientName,
            service: appt.service,
            value: appt.value,
            appointmentDate: appt.date,
            appointmentTime: appt.time,
            date: appt.date,
            isPaid: appt.paymentStatus === 'Pago'
          });
        }
      }

      // 3. Reschedules
      if (appt.rescheduledAt) {
        const resDate = new Date(appt.rescheduledAt);
        const timeDiff = today.getTime() - resDate.getTime();
        const diffDays = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        // Show if rescheduled within the last 7 days
        if (diffDays <= 7) {
          const id = `reschedule-${appt.id}-${appt.rescheduledAt}`;
          if (!dismissedNotifications.includes(id)) {
            allNotifs.push({
              id,
              type: 'Reschedule',
              appointmentId: appt.id,
              clientName: appt.clientName,
              service: appt.service,
              appointmentDate: appt.date,
              appointmentTime: appt.time,
              rescheduledAt: appt.rescheduledAt,
              date: appt.rescheduledAt // Use reschedule date for sorting
            });
          }
        }
      }
    });

    // Reward Redemptions
    const recentRewards = loyaltyTransactions.filter(t => 
      t.type === 'Resgate' && 
      (t.description.startsWith('Resgate de Recompensa') || t.description.includes('Recompensa')) 
    );

    recentRewards.forEach(t => {
      // Only show if redemptions happened within the last 7 days
      const txDate = parseISO(t.date || new Date().toISOString());
      const txDiffDays = Math.round((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (txDiffDays <= 7) {
        const id = `reward-${t.id}`;
        if (!dismissedNotifications.includes(id)) {
          const client = clients.find(c => c.id === t.clientId);
          if (client) {
            allNotifs.push({
              id,
              type: 'RewardRedemption',
              clientId: client.id,
              clientName: client.name,
              rewardTitle: t.description.replace('Resgate de Recompensa: ', '').replace('Resgate: ', ''),
              points: t.points,
              date: t.date || new Date().toISOString()
            });
          }
        }
      }
    });

    return allNotifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments, clients, loyaltyTransactions, dismissedNotifications]);

  React.useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const ids = notifications.map(n => n.id);
      markAsViewed(ids);
    }
  }, [isOpen, notifications, markAsViewed]);

  const getVikingMessage = (notif: FollowUpNotification) => {
    const { serviceType, daysPassed, clientName } = notif;
    
    if (serviceType === 'Tattoo') {
      if (daysPassed === 1) return `Saudações, guerreiro(a) ${clientName}! 🛡️⚔️ Como está a cicatrização da sua nova marca de batalha neste primeiro dia? Lembre-se de manter a limpeza e seguir as ordens do mestre tatuador. Que os deuses guiem sua cura! 🦅`;
      if (daysPassed === 7) return `Pelos martelos de Thor! ⚡ Já se passaram 7 sóis desde sua tatuagem, ${clientName}. Como ela está se revelando? Continue cuidando bem dela para que brilhe em Valhalla! 🍻`;
      if (daysPassed === 15) return `Skål, ${clientName}! 🍻 Sua tatuagem deve estar quase pronta para ser exibida nos grandes salões. Tudo certo com a cicatrização final? Se precisar de algo, nosso clã está aqui! 🐺`;
    } else {
      if (daysPassed === 7) return `Salve, explorador(a) ${clientName}! ⚔️ Uma semana com seu novo adorno. Como está a adaptação? Mantenha a guarda alta na limpeza para evitar invasores indesejados! 🛡️`;
      if (daysPassed === 30) return `Vitória, ${clientName}! 🏆 Um mês de conquista com seu novo piercing. Já está na hora de fazer o downsize (troca da haste por uma menor) para garantir a cicatrização perfeita. Vamos agendar seu retorno? Que Odin abençoe seu caminho! 🦅`;
    }
    return `Saudações, ${clientName}! ⚔️ Como está seu procedimento de ${serviceType}?`;
  };

  const handleWhatsApp = (notif: FollowUpNotification) => {
    const message = getVikingMessage(notif);
    const phone = notif.clientPhone.replace(/\D/g, '');
    openWhatsApp(`55${phone}`, message);
    dismissNotification(notif.id);
  };

  const handleViewAppointment = (notif: NewBookingNotification) => {
    dismissNotification(notif.id);
    onClose();
    // Navigate to Agenda and pass the date to open the correct day
    navigate(`/agenda?date=${notif.appointmentDate}&highlight=${notif.appointmentId}`);
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-[110] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Notificações</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Avisos do Sistema</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                    <ShieldCheck size={32} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-400">Nenhum alerta hoje</p>
                    <p className="text-xs text-gray-500">Seu clã está em paz e bem cuidado.</p>
                  </div>
                </div>
              ) : (
                notifications.map((notif) => {
                  if (notif.type === 'NewBooking') {
                    return (
                      <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 border rounded-2xl space-y-3 group transition-colors",
                          notif.isPaid 
                            ? "bg-success/10 border-success/20 hover:border-success/40" 
                            : "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                              notif.isPaid ? "bg-success/20 text-success" : "bg-orange-500/20 text-orange-500"
                            )}>
                              {notif.isPaid ? <CreditCard size={10} /> : <Clock size={10} />}
                              {notif.isPaid ? 'Novo Agendamento Pago' : 'Nova Solicitação'}
                            </span>
                          </div>
                          <button 
                            onClick={() => dismissNotification(notif.id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                            title="Ocultar"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-bold text-white">{notif.clientName}</h4>
                          <p className="text-xs text-gray-400 mt-1">{notif.service}</p>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">{notif.isPaid ? 'Valor Pago:' : 'Valor do Serviço:'}</span>
                            <span className={cn("font-bold", notif.isPaid ? "text-success" : "text-white")}>
                              R$ {notif.value.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Data:</span>
                            <span className="font-bold text-white">
                              {new Date(notif.appointmentDate).toLocaleDateString('pt-BR')} às {notif.appointmentTime}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleViewAppointment(notif)}
                          className={cn(
                            "w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2",
                            notif.isPaid 
                              ? "bg-success/20 hover:bg-success/30 text-success" 
                              : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-500"
                          )}
                        >
                          {notif.isPaid ? 'Ver na Agenda' : 'Gerenciar Solicitação'}
                          <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    );
                  }

                  // Reschedule Notification
                  if (notif.type === 'Reschedule') {
                    return (
                      <motion.div 
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-accent/10 border border-accent/20 rounded-2xl space-y-3 group hover:border-accent/40 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-accent/20 text-accent">
                              <Calendar size={10} />
                              Reagendamento
                            </span>
                          </div>
                          <button 
                            onClick={() => dismissNotification(notif.id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                            title="Ocultar"
                          >
                            <X size={12} />
                          </button>
                        </div>

                        <div>
                          <h4 className="font-bold text-white">{notif.clientName}</h4>
                          <p className="text-xs text-gray-400 mt-1">{notif.service}</p>
                        </div>

                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-sm text-gray-300">
                            Novo horário: <span className="font-bold text-white">{new Date(notif.appointmentDate).toLocaleDateString('pt-BR')} às {notif.appointmentTime}</span>
                          </p>
                        </div>

                        <button 
                          onClick={() => {
                            dismissNotification(notif.id);
                            onClose();
                            navigate(`/agenda?date=${notif.appointmentDate}&highlight=${notif.appointmentId}`);
                          }}
                          className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 bg-accent/20 hover:bg-accent/30 text-accent"
                        >
                          Ver na Agenda
                          <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    );
                  }

                  // Reward Redemption Notification
                  if (notif.type === 'RewardRedemption') {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={notif.id} 
                        className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                              <ShieldCheck size={20} />
                            </div>
                            <div>
                              <h3 className="font-bold">Resgate de Recompensa</h3>
                              <p className="text-xs text-gray-400">Há pouco • Studio foi notificado</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => dismissNotification(notif.id)}
                            className="p-1 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                          <p className="text-sm">
                            <span className="font-bold text-white">{notif.clientName}</span> resgatou:
                          </p>
                          <p className="text-sm font-bold text-primary">{notif.rewardTitle}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Utilizou {notif.points} pontos. Um pré-agendamento foi criado no calendário.
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            dismissNotification(notif.id);
                            navigate('/agendamentos');
                            onClose();
                          }}
                          className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          Ver Agendamento <ArrowRight size={14} />
                        </button>
                      </motion.div>
                    );
                  }
                  
                  // FollowUp Notification
                  return (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3 group hover:border-primary/30 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            notif.serviceType === 'Tattoo' ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                          )}>
                            {notif.serviceType}
                          </span>
                          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
                            {notif.daysPassed} {notif.daysPassed === 1 ? 'Dia' : 'Dias'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500">{new Date(notif.date).toLocaleDateString('pt-BR')}</span>
                          <button 
                            onClick={() => dismissNotification(notif.id)}
                            className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                            title="Ocultar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-white">{notif.clientName}</h4>
                        <p className="text-xs text-gray-400 mt-1">{notif.service}</p>
                      </div>

                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-400 italic leading-relaxed">
                          "{getVikingMessage(notif).substring(0, 80)}..."
                        </p>
                      </div>

                      <button 
                        onClick={() => handleWhatsApp(notif)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-success rounded-xl text-black font-bold text-xs hover:scale-[1.02] transition-transform"
                      >
                        <MessageCircle size={16} /> Enviar Mensagem Viking
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <Clock size={12} />
                <span>Próxima verificação em 24h</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
