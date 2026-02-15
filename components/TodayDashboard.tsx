
import React from 'react';
import { Task, WeeklyGoal, CalendarEvent } from '../types';
import CalendarView from './CalendarView';
import GamificationPanel from './GamificationPanel';

interface TodayDashboardProps {
    tasks: Task[];
    completedTasks: Task[];
    weeklyGoals: WeeklyGoal[];
    calendarEvents: CalendarEvent[];
    onAddCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
    appColor: string;
}

const TodayDashboard: React.FC<TodayDashboardProps> = (props) => {
    return (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <CalendarView 
                    events={props.calendarEvents}
                    onAddEvent={props.onAddCalendarEvent}
                    appColor={props.appColor}
                />
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <GamificationPanel 
                    tasks={props.tasks}
                    completedTasks={props.completedTasks}
                    appColor={props.appColor}
                />
            </div>
        </div>
    );
};

export default TodayDashboard;
