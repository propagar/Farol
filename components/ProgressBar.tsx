
import React from 'react';

interface ProgressBarProps {
    progress: number;
    appColor: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, appColor }) => {
    const safeProgress = Math.min(100, Math.max(0, progress));

    return (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
            <div
                className={`bg-${appColor}-600 h-4 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${safeProgress}%` }}
            >
                <span className="flex justify-end items-center h-full pr-2 text-xs font-medium text-white">
                    {`${Math.round(safeProgress)}%`}
                </span>
            </div>
        </div>
    );
};

export default ProgressBar;
