import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight,
  MoreVertical,
  X,
  Edit3,
  Trash2,
  ShoppingCart,
  Tag,
  Package,
  Star,
  Minus,
  CheckCircle2,
  User,
  CreditCard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Product, Client } from '../types';

// --- Types ---

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// --- Sub-components ---

const ProductModal = ({ 
  product, 
  isOpen, 
  onClose,
  onSave,
  onDelete,
  onAddToCart
}: { 
  product: Product | null, 
  isOpen: boolean, 
  onClose: () => void,
  onSave: (data: Partial<Product>) => void,
  onDelete: (id: string) => void,
  onAddToCart: (product: Product) => void
}) => {
  const [isEditing, setIsEditing] = useState(!product?.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      category: 'Acessórios',
      price: 0,
      stock: 0,
      image: '',
      rating: 5.0
    }
  );

  React.useEffect(() => {
    if (product) {
      setFormData(product);
      setIsEditing(false);
    } else {
      setFormData({
        name: '',
        category: 'Acessórios',
        price: 0,
        stock: 0,
        image: '',
        rating: 5.0
      });
      setIsEditing(true);
    }
    setShowDeleteConfirm(false);
  }, [product, isOpen]);

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
    if (product?.id) {
      onDelete(product.id);
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
                {product?.id ? (isEditing ? 'Editar Produto' : 'Detalhes do Produto') : 'Novo Produto'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              {isEditing ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nome do Produto</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Pomada Modeladora" 
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
                        <option value="Acessórios">Acessórios</option>
                        <option value="Cabelo">Cabelo</option>
                        <option value="Barba">Barba</option>
                        <option value="Roupas">Roupas</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Preço (R$)</label>
                      <input 
                        type="number" 
                        required
                        step="0.01"
                        value={isNaN(formData.price!) ? '' : formData.price}
                        onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estoque</label>
                      <input 
                        type="number" 
                        required
                        value={isNaN(formData.stock!) ? '' : formData.stock}
                        onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">URL da Imagem</label>
                      <input 
                        type="text" 
                        value={formData.image}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://..." 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-primary/50 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Image Placeholder */}
                  <div className="aspect-square w-full bg-white/5 rounded-[40px] flex items-center justify-center text-gray-700 border border-white/5 overflow-hidden">
                    {product?.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ShoppingBag size={80} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{product?.category}</span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{product?.rating || 5.0}</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold">{product?.name}</h3>
                    <p className="text-4xl font-bold text-success">R$ {product?.price.toFixed(2)}</p>
                  </div>

                  {/* Stock */}
                  <div className="p-6 bg-black/40 rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Estoque Disponível</p>
                      <p className="text-2xl font-bold">{product?.stock} unidades</p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      (product?.stock || 0) > 10 ? "bg-success/20 text-success" : "bg-accent/20 text-accent"
                    )}>
                      {(product?.stock || 0) > 10 ? 'Em Estoque' : 'Baixo Estoque'}
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
                      Salvar Produto
                    </button>
                    <button 
                      type="button"
                      onClick={() => product?.id ? setIsEditing(false) : onClose()}
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
                      className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-2xl text-sm font-bold hover:bg-white/10 transition-colors"
                    >
                      <Tag size={18} /> Promoção
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (product) {
                          onAddToCart(product);
                          onClose();
                        }
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
                        <Trash2 size={18} /> Remover Produto
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

export default function Loja() {
  const { products, clients, addProduct, updateProduct, deleteProduct, processSale } = useData();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Dinheiro' | 'Cartão' | 'Pix'>('Pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = ['Todos', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleSave = (data: Partial<Product>) => {
    if (selectedProduct?.id) {
      updateProduct(selectedProduct.id, data);
    } else {
      addProduct(data as Omit<Product, 'id'>);
    }
    setIsModalOpen(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        quantity: 1,
        image: product.image
      }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      await processSale(
        cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          type: 'product' as const
        })),
        paymentMethod,
        selectedClientId || undefined
      );
      
      setShowSuccess(true);
      setCart([]);
      setSelectedClientId('');
      setTimeout(() => {
        setShowSuccess(false);
        setIsCartOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao processar venda:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div className={cn("space-y-8 transition-all duration-300", isCartOpen ? "pr-0 lg:pr-96" : "")}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-5xl font-serif italic text-primary uppercase tracking-tighter">LOJA</h1>
            <p className="text-gray-500 text-sm font-medium">Produtos e acessórios Viking Tatuagem e Body piercing</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="relative p-3 bg-card border border-white/5 rounded-2xl text-gray-400 hover:text-primary transition-colors"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            <button 
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary rounded-2xl text-white font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 transition-transform"
            >
              <Plus size={20} /> Novo Produto
            </button>
          </div>
        </div>

        {/* Search & Categories */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm focus:border-primary/50 outline-none transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              onClick={() => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
              className="bg-card border border-white/5 rounded-[40px] p-6 space-y-6 cursor-pointer hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="aspect-square w-full bg-white/5 rounded-3xl flex items-center justify-center text-gray-700 group-hover:scale-[1.02] transition-transform overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-3xl" referrerPolicy="no-referrer" />
                ) : (
                  <ShoppingBag size={60} />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.category}</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{product.rating || 5.0}</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{product.name}</h3>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xl font-bold text-success">R$ {product.price.toFixed(2)}</p>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    product.stock > 5 ? "text-gray-500" : "text-accent"
                  )}>
                    {product.stock} em estoque
                  </span>
                </div>
              </div>

              {/* Quick Add Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product);
                }}
                className="absolute top-4 right-4 p-3 bg-primary text-white rounded-2xl shadow-lg translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-600 mx-auto">
              <ShoppingBag size={40} />
            </div>
            <p className="text-gray-500 font-medium">Nenhum produto encontrado.</p>
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
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 text-primary rounded-xl">
                    <ShoppingCart size={20} />
                  </div>
                  <h2 className="text-xl font-bold uppercase tracking-tighter">Carrinho</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <ShoppingBag size={48} />
                    <p className="text-sm font-medium">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-black/20 rounded-3xl border border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <ShoppingBag size={24} className="text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <p className="text-success font-bold text-sm">R$ {item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/5 shrink-0">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:text-primary transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cart.length > 0 && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    {/* Client Selection */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <User size={12} /> Cliente (Opcional)
                      </label>
                      <select 
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-4 text-sm focus:border-primary/50 outline-none transition-colors appearance-none"
                      >
                        <option value="">Venda Direta (Sem Cliente)</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <CreditCard size={12} /> Método de Pagamento
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Pix', 'Cartão', 'Dinheiro'] as const).map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={cn(
                              "py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                              paymentMethod === method 
                                ? "bg-primary/20 border-primary text-primary" 
                                : "bg-black/40 border-white/5 text-gray-500 hover:border-white/20"
                            )}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-black/40 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">Total</span>
                    <span className="text-3xl font-bold text-success">R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full py-5 bg-primary rounded-[24px] text-white font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                  >
                    {isProcessing ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : showSuccess ? (
                      <>
                        <CheckCircle2 size={24} /> Venda Realizada!
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={24} /> Finalizar Venda
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <ProductModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        onDelete={deleteProduct}
        onAddToCart={addToCart}
      />
    </div>
  );
}
