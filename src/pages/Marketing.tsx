import React, { useState, useMemo } from 'react';
import { 
  Users, 
  MessageCircle, 
  Filter, 
  Calendar, 
  Search, 
  Send, 
  ChevronRight,
  Heart,
  Sparkles,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { openWhatsApp } from '../utils/whatsapp';
import { toast } from 'sonner';

type MessageType = 'custom' | 'retorno' | 'downsize' | 'promocional';

interface MessageTemplate {
  id: MessageType;
  label: string;
  icon: React.ElementType;
  text: string;
}

const TEMPLATES: MessageTemplate[] = [
  {
    id: 'retorno',
    label: 'Retorno Tattoo',
    icon: Heart,
    text: 'Olá {{NOME}}! Aqui é do Viking Studio. Como está a cicatrização da sua {{SERVICO}}? Faz {{DIAS}} dias que você veio aqui. Gostaríamos de saber se está tudo bem ou se precisa de algum retoque! 🤘'
  },
  {
    id: 'downsize',
    label: 'Downsize Piercing',
    icon: Zap,
    text: 'Oi {{NOME}}! Tudo bem? Faz {{DIAS}} dias que você colocou seu piercing. Lembre que agora é o momento ideal para fazer o downsize (troca da joia por uma menor) para garantir a cicatrização perfeita. Vamos agendar? ✨'
  },
  {
    id: 'promocional',
    label: 'Promocional',
    icon: Sparkles,
    text: 'Olá {{NOME}}! Temos saudades de você aqui no Viking Studio. Faz tempo que você não nos visita para uma nova arte. Que tal aproveitar que estamos com horários disponíveis e garantir sua próxima tattoo? Responda aqui para conversarmos! 🏴‍☠️'
  }
];

export default function Marketing() {
  const { clients, appointments } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'Tatuagem' | 'Piercing'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate>(TEMPLATES[0]);
  const [customMessage, setCustomMessage] = useState(TEMPLATES[0].text);
  const [minDays, setMinDays] = useState(15);
  const [sentClients, setSentClients] = useState<Set<string>>(new Set());

  // Group appointments by client and find the last one per service type
  const clientServiceStats = useMemo(() => {
    const stats: Record<string, { lastTattoo?: { date: string, days: number }, lastPiercing?: { date: string, days: number }, lastOverall: { date: string, service: string, days: number } }> = {};
    const now = new Date();

    appointments
      .filter(a => a.status === 'Finalizado')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(appt => {
        const apptDate = new Date(appt.date + 'T00:00:00');
        const diffTime = Math.abs(now.getTime() - apptDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isPiercing = appt.service.toLowerCase().includes('piercing');
        
        if (!stats[appt.clientId]) {
          stats[appt.clientId] = { 
            lastOverall: { date: appt.date, service: appt.service, days: diffDays } 
          };
        } else {
          stats[appt.clientId].lastOverall = { date: appt.date, service: appt.service, days: diffDays };
        }

        if (isPiercing) {
          stats[appt.clientId].lastPiercing = { date: appt.date, days: diffDays };
        } else if (appt.service.toLowerCase().includes('tatuagem') || appt.service.toLowerCase().includes('tattoo')) {
          stats[appt.clientId].lastTattoo = { date: appt.date, days: diffDays };
        }
      });

    return stats;
  }, [appointments]);

  const filteredClients = useMemo(() => {
    return clients
      .filter(client => {
        // Only show if not already sent in this session
        if (sentClients.has(client.id)) return false;

        const stats = clientServiceStats[client.id];
        if (!stats) return false;

        const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             client.phone.includes(searchTerm);
        
        let matchesService = false;
        let diffDays = 0;

        if (serviceFilter === 'all') {
          matchesService = true;
          diffDays = stats.lastOverall.days;
        } else if (serviceFilter === 'Tatuagem') {
          matchesService = !!stats.lastTattoo;
          diffDays = stats.lastTattoo?.days || 0;
        } else if (serviceFilter === 'Piercing') {
          matchesService = !!stats.lastPiercing;
          diffDays = stats.lastPiercing?.days || 0;
        }
        
        const matchesDays = diffDays >= minDays;

        return matchesSearch && matchesService && matchesDays;
      })
      .sort((a, b) => {
        const statsA = clientServiceStats[a.id];
        const statsB = clientServiceStats[b.id];
        
        const daysA = serviceFilter === 'all' ? statsA.lastOverall.days : 
                     (serviceFilter === 'Tatuagem' ? statsA.lastTattoo?.days : statsA.lastPiercing?.days) || 0;
        const daysB = serviceFilter === 'all' ? statsB.lastOverall.days : 
                     (serviceFilter === 'Tatuagem' ? statsB.lastTattoo?.days : statsB.lastPiercing?.days) || 0;

        return daysB - daysA;
      });
  }, [clients, clientServiceStats, searchTerm, serviceFilter, minDays]);

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setCustomMessage(template.text);
  };

  const getPersonalizedMessage = (clientName: string, serviceName: string, days: number) => {
    return customMessage
      .replace(/{{NOME}}/g, clientName.split(' ')[0])
      .replace(/{{SERVICO}}/g, serviceName)
      .replace(/{{DIAS}}/g, days.toString());
  };

  const handleSendMessage = (client: any) => {
    const stats = clientServiceStats[client.id];
    if (!stats) return;

    const personalized = getPersonalizedMessage(
      client.name, 
      serviceFilter === 'Piercing' ? 'Piercing' : (serviceFilter === 'Tatuagem' ? 'Tatuagem' : stats.lastOverall.service), 
      serviceFilter === 'all' ? stats.lastOverall.days : (serviceFilter === 'Tatuagem' ? stats.lastTattoo?.days : stats.lastPiercing?.days) || 0
    );
    
    openWhatsApp(client.phone, personalized);
    
    // Add to sent set to hide from list
    setSentClients(prev => new Set([...prev, client.id]));
    
    toast.success(`Mensagem preparada para ${client.name}`);
  };

  const resetSentList = () => {
    setSentClients(new Set());
    toast.info('Lista de contatos reiniciada.');
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/20 text-primary rounded-2xl">
          <MessageCircle size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-bold tracking-tighter text-primary uppercase">CRM & Marketing</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Fidelize seus clientes com mensagens estratégicas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card bg-card border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-primary" size={20} />
              <h2 className="text-lg font-bold">Templates de Mensagem</h2>
            </div>

            <div className="flex flex-col gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplateSelect(t)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl transition-all text-left",
                    selectedTemplate.id === t.id 
                      ? "bg-primary text-black font-bold shadow-lg shadow-primary/20" 
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  <t.icon size={20} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Editar Mensagem</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full h-48 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-primary/50 outline-none resize-none transition-colors"
                placeholder="Escreva sua mensagem aqui..."
              />
              <div className="p-4 bg-white/5 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Info size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Tags Disponíveis</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['{{NOME}}', '{{SERVICO}}', '{{DIAS}}'].map(tag => (
                    <code key={tag} className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded-md font-bold">{tag}</code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Client List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Bar */}
          <div className="glass-card bg-card border-white/5 rounded-[2.5rem] p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome ou celular..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none transition-colors shadow-inner"
                />
              </div>

              <select 
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value as any)}
                className="bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none shadow-inner"
              >
                <option value="all">Todos os Serviços</option>
                <option value="Tatuagem">Somente Tatuagem</option>
                <option value="Piercing">Somente Piercing</option>
              </select>

              <div className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-2xl px-4 py-2">
                <Clock className="text-gray-500" size={18} />
                <div className="flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Min. de Dias</span>
                  <input 
                    type="number" 
                    value={minDays}
                    onChange={(e) => setMinDays(Number(e.target.value))}
                    className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none"
                  />
                </div>
              </div>
            </div>

            {sentClients.size > 0 && (
              <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="text-primary" size={20} />
                  <p className="text-sm font-bold text-primary">
                    {sentClients.size} clientes contactados nesta sessão
                  </p>
                </div>
                <button 
                  onClick={resetSentList}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-xl text-xs font-bold transition-all"
                >
                  <RotateCcw size={14} /> Restaurar Lista
                </button>
              </div>
            )}
          </div>

          {/* Client List */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredClients.length > 0 ? (
                filteredClients.map((client, index) => {
                  const stats = clientServiceStats[client.id];
                  const currentDays = serviceFilter === 'all' ? stats.lastOverall.days : 
                                    (serviceFilter === 'Tatuagem' ? stats.lastTattoo?.days : stats.lastPiercing?.days) || 0;
                  const currentService = serviceFilter === 'all' ? stats.lastOverall.service : serviceFilter;

                  return (
                    <motion.div
                      key={client.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      layout
                      className="group relative"
                    >
                      <div className="glass-card bg-card border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform">
                            {client.name[0]}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg">{client.name}</h3>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar size={12} /> {currentService}
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                                currentDays >= 30 ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
                              )}>
                                {currentDays} dias atrás
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleSendMessage(client)}
                            className="flex-1 md:flex-none py-3 px-6 bg-success text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-success/10"
                          >
                            <MessageCircle size={18} /> Enviar WhatsApp
                          </button>
                          <button className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 glass-card bg-card border-white/5 rounded-[2.5rem] flex flex-col items-center text-center space-y-4"
                >
                  <div className="p-4 bg-white/5 rounded-full text-gray-600">
                    <Filter size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Nenhum cliente encontrado</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Ajuste os filtros de busca, serviço ou período para ver mais resultados.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
