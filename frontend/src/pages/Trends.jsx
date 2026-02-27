import React, { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ResponsiveContainer } from 'recharts';
import ChartContainer from '../components/ChartContainer';
import { fetchHistory, fetchForecast } from '../services/api';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function Trends() {
    const { liveData } = useAppContext();
    const [historyData, setHistoryData] = useState([]);
    const [currentAQI, setCurrentAQI] = useState(null);
    const [peakAQI, setPeakAQI] = useState(null);
    const [trend, setTrend] = useState('Stable');
    const [loading, setLoading] = useState(true);

    const pmData = liveData.length > 0
        ? [...liveData].reverse().map(d => ({
            time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            PM25: d.PM2_5,
            PM10: d.PM10
        }))
        : historyData.filter(d => !d.forecastAQI).map(d => ({
            time: d.time,
            PM25: d.pm25,
            PM10: d.pm10
        }));

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch history from API (fallback to region 1)
                const histRes = await fetchHistory(1);
                let data = [];
                if (histRes.data && histRes.data.length > 0) {
                    data = histRes.data.map(d => ({
                        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        timestamp: new Date(d.timestamp).getTime(),
                        AQI: parseFloat(d.aqi.toFixed(1)),
                        pm25: d.pm25 ? parseFloat(d.pm25.toFixed(1)) : 0,
                        pm10: d.pm10 ? parseFloat(d.pm10.toFixed(1)) : 0
                    })).sort((a, b) => a.timestamp - b.timestamp);
                }

                let forecastVal = null;
                try {
                    const fRes = await fetchForecast(1);
                    if (fRes.data && fRes.data.next_hour_AQI) {
                        forecastVal = parseFloat(fRes.data.next_hour_AQI.toFixed(2));
                    }
                } catch (e) { console.error("Forecast API fetch error", e); }

                if (data.length > 0) {
                    const current = data[data.length - 1].AQI;
                    const prev = data.length > 1 ? data[data.length - 2].AQI : current;

                    let t = 'Stable';
                    if (current > prev + 1) t = 'Increasing';
                    else if (current < prev - 1) t = 'Decreasing';

                    const peak = Math.max(...data.map(d => d.AQI));

                    const chartData = [...data];
                    if (forecastVal !== null) {
                        const lastTime = new Date(data[data.length - 1].timestamp);
                        lastTime.setHours(lastTime.getHours() + 1);
                        chartData.push({
                            time: lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (FCST)',
                            forecastAQI: forecastVal,
                            timestamp: lastTime.getTime()
                        });
                        // Bridge the line series
                        chartData[chartData.length - 2].forecastAQI = current;
                    }

                    setHistoryData(chartData);
                    setCurrentAQI(current);
                    setPeakAQI(peak);
                    setTrend(t);
                }
                setLoading(false);
            } catch (e) {
                console.error('Error fetching trends API', e);
                setLoading(false);
            }
        };

        fetchDashboardData();
        const inv = setInterval(fetchDashboardData, 30000); // 30s auto-refresh
        return () => clearInterval(inv);
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 text-slate-500 gap-3">
                <Activity className="animate-pulse" size={24} /> Loading Analytics Engine...
            </div>
        );
    }

    if (historyData.length === 0) {
        return (
            <div className="glass-card p-12 text-center text-slate-500">
                <p className="font-medium text-lg">No historical data available.</p>
                <p>Ensure the simulator is running to populate backend traces.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Air Quality Trends</h2>
                <p className="text-slate-500">Real-time analytical view of atmospheric shifts and patterns.</p>
            </div>

            {/* Dark Theme Analytics Panel */}
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">AQI Temporal Drift</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-sm font-medium">Trajectory Analysis</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${trend === 'Increasing' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : trend === 'Decreasing' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                                {trend === 'Increasing' ? <TrendingUp size={14} /> : trend === 'Decreasing' ? <TrendingDown size={14} /> : <Minus size={14} />}
                                {trend}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-8 text-right">
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Current</p>
                            <p className="text-4xl font-black text-white">{currentAQI?.toFixed(1) || '--'}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">24H Peak</p>
                            <p className="text-4xl font-black text-slate-300">{peakAQI?.toFixed(1) || '--'}</p>
                        </div>
                    </div>
                </div>

                <div className="w-full h-[350px] relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} minTickGap={30} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, peakAQI < 60 ? 100 : 'dataMax + 20']} />

                            {/* Color Zones Backgrounds */}
                            <ReferenceArea yAxisId="left" y1={0} y2={50} fill="#22c55e" fillOpacity={0.1} />
                            <ReferenceArea yAxisId="left" y1={51} y2={100} fill="#eab308" fillOpacity={0.1} />
                            <ReferenceArea yAxisId="left" y1={101} y2={200} fill="#f97316" fillOpacity={0.1} />
                            <ReferenceArea yAxisId="left" y1={201} y2={300} fill="#ef4444" fillOpacity={0.15} />
                            <ReferenceArea yAxisId="left" y1={301} y2={400} fill="#a855f7" fillOpacity={0.15} />
                            <ReferenceArea yAxisId="left" y1={401} y2={1000} fill="#9f1239" fillOpacity={0.15} />

                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#e2e8f0' }}
                            />

                            <Line yAxisId="left" type="monotone" dataKey="AQI" stroke="#38bdf8" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0b1120', strokeWidth: 2 }} name="Observed AQI" />
                            <Line yAxisId="left" type="monotone" dataKey="forecastAQI" stroke="#f472b6" strokeWidth={3} strokeDasharray="6 6" dot={{ r: 4, fill: '#f472b6', stroke: '#0b1120', strokeWidth: 2 }} name="Next Hour Forecast" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom Gradient Underlay */}
                <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none z-0"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ChartContainer title="Particulate Matter Variation">
                    <AreaChart data={pmData}>
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
