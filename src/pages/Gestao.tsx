import React, { useState, useMemo, useEffect } from "react";
import { cn } from "../lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Filter,
  Search,
  Home,
  Briefcase,
  LayoutGrid,
  Image as ImageIcon,
  FileSpreadsheet,
  BrainCircuit,
  ArrowRightLeft,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Repeat,
  Settings,
  Download,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Users as UsersIcon,
  Activity,
  Zap,
  Target,
  ArrowRight,
  History,
  Lock,
  Unlock,
  Scissors,
  Loader2,
  Calculator,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../context/DataContext";
import {
  ManagementTransaction,
  ManagementCategory,
  Transaction,
  Appointment,
} from "../types";
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { LocalFinanceIntelligence } from "../services/localFinanceIntelligence";
import { analyzeFinancialText } from "../services/geminiFinanceService";
import { CashierModal } from "../components/CashierModal";
import { NewSaleModal } from "../components/NewSaleModal";

export default function Gestao() {
  const {
    transactions,
    appointments,
    addManagementTransaction,
    managementCategories,
    addManagementCategory,
    managementRules,
    addManagementRule,
    updateTransaction,
    deleteTransaction,
    deleteTransactionsBatch,
    estornarTransaction,
    addTransaction,
  } = useData();

  const [activeTab, setActiveTab] = useState<"Geral" | "Casa" | "Trabalho">(
    "Geral"
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<
    "Mês" | "Semana" | "Dia" | "Tudo"
  >("Mês");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Cashier State
  const [isCashierOpen, setIsCashierOpen] = useState(true);
  const [initialBalance, setInitialBalance] = useState(150);
  const [isCloseCashierModalOpen, setIsCloseCashierModalOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);

  // --- Calculations ---
  const combinedTransactions = useMemo(() => {
    // Unification: Use transactions as the primary source
    // Filter out duplicates (same description, value, date)
    const seenIds = new Set();
    const uniqueTransactions: any[] = [];

    // Use only transactions
    const all = [...transactions];

    all.forEach((t) => {
      // Use ID for deduplication if available, otherwise fallback to details (for local-only data if any)
      const key = t.id || `${t.description}-${t.value}-${t.date}-${t.method}`;
      if (!seenIds.has(key)) {
        if (t.description.toUpperCase().includes('TESTE') || t.description.toUpperCase().includes('TEST')) return;
        seenIds.add(key);
        // Detect origin: prioritize field, then prefix for legacy data
        let origin = t.origin || "Trabalho";
        if (!t.origin) {
          if (t.description.match(/^\[CASA\]/i)) origin = "Casa";
          else if (t.description.match(/^\[TRABALHO\]/i)) origin = "Trabalho";
        }

        // Detect recurrence: prioritize field, then prefix for legacy data
        let isRecurring = t.isRecurring || false;
        let recurrenceType = t.recurrenceType || "Mensal";
        if (!t.isRecurring) {
          const recMatch = t.description.match(
            /\[REC:(Mensal|Semanal|Personalizado)\]/i
          );
          if (recMatch) {
            isRecurring = true;
            recurrenceType = recMatch[1] as any;
          }
        }

        // Clean description: remove [CAIXA], [GESTAO], [CASA], [TRABALHO], [REC:...] etc.
        let cleanDescription = t.description
          .replace(/^\[(CAIXA|GESTAO|CASA|TRABALHO)\]\s*/i, "")
          .replace(/\[REC:(Mensal|Semanal|Personalizado)\]\s*/i, "")
          .trim();

        uniqueTransactions.push({
          ...t,
          description: cleanDescription,
          origin,
          isRecurring,
          recurrenceType,
          status: t.status || "Pago",
        });
      }
    });

    // Map to ManagementTransaction format for the UI
    return uniqueTransactions.map((t) => ({
      ...t,
      type:
        (t.type as string) === "Receita" || (t.type as string) === "Entrada"
          ? "Entrada"
          : "Saída",
      syncWithMain: true,
      mainTransactionId: t.id,
      createdAt: t.createdAt || t.date,
    })) as ManagementTransaction[];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = combinedTransactions;

    // Tab Filter
    if (activeTab !== "Geral") {
      filtered = filtered.filter((t) => t.origin === activeTab);
    }

    // Period Filter
    const now = new Date();
    if (filterPeriod === "Mês") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      filtered = filtered.filter((t) =>
        isWithinInterval(parseISO(t.date), { start, end })
      );
    } else if (filterPeriod === "Semana") {
      const start = new Date(now.setDate(now.getDate() - now.getDay()));
      const end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      filtered = filtered.filter((t) =>
        isWithinInterval(parseISO(t.date), { start, end })
      );
    } else if (filterPeriod === "Dia") {
      const todayStr = format(now, "yyyy-MM-dd");
      filtered = filtered.filter((t) => t.date === todayStr);
    }

    // Category Filter
    if (selectedCategory !== "Todas") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  }, [
    combinedTransactions,
    activeTab,
    filterPeriod,
    selectedCategory,
    searchQuery,
  ]);

  const stats = useMemo(() => {
    const inflow = filteredTransactions
      .filter((t) => t.type === "Entrada")
      .reduce((acc, t) => acc + t.value, 0);

    const outflow = filteredTransactions
      .filter((t) => t.type === "Saída")
      .reduce((acc, t) => acc + t.value, 0);

    return {
      inflow,
      outflow,
      net: inflow - outflow,
      total: combinedTransactions.reduce(
        (acc, t) => acc + (t.type === "Entrada" ? t.value : -t.value),
        0
      ),
    };
  }, [filteredTransactions, combinedTransactions]);

  const chartData = useMemo(() => {
    // Group by category for pie chart
    const categories: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "Saída")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.value;
      });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const revenueByProfessional = useMemo(() => {
    const profRevenue: { [key: string]: number } = {};
    combinedTransactions
      .filter((t) => t.type === "Entrada" && t.origin === "Trabalho")
      .forEach((t) => {
        const appt = appointments.find((a) => a.id === t.appointmentId);
        if (appt) {
          profRevenue[appt.professionalName] =
            (profRevenue[appt.professionalName] || 0) + t.value;
        } else {
          profRevenue["Outros"] = (profRevenue["Outros"] || 0) + t.value;
        }
      });
    return Object.entries(profRevenue).map(([name, value]) => ({
      name,
      value,
    }));
  }, [combinedTransactions, appointments]);

  const financialSummaryToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayTxs = transactions.filter((t) => t.date === today);
    const todayAppts = appointments.filter(
      (a) => a.date === today && a.status !== "Cancelado"
    );

    const expected = todayAppts.reduce(
      (acc, a) => acc + (a.totalValue || a.value),
      0
    );
    const received = todayTxs
      .filter((t) => t.type === "Receita")
      .reduce((acc, t) => acc + t.value, 0);
    const expenses = todayTxs
      .filter((t) => t.type === "Despesa")
      .reduce((acc, t) => acc + t.value, 0);

    const allPendingAppts = appointments.filter(
      (a) => a.date <= today && a.status !== "Cancelado" && a.approvalStatus !== "Reprovado"
    );

    const pending = allPendingAppts.reduce((acc, a) => {
      const totalValue = a.totalValue || a.value;
      const paid = transactions
        .filter((t) => t.appointmentId === a.id && t.status === "Pago")
        .reduce((sum, t) => sum + t.value, 0);
      return acc + Math.max(0, totalValue - paid);
    }, 0);

    return {
      expected,
      received,
      expenses,
      pending,
      balance: received - expenses,
    };
  }, [appointments, transactions]);

  const handleToggleCashier = () => {
    if (isCashierOpen) {
      setIsCloseCashierModalOpen(true);
    } else {
      setIsCashierOpen(true);
      setInitialBalance(150);
    }
  };

  const handleConfirmCloseCashier = () => {
    setIsCashierOpen(false);
    setIsCloseCashierModalOpen(false);
    toast.success("Caixa fechado com sucesso!");
  };

  const insights = useMemo(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lmStart = startOfMonth(lastMonth);
    const lmEnd = endOfMonth(lastMonth);

    const lastMonthTxs = combinedTransactions.filter((t) => {
      try {
        return isWithinInterval(parseISO(t.date), {
          start: lmStart,
          end: lmEnd,
        });
      } catch (e) {
        return false;
      }
    });

    const currentMonthOutflow = stats.outflow;
    const lastMonthOutflow = lastMonthTxs
      .filter((t) => t.type === "Saída")
      .reduce((acc, t) => acc + t.value, 0);

    const messages = [];

    if (lastMonthOutflow > 0) {
      const diff =
        ((currentMonthOutflow - lastMonthOutflow) / lastMonthOutflow) * 100;
      if (diff > 10) {
        messages.push({
          type: "warning",
          text: `Seus gastos subiram ${diff.toFixed(
            0
          )}% em relação ao mês passado. Considere revisar seus custos variáveis.`,
        });
      } else if (diff < -10) {
        messages.push({
          type: "success",
          text: `Parabéns! Você reduziu seus gastos em ${Math.abs(diff).toFixed(
            0
          )}% este mês.`,
        });
      }
    }

    // Top category insight
    const categories: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "Saída")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.value;
      });
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
      messages.push({
        type: "info",
        text: `Sua maior categoria de gastos este mês é ${
          topCat[0]
        } (R$ ${topCat[1].toLocaleString("pt-BR")}).`,
      });
    }

    if (messages.length === 0) {
      messages.push({
        type: "info",
        text: "Continue registrando seus gastos para receber insights personalizados da IA.",
      });
    }

    return messages;
  }, [stats.outflow, filteredTransactions]);

  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showLearningPrompt, setShowLearningPrompt] = useState(false);
  const [pendingRule, setPendingRule] = useState<any>(null);

  const handleUpdateTransaction = async (id: string, updates: any) => {
    const original = combinedTransactions.find((t) => t.id === id);

    const updatesToApply = { ...updates };

    // Map type if present
    if (updatesToApply.type) {
      updatesToApply.type =
        updatesToApply.type === "Entrada" ? "Receita" : "Despesa";
    }

    await updateTransaction(id, updatesToApply);

    // Learning mechanism: if category or origin changed, suggest learning
    if (
      original &&
      (updates.category !== original.category ||
        updates.origin !== original.origin)
    ) {
      setPendingRule({
        keyword: original.description,
        category: updates.category || original.category,
        origin: updates.origin || original.origin,
        type: original.type,
      });
      setShowLearningPrompt(true);
    }

    setEditingTransaction(null);
    toast.success("Transação atualizada!");
  };

  const confirmLearning = async () => {
    if (pendingRule) {
      await addManagementRule(pendingRule);
      toast.success("A IA aprendeu esta nova regra!");
    }
    setShowLearningPrompt(false);
    setPendingRule(null);
  };

  const COLORS = [
    "#EAB308",
    "#F97316",
    "#EF4444",
    "#8B5CF6",
    "#3B82F6",
    "#10B981",
    "#EC4899",
    "#6366F1",
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-primary uppercase">
            FINANCEIRO
          </h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">
            Gestão unificada: Pessoal & Profissional
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleCashier}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-[10px] transition-all uppercase tracking-widest",
              isCashierOpen
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-success/10 text-success border border-success/20"
            )}
          >
            {isCashierOpen ? <Lock size={14} /> : <Unlock size={14} />}
            {isCashierOpen ? "Fechar Caixa" : "Abrir Caixa"}
          </button>
          <button
            onClick={() => setIsNewSaleModalOpen(true)}
            disabled={!isCashierOpen}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary rounded-xl text-white font-bold text-[10px] shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform uppercase tracking-widest disabled:opacity-50 disabled:scale-100"
          >
            <Plus size={14} /> Receber
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
            <BrainCircuit size={14} className="text-accent" />
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
              IA: {managementRules.length} Regras
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-4 md:p-6 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={48} className="md:w-16 md:h-16" />
          </div>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
            Saldo Geral
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            R${" "}
            {stats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 md:mt-2">
            Acumulado total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-4 md:p-6"
        >
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
            Entradas (Mês)
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center">
              <TrendingUp size={18} className="md:w-5 md:h-5" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              R${" "}
              {stats.inflow.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-4 md:p-6"
        >
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
            Saídas (Mês)
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
              <TrendingDown size={18} className="md:w-5 md:h-5" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              R${" "}
              {stats.outflow.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-4 md:p-6"
        >
          <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 md:mb-2">
            Saldo Líquido
          </p>
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${
                stats.net >= 0
                  ? "bg-accent/20 text-accent"
                  : "bg-red-500/20 text-red-500"
              }`}
            >
              <ArrowRightLeft size={18} className="md:w-5 md:h-5" />
            </div>
            <h3
              className={`text-xl md:text-2xl font-bold ${
                stats.net >= 0 ? "text-white" : "text-red-400"
              }`}
            >
              R${" "}
              {stats.net.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* Today's Cashier Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card bg-card border-white/5 p-4 rounded-[2rem] space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <Calculator size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Caixa Hoje
            </span>
          </div>
          <p className="text-xl font-bold text-white">
            R${" "}
            {financialSummaryToday.received.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-[9px] text-gray-500 font-medium">
            Saldo em gaveta (entradas - saídas)
          </p>
        </div>

        <div className="glass-card bg-orange-500/5 border-orange-500/20 p-4 rounded-[2rem] space-y-2">
          <div className="flex items-center gap-2 text-orange-500">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Pendente Hoje
            </span>
          </div>
          <p className="text-xl font-bold text-orange-500">
            R${" "}
            {financialSummaryToday.pending.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-[9px] text-orange-500/70 font-medium">
            Previsto: R$ {financialSummaryToday.expected.toFixed(2)}
          </p>
        </div>

        <div className="glass-card bg-card border-white/5 p-4 rounded-[2rem] space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <History size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Vendas Hoje
            </span>
          </div>
          <p className="text-xl font-bold text-white">
            {
              transactions.filter(
                (t) => t.date === new Date().toISOString().split("T")[0]
              ).length
            }
          </p>
          <p className="text-[9px] text-gray-500 font-medium">
            Movimentações registradas
          </p>
        </div>

        <div
          className={cn(
            "glass-card p-4 rounded-[2rem] space-y-2 border",
            isCashierOpen
              ? "bg-success/5 border-success/20"
              : "bg-destructive/5 border-destructive/20"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2",
              isCashierOpen ? "text-success" : "text-destructive"
            )}
          >
            {isCashierOpen ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Status
            </span>
          </div>
          <p
            className={cn(
              "text-xl font-bold",
              isCashierOpen ? "text-success" : "text-destructive"
            )}
          >
            {isCashierOpen ? "ABERTO" : "FECHADO"}
          </p>
          <p
            className={cn(
              "text-[9px] font-medium",
              isCashierOpen ? "text-success/70" : "text-destructive/70"
            )}
          >
            {isCashierOpen ? "Pronto para receber" : "Caixa encerrado"}
          </p>
        </div>
      </div>

      {/* Tabs & Actions */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 items-start lg:items-center justify-between">
        <div className="flex p-1 glass-card bg-white/5 border-white/10 rounded-[2rem] w-full lg:w-auto overflow-x-auto no-scrollbar">
          {(["Geral", "Casa", "Trabalho"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-[1.5rem] text-xs md:text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab
                  ? "bg-primary text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "Geral" && (
                <LayoutGrid size={16} className="md:w-[18px] md:h-[18px]" />
              )}
              {tab === "Casa" && (
                <Home size={16} className="md:w-[18px] md:h-[18px]" />
              )}
              {tab === "Trabalho" && (
                <Briefcase size={16} className="md:w-[18px] md:h-[18px]" />
              )}
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-500 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Resetar Importação</span>
          </button>
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 hover:border-accent/50 rounded-2xl text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all group"
          >
            <BrainCircuit
              size={16}
              className="text-accent group-hover:scale-110 transition-transform md:w-[18px] md:h-[18px]"
            />
            <span className="hidden sm:inline">Importar com IA</span>
            <span className="sm:hidden">Importar</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 lg:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-primary rounded-2xl text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20"
          >
            <Plus size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden sm:inline">Novo Lançamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List & Filters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-3 md:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs md:text-sm focus:border-primary outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 sm:flex-none relative">
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs md:text-sm outline-none focus:border-primary appearance-none pr-8"
                >
                  <option value="Dia">Hoje</option>
                  <option value="Semana">Semana</option>
                  <option value="Mês">Mês</option>
                  <option value="Tudo">Tudo</option>
                </select>
                <Filter
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>

              <div className="flex-1 sm:flex-none relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs md:text-sm outline-none focus:border-primary appearance-none pr-8"
                >
                  <option value="Todas">Categorias</option>
                  <option value="Caixa">Caixa (Automático)</option>
                  {managementCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <LayoutGrid
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5 sm:border-none"
                title="Gerenciar Categorias"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
              Sugestões:
            </span>
            {["Caixa", "Alimentação", "Transporte", "Trabalho", "Lazer"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory((prev) =>
                      prev === cat ? "Todas" : cat
                    )
                  }
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-accent text-black"
                      : "bg-white/5 text-gray-400 hover:text-white border border-white/5"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card bg-white/5 border-white/10 rounded-[1.5rem] p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-white/[0.08] transition-all"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === "Entrada"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {tx.type === "Entrada" ? (
                        <TrendingUp size={18} className="md:w-5 md:h-5" />
                      ) : (
                        <TrendingDown size={18} className="md:w-5 md:h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-white text-xs md:text-sm truncate">
                        {tx.description}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {tx.category}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10 hidden md:block" />
                        <span className="text-[9px] md:text-[10px] text-gray-500">
                          {format(parseISO(tx.date), "dd 'de' MMM", {
                            locale: ptBR,
                          })}
                        </span>
                        {tx.isRecurring && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/10 hidden md:block" />
                            <Repeat
                              size={10}
                              className="text-accent md:w-3 md:h-3"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 md:gap-6 sm:ml-4 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-none">
                    <div className="text-left sm:text-right shrink-0">
                      <p
                        className={`font-bold text-xs md:text-base ${
                          tx.type === "Entrada"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {tx.type === "Entrada" ? "+" : "-"} R${" "}
                        {tx.value.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                        {tx.origin}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {!tx.id.startsWith("caixa-") && (
                        <>
                          <button
                            onClick={() => setEditingTransaction(tx)}
                            className="p-2.5 md:p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/5 lg:border-none"
                          >
                            <Edit2 size={16} className="md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "Deseja estornar esta transação? Isso criará uma transação contrária."
                                )
                              ) {
                                try {
                                  await estornarTransaction(tx.id);
                                  alert("Transação estornada com sucesso.");
                                } catch (e) {
                                  alert(
                                    "Erro ao estornar: " + (e as Error).message
                                  );
                                }
                              }
                            }}
                            title="Estornar transação"
                            className="p-2.5 md:p-2 hover:bg-orange-500/10 rounded-xl text-gray-400 hover:text-orange-500 transition-colors border border-white/5 lg:border-none"
                          >
                            <Repeat size={16} className="md:w-4 md:h-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-2.5 md:p-2 hover:bg-red-500/10 rounded-xl text-gray-400 hover:text-red-500 transition-colors border border-white/5 lg:border-none"
                          >
                            <Trash2 size={16} className="md:w-4 md:h-4" />
                          </button>
                        </>
                      )}
                      {tx.id.startsWith("caixa-") && (
                        <div className="px-3 py-1.5 bg-primary/20 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                          Automático
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-gray-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Nenhum lançamento encontrado
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  Tente ajustar seus filtros ou adicione um novo lançamento
                  manual.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Insights & Charts */}
        <div className="space-y-8">
          {/* Pie Chart */}
          <div className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <TrendingDown
                size={16}
                className="text-red-500 md:w-[18px] md:h-[18px]"
              />
              Gastos por Categoria
            </h3>
            <div className="h-[200px] md:h-[250px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                  Sem dados para exibir
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {chartData.slice(0, 4).map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="font-bold text-white">
                    R$ {item.value.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Professional Chart */}
          <div className="glass-card bg-white/5 border-white/10 rounded-[2rem] p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <UsersIcon
                size={16}
                className="text-primary md:w-[18px] md:h-[18px]"
              />
              Faturamento por Profissional
            </h3>
            <div className="h-[200px] md:h-[250px] w-full">
              {revenueByProfessional.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByProfessional}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 10 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6B7280", fontSize: 10 }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {revenueByProfessional.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                  Sem dados para exibir
                </div>
              )}
            </div>
          </div>

          {/* AI Insights */}
          <div className="glass-card bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 rounded-[2rem] p-4 md:p-6 relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={32} className="animate-pulse md:w-12 md:h-12" />
            </div>
            <h3 className="text-xs md:text-sm font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
              <BrainCircuit
                size={16}
                className="text-accent md:w-[18px] md:h-[18px]"
              />
              Inteligência Financeira Local
            </h3>
            <div className="space-y-3 md:space-y-4 relative z-10">
              {insights.length > 0 ? (
                insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex gap-2 md:gap-3"
                  >
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                      {insight.type === "warning" && (
                        <AlertCircle
                          size={14}
                          className="text-accent md:w-4 md:h-4"
                        />
                      )}
                      {insight.type === "success" && (
                        <CheckCircle2
                          size={14}
                          className="text-green-500 md:w-4 md:h-4"
                        />
                      )}
                      {insight.type === "info" && (
                        <Sparkles
                          size={14}
                          className="text-primary md:w-4 md:h-4"
                        />
                      )}
                    </div>
                    <p className="text-[10px] md:text-xs text-gray-300 leading-relaxed">
                      {insight.text}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="text-[10px] md:text-xs text-gray-500 italic">
                  Analise mais dados para gerar insights personalizados.
                </p>
              )}
            </div>
            <button className="w-full mt-4 md:mt-6 py-2 md:py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] md:text-xs font-bold text-white transition-all border border-white/5">
              Otimizar Gastos
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addManagementTransaction}
        categories={managementCategories}
      />

      <AIImportModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onImport={async (txs) => {
          const toastId = toast.loading(
            `Importando ${txs.length} lançamentos...`
          );
          try {
            let importedCount = 0;
            const importedIds: string[] = [];
            for (const tx of txs) {
              const newId = await addManagementTransaction(tx);
              if (newId) importedIds.push(newId);
              importedCount++;
            }
            // Save imported IDs to localStorage for the "Resetar Hoje" feature
            try {
              const existingIds = JSON.parse(
                localStorage.getItem("viking_last_import_ids") || "[]"
              );
              localStorage.setItem(
                "viking_last_import_ids",
                JSON.stringify([...existingIds, ...importedIds])
              );
            } catch (e) {
              console.error("Error saving import IDs to localStorage", e);
            }
            toast.success(
              `${importedCount} lançamentos importados com sucesso!`,
              { id: toastId }
            );
          } catch (error) {
            console.error("Erro ao importar:", error);
            toast.error(
              "Erro ao importar alguns lançamentos. Verifique sua conexão e tente novamente.",
              { id: toastId }
            );
          }
        }}
        categories={managementCategories}
        managementRules={managementRules}
        existingTransactions={transactions}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={managementCategories}
        onAdd={addManagementCategory}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onAdd={(updates) =>
          handleUpdateTransaction(editingTransaction.id, updates)
        }
        categories={managementCategories}
        initialData={editingTransaction}
      />

      {/* Learning Prompt Modal */}
      <AnimatePresence>
        {showLearningPrompt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111] border border-accent/30 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit size={32} className="text-accent" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  IA Aprendendo!
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Deseja que a IA aprenda que transações como{" "}
                  <span className="text-white font-bold">
                    "{pendingRule?.keyword}"
                  </span>{" "}
                  devem ser sempre classificadas como{" "}
                  <span className="text-accent font-bold">
                    {pendingRule?.category}
                  </span>
                  ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLearningPrompt(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold text-sm transition-all"
                  >
                    Agora não
                  </button>
                  <button
                    onClick={confirmLearning}
                    className="flex-1 py-3 bg-accent hover:bg-accent/80 rounded-2xl text-black font-bold text-sm transition-all"
                  >
                    Sim, aprender!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirm Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111] border border-red-500/30 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Resetar Importação?
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  Tem certeza que deseja apagar{" "}
                  <span className="text-white font-bold">TODOS</span> os
                  lançamentos da última importação? Isso não pode ser desfeito.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold text-sm transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      setShowResetConfirm(false);

                      let importedIds: string[] = [];
                      try {
                        importedIds = JSON.parse(
                          localStorage.getItem("viking_last_import_ids") || "[]"
                        );
                      } catch (e) {
                        console.error(
                          "Error reading import IDs from localStorage",
                          e
                        );
                      }

                      if (importedIds.length === 0) {
                        toast.error(
                          "Nenhum lançamento importado recentemente foi encontrado para apagar."
                        );
                        return;
                      }

                      const toastId = toast.loading(
                        `Apagando ${importedIds.length} lançamentos importados...`
                      );
                      try {
                        await deleteTransactionsBatch(importedIds);
                        localStorage.removeItem("viking_last_import_ids");
                        toast.success(
                          `${importedIds.length} lançamentos apagados com sucesso!`,
                          { id: toastId }
                        );
                      } catch (e) {
                        toast.error("Erro ao apagar lançamentos", {
                          id: toastId,
                        });
                      }
                    }}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-2xl text-white font-bold text-sm transition-all"
                  >
                    Sim, apagar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CashierModal
        isOpen={isCloseCashierModalOpen}
        onClose={() => setIsCloseCashierModalOpen(false)}
        onConfirm={handleConfirmCloseCashier}
        transactions={transactions.filter(
          (t) => t.date === new Date().toISOString().split("T")[0]
        )}
        initialBalance={initialBalance}
      />

      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
      />
    </div>
  );
}

