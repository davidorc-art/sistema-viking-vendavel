import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';

interface PerformanceChartProps {
  title: string;
  data: any[];
  color: string;
  prefix?: string;
  showPrevious?: boolean;
}

export function PerformanceChart({ title, data, color, prefix = '', showPrevious = true }: PerformanceChartProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="glass-card rounded-[2rem] p-6 space-y-6 min-w-0 scanline-container"
    >
      <div className="scanline" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              times: [0, 0.1, 1],
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: color, color: color }} 
          />
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        </div>
        {showPrevious && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Mês Anterior</span>
          </div>
        )}
      </div>

      <div className="h-[200px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} className="cardiogram-chart">
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#666', fontSize: 10 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#666', fontSize: 10 }}
              tickFormatter={(value) => `${prefix}${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#888', marginBottom: '4px' }}
              formatter={(value: number | null, name: string) => {
                if (value === null) return ['-', name === 'value' ? 'Atual' : 'Anterior'];
                return [`${prefix}${value}`, name === 'value' ? 'Atual' : 'Anterior'];
              }}
            />
            {showPrevious && (
              <Area 
                type="monotone" 
                dataKey="previousValue" 
                stroke="rgba(255,255,255,0.2)" 
                strokeWidth={2}
                fillOpacity={0} 
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: "rgba(255,255,255,0.5)" }}
                isAnimationActive={false}
              />
            )}
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#gradient-${color})`}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: color }}
              isAnimationActive={false}
              style={{ color: color }}
              className="cardiogram-line"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
