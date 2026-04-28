import React from 'react';
import { motion } from 'framer-motion';

export function RuneBackground() {
  const runes = ["ᚦ", "ᚠ", "ᚢ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-10">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            y: [null, "-20%"],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 10 + Math.random() * 10, 
            repeat: Infinity, 
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute text-primary font-serif text-4xl select-none"
        >
          {runes[Math.floor(Math.random() * runes.length)]}
        </motion.div>
      ))}
    </div>
  );
}
