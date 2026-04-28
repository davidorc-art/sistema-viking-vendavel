
import { InventoryItem, Appointment } from '../types';

export interface StockDeduction {
  itemName: string;
  quantity: number;
  category: string;
  unit: string;
  price: number;
  keywords: string[];
}

export const getDeductionsForService = (appointment: Partial<Appointment>): StockDeduction[] => {
  const name = (appointment.service || '').toLowerCase();
  const duration = appointment.duration || 60;
  
  let multiplier = 1;
  if (name.includes('pequena')) multiplier = 1;
  else if (name.includes('média') || name.includes('media')) multiplier = 1.5;
  else if (name.includes('grande')) multiplier = 2.5;
  else if (name.includes('fechamento')) multiplier = 4;
  else if (name.includes('flash')) multiplier = 1.2;
  else {
    multiplier = Math.max(0.5, duration / 60);
  }
  
  if (name.includes('piercing')) {
    return [
      { itemName: 'Cateter / Agulha', quantity: 1, category: 'Descartáveis', unit: 'un', price: 2.50, keywords: ['cateter', 'agulha americana', 'agulha piercing'] },
      { itemName: 'Joia', quantity: 1, category: 'Insumos', unit: 'un', price: 15.00, keywords: ['joia', 'piercing', 'titânio', 'aço cirúrgico', 'labret', 'barbell', 'argola'] },
      { itemName: 'Gaze', quantity: 5, category: 'Descartáveis', unit: 'un', price: 0.20, keywords: ['gaze'] },
      { itemName: 'Luvas', quantity: 2, category: 'Descartáveis', unit: 'un', price: 0.80, keywords: ['luva', 'nitrilo', 'látex'] },
      { itemName: 'Soro Fisiológico', quantity: 10, category: 'Insumos', unit: 'ml', price: 0.05, keywords: ['soro', 'fisiológico', 'solução'] },
      { itemName: 'Antisséptico', quantity: 5, category: 'Insumos', unit: 'ml', price: 0.10, keywords: ['antisséptico', 'povidine', 'clorexidina', 'iodo'] },
      { itemName: 'Campo Cirúrgico', quantity: 1, category: 'Descartáveis', unit: 'un', price: 3.00, keywords: ['campo', 'cirúrgico', 'fenestrado'] },
      { itemName: 'Álcool 70%', quantity: 10, category: 'Insumos', unit: 'ml', price: 0.05, keywords: ['álcool', '70'] },
      { itemName: 'Hastes Flexíveis', quantity: 4, category: 'Descartáveis', unit: 'un', price: 0.05, keywords: ['haste', 'cotonete'] },
      { itemName: 'Máscara', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.50, keywords: ['máscara'] },
      { itemName: 'Envelope Cirúrgico', quantity: 1, category: 'Esterilização', unit: 'un', price: 0.80, keywords: ['envelope', 'grau cirúrgico', 'autoclave'] },
      { itemName: 'Babador', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.40, keywords: ['babador', 'odontológico'] },
      { itemName: 'Copo', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.10, keywords: ['copo'] }
    ];
  }
  
  // Default to Tattoo
  return [
    { itemName: 'Agulha / Cartucho (Traço)', quantity: 1, category: 'Descartáveis', unit: 'un', price: 5.00, keywords: ['agulha', 'cartucho', 'rl', 'traço', 'liner'] },
    { itemName: 'Agulha / Cartucho (Pintura)', quantity: Math.ceil(1 * multiplier), category: 'Descartáveis', unit: 'un', price: 5.00, keywords: ['agulha', 'cartucho', 'rs', 'mg', 'rm', 'pintura', 'shader', 'magnum'] },
    { itemName: 'Tinta Preta', quantity: Math.ceil(2 * multiplier), category: 'Insumos', unit: 'ml', price: 1.50, keywords: ['tinta', 'preta', 'black', 'linha', 'tribal', 'dynamic', 'viper', 'electric'] },
    { itemName: 'Papel Toalha', quantity: Math.ceil(20 * multiplier), category: 'Descartáveis', unit: 'un', price: 0.05, keywords: ['papel', 'toalha'] },
    { itemName: 'Luvas', quantity: Math.ceil(4 * multiplier), category: 'Descartáveis', unit: 'un', price: 0.80, keywords: ['luva', 'nitrilo', 'látex', 'preta'] },
    { itemName: 'Papel Hectográfico', quantity: Math.ceil(1 * multiplier), category: 'Insumos', unit: 'un', price: 2.00, keywords: ['hectográfico', 'stencil', 'decalque'] },
    { itemName: 'Transfer', quantity: Math.ceil(2 * multiplier), category: 'Insumos', unit: 'ml', price: 0.50, keywords: ['transfer', 'fixador', 'stencil', 'it'] },
    { itemName: 'Vaselina / Butter', quantity: Math.ceil(10 * multiplier), category: 'Insumos', unit: 'g', price: 0.20, keywords: ['vaselina', 'butter', 'manteiga', 'deslizante'] },
    { itemName: 'Batoques', quantity: Math.ceil(5 * multiplier), category: 'Descartáveis', unit: 'un', price: 0.10, keywords: ['batoque', 'tampa', 'p', 'm', 'g'] },
    { itemName: 'Plástico Filme', quantity: Math.ceil(2 * multiplier), category: 'Descartáveis', unit: 'm', price: 0.30, keywords: ['plástico', 'filme', 'pvc', 'rolopac'] },
    { itemName: 'Protetor de Máquina', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.50, keywords: ['protetor', 'máquina', 'sleeve', 'pen'] },
    { itemName: 'Protetor de Cabo', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.50, keywords: ['protetor', 'cabo', 'clip', 'cord', 'rca'] },
    { itemName: 'Bandagem', quantity: Math.ceil(0.5 * multiplier), category: 'Descartáveis', unit: 'm', price: 1.00, keywords: ['bandagem', 'elástica', 'grip', 'fita'] },
    { itemName: 'Sabão Verde', quantity: Math.ceil(10 * multiplier), category: 'Insumos', unit: 'ml', price: 0.10, keywords: ['sabão', 'verde', 'green', 'soap', 'clean'] },
    { itemName: 'Álcool 70%', quantity: Math.ceil(20 * multiplier), category: 'Insumos', unit: 'ml', price: 0.05, keywords: ['álcool', '70'] },
    { itemName: 'Campo Cirúrgico', quantity: 1, category: 'Descartáveis', unit: 'un', price: 3.00, keywords: ['campo', 'cirúrgico', 'lençol', 'impermeável'] },
    { itemName: 'Máscara', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.50, keywords: ['máscara', 'descartável'] },
    { itemName: 'Lâmina', quantity: 1, category: 'Descartáveis', unit: 'un', price: 0.50, keywords: ['lâmina', 'barbear', 'gillette', 'prestobarba'] },
    { itemName: 'Copo', quantity: 2, category: 'Descartáveis', unit: 'un', price: 0.10, keywords: ['copo', 'descartável'] }
  ];
};

export const calculateNewStock = (item: InventoryItem, deductionQty: number): number => {
  const currentStock = item.stock || 0;
  return Math.max(0, currentStock - deductionQty);
};
