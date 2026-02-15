
import React, { useState } from 'react';
import { CalendarEvent } from '../types';
import { GoogleIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon } from './Icons';
import Modal from './Modal';

interface CalendarViewProps {
    events: CalendarEvent[];
    onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
    appColor: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onAddEvent, appColor }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventStartTime, setNewEventStartTime] = useState('');
    const [newEventEndTime, setNewEventEndTime] = useState('');

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const handleOpenAddEventModal = (day: number) => {
        setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
        setIsEventModalOpen(true);
    };

    const handleAddEvent = () => {
        if (newEventTitle.trim() && selectedDate) {
            onAddEvent({
                title: newEventTitle,
                date: selectedDate.toISOString().split('T')[0],
                startTime: newEventStartTime || undefined,
                endTime: newEventEndTime || undefined,
                color: `bg-${appColor}-500`,
            });
            setIsEventModalOpen(false);
            setNewEventTitle('');
            setNewEventStartTime('');
            setNewEventEndTime('');
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronUpIcon className="w-5 h-5 -rotate-90" /></button>
                    <button onClick={nextMonth} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronDownIcon className="w-5 h-5 -rotate-90" /></button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {daysOfWeek.map(day => <div key={day}>{day}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <div key={`empty-${index}`} className="border border-transparent rounded-lg"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                    const day = dayIndex + 1;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const dateString = date.toISOString().split('T')[0];
                    const today = new Date();
                    const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
                    const eventsForDay = events.filter(e => e.date === dateString);

                    return (
                        <div key={day} className="h-24 p-1 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col group relative hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <time dateTime={dateString} className={`text-xs font-semibold ${isToday ? `bg-${appColor}-600 text-white rounded-full w-5 h-5 flex items-center justify-center` : 'text-slate-700 dark:text-slate-300'}`}>
                                {day}
                            </time>
                            <div className="flex-grow overflow-y-auto text-left mt-1 space-y-0.5">
                                {eventsForDay.map(event => (
                                    <p key={event.id} className="text-xs text-white rounded px-1 truncate" style={{backgroundColor: event.color.replace('bg-', '').replace('-500', '')}}>
                                        {event.startTime ? `${event.startTime} ` : ''}{event.title}
                                    </p>
                                ))}
                            </div>
                             <button onClick={() => handleOpenAddEventModal(day)} className="absolute bottom-1 right-1 w-5 h-5 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <PlusIcon />
                            </button>
                        </div>
                    );
                })}
            </div>

             <Modal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} title={`Adicionar Evento para ${selectedDate?.toLocaleDateString('pt-BR')}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Título</label>
                        <input type="text" id="event-title" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} placeholder="Ex: Reunião de equipe" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Início</label>
                            <input type="time" id="event-start-time" value={newEventStartTime} onChange={e => setNewEventStartTime(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                        </div>
                        <div>
                            <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700 dark:text-slate-300">Fim</label>
                            <input type="time" id="event-end-time" value={newEventEndTime} onChange={e => setNewEventEndTime(e.target.value)} className={`mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white shadow-sm focus:border-${appColor}-500 focus:ring-${appColor}-500 sm:text-sm p-2`} />
                        </div>
                     </div>
                </div>
                 <div className="mt-5 sm:mt-6">
                    <button type="button" onClick={handleAddEvent} className={`inline-flex w-full justify-center rounded-md border border-transparent bg-${appColor}-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-${appColor}-700 focus:outline-none focus:ring-2 focus:ring-${appColor}-500 focus:ring-offset-2 sm:text-sm`}> Adicionar Evento </button>
                </div>
            </Modal>
        </div>
    );
};

export default CalendarView;
