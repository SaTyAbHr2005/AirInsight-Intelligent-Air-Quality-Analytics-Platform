import React from 'react';
import { cn } from '../utils/cn';

const getStatus = (value, name) => {
    if (!value) return 'normal';
    if (value > 150) return 'severe';
    if (value > 80) return 'warning';
    return 'good';
};

const colors = {
    good: 'text-green-500 bg-green-500 border-green-200',
    warning: 'text-orange-500 bg-orange-500 border-orange-200',
    severe: 'text-red-500 bg-red-500 border-red-200',
    normal: 'text-blue-500 bg-blue-500 border-blue-200'
};

export default function PollutantCard({ name, value, unit = "µg/m³" }) {
    const status = getStatus(value, name);
    const colorConfig = colors[status];

    return (
        <div className="glass-card p-4 flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 border-t-4" style={{ borderTopColor: status === 'good' ? '#22c55e' : status === 'warning' ? '#f97316' : status === 'severe' ? '#ef4444' : '#3d82f6' }}>
            <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-slate-700 dark:text-slate-200">{name}</span>
                <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm animate-pulse", colorConfig.split(' ')[1])}></div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                    {typeof value === 'number' ? value.toFixed(1) : '--'}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{unit}</span>
            </div>
        </div>
    );
}
