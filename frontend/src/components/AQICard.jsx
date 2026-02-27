import React from 'react';
import { cn } from '../utils/cn';

const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'text-green-500 bg-green-500/10 border-green-500/30 shadow-green-500/20';
    if (aqi <= 100) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30 shadow-yellow-500/20';
    if (aqi <= 200) return 'text-orange-500 bg-orange-500/10 border-orange-500/30 shadow-orange-500/20';
    if (aqi <= 300) return 'text-red-500 bg-red-500/10 border-red-500/30 shadow-red-500/20';
    return 'text-rose-700 bg-rose-700/10 border-rose-700/30 shadow-rose-700/20';
};

const getAQIStatus = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Severe';
    return 'Hazardous';
};

export default function AQICard({ aqi, title = "Current AQI", className }) {
    const safeAqi = typeof aqi === 'number' ? Math.round(aqi) : '--';
    const colorClass = typeof aqi === 'number' ? getAQIColor(safeAqi) : 'text-slate-500 bg-slate-500/10 border-slate-500/30';
    const status = typeof aqi === 'number' ? getAQIStatus(safeAqi) : 'Unknown';

    return (
        <div className={cn("glass-card p-6 flex flex-col items-center justify-center text-center", className)}>
            <h3 className="text-slate-600 dark:text-slate-300 font-semibold mb-4 text-lg">{title}</h3>

            <div className={cn(
                "w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 shadow-xl mb-6 transition-all duration-500",
                colorClass
            )}>
                <span className="text-5xl font-extrabold">{safeAqi}</span>
            </div>

            <div className={cn("px-6 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border", colorClass)}>
                {status}
            </div>
        </div>
    );
}
