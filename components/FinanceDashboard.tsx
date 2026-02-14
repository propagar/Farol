import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Transaction, BankAccount, Purchase, PurchaseItemUnit, SpendingGoal, Investment, InvestmentFund, InvestmentType, RecurringExpense, Category, EarningGoal, GoalPeriod } from '../types';
import { UsersIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon, ScaleIcon, TrashIcon, ClipboardListIcon, CreditCardIcon, PencilIcon, ShoppingBagIcon, ChevronDownIcon, ChartPieIcon, BanknotesIcon, ChartBarIcon, LayoutDashboardIcon, RepeatIcon, AcademicCapIcon } from './Icons';
import BankAccountDetailsModal from './BankAccountDetailsModal';
import DoughnutChart from './charts/DoughnutChart';
import BarChart from './charts/BarChart';

interface FinanceDashboardProps {
    profiles: Profile[];
    transactions: Transaction[];
    bankAccounts: BankAccount[];
    purchases: Purchase[];
    spendingGoals: SpendingGoal[];
    earningGoals: EarningGoal[];
    investments: Investment[];
    investmentFunds: InvestmentFund[];
    recurringExpenses: RecurringExpense[];
    categories: Category[];
    onAddProfile: (name: string, type: 'CPF' | 'CNPJ') => void;
    onDeleteProfile: (profileId: string) => void;
    onAddBankAccount: (account: Omit<BankAccount, 'id'>) => void;
    onUpdateBankAccount: (account: BankAccount) => void;
    onDeleteBankAccount: (accountId: string) => void;
    onInvest: (amount: number, fundId: string, profileId: string) => void;
    onAddInvestmentFund: (fund: Omit<InvestmentFund, 'id'>) => void;
    onAddRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => void;
    onUpdateRecurringExpense: (expense: RecurringExpense) => void;
    onDeleteRecurringExpense: (expenseId: string) => void;
    onAddCategory: (name: string, color: string) => void;
    onAddSpendingGoal: (category: string, limit: number, profileId: string) => void;
    onDeleteSpendingGoal: (goalId: string) => void;
    onAddEarningGoal: (description: string, targetAmount: number, period: GoalPeriod, profileId: string) => void;
    onLinkFinancialGoalToTasks: (earningGoalDescription: string) => void;
}

type FinanceView = 'dashboard' | 'profiles' | 'cashflow' | 'purchases' | 'investments' | 'recurring';
type DateFilter = 'this_month' | 'last_month' | 'last_30_days' | 'last_trimester' | 'last_semester' | 'last_year' | 'custom';

type NewAccountData = { name: string; type: 'Conta Corrente' | 'Poupança' | 'Cartão de Crédito' };
type NewSpendingGoalData = { category: string; limit: string };
type NewEarningGoalData = { description: string; targetAmount: string; period: GoalPeriod };

