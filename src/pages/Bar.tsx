import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  MoreVertical,
  X,
  Edit3,
  Trash2,
  ShoppingCart,
  Coffee,
  Beer,
  Wine,
  GlassWater,
  Star,
  Minus,
  User,
  Check,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Drink, Client } from '../types';
import { toast } from 'sonner';

// --- Sub-components ---

const DrinkModal = ({ 
  drink, 
  isOpen, 
  onClose,
  onSave,
  onDelete,
  onAddToCart
}: { 
  drink: Drink | null, 
  isOpen: boolean, 
  onClose: () => void,
  onSave: (data: Partial<Drink>) => void,
  onDelete: (id: string) => void,
  onAddToCart: (drink: Drink) => void
}) => {
  const [isEditing, setIsEditing] = useState(!drink?.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Drink>>(
    drink || {
      name: '',
      category: 'Cervejas',
      price: 0,
      stock: 0,
      rating: 5.0
    }
  );

  React.useEffect(() => {
    if (drink) {
      setFormData(drink);
      setIsEditing(false);
    } else {
      setFormData({
        name: '',
        category: 'Cervejas',
        price: 0,
        stock: 0,
        rating: 5.0
      });
      setIsEditing(true);
    }
    setShowDeleteConfirm(false);
  }, [drink, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0
    });
    onClose();
  };

  const handleDelete = () => {
    if (drink?.id) {
      onDelete(drink.id);
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-white/10 rounded-t-[40px] z-[70] p-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">
                {drink?.id ? (isEditing ? 'Editar Bebida' : 'Detalhes da Bebida') : 'Novo Item'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nome da Bebida</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Cerveja Artesanal" 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                      <select 
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                      >
                        <option value="Cervejas">Cervejas</option>
                        <option value="Destilados">Destilados</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Quentes">Quentes</option>
                        <option value="Não Alcoólicos">Não Alcoólicos</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preço (R$)</label>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        value={isNaN(formData.price as number) ? '' : formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estoque</label>
                    <input 
                      type="number" 
                      required
                      value={isNaN(formData.stock as number) ? '' : formData.stock}
                      onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Icon Placeholder */}
                  <div className="aspect-square w-full bg-white/5 rounded-[40px] flex items-center justify-center text-gray-700 border border-white/5">
                    {drink?.category === 'Quentes' ? <Coffee size={80} /> : drink?.category === 'Cervejas' ? <Beer size={80} /> : <GlassWater size={80} />}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{drink?.category}</span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{drink?.rating || 5.0}</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold">{drink?.name}</h3>
                    <p className="text-4xl font-bold text-success">R$ {drink?.price.toFixed(2)}</p>
                  </div>

                  {/* Stock */}
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estoque Disponível</p>
                      <p className="text-2xl font-bold">{drink?.stock} unidades</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      (drink?.stock || 0) > 10 ? "bg-success/20 text-success" : "bg-accent/20 text-accent"
                    )}>
                      {(drink?.stock || 0) > 10 ? 'Em Estoque' : 'Baixo Estoque'}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="submit"
                      className="col-span-2 py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      Salvar Bebida
                    </button>
                    <button 
                      type="button"
                      onClick={() => drink?.id ? setIsEditing(false) : onClose()}
                      className="col-span-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                      <Edit3 size={18} /> Editar
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (drink) onAddToCart(drink);
                        onClose();
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform"
                    >
                      <ShoppingCart size={18} /> Adicionar ao Carrinho
                    </button>
                    
                    {showDeleteConfirm ? (
                      <div className="col-span-2 space-y-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                        <p className="text-xs font-bold text-destructive text-center uppercase tracking-widest">Confirmar exclusão?</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            type="button"
                            onClick={handleDelete}
                            className="py-2 bg-destructive text-white rounded-xl text-xs font-bold hover:bg-destructive/80 transition-colors"
                          >
                            Sim, Excluir
                          </button>
                          <button 
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="col-span-2 flex items-center justify-center gap-2 py-3 bg-destructive/10 border border-destructive/20 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 size={18} /> Remover do Cardápio
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'drink' | 'product';
}

export default function Bar() {
  const { drinks, addDrink, updateDrink, deleteDrink, clients, processSale, settings } = useData();
  const [selectedDrink, setSelectedDrink] = useState<Drink | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Dinheiro' | 'Cartão'>('Pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = ['Todos', ...new Set(drinks.map(d => d.category))];

  const filteredDrinks = useMemo(() => {
    let result = activeCategory === 'Todos' 
      ? drinks 
      : drinks.filter(d => d.category === activeCategory);
    
    if (searchQuery) {
      result = result.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    return result;
  }, [drinks, activeCategory, searchQuery]);

  const handleSave = (data: Partial<Drink>) => {
    if (selectedDrink?.id) {
      updateDrink(selectedDrink.id, data);
    } else {
      addDrink(data as Omit<Drink, 'id'>);
    }
    setIsModalOpen(false);
  };

  const addToCart = (drink: Drink) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === drink.id);
      if (existing) {
        return prev.map(item => item.id === drink.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: drink.id, name: drink.name, price: drink.price, quantity: 1, type: 'drink' }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      await processSale(cart, paymentMethod, selectedClientId);
      setCart([]);
      setSelectedClientId(undefined);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setIsCartOpen(false);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar venda. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="relative min-h-screen pb-20">
      <div className={cn("space-y-8 transition-all duration-300", isCartOpen ? "pr-0 lg:pr-96" : "")}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-5xl font-serif italic text-primary uppercase tracking-tighter">BAR</h1>
            <p className="text-gray-500 text-sm font-medium">Cardápio de bebidas e drinks</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative flex items-center justify-center gap-2 px-6 py-3 bg-card border border-white/5 rounded-2xl text-white font-bold text-sm hover:bg-white/5 transition-colors"
            >
              <ShoppingCart size={20} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-background">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
              Carrinho
            </button>
            <button 
              onClick={() => {
                setSelectedDrink(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
            >
              <Plus size={20} /> Novo Item
            </button>
          </div>
        </div>

        {/* Search and Categories */}
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text"
              placeholder="Buscar bebida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  activeCategory === cat ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-card border border-white/5 text-gray-500 hover:text-white"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Drinks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrinks.map((drink) => (
            <div 
              key={drink.id}
              className="bg-card border border-white/5 rounded-[40px] p-6 space-y-6 flex flex-col hover:border-primary/30 transition-all group"
            >
              <div 
                onClick={() => {
                  setSelectedDrink(drink);
                  setIsModalOpen(true);
                }}
                className="aspect-square w-full bg-white/5 rounded-3xl flex items-center justify-center text-gray-700 group-hover:scale-[1.02] transition-transform cursor-pointer"
              >
                {drink.category === 'Quentes' ? <Coffee size={60} /> : drink.category === 'Cervejas' ? <Beer size={60} /> : <GlassWater size={60} />}
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{drink.category}</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{drink.rating || 5.0}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{drink.name}</h3>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xl font-bold text-success">R$ {drink.price.toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    drink.stock > 10 ? "text-gray-500" : "text-accent"
                  )}>
                    {drink.stock} em estoque
                  </span>
                </div>
              </div>

              <button 
                onClick={() => addToCart(drink)}
                disabled={drink.stock <= 0}
                className="w-full py-3 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-gray-500"
              >
                {drink.stock > 0 ? 'Adicionar' : 'Esgotado'}
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredDrinks.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mx-auto">
              <Beer size={40} />
            </div>
            <p className="text-gray-500 font-medium">Nenhum item encontrado.</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-card border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 text-primary rounded-xl">
                    <ShoppingCart size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Carrinho</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Client Selector */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cliente (Opcional)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                      value={selectedClientId || ''}
                      onChange={(e) => setSelectedClientId(e.target.value || undefined)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-primary/50 outline-none appearance-none"
                    >
                      <option value="">Venda Direta (Sem Cliente)</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {selectedClient && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-primary">{selectedClient.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{selectedClient.level} • {selectedClient.points} pts</p>
                      </div>
                      <Check size={16} className="text-primary" />
                    </div>
                  )}
                </div>

                {/* Cart Items */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Itens no Pedido</label>
                  {cart.length === 0 ? (
                    <div className="text-center py-12 bg-black/20 rounded-3xl border border-dashed border-white/10">
                      <p className="text-sm text-gray-500">Seu carrinho está vazio</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group">
                          <div className="space-y-1">
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-xs text-success font-bold">R$ {item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center bg-black/40 rounded-xl border border-white/5">
                              <button 
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-2 hover:text-primary transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-2 hover:text-primary transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-gray-500 hover:text-destructive transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'Pix', icon: QrCode },
                      { id: 'Dinheiro', icon: Banknote },
                      { id: 'Cartão', icon: CreditCard }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                          paymentMethod === method.id 
                            ? "bg-primary/20 border-primary text-primary" 
                            : "bg-black/40 border-white/5 text-gray-500 hover:text-white"
                        )}
                      >
                        <method.icon size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{method.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 bg-black/40 border-t border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total a Pagar</p>
                  <p className="text-3xl font-bold text-success">R$ {total.toFixed(2)}</p>
                </div>
                <button 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                  className="w-full py-4 bg-primary rounded-2xl text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isProcessing ? 'Processando...' : 'Finalizar Venda'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 px-8 py-4 bg-success text-white rounded-2xl font-bold shadow-2xl z-[100] flex items-center gap-3"
          >
            <Check size={20} /> Venda realizada com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <DrinkModal 
        drink={selectedDrink} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        onDelete={deleteDrink}
        onAddToCart={addToCart}
      />
    </div>
  );
}
