
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Category, Priority } from '../types';
import CategoryPill from './CategoryPill';
import PriorityPill from './PriorityPill';
import { TrashIcon, ChevronDownIcon, PlusIcon, SparklesIcon, SpinnerIcon, ClockIcon, FireIcon } from './Icons';

interface TaskItemProps {
    task: Task;
    category?: Category;
    categories: Category[];
    onToggle: (taskId: string) => void;
    onDelete: (taskId:string) => void;
    onToggleSubtask: (taskId: string, subtaskId: string) => void;
    onAddSubtask: (taskId: string, subtaskText: string) => void;
    onAddMultipleSubtasks: (taskId: string, subtaskTexts: string[]) => void;
    onUpdateDueDate: (taskId: string, dueDate: string | null) => void;
    onUpdateCategory: (taskId: string, categoryId: string) => void;
    onUpdatePriority: (taskId: string, priority: Priority) => void;
    onUpdateDescription: (taskId: string, description: string) => void;
    onDragStart: (taskId: string) => void;
    onDragOver: (e: React.DragEvent, taskId: string) => void;
    onDrop: (taskId: string) => void;
    onDragEnd: () => void;
    isBeingDraggedOver: boolean;
    appColor: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
    task, category, categories, onToggle, onDelete, 
    onToggleSubtask, onAddSubtask, onAddMultipleSubtasks, 
    onUpdateDueDate, onUpdateCategory, onUpdatePriority, onUpdateDescription,
    onDragStart, onDragOver, onDrop, onDragEnd, isBeingDraggedOver,
    appColor
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAddSubtask = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSubtaskText.trim()) {
            onAddSubtask(task.id, newSubtaskText);
            setNewSubtaskText('');
        }
    };

    const handleGenerateSubtasks = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const schema = {
                type: Type.OBJECT,
                properties: {
                    subtasks: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "Uma lista de nomes de subtarefas."
                    }
                },
                required: ['subtasks']
            };
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Você é um assistente de produtividade. Sua tarefa é dividir uma tarefa principal em subtarefas menores e mais gerenciáveis. Para a tarefa principal: "${task.text}", forneça uma lista de 3 a 5 subtarefas. Responda apenas com o JSON formatado de acordo com o schema.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema
                }
            });
            
            const resultText = response.text;
            if (resultText) {
                const result = JSON.parse(resultText);
                const subtaskTexts = result.subtasks;

                if (subtaskTexts && Array.isArray(subtaskTexts) && subtaskTexts.length > 0) {
                    onAddMultipleSubtasks(task.id, subtaskTexts);
                }
            }
        } catch (error) {
            console.error("Erro ao gerar subtarefas:", error);
            alert("Não foi possível gerar as subtarefas. Tente novamente mais tarde.");
        } finally {
            setIsGenerating(false);
        }
    };

    const formatDate = (dateString: string): { text: string; color: string } => {
        const date = new Date(dateString + 'T00:00:00'); // Trata a data como local para evitar problemas de fuso horário
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.getTime() < today.getTime()) {
            return { text: 'Vencido', color: 'text-red-500 dark:text-red-400' };
        }
        if (date.getTime() === today.getTime()) {
            return { text: 'Hoje', color: 'text-amber-600 dark:text-amber-500' };
        }
        if (date.getTime() === tomorrow.getTime()) {
            return { text: 'Amanhã', color: 'text-sky-600 dark:text-sky-500' };
        }
        return { text: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), color: 'text-slate-500 dark:text-slate-400' };
    };
    
    const dueDateInfo = task.dueDate && !task.isHabit ? formatDate(task.dueDate) : null;

    return (
        <div 
            className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing relative ${isBeingDraggedOver ? `border-t-2 border-${appColor}-500` : 'border-t-2 border-transparent'}`}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onDragOver={(e) => onDragOver(e, task.id)}
            onDrop={() => onDrop(task.id)}
            onDragEnd={onDragEnd}
        >
            <div className="p-4 flex items-center justify-between" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center flex-grow min-w-0">
                    <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={(e) => {
                            e.stopPropagation();
                            onToggle(task.id);
                        }}
                        className={`h-5 w-5 rounded border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-${appColor}-600 focus:ring-${appColor}-500 flex-shrink-0`}
                    />
                    <span className={`ml-4 text-slate-700 dark:text-slate-300 truncate ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.text}
                    </span>
                    {task.isHabit && (
                        <span 
                            className={`ml-2 flex items-center gap-1 text-sm font-bold ${
                                task.streak && task.streak > 0 ? 'text-orange-500' : 'text-slate-400'
                            }`} 
                            title={
                                task.streak && task.streak > 0 
                                    ? `Sequência de ${task.streak} dias` 
                                    : 'Hábito diário: complete hoje para iniciar uma sequência!'
                            }
                        >
                            <FireIcon className="w-4 h-4" />
                            {task.streak && task.streak > 0 && <span>{task.streak}</span>}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 ml-4">
                     {dueDateInfo && !task.completed && (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${dueDateInfo.color}`}>
                            <div className="w-4 h-4"><ClockIcon/></div>
                            {dueDateInfo.text}
                        </span>
                    )}
                    {task.priority && !task.isHabit && <PriorityPill priority={task.priority} />}
                    {category && <CategoryPill category={category} />}
                    <span className={`transform transition-transform text-slate-500 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDownIcon/>
                    </span>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onDelete(task.id);
                    }} className="text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors">
                        <TrashIcon />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="px-4 pb-4 pl-12 border-t border-slate-100 dark:border-slate-700">
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor={`category-${task.id}`} className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Categoria</label>
                            <select
                                id={`category-${task.id}`}
                                value={task.categoryId}
                                onChange={(e) => onUpdateCategory(task.id, e.target.value)}
                                className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        {!task.isHabit && (
                            <>
                                <div>
                                    <label htmlFor={`due-date-${task.id}`} className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Data de Vencimento</label>
                                    <input
                                        type="date"
                                        id={`due-date-${task.id}`}
                                        value={task.dueDate || ''}
                                        onChange={(e) => onUpdateDueDate(task.id, e.target.value)}
                                        className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`priority-${task.id}`} className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Prioridade</label>
                                    <select
                                        id={`priority-${task.id}`}
                                        value={task.priority || Priority.None}
                                        onChange={(e) => onUpdatePriority(task.id, e.target.value as Priority)}
                                        className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {Object.values(Priority).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                   
                    <div className="mt-4">
                        <label htmlFor={`description-${task.id}`} className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Descrição</label>
                        <textarea
                            id={`description-${task.id}`}
                            rows={3}
                            value={task.description || ''}
                            onChange={(e) => onUpdateDescription(task.id, e.target.value)}
                            className={`block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Adicione mais detalhes..."
                        />
                    </div>

                    <h5 className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Checklist</h5>
                    {task.checklist.length > 0 && (
                        <ul className="space-y-2 mt-2">
                            {task.checklist.map(subtask => (
                                <li key={subtask.id} className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={subtask.completed} 
                                        onChange={() => onToggleSubtask(task.id, subtask.id)}
                                        className={`h-4 w-4 rounded border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-${appColor}-600 focus:ring-${appColor}-500`}
                                    />
                                    <span className={`ml-3 text-sm text-slate-600 dark:text-slate-400 ${subtask.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                        {subtask.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <form onSubmit={handleAddSubtask} className="mt-3 flex items-center gap-2">
                         <input 
                            type="text" 
                            value={newSubtaskText}
                            onChange={(e) => setNewSubtaskText(e.target.value)}
                            placeholder="Adicionar subtarefa..."
                            className={`flex-grow block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`}
                            onClick={(e) => e.stopPropagation()}
                        />
                         <button type="submit" className={`flex-shrink-0 p-2 rounded-full bg-${appColor}-600 text-white hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${appColor}-500`}>
                            <PlusIcon />
                         </button>
                    </form>

                    <div className="mt-4 pt-4 border-t border-dashed dark:border-slate-700">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateSubtasks(); }}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 text-sm text-${appColor}-600 hover:text-${appColor}-800 dark:text-${appColor}-400 dark:hover:text-${appColor}-300 font-semibold disabled:opacity-50 disabled:cursor-wait`}
                        >
                            {isGenerating ? (
                                <>
                                    <SpinnerIcon />
                                    <span>Gerando sugestões...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon />
                                    <span>Sugerir subtarefas com IA</span>
                                </>
                            )}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default TaskItem;
