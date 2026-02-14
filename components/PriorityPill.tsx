
import React from 'react';
import { Priority } from '../types';
import { FlagIcon } from './Icons';

interface PriorityPillProps {
    priority: Priority;
}

const PriorityPill: React.FC<PriorityPillProps> = ({ priority }) => {
    const priorityStyles: { [key in Priority]: { color: string; label: string } } = {
        [Priority.High]: { color: 'bg-red-100 text-red-700 dark:bg-red-800/50 dark:text-red-300', label: 'Alta' },
        [Priority.Medium]: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-800/50 dark:text-amber-300', label: 'Média' },
        [Priority.Low]: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-800/50 dark:text-sky-300', label: 'Baixa' },
        [Priority.None]: { color: '', label: '' }
    };

    if (priority === Priority.None) return null;

    const { color, label } = priorityStyles[priority];

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${color}`}>
            <FlagIcon className="w-3 h-3" />
            {label}
        </span>
    );
};

export default PriorityPill;
