import React from 'react';
import { ResponsiveContainer } from 'recharts';

export default function ChartContainer({ title, children, height = 300 }) {
    return (
        <div className="glass-card p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">{title}</h3>
            <div style={{ minHeight: height }} className="w-full flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
