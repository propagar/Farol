
import React, { useEffect, useState } from 'react';

interface BarChartProps {
    income: number;
    expense: number;
}

const BarChart: React.FC<BarChartProps> = ({ income, expense }) => {
    const [incomeHeight, setIncomeHeight] = useState(0);
    const [expenseHeight, setExpenseHeight] = useState(0);

    useEffect(() => {
        const maxValue = Math.max(income, expense, 1);
        // Using a timeout to trigger the animation on component mount/update
        const timer = setTimeout(() => {
            setIncomeHeight((income / maxValue) * 100);
            setExpenseHeight((expense / maxValue) * 100);
        }, 100); // Small delay to ensure transition is applied

        return () => clearTimeout(timer);
    }, [income, expense]);


    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="h-full flex flex-col">
            <div className="flex-grow flex items-end justify-around gap-8 px-4">
                {/* Income Bar */}
                <div className="flex flex-col items-center w-20 text-center">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{formatCurrency(income)}</p>
                    <div className="w-full h-48 mt-1 bg-slate-200 dark:bg-slate-700 rounded-t-md flex items-end">
                        <div 
                            className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-t-md"
                            style={{ height: `${incomeHeight}%`, transition: 'height 0.8s ease-out' }}
                        ></div>
                    </div>
                </div>
                {/* Expense Bar */}
                <div className="flex flex-col items-center w-20 text-center">
                     <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">{formatCurrency(expense)}</p>
                     <div className="w-full h-48 mt-1 bg-slate-200 dark:bg-slate-700 rounded-t-md flex items-end">
                         <div 
                            className="w-full bg-rose-400 dark:bg-rose-500 rounded-t-md"
                            style={{ height: `${expenseHeight}%`, transition: 'height 0.8s ease-out' }}
                        ></div>
                     </div>
                </div>
            </div>
            <div className="flex justify-center gap-6 text-sm mt-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500 mr-2"></span>
                    <span className="text-slate-600 dark:text-slate-300">Entradas</span>
                </div>
                <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-rose-400 dark:bg-rose-500 mr-2"></span>
                     <span className="text-slate-600 dark:text-slate-300">Saídas</span>
                </div>
            </div>
        </div>
    );
};

export default BarChart;
