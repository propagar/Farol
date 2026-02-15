
import React from 'react';
import { Task } from '../../types';

interface HabitCompletionChartProps {
    tasks: Task[];
    appColor: string;
}

const HabitCompletionChart: React.FC<HabitCompletionChartProps> = ({ tasks, appColor }) => {
    const data = React.useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            return d;
        }).reverse();

        const habits = tasks.filter(t => t.isHabit);
        const totalHabits = habits.length;

        if (totalHabits === 0) return [];

        return last7Days.map(date => {
            const dateString = date.toISOString().split('T')[0];
            const completedOnDay = habits.filter(h => {
                // Check if completed and completedAt matches the date
                return h.completedAt && h.completedAt.startsWith(dateString);
            }).length;
            
            return {
                label: date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3),
                completed: completedOnDay,
            };
        });
    }, [tasks]);

    if (data.length === 0) {
        return <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Adicione hábitos para ver seu progresso.</div>;
    }
    
    const maxCompleted = Math.max(...data.map(d => d.completed), 1);

    return (
        <div className="h-48 flex justify-around items-end gap-2" aria-label="Gráfico de hábitos concluídos nos últimos 7 dias">
            {data.map((day, index) => (
                <div key={index} className="flex flex-col items-center w-full h-full text-center">
                    <div 
                        className="flex-grow w-full flex items-end justify-center" 
                        title={`${day.completed} hábito(s) completo(s)`}
                    >
                        <div
                            className={`w-3/4 rounded-t-md bg-${appColor}-500 transition-all duration-500 ease-out`}
                            style={{ height: `${(day.completed / maxCompleted) * 100}%` }}
                            aria-valuenow={day.completed}
                            aria-valuemin={0}
                            aria-valuemax={maxCompleted}
                        />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1" aria-hidden="true">{day.label}</span>
                </div>
            ))}
        </div>
    );
};

export default HabitCompletionChart;
