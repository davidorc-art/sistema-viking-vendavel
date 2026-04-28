import React, { useState, useMemo, useEffect } from 'react';
import { 
  Lock, 
  Plus, 
  AlertCircle, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Clock,
  User,
  MessageCircle,
  Edit3,
  Calendar as CalendarIcon,
  FileText,
  UserX,
  Trash2,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  Shield,
  ShieldCheck,
  Copy,
  Loader2,
  CreditCard,
  Search,
  Package,
  Heart
} from 'lucide-react';
import { cn, getBaseUrl, getRelativeDayText } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { VikingGuardian } from '../components/VikingGuardian';
import { Appointment, Client, Professional, ConsentForm, BlockedTime } from '../types';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppointmentMaterialModal } from '../components/AppointmentMaterialModal';
import { openWhatsApp } from '../utils/whatsapp';

// --- Sub-components ---

const PendingRequestCard = ({ appointments, onApprove, onReject, onDetails }: { appointments: Appointment[], onApprove: (id: string) => void, onReject: (id: string) => void, onDetails: (appointment: Appointment) => void }) => {
  const pending = appointments
    .filter(a => a.approvalStatus === 'Pendente' || a.approvalStatus === 'Aguardando Pagamento')
    .sort((a, b) => {
      try {
        const [yearA, monthA, dayA] = a.date.split('-').map(Number);
        const [hA, minA] = (a.time || '00:00').split(':').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA, hA, minA).getTime();

        const [yearB, monthB, dayB] = b.date.split('-').map(Number);
        const [hB, minB] = (b.time || '00:00').split(':').map(Number);
        const dateB = new Date(yearB, monthB - 1, dayB, hB, minB).getTime();
        
        if (isNaN(dateA) && isNaN(dateB)) return 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        
        return dateA - dateB;
      } catch (e) {
        return 0;
      }
    });
  
  if (pending.length === 0) return null;

  return (
    <div className="glass-card bg-accent/5 border-accent/20 rounded-[2rem] p-6 space-y-6 shadow-2xl shadow-accent/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-accent font-bold">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center animate-pulse">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-sm uppercase tracking-widest leading-none">Solicitações Pendentes</h3>
            <p className="text-[10px] text-accent/60 mt-1 uppercase tracking-tighter">{pending.length} agendamentos aguardando ação</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {pending.map(request => (
          <div key={request.id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 hover:border-accent/30 transition-all group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-sm truncate">{request.clientName}</p>
                  {request.paymentStatus === 'Pago' ? (
                    <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold shrink-0">PAGO</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-500 text-[10px] font-bold shrink-0">PGTO PENDENTE</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <CalendarIcon size={12} className="text-accent/50" />
                  {(() => {
                    try {
                      const [year, month, day] = request.date.split('-').map(Number);
                      const d = new Date(year, month - 1, day);
                      if (isNaN(d.getTime())) return request.date;
                      return format(d, "dd/MM/yyyy");
                    } catch (e) {
                      return request.date;
                    }
                  })()} às {request.time}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5 italic">{request.service}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => onApprove(request.id)}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-success rounded-xl text-black font-bold text-xs hover:bg-success/80 transition-all active:scale-95"
              >
                <Check size={16} /> Aprovar
              </button>
              <button 
                onClick={() => onDetails(request)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs hover:bg-white/10 transition-all active:scale-95"
              >
                <Search size={14} /> Detalhes
              </button>
              <button 
                onClick={() => onReject(request.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-destructive/20 rounded-xl text-destructive font-bold text-xs hover:bg-destructive/10 transition-all active:scale-95"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CalendarGrid = ({ appointments, blockedTimes, selectedDate, onDateSelect, selectedProfessionalId }: { appointments: Appointment[], blockedTimes: BlockedTime[], selectedDate: Date, onDateSelect: (date: Date) => void, selectedProfessionalId: string }) => {
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }, []);
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => (
        <div key={day} className="text-center text-[10px] font-bold text-gray-500 py-2">{day}</div>
      ))}
      {blanks.map(b => <div key={`blank-${b}`} />)}
      {dates.map(date => {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
        const dayAppointments = appointments
          .filter(a => a.date === dateStr && (selectedProfessionalId === 'all' || a.professionalId === selectedProfessionalId) && a.status !== 'Cancelado' && a.approvalStatus !== 'Reprovado')
          .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
        
        const isFullDayBlocked = blockedTimes.some(bt => {
          if (selectedProfessionalId !== 'all') {
            if (bt.professionalId !== 'all' && bt.professionalId !== selectedProfessionalId) return false;
          } else {
            if (bt.professionalId !== 'all') return false;
          }
          
          // Check if this specific date is an exception
          if (bt.exceptions?.some(exc => exc.trim() === dateStr.trim())) return false;
          
          const btDate = new Date(bt.date + 'T00:00:00');
          const currentSelectedDate = new Date(dateStr + 'T00:00:00');
          
          let matches = false;
          if (bt.recurrence === 'daily') matches = btDate <= currentSelectedDate;
          else if (bt.recurrence === 'weekly') matches = btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
          else if (bt.recurrence === 'monthly') matches = btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
          else matches = bt.date === dateStr;

          return matches && bt.duration >= 1440;
        });

        const hasPartialBlock = blockedTimes.some(bt => {
          if (selectedProfessionalId !== 'all') {
            if (bt.professionalId !== 'all' && bt.professionalId !== selectedProfessionalId) return false;
          }
          
          // Check if this specific date is an exception
          if (bt.exceptions?.some(exc => exc.trim() === dateStr.trim())) return false;
          
          const btDate = new Date(bt.date + 'T00:00:00');
          const currentSelectedDate = new Date(dateStr + 'T00:00:00');
          
          let matches = false;
          if (bt.recurrence === 'daily') matches = btDate <= currentSelectedDate;
          else if (bt.recurrence === 'weekly') matches = btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
          else if (bt.recurrence === 'monthly') matches = btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
          else matches = bt.date === dateStr;

          return matches && bt.duration < 1440;
        });

        const isToday = todayStr === dateStr;
        const isSelected = selectedDate.getDate() === date && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

        return (
          <div 
            key={date} 
            onClick={() => onDateSelect(new Date(year, month, date))}
            className={cn(
              "aspect-square md:aspect-[3/4] rounded-2xl border border-white/5 p-1 md:p-2 flex flex-col items-center gap-1 relative group cursor-pointer hover:bg-white/5 transition-all overflow-hidden",
              isToday ? "border-primary bg-primary/20 ring-1 ring-primary/50 shadow-[0_0_20px_rgba(var(--color-primary),0.3)]" : isSelected ? "border-secondary bg-secondary/5" : "bg-black/20",
              isFullDayBlocked && "bg-red-500/10 border-red-500/30",
              hasPartialBlock && !isFullDayBlocked && "bg-orange-500/5 border-orange-500/20"
            )}
          >
            {isToday && (
              <div className="absolute top-0 right-0 bg-primary px-1.5 py-0.5 rounded-bl-lg z-20 shadow-lg">
                <span className="text-[6px] md:text-[8px] font-black uppercase text-black tracking-tighter">Hoje</span>
              </div>
            )}
            {isFullDayBlocked && (
              <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
            )}
            
            {(isFullDayBlocked || hasPartialBlock) && (
              <div className="absolute top-1 right-1 z-10">
                <Lock size={10} className={cn(isFullDayBlocked ? "text-red-500" : "text-orange-500/60")} />
              </div>
            )}
            <span className={cn("text-[10px] md:text-xs font-bold flex items-center justify-center rounded-full",
              isToday ? "bg-primary text-black w-6 h-6 md:w-7 md:h-7 shadow-[0_0_15px_rgba(202,138,4,0.5)]" :
              isSelected ? "text-secondary" : 
              isFullDayBlocked ? "text-red-500" : 
              hasPartialBlock ? "text-orange-500/70" : "text-gray-400"
            )}>
              {date.toString().padStart(2, '0')}
            </span>
            <div className="flex flex-wrap gap-0.5 md:gap-1 w-full mt-auto justify-center">
              {dayAppointments.slice(0, 4).map(a => (
                <div 
                  key={a.id} 
                  className={cn(
                    "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full",
                    a.status === 'Confirmado' ? "bg-success" : a.status === 'Pendente' ? "bg-accent" : "bg-gray-600"
                  )} 
                  title={`${a.time} - ${a.clientName}`}
                />
              ))}
              {dayAppointments.length > 4 && (
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-[4px] md:text-[6px] text-white">+</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const WeeklyGrid = ({ appointments, blockedTimes, selectedDate, onDateSelect, selectedProfessionalId }: { appointments: Appointment[], blockedTimes: BlockedTime[], selectedDate: Date, onDateSelect: (date: Date) => void, selectedProfessionalId: string }) => {
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  
  const startOfWeek = new Date(selectedDate);
  startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
  
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(day => (
        <div key={day} className="text-center text-[10px] font-bold text-gray-500 py-2">{day}</div>
      ))}
      {weekDates.map(date => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayAppointments = appointments
          .filter(a => a.date === dateStr && (selectedProfessionalId === 'all' || a.professionalId === selectedProfessionalId) && a.status !== 'Cancelado' && a.approvalStatus !== 'Reprovado')
          .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

        const isFullDayBlocked = blockedTimes.some(bt => {
          if (selectedProfessionalId !== 'all') {
            if (bt.professionalId !== 'all' && bt.professionalId !== selectedProfessionalId) return false;
          } else {
            if (bt.professionalId !== 'all') return false;
          }
          
          // Check if this specific date is an exception
          if (bt.exceptions?.some(exc => exc.trim() === dateStr.trim())) return false;
          
          const btDate = new Date(bt.date + 'T00:00:00');
          const currentSelectedDate = new Date(dateStr + 'T00:00:00');
          
          let matches = false;
          if (bt.recurrence === 'daily') matches = btDate <= currentSelectedDate;
          else if (bt.recurrence === 'weekly') matches = btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
          else if (bt.recurrence === 'monthly') matches = btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
          else matches = bt.date === dateStr;

          return matches && bt.duration >= 1440;
        });

        const hasPartialBlock = blockedTimes.some(bt => {
          if (selectedProfessionalId !== 'all') {
            if (bt.professionalId !== 'all' && bt.professionalId !== selectedProfessionalId) return false;
          }
          
          // Check if this specific date is an exception
          if (bt.exceptions?.some(exc => exc.trim() === dateStr.trim())) return false;
          
          const btDate = new Date(bt.date + 'T00:00:00');
          const currentSelectedDate = new Date(dateStr + 'T00:00:00');
          
          let matches = false;
          if (bt.recurrence === 'daily') matches = btDate <= currentSelectedDate;
          else if (bt.recurrence === 'weekly') matches = btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
          else if (bt.recurrence === 'monthly') matches = btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
          else matches = bt.date === dateStr;

          return matches && bt.duration < 1440;
        });

        const isToday = todayStr === dateStr;
        const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

        return (
          <div 
            key={dateStr} 
            onClick={() => onDateSelect(date)}
            className={cn(
              "aspect-square md:aspect-[3/4] rounded-2xl border border-white/5 p-1 md:p-2 flex flex-col items-center gap-1 relative group cursor-pointer hover:bg-white/5 transition-colors overflow-hidden",
              isToday ? "border-primary bg-primary/20 ring-1 ring-primary/50 shadow-[0_0_20px_rgba(var(--color-primary),0.3)]" : isSelected ? "border-secondary bg-secondary/5" : "bg-black/20",
              isFullDayBlocked && "bg-red-500/10 border-red-500/30"
            )}
          >
            {isToday && (
              <div className="absolute top-0 right-0 bg-primary px-1.5 py-0.5 rounded-bl-lg z-20 shadow-lg">
                <span className="text-[6px] md:text-[8px] font-black uppercase text-black tracking-tighter">Hoje</span>
              </div>
            )}
            {(isFullDayBlocked || hasPartialBlock) && (
              <div className="absolute top-1 right-1">
                <Lock size={10} className={cn(isFullDayBlocked ? "text-red-500" : "text-orange-500/50")} />
              </div>
            )}
            <span className={cn("text-[10px] md:text-xs font-bold flex items-center justify-center rounded-full",
              isToday ? "bg-primary text-black w-6 h-6 md:w-7 md:h-7 shadow-[0_0_15px_rgba(202,138,4,0.5)]" :
              isSelected ? "text-secondary" : 
              isFullDayBlocked ? "text-red-500" : 
              hasPartialBlock ? "text-orange-500/70" : "text-gray-400"
            )}>
              {day.toString().padStart(2, '0')}
            </span>
            <div className="flex flex-wrap gap-0.5 md:gap-1 w-full mt-auto justify-center">
              {dayAppointments.slice(0, 4).map(a => (
                <div 
                  key={a.id} 
                  className={cn(
                    "w-1 h-1 md:w-1.5 md:h-1.5 rounded-full",
                    a.status === 'Confirmado' ? "bg-success" : a.status === 'Pendente' ? "bg-accent" : "bg-gray-600"
                  )} 
                  title={`${a.time} - ${a.clientName}`}
                />
              ))}
              {dayAppointments.length > 4 && (
                <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-[4px] md:text-[6px] text-white">+</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AppointmentCard = ({ appointment, clientPhone, onClick, onWhatsApp, onGoogleCalendar, onUpdate, onMaterials }: { key?: React.Key, appointment: Appointment, clientPhone?: string, onClick: () => void, onWhatsApp?: (e: React.MouseEvent) => void, onGoogleCalendar?: (e: React.MouseEvent) => void, onUpdate?: (id: string, data: Partial<Appointment>) => void, onMaterials?: (e: React.MouseEvent) => void }) => (
  <div 
    onClick={onClick}
    className="bg-card border border-white/5 rounded-3xl p-6 space-y-6 cursor-pointer hover:border-white/10 transition-all"
  >
    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">{appointment.time}</span>
          {appointment.duration && <span className="text-xs text-gray-500">até {appointment.duration}</span>}
        </div>
        <h4 className="text-lg font-bold">{appointment.service}</h4>
      </div>
      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 flex-wrap">
        <span className={cn(
          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
          appointment.status === 'Confirmado' ? "bg-success/20 text-success" :
          appointment.status === 'Pendente' ? "bg-accent/20 text-accent" :
          appointment.status === 'Finalizado' ? "bg-primary/20 text-primary" :
          "bg-white/10 text-gray-500"
        )}>
          {appointment.status}
        </span>
        {appointment.paymentStatus === 'Pago' ? (
          <span className="px-2 py-1 rounded bg-success/20 text-success text-[10px] font-bold flex items-center gap-1">
            <DollarSign size={10} /> PAGO
          </span>
        ) : appointment.approvalStatus === 'Aguardando Pagamento' ? (
          <span className="px-2 py-1 rounded bg-orange-500/20 text-orange-500 text-[10px] font-bold flex items-center gap-1">
            <Clock size={10} /> AGUARD. PGTO
          </span>
        ) : null}
        {appointment.consentSigned ? (
          <span className="px-2 py-1 rounded bg-success/20 text-success text-[10px] font-bold flex items-center gap-1">
            <ShieldCheck size={10} /> TERMO OK
          </span>
        ) : appointment.consentSent ? (
          <span className="px-2 py-1 rounded bg-accent/20 text-accent text-[10px] font-bold flex items-center gap-1">
            <MessageCircle size={10} /> TERMO ENVIADO
          </span>
        ) : (
          <span className="px-2 py-1 rounded bg-destructive/20 text-destructive text-[10px] font-bold flex items-center gap-1">
            <AlertCircle size={10} /> TERMO PENDENTE
          </span>
        )}
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <User size={14} /> {appointment.clientName}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <User size={14} className="text-primary" /> {appointment.professionalName}
      </div>
    </div>

    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-white/5 gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">R$ {appointment.value.toFixed(2)}</span>
          {(appointment.totalValue || appointment.value) > appointment.value && (
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Total: R$ {(appointment.totalValue || appointment.value).toFixed(2)}
            </span>
          )}
        </div>
        {(() => {
          const paid = (appointment.totalValue || appointment.value) - (appointment.totalValue || appointment.value); // Just to show what's left
          // Actually let's use the actual balance logic
          return null; // I'll use a better approach below
        })()}
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <div className="flex gap-2">
          <Package 
            size={18} 
            className="text-accent cursor-pointer hover:scale-110 transition-transform" 
            onClick={(e) => {
              e.stopPropagation();
              onMaterials?.(e);
            }}
          />
          <CreditCard 
            size={18} 
            className="text-orange-500 cursor-pointer hover:scale-110 transition-transform" 
            onClick={(e) => {
              e.stopPropagation();
              const baseUrl = window.location.origin;
              const link = `${baseUrl}/pagamento/${appointment.id}`;
              navigator.clipboard.writeText(link);
              alert("Link de pagamento copiado!");
            }}
          />
          <CalendarIcon 
            size={18} 
            className="text-primary cursor-pointer hover:scale-110 transition-transform" 
            onClick={(e) => {
              e.stopPropagation();
              onGoogleCalendar?.(e);
            }}
          />
          <MessageCircle 
            size={18} 
            className="text-success cursor-pointer hover:scale-110 transition-transform" 
            onClick={(e) => {
              e.stopPropagation();
              onWhatsApp?.(e);
            }}
          />
          {!appointment.consentSigned && (
            <ShieldCheck 
              size={18} 
              className="text-accent cursor-pointer hover:scale-110 transition-transform" 
              onClick={(e) => {
                e.stopPropagation();
                const getConsentType = (appointment: any) => {
                  if (!appointment.consentData) return appointment.service.toLowerCase().includes('piercing') ? 'Piercing' : 'Tattoo';
                  const data = typeof appointment.consentData === 'string' ? JSON.parse(appointment.consentData) : appointment.consentData;
                  return data.type || (appointment.service.toLowerCase().includes('piercing') ? 'Piercing' : 'Tattoo');
                };
                const type = getConsentType(appointment);
                const origin = getBaseUrl();
                const link = `${origin}/consent/${appointment.id}?type=${type}`;
                const text = `Olá ${appointment.clientName}! Por favor assine o termo: ${link}`;
                const rawPhone = clientPhone?.replace(/\D/g, '') || '';
                const phone = (rawPhone.length === 10 || rawPhone.length === 11) ? `55${rawPhone}` : rawPhone;
                openWhatsApp(phone, text);
                onUpdate?.(appointment.id, { consentSent: true });
              }}
            />
          )}
          <Edit3 size={18} className="text-secondary" />
        </div>
      </div>
    </div>
  </div>
);

const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  appointment,
  onUpdate,
  onDelete,
  onEdit,
  onWhatsApp,
  onGoogleCalendar,
  clients,
  appointments,
  consentForms
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  appointment: Appointment | null,
  onUpdate: (id: string, data: Partial<Appointment>) => void,
  onDelete: (id: string) => void,
  onEdit: (appointment: Appointment) => void,
  onWhatsApp: (appointment: Appointment) => void,
  onGoogleCalendar: (appointment: Appointment) => void,
  clients: Client[],
  appointments: Appointment[],
  consentForms: ConsentForm[]
}) => {
  const { transactions, addTransaction } = useData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // State for inline value editing
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [editTotalValue, setEditTotalValue] = useState<number>(0);
  const [editDepositPercentage, setEditDepositPercentage] = useState<number>(0);

  // Initialize values when appointment changes
  useEffect(() => {
    if (appointment) {
      setEditTotalValue(appointment.totalValue || appointment.value || 0);
      setEditDepositPercentage(appointment.depositPercentage || 0);
      setIsEditingValue(false);
    }
  }, [appointment]);

  const remainingValue = useMemo(() => {
    if (!appointment) return 0;
    const calculatedPaidValue = transactions
      .filter(t => t.appointmentId === appointment.id && t.status === 'Pago')
      .reduce((sum, t) => sum + t.value, 0);
    const totalValue = isEditingValue ? editTotalValue : (appointment.totalValue || appointment.value);
    return totalValue - calculatedPaidValue;
  }, [transactions, appointment, isEditingValue, editTotalValue]);

  if (!appointment) return null;

  const client = clients.find(c => c.id === appointment.clientId);
  const rawPhone = client?.phone.replace(/\D/g, '') || '';
  const phone = (rawPhone.length === 10 || rawPhone.length === 11) ? `55${rawPhone}` : rawPhone;

  // Find all signed terms for this client
  const clientTerms = consentForms
    .filter(cf => cf.clientId === appointment.clientId)
    .sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());

  const handleFinalize = async () => {
    if (remainingValue > 0) {
      setShowPaymentOptions(true);
      return;
    }
    await finalizeWithMethod();
  };

  const finalizeWithMethod = async (method?: string) => {
    if (isFinalizing) return;
    setIsFinalizing(true);
    setErrorMsg(null);
    try {
      // If there is a remaining value, create a transaction for it
      if (remainingValue > 0 && method) {
        await addTransaction({
          type: 'Receita',
          category: 'Serviços',
          description: `Pagamento: ${appointment.service} - ${appointment.clientName}`,
          value: remainingValue,
          date: new Date().toISOString().split('T')[0],
          method: method as any,
          status: 'Pago',
          appointmentId: appointment.id
        });
      }
      
      await onUpdate(appointment.id, { 
        status: 'Finalizado',
        paymentStatus: 'Pago'
      });
      setShowSuccess(true);
      onClose();
      setShowPaymentOptions(false);
    } catch (error: any) {
      console.error('Erro ao finalizar atendimento:', error);
      setErrorMsg(error.message || 'Erro ao finalizar atendimento. Verifique as permissões do banco de dados.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleNoShow = () => {
    onUpdate(appointment.id, { status: 'Falta' });
    onClose();
  };

  const handleSendAftercare = () => {
    if(!client) return;
    const rawPhone = client.phone.replace(/\D/g, '') || '';
    const phone = (rawPhone.length === 10 || rawPhone.length === 11) ? `55${rawPhone}` : rawPhone;
    
    // Using the ID slice as the referral code
    const referralCode = client.id.substring(0, 6).toUpperCase();
    
    const message = `VOCÊ SOBREVIVEU À AGULHA, GUERREIR@! 🗡️

A batalha foi vencida, mas a guerra pela cicatrização perfeita só começou. 
Pra sua tatuagem sair digna de uma lenda nórdica, siga esse ritual sagrado:

1. 🚿 *O primeiro banho da tattoo deve ser de respeito!*
Após 4 horas (ou conforme instruções do tatuador), retire o plástico e lave sua tattoo nova com sabão neutro. Nada de esfregar como se fosse armadura suja, lave com delicadeza!

2. 🧻 *Seque suavemente, como se fosse o martelo do Thor.*
Use papel toalha ou toalha limpa, sempre secando através de tapinhas (só encostando) — jamais esfregue ou arraste na pele!

3. 🛡️ *Passe a pomada indicada pelo tatuador.*
Não inventa moda! Passar a pomada correta na camada correta em quantidade fina é essencial para criar a película de proteção, super hidratar a pele e garantir que a tinta vire uma arte eterna.

4. 🩹 *Reaplique o plástico apenas se for orientado.*
Em geral, o plástico é fundamental apenas nas primeiras horas. Depois disso, deixe a tatuagem respirar como um guerreiro ao vento.

5. 🚫💧 *Nada de piscina, praia, sauna ou banhos infinitos por 30 dias!*
Água demais = desastre e despigmentação. E mar cheio de sal + sol = tatuagem em ruínas.

6. 🧛 *Fuja do sol como um troll foge do fogo.*
O sol direto é o principal inimigo de uma tattoo recém-feita e pode estourar os seus traços. Nos primeiros 30 dias se esconda do sol, posteriormente cuide sempre e use protetor solar adequado.

7. 🛑 *Coçou? NÃO coce! Descascou? NÃO puxe!*
Deixe a pele se regenerar e soltar os resquícios no seu próprio tempo, como um verdadeiro ritual. Puxar uma casquinha antes da hora vai explodir um pedaço da sua tinta também e detonar a tatuagem.

8. ⚔️ *Evite Atividades Físicas Intensas.*
Nos primeiros dias, evite ir pra academia puxar ferro pesado, correr absurdos, atividades com muito contato físico, ou muito suor e atrito direto na área onde você fez a nova arte.

9. 🥩 *Cuidado com o banquete (Alimentação)*
Evite certos rituais de alimentação por pelo menos 7 a 10 dias. O que cortar da dieta:
- Carne Vermelha e Alimentos Processados (ex: Salsicha, bacon, presunto) retardam o corpo;
- Fast-foods em geral;
- Muito Açúcar (Doces, bolos, refrigerantes);
- Álcool e Bebidas Energéticas – o álcool destrói sua imunidade neste período;
- Frutos com alto risco de alergia (Frutos do mar, castanhas e ovos excessivos).
Aposte numa alimentação balanceada, frutas e mantenha um sistema imunológico imbatível!

10. 💧 *Beba muita água igual um verdadeiro Viking!*
O segredo dos Deuses pra pele estar espetacular! Quer que a tattoo fique linda pra sempre? Corpo hidratado de dentro pra fora significa uma cicatrização divina.

⚠️ *Sinais de Alerta:* Se notar muita vermelhidão que se espalha absurdamente para além da área, inchaço pulsante, dor absurda inexplicável ou uma secreção contínua nos dias seguintes, avise o estúdio ou procure um médico. 

🛡️ *SEJA UMA LENDA, INDIQUE E GANHE:*
Gostou da nossa batalha? Indique a gente pros seus amigos! Se o seu amigo fechar a tattoo com a gente, você ganha pontos para trocar por descontos e fechar os próximos rabiscos!
Diga para seu amigo enviar o seu *CÓDIGO SECRETO* ao fazer o agendamento conosco!
👉 *Seu Código de Indicação:* ${referralCode}

--

Se tiver alguma dúvida ou já quiser agendar a sua próxima arte e expansão, é só chamar no WhatsApp de novo! 
Tenha paciência e siga os cuidados certinho. A arte fincada na sua pele aqui no *Viking Studio* é digna de Valhalla, então trate com carinho! 

📞 Dúvidas? É só ligar: 61 981019691
✨ Acompanhe nosso Instagram da Távola Redonda Sagrada: @_studioviking

Até o próximo rabisco! ⚔️`;
    
    // Use the utility to ensure WhatsApp Business intent on Android
    openWhatsApp(phone, message);
  };

  const handleGeneratePaymentLink = async (type: 'sinal' | 'restante' = 'sinal') => {
    setIsGeneratingPayment(true);
    setErrorMsg(null);
    try {
      let url = `${window.location.origin}/pagamento/${appointment.id}`;
      if (type === 'restante') {
        url += `?type=restante&amount=${remainingValue}`;
      }
      setPaymentUrl(url);
      
      // Copy to clipboard automatically
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleDelete = () => {
    onDelete(appointment.id);
    onClose();
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Detalhes do Agendamento</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {showSuccess && (
              <VikingGuardian 
                type="success" 
                message={`Trabalho incrível com ${appointment.clientName}! Mais uma obra de arte para o clã!`}
                onClose={() => setShowSuccess(false)}
              />
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-black uppercase tracking-widest text-center">
                {errorMsg}
              </div>
            )}

            <div className="space-y-5">
              {/* Client & Service Info Header */}
              <div className="flex items-start gap-4 p-5 bg-black/40 border border-white/5 rounded-[32px]">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-lg">
                  <User size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold truncate leading-tight mb-1">{appointment.clientName}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                      {appointment.service}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><CalendarIcon size={12} /> {new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {appointment.time} {appointment.duration && `(${appointment.duration}min)`}</span>
                  </div>
                </div>
              </div>

              {/* Status & Consent Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center gap-2 text-center",
                  appointment.status === 'Confirmado' ? "bg-success/5 border-success/20 text-success" : 
                  appointment.status === 'Finalizado' ? "bg-primary/5 border-primary/20 text-primary" :
                  appointment.status === 'Pendente' ? "bg-accent/5 border-accent/20 text-accent" :
                  "bg-white/5 border-white/10 text-gray-400"
                )}>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", 
                      appointment.status === 'Confirmado' ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" : 
                      appointment.status === 'Finalizado' ? "bg-primary shadow-[0_0_8px_rgba(197,160,89,0.5)]" :
                      "bg-gray-500"
                    )} />
                    <span className="text-xs font-black uppercase tracking-widest">{appointment.status}</span>
                  </div>
                </div>

                <div className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center gap-2 text-center",
                  appointment.consentSigned ? "bg-success/5 border-success/20 text-success" : 
                  appointment.consentSent ? "bg-accent/5 border-accent/20 text-accent" :
                  "bg-destructive/5 border-destructive/20 text-destructive"
                )}>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Documento</p>
                  <div className="flex items-center gap-2">
                    {appointment.consentSigned ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                    <span className="text-xs font-black uppercase tracking-widest">
                      {appointment.consentSigned ? 'ASSINADO' : appointment.consentSent ? 'ENVIADO' : 'PENDENTE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Section - Compact & Informative */}
              <div className="bg-[#151619] border border-white/5 rounded-[40px] p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Resumo Financeiro</p>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em]",
                    appointment.paymentStatus === 'Pago' ? "bg-success text-success-foreground" : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                  )}>
                    {appointment.paymentStatus === 'Pago' ? 'PAGO' : 'PAGAMENTO PENDENTE'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {isEditingValue ? (
                    <div className="space-y-4 bg-black/50 p-4 rounded-2xl border border-white/10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Investimento Total (R$)</label>
                        <input 
                          type="number"
                          value={editTotalValue}
                          onChange={e => setEditTotalValue(parseFloat(e.target.value) || 0)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white font-bold focus:border-primary/50 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Sinal (%)</label>
                        <input 
                          type="number"
                          max="100"
                          value={editDepositPercentage}
                          onChange={e => setEditDepositPercentage(parseFloat(e.target.value) || 0)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-white font-bold focus:border-primary/50 outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setIsEditingValue(false)}
                          className="flex-1 py-3 bg-white/5 text-gray-400 font-bold rounded-xl text-xs uppercase"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={async () => {
                            const newTotal = editTotalValue;
                            const newPercent = editDepositPercentage;
                            const newVal = Number((newTotal * (newPercent / 100)).toFixed(2));
                            await onUpdate(appointment.id, {
                              totalValue: newTotal,
                              depositPercentage: newPercent,
                              value: newVal
                            });
                            setIsEditingValue(false);
                          }}
                          className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-xs uppercase"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-2">
                        <span className="text-xs text-gray-400 font-medium">Investimento Total</span>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-serif italic text-white leading-none">
                            R$ {Number(appointment.totalValue || appointment.value).toFixed(2)}
                          </span>
                          <button 
                            onClick={() => setIsEditingValue(true)}
                            className="p-1.5 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-wider">Sinal ({appointment.depositPercentage || 0}%)</p>
                          </div>
                          <p className={cn("text-sm font-bold", appointment.paymentStatus === 'Pago' ? "text-success" : "text-primary")}>
                            R$ {appointment.value.toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                          <div className="flex items-center gap-1.5 opacity-60">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                            <p className="text-[8px] font-black text-gray-300 uppercase tracking-wider">Restante no Estúdio</p>
                          </div>
                          <p className="text-sm font-bold text-white">
                            R$ {remainingValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}


                  {appointment.paymentStatus !== 'Pago' && (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleGeneratePaymentLink('sinal')}
                        disabled={isGeneratingPayment}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500/20 border border-orange-500/30 text-orange-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-all disabled:opacity-50"
                      >
                        {isGeneratingPayment ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                        Sinal (R$ {appointment.value.toFixed(2)})
                      </button>
                      
                      <button 
                        onClick={() => handleGeneratePaymentLink('restante')}
                        disabled={isGeneratingPayment || remainingValue <= 0}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500/20 border border-orange-500/30 text-orange-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-all disabled:opacity-50"
                      >
                        {isGeneratingPayment ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                        Restante (R$ {remainingValue.toFixed(2)})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Link Info */}
              {paymentUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">Acesso Direto</p>
                    <p className="text-[10px] text-gray-400 truncate font-mono">{paymentUrl}</p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(paymentUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={cn(
                      "p-3 rounded-xl transition-all shadow-lg shrink-0",
                      copied ? "bg-success text-white" : "bg-orange-500 text-black hover:bg-orange-600"
                    )}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </motion.div>
              )}

              {/* Contact & Scheduling Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onWhatsApp(appointment)}
                  className="flex items-center justify-center gap-3 py-4 bg-success/10 border border-success/20 rounded-2xl text-xs font-black text-success uppercase tracking-widest hover:bg-success/20 transition-all"
                >
                  <MessageCircle size={18} /> WhatsApp
                </button>
                <button 
                  onClick={() => onGoogleCalendar(appointment)}
                  className="flex items-center justify-center gap-3 py-4 bg-primary/10 border border-primary/20 rounded-2xl text-xs font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all"
                >
                  <CalendarIcon size={18} /> Calendário
                </button>
              </div>

              {/* Documentation Control */}
              <div className="bg-black/40 border border-white/5 rounded-[40px] p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#c5a059]">
                    <ShieldCheck size={20} />
                    <h4 className="font-black text-[10px] uppercase tracking-[0.3em]">Gestão de Termos</h4>
                  </div>
                  {appointment.consentSigned ? (
                    <span className="px-2 py-0.5 rounded bg-success/20 text-success text-[10px] font-bold">VÁLIDO</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-destructive/20 text-destructive text-[10px] font-bold">PENDENTE</span>
                  )}
                </div>
                
                {!appointment.consentSigned ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        if (!phone) { setErrorMsg('Telefone não encontrado.'); return; }
                        const link = `${getBaseUrl()}/consent/${appointment.id}?type=Tattoo`;
                        openWhatsApp(phone, `Olá ${appointment.clientName}! Para darmos início à sua tatuagem, por favor assine o termo: ${link}`);
                        onUpdate(appointment.id, { consentSent: true });
                      }}
                      className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                      <FileText size={18} className="text-primary group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Enviar Tattoo</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (!phone) { setErrorMsg('Telefone não encontrado.'); return; }
                        const link = `${getBaseUrl()}/consent/${appointment.id}?type=Piercing`;
                        openWhatsApp(phone, `Olá ${appointment.clientName}! Para darmos início ao seu piercing, por favor assine o termo: ${link}`);
                        onUpdate(appointment.id, { consentSent: true });
                      }}
                      className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
                    >
                      <Shield size={18} className="text-secondary group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Enviar Piercing</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => {
                        const getConsentType = (a: any) => {
                          const data = typeof a.consentData === 'string' ? JSON.parse(a.consentData) : a.consentData;
                          return data?.type || (a.service.toLowerCase().includes('piercing') ? 'Piercing' : 'Tattoo');
                        };
                        window.open(`/consent/${appointment.id}?type=${getConsentType(appointment)}`, '_blank');
                      }}
                      className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      <FileText size={18} /> Ver Documento
                    </button>
                    <button 
                      onClick={() => {
                        const link = `${getBaseUrl()}/reschedule/${appointment.id}`;
                        openWhatsApp(phone, `Olá ${appointment.clientName}! Se precisar reagendar, clique aqui: ${link}`);
                      }}
                      className="flex items-center justify-center gap-3 py-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:bg-orange-500/20 transition-all"
                    >
                      <CalendarIcon size={18} /> Reagendar
                    </button>
                  </div>
                )}
              </div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onWhatsApp(appointment!)}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-success/10 border border-success/20 rounded-2xl hover:bg-success/20 transition-all active:scale-95"
                >
                  <div className="p-2 bg-success/20 rounded-xl">
                    <MessageCircle size={18} className="text-success" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-success">WhatsApp</span>
                </button>
                
                <button 
                  onClick={() => onGoogleCalendar(appointment!)}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-all active:scale-95"
                >
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <CalendarIcon size={18} className="text-primary" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Agenda</span>
                </button>

                <button 
                  onClick={() => {
                    const link = `${getBaseUrl()}/consent/${appointment.id}?type=Tattoo`;
                    navigator.clipboard.writeText(link);
                    alert('Link do termo copiado!');
                  }}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                  <FileText size={18} className="text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Link Termo</span>
                </button>

                <button 
                  onClick={() => {
                    const link = `${getBaseUrl()}/reschedule/${appointment.id}`;
                    navigator.clipboard.writeText(link);
                    alert('Link de reagendamento copiado!');
                  }}
                  className="flex flex-col items-center justify-center gap-2 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                >
                  <ExternalLink size={18} className="text-gray-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Reagendar</span>
                </button>
              </div>

              {/* Quick Management Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => { onEdit(appointment); onClose(); }}
                  className="flex flex-col items-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                >
                  <Edit3 size={16} className="text-primary/60" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Editar</span>
                </button>
                <button 
                  onClick={handleNoShow}
                  className="flex flex-col items-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                >
                  <UserX size={16} className="text-destructive/60" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-destructive/60">Faltou</span>
                </button>
                <button 
                  onClick={handleSendAftercare}
                  className="flex flex-col items-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all"
                >
                  <Heart size={16} className="text-[#c5a059]/60" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#c5a059]/60">Cuidados</span>
                </button>
              </div>

              <div className="pt-4 space-y-4">
                {showDeleteConfirm ? (
                  <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-[32px] space-y-4">
                    <p className="text-xs font-black text-destructive text-center uppercase tracking-[0.2em]">Excluir obra permanentemente?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleDelete} className="py-3 bg-destructive text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Sim, Excluir</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="py-3 bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform">Manter</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full py-4 text-destructive/40 hover:text-destructive text-[10px] font-black uppercase tracking-[0.4em] transition-all"
                  >
                    EXCLUIR AGENDAMENTO
                  </button>
                )}

                {appointment.status !== 'Finalizado' && (
                  <div className="pt-2">
                    {showPaymentOptions ? (
                      <div className="space-y-4 p-6 bg-[#151619] border border-primary/20 rounded-[40px] shadow-2xl">
                        <div className="text-center space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Recebimento</p>
                          <p className="text-xs text-gray-500 font-bold">Valor: <span className="text-white">R$ {remainingValue.toFixed(2)}</span></p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {['Pix', 'Cartão', 'Dinheiro', 'Crédito'].map(method => (
                            <button
                              key={method}
                              onClick={() => finalizeWithMethod(method === 'Cartão' ? 'Cartão de Débito' : method === 'Crédito' ? 'Cartão de Crédito' : method)}
                              disabled={isFinalizing}
                              className="py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all active:scale-95 disabled:opacity-50"
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => setShowPaymentOptions(false)} 
                          className="w-full py-2 text-[10px] font-black text-gray-600 hover:text-white uppercase tracking-widest"
                        >
                          Cancelar Operação
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={handleFinalize}
                        disabled={isFinalizing}
                        className="group relative w-full flex items-center justify-center gap-4 py-6 bg-success rounded-[32px] text-black font-black text-xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(34,197,94,0.3)] hover:shadow-[0_25px_60px_rgba(34,197,94,0.4)] hover:-translate-y-1 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50"
                      >
                        {isFinalizing ? <Loader2 className="animate-spin" size={28} /> : <CheckCircle2 size={28} />}
                        <span>{isFinalizing ? 'HONRANDO...' : 'FINALIZAR'}</span>
                        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/10 rounded-b-full overflow-hidden">
                          <div className="h-full bg-black/20 w-1/2 animate-shimmer" />
                        </div>
                      </button>
                    )}
                  </div>
                )}
                
                {appointment.status !== 'Finalizado' && !showPaymentOptions && (
                  <p className="text-[9px] text-gray-600 text-center px-12 leading-relaxed uppercase font-black tracking-widest opacity-60">
                    Ação irreversível: Estoque será consumido e clã recompensado.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </>
        )}
      </AnimatePresence>
    );
  };

const SERVICES = [
  'Tatuagem',
  'Piercing',
  'Orçamento'
];

const DURATION_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 30);

const NewAppointmentModal = ({ 
  isOpen, 
  onClose, 
  professionals, 
  clients,
  appointments,
  blockedTimes,
  appointment,
  onSave,
  addClient,
  selectedDate: passedSelectedDate
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  professionals: Professional[], 
  clients: Client[],
  appointments: Appointment[],
  blockedTimes: BlockedTime[],
  appointment: Appointment | null,
  onSave: (data: Partial<Appointment>) => void,
  addClient: (client: Omit<Client, 'id'>) => Promise<string>,
  selectedDate?: Date
}) => {
  const getInitialDate = () => {
    if (passedSelectedDate) {
      return `${passedSelectedDate.getFullYear()}-${(passedSelectedDate.getMonth() + 1).toString().padStart(2, '0')}-${passedSelectedDate.getDate().toString().padStart(2, '0')}`;
    }
    return `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<Partial<Appointment>>(
    appointment || {
      clientId: '',
      clientName: '',
      professionalId: '',
      professionalName: '',
      service: '',
      date: getInitialDate(),
      time: '10:00',
      totalValue: 0,
      depositPercentage: 30,
      value: 0,
      status: 'Confirmado',
      duration: 60
    }
  );
  const [clientMode, setClientMode] = useState<'select' | 'create'>('select');
  const [newClientData, setNewClientData] = useState({ 
    name: '', 
    phone: '', 
    instagram: '', 
    birthDate: '', 
    city: '', 
    medicalNotes: '', 
    indicatedBy: '', 
    isMinor: false, 
    notes: '' 
  });

  const navigate = useNavigate();

  const referrerMatch = useMemo(() => {
    const value = newClientData.indicatedBy.trim();
    if (value.length < 3) return null;
    const ignored = ['ninguem', 'ninguém', 'nao', 'não', 'ngm', 'sem indicacao', 'sem indicação'];
    if (ignored.includes(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return null;
    const searchUpper = value.toUpperCase();
    const searchPhone = value.replace(/\D/g, '');
    return clients.find(c => {
      if (value.length >= 6 && c.id.substring(0, 6).toUpperCase() === searchUpper) return true;
      if (c.name.toUpperCase() === searchUpper) return true;
      if (searchPhone.length >= 10 && c.phone.replace(/\D/g, '') === searchPhone) return true;
      return false;
    });
  }, [newClientData.indicatedBy, clients]);

  useEffect(() => {
    if (referrerMatch && newClientData.indicatedBy !== referrerMatch.name) {
      const val = newClientData.indicatedBy.trim();
      const isCode = val.length === 6 && referrerMatch.id.toUpperCase().startsWith(val.toUpperCase());
      const isPhone = val.replace(/\D/g, '').length >= 10;
      if (isCode || isPhone) {
        setNewClientData(prev => ({ ...prev, indicatedBy: referrerMatch.name }));
      }
    }
  }, [referrerMatch]);

  const timeToMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const getAvailableSlots = (date: string, professionalId: string, duration: number) => {
    if (!date || !professionalId) return [];
    const dayOfWeek = new Date(date + 'T00:00:00').getDay(); // 0 is Sunday
    let startHour, endHour;
    if (dayOfWeek === 0) { // Sunday
      startHour = 12;
      endHour = 17;
    } else { // Mon-Sat
      startHour = 10;
      endHour = 20;
    }

    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    
    // Filter occupied slots
    const occupiedSlots = appointments
      .filter(a => a.date === date && a.professionalId === professionalId && a.id !== appointment?.id && a.status !== 'Cancelado' && a.status !== 'Falta')
      .map(a => ({
        start: timeToMinutes(a.time),
        end: timeToMinutes(a.time) + (a.duration || 60)
      }));

    // Filter blocked times
    const currentSelectedDate = new Date(date + 'T00:00:00');
    const blockedSlots = blockedTimes
      .filter(bt => {
        if (bt.professionalId !== professionalId && bt.professionalId !== 'all') return false;
        
        // Check if this specific date is an exception
        if (bt.exceptions?.some(exc => exc.trim() === date.trim())) return false;
        
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
      
      // Check if slot overlaps with any occupied slot
      for (const occupied of occupiedSlots) {
        if ((slotStart < occupied.end) && (slotEnd > occupied.start)) {
          return false;
        }
      }

      // Check if slot overlaps with any blocked slot
      for (const blocked of blockedSlots) {
        if ((slotStart < blocked.end) && (slotEnd > blocked.start)) {
          return false;
        }
      }

      return true;
    });
  };

  const availableSlots = getAvailableSlots(formData.date || '', formData.professionalId || '', formData.duration || 60);

  React.useEffect(() => {
    if (appointment) {
      setFormData(appointment);
      setClientMode('select');
    } else {
      setFormData({
        clientId: '',
        clientName: '',
        professionalId: '',
        professionalName: '',
        service: '',
        date: getInitialDate(),
        time: '10:00',
        totalValue: 0,
        depositPercentage: 30,
        value: 0,
        status: 'Confirmado',
        duration: 60
      });
      setClientMode('select');
    }
  }, [appointment, isOpen, passedSelectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate if the selected time is still available
    const availableSlots = getAvailableSlots(formData.date || '', formData.professionalId || '', formData.duration || 60);
    if (!availableSlots.includes(formData.time || '')) {
      alert('O horário selecionado não está mais disponível para esta data/profissional. Por favor, selecione outro horário.');
      return;
    }

    let clientId = formData.clientId;
    let clientName = formData.clientName;

    if (clientMode === 'create') {
      clientId = await addClient({
        name: newClientData.name,
        email: '',
        phone: newClientData.phone,
        status: 'Ativo',
        points: 0,
        totalSpent: 0,
        level: 'Bronze',
        instagram: newClientData.instagram,
        birthDate: newClientData.birthDate,
        city: newClientData.city,
        medicalNotes: newClientData.medicalNotes,
        indicatedBy: newClientData.indicatedBy,
        isMinor: newClientData.isMinor,
        notes: newClientData.notes
      });
      clientName = newClientData.name;
    } else {
      const client = clients.find(c => c.id === formData.clientId);
      clientName = client?.name || '';
    }

    const professional = professionals.find(p => p.id === formData.professionalId);

    onSave({
      ...formData,
      clientId,
      clientName,
      professionalName: professional?.name || formData.professionalName,
      totalValue: Number(formData.totalValue) || 0,
      depositPercentage: Number(formData.depositPercentage) || 0,
      value: Number(formData.value) || 0
    });
    onClose();
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">{appointment?.id ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Client Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente</label>
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setClientMode('select')} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-colors", clientMode === 'select' ? "bg-primary text-black" : "bg-white/5 text-gray-400")}>Selecionar</button>
                  <button type="button" onClick={() => setClientMode('create')} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-colors", clientMode === 'create' ? "bg-primary text-black" : "bg-white/5 text-gray-400")}>Novo</button>
                </div>
                
                {clientMode === 'select' ? (
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                      required
                      value={formData.clientId}
                      onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                    >
                      <option value="">Selecionar cliente...</option>
                      {[...clients].sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input type="text" required placeholder="Nome Completo" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors" />
                    <input type="tel" required placeholder="Telefone" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors" />
                    <input type="date" placeholder="Data de Nascimento" value={newClientData.birthDate} onChange={e => setNewClientData({...newClientData, birthDate: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors [color-scheme:dark]" />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">Cidade</label>
                      <input type="text" placeholder="Cidade" value={newClientData.city} onChange={e => setNewClientData({...newClientData, city: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors" />
                    </div>
                    <input type="text" placeholder="@instagram" value={newClientData.instagram} onChange={e => setNewClientData({...newClientData, instagram: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors" />
                    <div>
                      <input type="text" placeholder="Nome, telefone ou código de quem te indicou" value={newClientData.indicatedBy} onChange={e => setNewClientData({...newClientData, indicatedBy: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors" />
                      {referrerMatch && (
                        <p className="text-[10px] text-success ml-2 mt-1 flex items-center gap-1 font-bold">
                          <CheckCircle2 size={12} /> Vinculado a: <strong className="text-white">{referrerMatch.name}</strong>
                        </p>
                      )}
                    </div>
                    <textarea placeholder="Problemas médicos (alergias, etc.)" value={newClientData.medicalNotes} onChange={e => setNewClientData({...newClientData, medicalNotes: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors h-24 resize-none" />
                    <div className="flex items-center gap-3 p-4 bg-black/40 rounded-2xl border border-white/5">
                      <input type="checkbox" id="isMinor" checked={newClientData.isMinor} onChange={e => setNewClientData({...newClientData, isMinor: e.target.checked})} className="w-5 h-5 rounded border-white/5 bg-black/40 text-primary focus:ring-primary" />
                      <label htmlFor="isMinor" className="text-sm text-gray-300 cursor-pointer">Sou menor de idade</label>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Serviço</label>
                <select 
                  required
                  value={formData.service}
                  onChange={e => {
                    setFormData({ 
                      ...formData, 
                      service: e.target.value
                    });
                  }}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                >
                  <option value="">Selecionar serviço...</option>
                  {SERVICES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Manual Duration */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duração</label>
                <select 
                  required
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                >
                  {DURATION_OPTIONS.map(d => (
                    <option key={d} value={d}>
                      {d >= 60 ? `${Math.floor(d / 60)}h${d % 60 > 0 ? ` ${d % 60}min` : ''}` : `${d} min`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="date" 
                      required
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Horário</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                      required
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                    >
                      <option value="">
                        {!formData.professionalId 
                          ? 'Selecione o artista primeiro' 
                          : availableSlots.length === 0 
                            ? 'Nenhum horário disponível' 
                            : 'Selecionar horário...'}
                      </option>
                      {availableSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Professional Selection */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Profissional</label>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {professionals.map(p => (
                    <button 
                      key={p.id} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, professionalId: p.id })}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl min-w-[100px] transition-all border",
                        formData.professionalId === p.id 
                          ? "bg-primary/20 border-primary" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        formData.professionalId === p.id ? "bg-primary text-white" : "bg-primary/20 text-primary"
                      )}>
                        <User size={20} />
                      </div>
                      <span className={cn("text-xs font-bold", formData.professionalId === p.id ? "text-primary" : "text-gray-400")}>
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price & Deposit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalValue}
                    onChange={e => {
                      const total = parseFloat(e.target.value) || 0;
                      const percentage = formData.depositPercentage || 0;
                      setFormData({ 
                        ...formData, 
                        totalValue: total,
                        value: Number((total * (percentage / 100)).toFixed(2))
                      });
                    }}
                    placeholder="0,00" 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-xl font-bold focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sinal (%)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    max="100"
                    value={formData.depositPercentage}
                    onChange={e => {
                      const percentage = parseFloat(e.target.value) || 0;
                      const total = formData.totalValue || 0;
                      setFormData({ 
                        ...formData, 
                        depositPercentage: percentage,
                        value: Number((total * (percentage / 100)).toFixed(2))
                      });
                    }}
                    placeholder="30" 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-xl font-bold focus:border-primary/50 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor do Sinal a Pagar (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value === undefined ? '' : formData.value}
                  onChange={e => {
                    const sinal = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, value: sinal });
                  }}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-xl font-bold text-primary focus:border-primary/50 outline-none transition-colors"
                />
                <p className="text-[10px] text-gray-500 italic px-2">Este é o valor que será cobrado no link de pagamento do sinal.</p>
              </div>

              <div className="pt-4 space-y-3">
                {appointment?.id && (
                  <button 
                    type="button"
                    onClick={() => navigate(`/caixa?appointmentId=${appointment.id}`)}
                    className="w-full py-4 bg-success/10 border border-success/20 rounded-2xl text-success font-bold text-lg flex items-center justify-center gap-2 hover:bg-success/20 transition-all"
                  >
                    <DollarSign size={20} /> Receber Pagamento
                  </button>
                )}
                <button 
                  type="submit"
                  className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                >
                  {appointment?.id ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BlockTimeModal = ({ 
  isOpen, 
  onClose, 
  professionals, 
  onSave,
  selectedDate: passedSelectedDate
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  professionals: Professional[], 
  onSave: (data: Omit<BlockedTime, 'id'>) => void,
  selectedDate?: Date
}) => {
  const getInitialDate = () => {
    if (passedSelectedDate) {
      return `${passedSelectedDate.getFullYear()}-${(passedSelectedDate.getMonth() + 1).toString().padStart(2, '0')}-${passedSelectedDate.getDate().toString().padStart(2, '0')}`;
    }
    return `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
  };

  const [isFullDay, setIsFullDay] = useState(false);
  const [formData, setFormData] = useState<Omit<BlockedTime, 'id'>>({
    professionalId: '',
    professionalName: '',
    date: getInitialDate(),
    time: '10:00',
    duration: 60,
    reason: '',
    recurrence: 'none'
  });

  React.useEffect(() => {
    if (isOpen) {
      setIsFullDay(false);
      setFormData({
        professionalId: '',
        professionalName: '',
        date: getInitialDate(),
        time: '10:00',
        duration: 60,
        reason: '',
        recurrence: 'none'
      });
    }
  }, [isOpen, passedSelectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData = { ...formData };
    if (isFullDay) {
      finalData.time = '00:00';
      finalData.duration = 1440; // 24 hours in minutes
    }

    if (finalData.professionalId === 'all') {
      onSave({
        ...finalData,
        professionalName: 'Todos os Profissionais'
      });
    } else {
      const professional = professionals.find(p => p.id === finalData.professionalId);
      onSave({
        ...finalData,
        professionalName: professional?.name || ''
      });
    }
    onClose();
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Bloquear Horário</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Profissional</label>
                <select 
                  required
                  value={formData.professionalId}
                  onChange={e => setFormData({ ...formData, professionalId: e.target.value })}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                >
                  <option value="">Selecionar profissional...</option>
                  <option value="all" className="text-primary font-bold">TODOS OS PROFISSIONAIS</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-3 flex flex-col justify-end pb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isFullDay}
                      onChange={e => setIsFullDay(e.target.checked)}
                      className="w-4 h-4 rounded border-white/10 bg-black/40 text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-sm font-bold text-gray-300">Bloquear dia todo</span>
                  </label>
                </div>
              </div>

              {!isFullDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Horário</label>
                    <input 
                      type="time" 
                      required={!isFullDay}
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Duração (min)</label>
                    <input 
                      type="number" 
                      required={!isFullDay}
                      min="15"
                      step="15"
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recorrência</label>
                <select 
                  value={formData.recurrence}
                  onChange={e => setFormData({ ...formData, recurrence: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                >
                  <option value="none">Nenhuma</option>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Motivo (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ex: Almoço, Folga, etc."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-lg shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
              >
                Bloquear Horário
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Main Page ---

export default function Agenda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get('clientId');
  const actionParam = searchParams.get('action');
  const dateParam = searchParams.get('date');
  const highlightParam = searchParams.get('highlight');
  
  const { 
    appointments, 
    professionals, 
    clients, 
    addAppointment, 
    updateAppointment, 
    deleteAppointment,
    addClient,
    refreshData,
    isSyncing,
    consentForms,
    blockedTimes,
    addBlockedTime,
    deleteBlockedTime,
    inventory,
    updateInventoryItem,
    addInventoryItem
  } = useData();

  const [view, setView] = useState<'dia' | 'semana' | 'mês'>('mês');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [selectedMaterialAppointment, setSelectedMaterialAppointment] = useState<Appointment | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  }, []);

  const isViewingToday = useMemo(() => {
    const d = selectedDate;
    const s = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return s === todayStr;
  }, [selectedDate, todayStr]);

  useEffect(() => {
    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      if (year && month && day) {
        setSelectedDate(new Date(year, month - 1, day));
        setView('dia');
      }
    }
    if (highlightParam) {
      const appt = appointments.find(a => a.id === highlightParam);
      if (appt) {
        setSelectedAppointment(appt);
        setIsModalOpen(true);
      }
    }
  }, [dateParam, highlightParam, appointments]);

  const handleSaveMaterials = async (appointmentId: string, materials: any[]) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const oldMaterials = appointment.materialsUsed || [];
    
    // Calculate differences
    const inventoryAdjustments: Record<string, number> = {};
    
    oldMaterials.forEach(m => {
      if (m.inventoryItemId) {
        inventoryAdjustments[m.inventoryItemId] = (inventoryAdjustments[m.inventoryItemId] || 0) + m.quantity;
      }
    });
    
    // Process new materials
    const finalMaterials = [...materials];
    
    for (let i = 0; i < finalMaterials.length; i++) {
      const m = finalMaterials[i];
      if (!m.inventoryItemId && m.name) {
        // Item doesn't exist in inventory, let's create it
        const newItem = {
          name: m.name,
          category: 'Geral',
          stock: 0,
          minStock: 5,
          unit: m.unit || 'un',
          status: 'Esgotado' as const,
          price: m.cost || 0
        };
        
        try {
          await addInventoryItem(newItem);
        } catch (e) {
          console.error("Error adding new inventory item", e);
        }
      } else if (m.inventoryItemId) {
        inventoryAdjustments[m.inventoryItemId] = (inventoryAdjustments[m.inventoryItemId] || 0) - m.quantity;
      }
    }

    // Apply adjustments
    Object.entries(inventoryAdjustments).forEach(([itemId, adjustment]) => {
      if (adjustment !== 0) {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
          const newStock = item.stock + adjustment;
          let newStatus: 'Em estoque' | 'Baixo' | 'Esgotado' = 'Em estoque';
          if (newStock <= 0) newStatus = 'Esgotado';
          else if (newStock <= item.minStock) newStatus = 'Baixo';
          
          updateInventoryItem(itemId, { stock: newStock, status: newStatus });
        }
      }
    });

    await updateAppointment(appointmentId, { 
      materialsUsed: finalMaterials,
      stockDeducted: true 
    });
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return appointments
      .filter(a => 
        a.clientName.toLowerCase().includes(term) || 
        a.service.toLowerCase().includes(term) ||
        (clients.find(c => c.id === a.clientId)?.phone || '').includes(term)
      )
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [appointments, searchTerm, clients]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (selectedProfessionalId !== 'all') {
      filtered = filtered.filter(a => a.professionalId === selectedProfessionalId);
    }
    if (clientIdParam) {
      filtered = filtered.filter(a => a.clientId === clientIdParam);
    }
    return filtered;
  }, [appointments, selectedProfessionalId, clientIdParam]);

  const calendarAppointments = useMemo(() => {
    // Show all appointments except rejected ones
    return filteredAppointments.filter(a => a.approvalStatus !== 'Reprovado');
  }, [filteredAppointments]);

  // Auto-open new appointment modal if clientId is in URL
  React.useEffect(() => {
    if (clientIdParam && actionParam === 'new' && clients.length > 0 && !isNewModalOpen && !selectedAppointment) {
      const client = clients.find(c => c.id === clientIdParam);
      if (client) {
        setSelectedAppointment({
          clientId: client.id,
          clientName: client.name,
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          status: 'Confirmado',
          value: 0,
          totalValue: 0,
          depositPercentage: 30,
          duration: 60
        } as Appointment);
        setIsNewModalOpen(true);
      }
    }
  }, [clientIdParam, actionParam, clients, isNewModalOpen, selectedAppointment]);

  const dateStr = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  const dayAppointments = useMemo(() => 
    calendarAppointments
      .filter(a => a.date === dateStr)
      .sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')),
    [calendarAppointments, dateStr]
  );

  const dayBlockedTimes = useMemo(() => 
    blockedTimes.filter(bt => {
      if (selectedProfessionalId !== 'all' && bt.professionalId !== 'all' && bt.professionalId !== selectedProfessionalId) return false;
      
      // Check if this specific date is an exception
      if (bt.exceptions?.some(exc => exc.trim() === dateStr.trim())) return false;
      
      const btDate = new Date(bt.date + 'T00:00:00');
      const currentSelectedDate = new Date(dateStr + 'T00:00:00');
      
      if (bt.recurrence === 'daily') return btDate <= currentSelectedDate;
      if (bt.recurrence === 'weekly') return btDate <= currentSelectedDate && btDate.getDay() === currentSelectedDate.getDay();
      if (bt.recurrence === 'monthly') return btDate <= currentSelectedDate && btDate.getDate() === currentSelectedDate.getDate();
      
      return bt.date === dateStr;
    }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00')),
    [blockedTimes, dateStr, selectedProfessionalId]
  );

  const handlePrev = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (view === 'dia') {
        newDate.setDate(prev.getDate() - 1);
      } else if (view === 'semana') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        // Safe month navigation: set to 1st of month first to avoid day roll-over issues
        newDate.setDate(1);
        newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      if (view === 'dia') {
        newDate.setDate(prev.getDate() + 1);
      } else if (view === 'semana') {
        newDate.setDate(prev.getDate() + 7);
      } else {
        // Safe month navigation: set to 1st of month first to avoid day roll-over issues
        newDate.setDate(1);
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setView('dia');
  };

  const handleApprove = async (id: string) => {
    try {
      await updateAppointment(id, { approvalStatus: 'Aprovado', status: 'Confirmado' });
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateAppointment(id, { approvalStatus: 'Reprovado', status: 'Cancelado' });
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    }
  };

  const handleSaveAppointment = async (data: Partial<Appointment>) => {
    try {
      if (selectedAppointment?.id) {
        // Send the full data object to ensure all changes are captured
        console.log('Agenda: Atualizando agendamento:', selectedAppointment.id, data);
        await updateAppointment(selectedAppointment.id, data);
      } else {
        await addAppointment({
          ...data as Omit<Appointment, 'id'>,
          status: 'Confirmado',
          approvalStatus: 'Aprovado'
        });
      }
      setIsNewModalOpen(false);
      setSelectedAppointment(null);
      if (clientIdParam || actionParam) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('clientId');
        newParams.delete('action');
        setSearchParams(newParams);
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsNewModalOpen(true);
  };

  const handleWhatsAppConfirmation = (appointment: Appointment) => {
    const client = clients.find(c => c.id === appointment.clientId);
    const rawPhone = client?.phone?.replace(/\D/g, '') || '';
    const phone = (rawPhone.length === 10 || rawPhone.length === 11) ? `55${rawPhone}` : rawPhone;

    const formattedDate = appointment.date.split('-').reverse().join('/');
    const formattedValue = appointment.value % 1 === 0 ? appointment.value.toString() : appointment.value.toFixed(2);
    const dayText = getRelativeDayText(appointment.date);
    const message = `Olá ${appointment.clientName}, passando para confirmar sua sessão ${dayText} às ${appointment.time} com ${appointment.professionalName} no Viking Tatuagem e Body piercing!

🗓 Data: ${formattedDate} 
⏰ Hora início: ${appointment.time}
🛍 Serviço: ${appointment.service}
💰 Valor: R$ ${formattedValue}

Lembre-se de vir bem alimentado(a)! 🍔

📍 Endereço:
https://share.google/gt8OB3xtlwWgC3CLd`;

    openWhatsApp(phone, message);
  };

  const handleGoogleCalendar = (appointment: Appointment) => {
    const client = clients.find(c => c.id === appointment.clientId);
    const clientPhone = client?.phone || 'Não informado';
    
    // Format date and time for Google Calendar (YYYYMMDDTHHMMSSZ)
    const datePart = appointment.date.replace(/-/g, '');
    const timePart = appointment.time.replace(/:/g, '') + '00';
    
    const startDateTime = `${datePart}T${timePart}`;
    
    // Calculate end time
    const durationMinutes = appointment.duration || 60;
    const startDate = new Date(`${appointment.date}T${appointment.time}`);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    const endYear = endDate.getFullYear();
    const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
    const endDay = endDate.getDate().toString().padStart(2, '0');
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    const endDateTime = `${endYear}${endMonth}${endDay}T${endHours}${endMinutes}00`;
    
    const title = encodeURIComponent(`${appointment.clientName} - ${appointment.service}`);
    const details = encodeURIComponent(
      `Cliente: ${appointment.clientName}\n` +
      `Serviço: ${appointment.service}\n` +
      `Profissional: ${appointment.professionalName}\n` +
      `Telefone: ${clientPhone}\n` +
      `Duração: ${durationMinutes} min`
    );
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}`;
    
    window.open(url, '_blank');
  };

  const handleUpdateAppointment = async (id: string, data: Partial<Appointment>) => {
    await updateAppointment(id, data);
    if (selectedAppointment && selectedAppointment.id === id) {
      setSelectedAppointment(prev => prev ? { ...prev, ...data } : null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Title */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-serif italic text-primary uppercase tracking-tighter">AGENDA</h1>
        <p className="text-gray-500 text-sm font-medium">Gerencie seus agendamentos</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button 
            onClick={() => refreshData()}
            disabled={isSyncing}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-gray-400 font-bold text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <Clock size={18} className={cn(isSyncing && "animate-spin")} /> {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </button>
          <button 
            onClick={() => setIsBlockModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-gray-400 font-bold text-sm hover:bg-white/10 transition-colors"
          >
            <Lock size={18} /> Bloquear
          </button>
        </div>
        <button 
          onClick={() => {
            setSelectedAppointment(null);
            setIsNewModalOpen(true);
          }}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary rounded-full text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-101 transition-transform"
        >
          <Plus size={18} /> Novo Agendamento
        </button>
      </div>

      {/* Pending Requests */}
      <PendingRequestCard 
        appointments={filteredAppointments} 
        onApprove={handleApprove}
        onReject={handleReject}
        onDetails={(appointment) => {
          setSelectedAppointment(appointment);
          setIsModalOpen(true);
        }}
      />

      {/* Calendar Navigation */}
      <div className="bg-card border border-white/5 rounded-[40px] p-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
            <button onClick={handlePrev} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><ChevronLeft size={24} /></button>
            <div className="text-center min-w-[180px] relative">
              {isViewingToday && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary px-3 py-0.5 rounded-full shadow-[0_0_15px_rgba(var(--color-primary),0.3)] animate-pulse">
                  <span className="text-[10px] font-black text-black uppercase tracking-widest">Hoje</span>
                </div>
              )}
              <h2 className={cn("text-2xl font-bold transition-colors", isViewingToday ? "text-primary" : "text-white")}>
                {view === 'dia' 
                  ? selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
                  : selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
                }
              </h2>
              <p className={cn("text-xs font-medium transition-colors", isViewingToday ? "text-primary/70" : "text-gray-500")}>
                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()}
              </p>
            </div>
            <button onClick={handleNext} className="p-2 hover:bg-white/5 rounded-full text-gray-500"><ChevronRight size={24} /></button>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar cliente, serviço ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-colors shadow-inner"
            />
            
            <AnimatePresence>
              {searchTerm && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#151619] border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2 border-b border-white/5 bg-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Resultados da Busca</span>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => {
                          const [year, month, day] = result.date.split('-').map(Number);
                          setSelectedDate(new Date(year, month - 1, day));
                          setView('dia');
                          setSearchTerm('');
                        }}
                        className="w-full p-4 hover:bg-white/5 text-left border-b border-white/5 last:border-0 transition-colors group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white group-hover:text-primary transition-colors">{result.clientName}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-mono bg-black/40 px-2 py-1 rounded-md">
                            {(() => {
                              try {
                                const [year, month, day] = result.date.split('-').map(Number);
                                const d = new Date(year, month - 1, day);
                                if (isNaN(d.getTime())) return result.date;
                                return format(d, "dd/MM/yyyy");
                              } catch (e) {
                                return result.date;
                              }
                            })()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400 flex items-center gap-2">
                            <CalendarIcon size={12} className="text-primary" /> {result.service}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {result.time}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full flex items-center justify-between px-6 py-4 glass-card bg-black/40 border-white/5 rounded-[2rem] text-gray-400 text-sm font-medium"
          >
            <div className="flex items-center gap-3">
              <Filter size={18} />
              {selectedProfessionalId === 'all' 
                ? 'Todos os Artistas' 
                : professionals.find(p => p.id === selectedProfessionalId)?.name || 'Artista selecionado'}
            </div>
            <ChevronRight size={18} className={cn("transition-transform", isFilterOpen ? "-rotate-90" : "rotate-90")} />
          </button>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  <button 
                    onClick={() => {
                      setSelectedProfessionalId('all');
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl min-w-[100px] transition-all border",
                      selectedProfessionalId === 'all' 
                        ? "bg-primary/20 border-primary" 
                        : "bg-white/5 border-white/5 hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      selectedProfessionalId === 'all' ? "bg-primary text-white" : "bg-primary/20 text-primary"
                    )}>
                      <Filter size={20} />
                    </div>
                    <span className={cn("text-xs font-bold", selectedProfessionalId === 'all' ? "text-primary" : "text-gray-400")}>
                      Todos
                    </span>
                  </button>
                  {professionals.map(p => (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        setSelectedProfessionalId(p.id);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-2xl min-w-[100px] transition-all border",
                        selectedProfessionalId === p.id 
                          ? "bg-primary/20 border-primary" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        selectedProfessionalId === p.id ? "bg-primary text-white" : "bg-primary/20 text-primary"
                      )}>
                        <User size={20} />
                      </div>
                      <span className={cn("text-xs font-bold", selectedProfessionalId === p.id ? "text-primary" : "text-gray-400")}>
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex p-1 glass-card bg-black/40 rounded-[2rem]">
          {(['dia', 'semana', 'mês'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-[1.5rem] transition-all",
                view === v ? "bg-white/10 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {view === 'mês' ? (
          <CalendarGrid 
            appointments={calendarAppointments} 
            blockedTimes={blockedTimes}
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect}
            selectedProfessionalId={selectedProfessionalId}
          />
        ) : view === 'semana' ? (
          <WeeklyGrid 
            appointments={calendarAppointments} 
            blockedTimes={blockedTimes}
            selectedDate={selectedDate} 
            onDateSelect={handleDateSelect}
            selectedProfessionalId={selectedProfessionalId}
          />
        ) : (
          <div className="space-y-4">
            {dayBlockedTimes.length > 0 && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-2 text-red-500 font-bold px-2">
                  <Lock size={16} />
                  <h3 className="text-xs uppercase tracking-widest">Horários Bloqueados</h3>
                </div>
                {dayBlockedTimes.map(bt => (
                  <div key={bt.id} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-500 font-bold">
                          {bt.duration >= 1440 ? 'Dia Inteiro' : bt.time}
                        </span>
                        {bt.duration < 1440 && (
                          <span className="text-xs text-red-500/70">({bt.duration} min)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-300">{bt.professionalName}</div>
                      {bt.reason && <div className="text-xs text-gray-500 mt-1">{bt.reason}</div>}
                    </div>
                    {deleteConfirmId === bt.id ? (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Remover este bloqueio?</span>
                        <div className="flex items-center gap-2">
                          {bt.recurrence && bt.recurrence !== 'none' ? (
                            <>
                              <button 
                                onClick={() => {
                                  deleteBlockedTime(bt.id, dateStr);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-3 py-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 text-[10px] font-bold transition-colors"
                              >
                                Apenas Hoje
                              </button>
                              <button 
                                onClick={() => {
                                  deleteBlockedTime(bt.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px] font-bold transition-colors"
                              >
                                Todos
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => {
                                deleteBlockedTime(bt.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-[10px] font-bold transition-colors"
                            >
                              Sim, Remover
                            </button>
                          )}
                          <button 
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 text-[10px] font-bold transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeleteConfirmId(bt.id)}
                        className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {dayAppointments.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-secondary font-bold px-2">
                  <Clock size={16} />
                  <h3 className="text-xs uppercase tracking-widest">Agendamentos</h3>
                </div>
                {dayAppointments.map(a => (
                  <AppointmentCard 
                    key={a.id} 
                    appointment={a} 
                    clientPhone={clients.find(c => c.id === a.clientId)?.phone}
                    onClick={() => {
                      setSelectedAppointment(a);
                      setIsModalOpen(true);
                    }} 
                    onWhatsApp={() => handleWhatsAppConfirmation(a)}
                    onGoogleCalendar={() => handleGoogleCalendar(a)}
                    onUpdate={updateAppointment}
                    onMaterials={(e) => {
                      e.stopPropagation();
                      setSelectedMaterialAppointment(a);
                      setIsMaterialModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm italic">
                Nenhum agendamento para este dia.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Appointment List (Visible in Day/Week view or below calendar) */}
      {view === 'mês' && dayAppointments.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-secondary font-bold px-2">
            <Clock size={16} />
            <h3 className="text-xs uppercase tracking-widest">Agendamentos do Dia</h3>
          </div>
          {dayAppointments.map(a => (
            <AppointmentCard 
              key={a.id} 
              appointment={a} 
              clientPhone={clients.find(c => c.id === a.clientId)?.phone}
              onClick={() => {
                setSelectedAppointment(a);
                setIsModalOpen(true);
              }} 
              onWhatsApp={() => handleWhatsAppConfirmation(a)}
              onGoogleCalendar={() => handleGoogleCalendar(a)}
              onUpdate={updateAppointment}
              onMaterials={(e) => {
                e.stopPropagation();
                setSelectedMaterialAppointment(a);
                setIsMaterialModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AppointmentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
        onDelete={deleteAppointment}
        onEdit={handleEditAppointment}
        onWhatsApp={handleWhatsAppConfirmation}
        onGoogleCalendar={handleGoogleCalendar}
        clients={clients}
        appointments={appointments}
        consentForms={consentForms}
      />
      <NewAppointmentModal 
        isOpen={isNewModalOpen} 
        onClose={() => {
          setIsNewModalOpen(false);
          setSelectedAppointment(null);
          if (clientIdParam || actionParam) {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('clientId');
            newParams.delete('action');
            setSearchParams(newParams);
          }
        }} 
        professionals={professionals}
        clients={clients}
        appointments={appointments}
        blockedTimes={blockedTimes}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
        addClient={addClient}
        selectedDate={selectedDate}
      />
      <BlockTimeModal 
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        professionals={professionals}
        onSave={addBlockedTime}
        selectedDate={selectedDate}
      />

      <AppointmentMaterialModal
        appointment={selectedMaterialAppointment}
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setSelectedMaterialAppointment(null);
        }}
        onSave={handleSaveMaterials}
        inventory={inventory}
      />
    </div>
  );
}
