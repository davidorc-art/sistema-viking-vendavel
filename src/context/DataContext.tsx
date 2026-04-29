import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AppData, AppSettings, Client, Professional, Appointment, Transaction, LoyaltyTransaction, InventoryItem, Product, Drink, Reward, ConsentForm, BlockedTime, ManagementTransaction, ManagementCategory, ManagementRule } from '../types';
import { supabase } from '../lib/supabase';
import { toSnakeCase, toCamelCase } from '../lib/utils';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { getDeductionsForService, calculateNewStock } from '../services/inventoryAutomationService';
import { useAuth } from './AuthContext';

export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substr(2, 10);
};

const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
};

const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage. Quota may be exceeded.`, error);
    // Optionally, we could try to clear some old data here if needed,
    // but for now, just catching the error prevents the app from crashing.
  }
};

interface DataContextType extends AppData {
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setDrinks: React.Dispatch<React.SetStateAction<Drink[]>>;
  setRewards: React.Dispatch<React.SetStateAction<Reward[]>>;
  setLoyaltyTransactions: React.Dispatch<React.SetStateAction<LoyaltyTransaction[]>>;
  setConsentForms: React.Dispatch<React.SetStateAction<ConsentForm[]>>;
  setBlockedTimes: React.Dispatch<React.SetStateAction<BlockedTime[]>>;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isSyncing: boolean;
  
  dismissedNotifications: string[];
  dismissNotification: (id: string) => void;
  viewedNotifications: string[];
  markAsViewed: (ids: string[]) => void;

  // CRUD Helpers
  addClient: (client: Omit<Client, 'id'>) => Promise<string>;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  addProfessional: (professional: Omit<Professional, 'id'>) => Promise<string>;
  updateProfessional: (id: string, professional: Partial<Professional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  
  addAppointment: (appointment: Omit<Appointment, 'id'> & { id?: string }) => Promise<string>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  addBlockedTime: (blockedTime: Omit<BlockedTime, 'id'>) => void;
  updateBlockedTime: (id: string, blockedTime: Partial<BlockedTime>) => void;
  deleteBlockedTime: (id: string, dateToRemove?: string) => void;
  
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  addDrink: (drink: Omit<Drink, 'id'>) => void;
  updateDrink: (id: string, drink: Partial<Drink>) => void;
  deleteDrink: (id: string) => void;
  
  addReward: (reward: Omit<Reward, 'id'>) => void;
  updateReward: (id: string, reward: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  
  addLoyaltyTransaction: (transaction: Omit<LoyaltyTransaction, 'id'>) => void;
  updateLoyaltyTransaction: (id: string, transaction: Partial<LoyaltyTransaction>) => void;
  deleteLoyaltyTransaction: (id: string) => void;
  repairLoyaltyPoints: () => Promise<number>;
  recalculateClientPoints: (clientId: string) => Promise<number | undefined>;
  recalculateAllClients: () => Promise<number>;
  cleanupLoyaltyDuplicates: () => Promise<{ removedCount: number, clientsUpdated: number }>;

  // Management (Gestão)
  addManagementTransaction: (transaction: Omit<ManagementTransaction, 'id' | 'createdAt'>) => Promise<string>;
  updateManagementTransaction: (id: string, updates: Partial<ManagementTransaction>) => Promise<void>;
  deleteManagementTransaction: (id: string) => Promise<void>;
  deleteTransactionsBatch: (ids: string[]) => Promise<void>;
  estornarTransaction: (id: string) => Promise<string | undefined>;
  
  setManagementCategories: React.Dispatch<React.SetStateAction<ManagementCategory[]>>;
  managementRules: ManagementRule[];
  addManagementCategory: (category: Omit<ManagementCategory, 'id'>) => Promise<string>;
  addManagementRule: (rule: Omit<ManagementRule, 'id'>) => Promise<string>;
  updateManagementCategory: (id: string, category: Partial<ManagementCategory>) => Promise<void>;
  deleteManagementCategory: (id: string) => Promise<void>;

  deductStockForService: (appointment: Partial<Appointment>) => Promise<void>;

  addConsentForm: (consentForm: Omit<ConsentForm, 'id'>) => Promise<string>;
  updateSettings: (settings: Partial<AppSettings>) => void;

  processSale: (items: { id: string, name: string, price: number, quantity: number, type: 'drink' | 'product' }[], paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão', clientId?: string) => Promise<void>;
  applyRetroactiveStockDeduction: () => Promise<void>;

  refreshData: () => Promise<void>;
  exportData: () => string;
  importData: (json: string) => Promise<boolean>;
  clearAllData: () => Promise<boolean>;
}

const defaultSettings: AppSettings = {
  studioName: 'Viking Tatuagem e Body piercing',
  phone: '61981019691',
  instagram: '',
  address: '',
  mapsLink: '',
  openingHours: '10:00 - 20:00',
  defaultCommission: 30,
  customCommission: false,
  professionalRanking: true,
  paymentMethods: {
    pix: true,
    dinheiro: true,
    debito: true,
    credito: true,
  },
  loyaltyActive: true,
  pointsPerReal: 0.5,
  pointValue: 0.1,
  pointsPerReferral: 50,
  pointsPerBirthday: 100,
  defaultDuration: 60,
  appointmentInterval: 15,
  allowOverbooking: false,
  lowStockAlert: true,
  allowNegativeStock: false,
  sellWithoutClient: true,
  allowCourtesy: true,
  courtesyLimit: 5,
  allowDeposit: true,
  depositPercentage: 50,
  twoFactor: false,
  activityLog: true,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user, client, loading: authLoading } = useAuth();
  const location = useLocation();

  const [clients, setClients] = useState<Client[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [rewards, setRewards] = useState<Reward[]>(() => {
    try {
      const saved = localStorage.getItem('viking_rewards');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  useEffect(() => {
    localStorage.setItem('viking_rewards', JSON.stringify(rewards));
  }, [rewards]);

  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>(() => {
    try {
      const saved = localStorage.getItem('viking_blocked_times');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  useEffect(() => {
    localStorage.setItem('viking_blocked_times', JSON.stringify(blockedTimes));
  }, [blockedTimes]);

  const [managementCategories, setManagementCategories] = useState<ManagementCategory[]>([]);

  const [managementRules, setManagementRules] = useState<ManagementRule[]>(() => {
    try {
      const saved = localStorage.getItem('viking_management_rules');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading management rules from localStorage:', e);
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('viking_settings');
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch (e) {
      console.error('Error loading settings from localStorage:', e);
      return defaultSettings;
    }
  });

  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('viking_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading dismissed notifications from localStorage:', e);
      return [];
    }
  });

  const [viewedNotifications, setViewedNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('viking_viewed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading viewed notifications from localStorage:', e);
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState(true);
  const inventorySeededRef = useRef(false);
  const categoriesSeededRef = useRef(false);

  // Sanitization helper
  const sanitize = {
    clients: (data: any[]): Client[] => (Array.isArray(data) ? data : []).map(c => ({
      id: String(c.id || ''),
      name: String(c.name || 'Sem Nome'),
      email: String(c.email || ''),
      phone: String(c.phone || ''),
      status: (['Ativo', 'Inadimplente', 'Inativo'].includes(c.status) ? c.status : 'Ativo') as any,
      points: Number(c.points || 0),
      totalSpent: Number(c.totalSpent || c.total_spent || c.totalspent || 0),
      lastVisit: String(c.lastVisit || c.last_visit || c.lastvisit || ''),
      level: (['Bronze', 'Prata', 'Ouro', 'Viking'].includes(c.level) ? c.level : 'Bronze') as any,
      birthDate: String(c.birthDate || c.birth_date || ''),
      instagram: String(c.instagram || ''),
      city: String(c.city || ''),
      medicalNotes: String(c.medicalNotes || c.medical_notes || ''),
      indicatedBy: String(c.indicatedBy || c.indicated_by || ''),
      isMinor: Boolean(c.isMinor || c.is_minor),
      cpf: String(c.cpf || ''),
      notes: String(c.notes || '')
    })),
    professionals: (data: any[]): Professional[] => (Array.isArray(data) ? data : []).map(p => ({
      id: String(p.id || ''),
      name: String(p.name || 'Sem Nome'),
      role: String(p.role || 'Profissional'),
      specialty: Array.isArray(p.specialty) ? p.specialty.map(String) : ['Geral'],
      rating: Number(p.rating || 5),
      status: (['Disponível', 'Em Atendimento', 'Ausente'].includes(p.status) ? p.status : 'Disponível') as any,
      avatar: String(p.avatar || ''),
      commission: Number(p.commission || 0),
      signature: String(p.signature || p.assinatura || ''),
      pixKey: p.pixKey || p.pix_key || p.pixkey || '',
      pixName: p.pixName || p.pix_name || p.pixname || '',
      city: p.city || '',
      infinitePayTag: p.infinitePayTag || p.infinite_pay_tag || p.infinitepay_tag || p.infinityPayTag || p.infinity_pay_tag || p.infinitypay_tag || ''
    })),
    appointments: (data: any[]): Appointment[] => (Array.isArray(data) ? data : []).map(a => {
      const rawValue = Number(a.value || a.valor || 0);
      const rawDepositPercentage = Number(a.depositPercentage || a.deposit_percentage || a.porcentagem_sinal || a.depositpercentage || 100);
      let rawTotalValue = Number(a.totalValue || a.total_value || a.valor_total || a.totalvalue || 0);
      
      if (!rawTotalValue || rawTotalValue === rawValue) {
        if (rawDepositPercentage > 0 && rawDepositPercentage < 100) {
           rawTotalValue = rawValue / (rawDepositPercentage / 100);
        } else {
           rawTotalValue = rawValue || Number(a.valor_total || a.total_value || 0);
        }
      }

      return {
        id: String(a.id || ''),
        clientId: String(a.client_id || a.clientid || a.cliente_id || a.clientId || ''),
        clientName: String(a.clientName || a.clientname || a.client_name || a.nomeCliente || a.cliente || 'Cliente'),
        professionalId: String(a.professional_id || a.professionalid || a.profissional_id || a.professionalId || ''),
        professionalName: String(a.professionalName || a.professionalname || a.professional_name || a.nomeProfissional || a.profissional || 'Profissional'),
        service: String(a.service || a.servico || a.descricao_servico || a.descricao || 'Serviço'),
        date: (String(a.date || a.data || a.dados || '').split('T')[0]) || new Date().toISOString().split('T')[0],
        time: String(a.time || a.hora || a.hora_inicio || '00:00').substring(0, 5),
        status: (['Confirmado', 'Pendente', 'Finalizado', 'Cancelado', 'Falta'].includes(a.status) ? a.status : 
                 (a.status === 'concluido' ? 'Finalizado' : 'Confirmado')) as any,
        approvalStatus: (['Pendente', 'Aprovado', 'Reprovado', 'Aguardando Pagamento'].includes(a.approvalStatus || a.approval_status) ? (a.approvalStatus || a.approval_status) : 'Pendente') as any,
        paymentStatus: (['Pendente', 'Pago', 'Cancelado'].includes(a.paymentStatus || a.payment_status) ? (a.paymentStatus || a.payment_status) : 'Pendente') as any,
        paymentLinkId: String(a.paymentLinkId || a.payment_link_id || ''),
        paymentUrl: String(a.paymentUrl || a.payment_url || ''),
        totalValue: rawTotalValue,
        depositPercentage: rawDepositPercentage,
        value: rawValue || Number(a.valor_total || a.total_value || 0),
        paidValue: Number(a.paidValue || a.valorPago || a.valor_pago || 0),
        duration: Number(a.duration || a.duracao || a.tempo || 60),
        consentSent: Boolean(a.consentSent || a.consent_sent),
        consentSigned: Boolean(a.consentSigned || a.consent_signed),
        consentData: toCamelCase(a.consentData || a.consent_data || null),
        materialsUsed: toCamelCase(a.materialsUsed || a.materials_used || []),
        stockDeducted: Boolean(a.stockDeducted || a.stock_deducted)
      };
    }),
    transactions: (data: any[]): Transaction[] => (Array.isArray(data) ? data : []).map(t => {
      let origin = t.origin || (['Casa', 'Trabalho'].includes(t.origin) ? t.origin : undefined);
      let isRecurring = t.isRecurring || t.is_recurring || false;
      let recurrenceType = t.recurrenceType || t.recurrence_type || 'Mensal';
      let description = String(t.description || '');

      // Extract from description if not present (legacy support)
      if (!origin) {
        if (description.match(/^\[CASA\]/i)) origin = 'Casa';
        else if (description.match(/^\[TRABALHO\]/i)) origin = 'Trabalho';
      }
      
      if (!isRecurring) {
        const recMatch = description.match(/\[REC:(Mensal|Semanal|Personalizado)\]/i);
        if (recMatch) {
          isRecurring = true;
          recurrenceType = recMatch[1] as any;
        }
      }

      return {
        id: String(t.id || ''),
        type: (['Receita', 'Despesa', 'Entrada', 'Saída'].includes(t.type) ? (t.type === 'Receita' ? 'Entrada' : (t.type === 'Despesa' ? 'Saída' : t.type)) : 'Entrada') as any,
        category: String(t.category || 'Geral'),
        description: description,
        value: Number(t.value || 0),
        date: String(t.date || ''),
        method: (['Pix', 'Dinheiro', 'Cartão', 'Outro'].includes(t.method) ? t.method : 'Dinheiro') as any,
        status: (['Pago', 'Pendente'].includes(t.status) ? t.status : 'Pago') as any,
        appointmentId: String(t.appointmentId || t.agendamentoId || t.agendamento_id || t.appointment_id || ''),
        createdAt: String(t.createdAt || t.created_at || t.date || ''),
        origin: origin as any,
        isRecurring: isRecurring,
        recurrenceType: recurrenceType as any
      };
    }),
    inventory: (data: any[]): InventoryItem[] => (Array.isArray(data) ? data : []).map(i => ({
      id: String(i.id || ''),
      name: String(i.name || 'Item'),
      category: String(i.category || 'Geral'),
      stock: Number(i.stock || 0),
      minStock: Number(i.minStock || i.min_stock || i.minstock || 5),
      unit: String(i.unit || 'un'),
      status: (['Em estoque', 'Baixo', 'Esgotado'].includes(i.status) ? i.status : 'Em estoque') as any,
      price: Number(i.price || 0)
    })),
    products: (data: any[]): Product[] => (Array.isArray(data) ? data : []).map(p => ({
      id: String(p.id || ''),
      name: String(p.name || 'Produto'),
      category: String(p.category || 'Geral'),
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      rating: Number(p.rating || 5),
      image: String(p.image || '')
    })),
    drinks: (data: any[]): Drink[] => (Array.isArray(data) ? data : []).map(d => ({
      id: String(d.id || ''),
      name: String(d.name || 'Bebida'),
      category: String(d.category || 'Geral'),
      price: Number(d.price || 0),
      stock: Number(d.stock || 0),
      rating: Number(d.rating || 5),
      icon: String(d.icon || '')
    })),
    rewards: (data: any[]): Reward[] => (Array.isArray(data) ? data : []).map(r => ({
      id: String(r.id || ''),
      title: String(r.title || 'Recompensa'),
      points: Number(r.points || 0),
      description: String(r.description || ''),
      icon: String(r.icon || '')
    })),
    loyaltyTransactions: (data: any[]): LoyaltyTransaction[] => (Array.isArray(data) ? data : []).map(lt => ({
      id: String(lt.id || ''),
      clientId: String(lt.clientId || lt.client_id || ''),
      points: Number(lt.points || 0),
      type: (['Ganho', 'Resgate'].includes(lt.type) ? lt.type : 'Ganho') as any,
      description: String(lt.description || ''),
      date: String(lt.date || '')
    })),
    consentForms: (data: any[]): ConsentForm[] => (Array.isArray(data) ? data : []).map(c => {
      let answers = {};
      try {
        answers = typeof c.answers === 'string' ? JSON.parse(c.answers) : (c.answers || {});
      } catch (e) {
        console.error('SYNC: Error parsing consent form answers:', e);
      }
      
      return {
        id: String(c.id || ''),
        appointmentId: String(c.appointmentId || c.appointment_id || ''),
        clientId: String(c.clientId || c.client_id || ''),
        type: (['Tattoo', 'Piercing'].includes(c.type) ? c.type : 'Tattoo') as any,
        signedAt: String(c.signedAt || c.signed_at || ''),
        signature: String(c.signature || ''),
        professionalSignature: String(c.professionalSignature || c.professional_signature || c.assinatura_profissional || (answers as any).professional_signature || ''),
        guardianName: String(c.guardianName || c.guardian_name || (answers as any).guardian_name || ''),
        guardianDoc: String(c.guardianDoc || c.guardian_doc || (answers as any).guardian_doc || ''),
        guardianPhoto: String(c.guardianPhoto || c.guardian_photo || (answers as any).guardian_photo || ''),
        guardianFacePhoto: String(c.guardianFacePhoto || c.guardian_face_photo || (answers as any).guardian_face_photo || ''),
        minorPhoto: String(c.minorPhoto || c.minor_photo || (answers as any).minor_photo || ''),
        answers
      };
    }),
    blockedTimes: (data: any[]): BlockedTime[] => (Array.isArray(data) ? data : []).map(b => {
      let reason = String(b.reason || '');
      let recurrence = b.recurrence;
      let exceptions: string[] = [];
      
      // Extract recurrence from reason if it exists
      const recMatch = reason.match(/\[REC:(none|daily|weekly|monthly)\]/);
      if (recMatch) {
        recurrence = recMatch[1];
        reason = reason.replace(/\[REC:(none|daily|weekly|monthly)\]/g, '').trim();
      }

      // Extract exceptions from reason if they exist - handle multiple EXC tags just in case
      const excMatches = reason.matchAll(/\[EXC:([^\]]+)\]/g);
      for (const match of excMatches) {
        const dates = match[1].split(',').map(d => d.trim()).filter(Boolean);
        exceptions = [...exceptions, ...dates];
      }
      // Remove all EXC tags from the reason text
      reason = reason.replace(/\[EXC:[^\]]+\]/g, '').trim();
      
      // Remove any lingering brackets that might have been left behind or repeated
      reason = reason.replace(/\s*\[(REC|EXC):[^\]]*\]/g, '').trim();
      
      return {
        id: String(b.id || ''),
        professionalId: String(b.professionalId || b.professionalid || b.professional_id || b.profissionalId || b.profissional_id || 'all'),
        professionalName: String(b.professionalName || b.professionalname || b.professional_name || b.nomeProfissional || b.profissional || 'Todos'),
        date: String(b.date || '').split('T')[0],
        time: String(b.time || '00:00').substring(0, 5),
        duration: Number(b.duration || 60),
        reason: reason,
        recurrence: (['none', 'daily', 'weekly', 'monthly'].includes(recurrence) ? recurrence : 'none') as any,
        exceptions: [...new Set(exceptions)] // Deduplicate
      };
    }),
    managementCategories: (data: any[]): ManagementCategory[] => (Array.isArray(data) ? data : []).map(c => ({
      id: String(c.id || ''),
      name: String(c.name || ''),
      type: (c.type === 'Receita' ? 'Entrada' : (c.type === 'Despesa' ? 'Saída' : (['Entrada', 'Saída', 'Ambos'].includes(c.type) ? c.type : 'Ambos'))) as any,
      origin: (['Casa', 'Trabalho', 'Geral'].includes(c.origin) ? c.origin : 'Geral') as any
    })),
    settings: (data: any): AppSettings => {
      const s = data || {};
      return {
        ...defaultSettings,
        studioName: s.studioname || s.studio_name || s.studioName || defaultSettings.studioName,
        phone: s.phone || defaultSettings.phone,
        instagram: s.instagram || defaultSettings.instagram,
        address: s.address || defaultSettings.address,
        mapsLink: s.mapslink || s.maps_link || s.mapsLink || defaultSettings.mapsLink,
        openingHours: s.openinghours || s.opening_hours || s.openingHours || defaultSettings.openingHours,
        defaultCommission: s.defaultcommission !== undefined ? s.defaultcommission : (s.default_commission !== undefined ? s.default_commission : defaultSettings.defaultCommission),
        customCommission: s.customcommission !== undefined ? s.customcommission : (s.custom_commission !== undefined ? s.custom_commission : defaultSettings.customCommission),
        professionalRanking: s.professionalranking !== undefined ? s.professionalranking : (s.professional_ranking !== undefined ? s.professional_ranking : defaultSettings.professionalRanking),
        paymentMethods: s.paymentmethods || s.payment_methods || defaultSettings.paymentMethods,
        loyaltyActive: s.loyaltyactive !== undefined ? s.loyaltyactive : (s.loyalty_active !== undefined ? s.loyalty_active : defaultSettings.loyaltyActive),
        pointsPerReal: s.pointsperreal !== undefined ? s.pointsperreal : (s.points_per_real !== undefined ? s.points_per_real : defaultSettings.pointsPerReal),
        pointValue: s.pointvalue !== undefined ? s.pointvalue : (s.point_value !== undefined ? s.point_value : defaultSettings.pointValue),
        pointsPerReferral: s.pointsperreferral !== undefined ? s.pointsperreferral : (s.points_per_referral !== undefined ? s.points_per_referral : defaultSettings.pointsPerReferral),
        pointsPerBirthday: s.pointsperbirthday !== undefined ? s.pointsperbirthday : (s.points_per_birthday !== undefined ? s.points_per_birthday : defaultSettings.pointsPerBirthday),
        defaultDuration: s.defaultduration !== undefined ? s.defaultduration : (s.default_duration !== undefined ? s.default_duration : defaultSettings.defaultDuration),
        appointmentInterval: s.appointmentinterval !== undefined ? s.appointmentinterval : (s.appointment_interval !== undefined ? s.appointment_interval : defaultSettings.appointmentInterval),
        allowOverbooking: s.allowoverbooking !== undefined ? s.allowoverbooking : (s.allow_overbooking !== undefined ? s.allow_overbooking : defaultSettings.allowOverbooking),
        lowStockAlert: s.lowstockalert !== undefined ? s.lowstockalert : (s.low_stock_alert !== undefined ? s.low_stock_alert : defaultSettings.lowStockAlert),
        allowNegativeStock: s.allownegativestock !== undefined ? s.allownegativestock : (s.allow_negative_stock !== undefined ? s.allow_negative_stock : defaultSettings.allowNegativeStock),
        sellWithoutClient: s.sellwithoutclient !== undefined ? s.sellwithoutclient : (s.sell_without_client !== undefined ? s.sell_without_client : defaultSettings.sellWithoutClient),
        allowCourtesy: s.allowcourtesy !== undefined ? s.allowcourtesy : (s.allow_courtesy !== undefined ? s.allow_courtesy : defaultSettings.allowCourtesy),
        courtesyLimit: s.courtesylimit !== undefined ? s.courtesylimit : (s.courtesy_limit !== undefined ? s.courtesy_limit : defaultSettings.courtesyLimit),
        allowDeposit: s.allow_deposit !== undefined ? s.allow_deposit : (s.allowdeposit !== undefined ? s.allowdeposit : defaultSettings.allowDeposit),
        depositPercentage: s.deposit_percentage !== undefined ? s.deposit_percentage : (s.depositpercentage !== undefined ? s.depositpercentage : defaultSettings.depositPercentage),
        services: Array.isArray(s.services) ? toCamelCase(s.services) : defaultSettings.services,
        pixKey: s.pix_key || s.pixkey || defaultSettings.pixKey,
        pixName: s.pix_name || s.pixname || defaultSettings.pixName,
        city: s.city || defaultSettings.city,
        activityLog: s.activity_log !== undefined ? s.activity_log : (s.activitylog !== undefined ? s.activitylog : defaultSettings.activityLog),
        twoFactor: s.two_factor !== undefined ? s.two_factor : (s.twofactor !== undefined ? s.twofactor : defaultSettings.twoFactor),
        infinitePayTag: s.infinite_pay_tag || s.infinitepay_tag || s.infinitePayTag || s.infinity_pay_tag || s.infinitypay_tag || defaultSettings.infinitePayTag
      };
    }
  };

  const isFetchingRef = React.useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetchingRef.current) {
      console.log('SYNC: Já existe uma sincronização em curso. Ignorando...');
      return;
    }
    
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!url || !key || url.includes('placeholder')) {
      console.warn('SYNC: Supabase não configurado. Usando dados locais.');
      setIsSyncing(false);
      return;
    }

    // Resilient path normalization for sync detection
    const rawPath = location.pathname.toLowerCase().replace(/\/+/g, '/');
    const finalPath = (rawPath.length > 1 && rawPath.endsWith('/')) ? rawPath.slice(0, -1) : rawPath;

    // Detect public routes even if they have weird prefixes
    const checkPublic = (p: string) => {
      const publicPaths = ['/loyalty', '/booking', '/reschedule', '/consent', '/pagamento', '/portal'];
      return publicPaths.some(pub => p === pub || p.startsWith(`${pub}/`) || p.includes(`/login${pub}`));
    };

    const isPublicPath = checkPublic(finalPath);
    const isLoyaltyRoute = finalPath.includes('/loyalty') || finalPath.includes('/portal');
    const isBookingRoute = finalPath.includes('/booking');
    const isRescheduleRoute = finalPath.includes('/reschedule');
    const isConsentRoute = finalPath.includes('/consent');
    const isPagamentoRoute = finalPath.includes('/pagamento');
    
    if (!user && !isPublicPath) {
      console.log('SYNC: Usuário não autenticado e não é rota pública. Path:', finalPath);
      setIsSyncing(false);
      return;
    }

    isFetchingRef.current = true;
    setIsSyncing(true);
    console.log(`SYNC: Iniciando sincronização resiliente... (User: ${user?.id || 'Public'}, PublicPath: ${isPublicPath}, Path: ${location.pathname})`);
    
    // Safety timeout for the entire fetch operation
    const globalTimeout = setTimeout(() => {
      console.warn('SYNC: Global fetch timeout reached.');
      setIsSyncing(false);
      isFetchingRef.current = false;
    }, 120000); // Increased to 120s
    
    try {
      // Prioritized batches for better perceived performance
      const batch1 = ['clients', 'professionals', 'appointments'];
      const batch2 = ['blocked_times', 'management_categories', 'inventory'];
      const batch3 = ['products', 'drinks', 'rewards', 'loyalty_transactions'];
      const batch4 = ['transactions', 'consent_forms'];

      const processBatch = async (batchTables: string[]) => {
        const batchResults = await Promise.allSettled(
          batchTables.map(table => {
            let query = supabase.from(table).select('*');
            
            // SUPER OPTIMIZED FILTERS: Only fetch what's needed
            if (table === 'appointments') {
              // Fetch appointments from last 2 years for deep history
              const dateLimit = new Date();
              dateLimit.setFullYear(dateLimit.getFullYear() - 2);
              query = query.gte('date', dateLimit.toISOString().split('T')[0]).order('date', { ascending: true }).limit(10000);
            } else if (table === 'transactions' || table === 'loyalty_transactions') {
              // Fetch transactions from last 2 years (730 days)
              const windowDays = 730; 
              const dateLimit = new Date();
              dateLimit.setDate(dateLimit.getDate() - windowDays);
              query = query.gte('date', dateLimit.toISOString().split('T')[0]).order('date', { ascending: false }).limit(20000);
            } else if (table === 'consent_forms') {
              const windowDays = 365;
              const dateLimit = new Date();
              dateLimit.setDate(dateLimit.getDate() - windowDays);
              query = query.gte('signed_at', dateLimit.toISOString()).order('signed_at', { ascending: false }).limit(1000);
            }
            
            // Public route filtering logic (kept same for functionality)
            if (!user && (isLoyaltyRoute || isBookingRoute || isRescheduleRoute || isConsentRoute)) {
              const pathParts = finalPath.split('/').filter(Boolean);
              
              if (isLoyaltyRoute) {
                const loyaltyIndex = pathParts.indexOf('loyalty');
                const loyaltyClientId = (loyaltyIndex !== -1 ? pathParts[loyaltyIndex + 1] : null) || client?.id;
                
                if (loyaltyClientId) {
                  if (table === 'clients') query = query.eq('id', loyaltyClientId);
                  if (table === 'appointments') query = query.eq('client_id', loyaltyClientId);
                  if (table === 'loyalty_transactions') query = query.eq('client_id', loyaltyClientId);
                  if (['professionals', 'transactions', 'inventory', 'products', 'drinks', 'consent_forms', 'blocked_times'].includes(table)) {
                    return Promise.resolve({ data: [], error: null });
                  }
                }
              } else if (isBookingRoute) {
                const searchParams = new URLSearchParams(window.location.search);
                const bookingClientId = searchParams.get('c') || searchParams.get('clientId');
                
                if (table === 'clients' && bookingClientId) {
                  query = query.eq('id', bookingClientId);
                } else if (table === 'appointments') {
                  return fetch('/api/public/booking-data').then(r => r.json()).then(d => ({ data: d.appointments, error: null })).catch(() => ({ data: [], error: null }));
                } else if (table === 'blocked_times') {
                  return fetch('/api/public/booking-data').then(r => r.json()).then(d => ({ data: d.blocked_times, error: null })).catch(() => ({ data: [], error: null }));
                } else if (table === 'professionals') {
                  return fetch('/api/public/booking-data').then(r => r.json()).then(d => ({ data: d.professionals, error: null })).catch(() => ({ data: [], error: null }));
                } else if (!['professionals'].includes(table) && !(table === 'clients' && bookingClientId) && table !== 'appointments' && table !== 'blocked_times') {
                  return Promise.resolve({ data: [], error: null });
                }
              } else if (isRescheduleRoute) {
                if (['transactions', 'inventory', 'products', 'drinks', 'rewards', 'loyalty_transactions'].includes(table)) {
                  return Promise.resolve({ data: [], error: null });
                }
              } else if (isConsentRoute) {
                const routeId = pathParts[pathParts.length - 1];
                if (table === 'appointments' && routeId) {
                  query = query.eq('id', routeId);
                } else if (['transactions', 'inventory', 'products', 'drinks', 'rewards', 'loyalty_transactions'].includes(table)) {
                  return Promise.resolve({ data: [], error: null });
                }
              }
            }

            const tableTimeout = ['appointments', 'consent_forms', 'transactions'].includes(table) ? 60000 : 45000;
            return withTimeout(query as any, tableTimeout);
          })
        );
        return batchResults;
      };

      const processResult = (res: any, sanitizer: any, setter: any, tableName: string) => {
        if (res.status === 'fulfilled') {
          const value = res.value as { data: any; error: any };
          if (value.error) {
            console.error(`SYNC: Error fetching ${tableName}:`, value.error);
            return null;
          }
          if (value.data && Array.isArray(value.data)) {
            // OPTIMIZATION: Non-recursive camelCase or directly sanitize if performance is critical
            const sanitized = sanitizer(toCamelCase(value.data));
            if (tableName === 'rewards') {
               setter((prev: any[]) => {
                 const merged = [...prev];
                 sanitized.forEach((item: any) => {
                   const index = merged.findIndex(i => i.id === item.id);
                   if (index >= 0) merged[index] = item;
                   else merged.push(item);
                 });
                 return merged;
               });
            } else {
               setter(sanitized);
            }
            return sanitized;
          }
        } else {
          console.error(`SYNC: Timeout or failure fetching ${tableName}:`, res.reason);
        }
        return null;
      };

      // FETCH BATCH 1: CORE UI
      const results1 = await processBatch(batch1);
      const fetchedClients = processResult(results1[0], sanitize.clients, setClients, 'clients');
      const fetchedProfessionals = processResult(results1[1], sanitize.professionals, setProfessionals, 'professionals');
      const fetchedAppointments = processResult(results1[2], sanitize.appointments, setAppointments, 'appointments');

      // Post-fetch repair for appointment names (only if batch 1 succeeded)
      if (fetchedAppointments && (fetchedClients || fetchedProfessionals)) {
        const clientMap = new Map((fetchedClients || []).map((c: any) => [c.id, c.name]));
        const proMap = new Map((fetchedProfessionals || []).map((p: any) => [p.id, p.name]));
        
        const repairedAppointments = fetchedAppointments.map((a: any) => {
          let updated = false;
          if (a.clientId && !a.clientName && clientMap.has(a.clientId)) {
            a.clientName = clientMap.get(a.clientId);
            updated = true;
          }
          if (a.professionalId && !a.professionalName && proMap.has(a.professionalId)) {
            a.professionalName = proMap.get(a.professionalId);
            updated = true;
          }
          return a;
        });
        if (repairedAppointments.some((a: any) => a.clientName || a.professionalName)) {
          setAppointments(repairedAppointments);
        }
      }

      // FETCH BATCH 2: Operational Data
      const results2 = await processBatch(batch2);
      processResult(results2[0], sanitize.blockedTimes, setBlockedTimes, 'blocked_times');
      processResult(results2[1], sanitize.managementCategories, setManagementCategories, 'management_categories');
      processResult(results2[2], sanitize.inventory, setInventory, 'inventory');

      // FETCH BATCH 3: Inventory/Loyalty (Less urgent)
      const results3 = await processBatch(batch3);
      processResult(results3[0], sanitize.products, setProducts, 'products');
      processResult(results3[1], sanitize.drinks, setDrinks, 'drinks');
      processResult(results3[2], sanitize.rewards, setRewards, 'rewards');
      processResult(results3[3], sanitize.loyaltyTransactions, setLoyaltyTransactions, 'loyalty_transactions');

      // FETCH BATCH 4: Large Logs
      const results4 = await processBatch(batch4);
      processResult(results4[0], sanitize.transactions, setTransactions, 'transactions');
      processResult(results4[1], sanitize.consentForms, setConsentForms, 'consent_forms');

      // Settings é um caso especial (.single())
      try {
        let settingsData = null;
        if (!user && (isBookingRoute || isConsentRoute || isRescheduleRoute)) {
          const res = await fetch('/api/public/booking-data');
          const proxyData = await res.json();
          settingsData = proxyData.settings;
        } else {
          const result = await withTimeout(supabase.from('settings').select('*').single() as any) as any;
          settingsData = result.data;
        }
        
        if (settingsData) {
           setSettings(prev => {
             const fetched = sanitize.settings(settingsData);
             // Merge back any fields that Supabase ignores only if fetched is missing them
             // and ensure items like services are properly handled
             return { 
               ...fetched, 
               services: fetched.services && fetched.services.length > 0 ? fetched.services : prev.services,
               pixKey: fetched.pixKey || prev.pixKey,
               pixName: fetched.pixName || prev.pixName,
               city: fetched.city || prev.city,
               activityLog: fetched.activityLog !== undefined ? fetched.activityLog : prev.activityLog,
               twoFactor: fetched.twoFactor !== undefined ? fetched.twoFactor : prev.twoFactor
             };
           });
        }
      } catch (e) {
        console.warn('SYNC: Tabela de configurações não encontrada ou vazia.');
      }
      
      console.log('SYNC: Sincronização finalizada.');
    } catch (error) {
      console.error('SYNC FATAL ERROR:', error);
    } finally {
      clearTimeout(globalTimeout);
      setIsSyncing(false);
      isFetchingRef.current = false;
    }
  }, [user, location.pathname, client?.id]); // Depend on user, location.pathname, and client?.id

  // Initial fetch from Supabase
  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  // Handle re-fetching for public routes when path changes
  useEffect(() => {
    const normalizedPath = location.pathname.toLowerCase().replace(/\/+/g, '/');
    const finalPath = normalizedPath.length > 1 && normalizedPath.endsWith('/') ? normalizedPath.slice(0, -1) : normalizedPath;
    
    const isPublicRoute = finalPath.startsWith('/loyalty') || 
                         finalPath.startsWith('/booking') || 
                         finalPath.startsWith('/reschedule') || 
                         finalPath.startsWith('/consent') ||
                         finalPath.startsWith('/portal');
    
    if (!user && isPublicRoute && !authLoading) {
      console.log('SYNC: Public route change detected, re-fetching...');
      fetchData(); // Force fetch
    }
  }, [location.pathname, user, authLoading, fetchData, client?.id]);

  // Real-time Subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to changes in consent_forms
    const consentSubscription = supabase
      .channel('consent_forms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consent_forms' }, (payload) => {
        console.log('SYNC: Consent form change detected:', payload);
        if (payload.eventType === 'INSERT') {
          const newForm = sanitize.consentForms([toCamelCase(payload.new)])[0];
          setConsentForms(prev => {
            if (prev.find(f => f.id === newForm.id)) return prev;
            return [...prev, newForm];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedForm = sanitize.consentForms([toCamelCase(payload.new)])[0];
          setConsentForms(prev => prev.map(f => f.id === updatedForm.id ? updatedForm : f));
        } else if (payload.eventType === 'DELETE') {
          setConsentForms(prev => prev.filter(f => f.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to changes in appointments
    const appointmentSubscription = supabase
      .channel('appointments_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        console.log('SYNC: Appointment change detected:', payload);
        if (payload.eventType === 'INSERT') {
          const newAppt = sanitize.appointments([toCamelCase(payload.new)])[0];
          setAppointments(prev => {
            if (prev.find(a => a.id === newAppt.id)) return prev;
            return [...prev, newAppt];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedAppt = sanitize.appointments([toCamelCase(payload.new)])[0];
          setAppointments(prev => prev.map(a => a.id === updatedAppt.id ? updatedAppt : a));
        } else if (payload.eventType === 'DELETE') {
          setAppointments(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to changes in blocked_times
    const blockedSubscription = supabase
      .channel('blocked_times_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocked_times' }, (payload) => {
        console.log('SYNC: Blocked time change detected:', payload);
        if (payload.eventType === 'INSERT') {
          const newBT = sanitize.blockedTimes([toCamelCase(payload.new)])[0];
          setBlockedTimes(prev => {
            if (prev.find(b => b.id === newBT.id)) return prev;
            return [...prev, newBT];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updatedBT = sanitize.blockedTimes([toCamelCase(payload.new)])[0];
          setBlockedTimes(prev => prev.map(b => b.id === updatedBT.id ? updatedBT : b));
        } else if (payload.eventType === 'DELETE') {
          setBlockedTimes(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to changes in settings
    const settingsSubscription = supabase
      .channel('settings_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
        console.log('SYNC: Settings change detected:', payload);
        if (payload.new && payload.new.id === 'default') {
          const fetched = sanitize.settings(payload.new);
          setSettings(prev => ({
            ...prev,
            ...fetched,
            // Ensure services array is properly merged/handled if missing in update
            services: fetched.services && fetched.services.length > 0 ? fetched.services : prev.services,
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(consentSubscription);
      supabase.removeChannel(appointmentSubscription);
      supabase.removeChannel(blockedSubscription);
      supabase.removeChannel(settingsSubscription);
    };
  }, [user]);

  useEffect(() => {
    try {
      safeSetItem('viking_settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      safeSetItem('viking_dismissed_notifications', JSON.stringify(dismissedNotifications));
    } catch (e) {
      console.error('Failed to save dismissed notifications to localStorage:', e);
    }
  }, [dismissedNotifications]);

  useEffect(() => {
    try {
      safeSetItem('viking_viewed_notifications', JSON.stringify(viewedNotifications));
    } catch (e) {
      console.error('Failed to save viewed notifications to localStorage:', e);
    }
  }, [viewedNotifications]);

  // Seed inventory with requested items if they don't exist
  useEffect(() => {
    const seedRequestedInventory = async () => {
      if (!isSyncing && user && !inventorySeededRef.current) {
        inventorySeededRef.current = true;
        const requestedItems = [
          '3RL', '5RL', '7RL', '9RL', '11RL', '13RL', '15RL', '18RS', '15M1', '25M1', '15MG', '25MG'
        ];
        
        // Use a more robust check for missing items
        const currentInventoryNames = new Set(inventory.map(i => i.name.trim().toUpperCase()));
        const missingItems = requestedItems.filter(name => !currentInventoryNames.has(name.toUpperCase()));

        if (missingItems.length > 0) {
          console.log('SEED: Adding missing requested inventory items (Bulk):', missingItems);
          
          const newItems = missingItems.map(name => ({
            id: generateId(),
            name: name.toUpperCase(),
            category: 'Agulhas',
            stock: 0,
            minStock: 5,
            unit: 'un',
            status: 'Esgotado',
            price: 0,
            user_id: user.id
          }));

          // Optimal: Parallel individual inserts with error handling for better observability
          try {
            setInventory(prev => [...prev, ...newItems]);

            const insertPromises = newItems.map(async (item) => {
            try {
              const { error } = await withTimeout(
                supabase.from('inventory').insert([toSnakeCase(item)]),
                15000 // 15s per item
              );
              if (error) {
                console.error(`SEED ERROR: Item ${item.name} failed:`, error.message);
                throw error;
              }
            } catch (err: any) {
              console.error(`SEED TIMEOUT/FAIL: Item ${item.name}:`, err.message || err);
              throw err;
            }
          });

          const results = await Promise.allSettled(insertPromises);
          const failures = results.filter(r => r.status === 'rejected');
          
          if (failures.length > 0) {
            console.error(`SEED SUMMARY: ${failures.length} items failed to seed into inventory.`);
          } else {
            console.log('SEED SUCCESS: Inventory standardized.');
          }
          } catch (err) {
            console.error('SEED FATAL ERROR: seeding inventory failed:', err);
          }
        }

        // Standardize other items if they exist
        const itemsToStandardize = [
          { name: 'Álcool 70%', unit: 'l' },
          { name: 'Solução Fisiológica', unit: 'l' },
          { name: 'Papel Toalha', unit: 'folhas' },
          { name: 'Papel Hectográfico', unit: 'folhas' },
          { name: 'Tinta Preta', unit: 'ml' },
          { name: 'Transfer Stencil', unit: 'ml' },
          { name: 'Vaselina Sólida', unit: 'g' },
          { name: 'Sabão Degermante', unit: 'ml' },
          { name: 'Antisséptico Povidine', unit: 'ml' },
          { name: 'Plástico Filme PVC', unit: 'm' },
          { name: 'Bandagem Elástica', unit: 'm' }
        ];

        for (const std of itemsToStandardize) {
          const item = inventory.find(i => i.name.toLowerCase() === std.name.toLowerCase());
          if (item && item.unit !== std.unit) {
            console.log(`SEED: Standardizing unit for ${item.name} to ${std.unit}`);
            await updateInventoryItem(item.id, { unit: std.unit });
          }
        }

        // Cleanup redundant items (e.g., "Agulha 07 RL" when "7RL" exists)
        const redundantPatterns = [
          { old: /^Agulha\s+0?(\d+)\s+(RL|RS|M1|RM|MG)$/i, new: '$1$2' },
          { old: /^Agulha\s+(\d+)\s+(RL|RS|M1|RM|MG)$/i, new: '$1$2' }
        ];

        const itemsToDelete: string[] = [];
        const seenNames = new Set<string>();
        
        // Sort inventory to keep items with stock or more data if possible
        const sortedInventory = [...inventory].sort((a, b) => (b.stock || 0) - (a.stock || 0));

        sortedInventory.forEach(item => {
          const normalizedName = item.name.trim().toUpperCase();
          
          // 1. Check for exact duplicates
          if (seenNames.has(normalizedName)) {
            itemsToDelete.push(item.id);
            return;
          }
          
          // 2. Check for pattern-based redundancies
          let isRedundant = false;
          for (const pattern of redundantPatterns) {
            if (pattern.old.test(item.name)) {
              const newName = item.name.replace(pattern.old, pattern.new).toUpperCase();
              if (inventory.some(i => i.name.trim().toUpperCase() === newName)) {
                isRedundant = true;
                break;
              }
            }
          }

          if (isRedundant) {
            itemsToDelete.push(item.id);
          } else {
            seenNames.add(normalizedName);
          }
        });

        if (itemsToDelete.length > 0) {
          console.log('CLEANUP: Removing redundant/duplicate inventory items:', itemsToDelete);
          // Use a single loop to delete to avoid multiple state updates if possible, 
          // though deleteInventoryItem handles state internally.
          for (const id of itemsToDelete) {
            try {
              await deleteInventoryItem(id);
            } catch (err) {
              console.error(`CLEANUP: Failed to delete item ${id}:`, err);
            }
          }
        }
      }
    };

    seedRequestedInventory();
  }, [isSyncing, user, inventory.length]);

  // Seed management categories if empty
  useEffect(() => {
    const seedManagementCategories = async () => {
      if (!isSyncing && user && managementCategories.length === 0 && !categoriesSeededRef.current) {
        categoriesSeededRef.current = true;
        const defaultCats: Omit<ManagementCategory, 'id'>[] = [
          { name: 'Aluguel', type: 'Saída', origin: 'Trabalho' },
          { name: 'Energia', type: 'Saída', origin: 'Trabalho' },
          { name: 'Internet', type: 'Saída', origin: 'Trabalho' },
          { name: 'Marketing', type: 'Saída', origin: 'Trabalho' },
          { name: 'Suprimentos', type: 'Saída', origin: 'Trabalho' },
          { name: 'Serviços', type: 'Entrada', origin: 'Trabalho' },
          { name: 'Venda de Produtos', type: 'Entrada', origin: 'Trabalho' },
          { name: 'Alimentação', type: 'Saída', origin: 'Casa' },
          { name: 'Transporte', type: 'Saída', origin: 'Casa' },
          { name: 'Lazer', type: 'Saída', origin: 'Casa' }
        ];
        
        console.log('SEED: Adding default management categories (Robust)...');
        const categoriesWithUser = defaultCats.map(cat => ({
          ...toSnakeCase(cat),
          id: generateId(),
          user_id: user.id
        }));

        try {
          const insertPromises = categoriesWithUser.map(async (cat) => {
            // Fix types for DB compatibility
            const dbCat = { ...cat };
            if (dbCat.type === 'Entrada') dbCat.type = 'Receita';
            if (dbCat.type === 'Saída') dbCat.type = 'Despesa';

            try {
              const { error } = await withTimeout(
                supabase.from('management_categories').insert([dbCat]),
                10000 // 10s per category
              );
              if (error) {
                console.error(`SEED ERROR: Category ${cat.name} failed:`, error.message);
                throw error;
              }
            } catch (err: any) {
              console.error(`SEED TIMEOUT/FAIL: Category ${cat.name}:`, err.message || err);
              throw err;
            }
          });

          const results = await Promise.allSettled(insertPromises);
          const failures = results.filter(r => r.status === 'rejected');

          if (failures.length > 0) {
            console.error(`SEED SUMMARY: ${failures.length} categories failed to seed.`);
          } else {
            // Update local state - only if at least some succeeded
            const localCats = categoriesWithUser.map(cat => ({
              id: cat.id,
              name: cat.name,
              type: cat.type,
              origin: cat.origin
            } as ManagementCategory));
            setManagementCategories(localCats);
            console.log('SEED SUCCESS: Categories populated.');
          }
        } catch (err: any) {
          console.error('SEED FATAL ERROR: seeding categories failed:', err.message || err);
        }
      }
    };
    seedManagementCategories();
  }, [isSyncing, user, managementCategories.length]);

  const exportData = () => {
    const data: AppData = {
      clients,
      professionals,
      appointments,
      transactions,
      loyaltyTransactions,
      inventory,
      products,
      drinks,
      rewards,
      consentForms,
      blockedTimes,
      settings,
      managementCategories,
      managementRules,
      dismissedNotifications,
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = async (json: string, overwrite: boolean = false) => {
    try {
      const data: AppData = JSON.parse(json);
      
      if (overwrite) {
        await clearAllData();
      }

      const tables = [
        { key: 'clients', table: 'clients', validColumns: ['id', 'name', 'email', 'phone', 'status', 'points', 'total_spent', 'birth_date', 'instagram', 'city', 'medical_notes', 'indicated_by', 'is_minor', 'notes', 'level', 'created_at', 'last_visit', 'cpf', 'user_id'] },
        { key: 'professionals', table: 'professionals', validColumns: ['id', 'name', 'role', 'specialty', 'rating', 'status', 'avatar', 'commission', 'signature', 'created_at', 'user_id'] },
        { key: 'appointments', table: 'appointments', validColumns: ['id', 'client_id', 'client_name', 'professional_id', 'professional_name', 'service', 'date', 'time', 'status', 'value', 'duration', 'created_at', 'approval_status', 'consent_sent', 'consent_signed', 'consent_data', 'total_value', 'deposit_percentage', 'user_id', 'payment_status', 'payment_url', 'payment_link_id', 'paid_value', 'rescheduled_at'] },
        { key: 'transactions', table: 'transactions', validColumns: ['id', 'description', 'value', 'type', 'category', 'date', 'status', 'method', 'appointment_id', 'user_id', 'created_at'] },
        { key: 'loyaltyTransactions', table: 'loyalty_transactions', validColumns: ['id', 'client_id', 'points', 'type', 'description', 'date', 'created_at', 'user_id'] },
        { key: 'inventory', table: 'inventory', validColumns: ['id', 'name', 'category', 'stock', 'min_stock', 'unit', 'status', 'price', 'last_update', 'user_id', 'created_at'] },
        { key: 'products', table: 'products', validColumns: ['id', 'name', 'description', 'price', 'category', 'stock', 'image', 'user_id', 'created_at'] },
        { key: 'drinks', table: 'drinks', validColumns: ['id', 'name', 'description', 'price', 'category', 'stock', 'image', 'user_id', 'created_at'] },
        { key: 'rewards', table: 'rewards', validColumns: ['id', 'title', 'description', 'points_cost', 'active', 'user_id', 'created_at'] },
        { key: 'consentForms', table: 'consent_forms', validColumns: ['id', 'appointment_id', 'client_id', 'type', 'content', 'signed_at', 'answers', 'signature', 'user_id', 'created_at'] },
        { key: 'blockedTimes', table: 'blocked_times', validColumns: ['id', 'professional_id', 'date', 'time', 'duration', 'reason', 'user_id', 'created_at'] },
        { key: 'managementCategories', table: 'management_categories', validColumns: ['id', 'name', 'type', 'origin', 'user_id', 'color', 'icon', 'created_at'] },
        { key: 'managementRules', table: 'management_rules', validColumns: ['id', 'name', 'category_id', 'amount', 'type', 'user_id', 'created_at'] }
      ];

      for (const { key, table, validColumns, mapping } of tables) {
        const items = (data as any)[key];
        if (items && Array.isArray(items) && items.length > 0) {
          // Clean and filter items
          const cleanedItems = items.map(item => {
            const snakeItem = toSnakeCase(item);
            const payload: any = {};
            
            // Apply mappings if any
            if (mapping) {
              Object.entries(mapping).forEach(([oldKey, newKey]) => {
                if (oldKey in snakeItem) {
                  snakeItem[newKey] = snakeItem[oldKey];
                  delete snakeItem[oldKey];
                }
              });
            }

            // Filter columns
            Object.keys(snakeItem).forEach(itemKey => {
              if (validColumns.includes(itemKey)) {
                payload[itemKey] = snakeItem[itemKey];
              }
            });

            // Fix specific missing fields or constraints
            if (table === 'consent_forms' && !payload.type) {
              payload.type = 'Tattoo'; // Default fallback
            }
            if (table === 'blocked_times') {
              if (!payload.professional_name) payload.professional_name = 'Profissional';
              if (!payload.time) payload.time = snakeItem.start_time || '00:00';
              if (!payload.duration) payload.duration = 60;
            }
            if (table === 'management_categories' || table === 'management_rules') {
              // Map to DB values ('Receita'/'Despesa') to satisfy check constraints
              if (payload.type === 'Entrada') payload.type = 'Receita';
              if (payload.type === 'Saída') payload.type = 'Despesa';
              // If it's not one of the allowed types, default to Receita
              if (table === 'management_categories' && !['Receita', 'Despesa', 'Ambos'].includes(payload.type)) {
                payload.type = 'Receita';
              } else if (table === 'management_rules' && !['Receita', 'Despesa'].includes(payload.type)) {
                payload.type = 'Receita';
              }
            }
            
            // Auto-assign user_id if available contextually
            if (!payload.user_id && user?.id) {
              payload.user_id = user.id;
            }

            return payload;
          });

          // Upsert into Supabase
          const { error } = await supabase.from(table).upsert(cleanedItems);
          if (error) {
            console.error(`Error importing ${table}:`, error.message);
          }
        }
      }

      if (data.settings) {
        await supabase.from('settings').upsert(toSnakeCase(data.settings));
      }

      // Refresh local state
      await fetchData();
      
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  };

  const clearAllData = async () => {
    setIsSyncing(true);
    try {
      // Tables to clear
      const tables = [
        'appointments',
        'transactions',
        'loyalty_transactions',
        'consent_forms',
        'blocked_times',
        'clients',
        'professionals',
        'inventory',
        'products',
        'drinks',
        'rewards'
      ];

      // Delete from all tables in Supabase
      // We use .neq('id', '0') as a trick to match all rows (assuming no ID is '0')
      // Or just .filter('id', 'neq', '0')
      for (const table of tables) {
        // Use a filter that is likely to match all rows regardless of ID type
        const { error } = await supabase.from(table).delete().not('id', 'is', null);
        if (error) {
          console.warn(`Error clearing table ${table}:`, error.message);
        }
      }

      // Clear local state
      setClients([]);
      setProfessionals([]);
      setAppointments([]);
      setTransactions([]);
      setInventory([]);
      setProducts([]);
      setDrinks([]);
      setRewards([]);
      setConsentForms([]);
      setBlockedTimes([]);
      setSettings(defaultSettings);

      // Clear localStorage
      const keys = [
        'viking_clients',
        'viking_professionals',
        'viking_appointments',
        'viking_transactions',
        'viking_loyalty_transactions',
        'viking_inventory',
        'viking_products',
        'viking_drinks',
        'viking_rewards',
        'viking_consent_forms',
        'viking_blocked_times',
        'viking_settings'
      ];
      keys.forEach(key => localStorage.removeItem(key));

      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // CRUD Implementations with Supabase sync
  // Base CRUD Helpers (Stabilized with useCallback and ordered by dependency)
  
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    console.log('DataContext: addTransaction called', transaction);
    const tempId = generateId();
    const newTrans = { ...transaction, id: tempId };
    setTransactions(prev => [...prev, newTrans]);
    
    try {
      // Filter payload for Supabase
      const snakeTx = toSnakeCase(newTrans);
      const payload: any = {};
      const validColumns = [
        'id', 'description', 'value', 'type', 'category', 'date', 'status', 'method',
        'appointment_id', 'user_id', 'created_at'
      ];
      
      Object.keys(snakeTx).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeTx[key];
        }
      });

      // Automatically add user_id if available
      if (user?.id && !payload.user_id) {
        payload.user_id = user.id;
      }

      // Map types for DB compatibility
      if (payload.type === 'Entrada') payload.type = 'Receita';
      if (payload.type === 'Saída') payload.type = 'Despesa';

      // Ensure required fields are present
      payload.status = payload.status || 'Pago';
      payload.method = payload.method || 'Dinheiro';
      if (!['Pix', 'Dinheiro', 'Cartão'].includes(payload.method)) {
        payload.method = 'Dinheiro';
      }
      
      if (!payload.date) {
        payload.date = new Date().toISOString().split('T')[0];
      }

      console.log('DataContext: addTransaction payload:', payload);

      const { data, error } = await withTimeout(supabase.from('transactions').insert([payload]).select() as any) as any;
      
      if (error) {
        console.error('Erro ao adicionar transação:', error);
        // Revert local state on error
        setTransactions(prev => prev.filter(t => t.id !== tempId));
        throw error;
      }
      
      // Update local state with the real ID from Supabase
      if (data && data[0]) {
        setTransactions(prev => prev.map(t => t.id === tempId ? { ...t, id: data[0].id } : t));
      }
      console.log('DataContext: addTransaction success');
    } catch (err) {
      console.error('DataContext: addTransaction fatal error:', err);
      setTransactions(prev => prev.filter(t => t.id !== tempId));
      throw err;
    }
  }, []);

  const addLoyaltyTransaction = useCallback(async (transaction: Omit<LoyaltyTransaction, 'id'>) => {
    const newId = generateId();
    const newTrans = { ...transaction, id: newId };
    setLoyaltyTransactions(prev => [...prev, newTrans]);
    
    try {
      const snakeLT = toSnakeCase(newTrans);
      const payload: any = {};
      const validColumns = ['id', 'client_id', 'points', 'type', 'description', 'date', 'user_id', 'created_at'];

      Object.keys(snakeLT).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeLT[key];
        }
      });

      if (user?.id) payload.user_id = user.id;

      const { error } = await supabase.from('loyalty_transactions').insert([payload]);
      if (error) {
        console.error('DB ERROR (loyalty_transactions):', error);
        setLoyaltyTransactions(prev => prev.filter(t => t.id !== newId));
      }
    } catch (err) {
      console.error('DB FATAL ERROR (loyalty_transactions):', err);
    }
  }, []);

  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    const tempId = generateId();
    const newItem = { ...item, id: tempId };
    setInventory(prev => [...prev, newItem]);
    
    const snakeItem = toSnakeCase(newItem);
    const payload: any = {};
    const validColumns = ['id', 'name', 'category', 'stock', 'min_stock', 'unit', 'status', 'price', 'last_update', 'user_id', 'created_at'];

    Object.keys(snakeItem).forEach(key => {
      if (validColumns.includes(key)) {
        payload[key] = snakeItem[key];
      }
    });

    if (user?.id) payload.user_id = user.id;

    const { data, error } = await withTimeout(supabase.from('inventory').insert([payload]).select() as any) as any;
    
    if (error) {
      console.error('Erro ao adicionar item de inventário:', error);
      setInventory(prev => prev.filter(i => i.id !== tempId));
      throw error;
    }
    
    if (data && data[0]) {
      setInventory(prev => prev.map(i => i.id === tempId ? { ...i, id: data[0].id } : i));
    }
  }, []);

  const updateInventoryItem = useCallback(async (id: string, item: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, ...item } : i));
    
    const snakeItem = toSnakeCase(item);
    const payload: any = {};
    const validColumns = ['id', 'name', 'category', 'stock', 'min_stock', 'unit', 'status', 'price', 'last_update', 'user_id'];

    Object.keys(snakeItem).forEach(key => {
      if (validColumns.includes(key)) {
        payload[key] = snakeItem[key];
      }
    });

    const { error } = await supabase.from('inventory').update(payload).eq('id', id);
    if (error) {
      console.error('Erro ao atualizar item de inventário:', error);
      throw error;
    }
  }, []);

  const deleteInventoryItem = useCallback(async (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar item de inventário:', error);
      throw error;
    }
  }, []);

  const deductStockForService = useCallback(async (appointment: Partial<Appointment>) => {
    if (appointment.stockDeducted || (appointment.materialsUsed && appointment.materialsUsed.length > 0)) {
      console.log(`INVENTORY: Stock already deducted or materials already specified for appointment ${appointment.id}, skipping.`);
      return;
    }
    console.log(`INVENTORY: Deducting stock for service: ${appointment.service}`);
    const deductions = getDeductionsForService(appointment);
    const materialsUsed: any[] = [];
    
    for (const deduction of deductions) {
      // Find item by name (partial match)
      const item = inventory.find(i => i.name.toLowerCase().includes(deduction.itemName.toLowerCase()));
      
      if (item) {
        const newStock = calculateNewStock(item, deduction.quantity);
        console.log(`INVENTORY: Updating ${item.name} from ${item.stock} to ${newStock}`);
        
        materialsUsed.push({
          id: Math.random().toString(36).substr(2, 9),
          inventoryItemId: item.id,
          name: item.name,
          quantity: deduction.quantity,
          cost: item.price,
          unit: item.unit
        });

        await updateInventoryItem(item.id, { 
          stock: newStock,
          status: newStock <= 0 ? 'Esgotado' : newStock <= item.minStock ? 'Baixo' : 'Em estoque'
        });
      } else {
        console.warn(`INVENTORY: Item not found for deduction: ${deduction.itemName}`);
      }
    }

    if (appointment.id) {
      // Update local state directly to avoid circular dependency
      setAppointments(prev => prev.map(a => a.id === appointment.id ? { ...a, stockDeducted: true, materialsUsed: materialsUsed } : a));
      
      // Update database directly to avoid circular dependency
      await supabase.from('appointments').update({
        stock_deducted: true,
        materials_used: materialsUsed
      }).eq('id', appointment.id);
    }
  }, [inventory, updateInventoryItem]);

  const updateClient = useCallback(async (id: string, client: Partial<Client>) => {
    console.log('DB: Iniciando atualização de cliente:', id, client);
    
    const oldClient = clients.find(c => c.id === id);
    
    // Update local state first
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...client } : c));
    
    try {
      // Mechanics: if indicatedBy is being set for the first time
      if (client.indicatedBy && (!oldClient?.indicatedBy || oldClient?.indicatedBy === '')) {
        const value = client.indicatedBy.trim();
        const searchUpper = value.toUpperCase();
        const searchPhone = value.replace(/\D/g, '');
        const ignored = ['ninguem', 'ninguém', 'nao', 'não', 'ngm', 'sem indicacao', 'sem indicação'];
        
        if (value.length >= 3 && !ignored.includes(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
          const referrer = clients.find(c => {
            if (value.length >= 6 && c.id.substring(0, 6).toUpperCase() === searchUpper) return true;
            if (c.name.toUpperCase() === searchUpper) return true;
            if (searchPhone.length >= 10 && c.phone.replace(/\D/g, '') === searchPhone) return true;
            return false;
          });

          if (referrer && referrer.id !== id) {
            const pointsEarned = settings.pointsPerReferral || 50;
            // Recursiveness is handled by our check !oldClient?.indicatedBy
            await supabase.from('clients').update({
              points: (referrer.points || 0) + pointsEarned
            }).eq('id', referrer.id);
            
            await addLoyaltyTransaction({
              clientId: referrer.id,
              points: pointsEarned,
              type: 'Ganho',
              description: `Indicação: ${client.name || oldClient?.name}`,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      const snakeClient = toSnakeCase(client);
      const payload: any = {};
      const validColumns = [
        'id', 'name', 'email', 'phone', 'status', 'points', 'total_spent', 
        'birth_date', 'instagram', 'city', 'medical_notes', 'indicated_by', 
        'is_minor', 'cpf', 'notes', 'last_visit', 'level', 'user_id'
      ];
      
      Object.keys(snakeClient).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeClient[key];
        }
      });

      const { error } = await supabase.from('clients').update(payload).eq('id', id);
      
      if (error) {
        console.error('DB ERROR (clients update):', error);
        throw error;
      }
      
      console.log('DB SUCCESS: Cliente atualizado no Supabase');
    } catch (err) {
      console.error('DB FATAL ERROR (updateClient):', err);
      throw err;
    }
  }, [clients, settings, addLoyaltyTransaction]);

  const addClient = async (client: Omit<Client, 'id'>) => {
    const newId = generateId();
    const newClient = { ...client, id: newId };
    
    // Optimistic update
    setClients(prev => [...prev, newClient]);
    
    const snakeClient = toSnakeCase(newClient);
    const payload: any = {};
    const validColumns = [
      'id', 'name', 'email', 'phone', 'status', 'points', 'total_spent', 
      'birth_date', 'instagram', 'city', 'medical_notes', 'indicated_by', 
      'is_minor', 'notes', 'last_visit', 'level', 'created_at', 'cpf', 'user_id'
    ];
    
    Object.keys(snakeClient).forEach(key => {
      if (validColumns.includes(key)) {
        payload[key] = snakeClient[key];
      }
    });

    if (user?.id) payload.user_id = user.id;
    
    console.log('DB: Tentando inserir cliente no Supabase:', payload);
    
    try {
      const { data, error } = await withTimeout(supabase.from('clients').insert([payload]).select() as any) as any;
      
      if (error) {
        console.error('DB ERROR (clients):', error);
        throw new Error(`Erro ao salvar cliente: ${error.message}`);
      }
      
      // Handle Referral Points (if indicatedBy is set at creation)
      if (newClient.indicatedBy && newClient.indicatedBy.trim().length >= 3) {
        const value = newClient.indicatedBy.trim();
        const searchUpper = value.toUpperCase();
        const searchPhone = value.replace(/\D/g, '');
        const ignored = ['ninguem', 'ninguém', 'nao', 'não', 'ngm', 'sem indicacao', 'sem indicação'];
        
        if (!ignored.includes(value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) {
          const referrer = clients.find(c => {
            if (value.length >= 6 && c.id.substring(0, 6).toUpperCase() === searchUpper) return true;
            if (c.name.toUpperCase() === searchUpper) return true;
            if (searchPhone.length >= 10 && c.phone.replace(/\D/g, '') === searchPhone) return true;
            return false;
          });

          if (referrer) {
            const pointsEarned = settings.pointsPerReferral || 50;
            // It runs async and updates referrer points!
            await updateClient(referrer.id, {
              points: (referrer.points || 0) + pointsEarned
            });
            await addLoyaltyTransaction({
              clientId: referrer.id,
              points: pointsEarned,
              type: 'Ganho',
              description: `Indicação: ${newClient.name}`,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      // Check if this new client was referred by existing clients who didn't get points yet
      // Update logic to be robust in checking if existing clients were indicated by newClient
      const newSearchUpper = newClient.name.toUpperCase();
      const newSearchPhone = newClient.phone ? newClient.phone.replace(/\D/g, '') : '';
      const newSearchCode = newClient.id.substring(0, 6).toUpperCase();

      const referredClients = clients.filter(c => {
        if (!c.indicatedBy || c.indicatedBy.trim().length < 3) return false;
        const val = c.indicatedBy.trim().toUpperCase();
        const phoneVal = c.indicatedBy.replace(/\D/g, '');
        
        if (val.length >= 6 && val === newSearchCode) return true;
        if (val === newSearchUpper) return true;
        if (phoneVal.length >= 10 && newSearchPhone && phoneVal === newSearchPhone) return true;
        return false;
      });

      if (referredClients.length > 0) {
        const pointsEarned = (settings.pointsPerReferral || 50) * referredClients.length;
        
        // Update the new client's points directly in the database since they were just added
        const { error: updateError } = await supabase.from('clients').update({
          points: (newClient.points || 0) + pointsEarned
        }).eq('id', newId);

        if (!updateError) {
          // Update local state
          setClients(prev => prev.map(c => c.id === newId ? { ...c, points: (c.points || 0) + pointsEarned } : c));
          
          // Add loyalty transaction for each referral
          for (const referred of referredClients) {
            await addLoyaltyTransaction({
              clientId: newId,
              points: settings.pointsPerReferral || 50,
              type: 'Ganho',
              description: `Indicação retroativa: ${referred.name}`,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      console.log('DB SUCCESS: Cliente salvo no Supabase:', data);
      return newClient.id;
    } catch (err: any) {
      console.error('DB FATAL ERROR (clients):', err);
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    await supabase.from('clients').delete().eq('id', id);
  };

  const addProfessional = async (professional: Omit<Professional, 'id'>) => {
    const newId = generateId();
    const newProf = { ...professional, id: newId };
    
    // Optimistic update
    setProfessionals(prev => [...prev, newProf]);
    
    const snakeProf = toSnakeCase(newProf);
    const payload: any = {};
    const validColumns = ['id', 'name', 'role', 'specialty', 'rating', 'status', 'avatar', 'commission', 'signature', 'pix_key', 'pix_name', 'city', 'infinity_pay_tag', 'created_at', 'user_id'];
    
    Object.keys(snakeProf).forEach(key => {
      if (validColumns.includes(key)) {
        payload[key] = snakeProf[key];
      }
    });

    if (user?.id) payload.user_id = user.id;

    console.log('DB: Tentando inserir profissional no Supabase:', payload);
    
    try {
      const { data, error } = await withTimeout(supabase.from('professionals').insert([payload]).select() as any) as any;
      
      if (error) {
        console.error('DB ERROR (professionals):', error);
        setProfessionals(prev => prev.filter(p => p.id !== newId));
        throw new Error(`Erro ao salvar profissional: ${error.message}`);
      }
      
      console.log('DB SUCCESS: Profissional salvo no Supabase:', data);
      return newId;
    } catch (err: any) {
      console.error('DB FATAL ERROR (professionals):', err);
      setProfessionals(prev => prev.filter(p => p.id !== newId));
      throw err;
    }
  };
  const updateProfessional = async (id: string, professional: Partial<Professional>) => {
    console.log('DB: Iniciando atualização de profissional:', id, professional);
    setProfessionals(prev => prev.map(p => p.id === id ? { ...p, ...professional } : p));
    
    try {
      const snakeUpdate = toSnakeCase(professional);
      const payload: any = {};
      const validColumns = ['id', 'name', 'role', 'specialty', 'rating', 'status', 'avatar', 'commission', 'signature', 'pix_key', 'pix_name', 'city', 'infinite_pay_tag', 'created_at', 'user_id'];
      
      Object.keys(snakeUpdate).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeUpdate[key];
        }
      });

      const { error } = await supabase.from('professionals').update(payload).eq('id', id);
      if (error) {
        console.error('DB ERROR (professionals update):', error);
        throw error;
      }
      console.log('DB SUCCESS: Profissional atualizado no Supabase');
    } catch (err) {
      console.error('DB FATAL ERROR (updateProfessional):', err);
      throw err;
    }
  };
  const deleteProfessional = async (id: string) => {
    console.log('DB: Deletando profissional:', id);
    setProfessionals(prev => prev.filter(p => p.id !== id));
    try {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) {
        console.error('DB ERROR (professionals delete):', error);
        throw error;
      }
      console.log('DB SUCCESS: Profissional deletado do Supabase');
    } catch (err) {
      console.error('DB FATAL ERROR (deleteProfessional):', err);
      throw err;
    }
  };

  const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id'> & { id?: string }) => {
    const newId = appointment.id || generateId();
    const today = new Date().toISOString().split('T')[0];
    const newAppt = { 
      ...appointment, 
      id: newId,
      date: appointment.date || today
    } as Appointment;
    
    // Optimistic update
    setAppointments(prev => [...prev, newAppt]);
    
    const snakeAppt = toSnakeCase(newAppt);
    const payload: any = { id: newId };
    const validColumns = [
      'id', 'client_id', 'clientid', 'cliente_id', 'client_name', 'clientname',
      'professional_id', 'professionalid', 'profissional_id', 'professional_name', 'professionalname',
      'service', 'servico', 'date', 'data', 'time', 'hora', 'status', 'value', 'valor', 'duration', 'created_at', 
      'approval_status', 'consent_sent', 'consent_signed', 'consent_data', 
      'total_value', 'totalvalue', 'valor_total', 'deposit_percentage', 'depositpercentage', 'porcentagem_sinal', 
      'user_id', 'payment_status', 'payment_url', 'payment_link_id', 'paid_value', 'rescheduled_at'
    ];

    Object.keys(snakeAppt).forEach(key => {
      if (validColumns.includes(key)) {
        payload[key] = snakeAppt[key];
      }
    });

    // Ensure mapping to the column we KNOW exists or is preferred
    if (payload.client_id) {
      delete payload.clientid;
      delete payload.cliente_id;
    }
    if (payload.professional_id) {
      delete payload.professionalid;
      delete payload.profissional_id;
    }
    if (payload.total_value) {
      delete payload.totalvalue;
      delete payload.valor_total;
    }
    if (payload.deposit_percentage) {
      // Prefer the one that currently causes the error if missing, 
      // but we will tell user to run SQL.
    }
    
    // Automatically add user_id if available
    if (user?.id && !payload.user_id) {
      payload.user_id = user.id;
    }
    
    console.log('DB: Tentando inserir agendamento no Supabase com mapeamento extra:', payload);
    
    try {
      const { data, error } = await withTimeout(supabase.from('appointments').insert([payload]).select() as any) as any;
      
      if (error) {
        console.error('DB ERROR (appointments):', error);
        setAppointments(prev => prev.filter(a => a.id !== newAppt.id));
        
        // Detailed error for debugging
        const errInfo = {
          error: error.message,
          operationType: 'create',
          path: 'appointments',
          authInfo: {
            userId: user?.id,
            email: user?.email
          }
        };
        throw new Error(JSON.stringify(errInfo));
      }
      
      console.log('DB SUCCESS: Agendamento salvo no Supabase:', data);

      // Trigger WhatsApp notification
      try {
        const client = clients.find(c => c.id === newAppt.clientId);
        if (client && client.phone) {
          fetch('/api/whatsapp/notify-creation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: client.phone,
              clientName: newAppt.clientName,
              service: newAppt.service,
              professionalName: newAppt.professionalName,
              date: newAppt.date,
              time: newAppt.time
            })
          }).catch(err => console.error('Error sending WhatsApp notification:', err));
        }
      } catch (waErr) {
        console.error('Failed to trigger WhatsApp notification:', waErr);
      }

      const value = newAppt.totalValue || newAppt.value || 0;
      if (newAppt.status === 'Finalizado' || newAppt.paymentStatus === 'Pago') {
        if (value > 0) {
          await addTransaction({
            type: 'Receita',
            category: 'Serviços',
            description: `Pagamento: ${newAppt.service}`,
            value: value,
            date: newAppt.date,
            method: 'Pix',
            status: 'Pago',
            appointmentId: newAppt.id
          });

          // Add points
          if (newAppt.clientId && settings.loyaltyActive !== false) {
            const client = clients.find(c => c.id === newAppt.clientId);
            if (client) {
              const pointsEarned = Math.floor(value * (settings.pointsPerReal || 0.5));
              console.log(`LOYALTY: Adding ${pointsEarned} points to client ${client.name} (Value: ${value}, Multiplier: ${settings.pointsPerReal || 0.5})`);
              if (pointsEarned > 0) {
                await updateClient(newAppt.clientId, {
                  totalSpent: (client.totalSpent || 0) + value,
                  points: (client.points || 0) + pointsEarned,
                  lastVisit: newAppt.date
                });
                await addLoyaltyTransaction({
                  clientId: newAppt.clientId,
                  points: pointsEarned,
                  type: 'Ganho',
                  description: `Agendamento: ${newAppt.service}`,
                  date: newAppt.date
                });

                // Mark as processed for repair tool
                let processed: string[] = [];
                try {
                  processed = JSON.parse(localStorage.getItem('viking_loyalty_processed_appts') || '[]');
                } catch (e) {
                  console.warn('Failed to read viking_loyalty_processed_appts from localStorage', e);
                }
                if (!processed.includes(newAppt.id)) {
                  processed.push(newAppt.id);
                  safeSetItem('viking_loyalty_processed_appts', JSON.stringify(processed));
                }
              }
            } else {
              console.warn(`LOYALTY: Client not found for points addition: ${newAppt.clientId}`);
            }
          } else if (settings.loyaltyActive === false) {
            console.log('LOYALTY: Loyalty system is disabled in settings.');
          }
        }

        // Deduct stock
        await deductStockForService(newAppt);
      }

      return newId;
    } catch (err: any) {
      console.error('DB FATAL ERROR (appointments):', err);
      throw err;
    }
  }, [clients, settings.loyaltyActive, settings.pointsPerReal, addTransaction, updateClient, addLoyaltyTransaction, deductStockForService]);
  const updateAppointment = useCallback(async (id: string, appointment: Partial<Appointment>) => {
    console.log('DB: Iniciando atualização de agendamento:', id, appointment);
    
    // Store old state for rollback
    const oldAppointments = [...appointments];
    
    try {
      const snakeUpdate = toSnakeCase(appointment);
      const payload: any = {};
      const validColumns = [
        'id', 'client_id', 'clientid', 'cliente_id', 'client_name', 'clientname',
        'professional_id', 'professionalid', 'profissional_id', 'professional_name', 'professionalname',
        'service', 'servico', 'date', 'data', 'time', 'hora', 'status', 'value', 'valor', 'duration', 'created_at', 
        'approval_status', 'consent_sent', 'consent_signed', 'consent_data', 'payment_status', 'payment_link_id',
        'total_value', 'totalvalue', 'valor_total', 'deposit_percentage', 'depositpercentage', 'porcentagem_sinal', 
        'user_id', 'payment_url', 'paid_value', 'rescheduled_at'
      ];

      Object.keys(snakeUpdate).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeUpdate[key];
        }
      });

      // Ensure mapping to preferred columns and avoid multiples
      if (payload.client_id) {
        delete payload.clientid;
        delete payload.cliente_id;
      }
      if (payload.professional_id) {
        delete payload.professionalid;
        delete payload.profissional_id;
      }
      if (payload.total_value) {
        delete payload.totalvalue;
        delete payload.valor_total;
      }
      if (payload.deposit_percentage) {
        // delete payload.deposit_percentage; // Keep the one the app uses
      }

      // Automatically add user_id if available
      if (user?.id && !payload.user_id) {
        payload.user_id = user.id;
      }
      if (appointment.approvalStatus) {
        payload.approval_status = appointment.approvalStatus;
      }
      if (appointment.consentData) {
        payload.consent_data = appointment.consentData;
      }
      
      console.log('DB: Payload convertido para snake_case com mapeamento extra:', payload);
      
      const { data, error } = await supabase
        .from('appointments')
        .update(payload)
        .eq('id', id)
        .select();

      if (error) {
        console.error('DB ERROR (appointments update):', error);
        
        // Detailed error for debugging
        const errInfo = {
          error: error.message,
          operationType: 'update',
          path: `appointments/${id}`,
          authInfo: {
            userId: user?.id,
            email: user?.email
          }
        };
        throw new Error(JSON.stringify(errInfo));
      }
      
      if (!data || data.length === 0) {
        console.error('DB ERROR (appointments update): No rows updated. Possible RLS issue or invalid ID.', { id, payload });
        throw new Error('Não foi possível atualizar o agendamento. Verifique suas permissões ou tente novamente mais tarde.');
      }

      // Update local state AFTER successful DB update
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...appointment } : a));
      
      // Handle points and transactions if status changed to Finalizado or Pago
      const oldAppt = appointments.find(a => a.id === id);
      if (oldAppt) {
        const isNowFinishedOrPaid = 
          (appointment.status === 'Finalizado' || appointment.paymentStatus === 'Pago') || 
          (oldAppt.status === 'Finalizado' || oldAppt.paymentStatus === 'Pago');
          
        const wasFinishedOrPaid = oldAppt.status === 'Finalizado' || oldAppt.paymentStatus === 'Pago';

        if (isNowFinishedOrPaid && !wasFinishedOrPaid) {
          const totalValue = appointment.totalValue ?? oldAppt.totalValue ?? appointment.value ?? oldAppt.value ?? 0;
          const clientId = appointment.clientId || oldAppt.clientId;
          const service = appointment.service || oldAppt.service;
          const date = appointment.date || oldAppt.date;

          // Calculate how much was already paid
          const paidValue = transactions
            .filter(t => t.appointmentId === id && t.status === 'Pago')
            .reduce((sum, t) => sum + t.value, 0);
            
          const remainingValue = Math.max(0, totalValue - paidValue);

          // Add transaction for the REMAINING value if it's > 0
          if (remainingValue > 0) {
            console.log(`AUTO-TX: Adding remaining balance transaction for appointment ${id}: R$ ${remainingValue}`);
            await addTransaction({
              type: 'Receita',
              category: 'Serviços',
              description: `Saldo: ${service}`,
              value: remainingValue,
              date: date,
              method: 'Pix', // Default method
              status: 'Pago',
              appointmentId: id
            });
          }

          // Add points
          if (clientId && settings.loyaltyActive !== false) {
            const client = clients.find(c => c.id === clientId);
            if (client) {
              const pointsEarned = Math.floor(totalValue * (settings.pointsPerReal || 0.5));
              console.log(`LOYALTY: Adding ${pointsEarned} points to client ${client.name} (Value: ${totalValue}, Multiplier: ${settings.pointsPerReal || 0.5})`);
              if (pointsEarned > 0) {
                await updateClient(clientId, {
                  totalSpent: (client.totalSpent || 0) + totalValue,
                  points: (client.points || 0) + pointsEarned,
                  lastVisit: date
                });
                await addLoyaltyTransaction({
                  clientId: clientId,
                  points: pointsEarned,
                  type: 'Ganho',
                  description: `Agendamento: ${service}`,
                  date: date
                });

                // Mark as processed for repair tool
                let processed: string[] = [];
                try {
                  processed = JSON.parse(localStorage.getItem('viking_loyalty_processed_appts') || '[]');
                } catch (e) {
                  console.warn('Failed to read viking_loyalty_processed_appts from localStorage', e);
                }
                if (!processed.includes(id)) {
                  processed.push(id);
                  safeSetItem('viking_loyalty_processed_appts', JSON.stringify(processed));
                }
              }
            } else {
              console.warn(`LOYALTY: Client not found for points addition: ${clientId}`);
            }
          } else if (settings.loyaltyActive === false) {
            console.log('LOYALTY: Loyalty system is disabled in settings.');
          }

          // Deduct stock
          await deductStockForService({ ...oldAppt, ...appointment } as Appointment);
        }
      }

      console.log('DB SUCCESS: Agendamento atualizado no Supabase');
    } catch (err) {
      console.error('DB FATAL ERROR (updateAppointment):', err);
      throw err;
    }
  }, [appointments, clients, settings.loyaltyActive, settings.pointsPerReal, transactions, addTransaction, updateClient, addLoyaltyTransaction, deductStockForService]);
  const deleteAppointment = async (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    await supabase.from('appointments').delete().eq('id', id);
    
    // Remove all linked transactions
    const linkedTransactions = transactions.filter(t => t.appointmentId === id);
    for (const tx of linkedTransactions) {
      await deleteTransaction(tx.id);
    }
  };

  const addBlockedTime = async (blockedTime: Omit<BlockedTime, 'id'>) => {
    const newId = generateId();
    const newBT = { ...blockedTime, id: newId };
    
    // Prepare for DB
    const dbBT: any = { ...newBT };
    let finalReason = dbBT.reason || '';
    
    // Clear any existing tags just in case (though unlikely for new blocks)
    finalReason = finalReason.replace(/\[REC:(none|daily|weekly|monthly)\]/g, '').trim();
    finalReason = finalReason.replace(/\[EXC:[^\]]*\]/g, '').trim();

    if (dbBT.recurrence && dbBT.recurrence !== 'none') {
      finalReason = `${finalReason} [REC:${dbBT.recurrence}]`.trim();
    }
    
    newBT.reason = finalReason;
    setBlockedTimes(prev => [...prev, newBT]);
    
    const payload = {
      id: newId,
      professional_id: newBT.professionalId === 'all' ? 'all' : newBT.professionalId,
      professional_name: newBT.professionalName,
      date: newBT.date,
      time: newBT.time,
      duration: newBT.duration,
      reason: finalReason || null
    };
    
    const { data, error } = await supabase.from('blocked_times').insert([payload]).select();
    if (error) {
      console.error('Error adding blocked time:', error);
    } else if (data && data[0]) {
      const realId = data[0].id;
      setBlockedTimes(prev => prev.map(bt => bt.id === newId ? { ...bt, id: String(realId) } : bt));
    }
  };

  const updateBlockedTime = async (id: string, blockedTime: Partial<BlockedTime>) => {
    setBlockedTimes(prev => prev.map(bt => bt.id === id ? { ...bt, ...blockedTime } : bt));
    
    // Prepare for DB
    const existingBT = blockedTimes.find(bt => bt.id === id);
    const dbBT: any = { ...blockedTime };
    
    if (dbBT.recurrence !== undefined || dbBT.reason !== undefined || existingBT?.exceptions) {
      const finalRecurrence = dbBT.recurrence !== undefined ? dbBT.recurrence : existingBT?.recurrence;
      let finalReason = dbBT.reason !== undefined ? dbBT.reason : existingBT?.reason || '';
      const finalExceptions = existingBT?.exceptions || [];
      
      // Clear all tags first to avoid duplication
      finalReason = finalReason.replace(/\[REC:(none|daily|weekly|monthly)\]/g, '').trim();
      finalReason = finalReason.replace(/\[EXC:[^\]]*\]/g, '').trim();
      
      if (finalRecurrence && finalRecurrence !== 'none') {
        finalReason = `${finalReason} [REC:${finalRecurrence}]`.trim();
      }
      
      if (finalExceptions.length > 0) {
        finalReason = `${finalReason} [EXC:${finalExceptions.join(',')}]`.trim();
      }

      dbBT.reason = finalReason;
    }
    
    const payload: any = {};
    if (blockedTime.professionalId !== undefined) payload.professional_id = blockedTime.professionalId === 'all' ? 'all' : blockedTime.professionalId;
    if (blockedTime.professionalName !== undefined) payload.professional_name = blockedTime.professionalName;
    if (blockedTime.date !== undefined) payload.date = blockedTime.date;
    if (blockedTime.time !== undefined) payload.time = blockedTime.time;
    if (blockedTime.duration !== undefined) payload.duration = blockedTime.duration;
    if (dbBT.reason !== undefined) payload.reason = dbBT.reason;
    
    await supabase.from('blocked_times').update(payload).eq('id', id);
  };

  const deleteBlockedTime = async (id: string, dateToRemove?: string) => {
    console.log('DataContext: deleteBlockedTime called', id, dateToRemove);
    if (dateToRemove) {
      const bt = blockedTimes.find(b => b.id === id);
      if (bt && bt.recurrence !== 'none') {
        const newExceptions = [...new Set([...(bt.exceptions || []), dateToRemove])];
        
        let finalReason = bt.reason || '';
        // Clear all tags first to avoid duplication/mess
        finalReason = finalReason.replace(/\[REC:(none|daily|weekly|monthly)\]/g, '').trim();
        finalReason = finalReason.replace(/\[EXC:[^\]]*\]/g, '').trim();

        // Re-add recurrence tag
        finalReason = `${finalReason} [REC:${bt.recurrence}]`.trim();
        // Add exceptions tag
        finalReason = `${finalReason} [EXC:${newExceptions.join(',')}]`.trim();
        
        setBlockedTimes(prev => prev.map(b => b.id === id ? { ...b, exceptions: newExceptions, reason: finalReason } : b));
        
        console.log('DataContext: Updating blocked time with exception', { id, finalReason });
        await supabase.from('blocked_times').update({ reason: finalReason }).eq('id', id);
        return;
      }
    }

    setBlockedTimes(prev => prev.filter(bt => bt.id !== id));
    const { error } = await supabase.from('blocked_times').delete().eq('id', id);
    if (error) {
      console.error('Error deleting blocked time:', error);
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    console.log('DataContext: updateTransaction called', id, transaction);
    setTransactions(prev => prev.map(t => String(t.id) === String(id) ? { ...t, ...transaction } : t));
    
    try {
      const snakeTx = toSnakeCase(transaction);
      const payload: any = {};
      const validColumns = [
        'description', 'value', 'type', 'category', 'date', 'status', 'method',
        'appointment_id', 'appointmentid', 'agendamento_id', 'agendamentoid'
      ];
      
      Object.keys(snakeTx).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeTx[key];
        }
      });

      // Map types for DB compatibility
      if (payload.type === 'Entrada') payload.type = 'Receita';
      if (payload.type === 'Saída') payload.type = 'Despesa';

      // Ensure method is valid for DB
      if (payload.method && !['Pix', 'Dinheiro', 'Cartão'].includes(payload.method)) {
        payload.method = 'Dinheiro';
      }
      
      const { error } = await supabase.from('transactions').update(payload).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar transação:', error);
        throw error;
      }
      console.log('DataContext: updateTransaction success');
    } catch (err) {
      console.error('DataContext: updateTransaction fatal error:', err);
      throw err;
    }
  };
  const deleteTransaction = async (id: string) => {
    console.log('DataContext: deleteTransaction called', id);
    setTransactions(prev => prev.filter(t => String(t.id) !== String(id)));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      console.error('Erro ao deletar transação:', error);
      throw error;
    }
    console.log('DataContext: deleteTransaction success');
  };

  const estornarTransaction = async (id: string) => {
    try {
      const tx = transactions.find(t => t.id === id);
      if (!tx) throw new Error('Transação não encontrada');
      
      const newId = generateId();
      const reversalDb = {
        id: newId,
        user_id: user.id,
        description: `Estorno: ${tx.description}`,
        value: tx.value,
        type: (tx.type === 'Entrada' || tx.type === 'Receita') ? 'Despesa' : 'Receita',
        category: tx.category,
        date: format(new Date(), 'yyyy-MM-dd'),
        method: tx.method,
        status: 'Pago',
        origin: tx.origin,
        is_recurring: false
      };

      const { data, error } = await supabase.from('transactions').insert(reversalDb).select();
      if (error) throw error;

      if (data && data[0]) {
        const parsed = (data as any[]).map(t => ({
          id: String(t.id || ''),
          type: (['Receita', 'Despesa', 'Entrada', 'Saída'].includes(t.type) ? (t.type === 'Receita' ? 'Entrada' : (t.type === 'Despesa' ? 'Saída' : t.type)) : 'Entrada') as any,
          category: String(t.category || 'Geral'),
          description: String(t.description || ''),
          value: Number(t.value || 0),
          date: String(t.date || ''),
          method: (['Pix', 'Dinheiro', 'Cartão', 'Outro'].includes(t.method) ? t.method : 'Dinheiro') as any,
          status: (['Pago', 'Pendente'].includes(t.status) ? t.status : 'Pago') as any,
          appointmentId: String(t.appointment_id || ''),
          createdAt: String(t.created_at || ''),
          origin: (t.origin || 'Trabalho') as any,
          isRecurring: Boolean(t.is_recurring),
          recurrenceType: (t.recurrence_type || 'Mensal') as any
        }));
        setTransactions(prev => [parsed[0], ...prev]);
        return parsed[0].id;
      }
    } catch (error) {
      console.error('Erro ao estornar:', error);
      throw error;
    }
  };

  const deleteTransactionsBatch = async (ids: string[]) => {
    console.log('DataContext: deleteTransactionsBatch called', ids.length);
    setTransactions(prev => prev.filter(t => !ids.includes(String(t.id))));
    
    // Split into chunks of 50 to avoid URL length limits in Supabase
    const chunkSize = 50;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { error } = await supabase.from('transactions').delete().in('id', chunk);
      if (error) {
        console.error('Erro ao deletar transações em lote:', error);
        throw error;
      }
    }
    console.log('DataContext: deleteTransactionsBatch success');
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const tempId = generateId();
    const newProd = { ...product, id: tempId };
    setProducts(prev => [...prev, newProd]);
    
    const payload = toSnakeCase(newProd);
    const { data, error } = await withTimeout(supabase.from('products').insert([payload]).select() as any) as any;
    
    if (error) {
      console.error('Erro ao adicionar produto:', error);
      setProducts(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
    
    if (data && data[0]) {
      setProducts(prev => prev.map(p => p.id === tempId ? { ...p, id: data[0].id } : p));
    }
  };
  const updateProduct = async (id: string, product: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
    await supabase.from('products').update(toSnakeCase(product)).eq('id', id);
  };
  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const addDrink = async (drink: Omit<Drink, 'id'>) => {
    const tempId = generateId();
    const newDrink = { ...drink, id: tempId };
    setDrinks(prev => [...prev, newDrink]);
    
    const payload = toSnakeCase(newDrink);
    const { data, error } = await withTimeout(supabase.from('drinks').insert([payload]).select() as any) as any;
    
    if (error) {
      console.error('Erro ao adicionar bebida:', error);
      setDrinks(prev => prev.filter(d => d.id !== tempId));
      throw error;
    }
    
    if (data && data[0]) {
      setDrinks(prev => prev.map(d => d.id === tempId ? { ...d, id: data[0].id } : d));
    }
  };
  const updateDrink = async (id: string, drink: Partial<Drink>) => {
    setDrinks(prev => prev.map(d => d.id === id ? { ...d, ...drink } : d));
    await supabase.from('drinks').update(toSnakeCase(drink)).eq('id', id);
  };
  const deleteDrink = async (id: string) => {
    setDrinks(prev => prev.filter(d => d.id !== id));
    await supabase.from('drinks').delete().eq('id', id);
  };

  const addReward = async (reward: Omit<Reward, 'id'>) => {
    const tempId = generateId();
    const newReward = { ...reward, id: tempId };
    setRewards(prev => [...prev, newReward]);
    
    const payload = toSnakeCase(newReward);
    const { data, error } = await withTimeout(supabase.from('rewards').insert([payload]).select() as any) as any;
    
    if (error) {
      console.error('Erro ao adicionar recompensa:', error);
      setRewards(prev => prev.filter(r => r.id !== tempId));
      throw error;
    }
    
    if (data && data[0]) {
      setRewards(prev => prev.map(r => r.id === tempId ? { ...r, id: data[0].id } : r));
    }
  };
  const updateReward = async (id: string, reward: Partial<Reward>) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...reward } : r));
    await supabase.from('rewards').update(toSnakeCase(reward)).eq('id', id);
  };
  const deleteReward = async (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id));
    await supabase.from('rewards').delete().eq('id', id);
  };

  // Persistence effects
  useEffect(() => {
    safeSetItem('viking_loyalty_transactions', JSON.stringify(loyaltyTransactions));
  }, [loyaltyTransactions]);

  useEffect(() => {
    safeSetItem('viking_rewards', JSON.stringify(rewards));
  }, [rewards]);

  useEffect(() => {
    safeSetItem('viking_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    safeSetItem('viking_blocked_times', JSON.stringify(blockedTimes));
  }, [blockedTimes]);

  useEffect(() => {
    safeSetItem('viking_management_categories', JSON.stringify(managementCategories));
  }, [managementCategories]);

  useEffect(() => {
    safeSetItem('viking_management_rules', JSON.stringify(managementRules));
  }, [managementRules]);

  // Recurring transactions logic
  useEffect(() => {
    const processRecurring = async () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      
      // We only process if we have transactions and it's been a while since last check
      let lastCheck: string | null = null;
      try {
        lastCheck = localStorage.getItem('viking_last_recurring_check');
      } catch (e) {
        console.warn('Failed to read viking_last_recurring_check from localStorage', e);
      }
      if (lastCheck === todayStr) return;

      // Extract recurring transactions from the unified transactions list
      const recurringTxs = transactions.filter(t => {
        return t.description.match(/\[REC:(Mensal|Semanal|Personalizado)\]/i);
      }).map(t => {
        const recMatch = t.description.match(/\[REC:(Mensal|Semanal|Personalizado)\]/i);
        const originMatch = t.description.match(/^\[(CAIXA|GESTAO|CASA|TRABALHO)\]/i);
        
        return {
          ...t,
          isRecurring: true,
          recurrenceType: recMatch ? recMatch[1] : 'Mensal',
          origin: originMatch ? originMatch[1] : 'Trabalho',
          cleanDescription: t.description
            .replace(/^\[(CAIXA|GESTAO|CASA|TRABALHO)\]\s*/i, '')
            .replace(/\[REC:(Mensal|Semanal|Personalizado)\]\s*/i, '')
            .trim()
        };
      });

      let createdCount = 0;

      for (const tx of recurringTxs) {
        const txDate = parseISO(tx.date);
        let nextDate = new Date(txDate);
        
        if (tx.recurrenceType === 'Mensal') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (tx.recurrenceType === 'Semanal') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else {
          continue; // Skip personalized for now or implement logic
        }
        
        const nextDateStr = format(nextDate, 'yyyy-MM-dd');
        
        if (nextDateStr <= todayStr) {
          const exists = transactions.some(t => 
            t.description === tx.description && 
            t.date === nextDateStr && 
            t.value === tx.value
          );
          
          if (!exists) {
            await addManagementTransaction({
              description: tx.cleanDescription,
              value: tx.value,
              type: tx.type === 'Receita' ? 'Entrada' : 'Saída',
              category: tx.category,
              date: nextDateStr,
              origin: tx.origin as any,
              method: tx.method as any,
              isRecurring: true,
              recurrenceType: tx.recurrenceType as any,
              syncWithMain: true
            });
            createdCount++;
          }
        }
      }

      if (createdCount > 0) {
        console.log(`RECURRING: ${createdCount} novas transações geradas.`);
      }
      safeSetItem('viking_last_recurring_check', todayStr);
    };
    
    if (transactions.length > 0 && user) {
      processRecurring();
    }
  }, [transactions, user]);


  const recalculateClientPoints = async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    console.log(`LOYALTY: Recalculando pontos para ${client.name}...`);
    
    // A única fonte da verdade para pontos são as LoyaltyTransactions
    const clientTransactions = loyaltyTransactions.filter(t => t.clientId === clientId);
    
    const totalEarned = clientTransactions
      .filter(t => t.type === 'Ganho')
      .reduce((acc, t) => acc + t.points, 0);
      
    const totalRedeemed = clientTransactions
      .filter(t => t.type === 'Resgate')
      .reduce((acc, t) => acc + t.points, 0);

    const finalPoints = Math.max(0, totalEarned - totalRedeemed);
    
    // TotalSpent é o único que continua vindo dos agendamentos
    const clientAppts = appointments.filter(a => 
      a.clientId === clientId && (a.status === 'Finalizado' || a.paymentStatus === 'Pago')
    );
    const totalSpent = clientAppts.reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);

    console.log(`LOYALTY: Resultado - Ganhos: ${totalEarned}, Resgatados: ${totalRedeemed}, Final: ${finalPoints}, Gasto Total: R$ ${totalSpent}`);

    await updateClient(clientId, {
      points: finalPoints,
      totalSpent: totalSpent
    });

    return finalPoints;
  };

  const repairLoyaltyPoints = async () => {
    console.log('LOYALTY: Iniciando reparo de pontos...');
    let repairedCount = 0;
    
    // Usamos o localStorage para evitar duplicar o que já foi processado por esta ferramenta
    let processedAppts: string[] = [];
    try {
      processedAppts = JSON.parse(localStorage.getItem('viking_loyalty_processed_appts') || '[]');
    } catch (e) {
      console.warn('Failed to read viking_loyalty_processed_appts from localStorage', e);
    }
    
    // Filtramos agendamentos finalizados ou pagos
    const finishedAppts = appointments.filter(a => a.status === 'Finalizado' || a.paymentStatus === 'Pago');
    
    for (const appt of finishedAppts) {
      if (processedAppts.includes(appt.id)) continue;

      // Verificamos se já existe uma transação para este agendamento no histórico local
      const hasTransaction = loyaltyTransactions.some(t => 
        t.clientId === appt.clientId && 
        t.description.includes(appt.service) && 
        t.date.split('T')[0] === appt.date
      );
      
      if (!hasTransaction && appt.clientId) {
        const client = clients.find(c => c.id === appt.clientId);
        if (client) {
          const value = appt.totalValue || appt.value || 0;
          const pointsEarned = Math.floor(value * (settings.pointsPerReal || 0.5));
          
          if (pointsEarned > 0) {
            console.log(`LOYALTY REPAIR: Premiando ${pointsEarned} pontos para ${client.name} pelo serviço ${appt.service}`);
            
            await updateClient(client.id, {
              points: (client.points || 0) + pointsEarned,
              totalSpent: (client.totalSpent || 0) + value
            });
            
            await addLoyaltyTransaction({
              clientId: client.id,
              points: pointsEarned,
              type: 'Ganho',
              description: `Reparo: ${appt.service}`,
              date: appt.date
            });
            
            processedAppts.push(appt.id);
            repairedCount++;
          }
        }
      } else if (hasTransaction) {
        // Se já tem transação, marcamos como processado para não checar de novo
        if (!processedAppts.includes(appt.id)) {
          processedAppts.push(appt.id);
        }
      }
    }
    
    safeSetItem('viking_loyalty_processed_appts', JSON.stringify(processedAppts));
    console.log(`LOYALTY REPAIR: Finalizado. ${repairedCount} agendamentos reparados.`);
    return repairedCount;
  };

  const cleanupLoyaltyDuplicates = async () => {
    console.log('LOYALTY: Iniciando limpeza de duplicatas...');
    
    const uniqueTransactions: LoyaltyTransaction[] = [];
    const seen = new Set<string>();
    let removedCount = 0;

    for (const t of loyaltyTransactions) {
      const key = `${t.clientId}-${t.points}-${t.type}-${t.description}-${t.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTransactions.push(t);
      } else {
        removedCount++;
        // Delete true duplicate from Supabase
        await supabase.from('loyalty_transactions').delete().eq('id', t.id).then(({error}) => {
          if (error) console.error(error);
        });
      }
    }

    if (removedCount > 0) {
      setLoyaltyTransactions(uniqueTransactions);
    }

    console.log(`LOYALTY CLEANUP: ${removedCount} duplicatas removidas no banco de dados.`);
    return { removedCount, clientsUpdated: 0 }; // Client states can be fixed by recalculateAllClients
  };

  const recalculateAllClients = async () => {
    console.log('LOYALTY: Calculando pontos brutos de todos os clientes a partir de todo o histórico...');
    let count = 0;
    
    for (const c of clients) {
      const clientTransactions = loyaltyTransactions.filter(t => t.clientId === c.id);
      
      const totalEarned = clientTransactions
        .filter(t => t.type === 'Ganho')
        .reduce((acc, t) => acc + t.points, 0);
        
      const totalRedeemed = clientTransactions
        .filter(t => t.type === 'Resgate')
        .reduce((acc, t) => acc + t.points, 0);

      const finalPoints = Math.max(0, totalEarned - totalRedeemed);
      
      // Calculate total spent based on appts
      const clientAppts = appointments.filter(a => 
        a.clientId === c.id && (a.status === 'Finalizado' || a.paymentStatus === 'Pago')
      );
      const totalSpent = clientAppts.reduce((acc, a) => acc + (a.totalValue || a.value || 0), 0);

      if (c.points !== finalPoints || c.totalSpent !== totalSpent) {
        count++;
        // Direct push to supabase (stealth update) so we don't trigger huge cascades of updateClient locally
        await supabase.from('clients').update({ points: finalPoints, total_spent: totalSpent }).eq('id', c.id);
      }
    }
    
    console.log(`Recalculado ${clients.length} clientes. Foram atualizados (alterados): ${count}`);
    window.location.reload(); // Refresh the pure state for security since this is a deep admin wipe
    return count;
  };

  const updateLoyaltyTransaction = async (id: string, transaction: Partial<LoyaltyTransaction>) => {
    setLoyaltyTransactions(prev => prev.map(lt => lt.id === id ? { ...lt, ...transaction } : lt));
    await supabase.from('loyalty_transactions').update(toSnakeCase(transaction)).eq('id', id);
  };

  const deleteLoyaltyTransaction = async (id: string) => {
    setLoyaltyTransactions(prev => prev.filter(lt => lt.id !== id));
    await supabase.from('loyalty_transactions').delete().eq('id', id);
  };

  const addTransactionWithReturn = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
    const tempId = generateId();
    const newTrans = { ...transaction, id: tempId };
    setTransactions(prev => [newTrans, ...prev]);
    
    const payload = toSnakeCase(newTrans);
    const { data, error } = await withTimeout(supabase.from('transactions').insert([payload]).select() as any) as any;
    
    if (error) {
      console.error('Erro ao adicionar transação:', error);
      setTransactions(prev => prev.filter(t => t.id !== tempId));
      throw error;
    }
    
    if (data && data[0]) {
      setTransactions(prev => prev.map(t => t.id === tempId ? { ...t, id: data[0].id } : t));
      return data[0].id;
    }
    return tempId;
  };

  const addManagementTransaction = async (transaction: Omit<ManagementTransaction, 'id' | 'createdAt'>) => {
    const newId = generateId();
    const now = new Date().toISOString();
    
    // Encode metadata in description for DB persistence since columns might not exist
    let descriptionWithMetadata = `[${transaction.origin.toUpperCase()}] `;
    if (transaction.isRecurring) {
      descriptionWithMetadata += `[REC:${transaction.recurrenceType || 'Mensal'}] `;
    }
    descriptionWithMetadata += transaction.description;

    const unifiedTx: Transaction = {
      ...transaction,
      id: newId,
      description: descriptionWithMetadata,
      status: 'Pago',
      createdAt: now,
      syncWithMain: true
    };

    // Optimistic update
    setTransactions(prev => [...prev, unifiedTx]);

    console.log('DEBUG: Unificando lançamento na tabela transactions:', unifiedTx);
    
    try {
      // Filter payload for Supabase
      const snakeTx = toSnakeCase(unifiedTx);
      const payload: any = {};
      const validColumns = [
        'id', 'description', 'value', 'type', 'category', 'date', 'status', 'method',
        'appointment_id', 'user_id', 'created_at'
      ];
      
      Object.keys(snakeTx).forEach(key => {
        if (validColumns.includes(key)) {
          payload[key] = snakeTx[key];
        }
      });

      // Automatically add user_id if available
      if (user?.id && !payload.user_id) {
        payload.user_id = user.id;
      }

      // Map types for DB compatibility
      if (payload.type === 'Entrada') payload.type = 'Receita';
      if (payload.type === 'Saída') payload.type = 'Despesa';

      // Ensure required fields are present
      payload.status = payload.status || 'Pago';
      payload.method = payload.method || 'Dinheiro';
      if (!['Pix', 'Dinheiro', 'Cartão'].includes(payload.method)) {
        payload.method = 'Dinheiro';
      }

      if (!payload.date) {
        payload.date = new Date().toISOString().split('T')[0];
      }

      console.log('DataContext: addManagementTransaction payload:', payload);

      const { data, error } = await withTimeout(supabase.from('transactions').insert([payload]).select() as any) as any;
      
      if (error) {
        console.error('DB ERROR (unified addManagementTransaction):', error);
        throw error;
      }
      
      if (data && data[0]) {
        // Update local state with real ID
        setTransactions(prev => prev.map(t => t.id === newId ? { ...t, id: data[0].id } : t));
      }
      
      return data?.[0]?.id || newId;
    } catch (err) {
      console.error('DB FATAL ERROR (addManagementTransaction):', err);
      // Revert local state
      setTransactions(prev => prev.filter(t => t.id !== newId));
      throw err;
    }
  };

  const updateManagementTransaction = async (id: string, updates: Partial<ManagementTransaction>) => {
    await updateTransaction(id, updates);
  };

  const deleteManagementTransaction = async (id: string) => {
    await deleteTransaction(id);
  };

  const addManagementCategory = async (category: Omit<ManagementCategory, 'id'>) => {
    const newId = generateId();
    const newCat = { ...category, id: newId };
    setManagementCategories(prev => [...prev, newCat]);
    
    // Map to DB values
    const dbPayload = toSnakeCase(newCat);
    if (dbPayload.type === 'Entrada') dbPayload.type = 'Receita';
    if (dbPayload.type === 'Saída') dbPayload.type = 'Despesa';
    
    await supabase.from('management_categories').insert(dbPayload);
    return newId;
  };

  const updateManagementCategory = async (id: string, category: Partial<ManagementCategory>) => {
    setManagementCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));
    
    const dbPayload = toSnakeCase(category);
    if (dbPayload.type === 'Entrada') dbPayload.type = 'Receita';
    if (dbPayload.type === 'Saída') dbPayload.type = 'Despesa';
    
    await supabase.from('management_categories').update(dbPayload).eq('id', id);
  };

  const deleteManagementCategory = async (id: string) => {
    setManagementCategories(prev => prev.filter(c => c.id !== id));
    await supabase.from('management_categories').delete().eq('id', id);
  };

  const addManagementRule = async (rule: Omit<ManagementRule, 'id'>) => {
    const newId = generateId();
    const newRule = { ...rule, id: newId };
    setManagementRules(prev => [...prev, newRule]);
    
    if (user) {
      const dbPayload = toSnakeCase(newRule);
      if (dbPayload.type === 'Entrada') dbPayload.type = 'Receita';
      if (dbPayload.type === 'Saída') dbPayload.type = 'Despesa';
      
      const { error } = await supabase.from('management_rules').insert([dbPayload]);
      if (error) console.error('Error adding management rule:', error.message);
    }
    return newId;
  };

  const applyRetroactiveStockDeduction = async () => {
    console.log('INVENTORY: Starting retroactive stock deduction...');
    const targetDate = '2026-04-01';
    const finishedWithoutDeduction = appointments.filter(a => 
      a.status === 'Finalizado' && 
      a.date >= targetDate
    );
    
    if (finishedWithoutDeduction.length === 0) {
      console.log('INVENTORY: No appointments need retroactive deduction.');
      return;
    }

    console.log(`INVENTORY: Found ${finishedWithoutDeduction.length} appointments for retroactive deduction.`);
    
    for (const appt of finishedWithoutDeduction) {
      await deductStockForService(appt);
    }
    
    console.log('INVENTORY: Retroactive deduction completed.');
  };

  const addConsentForm = async (consentForm: Omit<ConsentForm, 'id'>) => {
    const newId = generateId();
    const newConsentForm = { ...consentForm, id: newId };
    
    setConsentForms(prev => [...prev, newConsentForm]);
    
    const snakeConsent = toSnakeCase(newConsentForm);
    
    // Move potentially missing columns to answers to avoid schema errors
    const missingColumns = [
      'professional_signature',
      'guardian_birth_date',
      'client_cpf',
      'client_birth_date'
    ];

    const answers = typeof snakeConsent.answers === 'string' 
      ? JSON.parse(snakeConsent.answers) 
      : (snakeConsent.answers || {});

    let hasChanges = false;
    missingColumns.forEach(col => {
      if (col in snakeConsent) {
        if (snakeConsent[col] !== undefined && snakeConsent[col] !== null) {
          answers[col] = snakeConsent[col];
          hasChanges = true;
        }
        delete snakeConsent[col];
      }
    });

    if (hasChanges || typeof snakeConsent.answers === 'object') {
      snakeConsent.answers = JSON.stringify(answers);
    }
    
    const { data, error } = await supabase.from('consent_forms').insert([snakeConsent]).select();
    if (error) {
      console.error('Erro ao salvar termo:', error);
      throw error;
    }

    // Update appointment status
    try {
      console.log('DataContext: Updating appointment with consent status...', consentForm.appointmentId);
      
      // Omit large base64 photos from appointment's consentData to prevent payload too large errors
      const { guardianPhoto, guardianFacePhoto, minorPhoto, ...consentDataWithoutPhotos } = newConsentForm;
      
      await updateAppointment(consentForm.appointmentId, {
        consentSigned: true,
        consentData: consentDataWithoutPhotos
      });
      console.log('DataContext: Appointment updated successfully');
    } catch (err) {
      console.error('DataContext: Error updating appointment with consent status:', err);
    }

    return newId;
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('viking_settings', JSON.stringify(updated));
      return updated;
    });

    const payload: any = {};
    const mapping: Record<string, string> = {
      infinitePayTag: 'infinite_pay_tag',
      studioName: 'studioname',
      defaultCommission: 'defaultcommission',
      customCommission: 'customcommission',
      professionalRanking: 'professionalranking',
      loyaltyActive: 'loyaltyactive',
      pointsPerReal: 'pointsperreal',
      pointValue: 'pointvalue',
      pointsPerReferral: 'pointsperreferral',
      pointsPerBirthday: 'pointsperbirthday',
      defaultDuration: 'defaultduration',
      appointmentInterval: 'appointmentinterval',
      allowOverbooking: 'allowoverbooking',
      lowStockAlert: 'lowstockalert',
      allowNegativeStock: 'allownegativestock',
      sellWithoutClient: 'sellwithoutclient',
      allowCourtesy: 'allowcourtesy',
      courtesyLimit: 'courtesylimit',
      openingHours: 'openinghours',
      mapsLink: 'mapslink',
      pixKey: 'pix_key',
      pixName: 'pix_name',
      activityLog: 'activity_log',
      twoFactor: 'two_factor',
      services: 'services'
    };

    // Only include columns that exist in the DB schema to prevent total failure
    const validColumns = [
      'studioname', 'phone', 'instagram', 'address', 'mapslink', 'openinghours', 
      'defaultcommission', 'customcommission', 'professionalranking', 'paymentmethods', 
      'loyaltyactive', 'pointsperreal', 'pointvalue', 'pointsperreferral', 
      'pointsperbirthday', 'defaultduration', 'appointmentinterval', 
      'allowoverbooking', 'lowstockalert', 'allownegativestock', 
      'sellwithoutclient', 'allowcourtesy', 'courtesylimit', 'services', 
      'pix_key', 'pix_name', 'city', 'infinite_pay_tag', 'activity_log', 'two_factor'
    ];

    Object.keys(newSettings).forEach(key => {
      const dbKey = mapping[key] || toSnakeCase(key);
      if (validColumns.includes(dbKey)) {
        payload[dbKey] = (newSettings as any)[key];
      } else {
        console.warn(`DB: Column ${dbKey} (mapped from ${key}) not found in settings table. Skipping.`);
      }
    });

    if (Object.keys(payload).length > 0) {
      console.log('DB: Salvando configurações no Supabase:', payload);
      try {
        const { error } = await supabase.from('settings').update(payload).eq('id', 'default');
        if (error) {
          console.error('DB ERROR: Erro ao salvar configurações:', error);
        } else {
          console.log('DB SUCCESS: Configurações salvas com sucesso.');
        }
      } catch (err) {
        console.error('DB FATAL ERROR: Falha ao salvar configurações:', err);
      }
    }
  };

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const markAsViewed = (ids: string[]) => {
    setViewedNotifications(prev => {
      const newIds = ids.filter(id => !prev.includes(id));
      if (newIds.length > 0) {
        return [...prev, ...newIds];
      }
      return prev;
    });
  };

  const processSale = async (items: { id: string, name: string, price: number, quantity: number, type: 'drink' | 'product' }[], paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão', clientId?: string) => {
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const date = new Date().toISOString().split('T')[0];

    // 1. Update Stock
    for (const item of items) {
      if (item.type === 'drink') {
        const drink = drinks.find(d => d.id === item.id);
        if (drink) {
          await updateDrink(item.id, { stock: Math.max(0, drink.stock - item.quantity) });
        }
      } else {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await updateProduct(item.id, { stock: Math.max(0, product.stock - item.quantity) });
        }
      }
    }

    // 2. Create Transaction
    const description = items.map(i => `${i.quantity}x ${i.name}`).join(', ');
    await addTransaction({
      type: 'Receita',
      category: items[0].type === 'drink' ? 'Bar' : 'Loja',
      description: `Venda: ${description}`,
      value: totalValue,
      date,
      method: paymentMethod,
      status: 'Pago'
    });

    // 3. Update Client & Loyalty
    if (clientId && settings.loyaltyActive !== false) {
      const client = clients.find(c => c.id === clientId);
      if (client) {
        const multiplier = settings.pointsPerReal || 0.5;
        const pointsEarned = Math.floor(totalValue * multiplier);
        console.log(`LOYALTY: Sale points for ${client.name}: ${pointsEarned} (Value: ${totalValue}, Multiplier: ${multiplier})`);
        
        await updateClient(clientId, {
          totalSpent: (client.totalSpent || 0) + totalValue,
          points: (client.points || 0) + pointsEarned,
          lastVisit: date
        });

        if (pointsEarned > 0) {
          await addLoyaltyTransaction({
            clientId,
            points: pointsEarned,
            type: 'Ganho',
            description: `Venda: ${description}`,
            date
          });
        }
      }
    }
  };

  return (
    <DataContext.Provider value={{
      clients, setClients, addClient, updateClient, deleteClient,
      professionals, setProfessionals, addProfessional, updateProfessional, deleteProfessional,
      appointments, setAppointments, addAppointment, updateAppointment, deleteAppointment,
      transactions, setTransactions, addTransaction, updateTransaction, deleteTransaction, deleteTransactionsBatch, estornarTransaction,
      loyaltyTransactions, setLoyaltyTransactions, addLoyaltyTransaction, updateLoyaltyTransaction, deleteLoyaltyTransaction,
      repairLoyaltyPoints,
      recalculateClientPoints,
      recalculateAllClients,
      cleanupLoyaltyDuplicates,
      addManagementTransaction,
      updateManagementTransaction,
      deleteManagementTransaction,
      managementCategories, setManagementCategories, addManagementCategory, updateManagementCategory, deleteManagementCategory,
      managementRules, addManagementRule,
      deductStockForService,
      inventory, setInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
      products, setProducts, addProduct, updateProduct, deleteProduct,
      drinks, setDrinks, addDrink, updateDrink, deleteDrink,
      rewards, setRewards, addReward, updateReward, deleteReward,
      consentForms, setConsentForms, addConsentForm,
      blockedTimes, setBlockedTimes, addBlockedTime, updateBlockedTime, deleteBlockedTime,
      settings, setSettings, updateSettings,
      processSale,
      applyRetroactiveStockDeduction,
      isSyncing,
      dismissedNotifications,
      dismissNotification,
      viewedNotifications,
      markAsViewed,
      refreshData: fetchData,
      exportData, importData, clearAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
