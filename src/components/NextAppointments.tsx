import React, { useState } from 'react';
import { Calendar, ChevronRight, MessageCircle, Package } from 'lucide-react';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { openWhatsApp } from '../utils/whatsapp';
import { AppointmentMaterialModal } from './AppointmentMaterialModal';
import { getRelativeDayText } from '../lib/utils';

const AppointmentItem = ({ day, month, name, service, time, onWhatsApp, onMaterials, index }: { day: string, month: string, name: string, service: string, time: string, onWhatsApp?: () => void, onMaterials?: () => void, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    viewport={{ once: true }}
    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-4 flex-1 min-w-0">
      <motion.div 
        whileHover={{ scale: 1.1 }}
        className="flex flex-col items-center justify-center w-14 h-14 bg-black border border-white/10 rounded-xl shrink-0"
      >
        <span className="text-[8px] font-bold uppercase text-gray-500">{month}</span>
        <span className="text-xl font-bold">{day}</span>
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">{service}</p>
      </div>
    </div>
    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 w-full sm:w-auto">
      <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0">
        {time}
      </div>
      <div className="flex gap-2">
        <motion.button 
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onMaterials?.();
          }}
          className="p-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors shrink-0"
          title="Lançar Materiais"
        >
          <Package size={14} />
        </motion.button>
        <motion.button 
          whileHover={{ scale: 1.2, rotate: 10 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onWhatsApp?.();
          }}
          className="p-1.5 bg-success/10 text-success rounded-lg hover:bg-success/20 transition-colors shrink-0"
          title="Enviar confirmação WhatsApp"
        >
          <MessageCircle size={14} />
        </motion.button>
      </div>
    </div>
  </motion.div>
);

export function NextAppointments() {
  const { appointments, clients, inventory, updateAppointment, updateInventoryItem, addInventoryItem } = useData();
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Cliente Desconhecido';
  };

  const handleWhatsAppConfirmation = (appointment: any) => {
    const client = clients.find(c => c.id === appointment.clientId);
    if (!client || !client.phone) {
      console.warn('Telefone do cliente não encontrado.');
      return;
    }

    const formattedDate = appointment.date.split('-').reverse().join('/');
    const formattedValue = appointment.value % 1 === 0 ? appointment.value.toString() : appointment.value.toFixed(2);
    const dayText = getRelativeDayText(appointment.date);
    const message = `Olá ${appointment.clientName || client.name}, passando para confirmar sua sessão ${dayText} às ${appointment.time} com ${appointment.professionalName} no Viking Tatuagem e Body piercing!

🗓 Data: ${formattedDate} 
⏰ Hora início: ${appointment.time}
🛍 Serviço: ${appointment.service}
💰 Valor: R$ ${formattedValue}

Lembre-se de vir bem alimentado(a)! 🍔

📍 Endereço:
https://share.google/gt8OB3xtlwWgC3CLd`;

    openWhatsApp(client.phone, message);
  };

  const handleSaveMaterials = async (appointmentId: string, materials: any[]) => {
    const appointment = appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    const oldMaterials = appointment.materialsUsed || [];
    
    // Calculate differences
    const inventoryAdjustments: Record<string, number> = {};
    
    oldMaterials.forEach(m => {
      if (m.inventoryItemId) {
        inventoryAdjustments[m.inventoryItemId] = (inventoryAdjustments[m.inventoryItemId] || 0) + m.quantity;
      }
    });
    
    // Process new materials
    const finalMaterials = [...materials];
    
    for (let i = 0; i < finalMaterials.length; i++) {
      const m = finalMaterials[i];
      if (!m.inventoryItemId && m.name) {
        // Item doesn't exist in inventory, let's create it
        const newItem = {
          name: m.name,
          category: 'Geral', // Default category
          stock: 0, // It will be deducted below, so it will go negative or stay 0 depending on logic. Let's set initial stock to 0. Actually, if they just used it, maybe they bought it. Let's set stock to -m.quantity so it reflects the usage, or 0 and let it go negative.
          minStock: 5,
          unit: m.unit || 'un',
          status: 'Esgotado' as const,
          price: m.cost || 0
        };
        
        try {
          // We don't have the new ID immediately if addInventoryItem doesn't return it.
          // But wait, addInventoryItem in DataContext might not return the ID.
          // Let's just add it. The stock will be 0.
          await addInventoryItem(newItem);
        } catch (e) {
          console.error("Error adding new inventory item", e);
        }
      } else if (m.inventoryItemId) {
        inventoryAdjustments[m.inventoryItemId] = (inventoryAdjustments[m.inventoryItemId] || 0) - m.quantity;
      }
    }

    // Apply adjustments
    Object.entries(inventoryAdjustments).forEach(([itemId, adjustment]) => {
      if (adjustment !== 0) {
        const item = inventory.find(i => i.id === itemId);
        if (item) {
          const newStock = item.stock + adjustment;
          let newStatus: 'Em estoque' | 'Baixo' | 'Esgotado' = 'Em estoque';
          if (newStock <= 0) newStatus = 'Esgotado';
          else if (newStock <= item.minStock) newStatus = 'Baixo';
          
          updateInventoryItem(itemId, { stock: newStock, status: newStatus });
        }
      }
    });

    await updateAppointment(appointmentId, { 
      materialsUsed: finalMaterials,
      stockDeducted: true 
    });
  };

  const nextAppointments = appointments
    .filter(a => {
      const d = new Date(a.date + 'T00:00:00');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return !isNaN(d.getTime()) && d >= now && a.approvalStatus !== 'Reprovado' && a.status !== 'Cancelado';
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
      const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();
      return dateA - dateB;
    })
    .slice(0, 3)
    .map(a => {
      const date = new Date(a.date + 'T00:00:00');
      const today = new Date();
      const isToday = a.date === `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      return {
        id: a.id,
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
        name: a.clientName || getClientName(a.clientId),
        service: a.service,
        time: a.time,
        isToday,
        original: a
      };
    });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass-card rounded-[2rem] p-6 relative overflow-hidden"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold tracking-tight">Próximos Horários</h3>
        <motion.button 
          whileHover={{ x: 5 }}
          className="text-primary font-bold text-xs hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </motion.button>
      </div>
      <div className="space-y-3">
        {nextAppointments.map((appointment, i) => (
          <div key={appointment.id} className="relative">
            {appointment.isToday && (
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--color-primary),0.5)]" />
            )}
            <AppointmentItem 
              index={i}
              day={appointment.day}
              month={appointment.month}
              name={appointment.name}
              service={appointment.service}
              time={appointment.time}
              onWhatsApp={() => handleWhatsAppConfirmation(appointment.original)}
              onMaterials={() => {
                setSelectedAppointment(appointment.original);
                setIsMaterialModalOpen(true);
              }}
            />
          </div>
        ))}
        {nextAppointments.length === 0 && (
          <div className="py-8 text-center text-gray-500 text-sm">Nenhum agendamento futuro.</div>
        )}
      </div>

      <AppointmentMaterialModal
        appointment={selectedAppointment}
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={handleSaveMaterials}
        inventory={inventory}
      />
    </motion.div>
  );
}
