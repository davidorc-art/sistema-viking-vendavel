import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Target,
  Clock,
  Star,
  Award,
  Plus,
  X,
  Package,
  History,
  ChevronLeft,
  ChevronRight,
  Filter,
  Palette
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { PerformanceChart } from '../components/PerformanceChart';
import { cn } from '../lib/utils';
import { format, parseISO, getDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfYear, endOfYear, eachMonthOfInterval, isSameDay, isSameMonth, isSameYear, subMonths, subYears, subDays, addDays, addMonths, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, InventoryItem } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { SUGGESTED_MATERIALS } from '../constants/materials';
import { AppointmentMaterialModal } from '../components/AppointmentMaterialModal';
import { ColorimetryTool } from '../components/ColorimetryTool';
import { getDeductionsForService } from '../services/inventoryAutomationService';




const EditAppointmentModal = ({
  appointment,
  isOpen,
  onClose,
  onSave
}: {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Partial<Appointment>) => void;
}) => {
  const [formData, setFormData] = useState<Partial<Appointment>>({});

  React.useEffect(() => {
    if (appointment) {
      setFormData({
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
        status: appointment.status,
        value: appointment.value,
        totalValue: appointment.totalValue
      });
    }
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(appointment.id, formData);
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
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[32px] md:rounded-t-[40px] z-[70] p-6 md:p-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div>
                <h2 className="text-lg md:text-xl font-bold">Editar Agendamento</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-1">{appointment.clientName}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</label>
                  <input 
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hora</label>
                  <input 
                    type="time"
                    required
                    value={formData.time || ''}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Serviço</label>
                <input 
                  type="text"
                  required
                  value={formData.service || ''}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor Base (R$)</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value || 0}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor Total (R$)</label>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalValue || 0}
                    onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</label>
                <select 
                  value={formData.status || 'Pendente'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-primary outline-none transition-colors appearance-none"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Falta">Falta</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-primary rounded-2xl text-white font-bold shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform mt-4"
              >
                Salvar Alterações
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function ProfessionalDashboard() {
  const { appointments, transactions, clients, professionals, updateAppointment, inventory, updateInventoryItem, addInventoryItem } = useData();
  const { user } = useAuth();
  
  const [goal, setGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`prof_goal_${user?.email}`);
    return saved ? Number(saved) : 5000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal.toString());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isColorimetryOpen, setIsColorimetryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Determine professional based on user email
  const isDavid = user?.email?.toLowerCase().includes('david');
  const professionalName = isDavid ? 'David' : 'Jeynne';
  const professional = professionals.find(p => p.name.toLowerCase().includes(professionalName.toLowerCase()));

  const handleSaveGoal = () => {
    const newGoal = Number(tempGoal);
    if (!isNaN(newGoal) && newGoal > 0) {
      setGoal(newGoal);
      try {
        localStorage.setItem(`prof_goal_${user?.email}`, newGoal.toString());
      } catch (e) {
        console.warn('Failed to save goal to localStorage', e);
      }
      setIsEditingGoal(false);
    }
  };

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

  const handleSaveAppointment = async (appointmentId: string, data: Partial<Appointment>) => {
    await updateAppointment(appointmentId, data);
  };

  // Filter data for this professional
  const profAppointments = useMemo(() => {
    if (!professional) return [];
    return appointments.filter(a => a.professionalId === professional.id && a.status !== 'Cancelado' && a.status !== 'Falta');
  }, [appointments, professional]);

  const filteredAppointments = useMemo(() => {
    return profAppointments.filter(a => {
      const apptDate = parseISO(a.date);
      if (viewMode === 'day') return isSameDay(apptDate, currentDate);
      if (viewMode === 'month') return isSameMonth(apptDate, currentDate);
      if (viewMode === 'year') return isSameYear(apptDate, currentDate);
      return true;
    });
  }, [profAppointments, viewMode, currentDate]);

  const profTransactions = useMemo(() => {
    if (!professional) return [];
    // Assuming transactions are linked to appointments
    const profApptIds = new Set(profAppointments.map(a => a.id));
    return transactions.filter(t => t.appointmentId && profApptIds.has(t.appointmentId) && t.type === 'Receita' && t.status === 'Pago');
  }, [transactions, profAppointments, professional]);

  const filteredTransactions = useMemo(() => {
    const filteredApptIds = new Set(filteredAppointments.map(a => a.id));
    return profTransactions.filter(t => t.appointmentId && filteredApptIds.has(t.appointmentId));
  }, [profTransactions, filteredAppointments]);

  // Stats based on filtered data
  const filteredRevenue = filteredAppointments.reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);
  
  // Current Month Stats (for Goal)
  const currentMonthPrefix = format(new Date(), 'yyyy-MM');
  const currentMonthAppointments = profAppointments.filter(a => a.date.startsWith(currentMonthPrefix));
  const currentMonthRevenue = currentMonthAppointments.reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);
  
  // Total Revenue
  const totalRevenue = profAppointments.reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);

  // Period Revenue, Material Cost, and Net Profit
  const periodRevenue = filteredAppointments.reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);
  const periodMaterialCost = filteredAppointments.reduce((acc, a) => {
    const materialsCost = (a.materialsUsed || []).reduce((sum, m) => sum + (m.cost * m.quantity), 0);
    return acc + materialsCost;
  }, 0);
  const periodNetProfit = periodRevenue - periodMaterialCost;

  // Goal Progress
  const goalProgress = Math.min((currentMonthRevenue / goal) * 100, 100);

  // Chart Data based on viewMode
  const chartData = useMemo(() => {
    if (viewMode === 'year') {
      const months = eachMonthOfInterval({
        start: startOfYear(currentDate),
        end: endOfYear(currentDate)
      });
      return months.map(month => {
        const monthRevenue = profAppointments
          .filter(a => isSameMonth(parseISO(a.date), month))
          .reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);
        return {
          day: format(month, 'MMM', { locale: ptBR }),
          value: monthRevenue,
          previousValue: null
        };
      });
    } else if (viewMode === 'month') {
      const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
      });
      return days.map(day => {
        const dayRevenue = profAppointments
          .filter(a => isSameDay(parseISO(a.date), day))
          .reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);
        return {
          day: format(day, 'dd'),
          value: dayRevenue,
          previousValue: null
        };
      });
    } else {
      // Day view - maybe show by hour? Or just a single bar?
      // Let's show by hour if possible, or just a summary
      const hours = Array.from({ length: 12 }, (_, i) => i + 9); // 9am to 8pm
      return hours.map(hour => {
        const hourRevenue = filteredAppointments
          .filter(a => {
            const [h] = (a.time || '00:00').split(':').map(Number);
            return h === hour;
          })
          .reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);
        return {
          day: `${hour}h`,
          value: hourRevenue,
          previousValue: null
        };
      });
    }
  }, [viewMode, currentDate, profAppointments, filteredAppointments]);

  const handlePrevPeriod = () => {
    if (viewMode === 'day') setCurrentDate(prev => subDays(prev, 1));
    if (viewMode === 'month') setCurrentDate(prev => subMonths(prev, 1));
    if (viewMode === 'year') setCurrentDate(prev => subYears(prev, 1));
  };

  const handleNextPeriod = () => {
    if (viewMode === 'day') setCurrentDate(prev => addDays(prev, 1));
    if (viewMode === 'month') setCurrentDate(prev => addMonths(prev, 1));
    if (viewMode === 'year') setCurrentDate(prev => addYears(prev, 1));
  };

  const getPeriodLabel = () => {
    if (viewMode === 'day') return format(currentDate, "dd 'de' MMMM", { locale: ptBR });
    if (viewMode === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (viewMode === 'year') return format(currentDate, "yyyy");
    return '';
  };

  // Best Days
  const bestDays = useMemo(() => {
    const daysCount = [0, 0, 0, 0, 0, 0, 0];
    const daysRevenue = [0, 0, 0, 0, 0, 0, 0];
    
    profAppointments.forEach(a => {
      try {
        const day = getDay(parseISO(a.date));
        daysCount[day]++;
        daysRevenue[day] += (a.totalValue || a.value || 0);
      } catch (e) {}
    });

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dayNames.map((name, index) => ({
      name,
      count: daysCount[index],
      revenue: daysRevenue[index]
    })).sort((a, b) => b.revenue - a.revenue);
  }, [profAppointments]);

  // Best Clients
  const bestClients = useMemo(() => {
    const clientStats: Record<string, { name: string, spent: number, visits: number }> = {};
    
    profAppointments.forEach(a => {
      if (!clientStats[a.clientId]) {
        clientStats[a.clientId] = { name: a.clientName, spent: 0, visits: 0 };
      }
      clientStats[a.clientId].spent += (a.totalValue || a.value || 0);
      clientStats[a.clientId].visits += 1;
    });

    return Object.values(clientStats)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);
  }, [profAppointments]);

  // Next Appointments
  const nextAppointments = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return profAppointments
      .filter(a => a.date >= today && a.status !== 'Finalizado')
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      })
      .slice(0, 5);
  }, [profAppointments]);

  // Best Services
  const bestServices = useMemo(() => {
    const serviceStats: Record<string, { name: string, count: number, revenue: number }> = {};
    
    profAppointments.forEach(a => {
      if (!serviceStats[a.service]) {
        serviceStats[a.service] = { name: a.service, count: 0, revenue: 0 };
      }
      serviceStats[a.service].count += 1;
      serviceStats[a.service].revenue += (a.totalValue || a.value || 0);
    });

    return Object.values(serviceStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [profAppointments]);

  if (!professional) {
    return (
      <div className="p-8 text-center text-gray-500">
        Profissional não encontrado.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Profissional</h1>
          <p className="text-gray-400 mt-1 text-sm md:text-base">Bem-vindo, {professional.name}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsColorimetryOpen(true)}
            className="hidden md:flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-3 rounded-2xl font-bold hover:bg-primary/20 hover:scale-105 transition-all"
          >
            <Palette size={20} />
            Laboratório de Cores
          </button>
          
          <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-4 self-start md:self-auto w-full md:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <Target className="text-primary" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Meta Mensal</p>
              {isEditingGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number" 
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="bg-black border border-white/10 rounded px-2 py-1 w-24 text-white text-sm"
                  />
                  <button onClick={handleSaveGoal} className="text-xs bg-primary text-black px-2 py-1 rounded font-bold">Salvar</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-lg md:text-xl font-bold text-white">R$ {goal.toFixed(2)}</p>
                  <button onClick={() => setIsEditingGoal(true)} className="text-xs text-primary hover:underline">Editar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => setIsColorimetryOpen(true)}
        className="md:hidden w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 px-4 py-3 rounded-2xl font-bold hover:bg-primary/20 active:scale-95 transition-all"
      >
        <Palette size={20} />
        Laboratório de Cores
      </button>

      {/* Goal Progress Bar */}
      <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-xs md:text-sm text-gray-400">Progresso da Meta</p>
            <p className="text-xl md:text-2xl font-bold text-white mt-1">R$ {currentMonthRevenue.toFixed(2)}</p>
          </div>
          <p className="text-primary text-sm md:text-base font-bold">{goalProgress.toFixed(1)}%</p>
        </div>
        <div className="w-full h-3 md:h-4 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard 
          title="Faturamento" 
          value={`R$ ${periodRevenue.toFixed(2)}`} 
          subtitle="Período"
          icon={DollarSign} 
          trend="up" 
        />
        <StatCard 
          title="Materiais" 
          value={`R$ ${periodMaterialCost.toFixed(2)}`} 
          subtitle="Período"
          icon={Package} 
          trend="down" 
        />
        <StatCard 
          title="Lucro" 
          value={`R$ ${periodNetProfit.toFixed(2)}`} 
          subtitle="Período"
          icon={TrendingUp} 
          trend="up" 
        />
        <StatCard 
          title="Atendimentos" 
          value={filteredAppointments.length.toString()} 
          subtitle="Período"
          icon={Users} 
          trend="up" 
        />
      </div>

      {/* Materials & Full History - MOVED TO TOP AND OPTIMIZED */}
      <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Package size={20} />
            <h2 className="text-lg font-bold text-white">Edição de Atendimentos</h2>
          </div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hidden sm:inline">
            {profAppointments.length} registros
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {profAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            return dateB - dateA;
          }).slice(0, 10).map(app => {
            const materialsCost = (app.materialsUsed || []).reduce((acc, m) => acc + (m.cost * m.quantity), 0);
            return (
              <div key={app.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-bold text-white leading-tight">{app.clientName}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                      <Calendar size={10} />
                      {format(parseISO(app.date), 'dd/MM/yyyy')}
                      <Clock size={10} className="ml-1" />
                      {app.time}
                    </div>
                  </div>
                  <p className="text-secondary font-bold text-sm">R$ {(app.totalValue || app.value || 0).toFixed(2)}</p>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{app.service}</p>
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => {
                      setSelectedAppointment(app);
                      setIsEditModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/5 text-gray-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors active:bg-white/10"
                  >
                    <Calendar size={12} />
                    Editar
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedAppointment(app);
                      setIsMaterialModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors active:bg-primary/20"
                  >
                    <Package size={12} />
                    {app.materialsUsed?.length ? `R$ ${materialsCost.toFixed(2)}` : 'Materiais'}
                  </button>
                </div>
              </div>
            );
          })}
          {profAppointments.length > 10 && (
            <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest py-2">
              Mostrando os 10 mais recentes
            </p>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-500">
                <th className="pb-4 font-bold">Data</th>
                <th className="pb-4 font-bold">Cliente</th>
                <th className="pb-4 font-bold">Serviço</th>
                <th className="pb-4 font-bold">Valor</th>
                <th className="pb-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {profAppointments.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                return dateB - dateA;
              }).map(app => {
                const materialsCost = (app.materialsUsed || []).reduce((acc, m) => acc + (m.cost * m.quantity), 0);
                return (
                  <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 text-gray-300">{format(parseISO(app.date), 'dd/MM/yyyy')}</td>
                    <td className="py-4 font-bold">{app.clientName}</td>
                    <td className="py-4 text-gray-400">{app.service}</td>
                    <td className="py-4 text-secondary font-bold">R$ {(app.totalValue || app.value || 0).toFixed(2)}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setSelectedAppointment(app);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Editar Agendamento"
                        >
                          <Calendar size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedAppointment(app);
                            setIsMaterialModalOpen(true);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-xs font-bold"
                        >
                          <Package size={14} />
                          {app.materialsUsed?.length ? `R$ ${materialsCost.toFixed(2)}` : 'Adicionar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {profAppointments.length === 0 && (
          <div className="py-12 text-center text-gray-500 italic">
            Nenhum agendamento encontrado.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp size={20} />
                <h2 className="text-lg font-bold text-white">Histórico e Desempenho</h2>
              </div>

              <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                {(['day', 'month', 'year'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                      viewMode === mode ? "bg-primary text-black" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {mode === 'day' ? 'Dia' : mode === 'month' ? 'Mês' : 'Ano'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 px-2">
              <button 
                onClick={handlePrevPeriod}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="text-center">
                <p className="text-2xl font-bold text-white capitalize">{getPeriodLabel()}</p>
                <p className="text-xs text-primary font-bold mt-1">Total: R$ {filteredRevenue.toFixed(2)}</p>
              </div>
              <button 
                onClick={handleNextPeriod}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            <PerformanceChart 
              title={viewMode === 'year' ? 'Faturamento Anual' : viewMode === 'month' ? 'Faturamento Mensal' : 'Faturamento Diário'}
              data={chartData} 
              color="#FFD700"
              prefix="R$ "
              showPrevious={false}
            />
          </div>

          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-primary">
                <History size={20} />
                <h2 className="text-lg font-bold text-white">Transações do Período</h2>
              </div>
              <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                {filteredAppointments.length} Registros
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-gray-500">
                    <th className="pb-4 font-bold">Data/Hora</th>
                    <th className="pb-4 font-bold">Cliente</th>
                    <th className="pb-4 font-bold">Serviço</th>
                    <th className="pb-4 font-bold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredAppointments.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
                    const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
                    return dateB - dateA;
                  }).map(app => (
                    <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-300 font-medium">{format(parseISO(app.date), 'dd/MM/yyyy')}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{app.time}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-bold text-white">{app.clientName}</p>
                      </td>
                      <td className="py-4 text-gray-400">{app.service}</td>
                      <td className="py-4 text-right">
                        <p className="text-secondary font-bold">R$ {(app.totalValue || app.value || 0).toFixed(2)}</p>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-500 italic">
                        Nenhuma transação encontrada para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-6 text-primary">
              <Award size={20} />
              <h2 className="text-lg font-bold text-white">Melhores Clientes</h2>
            </div>
            <div className="space-y-4">
              {bestClients.map((client, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.visits} visitas</p>
                    </div>
                  </div>
                  <p className="font-bold text-secondary">R$ {client.spent.toFixed(2)}</p>
                </div>
              ))}
              {bestClients.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">Nenhum dado disponível.</p>
              )}
            </div>
          </div>

        </div>

        <div className="space-y-8">
          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
            <div className="flex items-center gap-2 mb-6 text-secondary">
              <Calendar size={20} />
              <h2 className="text-lg font-bold text-white">Próximos Agendamentos</h2>
            </div>
            <div className="space-y-4">
              {nextAppointments.map(app => (
                <div key={app.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold">{app.clientName}</p>
                    <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-gray-300">
                      {format(parseISO(app.date), 'dd/MM')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{app.service}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={14} />
                    {app.time} ({app.duration} min)
                  </div>
                </div>
              ))}
              {nextAppointments.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">Nenhum agendamento futuro.</p>
              )}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-6">Dias Mais Lucrativos</h2>
            <div className="space-y-4">
              {bestDays.slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">{day.name}</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">R$ {day.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-500">{day.count} atendimentos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 p-4 md:p-6 rounded-3xl">
            <h2 className="text-lg font-bold mb-6">Serviços Mais Realizados</h2>
            <div className="space-y-4">
              {bestServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">{service.name}</p>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{service.count} vezes</p>
                    <p className="text-[10px] text-gray-500">R$ {service.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              {bestServices.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">Nenhum dado disponível.</p>
              )}
            </div>
          </div>
        </div>
      </div>


      <AppointmentMaterialModal 
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveMaterials}
        inventory={inventory}
      />

      <EditAppointmentModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
      />

      <AnimatePresence>
        {isColorimetryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsColorimetryOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-y-1/2 md:-translate-x-1/2 w-auto md:w-full md:max-w-5xl z-[70]"
            >
              <ColorimetryTool onClose={() => setIsColorimetryOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
