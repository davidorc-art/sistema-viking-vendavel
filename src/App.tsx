/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Menu, 
  Bell, 
  Wifi,
  Loader2
} from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { VikingLoading } from './components/VikingLoading';
import { VikingGuardian } from './components/VikingGuardian';
import { InstallPrompt } from './components/InstallPrompt';
import { Sidebar } from './components/Sidebar';
import { NotificationPanel } from './components/NotificationPanel';
import { PendingApprovalsNotifier } from './components/PendingApprovalsNotifier';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { SubscriptionBlock } from './components/SubscriptionBlock';
import Login from './pages/Login';
import Agenda from './pages/Agenda';
import Clientes from './pages/Clientes';
import Profissionais from './pages/Profissionais';
import Estoque from './pages/Estoque';
import Fidelidade from './pages/Fidelidade';
import Gestao from './pages/Gestao';
import Loja from './pages/Loja';
import Bar from './pages/Bar';
import Configuracoes from './pages/Configuracoes';
import Dashboard from './pages/Dashboard';
import Relatorios from './pages/Relatorios';
import Marketing from './pages/Marketing';
import Booking from './pages/Booking';
import GeradorDeLinks from './pages/GeradorDeLinks';
import BookingSuccess from './pages/BookingSuccess';
import ConsentForm from './pages/ConsentForm';
import ImportLegacy from './pages/ImportLegacy';
import BackupRestore from './pages/BackupRestore';
import ClientPortal from './pages/ClientPortal';
import Reschedule from './pages/Reschedule';
import MasterDashboard from './pages/MasterDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import Pagamento from './pages/Pagamento';

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-6">
            <Menu size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado.</h1>
          <p className="text-gray-400 max-w-md mb-8">
            Ocorreu um erro inesperado. Tente recarregar a página ou voltar para o início.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 w-full max-w-lg text-left overflow-auto max-h-40 custom-scrollbar">
            <code className="text-xs text-destructive font-mono">
              {this.state.error?.message || "Erro desconhecido"}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary rounded-xl text-white font-bold hover:scale-105 transition-transform"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const AppContent = () => {
  const { user, client, loading: authLoading } = useAuth();
  const { appointments, isSyncing, dismissedNotifications, refreshData } = useData();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const location = useLocation();

  // Resilient path normalization
  const rawPath = location.pathname.toLowerCase().replace(/\/+/g, '/');
  const finalPath = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;
  
  // Use window path as secondary check for standalone routes
  const windowPathRaw = window.location.pathname.toLowerCase().replace(/\/+/g, '/');
  const finalWindowPath = (windowPathRaw.length > 1 && windowPathRaw.endsWith('/')) ? windowPathRaw.slice(0, -1) : windowPathRaw;

  const standalonePaths = ['/booking', '/booking-success', '/consent', '/reschedule', '/loyalty', '/pagamento'];
  
  const isStandaloneRoute = useMemo(() => {
    const checkPath = (p: string) => {
      if (!p) return false;
      const normalized = p.toLowerCase().replace(/\/+/g, '/').replace(/\/+$/, '');
      
      // Standard path check
      if (standalonePaths.some(standalone => normalized === standalone || normalized.startsWith(`${standalone}/`))) return true;
      
      // Check for standalone paths prefixed by /login (common redirection artifact)
      if (normalized.startsWith('/login')) {
        const afterLogin = normalized.replace('/login', '');
        if (standalonePaths.some(standalone => afterLogin === standalone || afterLogin.startsWith(`${standalone}/`))) return true;
      }

      // Final fallback search
      if (standalonePaths.some(standalone => normalized.includes(standalone))) {
         const found = standalonePaths.find(s => normalized.includes(s));
         if (found && (normalized.endsWith(found) || normalized.includes(`${found}/`))) return true;
      }
      return false;
    };
    const isStandalone = checkPath(finalPath) || checkPath(finalWindowPath);
    if (isStandalone) {
      console.log('ROUTING: Standalone route detected:', { finalPath, finalWindowPath });
    }
    return isStandalone;
  }, [finalPath, finalWindowPath]);

  // Track initial sync completion with safety timeout
  React.useEffect(() => {
    // If it's a standalone route and we are not syncing, we are done
    if (isStandaloneRoute && !isSyncing) {
      setInitialSyncDone(true);
      return;
    }

    if (!isSyncing && !authLoading) {
      setInitialSyncDone(true);
    }

    // Safety timeout: if after 10 seconds we are still "loading", force show the app
    // to avoid white screen/infinite loading if sync hangs
    const timer = setTimeout(() => {
      if (!initialSyncDone) {
        console.warn('ROUTING: Safety timeout reached, forcing initialSyncDone = true');
        setInitialSyncDone(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isSyncing, authLoading, initialSyncDone]);

  // Theme Management
  React.useEffect(() => {
    if (user?.email === 'davidacrizio@gmail.com') {
      document.documentElement.classList.add('theme-david');
    } else {
      document.documentElement.classList.remove('theme-david');
    }
  }, [user]);

  const notificationCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let count = 0;

    // Follow-ups
    appointments.filter(a => a.status === 'Finalizado').forEach(appt => {
      if (!appt.date) return;
      const [year, month, day] = appt.date.split('-').map(Number);
      const apptDate = new Date(year, month - 1, day);
      apptDate.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - apptDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const isPiercing = appt.service.toLowerCase().includes('piercing');
      const isTattoo = !isPiercing;

      let shouldNotify = false;
      if (isTattoo) {
        if ([1, 7, 15].includes(diffDays)) shouldNotify = true;
      } else {
        if ([7, 30].includes(diffDays)) shouldNotify = true;
      }

      if (shouldNotify) {
        const id = `${appt.id}-followup-${diffDays}`;
        if (!dismissedNotifications.includes(id)) {
          count++;
        }
      }
    });

    // New Bookings
    appointments.forEach(appt => {
      if (appt.paymentStatus === 'Pago' && appt.paymentUrl) {
        const id = `new-booking-${appt.id}`;
        if (!dismissedNotifications.includes(id)) {
          count++;
        }
      }
    });

    return count;
  }, [appointments, dismissedNotifications]);

  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith('/consent/')) return 'Termo de Consentimento';
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/agenda': return 'Agenda';
      case '/clientes': return 'Clientes';
      case '/crm': return 'CRM & Marketing';
      case '/profissionais': return 'Profissionais';
      case '/financeiro': return 'Gestão Financeira';
      case '/caixa': return 'Gestão Financeira';
      case '/estoque': return 'Estoque';
      case '/fidelidade': return 'Fidelidade';
      case '/gestao': return 'Gestão Inteligente';
      case '/loja': return 'Loja';
      case '/bar': return 'Bar';
      case '/configuracoes': return 'Configurações';
      case '/relatorios': return 'Relatórios';
      case '/saude-sistema': return 'Saúde do Sistema';
      case '/backup': return 'Backup e Restauro';
      case '/importar-legado': return 'Importar Backup';
      case '/booking': return 'Agendamento';
      case '/gerador-links': return 'Gerador de Links';
      default: 
        if (pathname.startsWith('/reschedule/')) return 'Reagendamento';
        return 'Dashboard';
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes>
        {/* STANDALONE ROUTES (Public) */}
        <Route path="/booking" element={<Booking />} />
        <Route path="/booking-success" element={<BookingSuccess />} />
        <Route path="/consent/:appointmentId" element={<ConsentForm />} />
        <Route path="/reschedule/:appointmentId" element={<Reschedule />} />
        <Route path="/loyalty/:clientId" element={<ClientPortal />} />
        <Route path="/pagamento/:appointmentId" element={<Pagamento />} />

        {/* SAFETY REDIRECTS for incorrectly generated links */}
        <Route path="/agendamento" element={<Navigate to="/booking" replace />} />
        <Route path="/checkout/:appointmentId" element={<Navigate to="/pagamento/:appointmentId" replace />} />
        <Route path="/login/booking" element={<Navigate to="/booking" replace />} />
        <Route path="/login/booking-success" element={<Navigate to="/booking-success" replace />} />
        <Route path="/login/consent/:appointmentId" element={<Navigate to="/consent/:appointmentId" replace />} />
        <Route path="/login/reschedule/:appointmentId" element={<Navigate to="/reschedule/:appointmentId" replace />} />
        <Route path="/login/loyalty/:clientId" element={<Navigate to="/loyalty/:clientId" replace />} />
        <Route path="/login/pagamento/:appointmentId" element={<Navigate to="/pagamento/:appointmentId" replace />} />

        {/* AUTHENTICATION ROUTES */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : (client ? <Navigate to="/portal" replace /> : <Login />)} 
        />

        {/* CLIENT PORTAL ROUTE */}
        <Route 
          path="/portal/*" 
          element={client ? <ClientPortal /> : <Navigate to="/login" replace />} 
        />

        {/* PROTECTED ROUTES (Admin/Professional) */}
        <Route
          path="/*"
          element={
            !user ? (
              <Navigate to="/login" replace />
            ) : (
              <motion.div 
                key="authenticated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-h-screen bg-background flex"
              >
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <main className="flex-1 lg:ml-72 w-full lg:w-[calc(100%-18rem)] overflow-x-hidden min-h-screen flex flex-col">
                  <SubscriptionBlock />
                  <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Menu size={24} />
                      </button>
                      <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                        {getPageTitle(location.pathname)}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Connection Status Badge */}
                      <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
                        isSyncing 
                          ? "bg-orange-500/10 border-orange-500/20 text-orange-500" 
                          : "bg-success/10 border-success/20 text-success"
                      }`}>
                        {isSyncing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Wifi size={12} />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {isSyncing ? "Sincronizando" : "Conectado"}
                        </span>
                      </div>

                      <button 
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative p-2 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <Bell size={24} className="text-gray-400" />
                        {notificationCount > 0 && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-background shadow-[0_0_10px_rgba(var(--color-primary),0.5)]">
                            {notificationCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </header>

                  <div className="p-4 lg:p-8 space-y-8 max-w-[1600px] w-full mx-auto flex-1">
                    <NotificationPanel 
                      isOpen={isNotificationsOpen} 
                      onClose={() => setIsNotificationsOpen(false)} 
                    />

                    <PendingApprovalsNotifier />

                    <AnimatePresence mode="wait">
                    <motion.div
                      key={finalPath}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1"
                    >
                      <Routes location={{ ...location, pathname: finalPath }}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/relatorios" element={<Relatorios />} />
                        <Route path="/saude-sistema" element={<MasterDashboard />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/clientes" element={<Clientes />} />
                        <Route path="/crm" element={<Marketing />} />
                        <Route path="/profissionais" element={<Profissionais />} />
                        <Route path="/financeiro" element={<Navigate to="/gestao" replace />} />
                        <Route path="/caixa" element={<Navigate to="/gestao" replace />} />
                        <Route path="/estoque" element={<Estoque />} />
                        <Route path="/fidelidade" element={<Fidelidade />} />
                        <Route path="/gestao" element={<Gestao />} />
                        <Route path="/loja" element={<Loja />} />
                        <Route path="/bar" element={<Bar />} />
                        <Route path="/configuracoes" element={<Configuracoes />} />
                        <Route path="/gerador-links" element={<GeradorDeLinks />} />
                        <Route path="/backup" element={<BackupRestore />} />
                        <Route path="/importar-legado" element={<ImportLegacy />} />
                        <Route path="/meu-painel" element={<ProfessionalDashboard />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </motion.div>
                  </AnimatePresence>
                  <InstallPrompt />
                  </div>
                </main>
              </motion.div>
            )
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" theme="dark" closeButton richColors />
      <Router>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}
