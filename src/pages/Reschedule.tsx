import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Appointment, Professional } from '../types';

export default function Reschedule() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { appointments, professionals, updateAppointment, blockedTimes, isSyncing, setAppointments } = useData();
  
  const [localAppointment, setLocalAppointment] = useState<Appointment | undefined>(
    appointments.find(a => a.id === appointmentId)
  );
  const [localProfessional, setLocalProfessional] = useState<Professional | undefined>(
    professionals.find(p => p.id === localAppointment?.professionalId)
  );
  const [isLoading, setIsLoading] = useState(!localAppointment);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfessional = async (profId: string) => {
      if (!profId) return;
      try {
        const { data, error } = await supabase
          .from('professionals')
          .select('*')
          .eq('id', profId)
          .maybeSingle();
          
        if (!error && data && isMounted) {
          const sanitizedProf: Professional = {
            id: String(data.id || ''),
            name: String(data.name || 'Sem Nome'),
            role: String(data.role || 'Profissional'),
            specialty: Array.isArray(data.specialty) ? data.specialty.map(String) : ['Geral'],
            rating: Number(data.rating || 5),
            reviewCount: Number(data.reviewCount || data.review_count || 0),
            imageUrl: String(data.imageUrl || data.image_url || data.foto || ''),
            workingHours: typeof data.workingHours === 'object' ? data.workingHours : 
                         (typeof data.working_hours === 'object' ? data.working_hours : {}),
            services: Array.isArray(data.services) ? data.services.map(String) : [],
            signature: String(data.signature || data.assinatura || ''),
            status: (data.status || 'Disponível') as any,
            commission: Number(data.commission || 0)
          };
          setLocalProfessional(sanitizedProf);
        } else if (isMounted) {
          setFetchError(error?.message || 'Profissional não encontrado no banco de dados.');
        }
      } catch (err: any) {
        console.error('Reschedule: Error fetching professional:', err);
        if (isMounted) setFetchError(err.message);
      }
    };

    const syncAppointment = async () => {
      if (!appointmentId) {
        setIsLoading(false);
        return;
      }

      // 1. Try to find in context
      const found = appointments.find(a => a.id === appointmentId);
      if (found) {
        if (isMounted) {
          setLocalAppointment(found);
          
          const profInContext = professionals.find(p => p.id === found.professionalId);
          if (profInContext) {
            setLocalProfessional(profInContext);
          } else {
            await fetchProfessional(found.professionalId);
          }
          
          setIsLoading(false);
        }
        return;
      }

      // 2. If not found and not syncing, try to fetch from Supabase
      if (!isSyncing) {
        try {
          if (isMounted) setIsLoading(true);
          
          const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .maybeSingle();
            
          if (isMounted && data) {
            // Manually sanitize to match DataContext logic
            const sanitizedAppt: Appointment = {
              id: String(data.id || ''),
              clientId: String(data.clientId || data.clientid || data.client_id || ''),
              clientName: String(data.clientName || data.clientname || data.nomeCliente || data.cliente || data.client_name || 'Cliente'),
              professionalId: String(data.professionalId || data.professionalid || data.professional_id || data.profissionalId || data.profissional_id || ''),
              professionalName: String(data.professionalName || data.professionalname || data.nomeProfissional || data.profissional || data.professional_name || 'Profissional'),
              service: String(data.service || data.servico || data.descricao_servico || data.descricao || 'Serviço'),
              date: String(data.date || data.data || data.dados || '').split('T')[0],
              time: String(data.time || data.hora || data.hora_inicio || '00:00').substring(0, 5),
              status: (['Confirmado', 'Pendente', 'Finalizado', 'Cancelado', 'Falta'].includes(data.status) ? data.status : 
                       (data.status === 'concluido' ? 'Finalizado' : 'Confirmado')) as any,
              approvalStatus: (['Pendente', 'Aprovado', 'Reprovado'].includes(data.approvalStatus) ? data.approvalStatus : 'Pendente') as any,
              value: Number(data.value || data.valor || data.valor_total || data.total_value || 0),
              paidValue: Number(data.paidValue || data.valorPago || data.valor_pago || 0),
              duration: Number(data.duration || data.duracao || data.tempo || 60),
              consentSent: Boolean(data.consentSent || data.consent_signed),
              consentSigned: Boolean(data.consentSigned || data.consent_signed),
              consentData: data.consentData || data.consent_data || null
            };
            
            setLocalAppointment(sanitizedAppt);
            
            const profInContext = professionals.find(p => p.id === sanitizedAppt.professionalId);
            if (profInContext) {
              setLocalProfessional(profInContext);
            } else {
              await fetchProfessional(sanitizedAppt.professionalId);
            }
            
            setAppointments(prev => {
              if (prev.find(a => a.id === sanitizedAppt.id)) return prev;
              return [...prev, sanitizedAppt];
            });
          } else if (isMounted) {
            setFetchError(error?.message || 'Agendamento não encontrado no banco de dados.');
          }
        } catch (err: any) {
          if (isMounted) setFetchError(err.message);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };

    syncAppointment();
    return () => { isMounted = false; };
  }, [appointmentId, appointments, professionals, isSyncing, setAppointments]);

  const appointment = localAppointment;
  const professional = localProfessional || professionals.find(p => p.id === appointment?.professionalId);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (appointment) {
      setDate(appointment.date);
      setTime(appointment.time || '');
    }
  }, [appointment]);

  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const availableTimes = useMemo(() => {
    if (!date || !professional) return [];
    
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDayName = dayNames[dayOfWeek];

    let startHour = 10;
    let endHour = 20;
    let isActive = true;

    // Use professional's working hours if available
    if (professional.workingHours && professional.workingHours[currentDayName]) {
      const wh = professional.workingHours[currentDayName];
      if (wh.active === false) {
        isActive = false;
      } else {
        if (wh.start) startHour = parseInt(wh.start.split(':')[0]);
        if (wh.end) endHour = parseInt(wh.end.split(':')[0]);
      }
    } else {
      // Default fallback
      if (dayOfWeek === 0) { // Sunday
        startHour = 12; endHour = 18;
      }
    }

    if (!isActive) return [];

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    const duration = appointment?.duration || 60;

    const occupiedSlots = appointments
      .filter(a => 
        a.date === date && 
        a.professionalId === professional.id && 
        a.status !== 'Cancelado' && 
        a.approvalStatus !== 'Reprovado' &&
        a.id !== appointment?.id
      )
      .map(a => ({
        start: timeToMinutes(a.time),
        end: timeToMinutes(a.time) + (a.duration || 60)
      }));
      
    const currentSelectedDate = new Date(date + 'T00:00:00');
    const blockedSlots = blockedTimes
      .filter(bt => {
        if (bt.professionalId !== professional.id && bt.professionalId !== 'all') return false;
        
        const btDate = new Date(bt.date + 'T00:00:00');
        
        // Check recurrence
        if (bt.recurrence === 'daily') {
          return btDate <= currentSelectedDate;
        }
        if (bt.recurrence === 'weekly') {
          return btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
        }
        if (bt.recurrence === 'monthly') {
          return btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
        }
        
        return bt.date === date;
      })
      .map(bt => ({
        start: timeToMinutes(bt.time),
        end: timeToMinutes(bt.time) + bt.duration
      }));

    return slots.filter(slot => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + duration;
      
      for (const occupied of occupiedSlots) {
        if ((slotStart < occupied.end) && (slotEnd > occupied.start)) {
          return false;
        }
      }

      for (const blocked of blockedSlots) {
        if ((slotStart < blocked.end) && (slotEnd > blocked.start)) {
          return false;
        }
      }

      return true;
    });
  }, [date, professional, appointments, blockedTimes, appointment]);

  if (isLoading || isSyncing) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="mx-auto text-primary animate-spin" />
          <h2 className="text-xl font-bold">Carregando agendamento...</h2>
        </div>
      </div>
    );
  }

  console.log('Reschedule Render: appointment=', appointment, 'professional=', professional, 'fetchError=', fetchError);

  if (!appointment || !professional) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="text-xl font-bold">Agendamento não encontrado</h2>
          <p className="text-gray-400">O link pode ter expirado ou estar incorreto.</p>
          {fetchError && <p className="text-red-400 text-sm mt-2">{fetchError}</p>}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setErrorMsg('Por favor, selecione uma nova data e horário.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // Fetch latest blocked times and appointments to prevent double booking
      const { data: latestBlockedTimes } = await supabase.from('blocked_times').select('*').or(`professional_id.eq.${professional.id},professional_id.eq.all`);
      const { data: latestAppointments } = await supabase.from('appointments').select('*, approval_status').eq('professional_id', professional.id);
      
      const currentBlockedTimes = latestBlockedTimes ? latestBlockedTimes.map(b => {
        let recurrence = 'none';
        let reason = String(b.reason || '');
        const recMatch = reason.match(/\[REC:(none|daily|weekly|monthly)\]/);
        if (recMatch) {
          recurrence = recMatch[1];
          reason = reason.replace(/\[REC:(none|daily|weekly|monthly)\]/g, '').trim();
        }
        return {
          id: String(b.id),
          professionalId: String(b.professional_id || b.professionalid || ''),
          professionalName: String(b.professional_name || b.professionalname || ''),
          date: String(b.date || '').split('T')[0],
          time: String(b.time || '00:00').substring(0, 5),
          duration: Number(b.duration || 60),
          reason: reason,
          recurrence: (['none', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : 'none') as any
        };
      }) : blockedTimes;

      const currentAppointments = latestAppointments ? latestAppointments.map(a => ({
        id: String(a.id),
        clientId: String(a.client_id || a.clientid || ''),
        clientName: String(a.client_name || a.clientname || ''),
        professionalId: String(a.professional_id || a.professionalid || ''),
        professionalName: String(a.professional_name || a.professionalname || ''),
        service: String(a.service || a.servico || ''),
        date: String(a.date || a.data || '').split('T')[0],
        time: String(a.time || a.hora || '00:00').substring(0, 5),
        status: String(a.status || 'Pendente') as any,
        approvalStatus: (a.approval_status || a.approvalStatus || 'Pendente') as any,
        value: Number(a.value || a.valor || 0),
        duration: Number(a.duration || 60)
      })) : appointments;

      const timeToMins = (t: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      const slotStart = timeToMins(time);
      const slotEnd = slotStart + (appointment.duration || 60);
      
      const isOccupied = currentAppointments.some(a => {
        if (a.id === appointment.id || a.date !== date || a.professionalId !== professional.id || a.status === 'Cancelado' || a.status === 'Falta' || a.approvalStatus === 'Reprovado') return false;
        const aStart = timeToMins(a.time);
        const aEnd = aStart + (a.duration || 60);
        return (slotStart < aEnd) && (slotEnd > aStart);
      });

      const isBlocked = currentBlockedTimes.some(bt => {
        if (bt.professionalId !== professional.id && bt.professionalId !== 'all') return false;
        const btDate = new Date(bt.date + 'T00:00:00');
        const currentSelectedDate = new Date(date + 'T00:00:00');
        let isDateMatch = false;
        if (bt.recurrence === 'daily') isDateMatch = btDate <= currentSelectedDate;
        else if (bt.recurrence === 'weekly') isDateMatch = btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
        else if (bt.recurrence === 'monthly') isDateMatch = btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
        else isDateMatch = bt.date === date;
        
        if (!isDateMatch) return false;
        const bStart = timeToMins(bt.time);
        const bEnd = bStart + bt.duration;
        return (slotStart < bEnd) && (slotEnd > bStart);
      });

      if (isOccupied || isBlocked) {
        setErrorMsg('Este horário não está mais disponível. Por favor, escolha outro horário.');
        setIsSubmitting(false);
        return;
      }

      await updateAppointment(appointment.id, {
        date,
        time,
        status: appointment.status === 'Falta' || appointment.status === 'Cancelado' ? 'Confirmado' : appointment.status
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao reagendar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-card border border-white/10 rounded-[40px] p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto text-success">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold italic uppercase tracking-tight">Reagendamento Solicitado!</h2>
          <p className="text-gray-400">
            Sua solicitação para o dia {date.split('-').reverse().join('/')} às {time} foi enviada.
            Aguarde a confirmação do profissional.
          </p>
          <button 
            onClick={() => {
              if (window.history.length > 2) {
                 navigate(-1);
              } else {
                 navigate('/portal');
              }
            }}
            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-colors"
          >
            Voltar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-card border border-white/10 rounded-[40px] p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold italic uppercase tracking-tight mb-2">Reagendar Sessão</h1>
          <p className="text-gray-400">Escolha um novo dia e horário para sua sessão de {appointment.service}.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        <div className="bg-black/40 rounded-3xl p-6 mb-8 border border-white/5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Profissional</p>
              <p className="font-bold">{professional.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-400">Agendamento Atual</p>
              <p className="font-bold">{appointment.date.split('-').reverse().join('/')} às {appointment.time}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">Nova Data</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime('');
              }}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          <AnimatePresence>
            {date && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">Novo Horário</label>
                {availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {availableTimes.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          time === t 
                            ? 'bg-primary text-black scale-105 shadow-lg shadow-primary/20' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-white/5 rounded-2xl text-center text-gray-400">
                    Nenhum horário disponível nesta data.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting || !date || !time}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-black rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Reagendamento'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
