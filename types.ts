
export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export enum Priority {
  High = 'Alta',
  Medium = 'Média',
  Low = 'Baixa',
  None = 'Nenhuma',
}

export interface Task {
  id: string;
  text: string;
  categoryId: string;
  completed: boolean;
  dueDate?: string; // Format: YYYY-MM-DD
  isHabit: boolean;
  checklist: Subtask[];
  completedAt?: string;
  priority?: Priority;
  googleCalendarEventId?: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string; // Tailwind bg color class
}

export interface MajorGoal {
  id: string;
  text: string;
}

export interface WeeklyGoal {
  id: string;
  text: string;
  completed: boolean;
  majorGoalId?: string | null;
}

export enum View {
  Today = 'Hoje',
  Routine = 'Rotina Diária',
  WeeklyGoals = 'Metas Semanais',
  Category = 'Categoria',
  History = 'Histórico',
  Finance = 'Farol Finance',
  Settings = 'Configurações',
  Recurring = 'Recorrências',
}

export enum PurchaseItemUnit {
    Kilogram = 'kg',
    Gram = 'g',
    Liter = 'L',
    Milliliter = 'ml',
    Unit = 'un',
}

export interface PurchaseItem {
    id: string;
    name: string;
    brand?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    unit: PurchaseItemUnit;
    weight?: number; // e.g., 1.2 for 1.2kg
}

export interface Purchase {
    id: string;
    storeName: string;
    date: string;
    totalAmount: number;
    items: PurchaseItem[];
    transactionIds: string[];
}


export interface PendingPurchase {
  id: string; // a temporary ID for this confirmation request
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  bankAccountName?: string;
  profileName?: string;
  storeName?: string;
  items?: Omit<PurchaseItem, 'id'>[];
  installments?: { total: number };
}

export interface PendingInvestment {
  id: string;
  amount: number;
  fundName: string;
  date?: string;
  profileName?: string;
}

// Tipos para o Farol Finance
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    imageUrl?: string;
    groundingChunks?: { title: string; uri: string }[];
    pendingPurchase?: PendingPurchase;
    pendingInvestment?: PendingInvestment;
}

export enum PaymentMethod {
    CreditCard = 'Cartão de Crédito',
    DebitCard = 'Cartão de Débito',
    PIX = 'PIX',
    Cash = 'Dinheiro',
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    date: string; // YYYY-MM-DD
    profileId: string;
    category?: string;
    paymentMethod?: PaymentMethod;
    bankAccountId?: string;
    purchaseId?: string;
    installments?: { current: number; total: number };
    recurringExpenseId?: string;
}

export interface RecurringExpense {
    id: string;
    description: string;
    amount: number;
    category: string;
    profileId: string;
    frequency: 'monthly' | 'yearly';
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    dayOfMonth: number; // 1-31
}


export interface Profile {
    id: string;
    name: string;
    type: 'CPF' | 'CNPJ';
}

export interface BankAccount {
    id: string;
    name: string; // Ex: NuBank, Itaú
    type: 'Conta Corrente' | 'Poupança' | 'Cartão de Crédito';
    accountNumber?: string;
    bankNumber?: string;
    profileId: string;
    creditLimit?: number;
    creditUsed?: number;
}

export interface SpendingGoal {
    id: string;
    category: string;
    limit: number;
    profileId: string;
}

export enum InvestmentType {
    CDB = 'CDB',
    RendaFixa = 'Renda Fixa',
    Acoes = 'Ações',
    Cripto = 'Criptomoedas',
}

export interface InvestmentFund {
    id: string;
    name: string;
    type: InvestmentType;
    yieldRate?: number; // Annual percentage
    description?: string;
}

export interface Investment {
    id: string;
    fundId: string;
    amount: number;
    date: string; // YYYY-MM-DD
    profileId: string;
}

export enum GoalPeriod {
    Weekly = 'Semanal',
    Monthly = 'Mensal',
    Quarterly = 'Trimestral',
    Semiannual = 'Semestral',
    Annual = 'Anual',
}

export interface EarningGoal {
  id: string;
  description: string;
  targetAmount: number;
  period: GoalPeriod;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  profileId: string;
}


// Tipos para Configurações de Conta
export interface Address {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface SocialLinks {
    instagram: string;
    facebook: string;
    website: string;
}

export interface AccountInfo {
    fullName: string;
    email: string;
    phone: string;
    address: Address;
    cpf: string;
    profession: string;
    lifeSummary: string;
    socialLinks: SocialLinks;
    profilePicture?: string; // Data URL for the image
}