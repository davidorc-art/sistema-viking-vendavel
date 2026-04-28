import React, { useState, useMemo } from 'react';
import { Appointment, InventoryItem } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Package } from 'lucide-react';
import { getDeductionsForService } from '../services/inventoryAutomationService';

export const AppointmentMaterialModal = ({
  appointment,
  isOpen,
  onClose,
  onSave,
  inventory
}: {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, materials: any[]) => void;
  inventory: InventoryItem[];
}) => {
  const [materials, setMaterials] = useState<{ id: string; inventoryItemId?: string; name: string; quantity: number; cost: number; unit?: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (appointment && isOpen) {
      if (appointment.materialsUsed && appointment.materialsUsed.length > 0) {
        setMaterials(appointment.materialsUsed);
      } else {
        // Auto-populate from service deductions
        const deductions = getDeductionsForService(appointment);
        const autoMaterials = deductions.map(d => {
          let bestMatch = null;
          let maxScore = 0;

          inventory.forEach(i => {
            const itemNameLower = i.name.toLowerCase();
            let score = 0;
            d.keywords.forEach(kw => {
              if (itemNameLower.includes(kw.toLowerCase())) {
                score += 1;
              }
            });
            
            // Boost score if category matches
            if (i.category.toLowerCase() === d.category.toLowerCase()) {
              score += 0.5;
            }

            if (score > maxScore && score >= 1) {
              maxScore = score;
              bestMatch = i;
            }
          });

          const item = bestMatch as InventoryItem | null;

          return {
            id: Math.random().toString(36).substr(2, 9),
            inventoryItemId: item?.id,
            name: item?.name || d.itemName,
            quantity: d.quantity,
            cost: item?.price || d.price || 0,
            unit: item?.unit || d.unit
          };
        });
        setMaterials(autoMaterials);
      }
    } else if (!isOpen) {
      setMaterials([]);
    }
  }, [appointment, isOpen, inventory]);

  if (!isOpen || !appointment) return null;

  const handleAddMaterial = (item?: InventoryItem) => {
    if (item) {
      setMaterials([...materials, { 
        id: Math.random().toString(36).substr(2, 9), 
        inventoryItemId: item.id,
        name: item.name, 
        quantity: 1, 
        cost: item.price,
        unit: item.unit
      }]);
    } else {
      setMaterials([...materials, { 
        id: Math.random().toString(36).substr(2, 9), 
        name: '', 
        quantity: 1, 
        cost: 0 
      }]);
    }
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleUpdateMaterial = (id: string, field: string, value: string | number) => {
    setMaterials(materials.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        // Auto-update cost if quantity changes and it's an inventory item
        if (field === 'quantity' && m.inventoryItemId) {
          const invItem = inventory.find(i => i.id === m.inventoryItemId);
          if (invItem) {
            updated.cost = Number(value) * invItem.price;
          }
        }
        return updated;
      }
      return m;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(appointment.id, materials);
    onClose();
  };

  // Group inventory by category
  const inventoryByCategory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const filteredCategories = Object.entries(inventoryByCategory).map(([category, items]) => ({
    category,
    items: items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

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
            className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-card border-t border-white/10 rounded-t-[32px] md:rounded-t-[40px] z-[70] p-6 md:p-8 max-h-[92vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div>
                <h2 className="text-lg md:text-xl font-bold">Materiais Utilizados</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-1">{appointment.clientName} - {appointment.service}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Left Side: Current Materials */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lista de Uso</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                    {materials.length} itens
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {materials.map((material) => (
                      <div key={material.id} className="flex flex-col gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 relative group">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Material</label>
                          <input 
                            type="text"
                            required
                            value={material.name}
                            onChange={(e) => handleUpdateMaterial(material.id, 'name', e.target.value)}
                            placeholder="Nome do material"
                            className="w-full bg-transparent border-b border-white/10 py-1 text-sm focus:border-primary outline-none transition-colors"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="w-20 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Qtd</label>
                            <input 
                              type="number"
                              required
                              min="1"
                              value={material.quantity}
                              onChange={(e) => handleUpdateMaterial(material.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-full bg-transparent border-b border-white/10 py-1 text-sm focus:border-primary outline-none transition-colors"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo Unit. (R$)</label>
                            <input 
                              type="number"
                              min="0"
                              step="0.01"
                              value={material.cost}
                              onChange={(e) => handleUpdateMaterial(material.id, 'cost', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent border-b border-white/10 py-1 text-sm focus:border-primary outline-none transition-colors"
                            />
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveMaterial(material.id)}
                          className="absolute top-4 right-4 p-2 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}

                    {materials.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl text-gray-500 text-sm">
                        Nenhum material adicionado ainda.
                      </div>
                    )}
                  </div>

                  <button 
                    type="button"
                    onClick={() => handleAddMaterial()}
                    className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-sm font-bold text-gray-400 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Item Personalizado
                  </button>

                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Custo Total Estimado</p>
                      <p className="text-2xl font-bold text-white">
                        R$ {materials.reduce((acc, m) => acc + (m.cost * m.quantity), 0).toFixed(2)}
                      </p>
                    </div>
                    <button 
                      type="submit"
                      className="px-8 py-4 bg-primary rounded-2xl text-white font-bold shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-[1.02] transition-transform"
                    >
                      Salvar Tudo
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Side: Inventory Selection */}
              <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estoque Disponível</h3>
                  <Package size={16} className="text-gray-500" />
                </div>

                <input 
                  type="text"
                  placeholder="Buscar no estoque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-sm focus:border-primary outline-none transition-colors"
                />

                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredCategories.map(({ category, items }) => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => handleAddMaterial(item)}
                            className="flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 rounded-xl transition-all text-left"
                          >
                            <span className="text-sm font-bold text-white truncate w-full">{item.name}</span>
                            <div className="flex items-center justify-between w-full mt-2">
                              <span className="text-[10px] text-gray-400">{item.stock} {item.unit} disp.</span>
                              <span className="text-[10px] font-bold text-accent">R$ {item.price.toFixed(2)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {filteredCategories.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Nenhum item encontrado no estoque.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
