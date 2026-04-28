import React, { useMemo, useState, useEffect } from "react";
import {
  Star,
  Gift,
  History,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Award,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  User,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  Phone,
  Mail,
  Edit2,
  X,
  CreditCard,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../context/DataContext";
import { useLoyalty } from "../hooks/useLoyalty";
import { useAuth } from "../context/AuthContext";
import {
  format,
  differenceInDays,
  parseISO,
  isAfter,
  isBefore,
  addHours,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import { Appointment, Client } from "../types";

type TabType =
  | "home"
  | "history"
  | "appointments"
  | "loyalty"
  | "services"
  | "profile";

export default function ClientPortal() {
  const { client, clientLogout } = useAuth();
  const { clientId: urlClientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const {
    appointments,
    loyaltyTransactions,
    transactions,
    rewards,
    isSyncing,
    addLoyaltyTransaction,
    addAppointment,
    updateAppointment,
    professionals,
    products,
    updateClient,
    settings,
  } = useData();

  const clientId = client?.id || urlClientId || "";
  const loyaltyData = useLoyalty(clientId) as any;
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<Partial<Client>>({});

  const [redeemingReward, setRedeemingReward] = useState<string | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(
    null
  );
  const [serviceCategory, setServiceCategory] = useState("Todos");
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);

  useEffect(() => {
    if (client) {
      const fullClient = loyaltyData;
      setProfileData({
        name: fullClient?.name || "",
        email: fullClient?.email || "",
        phone: fullClient?.phone || "",
        birthDate: fullClient?.birthDate || "",
        instagram: fullClient?.instagram || "",
      });
    }
  }, [client, loyaltyData]);

  const handleRedeemReward = async (reward: any) => {
    if (!clientId || availablePoints < reward.points) return;

    setRedeemingReward(reward.id);
    try {
      // 1. Add loyalty transaction (redemption)
      await addLoyaltyTransaction({
        clientId: clientId,
        points: -reward.points,
        type: "Resgate",
        description: `Resgate: ${reward.title}`,
        date: new Date().toISOString().split("T")[0],
      });

      // 2. Update client points
      await updateClient(clientId, {
        points: availablePoints - reward.points,
      });

      toast.success(
        `Parabéns! Você resgatou: ${reward.title}. Mostre este aviso à equipe para receber seu item.`
      );
    } catch (err) {
      toast.error("Ocorreu um erro ao resgatar a recompensa.");
    } finally {
      setRedeemingReward(null);
    }
  };

  const stats = useMemo(() => {
    if (!loyaltyData) return null;
    const clientAppts = appointments.filter(
      (a) =>
        a.clientId === clientId &&
        a.approvalStatus !== "Reprovado" &&
        !a.service.toUpperCase().includes("TESTE") &&
        !a.service.toUpperCase().includes("TEST")
    );
    const past = clientAppts.filter(
      (a) => (isBefore(parseISO(a.date), new Date()) || a.status === "Finalizado") && a.status !== 'Cancelado'
    );
    const upcoming = clientAppts.filter(
      (a) =>
        isAfter(parseISO(`${a.date}T${a.time}`), new Date()) &&
        a.status !== "Cancelado" &&
        a.status !== "Finalizado"
    );

    return {
      totalWorks: past.length,
      upcomingCount: upcoming.length,
      nextAppointment: upcoming.sort(
        (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
      )[0],
      pastAppointments: past.sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()
      ),
      upcomingAppointments: upcoming.sort(
        (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()
      ),
    };
  }, [appointments, clientId, loyaltyData]);

  const upcomingAppointments = stats?.upcomingAppointments || [];
  const pastAppointments = stats?.pastAppointments || [];

  if (isSyncing && !loyaltyData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="mx-auto text-primary animate-spin" />
          <p className="text-primary font-bold animate-pulse uppercase tracking-[0.2em]">
            Entrando no Valhalla...
          </p>
        </div>
      </div>
    );
  }

  // Allow access if we have loyaltyData (even without auth client context)
  if (!loyaltyData && !isSyncing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Cliente não encontrado ou sessão expirada.</p>
      </div>
    );
  }

  if (!loyaltyData) return null; // Should be handled above

  // Use loyaltyData for name if client object isn't available
  const clientName = client?.name || loyaltyData.name || "Guerreiro(a)";

  const { level, availablePoints, totalSpent, nextLevelPoints, progress } =
    loyaltyData.loyaltyStats;

  const handleExportHistory = () => {
    try {
      const dataStr = JSON.stringify(loyaltyData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
      const exportFileDefaultName = `historico_${clientName.replace(
        /\s+/g,
        "_"
      )}_${new Date().getTime()}.json`;
      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();
      toast.success("Histórico exportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar histórico.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateClient(clientId, profileData);
      setEditingProfile(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar perfil.");
    }
  };

  const handleRescheduleAppointment = (appt: Appointment) => {
    try {
      const apptDate =
        appt.date && appt.time
          ? parseISO(`${appt.date.split("T")[0]}T${appt.time.substring(0, 5)}`)
          : new Date();
      const now = new Date();
      const hoursDiff = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (!isNaN(hoursDiff) && hoursDiff < 24) {
        toast.error("Reagendamento só é permitido com 24h de antecedência.");
        return;
      }
    } catch (e) {
      console.warn("Date parse error", e);
    }

    navigate(`/reschedule/${appt.id}`);
  };

  const handleCancelAppointment = (appt: Appointment) => {
    try {
      const apptDate =
        appt.date && appt.time
          ? parseISO(`${appt.date.split("T")[0]}T${appt.time.substring(0, 5)}`)
          : new Date();
      const now = new Date();
      const hoursDiff = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (!isNaN(hoursDiff) && hoursDiff < 24) {
        toast.error("Cancelamento só é permitido com 24h de antecedência.");
        return;
      }
    } catch (e) {
      console.warn("Date parse error", e);
    }

    setAppointmentToCancel(appt);
  };

  const confirmCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    try {
      await updateAppointment(appointmentToCancel.id, {
        status: "Cancelado",
        approvalStatus: "Reprovado",
      });
      toast.success("Cancelamento realizado com sucesso.");
      setAppointmentToCancel(null);
    } catch (err) {
      toast.error("Erro ao cancelar agendamento.");
    }
  };

  return (
    <div className="h-[100dvh] bg-[#050505] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[150px] rounded-full" />
      </div>

      {/* Sidebar Nav (Mobile bottom, Desktop left) */}
      <nav className="w-full md:w-72 bg-black/80 md:bg-black/40 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/5 p-4 md:p-8 flex md:flex-col justify-between items-center md:items-start z-50 fixed bottom-0 left-0 right-0 md:relative md:order-first pb-safe pb-8 md:pb-8">
        <div className="hidden md:flex flex-col space-y-8 mb-12 w-full">
          <div className="flex items-center gap-3 px-2">
            <div className="p-3 bg-primary/20 text-primary rounded-2xl border border-primary/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold italic uppercase tracking-tight">
                Portal
              </h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Guardião Viking
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: "home", icon: TrendingUp, label: "Resumo" },
              { id: "appointments", icon: Calendar, label: "Agendamentos" },
              { id: "history", icon: History, label: "Histórico" },
              { id: "loyalty", icon: Award, label: "Fidelidade" },
              { id: "services", icon: ShoppingBag, label: "Serviços" },
              { id: "profile", icon: User, label: "Meus Dados" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group",
                  activeTab === item.id
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(255,107,0,0.2)] border border-primary/50"
                    : "text-gray-500 hover:text-white hover:bg-white/5 border border-transparent"
                )}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "transition-transform group-hover:scale-110",
                    activeTab === item.id ? "text-white" : "text-gray-500"
                  )}
                />
                <span className="text-sm font-bold uppercase tracking-widest">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Mini Nav */}
        <div className="flex md:hidden w-full justify-around items-center gap-2">
          <button
            onClick={() => setActiveTab("home")}
            className={cn(
              "p-4 rounded-[20px] transition-all flex flex-col items-center gap-1",
              activeTab === "home"
                ? "bg-primary text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] scale-110"
                : "text-gray-500 hover:bg-white/5"
            )}
          >
            <TrendingUp size={20} />
            <span className="text-[8px] uppercase font-bold tracking-widest">
              Resumo
            </span>
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={cn(
              "p-4 rounded-[20px] transition-all flex flex-col items-center gap-1",
              activeTab === "appointments"
                ? "bg-primary text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] scale-110"
                : "text-gray-500 hover:bg-white/5"
            )}
          >
            <Calendar size={20} />
            <span className="text-[8px] uppercase font-bold tracking-widest">
              Agenda
            </span>
          </button>
          <button
            onClick={() => setActiveTab("loyalty")}
            className={cn(
              "p-4 rounded-[20px] transition-all flex flex-col items-center gap-1",
              activeTab === "loyalty"
                ? "bg-primary text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] scale-110"
                : "text-gray-500 hover:bg-white/5"
            )}
          >
            <Award size={20} />
            <span className="text-[8px] uppercase font-bold tracking-widest">
              Prêmios
            </span>
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={cn(
              "p-4 rounded-[20px] transition-all flex flex-col items-center gap-1",
              activeTab === "services"
                ? "bg-primary text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] scale-110"
                : "text-gray-500 hover:bg-white/5"
            )}
          >
            <ShoppingBag size={20} />
            <span className="text-[8px] uppercase font-bold tracking-widest">
              Loja
            </span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "p-4 rounded-[20px] transition-all flex flex-col items-center gap-1",
              activeTab === "profile"
                ? "bg-primary text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] scale-110"
                : "text-gray-500 hover:bg-white/5"
            )}
          >
            <User size={20} />
            <span className="text-[8px] uppercase font-bold tracking-widest">
              Conta
            </span>
          </button>
        </div>

        <button
          onClick={clientLogout}
          className="hidden md:flex items-center gap-4 w-full px-6 py-4 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all text-sm font-bold uppercase tracking-widest mt-auto shadow-sm"
        >
          <LogOut size={20} />
          <span>Abandonar Barco</span>
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto z-10 relative custom-scrollbar pb-32 md:pb-0">
        {/* Top Header Information */}
        <header className="p-8 md:p-12 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 text-[10px] font-bold text-primary uppercase tracking-[0.3em] bg-primary/10 py-1 px-3 rounded-full border border-primary/20 w-fit"
            >
              <Zap size={10} className="fill-current" />
              Guerreiro {level}
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold italic uppercase tracking-tighter">
              Skål, {clientName.split(" ")[0]}!
            </h2>
            <p className="text-gray-500 text-sm font-medium">
              Benvindo de volta ao Salão de Valhalla.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-[32px] border border-white/10 backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-xl font-black shadow-lg">
              {clientName.charAt(0)}
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Seu Saldo
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">
                  {availablePoints}
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                  Points
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {/* HOME VIEW */}
            {activeTab === "home" && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-card p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors">
                      <TrendingUp size={80} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Total de Sessões
                    </p>
                    <p className="text-5xl font-black mb-4">
                      {stats?.totalWorks}
                    </p>
                    <p className="text-xs text-gray-600 font-medium italic">
                      História escrita em sua pele e alma.
                    </p>
                  </div>

                  <div className="bg-card p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-accent/10 group-hover:text-accent/20 transition-colors">
                      <Zap size={80} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Nível de Honra
                    </p>
                    <p className="text-5xl font-black mb-4">{level}</p>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-card p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors">
                      <Award size={80} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Fidelidade Mensal
                    </p>
                    <p className="text-5xl font-black mb-4">
                      R$ {totalSpent.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-600 font-medium italic">
                      Seu império cresce a cada visita.
                    </p>
                  </div>
                </div>

                {/* Important Actions / Next Appointment */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Next Appt */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase italic tracking-[0.2em] text-primary flex items-center gap-3">
                      <Calendar size={16} /> Próxima Convocação
                    </h3>
                    {stats?.nextAppointment ? (
                      <div className="bg-gradient-to-br from-primary/20 to-accent/10 p-8 rounded-[48px] border border-white/10 relative overflow-hidden">
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 blur-[80px]" />

                        <div className="relative space-y-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                                Serviço
                              </p>
                              <h4 className="text-2xl font-bold italic uppercase">
                                {stats.nextAppointment.service}
                              </h4>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                Com
                              </p>
                              <p className="font-bold">
                                {stats.nextAppointment.professionalName}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/10 rounded-2xl">
                                <Calendar size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  Data
                                </p>
                                <p className="font-bold">
                                  {format(
                                    parseISO(stats.nextAppointment.date),
                                    "dd/MM/yyyy"
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/10 rounded-2xl">
                                <Clock size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  Hora
                                </p>
                                <p className="font-bold">
                                  {stats.nextAppointment.time}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="pt-6 flex gap-4">
                            <button
                              onClick={() => setActiveTab("appointments")}
                              className="flex-1 py-4 bg-white text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                              Gerenciar
                            </button>
                            <a
                              href="https://wa.me/551199999999"
                              target="_blank"
                              className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center border border-white/10 hover:border-white/20"
                            >
                              <Phone size={20} />
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-card p-12 rounded-[48px] border border-dashed border-white/10 text-center space-y-6">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
                          <Calendar size={32} />
                        </div>
                        <p className="text-gray-500 font-medium italic">
                          Seu destino ainda não foi traçado.
                        </p>
                        <button
                          onClick={() => setActiveTab("services")}
                          className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(255,107,0,0.4)]"
                        >
                          Marcar Minha Sessão
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Profile */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold uppercase italic tracking-[0.2em] text-accent flex items-center gap-3">
                      <User size={16} /> Identidade Guardiã
                    </h3>
                    <div className="bg-card p-8 rounded-[48px] border border-white/5 space-y-8">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[24px] flex items-center justify-center">
                          <Shield size={40} className="text-accent" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold italic uppercase">
                            {clientName}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            CPF: {loyaltyData.cpf}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-4 px-6 py-4 bg-black/40 rounded-3xl border border-white/5">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-sm font-medium">
                            {loyaltyData?.phone || "Não inf."}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 px-6 py-4 bg-black/40 rounded-3xl border border-white/5">
                          <Mail size={16} className="text-gray-500" />
                          <span className="text-sm font-medium text-ellipsis overflow-hidden">
                            {loyaltyData?.email || "Não inf."}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("profile")}
                        className="w-full py-4 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-3xl font-bold uppercase text-[10px] tracking-[0.3em] transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                      >
                        Editar Meus Dados
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* APPOINTMENTS VIEW */}
            {activeTab === "appointments" && (
              <motion.div
                key="appointments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold italic uppercase tracking-tight">
                    Próximas Batalhas
                  </h3>
                  <button
                    onClick={() => setActiveTab("services")}
                    className="p-3 bg-primary text-white rounded-2xl hover:scale-105 transition-all shadow-lg shadow-primary/20"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {stats?.upcomingAppointments &&
                  stats.upcomingAppointments.length > 0 ? (
                    stats.upcomingAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-card p-6 rounded-[32px] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-primary/20 transition-all"
                      >
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-bold text-primary uppercase">
                              {format(parseISO(appt.date), "MMM", {
                                locale: ptBR,
                              })}
                            </span>
                            <span className="text-2xl font-black">
                              {format(parseISO(appt.date), "dd")}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold italic uppercase">
                              {appt.service}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium">
                              Profissional: {appt.professionalName} •{" "}
                              {appt.time}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <div
                            className={cn(
                              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                              appt.status === "Confirmado"
                                ? "bg-success/20 text-success"
                                : appt.status === "Pendente"
                                ? "bg-yellow-500/20 text-yellow-500"
                                : "bg-white/5 text-gray-500"
                            )}
                          >
                            {appt.status}
                          </div>
                          <button
                            onClick={() => handleCancelAppointment(appt)}
                            className="p-2 text-gray-600 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                            title="Cancelar"
                          >
                            <X size={20} />
                          </button>
                          <button
                            onClick={() => handleRescheduleAppointment(appt)}
                            className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            title="Reagendar"
                          >
                            <Edit2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                      <Calendar size={48} className="mx-auto text-gray-700" />
                      <p className="text-gray-500 italic">
                        Nenhum agendamento futuro em vista.
                      </p>
                    </div>
                  )}
                </div>

                {/* Cancel Confirmation Modal */}
                {appointmentToCancel && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#111] p-8 rounded-[40px] max-w-md w-full border border-white/10 text-center space-y-6">
                      <div className="w-20 h-20 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mx-auto">
                        <X size={40} />
                      </div>
                      <h3 className="text-xl font-bold uppercase tracking-tight">
                        Cancelar Agendamento
                      </h3>
                      <p className="text-gray-400">
                        Tem certeza que deseja solicitar o cancelamento de{" "}
                        {appointmentToCancel.service} no dia{" "}
                        {appointmentToCancel.date
                          .split("-")
                          .reverse()
                          .join("/")}
                        ?
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setAppointmentToCancel(null)}
                          className="flex-1 py-4 bg-white/5 font-bold uppercase tracking-widest text-xs hover:bg-white/10 active:scale-95 rounded-2xl transition-all"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={confirmCancelAppointment}
                          className="flex-1 py-4 bg-destructive text-white font-bold uppercase tracking-widest text-xs hover:bg-destructive/80 active:scale-95 rounded-2xl transition-all shadow-[0_0_20px_rgba(255,59,48,0.3)]"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* HISTORY VIEW */}
            {activeTab === "history" &&
              (stats?.pastAppointments ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <h3 className="text-2xl font-bold italic uppercase">
                    Crônicas de Batalha
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.pastAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="bg-card p-6 rounded-[32px] border border-white/5 space-y-4"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            {format(parseISO(appt.date), "dd 'de' MMMM, yyyy", {
                              locale: ptBR,
                            })}
                          </span>
                          <div
                            className={cn(
                              "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em]",
                              appt.status === "Finalizado"
                                ? "bg-success/20 text-success"
                                : "bg-destructive/20 text-destructive"
                            )}
                          >
                            {appt.status}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold italic uppercase">
                            {appt.service}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Com {appt.professionalName}
                          </p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest pt-2 border-t border-white/5">
                          <span className="text-gray-600 text-[10px]">
                            Valor da Honra
                          </span>
                          <span className="text-white">
                            R$ {appt.value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : null)}

            {/* FIDELIDADE VIEW */}
            {activeTab === "loyalty" && (
              <motion.div
                key="loyalty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="bg-primary/20 p-8 rounded-[40px] border border-primary/30 flex flex-col md:flex-row gap-8 items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tight">
                      Cofre de Valhalla
                    </h3>
                    <p className="text-sm font-medium text-primary-foreground/70">
                      A cada visita, sua glória aumenta. Resgate recompensas
                      lendárias.
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-bold text-primary-foreground uppercase tracking-widest">
                      Saldo Lendário
                    </p>
                    <p className="text-6xl font-black">{availablePoints}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase italic tracking-widest flex items-center gap-3">
                    <Gift size={20} className="text-primary" /> Espólios
                    Disponíveis
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.filter(r => !r.title.toUpperCase().includes('TESTE') && !r.title.toUpperCase().includes('TEST')).map((reward) => {
                      const canAfford = availablePoints >= reward.points;
                      return (
                        <div
                          key={reward.id}
                          className={cn(
                            "bg-card p-6 rounded-[32px] border transition-all flex flex-col justify-between h-full group",
                            canAfford
                              ? "border-white/10 hover:border-primary/30"
                              : "border-white/5 opacity-40 grayscale"
                          )}
                        >
                          <div className="space-y-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-xl",
                                canAfford
                                  ? "bg-primary/20 text-primary"
                                  : "bg-white/5 text-gray-500"
                              )}
                            >
                              <Gift size={24} />
                            </div>
                            <div>
                              <h5 className="font-bold italic uppercase">
                                {reward.title}
                              </h5>
                              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest leading-relaxed">
                                {reward.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-8 flex items-center justify-between pt-4 border-t border-white/5">
                            <span className="font-black text-lg text-primary">
                              {reward.points}{" "}
                              <span className="text-[10px] uppercase tracking-widest opacity-50">
                                pts
                              </span>
                            </span>
                            {canAfford && (
                              <button
                                onClick={() => handleRedeemReward(reward)}
                                disabled={redeemingReward === reward.id}
                                className="p-3 bg-white text-black rounded-xl hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50"
                              >
                                {redeemingReward === reward.id ? (
                                  <Loader2 className="animate-spin" size={18} />
                                ) : (
                                  <ChevronRight size={18} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ledger */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold uppercase italic tracking-widest flex items-center gap-3">
                    <History size={20} className="text-gray-500" /> Registro de
                    Honra
                  </h4>
                  <div className="bg-card rounded-[40px] border border-white/5 divide-y divide-white/5 overflow-hidden">
                    {loyaltyTransactions
                      .filter((t) => t.clientId === clientId && !t.description.toUpperCase().includes('TESTE') && !t.description.toUpperCase().includes('TEST'))
                      .length > 0 ? (
                      loyaltyTransactions
                        .filter((t) => t.clientId === clientId && !t.description.toUpperCase().includes('TESTE') && !t.description.toUpperCase().includes('TEST'))
                        .map((t) => (
                          <div
                            key={t.id}
                            className="p-6 flex justify-between items-center bg-black/20"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "p-2 rounded-lg",
                                  t.type === "Ganho"
                                    ? "bg-success/20 text-success"
                                    : "bg-destructive/20 text-destructive"
                                )}
                              >
                                {t.type === "Ganho" ? (
                                  <ArrowUpRight size={16} />
                                ) : (
                                  <ArrowDownLeft size={16} />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest">
                                  {t.description}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {format(parseISO(t.date), "dd/MM/yyyy HH:mm")}
                                </p>
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-lg font-black",
                                t.type === "Ganho"
                                  ? "text-success"
                                  : "text-destructive"
                              )}
                            >
                              {t.type === "Ganho" ? "+" : "-"}
                              {t.points}
                            </span>
                          </div>
                        ))
                    ) : (
                      <p className="p-12 text-center text-gray-600 font-medium italic">
                        Nenhuma movimentação histórica.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SERVICES VIEW */}
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12"
              >
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black italic uppercase italic tracking-tighter">
                      Preparar-se para Batalha
                    </h3>
                    <p className="text-sm font-medium text-gray-500">
                      Escolha o serviço e agende seu momento glorioso.
                    </p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                    {[
                      "Todos",
                      ...Array.from(
                        new Set(
                          (settings.services || []).map(
                            (s) => s.category || "Outros"
                          )
                        )
                      ),
                    ].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setServiceCategory(cat)}
                        className={cn(
                          "px-6 py-2 border rounded-full text-[10px] whitespace-nowrap font-black uppercase tracking-[0.2em] transition-all",
                          serviceCategory === cat
                            ? "bg-primary border-primary text-white"
                            : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(settings.services || [])
                    .filter(
                      (s) =>
                        (serviceCategory === "Todos" ||
                        (s.category || "Outros") === serviceCategory) && 
                        !s.name.toUpperCase().includes("TESTE") &&
                        !s.name.toUpperCase().includes("TEST")
                    )
                    .map((service) => (
                      <div
                        key={service.id}
                        className="bg-card rounded-[40px] border border-white/5 overflow-hidden group hover:border-primary/30 transition-all flex flex-col"
                      >
                        <div className="h-48 relative overflow-hidden">
                          <img
                            src={
                              service.image ||
                              "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&q=80&w=800"
                            }
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                              {service.duration} min
                            </span>
                          </div>
                        </div>
                        <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <h4 className="text-xl font-bold italic uppercase leading-none">
                              {service.name}
                            </h4>
                            <p className="text-2xl font-black text-white">
                              {typeof service.price === "number"
                                ? `R$ ${service.price}`
                                : service.price}
                            </p>
                            {service.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              // Redirect to booking with service pre-selected and price info
                              const rawPrice = service.price;
                              const price =
                                typeof rawPrice === "number"
                                  ? rawPrice
                                  : parseFloat(String(rawPrice || 0)) || 0;
                              const params = new URLSearchParams({
                                service: service.name,
                                clientId: clientId,
                                value: String(price),
                                totalValue: String(price),
                                duration: String(service.duration || 60),
                                allowDeposit:
                                  settings.allowDeposit !== false
                                    ? "true"
                                    : "false",
                                depositPercentage: String(
                                  settings.depositPercentage || 50
                                ),
                              });
                              navigate(`/booking?${params.toString()}`);
                            }}
                            className="w-full py-4 bg-white/5 border border-white/10 text-gray-400 group-hover:bg-primary group-hover:text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 active:scale-95 group-hover:shadow-[0_0_20px_rgba(255,107,0,0.4)]"
                          >
                            Agendar Batalha <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  {(settings.services || []).length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <p className="text-gray-500 font-bold uppercase tracking-widest">
                        Nenhum serviço predefinido no momento.
                      </p>
                      <p className="text-xs text-gray-600 italic">
                        Fale conosco para orçamentos exclusivos.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* PROFILE VIEW */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-card rounded-[48px] border border-white/5 overflow-hidden shadow-2xl relative">
                  <div className="h-48 bg-gradient-to-r from-primary/30 to-accent/20 relative">
                    <div className="absolute bottom-[-40px] left-12 w-32 h-32 bg-[#050505] rounded-[32px] p-2 border border-white/10">
                      <div className="w-full h-full bg-white/5 rounded-[24px] flex items-center justify-center text-4xl font-black text-white">
                        {clientName.charAt(0)}
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-12 flex gap-4">
                      <button
                        onClick={() => setEditingProfile(!editingProfile)}
                        className="px-6 py-2 bg-white text-black font-bold rounded-xl text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <Edit2 size={14} />{" "}
                        {editingProfile ? "Cancelar" : "Alterar Meus Dados"}
                      </button>
                    </div>
                  </div>

                  <div className="p-12 pt-20">
                    {editingProfile ? (
                      <form
                        onSubmit={handleUpdateProfile}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">
                              Nome Guerreiro
                            </label>
                            <input
                              value={profileData.name}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  name: e.target.value,
                                })
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">
                              Telefone (Falar via Whatsapp)
                            </label>
                            <input
                              value={profileData.phone}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">
                              Email da Guarda
                            </label>
                            <input
                              value={profileData.email}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  email: e.target.value,
                                })
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-4">
                              Nascimento (Solar)
                            </label>
                            <input
                              type="date"
                              value={profileData.birthDate}
                              onChange={(e) =>
                                setProfileData({
                                  ...profileData,
                                  birthDate: e.target.value,
                                })
                              }
                              className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none"
                            />
                          </div>
                        </div>
                        <button className="w-full py-5 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                          Consolidar Dados
                        </button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              Estado de Honra
                            </p>
                            <p className="text-xl font-bold flex items-center gap-2">
                              CLIENTE ATIVO{" "}
                              <CheckCircle2
                                size={16}
                                className="text-success"
                              />
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              Data de Ingresso
                            </p>
                            <p className="text-xl font-bold">
                              {loyaltyData?.createdAt
                                ? format(
                                    parseISO(loyaltyData.createdAt),
                                    "dd/MM/yyyy"
                                  )
                                : "---"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              Nível Viking
                            </p>
                            <p className="text-xl font-bold uppercase italic text-primary">
                              {level}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/5 p-8 rounded-[40px] border border-white/5 space-y-6">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                            <Shield size={14} /> Zona de Segurança
                          </h5>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed uppercase tracking-widest">
                            Seus dados são protegidos pelo ferro e fogo. Somente
                            capitães autorizados acessam suas informações.
                          </p>
                          <div className="pt-4 flex flex-col gap-3">
                            <button
                              onClick={handleExportHistory}
                              className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all text-gray-400"
                            >
                              Exportar Histórico
                            </button>
                            <button
                              onClick={clientLogout}
                              className="w-full py-3 bg-destructive/10 border border-destructive/10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive hover:text-white transition-all"
                            >
                              Sair do Clan
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Footer (Inside Main) */}
        <footer className="p-12 text-center border-t border-white/5">
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.5em]">
            Skål &copy; 2026 VIKING TATUAGEM
          </p>
        </footer>
      </main>
    </div>
  );
}
