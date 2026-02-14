
import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, PencilIcon, DragHandleIcon } from './Icons';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onAddCategory: (name: string, color: string) => void;
    onUpdateCategory: (id: string, name: string, color: string) => void;
    onDeleteCategory: (id: string) => void;
    onReorderCategories: (reorderedCategories: Category[]) => void;
    initialIsAdding?: boolean;
}

const colorOptions = [
    'bg-sky-500', 'bg-amber-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-pink-500', 'bg-red-500', 'bg-orange-500',
    'bg-lime-500', 'bg-cyan-500', 'bg-fuchsia-500'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
    isOpen,
    onClose,
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    onReorderCategories,
    initialIsAdding = false
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(colorOptions[0]);
    
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editingCategoryColor, setEditingCategoryColor] = useState('');
    
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialIsAdding) {
                setIsAdding(true);
            }
        } else {
            setEditingCategoryId(null);
            setIsAdding(false);
            setNewCategoryName('');
            setNewCategoryColor(colorOptions[0]);
        }
    }, [isOpen, initialIsAdding]);

    const handleAdd = () => {
        if (newCategoryName.trim()) {
            onAddCategory(newCategoryName.trim(), newCategoryColor);
            setNewCategoryName('');
            setNewCategoryColor(colorOptions[0]);
            setIsAdding(false);
        }
    };

    const handleStartEdit = (category: Category) => {
        setEditingCategoryId(category.id);
        setEditingCategoryName(category.name);
        setEditingCategoryColor(category.color);
    };

    const handleCancelEdit = () => {
        setEditingCategoryId(null);
    };

    const handleUpdate = () => {
        if (editingCategoryId && editingCategoryName.trim()) {
            onUpdateCategory(editingCategoryId, editingCategoryName.trim(), editingCategoryColor);
            setEditingCategoryId(null);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        e.preventDefault();
        if (draggedItemId !== id) {
            setDragOverItemId(id);
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropTargetId: string) => {
        e.preventDefault();
        if (!draggedItemId || draggedItemId === dropTargetId) return;

        const draggedIndex = categories.findIndex(c => c.id === draggedItemId);
        const dropIndex = categories.findIndex(c => c.id === dropTargetId);
        
        if (draggedIndex === -1 || dropIndex === -1) return;

        const reordered = [...categories];
        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(dropIndex, 0, draggedItem);
        
        onReorderCategories(reordered);
    };
    
    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDragOverItemId(null);
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Categorias">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                     <h4 className="text-md font-medium text-gray-800 dark:text-slate-200">Categorias</h4>
                     <button 
                        onClick={() => { setIsAdding(true); setEditingCategoryId(null); }}
                        className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                        <PlusIcon />
                        Nova
                     </button>
                </div>
                
                {isAdding && (
                     <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-3">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="Nome da categoria"
                            className="flex-grow block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        />
                        <div className="flex flex-wrap gap-2">
                            {colorOptions.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setNewCategoryColor(color)}
                                    className={`w-7 h-7 rounded-full ${color} transition-transform transform hover:scale-110 ${newCategoryColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''}`}
                                    aria-label={`Selecionar cor ${color}`}
                                />
                            ))}
                        </div>
                         <div className="flex items-center justify-end gap-2">
                             <button onClick={() => setIsAdding(false)} className="text-sm text-slate-600 dark:text-slate-400">Cancelar</button>
                             <button onClick={handleAdd} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Salvar</button>
                         </div>
                    </div>
                )}


                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {categories.map(cat => (
                        <div 
                            key={cat.id} 
                            draggable={!editingCategoryId && cat.id !== '0'}
                            onDragStart={(e) => cat.id !== '0' && handleDragStart(e, cat.id)}
                            onDragOver={(e) => handleDragOver(e, cat.id)}
                            onDrop={(e) => handleDrop(e, cat.id)}
                            onDragEnd={handleDragEnd}
                            onDragLeave={() => setDragOverItemId(null)}
                            className={`flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 transition-all duration-200 
                                ${draggedItemId === cat.id ? 'opacity-50' : 'opacity-100'}
                                ${dragOverItemId === cat.id ? 'border-t-2 border-indigo-500' : 'border-t-2 border-transparent'}
                            `}
                        >
                            {editingCategoryId === cat.id ? (
                                <>
                                    <div className="flex-grow flex items-center gap-2">
                                        <button className={`w-5 h-5 rounded-full ${editingCategoryColor} flex-shrink-0`} />
                                        <input
                                            type="text"
                                            value={editingCategoryName}
                                            onChange={(e) => setEditingCategoryName(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 bg-white dark:bg-slate-600 dark:border-slate-500 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <button onClick={handleUpdate} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Salvar</button>
                                        <button onClick={handleCancelEdit} className="text-sm text-slate-500">Cancelar</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center">
                                        <button 
                                            className={`cursor-move text-slate-400 dark:text-slate-500 mr-2 ${cat.id === '0' ? 'invisible' : ''}`}
                                            disabled={cat.id === '0'}
                                        >
                                            <DragHandleIcon />
                                        </button>
                                        <span className={`w-3 h-3 rounded-full ${cat.color} mr-3`}></span>
                                        <span className="text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
                                    </div>
                                    {cat.id !== '0' && (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleStartEdit(cat)} className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                                                <PencilIcon />
                                            </button>
                                            <button onClick={() => onDeleteCategory(cat.id)} className="text-slate-400 hover:text-red-500">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-5 sm:mt-6">
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
                >
                    Fechar
                </button>
            </div>
        </Modal>
    );
};
