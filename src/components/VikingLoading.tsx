import React from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield } from 'lucide-react';

export const VikingLoading = () => {
  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Central Icon Animation */}
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mb-12"
        >
          {/* Shield in the background */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-primary/20"
          >
            <Shield size={200} strokeWidth={0.5} />
          </motion.div>

          {/* Crossing Swords */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ x: -50, y: 50, rotate: -45, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: -45, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute text-primary"
            >
              <Sword size={80} />
            </motion.div>
            <motion.div
              initial={{ x: 50, y: 50, rotate: 45, opacity: 0 }}
              animate={{ x: 0, y: 0, rotate: 45, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute text-primary"
            >
              <Sword size={80} />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Animation */}
        <div className="text-center space-y-4">
          <motion.h2
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-4xl font-serif italic text-white tracking-widest uppercase"
          >
            Viking <span className="text-primary not-italic font-sans font-black">Studio</span>
          </motion.h2>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.5, duration: 2, ease: "easeInOut" }}
            className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent w-64 mx-auto"
          />
          <motion.p
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.5em]"
          >
            Preparando o campo de batalha...
          </motion.p>
        </div>
      </div>

      {/* Floating Runes or Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 1000, 
              y: 1000,
              opacity: 0 
            }}
            animate={{ 
              y: -100,
              opacity: [0, 0.5, 0],
              rotate: Math.random() * 360
            }}
            transition={{ 
              duration: 5 + Math.random() * 5, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute text-primary/30 font-serif text-xl"
          >
            {"ᚦᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ"[Math.floor(Math.random() * 24)]}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
