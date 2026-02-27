import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { predictAQI } from '../services/api';

const MOCK_REGIONS = ["Mumbai", "Pune", "Nagpur", "Nashik", "Chandrapur"];

export default function Simulator() {
    const { isSimulating, setIsSimulating, liveData, setLiveData } = useAppContext();
    const [intervalTime, setIntervalTime] = useState(3000);
    const timerRef = useRef(null);

    const startSimulation = () => setIsSimulating(true);
    const stopSimulation = () => setIsSimulating(false);

    useEffect(() => {
        if (isSimulating) {
            timerRef.current = setInterval(async () => {
                const data = {
                    sensor_id: Math.floor(Math.random() * 20) + 1,
                    PM2_5: Math.random() * 100 + 10,
                    PM10: Math.random() * 150 + 20,
                    NO2: Math.random() * 80 + 5,
                    CO: Math.random() * 5 + 0.1,
                    SO2: Math.random() * 50 + 2,
                    O3: Math.random() * 60 + 10,
                    NH3: Math.random() * 40 + 1,
                    temperature: 30,
                    humidity: 60,
                    wind_speed: 10,
                    timestamp: new Date().toISOString(),
                    region_name: MOCK_REGIONS[Math.floor(Math.random() * MOCK_REGIONS.length)],
                };

                try {
                    const res = await predictAQI({
                        sensor_id: data.sensor_id,
                        PM2_5: data.PM2_5,
                        PM10: data.PM10,
                        NO2: data.NO2,
                        CO: data.CO,
                        SO2: data.SO2,
                        O3: data.O3,
                        NH3: data.NH3,
                        hour: new Date().getHours(),
                        day: new Date().getDate(),
                        month: new Date().getMonth() + 1,
                        weekday: new Date().getDay()
                    });

                    const result = { ...data, aqi: res.data.predicted_AQI, category: res.data.category };

                    setLiveData(prev => [result, ...prev].slice(0, 50));
                } catch (e) {
                    console.error('Simulation error', e);
                }
            }, intervalTime);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isSimulating, intervalTime, setLiveData]);

    return (
        <div className="space-y-6">
            <div className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold mb-2">Sensor Simulator</h2>
                    <p className="text-slate-500">Stream real-time fake payload to backend.</p>
                </div>

                <div className="flex gap-4">
                    <button disabled={isSimulating} onClick={startSimulation} className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                        <Play size={18} /> Start
                    </button>
                    <button disabled={!isSimulating} onClick={stopSimulation} className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                        <Square size={18} /> Stop
                    </button>
                </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Activity className={isSimulating ? "text-green-500 animate-pulse" : "text-slate-400"} /> Live Stream
                    </h3>
                    <span className="text-sm font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{liveData.length} events</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                            <tr>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Sensor</th>
                                <th className="px-6 py-3">Region</th>
                                <th className="px-6 py-3">AQI</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">PM2.5</th>
                                <th className="px-6 py-3">PM10</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {liveData.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-3 text-slate-400">{new Date(row.timestamp).toLocaleTimeString()}</td>
                                    <td className="px-6 py-3 font-medium">#{row.sensor_id}</td>
                                    <td className="px-6 py-3">{row.region_name}</td>
                                    <td className="px-6 py-3 font-bold">{row.aqi?.toFixed(1)}</td>
                                    <td className="px-6 py-3"><span className="px-2 py-1 rounded text-xs font-semibold bg-slate-200 dark:bg-slate-700">{row.category}</span></td>
                                    <td className="px-6 py-3">{row.PM2_5?.toFixed(1)}</td>
                                    <td className="px-6 py-3">{row.PM10?.toFixed(1)}</td>
                                </tr>
                            ))}
                            {liveData.length === 0 && (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">No data yet. Start the simulator.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
