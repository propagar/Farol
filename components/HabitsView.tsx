
import React from 'react';
import { Task, Category, Priority } from '../types';
import TaskItem from './TaskItem';
import HabitCompletionChart from './charts/HabitCompletionChart';
import { TargetIcon } from './Icons';

interface HabitsViewProps {
    tasks: Task[];
    categories: Category[];
    appColor: string;
    onToggle: (taskId: string) => void;
    onDelete: (taskId: string) => void;
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
    dragOverTaskId: string | null;
}


const HabitsView: React.FC<HabitsViewProps> = ({ 
    tasks, categories, appColor, dragOverTaskId,
    ...handlers 
}) => {
    const dailyHabits = tasks.filter(t => t.isHabit); 

    return (
        <div>
            <div className="space-y-4">
                {dailyHabits.length > 0 ? dailyHabits.map(task => (
                    <TaskItem 
                        key={task.id} 
                        task={task} 
                        category={categories.find(c => c.id === task.categoryId)} 
                        categories={categories} 
                        isBeingDraggedOver={dragOverTaskId === task.id}
                        appColor={appColor}
                        {...handlers} 
                    />
                )) : (
                    <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <div className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"><TargetIcon/></div>
                        <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">Nenhum hábito na sua rotina.</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Crie um novo hábito para começar a construir sua rotina.</p>
                    </div>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                        Hábitos Semanais
                    </h3>
                    <div className="text-center py-8 text-slate-400 flex flex-col items-center justify-center h-full">
                         <p className="text-sm">Defina metas para serem cumpridas algumas vezes na semana.</p>
                         <p className="text-xs mt-1">(Funcionalidade em desenvolvimento)</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                        Desempenho dos Últimos 7 Dias
                    </h3>
                     <HabitCompletionChart tasks={tasks} appColor={appColor} />
                </div>
            </div>
        </div>
    );
};

export default HabitsView;
