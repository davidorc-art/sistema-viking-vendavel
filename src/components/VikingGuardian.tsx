import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Trophy, Sparkles, Lightbulb, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

interface VikingGuardianProps {
  type?: 'mascot' | 'celebration' | 'success';
  message?: string;
  onClose?: () => void;
}

export function VikingGuardian({ type = 'mascot', message, onClose }: VikingGuardianProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [currentTip, setCurrentTip] = useState('');
  
  const tips = [
    "Lembre-se de esterilizar todo o equipamento antes de cada sessão!",
    "Um cliente satisfeito é a melhor propaganda do seu estúdio.",
    "Mantenha seu estoque sempre atualizado para não faltar agulhas.",
    "O pós-tatuagem é tão importante quanto a arte em si.",
    "Organize sua agenda para evitar atrasos e garantir o melhor atendimento.",
    "O faturamento deste mês está excelente! Continue assim!",
  ];

  useEffect(() => {
    if (type === 'mascot') {
      const interval = setInterval(() => {
        setCurrentTip(tips[Math.floor(Math.random() * tips.length)]);
      }, 10000);
      setCurrentTip(tips[0]);
      return () => clearInterval(interval);
    }
  }, [type]);

  useEffect(() => {
    if (type === 'celebration' || type === 'success') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f97316', '#eab308', '#ffffff']
      });
    }
  }, [type]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {type === 'mascot' ? (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4"
        >
          {/* Speech Bubble */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-card border border-primary/20 p-4 rounded-2xl shadow-2xl max-w-[200px] relative"
          >
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb size={14} className="text-accent shrink-0 mt-1" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dica de Gestão</p>
            </div>
            <p className="text-xs text-white leading-relaxed italic">"{currentTip}"</p>
            {/* Arrow */}
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-card border-r border-b border-primary/20 rotate-45" />
          </motion.div>

          {/* Character Container */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="relative group"
          >
            <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.3)] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-primary">
              <ShieldCheck size={48} />
            </div>
            
            {/* Badge */}
            <div className="absolute -top-2 -left-2 bg-primary text-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
              Guardião Viking
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute -top-2 -right-2 bg-black border border-white/10 rounded-full p-1 text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-card border border-primary/30 p-12 rounded-[40px] max-w-lg w-full text-center relative overflow-hidden"
          >
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/20 to-transparent" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex justify-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-32 h-32 rounded-full border-4 border-primary p-1 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center text-primary"
                >
                  <ShieldCheck size={64} />
                </motion.div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-primary">
                  <Trophy size={32} />
                  <h2 className="text-4xl font-serif italic uppercase tracking-tighter">Vitória!</h2>
                  <Sparkles size={32} />
                </div>
                <p className="text-xl text-white font-bold leading-tight">
                  {message || "O campo de batalha foi conquistado com honra!"}
                </p>
                <p className="text-sm text-gray-400 uppercase tracking-[0.3em] font-bold">
                  O Guardião saúda sua conquista
                </p>
              </div>

              <button
                onClick={onClose}
                className="px-12 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(249,115,22,0.4)]"
              >
                Continuar Jornada
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