const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Sub-componente para isolar o estado dos formulários e da edição
const ProfileAccordionItem: React.FC<{
    profile: Profile;
    isActive: boolean;
    onToggle: () => void;
    onDeleteProfile: (profileId: string) => void;
    profilesCount: number;
    profileBankAccounts: BankAccount[];
    profileSpendingGoals: SpendingGoal[];
    profileEarningGoals: EarningGoal[];
    transactions: Transaction[];
    onAddBankAccount: (account: Omit<BankAccount, 'id'>) => void;
    onUpdateBankAccount: (account: BankAccount) => void;
    onDeleteBankAccount: (accountId: string) => void;
    setSelectedAccount: (account: BankAccount | null) => void;
    onAddEarningGoal: (description: string, targetAmount: number, period: GoalPeriod, profileId: string) => void;
    onLinkFinancialGoalToTasks: (earningGoalDescription: string) => void;
    onAddSpendingGoal: (category: string, limit: number, profileId: string) => void;
    onDeleteSpendingGoal: (goalId: string) => void;
}> = ({
    profile, isActive, onToggle, onDeleteProfile, profilesCount,
    profileBankAccounts, profileSpendingGoals, profileEarningGoals, transactions,
    onAddBankAccount, onUpdateBankAccount, onDeleteBankAccount, setSelectedAccount,
    onAddEarningGoal, onLinkFinancialGoalToTasks, onAddSpendingGoal, onDeleteSpendingGoal
}) => {
    const [newAccountData, setNewAccountData] = useState<NewAccountData>({ name: '', type: 'Conta Corrente' });
    const [newEarningGoalData, setNewEarningGoalData] = useState<NewEarningGoalData>({ description: '', targetAmount: '', period: GoalPeriod.Monthly });
    const [newSpendingGoalData, setNewSpendingGoalData] = useState<NewSpendingGoalData>({ category: '', limit: '' });
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

    const handleAddAccountSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAccountData.name.trim()) {
            onAddBankAccount({ name: newAccountData.name, type: newAccountData.type, profileId: profile.id });
            setNewAccountData({ name: '', type: 'Conta Corrente' });
        }
    };

    const handleAddEarningGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEarningGoalData.description.trim() && newEarningGoalData.targetAmount) {
            onAddEarningGoal(newEarningGoalData.description, parseFloat(newEarningGoalData.targetAmount), newEarningGoalData.period, profile.id);
            setNewEarningGoalData({ description: '', targetAmount: '', period: GoalPeriod.Monthly });
        }
    };

    const handleAddSpendingGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSpendingGoalData.category.trim() && newSpendingGoalData.limit) {
            onAddSpendingGoal(newSpendingGoalData.category, parseFloat(newSpendingGoalData.limit), profile.id);
            setNewSpendingGoalData({ category: '', limit: '' });
        }
    };

    const handleUpdateAccount = () => {
        if (editingAccount) {
            onUpdateBankAccount(editingAccount);
            setEditingAccount(null);
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
            <div onClick={onToggle} className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{profile.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{profile.type}</p>
                </div>
                <div className="flex items-center gap-4">
                        {profilesCount > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors" aria-label={`Excluir perfil ${profile.name}`}>
                            <TrashIcon />
                        </button>
                    )}
                    <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isActive ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isActive && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-8">
                    {/* CONTAS */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><CreditCardIcon /> Contas</h3>
                            <div className="space-y-3 mb-6">
                            {profileBankAccounts.map(account => (
                                <div key={account.id} onClick={() => !editingAccount && setSelectedAccount(account)} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:shadow-md transition-shadow">
                                        {editingAccount?.id === account.id ? (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <input type="text" value={editingAccount.name} onChange={e => setEditingAccount(prev => ({...prev!, name: e.target.value}))} className="block w-full rounded-md p-2" />
                                                <select value={editingAccount.type} onChange={e => setEditingAccount(prev => ({...prev!, type: e.target.value as any}))} className="block w-full rounded-md p-2">
                                                    <option>Conta Corrente</option>
                                                    <option>Poupança</option>
                                                    <option>Cartão de Crédito</option>
                                                </select>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingAccount(null); }} className="px-3 py-1 text-sm rounded-md">Cancelar</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleUpdateAccount(); }} className="px-3 py-1 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Salvar</button>
                                            </div>
                                        </div>
                                    ) : (
                                            <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-300">{account.name}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{account.type}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingAccount(account); }} className="text-slate-400 hover:text-indigo-600"><PencilIcon /></button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteBankAccount(account.id); }} className="text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">Adicionar Nova Conta</h4>
                            <form onSubmit={handleAddAccountSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div>
                                    <label htmlFor={`account-name-${profile.id}`} className="sr-only">Nome da Conta</label>
                                    <input type="text" id={`account-name-${profile.id}`} value={newAccountData.name} onChange={e => setNewAccountData(prev => ({ ...prev, name: e.target.value }))} className="block w-full rounded-md p-2" placeholder="Ex: NuBank"/>
                                </div>
                                <div>
                                    <label htmlFor={`account-type-${profile.id}`} className="sr-only">Tipo</label>
                                    <select id={`account-type-${profile.id}`} value={newAccountData.type} onChange={e => setNewAccountData(prev => ({...prev, type: e.target.value as NewAccountData['type']}))} className="block w-full rounded-md p-2">
                                        <option>Conta Corrente</option>
                                        <option>Poupança</option>
                                        <option>Cartão de Crédito</option>
                                    </select>
                                </div>
                                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700">
                                    <PlusIcon/> <span>Adicionar</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* METAS FINANCEIRAS */}
                    <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><AcademicCapIcon /> Metas Financeiras</h3>
                            {/* Metas de Ganhos */}
                            <div className="mb-6">
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Metas de Ganhos</h4>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg shadow-sm mb-4">
                                <form onSubmit={handleAddEarningGoalSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div className="md:col-span-3">
                                        <label htmlFor={`eg-desc-${profile.id}`} className="sr-only">Descrição</label>
                                        <input type="text" id={`eg-desc-${profile.id}`} value={newEarningGoalData.description} onChange={e => setNewEarningGoalData(prev => ({...prev, description: e.target.value}))} className="block w-full rounded-md p-2" placeholder="Ex: Renda extra com freelancing" required />
                                    </div>
                                    <div>
                                        <label htmlFor={`eg-amount-${profile.id}`} className="sr-only">Valor Alvo (R$)</label>
                                        <input type="number" id={`eg-amount-${profile.id}`} value={newEarningGoalData.targetAmount} onChange={e => setNewEarningGoalData(prev => ({...prev, targetAmount: e.target.value}))} className="block w-full rounded-md p-2" placeholder="Valor Alvo (R$)" required />
                                    </div>
                                    <div>
                                        <label htmlFor={`eg-period-${profile.id}`} className="sr-only">Período</label>
                                        <select id={`eg-period-${profile.id}`} value={newEarningGoalData.period} onChange={e => setNewEarningGoalData(prev => ({...prev, period: e.target.value as GoalPeriod}))} className="block w-full rounded-md p-2">
                                            {Object.values(GoalPeriod).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700">Adicionar Meta</button>
                                </form>
                            </div>
                            <div className="space-y-3">
                                {profileEarningGoals.map(goal => {
                                    const currentAmount = transactions.filter(t => t.type === 'income' && new Date(t.date) >= new Date(goal.startDate) && new Date(t.date) <= new Date(goal.endDate)).reduce((sum, t) => sum + t.amount, 0);
                                    const progress = goal.targetAmount > 0 ? Math.min((currentAmount / goal.targetAmount) * 100, 100) : 0;
                                    return (
                                        <div key={goal.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">{goal.description}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{goal.period} ({`${new Date(goal.startDate+'T00:00:00').toLocaleDateString('pt-BR')} - ${new Date(goal.endDate+'T00:00:00').toLocaleDateString('pt-BR')}`})</p>
                                                </div>
                                                <button onClick={() => onLinkFinancialGoalToTasks(goal.description)} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Vincular</button>
                                            </div>
                                            <div className="flex justify-between my-1 text-xs">
                                                <span className="font-medium">{formatCurrency(currentAmount)}</span>
                                                <span>{formatCurrency(goal.targetAmount)}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%`}}></div></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                            {/* Teto de Gastos */}
                            <div>
                            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Teto de Gastos (Mensal)</h4>
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg shadow-sm mb-4">
                                <form onSubmit={handleAddSpendingGoalSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label htmlFor={`sg-category-${profile.id}`} className="sr-only">Categoria</label>
                                        <input type="text" id={`sg-category-${profile.id}`} list="category-list" value={newSpendingGoalData.category} onChange={e => setNewSpendingGoalData(prev => ({...prev, category: e.target.value}))} className="block w-full rounded-md p-2" placeholder="Categoria" required />
                                    </div>
                                    <div>
                                        <label htmlFor={`sg-limit-${profile.id}`} className="sr-only">Limite Mensal (R$)</label>
                                        <input type="number" id={`sg-limit-${profile.id}`} value={newSpendingGoalData.limit} onChange={e => setNewSpendingGoalData(prev => ({...prev, limit: e.target.value}))} className="block w-full rounded-md p-2" placeholder="Limite (R$)" required />
                                    </div>
                                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700">Definir</button>
                                </form>
                            </div>
                            <div className="space-y-3">
                                {profileSpendingGoals.map(goal => {
                                    const currentSpending = transactions.filter(t => t.category === goal.category && t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth()).reduce((sum, t) => sum + t.amount, 0);
                                    // FIX: Ensure goal.limit is treated as a number to prevent runtime errors.
                                    const goalLimit = Number(goal.limit) || 0;
                                    const progress = goalLimit > 0 ? Math.min((currentSpending / goalLimit) * 100, 100) : 0;
                                    const progressColor = progress > 90 ? 'bg-red-500' : progress > 75 ? 'bg-amber-500' : 'bg-indigo-600';
                                    return (
                                        <div key={goal.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                            <div className="flex justify-between items-center mb-1 text-sm">
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{goal.category}</span>
                                                <div>
                                                    <span className={`font-mono text-xs ${progress > 100 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{formatCurrency(currentSpending)} / {formatCurrency(goalLimit)}</span>
                                                    <button onClick={() => onDeleteSpendingGoal(goal.id)} className="ml-2 text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                                </div>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                                <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const RecurringExpenseEditor: React.FC<{
    onSave: (data: any) => void;
    onCancel: () => void;
    initialData: any;
    profiles: Profile[];
    transactionCategories: string[];
}> = ({ onSave, onCancel, initialData, profiles, transactionCategories }) => {
    const [data, setData] = useState(initialData);

    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    const isEditing = 'id' in initialData;

    return (
        <div className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                {isEditing ? 'Editar Despesa Recorrente' : 'Adicionar Nova Despesa Recorrente'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" name="description" placeholder="Descrição" value={data.description} onChange={handleChange} className="block w-full rounded-md p-2" required />
                    <input type="number" name="amount" placeholder="Valor (R$)" value={data.amount} onChange={handleChange} className="block w-full rounded-md p-2" required />
                    <input type="text" name="category" list="category-list" placeholder="Categoria" value={data.category} onChange={handleChange} className="block w-full rounded-md p-2" required />
                    <datalist id="category-list">
                        {transactionCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <select name="profileId" value={data.profileId} onChange={handleChange} className="block w-full rounded-md p-2">
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select name="frequency" value={data.frequency} onChange={handleChange} className="block w-full rounded-md p-2">
                        <option value="monthly">Mensal</option>
                        <option value="yearly">Anual</option>
                    </select>
                    <input type="number" name="dayOfMonth" placeholder="Dia do Mês" min="1" max="31" value={data.dayOfMonth} onChange={handleChange} className="block w-full rounded-md p-2" required />
                    <input type="date" name="startDate" value={data.startDate} onChange={handleChange} className="block w-full rounded-md p-2 md:col-span-2" />
                </div>
                <div className="flex justify-end gap-2">
                    {isEditing && <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg">Cancelar</button>}
                    <button type="submit" className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700">
                        {isEditing ? 'Salvar Alterações' : 'Adicionar Despesa'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ 
    profiles, transactions, bankAccounts, purchases, spendingGoals, earningGoals, investments, investmentFunds, recurringExpenses, categories,
    onAddProfile, onDeleteProfile, onAddBankAccount, onUpdateBankAccount, onDeleteBankAccount, onInvest, onAddInvestmentFund,
    onAddRecurringExpense, onUpdateRecurringExpense, onDeleteRecurringExpense, onAddCategory,
    onAddSpendingGoal, onDeleteSpendingGoal, onAddEarningGoal, onLinkFinancialGoalToTasks
}) => {
    const [currentFinanceView, setCurrentFinanceView] = useState<FinanceView>('dashboard');
    const [dateFilter, setDateFilter] = useState<DateFilter>('this_month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfileType, setNewProfileType] = useState<'CPF' | 'CNPJ'>('CPF');
    
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    const [investmentAmount, setInvestmentAmount] = useState<number | ''>('');
    const [selectedFundId, setSelectedFundId] = useState<string>(investmentFunds[0]?.id || '');
    const [investmentProfileId, setInvestmentProfileId] = useState<string>(profiles[0]?.id || '');
    
    const [isAddingFund, setIsAddingFund] = useState(false);
    const [newFund, setNewFund] = useState<Omit<InvestmentFund, 'id'>>({ name: '', type: InvestmentType.RendaFixa, yieldRate: 0, description: '' });

    const initialRecurringState = {
        description: '', amount: '', category: '', profileId: profiles[0]?.id || '',
        frequency: 'monthly' as 'monthly' | 'yearly', startDate: new Date().toISOString().split('T')[0], dayOfMonth: '1',
    };
    const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);

    const [activeProfileId, setActiveProfileId] = useState<string | null>(profiles[0]?.id || null);


    const transactionCategories = useMemo(() => {
        const allCategories = new Set([...categories.map(c => c.name), ...transactions.map(t => t.category)].filter(Boolean));
        return Array.from(allCategories) as string[];
    }, [transactions, categories]);


    useEffect(() => {
        if (profiles.length > 0 && !investmentProfileId) setInvestmentProfileId(profiles[0].id);
        if (investmentFunds.length > 0 && !selectedFundId) setSelectedFundId(investmentFunds[0].id);
    }, [profiles, investmentFunds]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;
    
        switch (dateFilter) {
            case 'this_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'last_30_days':
                startDate = new Date();
                startDate.setDate(now.getDate() - 30);
                endDate = new Date(now);
                break;
            case 'last_year':
                const lastYear = now.getFullYear() - 1;
                startDate = new Date(lastYear, 0, 1);
                endDate = new Date(lastYear, 11, 31);
                break;
            case 'last_semester':
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                if (currentMonth < 6) { // H1, so last semester is H2 of previous year
                    startDate = new Date(currentYear - 1, 6, 1);
                    endDate = new Date(currentYear - 1, 11, 31);
                } else { // H2, so last semester is H1 of current year
                    startDate = new Date(currentYear, 0, 1);
                    endDate = new Date(currentYear, 5, 30);
                }
                break;
            case 'last_trimester':
                const currentMonthForTrim = now.getMonth();
                const currentYearForTrim = now.getFullYear();
                const currentQuarter = Math.floor(currentMonthForTrim / 3);
                if (currentQuarter === 0) { // Q1, so last quarter is Q4 of prev year
                    startDate = new Date(currentYearForTrim - 1, 9, 1);
                    endDate = new Date(currentYearForTrim - 1, 11, 31);
                } else {
                    const lastQuarterStartMonth = (currentQuarter - 1) * 3;
                    startDate = new Date(currentYearForTrim, lastQuarterStartMonth, 1);
                    endDate = new Date(currentYearForTrim, lastQuarterStartMonth + 3, 0);
                }
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    startDate = new Date(customStartDate + 'T00:00:00');
                    endDate = new Date(customEndDate + 'T00:00:00');
                } else {
                    return [];
                }
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
        }
    
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    
        return transactions.filter(t => {
            const transactionDate = new Date(t.date + 'T00:00:00');
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }, [transactions, dateFilter, customStartDate, customEndDate]);
    
    const financialSummary = useMemo(() => {
        const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;
        return { totalIncome, totalExpenses, balance };
    }, [filteredTransactions]);

    const spendingByCategory = useMemo(() => {
        const spending = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const category = t.category || 'Outros';
                if (!acc[category]) acc[category] = 0;
                acc[category] += t.amount;
                return acc;
            }, {} as Record<string, number>);
        
        return Object.entries(spending)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);
    
    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTransactions]);

    const handleAddProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProfileName.trim()) {
            onAddProfile(newProfileName, newProfileType);
            setNewProfileName('');
            setNewProfileType('CPF');
        }
    };
    
    const handleSaveRecurringExpense = (data: any) => {
        const categoryExists = categories.some(c => c.name.toLowerCase() === data.category.toLowerCase());
        if (!categoryExists) {
            onAddCategory(data.category, 'bg-slate-500');
        }

        if (data.id) { // it's an update
            onUpdateRecurringExpense(data);
            setEditingRecurring(null);
        } else { // it's a new one
            onAddRecurringExpense(data);
        }
    };

    const handleInvestmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (investmentAmount && selectedFundId && investmentProfileId) {
            onInvest(investmentAmount, selectedFundId, investmentProfileId);
            setInvestmentAmount('');
        }
    };
    
    const handleAddFundSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(newFund.name.trim()) {
            onAddInvestmentFund(newFund);
            setNewFund({ name: '', type: InvestmentType.RendaFixa, yieldRate: 0, description: '' });
            setIsAddingFund(false);
        }
    }

    const getHeaderTitle = () => {
        switch(currentFinanceView) {
            case 'dashboard': return 'Painel Financeiro';
            case 'profiles': return 'Perfis, Contas e Metas';
            case 'cashflow': return 'Fluxo de Caixa';
            case 'purchases': return 'Histórico de Compras';
            case 'investments': return 'Meus Investimentos';
            case 'recurring': return 'Despesas Recorrentes';
        }
    }
    
     const PurchaseCard: React.FC<{ purchase: Purchase }> = ({ purchase }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const getUnitLabel = (unit: PurchaseItemUnit, quantity: number, weight?: number) => {
            if (weight && (unit === PurchaseItemUnit.Kilogram || unit === PurchaseItemUnit.Gram)) {
                return `${weight}${unit}`;
            }
            if (unit === PurchaseItemUnit.Unit) {
                 return `${quantity} un`;
            }
            return `${quantity} ${unit}`;
        }
        return (
             <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div onClick={() => setIsExpanded(!isExpanded)} className="p-4 flex justify-between items-center cursor-pointer">
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{purchase.storeName}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(purchase.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                         <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{formatCurrency(purchase.totalAmount)}</p>
                         <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-left text-slate-500 dark:text-slate-400">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                    <tr>
                                        <th scope="col" className="px-4 py-2">Item</th>
                                        <th scope="col" className="px-4 py-2">Marca</th>
                                        <th scope="col" className="px-4 py-2 text-right">Qtd/Peso</th>
                                        <th scope="col" className="px-4 py-2 text-right">Preço Unit.</th>
                                        <th scope="col" className="px-4 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchase.items.map(item => (
                                        <tr key={item.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700">
                                            <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                            <td className="px-4 py-2">{item.brand || '-'}</td>
                                            <td className="px-4 py-2 text-right">{getUnitLabel(item.unit, item.quantity, item.weight)}</td>
                                            <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-800 dark:text-slate-200">{formatCurrency(item.totalPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    const totalInvested = useMemo(() => investments.reduce((sum, inv) => sum + inv.amount, 0), [investments]);

    return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col">
                <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 p-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap truncate">
                        {getHeaderTitle()}
                    </h1>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center sm:justify-end">
                        <button onClick={() => setCurrentFinanceView('dashboard')} className={`flex items-center gap-2 font-semibold px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${currentFinanceView === 'dashboard' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}> <LayoutDashboardIcon /> <span className="hidden md:inline">Dashboard</span> </button>
                        <button onClick={() => setCurrentFinanceView('recurring')} className={`flex items-center gap-2 font-semibold px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${currentFinanceView === 'recurring' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}> <RepeatIcon /> <span className="hidden md:inline">Recorrências</span> </button>
                        <button onClick={() => setCurrentFinanceView('investments')} className={`flex items-center gap-2 font-semibold px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${currentFinanceView === 'investments' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}> <BanknotesIcon /> <span className="hidden md:inline">Investimentos</span> </button>
                        <button onClick={() => setCurrentFinanceView('cashflow')} className={`flex items-center gap-2 font-semibold px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${currentFinanceView === 'cashflow' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}> <ClipboardListIcon /> <span className="hidden md:inline">Fluxo de Caixa</span> </button>
                        <button onClick={() => setCurrentFinanceView('purchases')} className={`flex items-center gap-2 font-semibold px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${currentFinanceView === 'purchases' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}> <ShoppingBagIcon /> <span className="hidden md:inline">Compras</span> </button>
                        <button onClick={() => setCurrentFinanceView('profiles')} className={`flex items-center gap-2 font-semibold px-2 sm:px-3 py-2 rounded-lg text-sm transition-colors ${currentFinanceView === 'profiles' ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}> <UsersIcon /> <span className="hidden md:inline">Perfis</span> </button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {currentFinanceView === 'dashboard' && (
                        <div>
                             <div className="flex justify-end mb-4 items-center gap-2 flex-wrap">
                                <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} className="rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                                    <option value="this_month">Este Mês</option>
                                    <option value="last_month">Mês Passado</option>
                                    <option value="last_30_days">Últimos 30 dias</option>
                                    <option value="last_trimester">Último Trimestre</option>
                                    <option value="last_semester">Último Semestre</option>
                                    <option value="last_year">Último Ano</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                                {dateFilter === 'custom' && (
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5"/>
                                        <span>até</span>
                                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5"/>
                                    </div>
                                )}
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center"> <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-800/50 mr-4"><ArrowUpIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /></div> <div> <p className="text-sm text-slate-500 dark:text-slate-400">Total de Entradas</p> <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(financialSummary.totalIncome)}</p> </div> </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center"> <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-800/50 mr-4"><ArrowDownIcon className="h-6 w-6 text-rose-600 dark:text-rose-400" /></div> <div> <p className="text-sm text-slate-500 dark:text-slate-400">Total de Saídas</p> <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(financialSummary.totalExpenses)}</p> </div> </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center"> <div className="p-3 rounded-full bg-sky-100 dark:bg-sky-800/50 mr-4"><ScaleIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" /></div> <div> <p className="text-sm text-slate-500 dark:text-slate-400">Saldo do Período</p> <p className={`text-2xl font-semibold ${financialSummary.balance >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(financialSummary.balance)}</p> </div> </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                     <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><ChartBarIcon /> Entradas vs. Saídas</h3>
                                     <div className="h-64">
                                        <BarChart income={financialSummary.totalIncome} expense={financialSummary.totalExpenses} />
                                     </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                     <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2"><ChartPieIcon /> Gastos por Categoria</h3>
                                     <div className="h-64">
                                        <DoughnutChart data={spendingByCategory} />
                                     </div>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Metas de Gastos</h3>
                                <div className="space-y-4">
                                    {spendingGoals.map(goal => {
                                        const currentSpending = spendingByCategory.find(c => c.label === goal.category)?.value || 0;
                                        const goalLimit = Number(goal.limit) || 0;
                                        const progress = goalLimit > 0 ? Math.min((currentSpending / goalLimit) * 100, 100) : 0;
                                        const isOver = goalLimit > 0 && currentSpending > goalLimit;
                                        return (
                                            <div key={goal.id}>
                                                <div className="flex justify-between mb-1 text-sm">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{goal.category}</span>
                                                    <span className={`font-mono ${isOver ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>{formatCurrency(currentSpending)} / {formatCurrency(goalLimit)}</span>
                                                </div>
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                                    <div className={`${isOver ? 'bg-red-500' : 'bg-indigo-600'} h-4 rounded-full text-center text-white text-xs leading-4`} style={{ width: `${progress}%` }}>
                                                        {Math.round(progress)}%
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {currentFinanceView === 'profiles' && (
                        <div className="space-y-6">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">Criar Novo Perfil</h3>
                                <form onSubmit={handleAddProfileSubmit} className="flex flex-col sm:flex-row items-end gap-3">
                                    <div className="flex-grow w-full">
                                        <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome do Perfil</label>
                                        <input type="text" id="profile-name" value={newProfileName} onChange={e => setNewProfileName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" placeholder="Ex: Finanças Pessoais"/>
                                    </div>
                                    <div className="w-full sm:w-auto">
                                         <label htmlFor="profile-type" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Tipo</label>
                                        <select id="profile-type" value={newProfileType} onChange={e => setNewProfileType(e.target.value as 'CPF' | 'CNPJ')} className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                                            <option>CPF</option>
                                            <option>CNPJ</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
                                        <PlusIcon/>
                                        <span>Criar</span>
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-4">
                                {profiles.map(profile => (
                                    <ProfileAccordionItem
                                        key={profile.id}
                                        profile={profile}
                                        isActive={activeProfileId === profile.id}
                                        onToggle={() => setActiveProfileId(activeProfileId === profile.id ? null : profile.id)}
                                        onDeleteProfile={onDeleteProfile}
                                        profilesCount={profiles.length}
                                        profileBankAccounts={bankAccounts.filter(b => b.profileId === profile.id)}
                                        profileSpendingGoals={spendingGoals.filter(g => g.profileId === profile.id)}
                                        profileEarningGoals={earningGoals.filter(g => g.profileId === profile.id)}
                                        transactions={transactions}
                                        onAddBankAccount={onAddBankAccount}
                                        onUpdateBankAccount={onUpdateBankAccount}
                                        onDeleteBankAccount={onDeleteBankAccount}
                                        setSelectedAccount={setSelectedAccount}
                                        onAddEarningGoal={onAddEarningGoal}
                                        onLinkFinancialGoalToTasks={onLinkFinancialGoalToTasks}
                                        onAddSpendingGoal={onAddSpendingGoal}
                                        onDeleteSpendingGoal={onDeleteSpendingGoal}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                     {currentFinanceView === 'purchases' && (
                        <div className="space-y-4">
                            {purchases.length === 0 ? (
                                <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <div className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"><ShoppingBagIcon/></div>
                                    <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">Nenhuma Compra Registrada</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use o assistente para registrar suas compras detalhadas.</p>
                                </div>
                            ) : (
                                [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => <PurchaseCard key={p.id} purchase={p} />)
                            )}
                        </div>
                    )}
                    {currentFinanceView === 'cashflow' && (
                        <div className="space-y-3">
                            {sortedTransactions.length === 0 ? (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">Nenhuma transação registrada ainda.</p>
                            ) : (
                                sortedTransactions.map(transaction => {
                                    const profile = profiles.find(p => p.id === transaction.profileId);
                                    const bankAccount = transaction.bankAccountId ? bankAccounts.find(b => b.id === transaction.bankAccountId) : null;
                                    const isIncome = transaction.type === 'income';
                                    return (
                                        <div key={transaction.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 flex-grow min-w-0">
                                                <div className={`p-2 rounded-full ${isIncome ? 'bg-emerald-100 dark:bg-emerald-800/50' : 'bg-rose-100 dark:bg-rose-800/50'}`}>
                                                    {isIncome ? <ArrowUpIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400"/> : <ArrowDownIcon className="h-5 w-5 text-rose-600 dark:text-rose-400"/>}
                                                </div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{transaction.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                                       {transaction.category && <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">{transaction.category}</span>}
                                                       <span className="hidden sm:inline">•</span>
                                                       <span className="truncate">{profile?.name || 'N/A'}</span>
                                                       <span className="hidden sm:inline">•</span>
                                                       <span>{new Date(transaction.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                                       {transaction.paymentMethod && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <span>{transaction.paymentMethod}{bankAccount ? ` (${bankAccount.name})` : ''}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className={`font-semibold text-lg whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                                            </p>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                    
                    {currentFinanceView === 'investments' && (
                         <div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Total Investido</h3>
                                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalInvested)}</p>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Realizar Aplicação</h3>
                                    <form onSubmit={handleInvestmentSubmit} className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="inv-amount" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Valor (R$)</label>
                                                <input type="number" id="inv-amount" value={investmentAmount} onChange={e => setInvestmentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 p-2" placeholder="100.00" />
                                            </div>
                                             <div>
                                                <label htmlFor="inv-profile" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Perfil</label>
                                                <select id="inv-profile" value={investmentProfileId} onChange={e => setInvestmentProfileId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 p-2">
                                                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="inv-fund" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Fundo</label>
                                            <select id="inv-fund" value={selectedFundId} onChange={e => setSelectedFundId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 p-2">
                                                {investmentFunds.map(f => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700">Investir</button>
                                    </form>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Fundos de Investimento</h3>
                                <button onClick={() => setIsAddingFund(true)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"><PlusIcon/> Adicionar Fundo</button>
                            </div>
                            {isAddingFund && (
                                <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-4">
                                    <form onSubmit={handleAddFundSubmit} className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <input type="text" placeholder="Nome do Fundo" value={newFund.name} onChange={e => setNewFund({...newFund, name: e.target.value})} className="sm:col-span-2 block w-full rounded-md p-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" required/>
                                            <select value={newFund.type} onChange={e => setNewFund({...newFund, type: e.target.value as InvestmentType})} className="block w-full rounded-md p-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                                                {Object.values(InvestmentType).map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>
                                        <input type="number" placeholder="Taxa de Rendimento Anual (%) Ex: 11.2" value={newFund.yieldRate || ''} onChange={e => setNewFund({...newFund, yieldRate: parseFloat(e.target.value) || undefined })} className="block w-full rounded-md p-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                                        <input type="text" placeholder="Descrição (Ex: CDB liquidez diária)" value={newFund.description || ''} onChange={e => setNewFund({...newFund, description: e.target.value})} className="block w-full rounded-md p-2 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600" />
                                        <div className="flex justify-end gap-2">
                                            <button type="button" onClick={() => setIsAddingFund(false)} className="px-3 py-1 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancelar</button>
                                            <button type="submit" className="px-3 py-1 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Salvar Fundo</button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div className="space-y-3">
                                {investmentFunds.map(fund => (
                                    <div key={fund.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">{fund.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{fund.type} {fund.yieldRate ? `| Rendimento: ${fund.yieldRate}% a.a.` : ''}</p>
                                        {fund.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{fund.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {currentFinanceView === 'recurring' && (
                        <div>
                            {editingRecurring ? (
                                <RecurringExpenseEditor 
                                    onSave={handleSaveRecurringExpense}
                                    onCancel={() => setEditingRecurring(null)}
                                    initialData={editingRecurring}
                                    profiles={profiles}
                                    transactionCategories={transactionCategories}
                                />
                            ) : (
                                <RecurringExpenseEditor 
                                    onSave={handleSaveRecurringExpense}
                                    onCancel={() => {}}
                                    initialData={initialRecurringState}
                                    profiles={profiles}
                                    transactionCategories={transactionCategories}
                                />
                            )}
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Despesas Recorrentes</h3>
                            <div className="space-y-3">
                                {recurringExpenses.map(re => (
                                    <div key={re.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{re.description} - {formatCurrency(re.amount)}</p>
                                            <p className="text-sm text-slate-500">{re.category} | {re.frequency === 'monthly' ? 'Mensal' : 'Anual'}, dia {re.dayOfMonth}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditingRecurring(re)} className="text-slate-400 hover:text-indigo-600"><PencilIcon /></button>
                                            <button onClick={() => onDeleteRecurringExpense(re.id)} className="text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
            {selectedAccount && <BankAccountDetailsModal isOpen={!!selectedAccount} onClose={() => setSelectedAccount(null)} account={selectedAccount} onUpdate={onUpdateBankAccount} appColor="indigo" />}
        </div>
    );
};

export default FinanceDashboard;