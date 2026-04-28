import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  TrendingUp, 
  ChevronRight,
  MoreVertical,
  X,
  Edit3,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  CheckCircle2,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { InventoryItem } from '../types';

// --- Sub-components ---

const ItemModal = ({ 
  item, 
  isOpen, 
  onClose,
  onSave,
  onDelete,
  onReplenish
}: { 
  item: InventoryItem | null, 
  isOpen: boolean, 
  onClose: () => void,
  onSave: (item: Partial<InventoryItem>) => void,
  onDelete: (id: string) => void,
  onReplenish: (id: string, amount: number, cost?: number) => void
}) => {
  const [isEditing, setIsEditing] = useState(!item?.id);
  const [isReplenishing, setIsReplenishing] = useState(false);
  const [replenishAmount, setReplenishAmount] = useState<string>('');
  const [replenishCost, setReplenishCost] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<InventoryItem>>(
    item || {
      name: '',
      category: '',
      stock: 0,
      minStock: 0,
      unit: 'un',
      price: 0,
      status: 'Em estoque'
    }
  );

  // Update formData when item changes
  React.useEffect(() => {
    if (item) {
      setFormData(item);
      setIsEditing(false);
      setIsReplenishing(false);
    } else {
      setFormData({
        name: '',
        category: '',
        stock: 0,
        minStock: 0,
        unit: 'un',
        price: 0,
        status: 'Em estoque'
      });
      setIsEditing(true);
      setIsReplenishing(false);
    }
    setShowDeleteConfirm(false);
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine status based on stock
    const stock = Number(formData.stock) || 0;
    const minStock = Number(formData.minStock) || 0;
    let status: 'Em estoque' | 'Baixo' | 'Esgotado' = 'Em estoque';
    
    if (stock <= 0) status = 'Esgotado';
    else if (stock <= minStock) status = 'Baixo';

    onSave({
      ...formData,
      stock,
      minStock,
      price: Number(formData.price) || 0,
      status
    });
    onClose();
  };

  const handleReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(replenishAmount);
    const cost = parseFloat(replenishCost);
    
    if (item?.id && amount > 0) {
      onReplenish(item.id, amount, isNaN(cost) ? undefined : cost);
      setIsReplenishing(false);
      setReplenishAmount('');
      setReplenishCost('');
      onClose();
    }
  };

  const handleDelete = () => {
    if (item?.id) {
      onDelete(item.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-[70] p-8 overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">
                {isReplenishing ? 'Registrar Reposição' : item?.id ? (isEditing ? 'Editar Item' : 'Detalhes do Item') : 'Novo Item'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            {isReplenishing ? (
              <form onSubmit={handleReplenishSubmit} className="space-y-8">
                <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <Package size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold">{item?.name}</h3>
                      <p className="text-xs text-gray-500">Estoque atual: {item?.stock} {item?.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Quantidade Comprada</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        required
                        min="0"
                        step="any"
                        autoFocus
                        placeholder="Ex: 500"
                        value={replenishAmount}
                        onChange={e => setReplenishAmount(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-2xl font-bold focus:outline-none focus:border-primary/50 text-center"
                      />
                      <span className="text-xl font-bold text-gray-500">{item?.unit}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center uppercase tracking-widest">
                      Novo estoque será: <span className="text-white">{(item?.stock || 0) + (parseFloat(replenishAmount) || 0)} {item?.unit}</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Valor da Compra (Opcional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={replenishCost}
                        onChange={e => setReplenishCost(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-xl font-bold focus:outline-none focus:border-accent/50"
                        placeholder="0,00"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center">Se preenchido, gerará uma despesa automática no financeiro.</p>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Confirmar Reposição
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsReplenishing(false)}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </form>
            ) : isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Nome do Item</label>
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      placeholder="Ex: Shampoo Hidratante"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Categoria</label>
                    <input 
                      type="text"
                      required
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      placeholder="Ex: Cabelo, Barba, Bebidas"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Estoque Atual</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.stock}
                        onChange={e => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Estoque Mínimo</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.minStock}
                        onChange={e => setFormData({ ...formData, minStock: parseFloat(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Unidade</label>
                      <select 
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50 appearance-none"
                      >
                        <option value="un">Unidade (un)</option>
                        <option value="folhas">Folhas</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="l">Litros (l)</option>
                        <option value="g">Gramas (g)</option>
                        <option value="kg">Quilos (kg)</option>
                        <option value="m">Metros (m)</option>
                        <option value="cm">Centímetros (cm)</option>
                        <option value="caixa">Caixa</option>
                        <option value="%">Porcentagem (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Preço Unitário (R$)</label>
                      <input 
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value.replace(',', '.')) })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                  >
                    Salvar Item
                  </button>
                  <button 
                    type="button"
                    onClick={() => item?.id ? setIsEditing(false) : onClose()}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                {/* Header */}
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                    <Package size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{item?.name}</h3>
                    <p className="text-gray-500 font-medium">{item?.category}</p>
                  </div>
                </div>

                {/* Stock Status */}
                <div className={cn(
                  "p-6 rounded-3xl border flex items-center justify-between",
                  item?.status === 'Em estoque' ? "bg-success/10 border-success/20 text-success" :
                  item?.status === 'Baixo' ? "bg-accent/10 border-accent/20 text-accent" :
                  "bg-destructive/10 border-destructive/20 text-destructive"
                )}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Estoque Atual</p>
                    <p className="text-3xl font-bold">{item?.stock} {item?.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Mínimo</p>
                    <p className="text-lg font-bold">{item?.minStock} {item?.unit}</p>
                  </div>
                </div>

                {/* History/Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Preço Unitário</p>
                    <p className="text-sm font-bold">R$ {item?.price.toFixed(2)}</p>
                  </div>
                  <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Valor Total</p>
                    <p className="text-sm font-bold text-primary">R$ {((item?.stock || 0) * (item?.price || 0)).toFixed(2)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                  >
                    <Edit3 size={18} /> Editar
                  </button>
                  <button className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors">
                    <History size={18} /> Histórico
                  </button>
                  <button 
                    onClick={() => setIsReplenishing(true)}
                    className="col-span-2 flex items-center justify-center gap-2 py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                  >
                    <Plus size={18} /> Registrar Reposição
                  </button>
                  
                  {showDeleteConfirm ? (
                    <div className="col-span-2 space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                      <p className="text-xs font-bold text-destructive text-center uppercase tracking-widest">Confirmar exclusão?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={handleDelete}
                          className="py-2 bg-destructive text-white rounded-xl text-xs font-bold hover:bg-destructive/80 transition-colors"
                        >
                          Sim, Excluir
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="col-span-2 flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 size={18} /> Remover Item
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default function Estoque() {
  const { 
    inventory, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem, 
    applyRetroactiveStockDeduction,
    addManagementTransaction 
  } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplyingRetroactive, setIsApplyingRetroactive] = useState(false);
  const [showRetroSuccess, setShowRetroSuccess] = useState(false);

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const outOfStockCount = inventory.filter(i => i.status === 'Esgotado').length;
  const lowStockCount = inventory.filter(i => i.status === 'Baixo').length;

  const handleRetroactive = async () => {
    if (!window.confirm('Atenção: Isso irá descontar do estoque todos os materiais usados em agendamentos finalizados desde 01/04/2026. Deseja continuar?')) {
      return;
    }
    
    setIsApplyingRetroactive(true);
    try {
      await applyRetroactiveStockDeduction();
      setShowRetroSuccess(true);
      setTimeout(() => setShowRetroSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao aplicar dedução retroativa:', error);
    } finally {
      setIsApplyingRetroactive(false);
    }
  };

  const handleGenerateDefaultInventory = () => {
    const defaultItems: Omit<InventoryItem, 'id'>[] = [
      { name: '3RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '5RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '7RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '9RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '11RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '13RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '15RL', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '18RS', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '15M1', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '25M1', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '15MG', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: '25MG', category: 'Agulhas', stock: 0, minStock: 5, unit: 'un', status: 'Esgotado', price: 0 },
      { name: 'Tinta Preta', category: 'Tatuagem', stock: 30, minStock: 5, unit: 'ml', status: 'Em estoque', price: 0 },
      { name: 'Papel Toalha', category: 'Descartáveis', stock: 1000, minStock: 200, unit: 'folhas', status: 'Em estoque', price: 0 },
      { name: 'Luvas de Nitrilo', category: 'Descartáveis', stock: 200, minStock: 50, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Papel Hectográfico', category: 'Tatuagem', stock: 100, minStock: 20, unit: 'folhas', status: 'Em estoque', price: 0 },
      { name: 'Transfer Stencil', category: 'Tatuagem', stock: 250, minStock: 50, unit: 'ml', status: 'Em estoque', price: 0 },
      { name: 'Vaselina Sólida', category: 'Tatuagem', stock: 500, minStock: 100, unit: 'g', status: 'Em estoque', price: 0 },
      { name: 'Batoques', category: 'Descartáveis', stock: 1000, minStock: 200, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Plástico Filme PVC', category: 'Descartáveis', stock: 300, minStock: 50, unit: 'm', status: 'Em estoque', price: 0 },
      { name: 'Protetor de Cabo', category: 'Descartáveis', stock: 100, minStock: 20, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Bandagem Elástica', category: 'Descartáveis', stock: 20, minStock: 5, unit: 'm', status: 'Em estoque', price: 0 },
      { name: 'Sabão Degermante', category: 'Limpeza', stock: 1000, minStock: 200, unit: 'ml', status: 'Em estoque', price: 0 },
      { name: 'Álcool 70%', category: 'Limpeza', stock: 10, minStock: 2, unit: 'l', status: 'Em estoque', price: 0 },
      { name: 'Campo Cirúrgico Estéril', category: 'Descartáveis', stock: 100, minStock: 20, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Cateter', category: 'Piercing', stock: 50, minStock: 10, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Joia', category: 'Piercing', stock: 100, minStock: 20, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Gaze Estéril', category: 'Descartáveis', stock: 500, minStock: 100, unit: 'un', status: 'Em estoque', price: 0 },
      { name: 'Solução Fisiológica', category: 'Piercing', stock: 10, minStock: 2, unit: 'l', status: 'Em estoque', price: 0 },
      { name: 'Antisséptico Povidine', category: 'Piercing', stock: 500, minStock: 100, unit: 'ml', status: 'Em estoque', price: 0 }
    ];

    defaultItems.forEach(item => {
      if (!inventory.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
        addInventoryItem(item);
      }
    });
    
    alert('Estoque padrão gerado com sucesso! Itens que já existiam não foram duplicados.');
  };

  const handleSave = (itemData: Partial<InventoryItem>) => {
    if (selectedItem?.id) {
      updateInventoryItem(selectedItem.id, itemData);
    } else {
      addInventoryItem(itemData as Omit<InventoryItem, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleReplenish = (id: string, amount: number, cost?: number) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
      const newStock = item.stock + amount;
      let status: 'Em estoque' | 'Baixo' | 'Esgotado' = 'Em estoque';
      if (newStock <= 0) status = 'Esgotado';
      else if (newStock <= item.minStock) status = 'Baixo';

      updateInventoryItem(id, { 
        stock: newStock,
        status 
      });

      // Add financial transaction if cost is provided
      if (cost && cost > 0) {
        addManagementTransaction({
          type: 'Saída',
          category: 'Estoque',
          description: `Reposição: ${item.name} (${amount} ${item.unit})`,
          value: cost,
          date: new Date().toISOString().split('T')[0],
          method: 'Pix',
          origin: 'Trabalho',
          isRecurring: false,
          syncWithMain: true
        });
      }
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-bold tracking-tighter text-primary uppercase">ESTOQUE</h1>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-widest">Controle seus suprimentos e materiais</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGenerateDefaultInventory}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-bold text-sm hover:bg-white/10 transition-all"
          >
            Gerar Padrão
          </button>
          <button 
            onClick={handleRetroactive}
            disabled={isApplyingRetroactive}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all",
              showRetroSuccess 
                ? "bg-success text-white" 
                : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 disabled:opacity-50"
            )}
          >
            {isApplyingRetroactive ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processando...
              </>
            ) : showRetroSuccess ? (
              <>
                <CheckCircle2 size={20} /> Estoque Atualizado!
              </>
            ) : (
              <>
                <History size={20} /> Aplicar Retroativo
              </>
            )}
          </button>
          <button 
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
          >
            <Plus size={20} /> Novo Item
          </button>
        </div>
      </div>

      {/* Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card bg-destructive/5 border-destructive/20 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-3 bg-destructive/20 text-destructive rounded-2xl"><AlertCircle size={24} /></div>
          <div>
            <p className="text-sm font-bold text-destructive uppercase tracking-widest">Itens Esgotados</p>
            <p className="text-2xl font-bold">{outOfStockCount} item(s)</p>
          </div>
        </div>
        <div className="glass-card bg-accent/5 border-accent/20 p-6 rounded-[2rem] flex items-center gap-4">
          <div className="p-3 bg-accent/20 text-accent rounded-2xl"><ShoppingCart size={24} /></div>
          <div>
            <p className="text-sm font-bold text-accent uppercase tracking-widest">Estoque Baixo</p>
            <p className="text-2xl font-bold">{lowStockCount} item(s)</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text"
            placeholder="Buscar item ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-4 bg-card border border-white/5 rounded-2xl text-gray-400 font-bold text-sm hover:bg-white/5 transition-colors">
          <Filter size={20} /> Filtros
        </button>
      </div>

      {/* Inventory List */}
      <div className="glass-card bg-card border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Item</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estoque</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredInventory.map((item) => (
                <tr 
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setIsModalOpen(true);
                  }}
                  className="group cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                        <Package size={20} />
                      </div>
                      <p className="font-bold text-sm group-hover:text-primary transition-colors">{item.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs text-gray-500">{item.category}</span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold">{item.stock} {item.unit}</p>
                    <p className="text-[10px] text-gray-600">Mínimo: {item.minStock}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      item.status === 'Em estoque' ? "bg-success/20 text-success" :
                      item.status === 'Baixo' ? "bg-accent/20 text-accent" :
                      "bg-destructive/20 text-destructive"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-500 hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <ItemModal 
        item={selectedItem} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        onDelete={deleteInventoryItem}
        onReplenish={handleReplenish}
      />
    </div>
  );
}
