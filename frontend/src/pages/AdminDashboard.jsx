import React, { useEffect, useState } from 'react';
import { fetchSensors, updateSensorStatus } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, LogOut, Radio, RadioReceiver, Loader2, Power, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAppContext();
    const navigate = useNavigate();

    const loadSensors = async () => {
        try {
            const res = await fetchSensors();
            setSensors(res.data);
        } catch (e) {
            if (e.response?.status === 401) {
                logout();
                navigate('/admin');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSensors();
    }, []);

    const handleToggle = async (id, currentStatus) => {
        try {
            await updateSensorStatus(id, !currentStatus);
            await loadSensors();
        } catch (e) {
            alert("Failed to update status");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-white"><Loader2 className="animate-spin w-10 h-10" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] p-6 lg:p-12 text-slate-900 dark:text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-sm">
                    <ArrowLeft size={16} /> Return to Public Site
                </Link>

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/50"><ShieldCheck size={26} /></div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">System Control Panel</h1>
                            <p className="text-slate-500 text-sm">Managing {sensors.length} hardware interface nodes globally.</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={18} /> End Session</button>
                </header>

                <div className="glass-card p-0 overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4">Node Identity</th>
                                <th className="px-6 py-4">Region Core</th>
                                <th className="px-6 py-4">Geospatial Coordinates</th>
                                <th className="px-6 py-4">Coverage Radius</th>
                                <th className="px-6 py-4">Telemetry Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {sensors.map((sensor) => (
                                <tr key={sensor.sensor_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <RadioReceiver size={18} className={sensor.is_active ? 'text-blue-500' : 'text-slate-400'} />
                                            <span className="font-bold">{sensor.sensor_code}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">Region #{sensor.region_id}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{sensor.latitude}, {sensor.longitude}</td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{sensor.radius} km</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${sensor.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700'}`}>
                                            {sensor.is_active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                                            {sensor.is_active ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleToggle(sensor.sensor_id, sensor.is_active)}
                                            className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition-colors ${sensor.is_active ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'}`}
                                        >
                                            <Power size={14} /> {sensor.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sensors.length === 0 && (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-500">No telemetry nodes registered on the network.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
