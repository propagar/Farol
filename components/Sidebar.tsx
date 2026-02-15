

import React, { useState, useRef, useEffect } from 'react';
import { Category, View } from '../types';
import { HomeIcon, ListIcon, CalendarIcon, LighthouseIcon, CogIcon, ArchiveBoxIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, DragHandleIcon, PlusIcon, LighthouseMoneyIcon, ChevronDownIcon, UserCircleIcon, LogoutIcon } from './Icons';

interface SidebarProps {
    categories: Category[];
    currentView: View;
    selectedCategoryId: string | null;
    onNavigate: (view: View, categoryId?: string | null) => void;
    onManageCategories: () => void;
    onAddNewCategory: () => void;
    isCollapsed: boolean;
    onToggle: () => void;
    isMobileMenuOpen: boolean;
    onCloseMobileMenu: () => void;
    onReorderCategories: (reorderedCategories: Category[]) => void;
    appColor: string;
    userName: string;
    userProfilePicture?: string;
    onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    categories, 
    currentView, 
    selectedCategoryId, 
    onNavigate, 
    onManageCategories, 
    onAddNewCategory,
    isCollapsed, 
    onToggle,
    isMobileMenuOpen,
    onCloseMobileMenu,
    onReorderCategories,
    appColor,
    userName,
    userProfilePicture,
    onLogout
}) => {
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
    const [areCategoriesVisible, setAreCategoriesVisible] = useState(true);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleNavigation = (view: View, categoryId?: string | null) => {
        onNavigate(view, categoryId);
        onCloseMobileMenu();
    };

    const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLButtonElement>, id: string) => {
        e.preventDefault();
        if (draggedItemId && draggedItemId !== id) {
            setDragOverItemId(id);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLButtonElement>, dropTargetId: string) => {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === dropTargetId) return;

        const draggedIndex = categories.findIndex(c => c.id === draggedItemId);
        const dropIndex = categories.findIndex(c => c.id === dropTargetId);
        
        if (draggedIndex === -1 || dropIndex === -1) return;

        const reordered = [...categories];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);
        
        onReorderCategories(reordered);
        handleDragEnd();
    };
    
    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDragOverItemId(null);
    };
    
    const NavItem: React.FC<{
        icon: React.ReactNode;
        label: string;
        isActive: boolean;
        onClick: () => void;
        disabled?: boolean;
    }> = ({ icon, label, isActive, onClick, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            title={isCollapsed ? label : undefined}
            className={`flex items-center w-full text-left py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${isCollapsed ? 'justify-center' : 'px-4'} ${
                isActive
                    ? `bg-${appColor}-100 text-${appColor}-700 dark:bg-${appColor}-500/20 dark:text-${appColor}-300`
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <div className="w-5 h-5 flex-shrink-0">{icon}</div>
            {!isCollapsed && <span className="ml-3 whitespace-nowrap">{label}</span>}
        </button>
    );

    return (
        <>
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-20 sm:hidden" 
                    onClick={onCloseMobileMenu}
                    aria-hidden="true"
                ></div>
            )}
            <aside className={`
                fixed inset-y-0 left-0 z-30
                bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
                flex flex-col transition-transform duration-300 ease-in-out 
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                sm:relative sm:translate-x-0
                ${isCollapsed && !isMobileMenuOpen ? 'w-20 p-2' : 'w-64 p-4'}
            `}>
                <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center' : ''}`}>
                    <div className={`w-8 h-8 text-${appColor}-600 flex-shrink-0`}>
                        <LighthouseIcon />
                    </div>
                    {!isCollapsed && <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Farol</span>}
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="space-y-2 mb-8">
                        <NavItem icon={<HomeIcon />} label="Hoje" isActive={currentView === View.Today} onClick={() => handleNavigation(View.Today)} />
{/* fix: Replaced View.Routine with View.Habits as 'Routine' does not exist in the enum. */}
                        <NavItem icon={<ListIcon />} label="Rotina Diária" isActive={currentView === View.Habits} onClick={() => handleNavigation(View.Habits)} />
                        <NavItem icon={<CalendarIcon />} label="Metas Semanais" isActive={currentView === View.WeeklyGoals} onClick={() => handleNavigation(View.WeeklyGoals)} />
                        <NavItem icon={<ArchiveBoxIcon />} label="Histórico" isActive={currentView === View.History} onClick={() => handleNavigation(View.History)} />
                        <div className="px-4 my-4">
                            <div className="border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <NavItem icon={<LighthouseMoneyIcon />} label="Farol Finance" isActive={currentView === View.Finance} onClick={() => handleNavigation(View.Finance)} />
                    </div>
                    <div className="group">
                        {!isCollapsed && (
                             <div className="flex justify-between items-center mb-3">
                                <button onClick={() => setAreCategoriesVisible(!areCategoriesVisible)} className="flex items-center text-left group/title flex-grow">
                                    <h3 className="pl-4 pr-1 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Categorias</h3>
                                    <ChevronDownIcon className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${!areCategoriesVisible ? 'rotate-180' : ''}`} />
                                </button>
                                <button onClick={onManageCategories} className="p-1 mr-2 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-300" aria-label="Gerenciar categorias">
                                    <CogIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed || !areCategoriesVisible ? 'max-h-0 opacity-0' : 'max-h-screen opacity-100'}`}>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                <button
                                        key={cat.id}
                                        draggable={!isCollapsed}
                                        onDragStart={(e) => handleDragStart(e, cat.id)}
                                        onDragOver={(e) => handleDragOver(e, cat.id)}
                                        onDrop={(e) => handleDrop(e, cat.id)}
                                        onDragEnd={handleDragEnd}
                                        onDragLeave={() => setDragOverItemId(null)}
                                        onClick={() => handleNavigation(View.Category, cat.id)}
                                        title={isCollapsed ? cat.name : undefined}
                                        className={`
                                            group/item flex items-center w-full text-left py-2.5 rounded-lg text-sm font-medium transition-all duration-200 
                                            ${isCollapsed ? 'justify-center' : 'pl-4 pr-2'} 
                                            ${ currentView === View.Category && selectedCategoryId === cat.id
                                                ? `bg-${appColor}-100 text-${appColor}-700 dark:bg-${appColor}-500/20 dark:text-${appColor}-300`
                                                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
                                            }
                                            ${draggedItemId === cat.id ? 'opacity-50' : ''}
                                            ${dragOverItemId === cat.id ? `border-t-2 border-${appColor}-500` : 'border-t-2 border-transparent'}
                                        `}
                                    >
                                        {!isCollapsed && <span className="hidden sm:group-hover/item:inline-block cursor-move text-slate-400 dark:text-slate-500 mr-2 absolute left-1"><DragHandleIcon /></span>}
                                        <span className={`w-2.5 h-2.5 rounded-full ${cat.color} flex-shrink-0 transition-transform sm:group-hover/item:translate-x-6`}></span>
                                        {!isCollapsed && <span className={`ml-3 whitespace-nowrap transition-transform sm:group-hover/item:translate-x-6`}>{cat.name}</span>}
                                    </button>
                                ))}
                            </div>
                            {!isCollapsed && (
                                <button
                                    onClick={onAddNewCategory}
                                    className="flex items-center w-full text-left mt-3 py-2.5 px-4 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                                >
                                    <div className="w-5 h-5 flex-shrink-0"><PlusIcon/></div>
                                    <span className="ml-3 whitespace-nowrap">Nova Categoria</span>
                                </button>
                            )}
                        </div>
                    </div>
                </nav>
                
                <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-700">
                     <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setIsProfileMenuOpen(prev => !prev)}
                            title={isCollapsed ? (userName || 'Perfil') : undefined}
                            className={`flex items-center w-full text-left py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${isCollapsed ? 'justify-center' : 'px-4'} text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200`}
                        >
                            <div className="w-8 h-8 flex-shrink-0 text-slate-500 rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                {userProfilePicture ? (
                                    <img src={userProfilePicture} alt="Foto do perfil" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircleIcon />
                                )}
                            </div>
                            {!isCollapsed && <span className="ml-3 font-semibold whitespace-nowrap">{userName || 'Usuário'}</span>}
                        </button>
                        {isProfileMenuOpen && (
                            <div className={`absolute bottom-full left-2 right-2 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 ${isCollapsed ? 'w-56' : ''}`}>
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex-shrink-0 text-slate-500 rounded-full overflow-hidden flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                                            {userProfilePicture ? (
                                                <img src={userProfilePicture} alt="Foto do perfil" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircleIcon />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate">{userName || 'Usuário'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 dark:border-slate-700"></div>
                                <button
                                    onClick={onLogout}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <LogoutIcon />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                     <NavItem icon={<CogIcon/>} label="Configurações" isActive={currentView === View.Settings} onClick={() => handleNavigation(View.Settings)} />
                </div>

                <div className="pt-2 hidden sm:block">
                    <button
                        onClick={onToggle}
                        className="w-full flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                    >
                        {isCollapsed ? <ChevronDoubleRightIcon /> : <ChevronDoubleLeftIcon />}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;