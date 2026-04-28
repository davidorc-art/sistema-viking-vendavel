import React from 'react';
import { Calendar, UserPlus, ShoppingCart, FileText, Axe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ActionButton = ({ icon: Icon, label, onClick, index }: { icon: any, label: string, onClick?: () => void, index: number }) => (
  <motion.button 
    initial={{ opacity: 0, scale: 0.8 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.1 }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.05, y: -5 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/10 transition-all group"
  >
    <motion.div 
      whileHover={{ rotate: [0, -10, 10, 0] }}
      className="p-3 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors"
    >
      <Icon size={24} className="text-gray-400 group-hover:text-primary" />
    </motion.div>
    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-white">{label}</span>
  </motion.button>
);

export function QuickActions() {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-[2rem] p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <motion.div 
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-primary"
        >
          <Axe size={20} />
        </motion.div>
        <h3 className="text-xl font-bold tracking-tight">Ações Rápidas</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ActionButton icon={Calendar} label="Agendar" onClick={() => navigate('/agenda')} index={0} />
        <ActionButton icon={UserPlus} label="Novo Cliente" onClick={() => navigate('/clientes')} index={1} />
        <ActionButton icon={ShoppingCart} label="Venda" onClick={() => navigate('/loja')} index={2} />
        <ActionButton icon={FileText} label="Relatórios" onClick={() => navigate('/relatorios')} index={3} />
      </div>
    </motion.div>
  );
}