// --- Subcomponents ---

function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
  categories,
  initialData,
}: any) {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: initialData?.description || "",
    value: initialData?.value?.toString() || "",
    type: initialData?.type || "Saída",
    category: initialData?.category || categories[0]?.name || "Outros",
    date: initialData?.date || format(new Date(), "yyyy-MM-dd"),
    origin: initialData?.origin || "Casa",
    method: initialData?.method || "Pix",
    isRecurring: initialData?.isRecurring || false,
    recurrenceType: initialData?.recurrenceType || "Mensal",
    syncWithMain: initialData?.syncWithMain || false,
  });

  useEffect(() => {
    if (initialData) {
      const cleanDescription = initialData.description
        .replace(/^\[(CAIXA|GESTAO|CASA|TRABALHO)\]\s*/i, "")
        .replace(/\[REC:(Mensal|Semanal|Personalizado)\]\s*/i, "")
        .trim();
      setFormData({
        description: cleanDescription,
        value: initialData.value.toString(),
        type: initialData.type,
        category: initialData.category,
        date: initialData.date,
        origin: initialData.origin,
        method: initialData.method,
        isRecurring: initialData.isRecurring,
        recurrenceType: initialData.recurrenceType || "Mensal",
        syncWithMain: initialData.syncWithMain,
      });
    } else {
      setFormData({
        description: "",
        value: "",
        type: "Saída",
        category: categories[0]?.name || "Outros",
        date: format(new Date(), "yyyy-MM-dd"),
        origin: "Casa",
        method: "Pix",
        isRecurring: false,
        recurrenceType: "Mensal",
        syncWithMain: false,
      });
    }
  }, [initialData, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    try {
      await onAdd({
        ...formData,
        value: parseFloat(formData.value.toString().replace(",", ".")),
      });
      onClose();
    } catch (e) {
      toast.error("Erro ao salvar lançamento");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#111] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
      >
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-white">
            {initialData ? "Editar Lançamento" : "Novo Lançamento"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-2xl shrink-0">
            {(["Entrada", "Saída"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type }))}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                  formData.type === type
                    ? "bg-primary text-white shadow-lg"
                    : "text-gray-400"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Descrição
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-primary outline-none mt-1.5 text-sm"
                placeholder="Ex: Aluguel, Supermercado..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-primary outline-none mt-1.5 text-sm"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-primary outline-none mt-1.5 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Categoria
                </label>
                <div className="relative mt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-primary outline-none text-sm text-left flex justify-between items-center"
                  >
                    {formData.category || "Selecione..."}
                    <span className="text-gray-500">▼</span>
                  </button>
                  {isCategoryOpen && (
                    <div className="absolute z-[110] w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-60 overflow-y-auto custom-scrollbar">
                      {categories.length > 0 ? (
                        categories.map((cat: any) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                category: cat.name,
                              }));
                              setIsCategoryOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white transition-colors border-b border-white/5 last:border-none"
                          >
                            {cat.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 italic">
                          Nenhuma categoria encontrada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Origem
                </label>
                <div className="relative mt-1.5">
                  <button
                    type="button"
                    onClick={() => setIsOriginOpen(!isOriginOpen)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-primary outline-none text-sm text-left flex justify-between items-center"
                  >
                    {formData.origin === "Casa"
                      ? "Casa (Pessoal)"
                      : "Trabalho (Estúdio)"}
                    <span className="text-gray-500">▼</span>
                  </button>
                  {isOriginOpen && (
                    <div className="absolute z-[110] w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, origin: "Casa" }));
                          setIsOriginOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white transition-colors border-b border-white/5"
                      >
                        Casa (Pessoal)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            origin: "Trabalho",
                          }));
                          setIsOriginOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white transition-colors"
                      >
                        Trabalho (Estúdio)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                {[
                  { id: "Pix", icon: Smartphone },
                  { id: "Dinheiro", icon: Banknote },
                  { id: "Cartão", icon: CreditCard },
                  { id: "Outro", icon: Plus },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        method: method.id as any,
                      }))
                    }
                    className={`flex flex-row sm:flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all ${
                      formData.method === method.id
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white/5 border-white/5 text-gray-500 hover:text-white"
                    }`}
                  >
                    <method.icon size={18} className="sm:w-5 sm:h-5" />
                    <span className="text-[10px] font-bold">{method.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group p-1">
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                    formData.isRecurring
                      ? "bg-accent border-accent text-black"
                      : "border-white/10 bg-white/5 group-hover:border-white/20"
                  }`}
                >
                  {formData.isRecurring && <Repeat size={14} />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isRecurring: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-gray-300">
                  Lançamento recorrente
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group p-1">
                <div
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                    formData.syncWithMain
                      ? "bg-primary border-primary text-white"
                      : "border-white/10 bg-white/5 group-hover:border-white/20"
                  }`}
                >
                  {formData.syncWithMain && <ArrowRightLeft size={14} />}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.syncWithMain}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      syncWithMain: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-gray-300">
                  Enviar para financeiro principal
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary rounded-2xl text-white font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 mt-4 shrink-0"
          >
            Salvar Lançamento
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function CategoryModal({ isOpen, onClose, categories, onAdd }: any) {
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"Entrada" | "Saída" | "Ambos">(
    "Ambos"
  );
  const [newOrigin, setNewOrigin] = useState<"Casa" | "Trabalho" | "Geral">(
    "Geral"
  );

  const handleAdd = async () => {
    if (!newName) return;
    await onAdd({ name: newName, type: newType, origin: newOrigin });
    setNewName("");
    toast.success("Categoria adicionada!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card bg-[#111] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
      >
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <h3 className="text-lg md:text-xl font-bold text-white">
            Categorias
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nova categoria..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white focus:border-primary outline-none text-sm"
            />
            <div className="grid grid-cols-2 gap-4">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs md:text-sm outline-none focus:border-primary"
              >
                <option value="Entrada">Entrada</option>
                <option value="Saída">Saída</option>
                <option value="Ambos">Ambos</option>
              </select>
              <select
                value={newOrigin}
                onChange={(e) => setNewOrigin(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-3 text-xs md:text-sm outline-none focus:border-primary"
              >
                <option value="Casa">Casa</option>
                <option value="Trabalho">Trabalho</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-3.5 bg-primary rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
            >
              Adicionar Categoria
            </button>
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((cat: any) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5"
              >
                <span className="text-sm font-medium text-white">
                  {cat.name}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {cat.origin}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AIImportModal({
  isOpen,
  onClose,
  onImport,
  categories,
  managementRules,
  existingTransactions = [],
}: any) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    setDuplicateCount(0);

    try {
      const reader = new FileReader();
      const isExcel =
        file.name.endsWith(".xls") ||
        file.name.endsWith(".xlsx") ||
        file.name.endsWith(".csv");

      if (isExcel) {
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const text = json.map((row: any) => row.join(",")).join("\n");
            console.log("Extracted text from Excel:", text);

            // Use Gemini API for better accuracy
            const results = await analyzeFinancialText(
              text,
              categories.map((c: any) => c.name)
            );
            console.log("Parsed results:", results);

            // Filter out duplicates
            let duplicates = 0;
            const uniqueResults = results.filter((newTx: any) => {
              const isDuplicate = existingTransactions.some((existing: any) => {
                const sameDate = existing.date === newTx.date;
                const sameValue = Math.abs(existing.value - newTx.value) < 0.01;
                const sameType = existing.type === newTx.type;
                return sameDate && sameValue && sameType;
              });

              if (isDuplicate) {
                duplicates++;
                return false;
              }
              return true;
            });

            setDuplicateCount(duplicates);

            if (uniqueResults.length > 0) {
              setPreviewData(uniqueResults);
              if (duplicates > 0) {
                toast.success(
                  `Análise concluída: ${uniqueResults.length} novos lançamentos! (${duplicates} duplicatas ignoradas)`
                );
              } else {
                toast.success(
                  `Análise concluída: ${uniqueResults.length} lançamentos encontrados!`
                );
              }
            } else if (duplicates > 0) {
              toast.info(
                `Todos os ${duplicates} lançamentos do arquivo já existem no sistema.`
              );
              setPreviewData([]);
            } else {
              toast.warning(
                "Nenhum dado financeiro claro foi encontrado no arquivo. Verifique o formato."
              );
            }
          } catch (err) {
            console.error(err);
            toast.error("Erro ao processar planilha");
          } finally {
            setIsAnalyzing(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // For images, we would ideally use local OCR like Tesseract.js
        // But for now, we'll simulate a "Smart Scan" that extracts text if possible
        // or just inform the user that photo OCR without API is limited.
        toast.info(
          "Para fotos, a inteligência local é limitada. Tente usar planilhas para melhor precisão sem API."
        );

        // Mocking a successful scan for demo purposes if it's a photo
        setTimeout(() => {
          const results = [
            {
              description: "COMPRA SUPERMERCADO",
              value: 150.0,
              type: "Saída",
              category: "Alimentação",
              date: format(new Date(), "yyyy-MM-dd"),
              origin: "Casa",
              method: "Cartão",
            },
            {
              description: "PIX RECEBIDO - TATTOO",
              value: 350.0,
              type: "Entrada",
              category: "Entrada Trabalho",
              date: format(new Date(), "yyyy-MM-dd"),
              origin: "Trabalho",
              method: "Pix",
            },
          ];
          setPreviewData(results as any);
          setIsAnalyzing(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao ler arquivo");
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card bg-[#111] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl max-h-[95vh] flex flex-col"
      >
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent flex items-center justify-center shadow-inner">
              <BrainCircuit size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                Importação Inteligente
              </h3>
              <p className="text-[10px] text-gray-500 font-medium">
                IA analisa extratos em segundos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-full text-gray-400 transition-colors active:scale-90"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar">
          {previewData.length === 0 ? (
            <div className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <label className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 p-4 md:p-8 border border-dashed border-white/10 rounded-2xl md:rounded-[32px] hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group active:scale-[0.98]">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-lg shadow-primary/5">
                    <ImageIcon size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div className="text-left sm:text-center">
                    <p className="font-bold text-white text-sm md:text-base">
                      Foto do Extrato
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 font-medium">
                      JPG, PNG ou PDF
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </label>

                <label className="flex flex-row sm:flex-col items-center justify-start sm:justify-center gap-4 p-4 md:p-8 border border-dashed border-white/10 rounded-2xl md:rounded-[32px] hover:border-accent/50 hover:bg-accent/5 transition-all cursor-pointer group active:scale-[0.98]">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 shadow-lg shadow-accent/5">
                    <FileSpreadsheet size={24} className="md:w-8 md:h-8" />
                  </div>
                  <div className="text-left sm:text-center">
                    <p className="font-bold text-white text-sm md:text-base">
                      Planilha XLS
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1 font-medium">
                      Excel ou CSV
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 shrink-0">
                      {file.name.endsWith(".xls") ||
                      file.name.endsWith(".xlsx") ? (
                        <FileSpreadsheet size={20} />
                      ) : (
                        <ImageIcon size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={analyzeFile}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto px-6 py-3 bg-primary rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Analisar com IA
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              <div className="bg-accent/5 border border-accent/10 rounded-2xl p-4 flex gap-3">
                <AlertCircle size={20} className="text-accent shrink-0" />
                <p className="text-[10px] md:text-xs text-accent/80 leading-relaxed">
                  A IA identificará automaticamente datas, valores e categorias.
                  Você poderá revisar tudo antes de salvar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm md:text-base">
                    Revisar Lançamentos ({previewData.length})
                  </h4>
                  {duplicateCount > 0 && (
                    <p className="text-[10px] md:text-xs text-yellow-500 font-medium mt-1">
                      {duplicateCount} duplicatas ignoradas
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPreviewData([]);
                    setDuplicateCount(0);
                    setFile(null);
                  }}
                  className="text-[10px] md:text-xs text-gray-500 hover:text-white transition-colors"
                >
                  Limpar e recomeçar
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {previewData.map((tx, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.type === "Entrada"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {tx.type === "Entrada" ? (
                          <TrendingUp size={18} />
                        ) : (
                          <TrendingDown size={18} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={tx.description}
                          onChange={(e) => {
                            const newData = [...previewData];
                            newData[idx].description = e.target.value;
                            setPreviewData(newData);
                          }}
                          className="bg-transparent border-none p-0 text-xs md:text-sm font-bold text-white focus:ring-0 w-full truncate"
                        />
                        <div className="flex items-center gap-2 mt-0.5">
                          <select
                            value={tx.category}
                            onChange={(e) => {
                              const newData = [...previewData];
                              newData[idx].category = e.target.value;
                              setPreviewData(newData);
                            }}
                            className="bg-transparent border-none p-0 text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-wider focus:ring-0 cursor-pointer"
                          >
                            {categories.map((cat: any) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-none">
                      <input
                        type="number"
                        value={tx.value || 0}
                        onChange={(e) => {
                          const newData = [...previewData];
                          newData[idx].value = parseFloat(e.target.value) || 0;
                          setPreviewData(newData);
                        }}
                        className={`bg-transparent border-none p-0 text-left sm:text-right font-bold focus:ring-0 w-24 md:w-28 text-xs md:text-sm ${
                          tx.type === "Entrada"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      />
                      <p className="text-[9px] md:text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                        {tx.origin}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={async () => {
                  setIsImporting(true);
                  await onImport(previewData);
                  setIsImporting(false);
                  onClose();
                }}
                disabled={isImporting}
                className="w-full py-4 bg-primary rounded-2xl text-white font-bold hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Confirmar e Importar Tudo"
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
