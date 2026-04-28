import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, 
  Info, 
  Beaker,
  FlaskConical,
  Palette,
  X,
  Sparkles,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

type CupSize = 'P' | 'M' | 'G' | 'GG';

interface CupConfig {
  id: CupSize;
  label: string;
  totalDrops: number;
  volume: string;
}

const CUP_CONFIGS: CupConfig[] = [
  { id: 'P', label: 'Pequeno', totalDrops: 15, volume: '~0.75ml' },
  { id: 'M', label: 'Médio', totalDrops: 30, volume: '~1.5ml' },
  { id: 'G', label: 'Grande', totalDrops: 60, volume: '~3.0ml' },
  { id: 'GG', label: 'Gigante', totalDrops: 120, volume: '~6.0ml' }
];

const PRIMARY_INKS = {
  red: { id: 'red', name: 'Vermelho Puro', hex: '#FF0000', tw: 'bg-red-600', hue: 0 },
  yellow: { id: 'yellow', name: 'Amarelo Primário', hex: '#FFEA00', tw: 'bg-yellow-400', hue: 60 },
  blue: { id: 'blue', name: 'Azul Primário', hex: '#0000FF', tw: 'bg-blue-600', hue: 240 },
  white: { id: 'white', name: 'Branco', hex: '#FFFFFF', tw: 'bg-white text-black' },
  black: { id: 'black', name: 'Preto', hex: '#000000', tw: 'bg-zinc-900 border border-white/20' }
};

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOuter.x, startOuter.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    "Z"
  ].join(" ");
}

function HSLToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[0, 8, 4].map(n => Math.round(255 * f(n)).toString(16).padStart(2, '0')).join('')}`;
}

type HSLColor = { h: number, s: number, l: number, hex: string };

function calculateSmartRecipe(target: HSLColor, totalDrops: number) {
  const { h, s, l } = target;
  
  let c1, c2, ratio2;
  
  // Map HSL Hue to RYB interpolation
  if (h >= 0 && h <= 60) {
    c1 = PRIMARY_INKS.red;
    c2 = PRIMARY_INKS.yellow;
    ratio2 = h / 60; // 0 is Red, 1 is Yellow
  } else if (h > 60 && h <= 240) {
    c1 = PRIMARY_INKS.yellow;
    c2 = PRIMARY_INKS.blue;
    ratio2 = (h - 60) / 180; // 0 is Yellow, 1 is Blue
  } else {
    c1 = PRIMARY_INKS.blue;
    c2 = PRIMARY_INKS.red;
    ratio2 = (h - 240) / 120; // 0 is Blue, 1 is Red
  }

  const ratio1 = 1 - ratio2;

  const colorAmount = s / 100;
  const neutralAmount = 1 - colorAmount;

  let c1Weight = colorAmount * ratio1;
  let c2Weight = colorAmount * ratio2;
  let whiteWeight = 0;
  let blackWeight = 0;

  // Enhancing the non-linear realistic mix for lightness
  if (l > 50) {
    const lFactor = (l - 50) / 50; 
    whiteWeight += lFactor * 2.5; // Heavy white scaling when very light
    c1Weight *= (1 - lFactor);
    c2Weight *= (1 - lFactor);
  } else if (l < 50) {
    const lFactor = (50 - l) / 50;
    blackWeight += lFactor * 1.5; // Black dominates quickly
    c1Weight *= (1 - lFactor * 0.6); 
    c2Weight *= (1 - lFactor * 0.6);
  }

  // Desaturation explicitly uses gray (white + black)
  if (neutralAmount > 0) {
    whiteWeight += neutralAmount * (l / 100) * 1.5;
    blackWeight += neutralAmount * ((100 - l) / 100) * 0.8;
  }

  const totalWeight = c1Weight + c2Weight + whiteWeight + blackWeight;
  
  const rawDrops = {
    [c1.id]: (c1Weight / totalWeight) * totalDrops,
    [c2.id]: (c2Weight / totalWeight) * totalDrops,
    'white': (whiteWeight / totalWeight) * totalDrops,
    'black': (blackWeight / totalWeight) * totalDrops
  };

  const dropsObj = {
    c1: { ...c1, num: Math.round(rawDrops[c1.id] || 0) },
    c2: { ...c2, num: Math.round(rawDrops[c2.id] || 0) },
    white: { ...PRIMARY_INKS.white, num: Math.round(rawDrops.white || 0) },
    black: { ...PRIMARY_INKS.black, num: Math.round(rawDrops.black || 0) }
  };

  // If c1 and c2 are the same (exact primary), combine them
  if (dropsObj.c1.id === dropsObj.c2.id) {
    dropsObj.c1.num += dropsObj.c2.num;
    dropsObj.c2.num = 0;
  }

  const dropsArray = [
    dropsObj.c1,
    dropsObj.c2,
    dropsObj.white,
    dropsObj.black
  ].filter(d => d.num > 0).sort((a, b) => b.num - a.num);

  // Fix rounding errors
  const currentTotal = dropsArray.reduce((acc, curr) => acc + curr.num, 0);
  const diff = totalDrops - currentTotal;
  if (diff !== 0 && dropsArray.length > 0) {
    dropsArray[0].num += diff;
  }
  
  // Re-sync dropsObj for pedagogical mapping
  dropsObj.c1.num = dropsArray.find(d => d.id === dropsObj.c1.id)?.num || 0;
  dropsObj.c2.num = dropsArray.find(d => d.id === dropsObj.c2.id)?.num || 0;
  dropsObj.white.num = dropsArray.find(d => d.id === 'white')?.num || 0;
  dropsObj.black.num = dropsArray.find(d => d.id === 'black')?.num || 0;

  // --- Generate Pedagogical Instructions ---
  const teachings = [];

  // Step 1: Base Hue
  if (dropsObj.c1.num > 0 && dropsObj.c2.num > 0 && dropsObj.c1.id !== dropsObj.c2.id) {
    teachings.push({
      title: "1. Mistura da Cor Base",
      desc: `Combine ${dropsObj.c1.num} gotas de ${dropsObj.c1.name} com ${dropsObj.c2.num} gotas de ${dropsObj.c2.name}. Na teoria clássica, a união destas duas primárias criará a matiz secundária perfeita que estamos buscando.`
    });
  } else if (dropsObj.c1.num > 0) {
    teachings.push({
      title: "1. Cor Primária Pura",
      desc: `O seu alvo está exatamente ou muito próximo de uma cor primária. Use ${dropsObj.c1.num} gotas de ${dropsObj.c1.name} como alicerce.`
    });
  }

  // Step 2 & 3: Lightness & Saturation
  if (dropsObj.white.num > 0 && dropsObj.black.num > 0) {
    teachings.push({
      title: "2. Rebaixamento e Opacidade (Cinza)",
      desc: `Como a saturação está em ${s}% e a luminosidade em ${l}%, injetamos um fundo 'cinza' usando ${dropsObj.white.num} gotas de Branco e ${dropsObj.black.num} gotas de Preto. Isso 'muta' a cor e quebra o brilho artificial, deixando o tom realista e denso.`
    });
  } else {
    if (dropsObj.white.num > 0) {
      teachings.push({
        title: "2. Elevação de Luz e Opacidade",
        desc: `Para atingir essa claridade e deixar a tinta sólida na pele, insira ${dropsObj.white.num} gotas de Branco. O branco atua como opacificador e clareador (tom pastel).`
      });
    }
    if (dropsObj.black.num > 0) {
      teachings.push({
        title: "2. Profundidade e Sombra",
        desc: `Adicione ${dropsObj.black.num} gotas de Preto. O pigmento preto é muito invasivo e pesa a mistura para baixo drasticamente, quebrando a vibração original da cor e trazendo para um aspecto sombreado profundo.`
      });
    }
  }

  return { dropsArray, teachings };
}

export function ColorimetryTool({ onClose }: { onClose?: () => void }) {
  const [selectedCup, setSelectedCup] = useState<CupSize>('M');
  
  const [targetColor, setTargetColor] = useState<HSLColor>({ h: 270, s: 100, l: 35, hex: HSLToHex(270, 100, 35) });
  const [saturation, setSaturation] = useState(100);

  const config = useMemo(() => CUP_CONFIGS.find(c => c.id === selectedCup)!, [selectedCup]);
  
  const recipe = useMemo(() => {
    return calculateSmartRecipe({ ...targetColor, s: saturation }, config.totalDrops);
  }, [targetColor, saturation, config.totalDrops]);

  const wheelSegments = useMemo(() => {
    const hues = Array.from({length: 24}, (_, i) => i * 15);
    const rings = [92, 75, 50, 35, 18]; // Lightness levels
    const segs: any[] = [];
    
    rings.forEach((l, ringIndex) => {
      const innerRadius = ringIndex === 0 ? 15 : 15 + (ringIndex * 15);
      const outerRadius = 15 + ((ringIndex + 1) * 15);
      
      hues.forEach((h) => {
        segs.push({
          key: `r${ringIndex}-h${h}`,
          h, s: 100, l,
          innerRadius, outerRadius,
          startAngle: h - 7.5,
          endAngle: h + 7.5,
          hex: HSLToHex(h, 100, l)
        });
      });
    });
    return segs;
  }, []);

  return (
    <div className="relative bg-[#0a0a0a] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-full md:h-auto md:max-h-[90vh] text-white border border-white/10 ring-1 ring-white/5 mx-auto max-w-6xl w-full">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:px-8 md:py-6 border-b border-white/5 shrink-0 bg-black/40 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-primary/10 text-primary rounded-xl md:rounded-2xl shadow-inner border border-primary/20">
            <GraduationCap size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl font-black tracking-tight text-white leading-tight">Academia de Cores</h3>
            <p className="text-[9px] md:text-xs text-primary uppercase tracking-[0.1em] md:tracking-[0.2em] font-bold mt-0.5 md:mt-1">Ensino de Mistura via Cores Primárias</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 md:p-3 hover:bg-white/10 rounded-full transition-colors bg-white/5 text-gray-400 hover:text-white group shrink-0">
            <X size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 custom-scrollbar">
        
        {/* Left Side: Color Wheel & Selectors */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6 shrink-0">
          
          <div className="flex flex-col items-center select-none bg-[#111] p-5 md:p-6 rounded-[2rem] border border-white/5 shadow-inner relative">
            <div className="absolute top-4 left-4 md:top-5 md:left-5 flex gap-2 items-center text-[9px] md:text-[10px] uppercase font-bold text-gray-500 tracking-widest">
               <Palette size={14} /> Circulo Tonal Target
            </div>

            {/* SVG Interactive Wheel */}
            <svg viewBox="0 0 200 200" className="w-full max-w-[240px] md:max-w-[280px] lg:max-w-[320px] aspect-square transform -rotate-90 drop-shadow-2xl mt-8 mb-4">
              {/* Center White */}
              <circle 
                cx="100" cy="100" r="14" 
                fill="#ffffff" 
                className="cursor-pointer hover:stroke-primary hover:stroke-2 transition-all"
                onClick={() => setTargetColor({ h: 0, s: 0, l: 100, hex: '#ffffff' })}
              />
              
              {/* Orbiting Slices */}
              {wheelSegments.map(seg => (
                <path
                  key={seg.key}
                  d={describeArc(100, 100, seg.innerRadius, seg.outerRadius, seg.startAngle, seg.endAngle)}
                  fill={seg.hex}
                  className={cn(
                    "cursor-pointer transition-all duration-200 stroke-[#0a0a0a] stroke-[0.5px]",
                    targetColor.h === seg.h && targetColor.l === seg.l 
                      ? "stroke-primary stroke-[3px] z-10 scale-[1.02] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
                      : "hover:opacity-80 hover:stroke-white/50"
                  )}
                  onClick={() => setTargetColor({ h: seg.h, s: seg.s, l: seg.l, hex: seg.hex })}
                />
              ))}
            </svg>

            {/* Custom Saturaion / Muting Slider */}
            <div className="w-full max-w-[320px] bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] md:text-xs font-bold text-gray-400">Intensidade (Saturação)</span>
                <span className="text-xs md:text-sm font-mono text-primary font-black">{saturation}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[8px] md:text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                <span>Mudo/Cinza</span>
                <span>Puro/Vivo</span>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <label className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <FlaskConical size={14} /> Selecione o Batoque
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CUP_CONFIGS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCup(c.id)}
                  className={cn(
                    "flex flex-col items-center justify-center py-3 md:py-4 px-1 md:px-2 rounded-2xl border transition-all",
                    selectedCup === c.id 
                      ? "bg-primary border-primary text-black shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "bg-[#111] border-white/5 text-gray-400 hover:bg-white/5"
                  )}
                >
                  <span className="text-sm md:text-base font-black leading-none">{c.id}</span>
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1 md:mt-1.5">{c.volume}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right Side: Smart Educational Results */}
        <div className="w-full lg:w-[60%] flex flex-col shrink-0 lg:min-h-[500px]">
          <div className="bg-[#111] border border-white/5 rounded-[2rem] md:rounded-3xl p-5 md:p-6 lg:p-8 flex flex-col flex-1 relative overflow-hidden shadow-inner">
            
            {/* Visual Mix Result Glow */}
            <div 
              className="absolute inset-x-0 bottom-0 top-1/2 transition-all duration-700 ease-out z-0 blur-[80px] md:blur-[100px] opacity-20 pointer-events-none"
              style={{ backgroundColor: HSLToHex(targetColor.h, saturation, targetColor.l) }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 border-b border-white/5 pb-5 md:pb-6 mb-5 md:mb-6 z-10 shrink-0">
              <div 
                className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 shadow-2xl shrink-0"
                style={{ backgroundColor: HSLToHex(targetColor.h, saturation, targetColor.l), borderColor: 'rgba(255,255,255,0.1)' }}
              />
              <div>
                <h4 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight">Receita da Cor</h4>
                <p className="text-[10px] md:text-xs text-primary mt-1 md:mt-1.5 uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold">Baseada em Cores Primárias</p>
              </div>
              
              <div className="sm:ml-auto w-full sm:w-auto bg-black/60 px-5 py-3 rounded-2xl sm:rounded-full border border-white/5 flex items-center justify-center gap-3 shrink-0">
                <Beaker size={20} className="text-white opacity-50" />
                <span className="text-white text-lg md:text-xl font-black">{config.totalDrops} Gotas</span> 
              </div>
            </div>

            {/* Pedagogical Step Display */}
            <div className="z-10 flex-1 flex flex-col gap-5 md:gap-6">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <AnimatePresence mode="popLayout">
                  {recipe.dropsArray.map((ink, index) => (
                    <motion.div
                      key={ink.id}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex flex-col items-center bg-[#1a1a1a] border border-white/5 p-3 md:p-4 rounded-3xl md:rounded-[2rem] text-center relative overflow-hidden shadow-xl"
                    >
                      <div className={`absolute top-0 inset-x-0 h-1.5 ${ink.tw}`} />
                      
                      <div 
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-[3px] shadow-2xl mb-2 md:mb-3 mt-1 relative shrink-0"
                        style={{ backgroundColor: ink.hex, borderColor: ink.id === 'white' ? '#444' : '#222' }}
                      >
                        <span className={cn(
                          "text-lg md:text-xl font-black drop-shadow-md mix-blend-difference",
                          ink.id === 'white' ? 'text-black' : 'text-white'
                        )}>
                          {ink.num}
                        </span>
                      </div>

                      <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-300 tracking-wider leading-tight">
                        {ink.name}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Steps Explanations */}
              <div className="mt-2 md:mt-4 space-y-3">
                <h5 className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 tracking-[0.1em] md:tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-primary shrink-0" /> O que a máquina lógica aprendeu:
                </h5>
                
                {recipe.teachings.map((teaching, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (i * 0.1) }}
                    key={i} 
                    className="bg-primary/5 border border-primary/20 rounded-2xl p-3 md:p-4 flex gap-3 md:gap-4"
                  >
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 font-black text-[10px] md:text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <h6 className="text-[10px] md:text-xs font-bold uppercase text-primary tracking-widest mb-1 md:mb-1.5">{teaching.title}</h6>
                      <p className="text-xs md:text-sm text-gray-300 leading-relaxed font-medium">
                        {teaching.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
}


