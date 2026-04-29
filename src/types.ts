export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inadimplente' | 'Inativo';
  points: number;
  lastVisit?: string;
  totalSpent: number;
  level: 'Bronze' | 'Prata' | 'Ouro' | 'Viking';
  birthDate?: string;
  cpf?: string;
  instagram?: string;
  city?: string;
  medicalNotes?: string;
  indicatedBy?: string;
  isMinor?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface LoyaltyTransaction {
  id: string;
  clientId: string;
  points: number;
  type: 'Ganho' | 'Resgate';
  description: string;
  date: string;
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  rating: number;
  reviewCount?: number;
  status: 'Disponível' | 'Em Atendimento' | 'Ausente';
  avatar?: string;
  imageUrl?: string;
  commission: number;
  signature?: string; // base64
  workingHours?: Record<string, any>;
  services?: string[];
  // Requisitos bancários individuais para recebimento (PIX)
  pixKey?: string;
  pixName?: string;
  city?: string;
  infinitePayTag?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  professionalId: string;
  professionalName: string;
  service: string;
  date: string;
  time: string;
  rescheduledAt?: string;
  status: 'Confirmado' | 'Pendente' | 'Finalizado' | 'Cancelado' | 'Falta';
  approvalStatus?: 'Pendente' | 'Aprovado' | 'Reprovado' | 'Aguardando Pagamento';
  paymentStatus?: 'Pendente' | 'Pago' | 'Falhado';
  paymentLinkId?: string;
  paymentUrl?: string;
  totalValue?: number;
  depositPercentage?: number;
  value: number;
  paidValue?: number;
  duration?: number;
  consentSent?: boolean;
  consentSigned?: boolean;
  consentData?: {
    type: 'Tattoo' | 'Piercing';
    signedAt: string;
    signature: string; // base64
    professionalSignature?: string; // base64
    guardianName?: string;
    guardianDoc?: string;
    guardianPhoto?: string; // base64 (document)
    guardianFacePhoto?: string; // base64 (selfie)
    minorPhoto?: string; // base64
    answers: Record<string, any>;
  };
  stockDeducted?: boolean;
  materialsUsed?: {
    id: string;
    inventoryItemId?: string;
    name: string;
    quantity: number;
    cost: number;
  }[];
}

export interface Transaction {
  id: string;
  description: string;
  value: number;
  type: 'Receita' | 'Despesa' | 'Entrada' | 'Saída';
  category: string;
  date: string;
  status?: 'Pago' | 'Pendente';
  method: 'Pix' | 'Dinheiro' | 'Cartão' | 'Outro';
  appointmentId?: string;
  // Management fields
  origin?: 'Casa' | 'Trabalho';
  isRecurring?: boolean;
  recurrenceType?: 'Mensal' | 'Semanal' | 'Personalizado';
  syncWithMain?: boolean;
  mainTransactionId?: string;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  status: 'Em estoque' | 'Baixo' | 'Esgotado';
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  image?: string;
}

export interface Drink {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  icon?: string;
}

export interface Reward {
  id: string;
  title: string;
  points: number;
  description: string;
  icon: string;
}

export interface ConsentForm {
  id: string;
  appointmentId: string;
  clientId: string;
  type: 'Tattoo' | 'Piercing';
  signedAt: string;
  signature: string;
  professionalSignature?: string;
  clientCpf?: string;
  clientBirthDate?: string;
  guardianName?: string;
  guardianDoc?: string;
  guardianBirthDate?: string;
  guardianPhoto?: string;
  guardianFacePhoto?: string;
  minorPhoto?: string;
  answers: Record<string, any>;
}

export interface AppSettings {
  studioName: string;
  phone: string;
  instagram: string;
  address: string;
  mapsLink: string;
  openingHours: string;
  defaultCommission: number;
  customCommission: boolean;
  professionalRanking: boolean;
  paymentMethods: {
    pix: boolean;
    dinheiro: boolean;
    debito: boolean;
    credito: boolean;
  };
  loyaltyActive: boolean;
  pointsPerReal: number;
  pointValue: number;
  pointsPerReferral: number;
  pointsPerBirthday: number;
  defaultDuration: number;
  appointmentInterval: number;
  allowOverbooking: boolean;
  lowStockAlert: boolean;
  allowNegativeStock: boolean;
  sellWithoutClient: boolean;
  allowCourtesy: boolean;
  courtesyLimit: number;
  allowDeposit: boolean;
  depositPercentage: number;
  twoFactor: boolean;
  activityLog: boolean;
  pixKey?: string;
  pixName?: string;
  city?: string;
  mpAccessToken?: string;
  mpPublicKey?: string;
  infinitePayTag?: string;
  services?: {
    id: string;
    name: string;
    price: number | string;
    duration: number;
    category: 'Tattoo' | 'Piercing' | 'Outros';
    image?: string;
    description?: string;
  }[];
}

export interface BlockedTime {
  id: string;
  professionalId: string;
  professionalName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  reason?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  exceptions?: string[];
}

// ManagementTransaction is now a specialized version of Transaction
export type ManagementTransaction = Transaction & {
  origin: 'Casa' | 'Trabalho';
  type: 'Entrada' | 'Saída';
};

export interface ManagementCategory {
  id: string;
  name: string;
  type: 'Entrada' | 'Saída' | 'Ambos';
  origin: 'Casa' | 'Trabalho' | 'Geral';
}

export interface ManagementRule {
  id: string;
  keyword: string;
  category: string;
  origin: 'Casa' | 'Trabalho';
  type: 'Entrada' | 'Saída';
}

export interface AppData {
  clients: Client[];
  professionals: Professional[];
  appointments: Appointment[];
  transactions: Transaction[];
  loyaltyTransactions: LoyaltyTransaction[];
  inventory: InventoryItem[];
  products: Product[];
  drinks: Drink[];
  rewards: Reward[];
  consentForms: ConsentForm[];
  blockedTimes: BlockedTime[];
  managementCategories: ManagementCategory[];
  managementRules: ManagementRule[];
  settings: AppSettings;
  dismissedNotifications?: string[];
}
