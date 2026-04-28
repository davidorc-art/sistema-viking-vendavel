import React from 'react';
import { cn } from '../lib/utils';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';

interface ActivityItemProps {
  initials: string;
  name: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
  service: string;
  date: string;
  index: number;
}

const ActivityItem = ({ initials, name, status, service, date, index }: ActivityItemProps) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    viewport={{ once: true }}
    whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.02)' }}
    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-4 border-b border-white/5 last:border-0 group cursor-pointer px-2 rounded-xl transition-colors"
  >
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <motion.div 
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-primary font-bold text-sm group-hover:bg-primary/20 transition-colors shrink-0"
      >
        {initials}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">
          <span className={cn(status === 'PENDENTE' ? "text-primary" : "text-gray-400")}>
            [{status}]
          </span> {service} • {date}
        </p>
      </div>
    </div>
    <div className={cn(
      "px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider self-start sm:self-auto shrink-0",
      status === 'PENDENTE' ? "bg-primary/10 text-primary" : "bg-white/5 text-gray-400"
    )}>
      {status}
    </div>
  </motion.div>
);

export function ActivityList() {
  const { appointments, clients } = useData();

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const latestActivities = appointments
    .filter(a => {
      const d = new Date(a.date + 'T00:00:00');
      return !isNaN(d.getTime());
    })
    .sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime())
    .slice(0, 5)
    .map(a => {
      const clientName = a.clientName || getClientName(a.clientId);
      return {
        initials: getInitials(clientName),
        name: clientName,
        status: a.status.toUpperCase() as any,
        service: a.service,
        date: new Date(a.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      };
    });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-[2rem] p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Últimas Atividades</h3>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Histórico recente de agendamentos</p>
        </div>
        <button className="text-xs text-primary font-bold hover:text-white transition-colors">Ver tudo</button>
      </div>
      <div className="divide-y divide-white/5">
        {latestActivities.map((activity, i) => (
          <ActivityItem 
            key={i} 
            index={i}
            initials={activity.initials}
            name={activity.name}
            status={activity.status}
            service={activity.service}
            date={activity.date}
          />
        ))}
        {latestActivities.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">Nenhuma atividade recente.</div>
        )}
      </div>
    </motion.div>
  );
}
