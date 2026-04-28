import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users as UsersIcon, 
  Calendar, 
  DollarSign, 
  PieChart as PieChartIcon, 
  ArrowLeft,
  Download,
  Filter,
  User,
  Scissors,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Relatorios() {
  const navigate = useNavigate();
  const { appointments, transactions, professionals, clients } = useData();
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('month');

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthStr = (currentMonth + 1).toString().padStart(2, '0');
  const currentMonthPrefix = `${currentYear}-${monthStr}`;

  const filteredAppointments = useMemo(() => {
    if (period === 'all') return appointments.filter(a => a.status !== 'Cancelado');
    if (period === 'year') return appointments.filter(a => a.date.startsWith(currentYear.toString()) && a.status !== 'Cancelado');
    return appointments.filter(a => a.date.startsWith(currentMonthPrefix) && a.status !== 'Cancelado');
  }, [appointments, period, currentMonthPrefix, currentYear]);

  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions.filter(t => t.status === 'Pago');
    if (period === 'year') return transactions.filter(t => t.date.startsWith(currentYear.toString()) && t.status === 'Pago');
    return transactions.filter(t => t.date.startsWith(currentMonthPrefix) && t.status === 'Pago');
  }, [transactions, period, currentMonthPrefix, currentYear]);

  // 1. Revenue by Professional
  const revenueByProfessional = useMemo(() => {
    const data: { name: string, value: number }[] = [];
    professionals.forEach(prof => {
      const revenue = filteredTransactions
        .filter(t => {
          const appt = appointments.find(a => a.id === t.appointmentId);
          return appt?.professionalId === prof.id;
        })
        .reduce((acc, t) => acc + t.value, 0);
      
      if (revenue > 0) {
        data.push({ name: prof.name.split(' ')[0], value: revenue });
      }
    });
    return data.sort((a, b) => b.value - a.value);
  }, [filteredTransactions, professionals, appointments]);

  // 2. Revenue by Service Type
  const revenueByService = useMemo(() => {
    const data: { name: string, value: number }[] = [
      { name: 'Tattoo', value: 0 },
      { name: 'Piercing', value: 0 },
      { name: 'Outros', value: 0 }
    ];

    filteredTransactions.forEach(t => {
      const appt = appointments.find(a => a.id === t.appointmentId);
      if (appt) {
        if (appt.service.toLowerCase().includes('piercing')) {
          data[1].value += t.value;
        } else if (appt.service.toLowerCase().includes('tattoo') || appt.service.toLowerCase().includes('tatuagem')) {
          data[0].value += t.value;
        } else {
          data[2].value += t.value;
        }
      } else {
        data[2].value += t.value;
      }
    });

    return data.filter(d => d.value > 0);
  }, [filteredTransactions, appointments]);

  // 3. Payment Method Breakdown
  const paymentMethods = useMemo(() => {
    const methods: { [key: string]: number } = {};
    filteredTransactions.filter(t => t.type === 'Receita' || t.type === 'Entrada').forEach(t => {
      methods[t.method] = (methods[t.method] || 0) + t.value;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  // 4. No-Show Rate
  const noShowStats = useMemo(() => {
    const total = filteredAppointments.length;
    const noShows = filteredAppointments.filter(a => a.status === 'Falta').length;
    const rate = total > 0 ? (noShows / total) * 100 : 0;
    return { total, noShows, rate };
  }, [filteredAppointments]);

  // 5. Average Ticket
  const averageTicket = useMemo(() => {
    const totalRevenue = filteredTransactions.filter(t => t.type === 'Receita' || t.type === 'Entrada').reduce((acc, t) => acc + t.value, 0);
    const totalAppts = filteredAppointments.filter(a => a.status === 'Finalizado').length;
    return totalAppts > 0 ? totalRevenue / totalAppts : 0;
  }, [filteredTransactions, filteredAppointments]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-serif italic">Relatórios <span className="text-primary not-italic font-sans font-bold">Inteligentes</span></h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Análise de performance e crescimento</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          {(['month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                period === p ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:text-white"
              )}
            >
              {p === 'month' ? 'Mês' : p === 'year' ? 'Ano' : 'Tudo'}
            </button>
          ))}
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ticket Médio</p>
            <DollarSign size={16} className="text-success" />
          </div>
          <h3 className="text-3xl font-bold">R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-gray-400">Por atendimento finalizado</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Taxa de No-Show</p>
            <UsersIcon size={16} className="text-accent" />
          </div>
          <h3 className="text-3xl font-bold">{noShowStats.rate.toFixed(1)}%</h3>
          <p className="text-xs text-gray-400">{noShowStats.noShows} faltas de {noShowStats.total} agendamentos</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Recebido</p>
            <TrendingUp size={16} className="text-primary" />
          </div>
          <h3 className="text-3xl font-bold">R$ {filteredTransactions.filter(t => t.type === 'Receita' || t.type === 'Entrada').reduce((acc, t) => acc + t.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</h3>
          <p className="text-xs text-gray-400">No período selecionado</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 min-w-0">
        {/* Revenue by Professional */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 min-w-0 scanline-container">
          <div className="scanline" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary"><User size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Faturamento por Profissional</h3>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByProfessional}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} className="cardiogram-bar">
                  {revenueByProfessional.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ color: COLORS[index % COLORS.length] }} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Service */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 min-w-0 scanline-container">
          <div className="scanline" />
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-secondary/20 text-secondary"><Scissors size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Distribuição por Serviço</h3>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center relative min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={revenueByService}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  className="cardiogram-pie"
                >
                  {revenueByService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ color: COLORS[index % COLORS.length] }} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total</span>
              <span className="text-xl font-bold">R$ {revenueByService.reduce((acc, d) => acc + d.value, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {revenueByService.map((item, index) => (
              <div key={item.name} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.name}</span>
                </div>
                <p className="text-sm font-bold">R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-success/20 text-success"><CreditCard size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Métodos de Pagamento</h3>
          </div>
          <div className="space-y-4">
            {paymentMethods.sort((a, b) => b.value - a.value).map((method, index) => {
              const total = paymentMethods.reduce((acc, m) => acc + m.value, 0);
              const percentage = (method.value / total) * 100;
              return (
                <div key={method.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                    <span className="text-white">{method.name}</span>
                    <span className="text-gray-500">R$ {method.value.toLocaleString('pt-BR')} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: COLORS[index % COLORS.length] 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Growth Insights */}
        <div className="bg-primary/10 border border-primary/20 rounded-[2rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20 text-primary"><BarChart3 size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Insights do Clã</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-sm text-gray-300">
                <strong className="text-primary">Dica de Mestre:</strong> Sua taxa de no-show está em <span className="text-accent font-bold">{noShowStats.rate.toFixed(1)}%</span>. 
                {noShowStats.rate > 10 ? ' Considere cobrar um sinal maior para garantir o compromisso do guerreiro.' : ' Excelente! Seus guerreiros são leais e honram seus compromissos.'}
              </p>
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-sm text-gray-300">
                <strong className="text-primary">Performance:</strong> {revenueByProfessional[0]?.name} é o guerreiro mais produtivo do período, contribuindo com <span className="text-success font-bold">R$ {revenueByProfessional[0]?.value.toLocaleString('pt-BR')}</span> para o tesouro.
              </p>
            </div>
            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-sm text-gray-300">
                <strong className="text-primary">Fidelidade:</strong> O ticket médio de <span className="text-white font-bold">R$ {averageTicket.toFixed(0)}</span> indica que seus serviços são valorizados. Mantenha a qualidade para atrair mais clãs!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
