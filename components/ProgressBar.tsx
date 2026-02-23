
import React from 'react';

interface ProgressBarProps {
    progress: number;
    appColor: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, appColor }) => {
    const safeProgress = Math.min(100, Math.max(0, progress));
    const hasProgress = safeProgress > 0;
    const displayProgress = hasProgress && safeProgress < 0.001 ? 0.001 : safeProgress;
    const progressLabel = `${displayProgress.toLocaleString('pt-BR', {
        minimumFractionDigits: hasProgress ? 0 : 0,
        maximumFractionDigits: hasProgress ? 3 : 0,
    })}%`;
    const showLabelInsideBar = safeProgress >= 12;

    return (
        <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
            <div
                className={`bg-${appColor}-600 h-4 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${safeProgress}%` }}
            />

            {showLabelInsideBar ? (
                <span className="absolute inset-y-0 right-2 flex items-center text-xs font-medium text-white">
                    {progressLabel}
                </span>
            ) : (
                <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-slate-700 dark:text-slate-200">
                    {progressLabel}
                </span>
            )}
        </div>
    );
};

export default ProgressBar;
