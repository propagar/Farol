
import React from 'react';
import { PlusIcon, MoonIcon, SunIcon, Bars3Icon, FlagIcon } from './Icons';
import { View, Priority } from '../types';

interface HeaderProps {
    title: string;
    onAddTask: () => void;
    theme: string;
    onThemeToggle: () => void;
    onToggleMobileMenu: () => void;
    currentView: View;
    priorityFilter: Priority | 'Todas';
    onPriorityFilterChange: (value: Priority | 'Todas') => void;
    appColor: string;
}

const Header: React.FC<HeaderProps> = ({ title, onAddTask, theme, onThemeToggle, onToggleMobileMenu, currentView, priorityFilter, onPriorityFilterChange, appColor }) => {
    
    const showPriorityFilter = [View.Today, View.Category].includes(currentView);
    
    return (
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 p-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleMobileMenu}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors sm:hidden"
                    aria-label="Abrir menu"
                >
                    <Bars3Icon />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                 {showPriorityFilter && (
                    <div className="relative">
                        <label htmlFor="priority-filter" className="sr-only">Filtrar por prioridade</label>
                        <select
                            id="priority-filter"
                            value={priorityFilter}
                            onChange={(e) => onPriorityFilterChange(e.target.value as Priority | 'Todas')}
                            className={`appearance-none block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white dark:focus:bg-slate-600 focus:border-${appColor}-500 text-sm`}
                        >
                            <option value="Todas">Todas Prioridades</option>
                            {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700 dark:text-slate-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                 )}
                 <button
                    onClick={onThemeToggle}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
                >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <button
                    onClick={onAddTask}
                    className={`flex items-center gap-2 bg-${appColor}-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg shadow-sm hover:bg-${appColor}-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500`}
                >
                    <PlusIcon />
                    <span className="hidden sm:inline">Nova Tarefa</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
