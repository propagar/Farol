
import React from 'react';

interface DoughnutChartProps {
    data: { label: string; value: number }[];
}

const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f43f5e', '#8b5cf6', '#ec4899', '#f97316'];

const DoughnutChart: React.FC<DoughnutChartProps> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) {
        return <div className="flex items-center justify-center h-full text-slate-400">Sem dados de despesas.</div>;
    }

    let cumulative = 0;
    const chartData = data.map((item, index) => {
        const percentage = (item.value / total) * 100;
        const startAngle = (cumulative / total) * 360;
        cumulative += item.value;
        const endAngle = (cumulative / total) * 360;
        return { ...item, percentage, startAngle, endAngle, color: PALETTE[index % PALETTE.length] };
    });

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="flex flex-col md:flex-row items-center h-full">
            <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    {chartData.map((segment, index) => {
                         const largeArcFlag = segment.percentage > 50 ? 1 : 0;
                         const startX = 18 + 15 * Math.cos(2 * Math.PI * segment.startAngle / 360);
                         const startY = 18 + 15 * Math.sin(2 * Math.PI * segment.startAngle / 360);
                         const endX = 18 + 15 * Math.cos(2 * Math.PI * segment.endAngle / 360);
                         const endY = 18 + 15 * Math.sin(2 * Math.PI * segment.endAngle / 360);

                         const d = `M ${startX} ${startY} A 15 15 0 ${largeArcFlag} 1 ${endX} ${endY}`;

                         return (
                            <path
                                key={index}
                                d={d}
                                fill="none"
                                stroke={segment.color}
                                strokeWidth="4"
                            />
                         );
                    })}
                </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(total)}</span>
                </div>
            </div>
            <div className="flex-1 mt-4 md:mt-0 md:ml-6 overflow-y-auto max-h-48 text-sm">
                <ul className="space-y-2">
                    {chartData.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.percentage.toFixed(1)}%</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DoughnutChart;
