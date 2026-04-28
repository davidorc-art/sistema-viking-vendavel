import React, { useMemo } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Calendar, 
  Package, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ShieldCheck,
  HeartPulse,
  BarChart3,
  ShoppingCart,
  Beer
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function MasterDashboard() {
  const { 
    appointments, 
    transactions, 
    clients, 
    inventory, 
    products, 
    drinks,
    professionals
  } = useData();

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // 1. Financial Health
  const financialStats = useMemo(() => {
    const currentMonthRevenue = transactions
      .filter(t => t.type === 'Receita' && t.status === 'Pago' && isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd }))
      .reduce((acc, t) => acc + t.value, 0);

    const lastMonthRevenue = transactions
      .filter(t => t.type === 'Receita' && t.status === 'Pago' && isWithinInterval(new Date(t.date), { start: lastMonthStart, end: lastMonthEnd }))
      .reduce((acc, t) => acc + t.value, 0);

    const currentMonthExpenses = transactions
      .filter(t => t.type === 'Despesa' && t.status === 'Pago' && isWithinInterval(new Date(t.date), { start: currentMonthStart, end: currentMonthEnd }))
      .reduce((acc, t) => acc + t.value, 0);

    const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const netProfit = currentMonthRevenue - currentMonthExpenses;
    const profitMargin = currentMonthRevenue > 0 ? (netProfit / currentMonthRevenue) * 100 : 0;

    return {
      revenue: currentMonthRevenue,
      expenses: currentMonthExpenses,
      netProfit,
      profitMargin,
      revenueGrowth
    };
  }, [transactions, currentMonthStart, currentMonthEnd, lastMonthStart, lastMonthEnd]);

  // 2. Operational Health
  const operationalStats = useMemo(() => {
    const todayAppts = appointments.filter(a => isToday(new Date(a.date + 'T12:00:00')));
    const completedToday = todayAppts.filter(a => a.status === 'Finalizado').length;
    const pendingToday = todayAppts.filter(a => a.status === 'Confirmado' || a.status === 'Pendente').length;
    
    const lowStockItems = inventory.filter(i => i.stock <= i.minStock).length;
    const lowStockProducts = products.filter(p => p.stock <= 5).length;
    const lowStockDrinks = drinks.filter(d => d.stock <= 10).length;

    const pendingApprovals = appointments.filter(a => a.approvalStatus === 'Pendente').length;

    return {
      todayAppts: todayAppts.length,
      completedToday,
      pendingToday,
      lowStockTotal: lowStockItems + lowStockProducts + lowStockDrinks,
      pendingApprovals
    };
  }, [appointments, inventory, products, drinks]);

  // 3. Client Health
  const clientStats = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'Ativo').length;
    const newClientsThisMonth = clients.filter(c => {
      const firstAppt = appointments
        .filter(a => a.clientId === c.id)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      return firstAppt && isWithinInterval(new Date(firstAppt.date), { start: currentMonthStart, end: currentMonthEnd });
    }).length;

    return {
      total: clients.length,
      active: activeClients,
      newThisMonth: newClientsThisMonth
    };
  }, [clients, appointments, currentMonthStart, currentMonthEnd]);

  // 4. System Health Score (0-100)
  const healthScore = useMemo(() => {
    let score = 80; // Base score

    // Financial impacts
    if (financialStats.profitMargin < 20) score -= 10;
    if (financialStats.profitMargin > 40) score += 5;
    if (financialStats.revenueGrowth < 0) score -= 5;

    // Operational impacts
    if (operationalStats.lowStockTotal > 5) score -= 10;
    if (operationalStats.pendingApprovals > 3) score -= 5;
    
    // Client impacts
    const retentionRate = clients.length > 0 ? (clientStats.active / clients.length) * 100 : 0;
    if (retentionRate < 50) score -= 10;
    if (retentionRate > 80) score += 5;

    return Math.min(100, Math.max(0, score));
  }, [financialStats, operationalStats, clientStats, clients]);

  // 5. Revenue Chart Data
  const chartData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      return {
        month: format(d, 'MMM', { locale: ptBR }),
        start: startOfMonth(d),
        end: endOfMonth(d)
      };
    });

    return last6Months.map(m => {
      const revenue = transactions
        .filter(t => t.type === 'Receita' && t.status === 'Pago' && isWithinInterval(new Date(t.date), { start: m.start, end: m.end }))
        .reduce((acc, t) => acc + t.value, 0);
      
      const expenses = transactions
        .filter(t => t.type === 'Despesa' && t.status === 'Pago' && isWithinInterval(new Date(t.date), { start: m.start, end: m.end }))
        .reduce((acc, t) => acc + t.value, 0);

      return {
        name: m.month,
        receita: revenue,
        despesa: expenses,
        lucro: revenue - expenses
      };
    });
  }, [transactions]);

  // 6. Appointment Status Distribution
  const appointmentStatusData = useMemo(() => {
    const statusCounts: { [key: string]: number } = {};
    appointments.forEach(a => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  // 7. Expense Distribution
  const expenseDistributionData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'Despesa' && t.status === 'Pago')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.value;
      });
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  // 8. Client Growth Data
  const clientGrowthData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(now, 5 - i);
      return {
        month: format(d, 'MMM', { locale: ptBR }),
        start: startOfMonth(d),
        end: endOfMonth(d)
      };
    });

    return last6Months.map(m => {
      const count = clients.filter(c => {
        const firstAppt = appointments
          .filter(a => a.clientId === c.id)
          .sort((a, b) => a.date.localeCompare(b.date))[0];
        return firstAppt && isWithinInterval(new Date(firstAppt.date), { start: m.start, end: m.end });
      }).length;

      return {
        name: m.month,
        novos: count
      };
    });
  }, [clients, appointments]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Health Score */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif italic">Saúde do <span className="text-primary not-italic font-sans font-bold">Sistema</span></h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Visão panorâmica e diagnóstico em tempo real</p>
        </div>

        <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[2rem] border border-white/10">
          <div className="relative w-16 h-16">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-white/10"
                strokeDasharray="100, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={cn(
                  healthScore > 80 ? "text-success" : healthScore > 50 ? "text-accent" : "text-destructive"
                )}
                strokeDasharray={`${healthScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{healthScore}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Score Geral</p>
            <h3 className={cn(
              "text-xl font-bold",
              healthScore > 80 ? "text-success" : healthScore > 50 ? "text-accent" : "text-destructive"
            )}>
              {healthScore > 80 ? 'Excelente' : healthScore > 50 ? 'Estável' : 'Crítico'}
            </h3>
          </div>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento (Mês)" 
          value={`R$ ${financialStats.revenue.toLocaleString('pt-BR')}`}
          icon={DollarSign}
          trend={financialStats.revenueGrowth}
          color="primary"
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`R$ ${financialStats.netProfit.toLocaleString('pt-BR')}`}
          icon={TrendingUp}
          subValue={`${financialStats.profitMargin.toFixed(1)}% margem`}
          color="success"
        />
        <StatCard 
          title="Agendamentos Hoje" 
          value={operationalStats.todayAppts.toString()}
          icon={Calendar}
          subValue={`${operationalStats.completedToday} finalizados`}
          color="secondary"
        />
        <StatCard 
          title="Clientes Ativos" 
          value={clientStats.active.toString()}
          icon={Users}
          subValue={`${clientStats.newThisMonth} novos este mês`}
          color="accent"
        />
      </div>

      {/* Charts Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Chart */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 min-w-0 scanline-container">
            <div className="scanline" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/20 text-primary"><Activity size={20} /></div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Fluxo de Performance</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Despesa</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="receita" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={3} isAnimationActive={false} />
                  <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Operational Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Package size={18} />
                <h4 className="text-sm font-bold uppercase tracking-widest">Status de Estoque</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Insumos Críticos</span>
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    inventory.filter(i => i.stock <= i.minStock).length > 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"
                  )}>
                    {inventory.filter(i => i.stock <= i.minStock).length} itens
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Produtos Loja</span>
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase">
                    {products.filter(p => p.stock <= 5).length} baixo estoque
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Bebidas Bar</span>
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase">
                    {drinks.filter(d => d.stock <= 10).length} baixo estoque
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-secondary">
                <Zap size={18} />
                <h4 className="text-sm font-bold uppercase tracking-widest">Agendamentos Online</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Aguardando Aprovação</span>
                  <span className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                    operationalStats.pendingApprovals > 0 ? "bg-accent/20 text-accent" : "bg-success/20 text-success"
                  )}>
                    {operationalStats.pendingApprovals} pendentes
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Taxa de Conversão</span>
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase">
                    85%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Novos Leads (Hoje)</span>
                  <span className="px-2 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase text-primary">
                    +12
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-8">
          {/* Critical Alerts */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-bold uppercase tracking-tight">Alertas Críticos</h3>
            </div>
            <div className="space-y-3">
              {operationalStats.lowStockTotal > 0 && (
                <AlertItem 
                  icon={Package} 
                  title="Estoque Baixo" 
                  desc={`${operationalStats.lowStockTotal} itens precisam de reposição imediata.`}
                  type="error"
                />
              )}
              {operationalStats.pendingApprovals > 0 && (
                <AlertItem 
                  icon={Clock} 
                  title="Aprovações Pendentes" 
                  desc={`Existem ${operationalStats.pendingApprovals} agendamentos aguardando sua revisão.`}
                  type="warning"
                />
              )}
              {financialStats.profitMargin < 20 && (
                <AlertItem 
                  icon={DollarSign} 
                  title="Margem de Lucro Baixa" 
                  desc="Sua margem atual está abaixo da meta de 30%."
                  type="warning"
                />
              )}
              {operationalStats.lowStockTotal === 0 && operationalStats.pendingApprovals === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Nenhum alerta crítico detectado.<br/>O sistema está operando normalmente.</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Status Distribution */}
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-6">
            <div className="flex items-center gap-2 text-secondary">
              <Calendar size={20} />
              <h3 className="text-lg font-bold uppercase tracking-tight">Status de Agendamentos</h3>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {appointmentStatusData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Client Growth Chart */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20 text-accent"><Users size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Crescimento de Clientes</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="novos" fill="#eab308" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution Chart */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-destructive/20 text-destructive"><DollarSign size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Distribuição de Despesas</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Professional Performance (Extended) */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-success/20 text-success"><ShieldCheck size={20} /></div>
            <h3 className="text-lg font-bold uppercase tracking-tight">Performance do Clã</h3>
          </div>
          <div className="space-y-5">
            {professionals.slice(0, 5).map((prof, idx) => {
              const revenue = appointments
                .filter(a => a.professionalId === prof.id && a.status === 'Finalizado')
                .reduce((acc, a) => acc + a.value, 0);
              
              const totalRevenue = appointments
                .filter(a => a.status === 'Finalizado')
                .reduce((acc, a) => acc + a.value, 0);
              
              const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

              return (
                <div key={prof.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-white">{prof.name}</span>
                    <span className="text-gray-500">R$ {revenue.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success transition-all duration-1000" 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, subValue, color }: any) {
  const colorClasses = {
    primary: "text-primary bg-primary/10 border-primary/20",
    secondary: "text-secondary bg-secondary/10 border-secondary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    success: "text-success bg-success/10 border-success/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</p>
        <div className={cn("p-2 rounded-xl border", colorClasses[color as keyof typeof colorClasses])}>
          <Icon size={16} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-2xl font-bold">{value}</h3>
        {trend !== undefined && (
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <ArrowUpRight size={14} className="text-success" />
            ) : (
              <ArrowDownRight size={14} className="text-destructive" />
            )}
            <span className={cn("text-[10px] font-bold", trend >= 0 ? "text-success" : "text-destructive")}>
              {Math.abs(trend).toFixed(1)}% em relação ao mês anterior
            </span>
          </div>
        )}
        {subValue && (
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}

function AlertItem({ icon: Icon, title, desc, type }: any) {
  const types = {
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-accent/10 border-accent/20 text-accent",
    info: "bg-primary/10 border-primary/20 text-primary",
  };

  return (
    <div className={cn("flex gap-3 p-3 rounded-2xl border", types[type as keyof typeof types])}>
      <div className="mt-0.5"><Icon size={16} /></div>
      <div className="space-y-0.5">
        <p className="text-xs font-bold uppercase tracking-tight">{title}</p>
        <p className="text-[10px] opacity-80 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color }: any) {
  const colors = {
    primary: "hover:bg-primary/20 hover:text-primary border-primary/10",
    secondary: "hover:bg-secondary/20 hover:text-secondary border-secondary/10",
    accent: "hover:bg-accent/20 hover:text-accent border-accent/10",
    success: "hover:bg-success/20 hover:text-success border-success/10",
  };

  return (
    <button className={cn(
      "flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border rounded-2xl transition-all duration-300 group",
      colors[color as keyof typeof colors]
    )}>
      <Icon size={20} className="group-hover:scale-110 transition-transform" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
