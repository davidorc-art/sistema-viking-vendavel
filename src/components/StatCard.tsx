import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  color?: 'primary' | 'secondary' | 'success' | 'accent' | 'destructive';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: StatCardProps) {
  const colorMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    success: 'text-success',
    accent: 'text-accent',
    destructive: 'text-destructive',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, borderColor: 'rgba(var(--color-primary),0.3)' }}
      className="glass-card rounded-3xl lg:rounded-[2rem] p-4 xl:p-6 flex flex-col gap-3 relative overflow-hidden group transition-all scanline-container"
    >
      <div className="scanline" />
      
      {/* Watermark Shield */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-white group-hover:opacity-[0.05] transition-opacity">
        <Shield size={100} strokeWidth={1} />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <p className="text-gray-400 text-[10px] lg:text-xs font-bold uppercase tracking-widest">{title}</p>
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className={cn("p-2 lg:p-3 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 shadow-inner", colorMap[color])}
        >
          <Icon size={18} className="lg:w-5 lg:h-5" />
        </motion.div>
      </div>
      
      <div className="space-y-1 relative z-10">
        <motion.h3 
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          animate={{ opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          className="text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tighter"
        >
          {value}
        </motion.h3>
        <div className="flex items-center gap-1.5">
          {trend === 'up' ? (
            <TrendingUp size={14} className="text-success" />
          ) : (
            <TrendingDown size={14} className="text-destructive" />
          )}
          <p className={cn("text-xs font-medium", trend === 'up' ? "text-success" : "text-destructive")}>
            {subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
