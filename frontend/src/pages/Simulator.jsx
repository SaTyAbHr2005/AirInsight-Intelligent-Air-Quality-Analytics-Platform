import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { predictAQI } from '../services/api';

const SENSORS = [
    { sensor_id: 1, region: "Mumbai", level: "high" },
    { sensor_id: 2, region: "Mumbai", level: "very_high" },
    { sensor_id: 3, region: "Pune", level: "moderate" },
    { sensor_id: 4, region: "Pune", level: "high" },
    { sensor_id: 5, region: "Nagpur", level: "good" },
    { sensor_id: 6, region: "Nagpur", level: "moderate" },
    { sensor_id: 7, region: "Nashik", level: "low" },
    { sensor_id: 8, region: "Nashik", level: "good" },
    { sensor_id: 9, region: "Aurangabad", level: "moderate" },
    { sensor_id: 10, region: "Aurangabad", level: "high" },
    { sensor_id: 11, region: "Kolhapur", level: "low" },
    { sensor_id: 12, region: "Kolhapur", level: "good" },
    { sensor_id: 13, region: "Solapur", level: "high" },
    { sensor_id: 14, region: "Solapur", level: "very_high" },
    { sensor_id: 15, region: "Chandrapur", level: "very_high" },
    { sensor_id: 16, region: "Chandrapur", level: "severe" },
    { sensor_id: 17, region: "Ratnagiri", level: "low" },
    { sensor_id: 18, region: "Ratnagiri", level: "good" },
    { sensor_id: 19, region: "Navi Mumbai", level: "moderate" },
    { sensor_id: 20, region: "Navi Mumbai", level: "high" },
];

function generatePollution(level) {
    const rnd = (min, max) => Math.random() * (max - min) + min;
    switch (level) {
        case "low": return { PM2_5: rnd(5, 15), PM10: rnd(15, 40), NO2: rnd(5, 15), CO: rnd(0.1, 0.4), SO2: rnd(2, 8), O3: rnd(10, 25), NH3: rnd(2, 8) };
        case "good": return { PM2_5: rnd(15, 40), PM10: rnd(40, 80), NO2: rnd(10, 25), CO: rnd(0.3, 0.8), SO2: rnd(5, 15), O3: rnd(20, 50), NH3: rnd(5, 15) };
        case "moderate": return { PM2_5: rnd(40, 100), PM10: rnd(80, 200), NO2: rnd(25, 60), CO: rnd(0.7, 1.8), SO2: rnd(10, 30), O3: rnd(40, 80), NH3: rnd(10, 30) };
        case "high": return { PM2_5: rnd(100, 220), PM10: rnd(200, 400), NO2: rnd(60, 120), CO: rnd(1.5, 3), SO2: rnd(20, 60), O3: rnd(60, 120), NH3: rnd(20, 60) };
        case "very_high": return { PM2_5: rnd(180, 300), PM10: rnd(350, 550), NO2: rnd(90, 180), CO: rnd(2.5, 5), SO2: rnd(40, 100), O3: rnd(80, 160), NH3: rnd(40, 100) };
        case "severe":
        default:
            return { PM2_5: rnd(300, 500), PM10: rnd(500, 800), NO2: rnd(150, 300), CO: rnd(5, 10), SO2: rnd(80, 200), O3: rnd(150, 250), NH3: rnd(80, 150) };
    }
}

export default function Simulator() {
    const { isSimulating, setIsSimulating, liveData, setLiveData } = useAppContext();
    const [intervalTime, setIntervalTime] = useState(3000);
    const timerRef = useRef(null);

    const startSimulation = () => setIsSimulating(true);
    const stopSimulation = () => setIsSimulating(false);

    useEffect(() => {
        if (isSimulating) {
            timerRef.current = setInterval(async () => {
                const targetSensor = SENSORS[Math.floor(Math.random() * SENSORS.length)];
                const pollution = generatePollution(targetSensor.level);

                const data = {
                    sensor_id: targetSensor.sensor_id,
                    region_name: targetSensor.region,
                    ...pollution,
                    temperature: 30,
                    humidity: 60,
                    wind_speed: 10,
                    timestamp: new Date().toISOString(),
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
