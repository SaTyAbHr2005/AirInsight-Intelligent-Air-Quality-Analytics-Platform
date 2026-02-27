import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import AQICard from '../components/AQICard';
import PollutantCard from '../components/PollutantCard';
import { fetchLatestAQI } from '../services/api';
import { AlertTriangle, Clock, Activity } from 'lucide-react';

export default function Dashboard() {
    const { liveData, isSimulating } = useAppContext();
    const [latestAPI, setLatestAPI] = useState(null);

    useEffect(() => {
        if (!isSimulating && liveData.length === 0) {
            fetchLatestAQI().then(res => {
                if (res.data && res.data.length > 0) setLatestAPI(res.data[0]);
            }).catch(console.error);
        }
    }, [isSimulating, liveData]);

    const currentData = liveData.length > 0 ? liveData[0] : latestAPI;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Overview</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <Clock size={14} />
                        Last updated: {currentData ? new Date(currentData.timestamp).toLocaleString() : 'Never'}
                        {currentData?.region_name || currentData?.region ? ` in ${currentData.region_name || currentData.region}` : ''}
                    </p>
                </div>

                {currentData?.suggestion && (
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-3 shadow-sm max-w-md">
                        <AlertTriangle className="shrink-0 text-blue-500" size={20} />
                        <span className="font-medium text-sm">{currentData.suggestion}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AQICard aqi={currentData?.aqi} title="Region AQI" className="md:col-span-1 border-t-4 border-blue-500" />
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <PollutantCard name="PM2.5" value={currentData?.PM2_5 || null} />
                    <PollutantCard name="PM10" value={currentData?.PM10 || null} />
                    <PollutantCard name="NO2" value={currentData?.NO2 || null} />
                    <PollutantCard name="CO" value={currentData?.CO || null} unit="mg/m³" />
                    <PollutantCard name="SO2" value={currentData?.SO2 || null} />
                    <PollutantCard name="O3" value={currentData?.O3 || null} />
                    <PollutantCard name="NH3" value={currentData?.NH3 || null} />
                </div>
            </div>

            {!currentData && (
                <div className="glass-card p-12 text-center text-slate-500 border-dashed border-2">
                    <Activity size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No real-time data received.</p>
                    <p className="text-sm">Start the Simulator to view live dashboard updates.</p>
                </div>
            )}
        </div>
    );
}
