

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Task, Category, WeeklyGoal, Subtask, View, MajorGoal, ChatMessage, Profile, Transaction, Priority, BankAccount, PaymentMethod, AccountInfo, PendingPurchase, Purchase, PurchaseItemUnit, SpendingGoal, Investment, InvestmentFund, InvestmentType, PendingInvestment, RecurringExpense, EarningGoal, GoalPeriod, CalendarEvent } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskItem from './components/TaskItem';
import ProgressBar from './components/ProgressBar';
import Modal from './components/Modal';
import { CategoryModal } from './components/CategoryModal';
import FinanceDashboard from './components/FinanceDashboard';
import FloatingAIAssistant from './components/FloatingAIAssistant';
import Settings from './components/Settings';
import Auth from './components/Auth';
import TodayDashboard from './components/TodayDashboard';
import { PlusIcon, TargetIcon, TrashIcon, FlagIcon, PencilIcon } from './components/Icons';
import { GoogleGenAI, FunctionDeclaration, Type, Content } from '@google/genai';

const UNCATEGORIZED_ID = '0';

const App: React.FC = () => {
    const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('authToken'));
    const isAuthenticated = Boolean(authToken);

    // Estados existentes...
    const [tasks, setTasks] = useState<Task[]>([]);

    const [completedTasks, setCompletedTasks] = useState<Task[]>([]);

    const [categories, setCategories] = useState<Category[]>(() => {
        const savedCategories = localStorage.getItem('categories');
        if (savedCategories) {
            const parsed = JSON.parse(savedCategories);
            if (!parsed.find((c: Category) => c.id === UNCATEGORIZED_ID)) {
                return [{ id: UNCATEGORIZED_ID, name: 'Sem Categoria', color: 'bg-slate-500' }, ...parsed];
            }
            return parsed;
        }
        return [
            { id: UNCATEGORIZED_ID, name: 'Sem Categoria', color: 'bg-slate-500' },
            { id: '1', name: 'Trabalho', color: 'bg-sky-500' },
            { id: '2', name: 'Estudo', color: 'bg-amber-500' },
            { id: '3', name: 'Espiritualidade', color: 'bg-violet-500' },
            { id: '4', name: 'Saúde', color: 'bg-emerald-500' },
            { id: '5', name: 'Leitura', color: 'bg-rose-500' },
            { id: '6', name: 'Vida Pessoal', color: 'bg-pink-500' },
        ];
    });

    const [majorGoals, setMajorGoals] = useState<MajorGoal[]>(() => {
        const savedMajorGoals = localStorage.getItem('majorGoals');
        return savedMajorGoals ? JSON.parse(savedMajorGoals) : [];
    });

    const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(() => {
        const savedGoals = localStorage.getItem('weeklyGoals');
        return savedGoals ? JSON.parse(savedGoals) : [];
    });
    
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
        const saved = localStorage.getItem('calendarEvents');
        return saved ? JSON.parse(saved) : [];
    });

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                return 'dark';
            }
        }
        return 'light';
    });

    // Estados de Configuração
    const [appColor, setAppColor] = useState<string>(() => localStorage.getItem('appColor') || 'indigo');
    const [assistantName, setAssistantName] = useState<string>(() => localStorage.getItem('assistantName') || 'Assistente Pessoal');
    const [assistantInstruction, setAssistantInstruction] = useState<string>(() => localStorage.getItem('assistantInstruction') || 'Você é um assistente prestativo, amigável e conciso.');
    const [accountInfo, setAccountInfo] = useState<AccountInfo>(() => {
        const saved = localStorage.getItem('accountInfo');
        return saved ? JSON.parse(saved) : {
            fullName: 'Usuário',
            email: '',
            phone: '',
            address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' },
            cpf: '',
            profession: '',
            lifeSummary: '',
            socialLinks: { instagram: '', facebook: '', website: '' },
            profilePicture: '',
        };
    });

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Estados para o Farol Finance
    const [profiles, setProfiles] = useState<Profile[]>(() => {
        const saved = localStorage.getItem('financeProfiles');
        return saved ? JSON.parse(saved) : [{ id: 'p1', name: 'Perfil Principal', type: 'CPF' }];
    });
    
    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const saved = localStorage.getItem('financeTransactions');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [purchases, setPurchases] = useState<Purchase[]>(() => {
        const saved = localStorage.getItem('purchases');
        return saved ? JSON.parse(saved) : [];
    });

    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
        const saved = localStorage.getItem('financeBankAccounts');
        return saved ? JSON.parse(saved) : [];
    });

    const [spendingGoals, setSpendingGoals] = useState<SpendingGoal[]>(() => {
        const saved = localStorage.getItem('spendingGoals');
        return saved ? JSON.parse(saved) : [];
    });

    const [earningGoals, setEarningGoals] = useState<EarningGoal[]>(() => {
        const saved = localStorage.getItem('earningGoals');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [investmentFunds, setInvestmentFunds] = useState<InvestmentFund[]>(() => {
        const saved = localStorage.getItem('investmentFunds');
        return saved ? JSON.parse(saved) : [];
    });

    const [investments, setInvestments] = useState<Investment[]>(() => {
        const saved = localStorage.getItem('investments');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(() => {
        const saved = localStorage.getItem('recurringExpenses');
        return saved ? JSON.parse(saved) : [];
    });

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'Todas'>('Todas');

    // Persistência das Configurações
    useEffect(() => { localStorage.setItem('appColor', appColor); }, [appColor]);
    useEffect(() => { localStorage.setItem('assistantName', assistantName); }, [assistantName]);
    useEffect(() => { localStorage.setItem('assistantInstruction', assistantInstruction); }, [assistantInstruction]);
    useEffect(() => { localStorage.setItem('accountInfo', JSON.stringify(accountInfo)); }, [accountInfo]);
    useEffect(() => { localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents)); }, [calendarEvents]);

    useEffect(() => { localStorage.setItem('financeProfiles', JSON.stringify(profiles)); }, [profiles]);
    useEffect(() => { localStorage.setItem('financeTransactions', JSON.stringify(transactions)); }, [transactions]);
    useEffect(() => { localStorage.setItem('financeBankAccounts', JSON.stringify(bankAccounts)); }, [bankAccounts]);
    useEffect(() => { localStorage.setItem('purchases', JSON.stringify(purchases)); }, [purchases]);
    useEffect(() => { localStorage.setItem('spendingGoals', JSON.stringify(spendingGoals)); }, [spendingGoals]);
    useEffect(() => { localStorage.setItem('earningGoals', JSON.stringify(earningGoals)); }, [earningGoals]);
    useEffect(() => { localStorage.setItem('investmentFunds', JSON.stringify(investmentFunds)); }, [investmentFunds]);
    useEffect(() => { localStorage.setItem('investments', JSON.stringify(investments)); }, [investments]);
    useEffect(() => { localStorage.setItem('recurringExpenses', JSON.stringify(recurringExpenses)); }, [recurringExpenses]);

    const handleAddProfile = (name: string, type: 'CPF' | 'CNPJ') => {
        const newProfile: Profile = { id: `p${Date.now()}`, name, type };
        setProfiles(prev => [...prev, newProfile]);
    };

    const handleDeleteProfile = (profileId: string) => {
        if (profiles.length <= 1) {
            alert("Não é possível excluir o último perfil.");
            return;
        }
        if (window.confirm("Tem certeza que deseja excluir este perfil? Todas as transações e contas associadas também serão excluídas.")) {
            setProfiles(prev => prev.filter(p => p.id !== profileId));
            setTransactions(prev => prev.filter(t => t.profileId !== profileId));
            setBankAccounts(prev => prev.filter(b => b.profileId !== profileId));
        }
    };

    const handleAddBankAccount = (account: Omit<BankAccount, 'id'>) => {
        const newAccount: BankAccount = { ...account, id: `b${Date.now()}` };
        setBankAccounts(prev => [...prev, newAccount]);
    };

    const handleUpdateBankAccount = (updatedAccount: BankAccount) => {
        setBankAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    };

    const handleDeleteBankAccount = (accountId: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta conta? As transações não serão excluídas, mas perderão o vínculo com esta conta.")) {
            setBankAccounts(prev => prev.filter(b => b.id !== accountId));
            setTransactions(prev => prev.map(t => t.bankAccountId === accountId ? { ...t, bankAccountId: undefined } : t));
        }
    };

    const handleAddInvestmentFund = (fund: Omit<InvestmentFund, 'id'>) => {
        const newFund: InvestmentFund = { ...fund, id: `if${Date.now()}` };
        setInvestmentFunds(prev => [...prev, newFund]);
    };

    const handleInvest = (amount: number, fundId: string, profileId: string) => {
        const fund = investmentFunds.find(f => f.id === fundId);
        if (!fund) return;

        const newInvestment: Investment = {
            id: `inv${Date.now()}`,
            amount,
            fundId,
            profileId,
            date: new Date().toISOString().split('T')[0],
        };
        setInvestments(prev => [...prev, newInvestment]);

        const newTransaction: Transaction = {
            id: `t_inv${Date.now()}`,
            description: `Aplicação em ${fund.name}`,
            amount,
            type: 'expense',
            date: new Date().toISOString().split('T')[0],
            profileId,
            category: 'Investimentos',
            paymentMethod: PaymentMethod.PIX // Default or could be a parameter
        };
        setTransactions(prev => [...prev, newTransaction]);
    };
    
    const handleAddRecurringExpense = (expense: Omit<RecurringExpense, 'id'>) => {
        const newExpense: RecurringExpense = { ...expense, id: `re${Date.now()}` };
        setRecurringExpenses(prev => [...prev, newExpense]);
    };
    
    const handleUpdateRecurringExpense = (updatedExpense: RecurringExpense) => {
        setRecurringExpenses(prev => prev.map(exp => exp.id === updatedExpense.id ? updatedExpense : exp));
    };
    
    const handleDeleteRecurringExpense = (expenseId: string) => {
        if (window.confirm("Tem certeza que deseja excluir esta despesa recorrente? As transações já lançadas não serão afetadas.")) {
            setRecurringExpenses(prev => prev.filter(exp => exp.id !== expenseId));
        }
    };

    useEffect(() => {
        const newTransactions: Transaction[] = [];
        const today = new Date();
    
        recurringExpenses.forEach(re => {
            let cursorDate = new Date(re.startDate + 'T00:00:00');
            
            while (cursorDate <= today) {
                const year = cursorDate.getFullYear();
                const month = cursorDate.getMonth();
    
                const transactionExists = transactions.some(t => 
                    t.recurringExpenseId === re.id &&
                    new Date(t.date + 'T00:00:00').getFullYear() === year &&
                    new Date(t.date + 'T00:00:00').getMonth() === month
                );
    
                if (!transactionExists && cursorDate >= new Date(re.startDate + 'T00:00:00')) {
                    const day = Math.min(re.dayOfMonth, new Date(year, month + 1, 0).getDate()); // Garante que o dia é válido para o mês
                    const transactionDate = new Date(year, month, day);
    
                    if (transactionDate <= today) {
                        newTransactions.push({
                            id: `t-re-${re.id}-${year}-${month + 1}`,
                            description: re.description,
                            amount: re.amount,
                            type: 'expense',
                            date: transactionDate.toISOString().split('T')[0],
                            profileId: re.profileId,
                            category: re.category,
                            recurringExpenseId: re.id,
                        });
                    }
                }
    
                if (re.frequency === 'monthly') {
                    cursorDate.setMonth(cursorDate.getMonth() + 1);
                } else if (re.frequency === 'yearly') {
                    cursorDate.setFullYear(cursorDate.getFullYear() + 1);
                } else {
                    break;
                }
            }
        });
    
        if (newTransactions.length > 0) {
            setTransactions(prev => [...prev, ...newTransactions]);
        }
    }, [recurringExpenses]);


    const handleToggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const handleThemeToggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    useEffect(() => { localStorage.setItem('categories', JSON.stringify(categories)); }, [categories]);
    useEffect(() => { localStorage.setItem('weeklyGoals', JSON.stringify(weeklyGoals)); }, [weeklyGoals]);
    useEffect(() => { localStorage.setItem('majorGoals', JSON.stringify(majorGoals)); }, [majorGoals]);


    const apiTaskToClientTask = useCallback((apiTask: {
        id: string;
        title: string;
        description?: string | null;
        category_id?: string | null;
        due_date?: string | null;
        priority?: Priority | null;
        is_habit?: boolean | null;
        checklist?: Subtask[] | null;
        done: boolean;
        completed_at?: string | null;
        created_at: string;
    }): Task => ({
        id: apiTask.id,
        text: apiTask.title,
        categoryId: apiTask.category_id || UNCATEGORIZED_ID,
        completed: apiTask.done,
        isHabit: Boolean(apiTask.is_habit),
        checklist: Array.isArray(apiTask.checklist) ? apiTask.checklist : [],
        completedAt: apiTask.completed_at || (apiTask.done ? apiTask.created_at : undefined),
        priority: apiTask.priority || Priority.None,
        dueDate: apiTask.due_date || undefined,
        description: apiTask.description || undefined,
    }), []);

    const fetchTasksFromApi = useCallback(async (token: string) => {
        const response = await fetch('/.netlify/functions/tasks', {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            const error = new Error('Não foi possível carregar tarefas.');
            (error as Error & { statusCode?: number }).statusCode = response.status;
            throw error;
        }

        const data = await response.json();
        const mappedTasks = (data.tasks || []).map(apiTaskToClientTask);
        setTasks(mappedTasks.filter((task: Task) => !task.completed));
        setCompletedTasks(mappedTasks.filter((task: Task) => task.completed));
    }, [apiTaskToClientTask]);

    useEffect(() => {
        if (!authToken) {
            setTasks([]);
            setCompletedTasks([]);
            return;
        }

        fetchTasksFromApi(authToken).catch((error: Error & { statusCode?: number }) => {
            if (error.statusCode === 401 || error.statusCode === 403) {
                setAuthToken(null);
                localStorage.removeItem('authToken');
                window.history.replaceState({}, '', '/login');
            }
        });
    }, [authToken, fetchTasksFromApi]);

    const [currentView, setCurrentView] = useState<View>(View.Today);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [isTaskModalOpen, setTaskModalOpen] = useState(false);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [startCategoryModalInAddMode, setStartCategoryModalInAddMode] = useState(false);

    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState<string>(UNCATEGORIZED_ID);
    const [newTaskIsHabit, setNewTaskIsHabit] = useState(false);
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.None);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [isGoalModalOpen, setGoalModalOpen] = useState(false);
    const [newGoalText, setNewGoalText] = useState('');
    const [newGoalMajorGoalId, setNewGoalMajorGoalId] = useState<string | null>(null);
    const [editingWeeklyGoalId, setEditingWeeklyGoalId] = useState<string | null>(null);

    const [isMajorGoalModalOpen, setMajorGoalModalOpen] = useState(false);
    const [newMajorGoalText, setNewMajorGoalText] = useState('');
    const [newMajorGoalTarget, setNewMajorGoalTarget] = useState('');
    const [newMajorGoalUnit, setNewMajorGoalUnit] = useState('km');
    const [autoCreateHabitForMajorGoal, setAutoCreateHabitForMajorGoal] = useState(false);
    const [newMajorGoalHabitText, setNewMajorGoalHabitText] = useState('');
    const [newMajorGoalHabitIncrement, setNewMajorGoalHabitIncrement] = useState('');
    const [editingMajorGoalId, setEditingMajorGoalId] = useState<string | null>(null);

    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
    
    // Mock de conexão com Google
    const [isGoogleCalendarAuthorized] = useState(false);
    const handleConnectGoogleCalendar = () => {
        alert("A integração com o Google Agenda ainda não está disponível.");
    };

    const [isGoogleTasksAuthorized] = useState(false);
    const handleConnectGoogleTasks = () => {
        alert("A integração com o Google Tarefas ainda não está disponível.");
    };

    const handleViewChange = useCallback((view: View, categoryId: string | null = null) => {
        setCurrentView(view);
        setSelectedCategoryId(categoryId);
        setIsMobileMenuOpen(false);
    }, []);
    
    const handleManageCategories = () => {
        setStartCategoryModalInAddMode(false);
        setCategoryModalOpen(true);
    };

    const handleAddNewCategory = () => {
        setStartCategoryModalInAddMode(true);
        setCategoryModalOpen(true);
    };

    const updateMajorGoalProgressFromHabit = useCallback((habitTaskId: string, direction: 1 | -1) => {
        setMajorGoals(prev => prev.map(goal => {
            if (goal.linkedHabitId !== habitTaskId) return goal;
            const increment = goal.habitIncrement ?? 0;
            if (increment <= 0) return goal;

            const currentValue = goal.currentValue ?? 0;
            const nextValue = currentValue + (increment * direction);

            return {
                ...goal,
                currentValue: Math.max(0, Number(nextValue.toFixed(2))),
            };
        }));
    }, []);

    const handleToggleTask = async (taskId: string) => {
        if (!authToken) return;

        const activeTask = tasks.find(t => t.id === taskId);
        const completedTask = completedTasks.find(t => t.id === taskId);
        const nextDone = Boolean(activeTask);

        if (!activeTask && !completedTask) return;

        const response = await fetch('/.netlify/functions/tasks', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ id: taskId, done: nextDone }),
        });

        if (!response.ok) {
            alert('Não foi possível atualizar a tarefa.');
            return;
        }

        if (activeTask) {
            const taskToComplete = { ...activeTask, completed: true, completedAt: new Date().toISOString() };
            setTasks(tasks.filter(t => t.id !== taskId));
            setCompletedTasks(prev => [taskToComplete, ...prev]);
            if (activeTask.isHabit) {
                updateMajorGoalProgressFromHabit(activeTask.id, 1);
            }
            return;
        }

        if (completedTask) {
            const taskToReactivate = { ...completedTask, completed: false };
            delete taskToReactivate.completedAt;
            setCompletedTasks(completedTasks.filter(t => t.id !== taskId));
            setTasks(prev => [...prev, taskToReactivate]);
            if (completedTask.isHabit) {
                updateMajorGoalProgressFromHabit(completedTask.id, -1);
            }
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!authToken) return;

        const response = await fetch('/.netlify/functions/tasks', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ id: taskId }),
        });

        if (!response.ok) {
            alert('Não foi possível remover a tarefa.');
            return;
        }

        setTasks(tasks.filter(task => task.id !== taskId));
        setCompletedTasks(completedTasks.filter(task => task.id !== taskId));
    };
    
    const handleUpdateTaskDueDate = (taskId: string, dueDate: string | null) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, dueDate: dueDate || undefined } : task
        ));
    };

    const handleUpdateTaskCategory = (taskId: string, categoryId: string) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, categoryId } : task
        ));
        setCompletedTasks(completedTasks.map(task => 
            task.id === taskId ? { ...task, categoryId } : task
        ));
    };

    const handleUpdateTaskPriority = (taskId: string, priority: Priority) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, priority } : task
        ));
    };
    
    const handleUpdateTaskDescription = (taskId: string, description: string) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, description } : task
        ));
    };

    const handleToggleSubtask = (taskId: string, subtaskId: string) => {
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, checklist: task.checklist.map(sub => sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub) } : task
        ));
    };
    
    const handleAddSubtask = (taskId: string, subtaskText: string) => {
        const newSubtask: Subtask = { id: Date.now().toString(), text: subtaskText, completed: false };
        setTasks(tasks.map(task => 
            task.id === taskId ? { ...task, checklist: [...task.checklist, newSubtask] } : task
        ));
    };

    const handleAddMultipleSubtasks = (taskId: string, subtaskTexts: string[]) => {
      const newSubtasks: Subtask[] = subtaskTexts.map(text => ({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: text,
          completed: false
      }));
      setTasks(currentTasks => currentTasks.map(task => 
          task.id === taskId ? { ...task, checklist: [...task.checklist, ...newSubtasks] } : task
      ));
    };

    const handleAddTask = async () => {
        if (!newTaskText.trim() || !authToken) return;

        const normalizedCategoryId = newTaskCategory === UNCATEGORIZED_ID ? null : newTaskCategory;

        const response = await fetch('/.netlify/functions/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                title: newTaskText.trim(),
                description: newTaskDescription.trim() || null,
                categoryId: normalizedCategoryId,
                dueDate: newTaskDueDate || null,
                priority: newTaskIsHabit ? Priority.None : newTaskPriority,
                isHabit: newTaskIsHabit,
                checklist: [],
            }),
        });

        if (!response.ok) {
            alert('Não foi possível criar a tarefa.');
            return;
        }

        const data = await response.json();
        const createdTask: Task = {
            ...apiTaskToClientTask(data.task),
            categoryId: normalizedCategoryId || UNCATEGORIZED_ID,
            isHabit: newTaskIsHabit,
            dueDate: newTaskDueDate || undefined,
            priority: newTaskIsHabit ? Priority.None : newTaskPriority,
            description: newTaskDescription.trim() || undefined,
        };

        setTasks([createdTask, ...tasks]);
        setNewTaskText('');
        setNewTaskCategory(UNCATEGORIZED_ID);
        setNewTaskIsHabit(false);
        setNewTaskDueDate('');
        setNewTaskPriority(Priority.None);
        setNewTaskDescription('');
        setTaskModalOpen(false);
    };

    const handleSaveGoal = () => {
        if (!newGoalText.trim()) return;

        if (editingWeeklyGoalId) {
            setWeeklyGoals(weeklyGoals.map(goal => goal.id === editingWeeklyGoalId ? { ...goal, text: newGoalText.trim(), majorGoalId: newGoalMajorGoalId } : goal));
        } else {
            const newGoal: WeeklyGoal = { id: Date.now().toString(), text: newGoalText.trim(), completed: false, majorGoalId: newGoalMajorGoalId };
            setWeeklyGoals([...weeklyGoals, newGoal]);
        }

        setNewGoalText('');
        setGoalModalOpen(false);
        setNewGoalMajorGoalId(null);
        setEditingWeeklyGoalId(null);
    };
    
    const handleToggleGoal = (goalId: string) => {
        setWeeklyGoals(weeklyGoals.map(goal => goal.id === goalId ? { ...goal, completed: !goal.completed } : goal));
    };

    const handleDeleteGoal = (goalId: string) => {
        setWeeklyGoals(weeklyGoals.filter(goal => goal.id !== goalId));
    };

    const handleAddCategory = (name: string, color: string) => {
        const newCategory: Category = { id: Date.now().toString(), name, color };
        setCategories([...categories, newCategory]);
    };

    const handleUpdateCategory = (id: string, name: string, color: string) => {
        setCategories(categories.map(cat => cat.id === id ? { ...cat, name, color } : cat));
    };

    const handleDeleteCategory = (id: string) => setCategories(categories.filter(cat => cat.id !== id));
    
    const handleReorderCategories = (reorderedCategories: Category[]) => setCategories(reorderedCategories);

    const handleSaveMajorGoal = async () => {
        if (!newMajorGoalText.trim()) return;

        const parsedTarget = Number(newMajorGoalTarget);
        const targetValue = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : undefined;

        if (editingMajorGoalId) {
            setMajorGoals(prev => prev.map(goal => goal.id === editingMajorGoalId ? {
                ...goal,
                text: newMajorGoalText.trim(),
                targetValue,
                unit: newMajorGoalUnit.trim() || undefined,
            } : goal));

            setNewMajorGoalText('');
            setNewMajorGoalTarget('');
            setNewMajorGoalUnit('km');
            setEditingMajorGoalId(null);
            setMajorGoalModalOpen(false);
            return;
        }

        const parsedHabitIncrement = Number(newMajorGoalHabitIncrement);
        const habitIncrement = Number.isFinite(parsedHabitIncrement) && parsedHabitIncrement > 0 ? parsedHabitIncrement : undefined;

        let linkedHabitId: string | undefined;
        if (autoCreateHabitForMajorGoal && newMajorGoalHabitText.trim() && authToken) {
            const healthCategory = categories.find(c => c.name.toLowerCase() === 'saúde');
            const response = await fetch('/.netlify/functions/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    title: newMajorGoalHabitText.trim(),
                    description: null,
                    categoryId: healthCategory?.id || UNCATEGORIZED_ID,
                    dueDate: null,
                    priority: Priority.None,
                    isHabit: true,
                    checklist: [],
                }),
            });

            if (!response.ok) {
                alert('Não foi possível criar o hábito automático para a meta maior.');
                return;
            }

            const data = await response.json();
            const createdHabitTask: Task = {
                ...apiTaskToClientTask(data.task),
                categoryId: healthCategory?.id || UNCATEGORIZED_ID,
                isHabit: true,
                priority: Priority.None,
            };
            setTasks(prev => [createdHabitTask, ...prev]);
            linkedHabitId = createdHabitTask.id;
        }

        const newMajorGoal: MajorGoal = {
            id: Date.now().toString(),
            text: newMajorGoalText.trim(),
            targetValue,
            currentValue: 0,
            unit: newMajorGoalUnit.trim() || undefined,
            linkedHabitId,
            habitIncrement,
        };

        setMajorGoals(prev => [...prev, newMajorGoal]);

        if (linkedHabitId && habitIncrement) {
            const weeklyHabitGoal: WeeklyGoal = {
                id: `${Date.now()}-weekly`,
                text: `Cumprir ${(habitIncrement * 7).toLocaleString('pt-BR')} ${newMajorGoalUnit || ''} por semana (${newMajorGoalHabitText.trim()})`.trim(),
                completed: false,
                majorGoalId: newMajorGoal.id,
            };
            setWeeklyGoals(prev => [...prev, weeklyHabitGoal]);
        }

        setNewMajorGoalText('');
        setNewMajorGoalTarget('');
        setNewMajorGoalUnit('km');
        setAutoCreateHabitForMajorGoal(false);
        setNewMajorGoalHabitText('');
        setNewMajorGoalHabitIncrement('');
        setEditingMajorGoalId(null);
        setMajorGoalModalOpen(false);
    };

    const handleDeleteMajorGoal = (goalId: string) => {
        setWeeklyGoals(weeklyGoals.map(wg => wg.majorGoalId === goalId ? { ...wg, majorGoalId: null } : wg));
        setMajorGoals(majorGoals.filter(goal => goal.id !== goalId));
    };


    const openAddMajorGoalModal = () => {
        setEditingMajorGoalId(null);
        setNewMajorGoalText('');
        setNewMajorGoalTarget('');
        setNewMajorGoalUnit('km');
        setAutoCreateHabitForMajorGoal(false);
        setNewMajorGoalHabitText('');
        setNewMajorGoalHabitIncrement('');
        setMajorGoalModalOpen(true);
    };

    const openEditMajorGoalModal = (goal: MajorGoal) => {
        setEditingMajorGoalId(goal.id);
        setNewMajorGoalText(goal.text);
        setNewMajorGoalTarget(goal.targetValue?.toString() || '');
        setNewMajorGoalUnit(goal.unit || 'km');
        setAutoCreateHabitForMajorGoal(false);
        setNewMajorGoalHabitText('');
        setNewMajorGoalHabitIncrement('');
        setMajorGoalModalOpen(true);
    };

    const handleAddCalendarEvent = (event: Omit<CalendarEvent, 'id'>) => {
        const newEvent: CalendarEvent = {
            id: `cal-${Date.now()}`,
            ...event,
        };
        setCalendarEvents(prev => [...prev, newEvent]);
        return `Evento "${event.title}" adicionado ao calendário.`;
    };

    const handleUpdateCalendarEvent = (eventId: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => {
        let eventTitle = '';
        setCalendarEvents(prev => prev.map(e => {
            if (e.id === eventId) {
                eventTitle = updates.title || e.title;
                return { ...e, ...updates };
            }
            return e;
        }));
        return `Evento "${eventTitle}" atualizado.`;
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const completeTaskFromAi = ({ taskText }: { taskText: string }) => {
        const foundTask = tasks.find(t => t.text.toLowerCase().includes(taskText.toLowerCase()));
        if (foundTask) {
            handleToggleTask(foundTask.id);
            return `Tarefa "${foundTask.text}" marcada como concluída. Bom trabalho!`;
        }
        return `Não encontrei uma tarefa pendente que corresponda a "${taskText}".`;
    };
    
    const createRecurringExpenseFromAi = ({ description, amount, category, profileName, frequency, dayOfMonth, startDate }: { description: string, amount: number, category: string, profileName?: string, frequency: 'monthly' | 'yearly', dayOfMonth: number, startDate?: string }) => {
        const targetProfile = profiles.find(p => p.name.toLowerCase() === (profileName || '').toLowerCase()) || profiles[0];
        if (!targetProfile) return "Perfil financeiro não encontrado.";

        const categoryExists = categories.some(c => c.name.toLowerCase() === category.toLowerCase());
        if (!categoryExists) {
            handleAddCategory(category, 'bg-slate-500');
        }

        const newExpense: Omit<RecurringExpense, 'id'> = {
            description,
            amount,
            category,
            profileId: targetProfile.id,
            frequency,
            dayOfMonth,
            startDate: startDate || new Date().toISOString().split('T')[0],
        };
        handleAddRecurringExpense(newExpense);
        return `Despesa recorrente "${description}" de ${formatCurrency(amount)} criada com sucesso.`;
    };

    const createTaskFromAi = ({ text, isHabit = false, categoryName, priority = Priority.None, dueDate, description }: { text: string, isHabit?: boolean, categoryName?: string, priority?: Priority, dueDate?: string, description?: string }) => {
        let targetCategoryId = UNCATEGORIZED_ID;
        if (categoryName) {
            const foundCategory = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
            if (foundCategory) {
                targetCategoryId = foundCategory.id;
            } else { // Create category if it doesn't exist
                const newCategory: Category = { id: Date.now().toString(), name: categoryName, color: 'bg-slate-500' };
                setCategories(prev => [...prev, newCategory]);
                targetCategoryId = newCategory.id;
            }
        }
        
        const newTask: Task = {
            id: Date.now().toString(),
            text,
            categoryId: targetCategoryId,
            completed: false,
            isHabit,
            checklist: [],
            dueDate: dueDate || undefined,
            priority: isHabit ? Priority.None : priority,
            description: description || undefined,
        };
        setTasks(prev => [...prev, newTask]);
        return `Tarefa "${text}" criada com sucesso${categoryName ? ` na categoria ${categoryName}`: ''}.`;
    };
    
    const updateTaskFromAi = ({ taskText, newText, newCategoryName, newPriority, newDueDate, newDescription }: { taskText: string, newText?: string, newCategoryName?: string, newPriority?: Priority, newDueDate?: string, newDescription?: string }) => {
        const taskToUpdate = tasks.find(t => t.text.toLowerCase().includes(taskText.toLowerCase()));
        if (!taskToUpdate) {
            return `Não encontrei uma tarefa pendente que corresponda a "${taskText}".`;
        }

        let updatedTask = { ...taskToUpdate };
        let changes: string[] = [];

        if (newText) {
            updatedTask.text = newText;
            changes.push(`texto para "${newText}"`);
        }
        if (newCategoryName) {
            let categoryId = categories.find(c => c.name.toLowerCase() === newCategoryName.toLowerCase())?.id;
            if (!categoryId) {
                const newCategory: Category = { id: Date.now().toString(), name: newCategoryName, color: 'bg-slate-500' };
                setCategories(prev => [...prev, newCategory]);
                categoryId = newCategory.id;
            }
            updatedTask.categoryId = categoryId;
            changes.push(`categoria para "${newCategoryName}"`);
        }
        if (newPriority) {
            updatedTask.priority = newPriority;
            changes.push(`prioridade para "${newPriority}"`);
        }
        if (newDueDate !== undefined) { 
            updatedTask.dueDate = newDueDate || undefined;
            changes.push(`data de vencimento para "${newDueDate || 'nenhuma'}"`);
        }
        if (newDescription !== undefined) {
            updatedTask.description = newDescription;
            changes.push(`descrição atualizada`);
        }

        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        
        if (changes.length === 0) return `Nenhuma alteração foi solicitada para a tarefa "${taskText}".`;
        return `Tarefa "${taskText}" atualizada: ${changes.join(', ')}.`;
    };

    const createWeeklyGoalFromAi = ({ text, majorGoalName }: { text: string, majorGoalName?: string }) => {
        let targetMajorGoalId: string | null = null;
        if (majorGoalName) {
            const foundMajorGoal = majorGoals.find(mg => mg.text.toLowerCase() === majorGoalName.toLowerCase());
            if (foundMajorGoal) {
                targetMajorGoalId = foundMajorGoal.id;
            }
        }

        const newGoal: WeeklyGoal = { 
            id: Date.now().toString(), 
            text, 
            completed: false, 
            majorGoalId: targetMajorGoalId 
        };
        setWeeklyGoals(prev => [...prev, newGoal]);
        return `Meta semanal "${text}" criada com sucesso.`;
    };
    
    const handleAddEarningGoal = (description: string, targetAmount: number, period: GoalPeriod, profileId: string) => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (period) {
            case GoalPeriod.Weekly:
                const day = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - day + (day === 0 ? -6 : 1)); // start of week (monday)
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // end of week (sunday)
                break;
            case GoalPeriod.Monthly:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case GoalPeriod.Quarterly:
                const quarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), quarter * 3, 1);
                endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case GoalPeriod.Semiannual:
                const semester = Math.floor(now.getMonth() / 6);
                startDate = new Date(now.getFullYear(), semester * 6, 1);
                endDate = new Date(now.getFullYear(), semester * 6 + 6, 0);
                break;
            case GoalPeriod.Annual:
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
        }

        const newGoal: EarningGoal = { 
            id: `eg-${Date.now()}`, 
            description, 
            targetAmount, 
            period, 
            startDate: startDate.toISOString().split('T')[0], 
            endDate: endDate.toISOString().split('T')[0],
            profileId
        };
        setEarningGoals(prev => [...prev, newGoal]);
        return `Meta de ganho "${description}" criada com sucesso!`;
    };
    
    const handleAddSpendingGoal = (category: string, limit: number, profileId: string) => {
        const existingGoal = spendingGoals.find(g => g.category.toLowerCase() === category.toLowerCase() && g.profileId === profileId);
        if (existingGoal) {
            setSpendingGoals(prev => prev.map(g => g.id === existingGoal.id ? { ...g, limit } : g));
            return `Teto de gastos para "${category}" atualizado para ${formatCurrency(limit)}.`;
        } else {
            const newGoal: SpendingGoal = { id: `sg-${Date.now()}`, category, limit, profileId };
            setSpendingGoals(prev => [...prev, newGoal]);
            return `Teto de gastos de ${formatCurrency(limit)} para "${category}" criado.`;
        }
    };

    const handleDeleteSpendingGoal = (goalId: string) => {
        setSpendingGoals(prev => prev.filter(g => g.id !== goalId));
    };
    
    const handleLinkFinancialGoalToTasks = (earningGoalDescription: string) => {
        const goalToLink = earningGoals.find(g => g.description.toLowerCase().includes(earningGoalDescription.toLowerCase()));
        if (!goalToLink) {
            return `Não encontrei a meta financeira "${earningGoalDescription}".`;
        }
        const newWeeklyGoal: WeeklyGoal = {
            id: `wg-link-${Date.now()}`,
            text: `Avançar na meta financeira: "${goalToLink.description}"`,
            completed: false,
            majorGoalId: null,
        };
        setWeeklyGoals(prev => [...prev, newWeeklyGoal]);
        return `Meta financeira vinculada com sucesso às suas Metas Semanais!`;
    };


    const handleConfirmPurchase = (pendingTx: PendingPurchase) => {
        let targetProfileId = profiles[0]?.id;
        if (pendingTx.profileName) {
            const foundProfile = profiles.find(p => p.name.toLowerCase() === pendingTx.profileName.toLowerCase());
            if (foundProfile) targetProfileId = foundProfile.id;
        }
        if (!targetProfileId) return;

        const foundAccount = bankAccounts.find(b => b.name.toLowerCase() === pendingTx.bankAccountName?.toLowerCase() && b.profileId === targetProfileId);
        let targetBankAccountId = foundAccount?.id;

        const newTransactions: Transaction[] = [];
        const transactionIds: string[] = [];
        const purchaseDate = pendingTx.date || new Date().toISOString().split('T')[0];

        if (pendingTx.paymentMethod === PaymentMethod.CreditCard && pendingTx.installments && pendingTx.installments.total > 1) {
            const installmentAmount = pendingTx.amount / pendingTx.installments.total;
            for (let i = 1; i <= pendingTx.installments.total; i++) {
                const installmentDate = new Date(purchaseDate + 'T00:00:00');
                installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
                
                const newTx: Transaction = {
                    id: `t${Date.now()}-${i}`,
                    description: `${pendingTx.description} (${i}/${pendingTx.installments.total})`,
                    amount: installmentAmount,
                    type: 'expense',
                    date: installmentDate.toISOString().split('T')[0],
                    profileId: targetProfileId,
                    category: pendingTx.category,
                    paymentMethod: pendingTx.paymentMethod,
                    bankAccountId: targetBankAccountId,
                    installments: { current: i, total: pendingTx.installments.total }
                };
                newTransactions.push(newTx);
                transactionIds.push(newTx.id);
            }
        } else {
            const newTx: Transaction = {
                id: `t${Date.now()}`,
                description: pendingTx.description,
                amount: pendingTx.amount,
                type: 'expense',
                date: purchaseDate,
                profileId: targetProfileId,
                category: pendingTx.category,
                paymentMethod: pendingTx.paymentMethod,
                bankAccountId: targetBankAccountId,
            };
            newTransactions.push(newTx);
            transactionIds.push(newTx.id);
        }
        
        let newPurchaseId: string | undefined;
        if (pendingTx.items && pendingTx.storeName) {
            const newPurchase: Purchase = {
                id: `pur-${Date.now()}`,
                storeName: pendingTx.storeName,
                date: purchaseDate,
                totalAmount: pendingTx.amount,
                items: pendingTx.items.map(item => ({...item, id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`})),
                transactionIds: transactionIds,
            };
            setPurchases(prev => [newPurchase, ...prev]);
            newPurchaseId = newPurchase.id;
            newTransactions.forEach(tx => tx.purchaseId = newPurchaseId);
        }

        setTransactions(prev => [...newTransactions, ...prev]);

        if (foundAccount && foundAccount.type === 'Cartão de Crédito' && pendingTx.type === 'expense') {
            const currentUsed = foundAccount.creditUsed || 0;
            const updatedAccount = { ...foundAccount, creditUsed: currentUsed + pendingTx.amount };
            setBankAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
        }
        
        setChatMessages(prev => prev.map(msg => 
            msg.pendingPurchase?.id === pendingTx.id 
            ? { ...msg, text: `${msg.text}\n\n✅ Transação registrada com sucesso!`, pendingPurchase: undefined } 
            : msg
        ));
    };

    const handleCancelPurchase = (transactionId: string) => {
        setChatMessages(prev => prev.map(msg => 
            msg.pendingPurchase?.id === transactionId 
            ? { ...msg, text: `${msg.text}\n\n❌ Registro cancelado.`, pendingPurchase: undefined } 
            : msg
        ));
    };

    const handleEditPurchase = (transactionId: string) => {
        setChatMessages(prev => prev.map(msg => 
            msg.pendingPurchase?.id === transactionId 
            ? { ...msg, pendingPurchase: undefined } 
            : msg
        ));
        setChatMessages(prev => [...prev, { role: 'model', text: 'Entendido. Por favor, me diga o que precisa ser corrigido na transação.' }]);
    };
    
    const handleConfirmInvestment = (pendingInv: PendingInvestment) => {
        const profile = profiles.find(p => p.name.toLowerCase() === (pendingInv.profileName || profiles[0].name).toLowerCase()) || profiles[0];
        const fund = investmentFunds.find(f => f.name.toLowerCase() === pendingInv.fundName.toLowerCase());
        
        if (profile && fund) {
            handleInvest(pendingInv.amount, fund.id, profile.id);
            setChatMessages(prev => prev.map(msg => 
                msg.pendingInvestment?.id === pendingInv.id 
                ? { ...msg, text: `${msg.text}\n\n✅ Investimento registrado com sucesso!`, pendingInvestment: undefined } 
                : msg
            ));
        }
    };
    
    const handleCancelInvestment = (investmentId: string) => {
        setChatMessages(prev => prev.map(msg => 
            msg.pendingInvestment?.id === investmentId
            ? { ...msg, text: `${msg.text}\n\n❌ Registro cancelado.`, pendingInvestment: undefined } 
            : msg
        ));
    };


    const handleAiRequest = async (prompt: string, history: ChatMessage[], options: { media?: { mimeType: string; data: string; }, isThinkingMode?: boolean, isFastMode?: boolean, isImageGeneration?: boolean, imageEditing?: boolean, imageSize?: '1K' | '2K' | '4K', aspectRatio?: string }) => {
        setIsAiLoading(true);
        const { media, isThinkingMode, isFastMode, isImageGeneration, imageEditing, imageSize, aspectRatio } = options;
        
        let contextualPrompt = prompt;
        const searchKeywords = ['pesquisar tarefa', 'encontrar tarefa', 'o que eu completei', 'o que eu tenho pendente', 'quanto gastei', 'resumo financeiro', 'relatório'];

        if (searchKeywords.some(kw => prompt.toLowerCase().includes(kw))) {
            const allTasks = [...tasks, ...completedTasks];
            const taskContext = allTasks.map(t => `- ${t.text} (Status: ${t.completed ? 'Concluída' : 'Pendente'}, Categoria: ${categories.find(c => c.id === t.categoryId)?.name || 'N/A'})`).join('\n');
            const financeContext = transactions.map(t => `- ${t.description}: ${formatCurrency(t.amount)} (${t.type === 'income' ? 'Entrada' : 'Saída'}) em ${new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}`).join('\n');
            contextualPrompt = `Com base nos seguintes dados, responda à pergunta do usuário.\n\n== DADOS DE TAREFAS ==\n${taskContext}\n\n== DADOS FINANCEIROS ==\n${financeContext}\n\n== PERGUNTA ==\n${prompt}`;
        }

        try {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if ((isImageGeneration) && !hasKey) {
                 await (window as any).aistudio.openSelectKey();
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const proposeTransactionDeclaration: FunctionDeclaration = {
                name: 'proposeTransaction',
                description: 'Propõe o registro de uma nova transação financeira simples (entrada ou saída) que não seja uma compra detalhada com múltiplos itens.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: 'Descrição da transação. Ex: "Almoço", "Bônus recebido"' },
                        amount: { type: Type.NUMBER, description: 'Valor da transação.' },
                        type: { type: Type.STRING, enum: ['income', 'expense'], description: 'O tipo de transação: "income" para entrada, "expense" para saída.' },
                        category: { type: Type.STRING, description: 'A categoria da transação. Ex: "Alimentação", "Salário"' },
                        paymentMethod: { type: Type.STRING, enum: Object.values(PaymentMethod), description: 'O método de pagamento.' },
                        bankAccountName: { type: Type.STRING, description: 'O nome da conta ou cartão de crédito usado.' },
                        date: { type: Type.STRING, description: 'A data da transação no formato AAAA-MM-DD. O padrão é a data de hoje se não for fornecido.' },
                    },
                    required: ['description', 'amount', 'type'],
                }
            };

             const proposePurchaseDeclaration: FunctionDeclaration = {
                name: 'proposePurchase',
                description: 'Propõe o registro de uma nova compra, seja um item único ou múltiplos itens (como em um supermercado). Se os detalhes não forem fornecidos, use os parâmetros para perguntar ao usuário.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: 'Descrição geral da compra. Ex: "Compras do mês", "Roupa nova"' },
                        amount: { type: Type.NUMBER, description: 'Valor total da compra.' },
                        storeName: { type: Type.STRING, description: 'Nome da loja ou site onde a compra foi feita. Ex: "Supermercado XYZ", "Amazon"' },
                        paymentMethod: { type: Type.STRING, enum: Object.values(PaymentMethod), description: 'O método de pagamento.' },
                        bankAccountName: { type: Type.STRING, description: 'O nome da conta ou cartão de crédito usado.' },
                        installments: {
                            type: Type.OBJECT,
                            description: 'Detalhes do parcelamento, se houver.',
                            properties: {
                                total: { type: Type.NUMBER, description: 'O número total de parcelas. Ex: 3' }
                            }
                        },
                        items: {
                            type: Type.ARRAY,
                            description: 'Lista de itens comprados. Essencial para compras de mercado.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING, description: 'Nome do produto. Ex: "Picanha", "Leite Integral"' },
                                    brand: { type: Type.STRING, description: 'Marca do produto. Ex: "Friboi", "Italac"' },
                                    quantity: { type: Type.NUMBER, description: 'Quantidade de unidades.' },
                                    unit: { type: Type.STRING, enum: Object.values(PurchaseItemUnit), description: 'A unidade de medida. Ex: "kg", "un", "L"' },
                                    weight: { type: Type.NUMBER, description: 'O peso do item, se a unidade for "kg" ou "g". Ex: 1.2' },
                                    unitPrice: { type: Type.NUMBER, description: 'Preço por unidade ou por quilo/litro.' },
                                    totalPrice: { type: Type.NUMBER, description: 'Preço total para este item (quantidade * preço unitário).' }
                                },
                                required: ['name', 'quantity', 'unit', 'totalPrice']
                            }
                        }
                    },
                    required: ['description', 'amount'],
                },
            };

            const createRecurringExpenseDeclaration: FunctionDeclaration = {
                name: 'createRecurringExpense',
                description: 'Cria uma nova despesa recorrente (mensal ou anual).',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: 'A descrição da despesa. Ex: "Mensalidade da academia"' },
                        amount: { type: Type.NUMBER, description: 'O valor da despesa.' },
                        category: { type: Type.STRING, description: 'A categoria da despesa.' },
                        frequency: { type: Type.STRING, enum: ['monthly', 'yearly'], description: 'A frequência do gasto.' },
                        dayOfMonth: { type: Type.NUMBER, description: 'O dia do mês que a despesa ocorre. Ex: 10' },
                        startDate: { type: Type.STRING, description: 'A data de início no formato AAAA-MM-DD.' },
                    },
                    required: ['description', 'amount', 'category', 'frequency', 'dayOfMonth'],
                }
            };
            
            const completeTaskDeclaration: FunctionDeclaration = {
                name: 'completeTask',
                description: 'Marca uma tarefa pendente como concluída.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        taskText: { type: Type.STRING, description: 'O texto ou parte do texto da tarefa a ser concluída. Ex: "Comprar leite"' },
                    },
                    required: ['taskText'],
                }
            };
            
            const updateTaskDeclaration: FunctionDeclaration = {
                name: 'updateTask',
                description: 'Modifica uma tarefa existente. Use o texto da tarefa para identificá-la.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        taskText: { type: Type.STRING, description: 'O texto da tarefa a ser modificada.' },
                        newText: { type: Type.STRING, description: 'O novo texto para a tarefa.' },
                        newCategoryName: { type: Type.STRING, description: 'O novo nome da categoria.' },
                        newPriority: { type: Type.STRING, enum: Object.values(Priority), description: 'A nova prioridade.' },
                        newDueDate: { type: Type.STRING, description: 'A nova data de vencimento (AAAA-MM-DD).' },
                        newDescription: { type: Type.STRING, description: 'A nova descrição detalhada para a tarefa.' },
                    },
                    required: ['taskText'],
                },
            };

            const createTaskDeclaration: FunctionDeclaration = {
              name: 'createTask',
              description: 'Cria uma nova tarefa ou um novo hábito na rotina.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'A descrição da tarefa. Ex: "Comprar leite"' },
                  isHabit: { type: Type.BOOLEAN, description: 'Se a tarefa é um hábito recorrente (tarefa de rotina).' },
                  categoryName: { type: Type.STRING, description: 'O nome da categoria para a tarefa. Ex: "Trabalho", "Pessoal".' },
                  priority: { type: Type.STRING, enum: Object.values(Priority), description: 'A prioridade da tarefa.' },
                  dueDate: { type: Type.STRING, description: 'A data de vencimento da tarefa no formato AAAA-MM-DD.' },
                  description: { type: Type.STRING, description: 'Uma descrição mais detalhada da tarefa.' },
                },
                required: ['text'],
              },
            };

            const proposeInvestmentDeclaration: FunctionDeclaration = {
                name: 'proposeInvestment',
                description: 'Propõe o registro de uma nova aplicação de investimento. Isso deduz o valor do fluxo de caixa e o adiciona ao portfólio de investimentos.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.NUMBER, description: 'O valor a ser investido.' },
                        fundName: { type: Type.STRING, description: 'O nome do fundo de investimento onde o dinheiro foi aplicado. Ex: "Tesouro Selic", "Bitcoin".' },
                        date: { type: Type.STRING, description: 'A data da aplicação no formato AAAA-MM-DD. O padrão é a data de hoje se não for fornecido.' },
                        profileName: { type: Type.STRING, description: 'O nome do perfil financeiro ao qual este investimento pertence.' },
                    },
                    required: ['amount', 'fundName'],
                },
            };

            const createWeeklyGoalDeclaration: FunctionDeclaration = {
              name: 'createWeeklyGoal',
              description: 'Cria uma nova meta semanal.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: 'A descrição da meta semanal. Ex: "Ir à academia 3 vezes"' },
                  majorGoalName: { type: Type.STRING, description: 'O nome da meta maior à qual esta meta semanal está associada (opcional).' },
                },
                required: ['text'],
              },
            };

            const createEarningGoalDeclaration: FunctionDeclaration = {
                name: 'createEarningGoal',
                description: 'Cria uma nova meta de ganhos financeiros para um período específico e um perfil.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING, description: 'A descrição da meta. Ex: "Ganhar R$ 500 com freelancing"' },
                        targetAmount: { type: Type.NUMBER, description: 'O valor alvo a ser ganho.' },
                        period: { type: Type.STRING, enum: Object.values(GoalPeriod), description: 'O período da meta: Semanal, Mensal, Trimestral, Semestral, Anual.' },
                        profileName: { type: Type.STRING, description: 'O nome do perfil financeiro para o qual esta meta será criada.' },
                    },
                    required: ['description', 'targetAmount', 'period'],
                }
            };

            const createSpendingGoalDeclaration: FunctionDeclaration = {
                name: 'createSpendingGoal',
                description: 'Define ou atualiza um teto de gastos (orçamento) para uma categoria específica em um perfil.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        category: { type: Type.STRING, description: 'A categoria de despesa para a qual o teto será definido. Ex: "Alimentação", "Lazer".' },
                        limit: { type: Type.NUMBER, description: 'O valor máximo a ser gasto na categoria por mês.' },
                        profileName: { type: Type.STRING, description: 'O nome do perfil financeiro para o qual este teto de gastos será criado.' },
                    },
                    required: ['category', 'limit'],
                }
            };
            
            const linkFinancialGoalToTasksDeclaration: FunctionDeclaration = {
                name: 'linkFinancialGoalToTasks',
                description: 'Cria uma meta semanal de produtividade a partir de uma meta financeira de ganho existente.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        earningGoalDescription: { type: Type.STRING, description: 'A descrição da meta de ganho a ser vinculada. Ex: "Ganhar R$ 500 com freelancing".' },
                    },
                    required: ['earningGoalDescription'],
                }
            };
            
            const createCalendarEventDeclaration: FunctionDeclaration = {
                name: 'createCalendarEvent',
                description: 'Cria um novo evento no calendário do usuário.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: 'O título do evento.' },
                        date: { type: Type.STRING, description: 'A data do evento no formato AAAA-MM-DD.' },
                        startTime: { type: Type.STRING, description: 'A hora de início no formato HH:MM (24h).' },
                        endTime: { type: Type.STRING, description: 'A hora de término no formato HH:MM (24h).' },
                        description: { type: Type.STRING, description: 'Uma descrição ou notas para o evento.' },
                    },
                    required: ['title', 'date'],
                },
            };

            const updateCalendarEventDeclaration: FunctionDeclaration = {
                name: 'updateCalendarEvent',
                description: 'Atualiza um evento existente no calendário.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        eventTitleToFind: { type: Type.STRING, description: 'O título do evento que precisa ser atualizado.' },
                        newTitle: { type: Type.STRING, description: 'O novo título para o evento.' },
                        newDate: { type: Type.STRING, description: 'A nova data para o evento (AAAA-MM-DD).' },
                        newStartTime: { type: Type.STRING, description: 'A nova hora de início (HH:MM).' },
                        newEndTime: { type: Type.STRING, description: 'A nova hora de término (HH:MM).' },
                        newDescription: { type: Type.STRING, description: 'A nova descrição.' },
                    },
                    required: ['eventTitleToFind'],
                },
            };


            const historyContents: Content[] = history
                .filter(msg => msg.role === 'user' || (msg.role === 'model' && !msg.pendingPurchase && !msg.pendingInvestment))
                .map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.text }]
                }));

            let userPromptText = contextualPrompt;
            if (media) {
                 userPromptText = prompt || "Analise esta imagem. Se for uma nota fiscal ou recibo, extraia os detalhes da compra. Caso contrário, descreva o que você vê.";
            }

            const currentParts: any[] = [{ text: userPromptText }];
            if (media) currentParts.unshift({ inlineData: { mimeType: media.mimeType, data: media.data } });
            
            const finalContents: Content[] = [ ...historyContents, { role: 'user', parts: currentParts }];
            
            let model: string;
            
            const categoryNames = categories
                .map(c => c.name)
                .filter(name => name !== 'Sem Categoria')
                .join(', ');

            let baseSystemInstruction = `${assistantInstruction}. Você é um especialista em finanças pessoais e produtividade. Sua missão é ajudar o usuário a atingir a independência financeira através de metas claras e educação financeira. Ao ser solicitado, guie o usuário na criação de metas de ganhos (semanal, mensal, etc.) e tetos de gastos por categoria. Sugira orçamentos com base nos rendimentos do usuário, se essa informação estiver disponível no contexto. Ofereça dicas de investimentos e boas práticas financeiras. Você pode criar, atualizar, e vincular metas financeiras às metas de produtividade (semanais/maiores). Além disso, você continua com suas habilidades de gerenciar tarefas e registrar transações. As categorias de tarefas disponíveis são: ${categoryNames}. Se o usuário pedir uma sugestão de categoria para uma tarefa, analise o texto da tarefa e sugira a categoria mais apropriada dentre as disponíveis. Se o usuário pedir para criar uma tarefa ou meta sem fornecer todos os detalhes, faça perguntas para obter as informações necessárias antes de chamar a função. Para qualquer ação financeira, sempre proponha a ação para confirmação do usuário. Se uma imagem for um recibo, extraia os detalhes e use a função 'proposePurchase'.`;

            let config: any = {
                systemInstruction: baseSystemInstruction,
                tools: [{ functionDeclarations: [proposePurchaseDeclaration, proposeTransactionDeclaration, createTaskDeclaration, updateTaskDeclaration, createWeeklyGoalDeclaration, proposeInvestmentDeclaration, createRecurringExpenseDeclaration, completeTaskDeclaration, createEarningGoalDeclaration, createSpendingGoalDeclaration, linkFinancialGoalToTasksDeclaration, createCalendarEventDeclaration, updateCalendarEventDeclaration] }],
            };

            const webSearchKeywords = ['notícias', 'preço de', 'quem ganhou', 'o que aconteceu', 'hoje'];
            const mapKeywords = ['onde', 'perto de', 'restaurantes', 'lugares para', 'como chegar'];
            
            if(isFastMode) {
                model = 'gemini-flash-lite-latest';
            } else if (isImageGeneration) {
                model = 'gemini-3-pro-image-preview';
                config = { ...config, imageConfig: { imageSize: imageSize || '1K', aspectRatio: aspectRatio || '1:1' }, tools: [] };
            } else if (imageEditing) {
                model = 'gemini-2.5-flash-image';
                config.tools = [];
            } else if (media) {
                model = 'gemini-3-pro-preview'; // Vision model for receipt analysis
            } else if (webSearchKeywords.some(kw => prompt.toLowerCase().includes(kw))) {
                model = 'gemini-3-flash-preview';
                config.tools.push({ googleSearch: {} });
            } else if (mapKeywords.some(kw => prompt.toLowerCase().includes(kw))) {
                model = 'gemini-3-flash-preview';
                config.tools.push({ googleMaps: {} });
            } else if (isThinkingMode) {
                model = 'gemini-3-pro-preview';
                config = { ...config, thinkingConfig: { thinkingBudget: 32768 } };
            } else {
                 model = 'gemini-3-pro-preview';
            }

            const response = await ai.models.generateContent({ model, contents: finalContents, config });
            
            const call = response.functionCalls?.[0];

            if (call?.name === 'proposePurchase' || call?.name === 'proposeTransaction') {
                const data = call.args as Omit<PendingPurchase, 'id'>;
                const confirmationId = `tx-${Date.now()}`;
                
                 let confirmationText = `Você gostaria de registrar a seguinte transação?\n\n- **O quê**: ${data.description}\n- **Valor**: ${formatCurrency(data.amount)} (${data.type === 'income' ? 'Entrada' : 'Saída'})\n- **Onde**: ${data.storeName || 'Não especificado'}\n- **Data**: ${data.date ? new Date(data.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Hoje'}\n- **Pagamento**: ${data.paymentMethod || 'Não especificado'}${data.bankAccountName ? ` (${data.bankAccountName})` : ''}`;
                if (data.installments) {
                    confirmationText += `\n- **Parcelamento**: ${data.installments.total}x de ${formatCurrency(data.amount / data.installments.total)}`;
                }
                 if(data.items && data.items.length > 0) {
                    confirmationText += "\n\n**Itens:**\n" + data.items.map(item => `- ${item.name} (${item.quantity} ${item.unit}): ${formatCurrency(item.totalPrice)}`).join('\n');
                }

                const confirmationMessage: ChatMessage = {
                    role: 'model',
                    text: confirmationText,
                    pendingPurchase: { id: confirmationId, ...data }
                };
                setChatMessages(prev => [...prev, confirmationMessage]);
            } else if (call?.name === 'proposeInvestment') {
                 const investmentData = call.args as { amount: number; fundName: string; date?: string; profileName?: string; };
                const foundFund = investmentFunds.find(f => f.name.toLowerCase().includes(investmentData.fundName.toLowerCase()));

                if (!foundFund) {
                    setChatMessages(prev => [...prev, { role: 'model', text: `Não encontrei o fundo de investimento "${investmentData.fundName}". Você pode cadastrá-lo na seção de investimentos.` }]);
                } else {
                    const confirmationId = `inv-conf-${Date.now()}`;
                    const confirmationMessage: ChatMessage = {
                        role: 'model',
                        text: `Você confirma a aplicação de ${formatCurrency(investmentData.amount)} em ${foundFund.name}?`,
                        pendingInvestment: {
                            id: confirmationId,
                            amount: investmentData.amount,
                            fundName: foundFund.name,
                            date: investmentData.date,
                            profileName: investmentData.profileName,
                        }
                    };
                    setChatMessages(prev => [...prev, confirmationMessage]);
                }
            } else if (call?.name === 'createTask') {
                const resultText = createTaskFromAi(call.args as any);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'updateTask') {
                const resultText = updateTaskFromAi(call.args as any);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'createWeeklyGoal') {
                const resultText = createWeeklyGoalFromAi(call.args as any);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'completeTask') {
                const resultText = completeTaskFromAi(call.args as any);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'createRecurringExpense') {
                const resultText = createRecurringExpenseFromAi(call.args as any);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'createEarningGoal') {
                const { description, targetAmount, period, profileName } = call.args;
                const targetProfile = profiles.find(p => p.name.toLowerCase() === (profileName as string || '').toLowerCase()) || profiles[0];
                const resultText = handleAddEarningGoal(description as string, targetAmount as number, period as GoalPeriod, targetProfile.id);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'createSpendingGoal') {
                const { category, limit, profileName } = call.args;
                const targetProfile = profiles.find(p => p.name.toLowerCase() === (profileName as string || '').toLowerCase()) || profiles[0];
                const resultText = handleAddSpendingGoal(category as string, limit as number, targetProfile.id);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'linkFinancialGoalToTasks') {
                const { earningGoalDescription } = call.args;
                const resultText = handleLinkFinancialGoalToTasks(earningGoalDescription as string);
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'createCalendarEvent') {
                const event = call.args as Omit<CalendarEvent, 'id' | 'color'>;
                const resultText = handleAddCalendarEvent({ ...event, color: 'bg-indigo-500' });
                setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
            } else if (call?.name === 'updateCalendarEvent') {
                const { eventTitleToFind, ...updates } = call.args;
                const eventToUpdate = calendarEvents.find(e => e.title.toLowerCase().includes((eventTitleToFind as string).toLowerCase()));
                if (eventToUpdate) {
                    const resultText = handleUpdateCalendarEvent(eventToUpdate.id, updates);
                    setChatMessages(prev => [...prev, { role: 'model', text: resultText }]);
                } else {
                    setChatMessages(prev => [...prev, { role: 'model', text: `Não encontrei um evento com o título parecido com "${eventTitleToFind}".` }]);
                }
            } else if (isImageGeneration || imageEditing) {
                const imagePart = response.candidates?.[0]?.content.parts.find(p => p.inlineData);
                if (imagePart?.inlineData) {
                    const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                    setChatMessages(prev => [...prev, { role: 'model', text: prompt, imageUrl }]);
                } else {
                    setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Não foi possível gerar a imagem." }]);
                }
            } else {
                const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
                    title: chunk.web?.title || chunk.maps?.title || 'Fonte',
                    uri: chunk.web?.uri || chunk.maps?.uri || '#',
                })) || [];
                setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Não entendi, pode repetir?", groundingChunks }]);
            }

        } catch (error: any) {
            console.error("Erro ao comunicar com a IA:", error);
            const errorMessage = error.message?.includes('API key not valid') 
                ? "Sua chave de API não é válida. Por favor, verifique-a nas configurações do AI Studio."
                : "Desculpe, ocorreu um erro ao processar sua solicitação.";
            setChatMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleNewMessage = (message: ChatMessage) => setChatMessages(prev => [...prev, message]);

    const openAddWeeklyGoalModal = (majorGoalId: string | null = null) => {
        setEditingWeeklyGoalId(null);
        setNewGoalText('');
        setNewGoalMajorGoalId(majorGoalId);
        setGoalModalOpen(true);
    };

    const openEditWeeklyGoalModal = (goal: WeeklyGoal) => {
        setEditingWeeklyGoalId(goal.id);
        setNewGoalText(goal.text);
        setNewGoalMajorGoalId(goal.majorGoalId || null);
        setGoalModalOpen(true);
    };

    const handleDragStart = (taskId: string) => setDraggedTaskId(taskId);
    const handleDragOver = (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        if (draggedTaskId && draggedTaskId !== taskId) {
            setDragOverTaskId(taskId);
        }
    };
    const handleDragEnd = () => {
        setDraggedTaskId(null);
        setDragOverTaskId(null);
    };
    const handleDrop = (dropTargetId: string) => {
        if (!draggedTaskId || draggedTaskId === dropTargetId) {
            handleDragEnd();
            return;
        }

        const reorder = (list: Task[]) => {
            const draggedIndex = list.findIndex(t => t.id === draggedTaskId);
            if (draggedIndex === -1) return list;

            const dropIndex = list.findIndex(t => t.id === dropTargetId);
            if (dropIndex === -1) return list;
            
            const reorderedList = [...list];
            const [draggedItem] = reorderedList.splice(draggedIndex, 1);
            reorderedList.splice(dropIndex, 0, draggedItem);
            return reorderedList;
        };
        
        setTasks(prevTasks => reorder(prevTasks));
        handleDragEnd();
    };


    const filteredTasks = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let baseTasks: Task[];

        switch (currentView) {
            case View.Today:
                baseTasks = tasks.filter(task => !task.isHabit && (task.dueDate === today || !task.dueDate));
                break;
// fix: Replaced View.Routine with View.Habits as 'Routine' does not exist in the enum.
            case View.Habits:
                baseTasks = tasks.filter(task => task.isHabit);
                break;
            case View.Category:
                baseTasks = tasks.filter(task => task.categoryId === selectedCategoryId);
                break;
            default:
                return [];
        }

// fix: Replaced View.Routine with View.Habits as 'Routine' does not exist in the enum.
        if (priorityFilter === 'Todas' || currentView === View.Habits) {
            return baseTasks;
        }
        return baseTasks.filter(task => (task.priority || Priority.None) === priorityFilter);
    }, [tasks, currentView, selectedCategoryId, priorityFilter]);

    const unassignedWeeklyGoals = useMemo(() => weeklyGoals.filter(g => !g.majorGoalId), [weeklyGoals]);
    
    const viewTitle = useMemo(() => {
        if (currentView === View.Category) {
            return categories.find(c => c.id === selectedCategoryId)?.name || 'Categoria';
        }
        return currentView;
    }, [currentView, selectedCategoryId, categories]);

    useEffect(() => {
        const lastReset = localStorage.getItem('lastHabitReset');
        const today = new Date().toISOString().split('T')[0];
        
        if (lastReset !== today) {
            // 1. Habits that were NOT completed yesterday (they are in the `tasks` list).
            const updatedTasks = tasks.map(task => {
                if (task.isHabit) {
                    // Streak broken.
                    return { ...task, streak: 0 };
                }
                return task;
            });
    
            // 2. Habits that WERE completed yesterday (they are in `completedTasks`).
            const habitsToReactivate = completedTasks.filter(task => task.isHabit);
            const otherCompletedTasks = completedTasks.filter(task => !task.isHabit);
    
            // Move them back to the main list for the new day, keeping their streak.
            const reactivatedHabits = habitsToReactivate.map(habit => {
                const { completedAt, ...rest } = habit;
                return {
                    ...rest,
                    completed: false,
                };
            });
    
            setTasks([...updatedTasks, ...reactivatedHabits]);
            setCompletedTasks(otherCompletedTasks);
    
            localStorage.setItem('lastHabitReset', today);
        }
    }, []);

    const handleLoginSuccess = (token: string) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        window.history.replaceState({}, '', '/');
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        window.history.replaceState({}, '', '/login');
    };

    if (!isAuthenticated) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.history.replaceState({}, '', '/login');
        }
        const storedAppColor = localStorage.getItem('appColor') || 'indigo';
        return <Auth onLoginSuccess={handleLoginSuccess} appColor={storedAppColor} />;
    }

    const renderContent = () => {
        switch (currentView) {
            case View.Finance:
                return ( <FinanceDashboard 
                    profiles={profiles} 
                    transactions={transactions} 
                    bankAccounts={bankAccounts} 
                    purchases={purchases} 
                    spendingGoals={spendingGoals}
                    earningGoals={earningGoals}
                    investments={investments}
                    investmentFunds={investmentFunds}
                    recurringExpenses={recurringExpenses}
                    categories={categories}
                    onAddProfile={handleAddProfile} 
                    onDeleteProfile={handleDeleteProfile} 
                    onAddBankAccount={handleAddBankAccount} 
                    onUpdateBankAccount={handleUpdateBankAccount} 
                    onDeleteBankAccount={handleDeleteBankAccount}
                    onInvest={handleInvest}
                    onAddInvestmentFund={handleAddInvestmentFund}
                    onAddRecurringExpense={handleAddRecurringExpense}
                    onUpdateRecurringExpense={handleUpdateRecurringExpense}
                    onDeleteRecurringExpense={handleDeleteRecurringExpense}
                    onAddCategory={handleAddCategory}
                    onAddSpendingGoal={handleAddSpendingGoal}
                    onDeleteSpendingGoal={handleDeleteSpendingGoal}
                    onAddEarningGoal={handleAddEarningGoal}
                    onLinkFinancialGoalToTasks={handleLinkFinancialGoalToTasks}
                /> );
            case View.Settings:
                return ( <Settings appColor={appColor} onAppColorChange={setAppColor} assistantName={assistantName} onAssistantNameChange={setAssistantName} assistantInstruction={assistantInstruction} onAssistantInstructionChange={setAssistantInstruction} isGoogleCalendarAuthorized={isGoogleCalendarAuthorized} onConnectGoogleCalendar={handleConnectGoogleCalendar} isGoogleTasksAuthorized={isGoogleTasksAuthorized} onConnectGoogleTasks={handleConnectGoogleTasks} accountInfo={accountInfo} onAccountInfoChange={setAccountInfo} /> );
            case View.History:
                const sortedCompletedTasks = [...completedTasks].sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

                const groupedTasks = sortedCompletedTasks.reduce((acc, task) => {
                    const dateKey = new Date(task.completedAt!).toISOString().split('T')[0];
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(task);
                    return acc;
                }, {} as Record<string, Task[]>);

                const getGroupDisplayName = (dateKey: string) => {
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(today.getDate() - 1);
                    const todayKey = today.toISOString().split('T')[0];
                    const yesterdayKey = yesterday.toISOString().split('T')[0];
            
                    if (dateKey === todayKey) return 'Hoje';
                    if (dateKey === yesterdayKey) return 'Ontem';
                    return new Date(dateKey + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
                };

                return (
                    <div>
                        {completedTasks.length === 0 ? (
                            <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                 <div className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"><TargetIcon/></div>
                                <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">Histórico Vazio</h3>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quando você completar uma tarefa, ela aparecerá aqui.</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.keys(groupedTasks).map(dateKey => (
                                    <div key={dateKey}>
                                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">{getGroupDisplayName(dateKey)}</h3>
                                        <div className="space-y-3">
                                            {groupedTasks[dateKey].map(task => (
                                                <div key={task.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center flex-grow min-w-0">
                                                        <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} className={`h-5 w-5 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-${appColor}-600 focus:ring-${appColor}-500 flex-shrink-0`} />
                                                        <p className="ml-4 text-slate-500 dark:text-slate-400 line-through truncate">{task.text}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
                                                         <select value={task.categoryId} onChange={(e) => handleUpdateTaskCategory(task.id, e.target.value)} onClick={(e) => e.stopPropagation()} className={`block w-32 rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-1.5`}>
                                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                                        </select>
                                                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"> <TrashIcon /> </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case View.WeeklyGoals:
                return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Metas Maiores</h2>
                            <button onClick={openAddMajorGoalModal} className={`flex items-center gap-2 text-${appColor}-600 hover:text-${appColor}-800 dark:text-${appColor}-400 dark:hover:text-${appColor}-300 font-semibold transition-colors`}> <FlagIcon /> Adicionar Meta Maior </button>
                        </div>
                        <div className="space-y-8">
                            {majorGoals.map(majorGoal => {
                                const relatedGoals = weeklyGoals.filter(wg => wg.majorGoalId === majorGoal.id);
                                const completedGoals = relatedGoals.filter(wg => wg.completed).length;
                                const hasNumericTarget = Boolean(majorGoal.targetValue && majorGoal.targetValue > 0);
                                const progress = hasNumericTarget
                                    ? Math.min(100, ((majorGoal.currentValue || 0) / (majorGoal.targetValue || 1)) * 100)
                                    : (relatedGoals.length > 0 ? (completedGoals / relatedGoals.length) * 100 : 0);
                                return (
                                    <div key={majorGoal.id} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{majorGoal.text}</h3>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditMajorGoalModal(majorGoal)} className={`text-slate-400 dark:text-slate-500 hover:text-${appColor}-600 dark:hover:text-${appColor}-400 transition-colors`}> <PencilIcon /> </button>
                                                <button onClick={() => handleDeleteMajorGoal(majorGoal.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"> <TrashIcon /> </button>
                                            </div>
                                        </div>
                                        {hasNumericTarget && (
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                                                {(majorGoal.currentValue || 0).toLocaleString('pt-BR')} {majorGoal.unit || ''} de {(majorGoal.targetValue || 0).toLocaleString('pt-BR')} {majorGoal.unit || ''}
                                                {majorGoal.habitIncrement ? ` • +${majorGoal.habitIncrement.toLocaleString('pt-BR')} ${majorGoal.unit || ''} por hábito concluído` : ''}
                                            </p>
                                        )}
                                        <ProgressBar progress={progress} appColor={appColor} />
                                        <div className="space-y-3 mt-4">
                                            {relatedGoals.map(goal => (
                                                <div key={goal.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                                    <div className="flex items-center">
                                                        <input type="checkbox" checked={goal.completed} onChange={() => handleToggleGoal(goal.id)} className={`h-5 w-5 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-${appColor}-600 focus:ring-${appColor}-500`} />
                                                        <label className={`ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300 ${goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>{goal.text}</label>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => openEditWeeklyGoalModal(goal)} className={`text-slate-400 dark:text-slate-500 hover:text-${appColor}-600 dark:hover:text-${appColor}-400 transition-colors`}> <PencilIcon /> </button>
                                                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"> <TrashIcon /> </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {relatedGoals.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma meta semanal adicionada a este objetivo.</p>}
                                        </div>
                                        <button onClick={() => openAddWeeklyGoalModal(majorGoal.id)} className={`mt-4 flex items-center gap-2 text-sm text-${appColor}-600 hover:text-${appColor}-800 dark:text-${appColor}-400 dark:hover:text-${appColor}-300 font-semibold transition-colors`}> <PlusIcon /> Adicionar Meta Semanal </button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-10">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Metas Semanais Avulsas</h2>
                            <div className="space-y-3">
                                {unassignedWeeklyGoals.map(goal => (
                                    <div key={goal.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center">
                                            <input type="checkbox" checked={goal.completed} onChange={() => handleToggleGoal(goal.id)} className={`h-5 w-5 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-${appColor}-600 focus:ring-${appColor}-500`} />
                                            <label className={`ml-3 block text-sm font-medium text-slate-700 dark:text-slate-300 ${goal.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>{goal.text}</label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEditWeeklyGoalModal(goal)} className={`text-slate-400 dark:text-slate-500 hover:text-${appColor}-600 dark:hover:text-${appColor}-400 transition-colors`}> <PencilIcon /> </button>
                                            <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"> <TrashIcon /> </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => openAddWeeklyGoalModal(null)} className={`mt-6 flex items-center gap-2 text-${appColor}-600 hover:text-${appColor}-800 dark:text-${appColor}-400 dark:hover:text-${appColor}-300 font-semibold transition-colors`}> <PlusIcon /> Adicionar Nova Meta </button>
                        </div>
                    </div>
                );
            
            default:
                return (
                    <>
                        <div className="space-y-4">
                            {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                <TaskItem key={task.id} task={task} category={categories.find(c => c.id === task.categoryId)} categories={categories} onToggle={handleToggleTask} onDelete={handleDeleteTask} onToggleSubtask={handleToggleSubtask} onAddSubtask={handleAddSubtask} onAddMultipleSubtasks={handleAddMultipleSubtasks} onUpdateDueDate={handleUpdateTaskDueDate} onUpdateCategory={handleUpdateTaskCategory} onUpdatePriority={handleUpdateTaskPriority} onUpdateDescription={handleUpdateTaskDescription} onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop} onDragEnd={handleDragEnd} isBeingDraggedOver={dragOverTaskId === task.id} appColor={appColor} />
                            )) : (
                                <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                    <div className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"><TargetIcon/></div>
                                    <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">Tudo limpo por aqui!</h3>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Adicione uma nova tarefa para começar.</p>
                                </div>
                            )}
                        </div>
                        {currentView === View.Today && (
                             <TodayDashboard
                                tasks={tasks}
                                completedTasks={completedTasks}
                                weeklyGoals={weeklyGoals}
                                calendarEvents={calendarEvents}
                                onAddCalendarEvent={(event) => handleAddCalendarEvent(event)}
                                isGoogleCalendarAuthorized={isGoogleCalendarAuthorized}
                                onConnectGoogleCalendar={handleConnectGoogleCalendar}
                                appColor={appColor}
                            />
                        )}
                    </>
                );
        }
    };

    return (
        <div className="relative h-screen w-screen flex bg-slate-100 dark:bg-slate-900 font-sans overflow-hidden">
            <Sidebar 
                categories={categories} 
                currentView={currentView} 
                onNavigate={handleViewChange} 
                selectedCategoryId={selectedCategoryId} 
                onManageCategories={handleManageCategories} 
                onAddNewCategory={handleAddNewCategory} 
                isCollapsed={isSidebarCollapsed} 
                onToggle={handleToggleSidebar} 
                isMobileMenuOpen={isMobileMenuOpen} 
                onCloseMobileMenu={() => setIsMobileMenuOpen(false)} 
                onReorderCategories={handleReorderCategories} 
                appColor={appColor}
                userName={accountInfo.fullName || 'Usuário'}
                userProfilePicture={accountInfo.profilePicture}
                onLogout={handleLogout}
            />
            <main className="flex-1 overflow-y-auto">
                {currentView !== View.Finance && currentView !== View.Settings &&
                    <Header title={viewTitle} onAddTask={() => setTaskModalOpen(true)} theme={theme} onThemeToggle={handleThemeToggle} onToggleMobileMenu={() => setIsMobileMenuOpen(true)} currentView={currentView} priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter} appColor={appColor} />
                }
                {currentView === View.Settings && <Header title="Configurações" onAddTask={() => {}} theme={theme} onThemeToggle={handleThemeToggle} onToggleMobileMenu={() => setIsMobileMenuOpen(true)} currentView={currentView} priorityFilter='Todas' onPriorityFilterChange={() => {}} appColor={appColor} /> }
                
                <div className={ ![View.Finance].includes(currentView) ? "p-4 sm:p-6 lg:p-8" : ""}>
                    {renderContent()}
                </div>
            </main>

            <FloatingAIAssistant 
                messages={chatMessages} 
                isLoading={isAiLoading} 
                onAiRequest={handleAiRequest} 
                onNewMessage={handleNewMessage} 
                assistantName={assistantName} 
                appColor={appColor} 
                onConfirmPurchase={handleConfirmPurchase} 
                onCancelPurchase={handleCancelPurchase} 
                onEditPurchase={handleEditPurchase}
                onConfirmInvestment={handleConfirmInvestment}
                onCancelInvestment={handleCancelInvestment}
            />

            <Modal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} title="Adicionar Nova Tarefa">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="task-text" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Tarefa</label>
                        <input type="text" id="task-text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: Fazer compras" />
                    </div>
                    <div>
                        <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Descrição (Opcional)</label>
                        <textarea id="task-description" rows={3} value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Adicione mais detalhes sobre a tarefa..."></textarea>
                    </div>
                    <div>
                        <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Categoria</label>
                        <select id="task-category" value={newTaskCategory} onChange={e => setNewTaskCategory(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Data de Vencimento (Opcional)</label>
                        <input type="date" id="task-due-date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                    </div>
                    {!newTaskIsHabit && (
                        <div>
                            <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Prioridade</label>
                            <select id="task-priority" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as Priority)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}>
                                {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="flex items-center">
                        <input id="is-habit" type="checkbox" checked={newTaskIsHabit} onChange={e => setNewTaskIsHabit(e.target.checked)} className={`h-4 w-4 rounded border-gray-300 text-${appColor}-600 focus:ring-${appColor}-500`} />
                        <label htmlFor="is-habit" className="ml-2 block text-sm text-gray-900 dark:text-slate-300">Marcar como Hábito/Rotina</label>
                    </div>
                </div>
                 <div className="mt-5 sm:mt-6">
                    <button type="button" onClick={handleAddTask} className={`inline-flex w-full justify-center rounded-md border border-transparent bg-${appColor}-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-${appColor}-500 focus:ring-offset-2 sm:text-sm`}> Adicionar Tarefa </button>
                </div>
            </Modal>
            
            <Modal isOpen={isGoalModalOpen} onClose={() => {
                setGoalModalOpen(false);
                setEditingWeeklyGoalId(null);
            }} title={editingWeeklyGoalId ? 'Editar Meta Semanal' : 'Adicionar Nova Meta Semanal'}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="goal-text" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Meta</label>
                        <input type="text" id="goal-text" value={newGoalText} onChange={e => setNewGoalText(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: Correr 5km" />
                    </div>
                    <div>
                        <label htmlFor="major-goal-select" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Meta Maior (Opcional)</label>
                        <select id="major-goal-select" value={newGoalMajorGoalId ?? ''} onChange={e => setNewGoalMajorGoalId(e.target.value || null)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}>
                            <option value="">Nenhuma</option>
                            {majorGoals.map(mg => <option key={mg.id} value={mg.id}>{mg.text}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="mt-5 sm:mt-6">
                    <button type="button" onClick={handleSaveGoal} className={`inline-flex w-full justify-center rounded-md border border-transparent bg-${appColor}-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-${appColor}-500 focus:ring-offset-2 sm:text-sm`}> {editingWeeklyGoalId ? 'Salvar Alterações' : 'Adicionar Meta'} </button>
                </div>
            </Modal>
            
            <Modal isOpen={isMajorGoalModalOpen} onClose={() => {
                setMajorGoalModalOpen(false);
                setEditingMajorGoalId(null);
            }} title={editingMajorGoalId ? 'Editar Meta Maior' : 'Adicionar Nova Meta Maior'}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="major-goal-text" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome da Meta</label>
                        <input type="text" id="major-goal-text" value={newMajorGoalText} onChange={e => setNewMajorGoalText(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: Correr 1000 km" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="major-goal-target" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Meta total (opcional)</label>
                            <input type="number" min="0" step="0.1" id="major-goal-target" value={newMajorGoalTarget} onChange={e => setNewMajorGoalTarget(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: 1000" />
                        </div>
                        <div>
                            <label htmlFor="major-goal-unit" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Unidade</label>
                            <input type="text" id="major-goal-unit" value={newMajorGoalUnit} onChange={e => setNewMajorGoalUnit(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: km" />
                        </div>
                    </div>

                    {!editingMajorGoalId && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300">
                            <input type="checkbox" checked={autoCreateHabitForMajorGoal} onChange={e => setAutoCreateHabitForMajorGoal(e.target.checked)} className={`h-4 w-4 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-${appColor}-600 focus:ring-${appColor}-500`} />
                            Criar hábito diário automático para evoluir esta meta
                        </label>

                        {autoCreateHabitForMajorGoal && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label htmlFor="major-goal-habit-text" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Nome do hábito</label>
                                    <input type="text" id="major-goal-habit-text" value={newMajorGoalHabitText} onChange={e => setNewMajorGoalHabitText(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: Correr 4 km" />
                                </div>
                                <div>
                                    <label htmlFor="major-goal-habit-increment" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Quanto essa conclusão soma na meta?</label>
                                    <input type="number" min="0" step="0.1" id="major-goal-habit-increment" value={newMajorGoalHabitIncrement} onChange={e => setNewMajorGoalHabitIncrement(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: 4" />
                                </div>
                            </div>
                        )}
                        </div>
                    )}
                </div>
                 <div className="mt-5 sm:mt-6">
                    <button type="button" onClick={handleSaveMajorGoal} className={`inline-flex w-full justify-center rounded-md border border-transparent bg-${appColor}-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-${appColor}-500 focus:ring-offset-2 sm:text-sm`}> {editingMajorGoalId ? 'Salvar Alterações' : 'Adicionar Meta Maior'} </button>
                </div>
            </Modal>
            
            <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setCategoryModalOpen(false)} categories={categories} onAddCategory={handleAddCategory} onUpdateCategory={handleUpdateCategory} onDeleteCategory={handleDeleteCategory} onReorderCategories={handleReorderCategories} initialIsAdding={startCategoryModalInAddMode} />
        </div>
    );
};

export default App;
    const openAddMajorGoalModal = () => {
        setEditingMajorGoalId(null);
        setNewMajorGoalText('');
        setNewMajorGoalTarget('');
        setNewMajorGoalUnit('km');
        setAutoCreateHabitForMajorGoal(false);
        setNewMajorGoalHabitText('');
        setNewMajorGoalHabitIncrement('');
        setMajorGoalModalOpen(true);
    };

    const openEditMajorGoalModal = (goal: MajorGoal) => {
        setEditingMajorGoalId(goal.id);
        setNewMajorGoalText(goal.text);
        setNewMajorGoalTarget(goal.targetValue?.toString() || '');
        setNewMajorGoalUnit(goal.unit || 'km');
        setAutoCreateHabitForMajorGoal(false);
        setNewMajorGoalHabitText('');
        setNewMajorGoalHabitIncrement('');
        setMajorGoalModalOpen(true);
    };
