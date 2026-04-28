import React from 'react';
import { ColorimetryTool } from '../components/ColorimetryTool';
import { RuneBackground } from '../components/RuneBackground';
import { motion } from 'framer-motion';
import { Droplets, Info } from 'lucide-react';

export default function Colorimetria() {
  return (
    <div className="space-y-8 relative pb-20">
      <RuneBackground />
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="p-3 bg-primary/20 text-primary rounded-2xl">
          <Droplets size={32} />
        </div>
        <div className="space-y-1">
          <h1 className="text-5xl font-bold tracking-tighter text-primary uppercase">Mestre de Cores</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Colorimetria e Mistura de Intensidades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2">
          <div className="glass-card bg-card border-white/5 rounded-[2.5rem] p-8">
            <ColorimetryTool />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card bg-black/40 border-white/5 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3 text-secondary">
              <Info size={20} />
              <h2 className="text-lg font-bold">Guia Rápido</h2>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">A regra do 10</p>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                  Para batoques pequenos (P), cada gota representa 5% da intensidade total. Use isso para ajustes finos em tons de cinza.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Diluição</p>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                  Sempre complete o batoque com diluente após colocar as gotas de pigmento para manter a consistência ideal da tinta.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Mistura Homogênea</p>
                <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                  Utilize um mixer magnético ou batedor manual após o preenchimento para garantir que o pigmento não decante no fundo do batoque.
                </p>
              </div>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="p-6 bg-primary/10 border border-primary/20 rounded-[2rem] text-center space-y-3"
          >
            <Droplets className="text-primary mx-auto" size={32} />
            <p className="text-sm font-bold text-white">Precisão Viking</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Qualidade superior em cada traço</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
