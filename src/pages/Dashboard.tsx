import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  DollarSign,
  AlertCircle,
  BarChart3,
  ArrowRight,
  Link as LinkIcon,
  Bell,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { PerformanceChart } from "../components/PerformanceChart";
import { DemographicsCharts } from "../components/DemographicsCharts";
import { ActivityList } from "../components/ActivityList";
import { QuickActions } from "../components/QuickActions";
import { NextAppointments } from "../components/NextAppointments";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { LinkGeneratorModal } from "../components/LinkGeneratorModal";
import { RuneBackground } from "../components/RuneBackground";
import { VikingGuardian } from "../components/VikingGuardian";

export default function Dashboard() {
  const {
    clients,
    appointments,
    transactions,
    inventory,
    isSyncing,
    professionals,
  } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);
  const [showCelebration, setShowCelebration] = React.useState(false);

  const isDavid = user?.email?.toLowerCase().includes("david");
  const userName = isDavid ? "David" : "Jeynne";

  const REVENUE_GOAL = 10000; // R$ 10.000,00

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthStr = (currentMonth + 1).toString().padStart(2, "0");
  const currentMonthPrefix = `${currentYear}-${monthStr}`;

  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = new Date(
    previousYear,
    previousMonth + 1,
    0
  ).getDate();
  const prevMonthStr = (previousMonth + 1).toString().padStart(2, "0");
  const previousMonthPrefix = `${previousYear}-${prevMonthStr}`;

  const totalRevenue = appointments
    .filter(
      (a) => a.date.startsWith(currentMonthPrefix) && a.status !== "Cancelado" && a.approvalStatus !== "Reprovado"
    )
    .reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);

  const actualReceipts = transactions
    .filter(
      (t) =>
        t.date.startsWith(currentMonthPrefix) &&
        (t.type === "Receita" || t.type === "Entrada") &&
        t.status === "Pago"
    )
    .reduce((acc, t) => acc + t.value, 0);

  const conversionRate =
    totalRevenue > 0 ? (actualReceipts / totalRevenue) * 100 : 0;

  // Check for goal completion
  React.useEffect(() => {
    if (
      actualReceipts >= REVENUE_GOAL &&
      !localStorage.getItem(`goal_celebrated_${currentMonthPrefix}`)
    ) {
      setShowCelebration(true);
      try {
        localStorage.setItem(`goal_celebrated_${currentMonthPrefix}`, "true");
      } catch (e) {
        console.warn("Failed to save goal celebration to localStorage", e);
      }
    }
  }, [actualReceipts, currentMonthPrefix]);

  const lowStockItems = inventory.filter(
    (i) => i.stock <= (i.minStock || 5)
  ).length;
  const todayAppointments = appointments.filter((a) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
    return a.date === today;
  }).length;

  const pendingAppointments = appointments.filter(
    (a) => a.approvalStatus === "Pendente"
  ).length;

  const financialData = Array.from(
    { length: Math.max(daysInMonth, daysInPrevMonth) },
    (_, i) => {
      const day = i + 1;
      const dayStr = day.toString().padStart(2, "0");

      const dateStr = `${currentMonthPrefix}-${dayStr}`;
      const prevDateStr = `${previousMonthPrefix}-${dayStr}`;

      const dayRevenue =
        day <= daysInMonth
          ? appointments
              .filter((a) => a.date === dateStr && a.status !== "Cancelado" && a.approvalStatus !== "Reprovado")
              .reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0)
          : null;

      const prevDayRevenue =
        day <= daysInPrevMonth
          ? appointments
              .filter((a) => a.date === prevDateStr && a.status !== "Cancelado" && a.approvalStatus !== "Reprovado")
              .reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0)
          : null;

      return {
        day: day.toString(),
        value: dayRevenue,
        previousValue: prevDayRevenue,
      };
    }
  );

  const receiptsData = Array.from(
    { length: Math.max(daysInMonth, daysInPrevMonth) },
    (_, i) => {
      const day = i + 1;
      const dayStr = day.toString().padStart(2, "0");

      const dateStr = `${currentMonthPrefix}-${dayStr}`;
      const prevDateStr = `${previousMonthPrefix}-${dayStr}`;

      const dayTransactionsValue =
        day <= daysInMonth
          ? transactions
              .filter(
                (t) =>
                  t.date === dateStr &&
                  (t.type === "Receita" || t.type === "Entrada") &&
                  t.status === "Pago"
              )
              .reduce((acc, t) => acc + t.value, 0)
          : null;

      const prevDayTransactionsValue =
        day <= daysInPrevMonth
          ? transactions
              .filter(
                (t) =>
                  t.date === prevDateStr &&
                  (t.type === "Receita" || t.type === "Entrada") &&
                  t.status === "Pago"
              )
              .reduce((acc, t) => acc + t.value, 0)
          : null;

      return {
        day: day.toString(),
        value: dayTransactionsValue,
        previousValue: prevDayTransactionsValue,
      };
    }
  );

  return (
    <div className="space-y-8 relative">
      <RuneBackground />

      {showCelebration && (
        <VikingGuardian
          type="celebration"
          message={`GLÓRIA! Você atingiu a meta de R$ ${REVENUE_GOAL.toLocaleString(
            "pt-BR"
          )} este mês!`}
          onClose={() => setShowCelebration(false)}
        />
      )}

      {/* Welcome Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="space-y-6 text-center lg:text-left">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-6xl font-heading font-bold tracking-tighter">
                Bem-vind{isDavid ? "o" : "a"},{" "}
                <span className="text-primary">{userName}</span>
              </h1>
              <div className="flex items-center justify-center lg:justify-start gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <Calendar size={14} />
                {new Date()
                  .toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                  .toUpperCase()}
              </div>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary rounded-full font-bold text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 transition-transform"
            >
              <LinkIcon size={18} />
              Link de Agendamento
            </button>
          </div>
        </div>

        <LinkGeneratorModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          professionals={professionals}
        />
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Total de Clientes"
          value={clients.length.toString()}
          subtitle="Base ativa"
          icon={Users}
          trend="up"
          color="secondary"
        />
        <StatCard
          title="Agendamentos Hoje"
          value={todayAppointments.toString()}
          subtitle="Agenda do dia"
          icon={Calendar}
          trend="up"
          color="primary"
        />
        <StatCard
          title="Recebido Mês"
          value={`R$ ${actualReceipts.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`}
          subtitle={`${conversionRate.toFixed(1)}% do total`}
          icon={DollarSign}
          trend={conversionRate >= 80 ? "up" : "down"}
          color="success"
        />
        <StatCard
          title="Alertas"
          value={(lowStockItems + pendingAppointments).toString()}
          subtitle="Ação requerida"
          icon={AlertCircle}
          trend="down"
          color="accent"
        />
      </section>

      {/* Charts Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-primary" size={24} />
            <h2 className="text-3xl font-bold tracking-tight leading-tight">
              Performance
              <br />
              Financeira
            </h2>
          </div>
          <button
            onClick={() => navigate("/relatorios")}
            className="flex items-center gap-2 text-xs font-bold text-primary hover:gap-3 transition-all"
          >
            Ver Relatórios <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PerformanceChart
            title="Faturamento (Agendamentos)"
            data={financialData}
            color="var(--color-primary)"
            prefix="R$"
          />
          <PerformanceChart
            title="Recebimentos (Caixa)"
            data={receiptsData}
            color="var(--color-success)"
            prefix="R$"
          />
        </div>

        <DemographicsCharts />
      </section>

      {/* Bottom Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ActivityList />
        <div className="space-y-6">
          <QuickActions />
          {pendingAppointments > 0 && (
            <div
              onClick={() => navigate("/agenda")}
              className="glass-card bg-accent/5 border-accent/20 rounded-[2rem] p-6 flex items-start gap-4 group cursor-pointer hover:bg-accent/10 transition-all"
            >
              <div className="p-3 rounded-xl bg-accent/20 text-accent">
                <Bell size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-widest text-accent">
                  Solicitações Pendentes
                </h4>
                <p className="text-xs text-accent/70 font-medium">
                  Você tem {pendingAppointments} agendamento(s) aguardando
                  aprovação.
                </p>
                <button className="flex items-center gap-1 text-xs font-bold text-accent mt-2">
                  Ver Agenda <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
          <NextAppointments />
          {lowStockItems > 0 && (
            <div
              onClick={() => navigate("/estoque")}
              className="glass-card bg-destructive/5 border-destructive/20 rounded-[2rem] p-6 flex items-start gap-4 group cursor-pointer hover:bg-destructive/10 transition-all"
            >
              <div className="p-3 rounded-xl bg-destructive/20 text-destructive">
                <AlertCircle size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-widest text-destructive">
                  Estoque Baixo
                </h4>
                <p className="text-xs text-destructive/70 font-medium">
                  Você tem {lowStockItems} itens com estoque baixo.
                </p>
                <button className="flex items-center gap-1 text-xs font-bold text-destructive mt-2">
                  Ver Estoque <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
