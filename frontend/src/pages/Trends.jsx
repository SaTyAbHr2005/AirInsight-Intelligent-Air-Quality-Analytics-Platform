import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartContainer from '../components/ChartContainer';
import { useAppContext } from '../context/AppContext';

export default function Trends() {
    const { liveData, isSimulating } = useAppContext();
    const [data, setData] = useState([]);

    useEffect(() => {
        if (liveData.length > 0) {
            const chartData = [...liveData].reverse().map(d => ({
                time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                AQI: d.aqi,
                PM25: d.PM2_5,
                PM10: d.PM10,
                NO2: d.NO2,
                O3: d.O3
            }));
            setData(chartData);
        }
    }, [liveData]);

    if (!isSimulating && data.length === 0) {
        return (
            <div className="glass-card p-12 text-center text-slate-500">
                <p className="font-medium text-lg">No historical data available.</p>
                <p>Please start the Simulator to generate trend flows.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Air Quality Trends</h2>
                <p className="text-slate-500">Real-time analytical view of atmospheric shifts and patterns.</p>
            </div>

            <ChartContainer title="AQI Temporal Drift" height={360}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorAQI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="AQI" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorAQI)" />
                </AreaChart>
            </ChartContainer>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer title="Particulate Matter (PM2.5 vs PM10)">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorPM25" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                            <linearGradient id="colorPM10" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Area type="monotone" dataKey="PM25" stroke="#ef4444" fill="url(#colorPM25)" />
                        <Area type="monotone" dataKey="PM10" stroke="#f97316" fill="url(#colorPM10)" />
                    </AreaChart>
                </ChartContainer>
            </div>
        </div>
    );
}
