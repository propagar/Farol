
import React, { useMemo } from 'react';
import { Task } from '../types';
import { FireIcon, TargetIcon } from './Icons';

interface GamificationPanelProps {
    tasks: Task[];
    completedTasks: Task[];
    appColor: string;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ tasks, completedTasks, appColor }) => {
    
    const { longestStreak, currentStreaks, tasksCompletedThisWeek } = useMemo(() => {
        const allHabits = [...tasks.filter(t => t.isHabit), ...completedTasks.filter(t => t.isHabit)];
        
        const longest = allHabits.reduce((max, habit) => (habit.streak || 0) > max ? habit.streak! : max, 0);

        const current = tasks
            .filter(t => t.isHabit && (t.streak || 0) > 0)
            .sort((a, b) => (b.streak || 0) - (a.streak || 0));

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const completedThisWeek = completedTasks.filter(t => new Date(t.completedAt!) >= oneWeekAgo).length;

        return {
            longestStreak: longest,
            currentStreaks: current,
            tasksCompletedThisWeek: completedThisWeek,
        };

    }, [tasks, completedTasks]);

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                Seu Progresso
            </h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/50 rounded-lg text-center">
                        <FireIcon className="w-8 h-8 text-amber-500" />
                        <span className="text-3xl font-bold text-slate-800 dark:text-slate-200 mt-2">{longestStreak}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Maior Sequência</span>
                    </div>
                     <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg text-center">
                        <TargetIcon className="w-8 h-8 text-emerald-500" />
                        <span className="text-3xl font-bold text-slate-800 dark:text-slate-200 mt-2">{tasksCompletedThisWeek}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Tarefas esta semana</span>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Hábitos em sequência</h4>
                    <div className="space-y-2">
                        {currentStreaks.length > 0 ? (
                            currentStreaks.map(habit => (
                                <div key={habit.id} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{habit.text}</p>
                                    <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                                        <FireIcon className="w-4 h-4" />
                                        <span>{habit.streak}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Complete um hábito para iniciar uma sequência!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GamificationPanel;
