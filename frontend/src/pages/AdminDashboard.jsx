import React, { useEffect, useState } from 'react';
import { fetchSensors, updateSensorStatus, deleteSensor, createSensor } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, LogOut, Radio, RadioReceiver, Loader2, Power, ArrowLeft, Trash2, Plus, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminDashboard() {
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSensor, setNewSensor] = useState({
        sensor_code: '',
        region_id: 1,
        latitude: '',
        longitude: '',
        radius: 20
    });

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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this sensor node?")) return;
        try {
            await deleteSensor(id);
            await loadSensors();
        } catch (e) {
            alert("Failed to delete sensor");
        }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            await createSensor(newSensor);
            setShowAddModal(false);
            setNewSensor({ sensor_code: '', region_id: 1, latitude: '', longitude: '', radius: 20 });
            await loadSensors();
        } catch (err) {
            alert("Failed to deploy sensor! Check network logs.");
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
                    <div className="flex gap-3">
                        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Deploy Node</button>
                        <button onClick={handleLogout} className="btn-secondary text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={18} /> End Session</button>
                    </div>
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
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleToggle(sensor.sensor_id, sensor.is_active)}
                                                className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition-colors ${sensor.is_active ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'}`}
                                                title={sensor.is_active ? "Deactivate Sensor" : "Activate Sensor"}
                                            >
                                                <Power size={14} /> {sensor.is_active ? 'Deactivate' : 'Activate'}
                                            </button>

                                            <button
                                                onClick={() => handleDelete(sensor.sensor_id)}
                                                className="px-2 py-1.5 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
                                                title="Delete Sensor Permanently"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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

            {/* Deploy Node Overlay */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-xl font-bold">Deploy Hardware Node</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Node Identity</label>
                                    <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2" placeholder="e.g. PUN003" value={newSensor.sensor_code} onChange={e => setNewSensor({ ...newSensor, sensor_code: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Region ID</label>
                                    <input required type="number" min="1" max="10" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2" placeholder="1-10" value={newSensor.region_id} onChange={e => setNewSensor({ ...newSensor, region_id: parseInt(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Latitude</label>
                                    <input required type="number" step="any" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2" placeholder="18.52" value={newSensor.latitude} onChange={e => setNewSensor({ ...newSensor, latitude: parseFloat(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Longitude</label>
                                    <input required type="number" step="any" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2" placeholder="73.85" value={newSensor.longitude} onChange={e => setNewSensor({ ...newSensor, longitude: parseFloat(e.target.value) })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold uppercase text-slate-500">Coverage Radius (km)</label>
                                    <input required type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2" placeholder="20" value={newSensor.radius} onChange={e => setNewSensor({ ...newSensor, radius: parseInt(e.target.value) })} />
                                </div>
                                <div className="space-y-1 flex items-end">
                                    <div className="w-full p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm font-medium">
                                        <p>Environment mapped automatically by Region ruleset.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                                <button type="submit" className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/30">Deploy <Radio size={16} /></button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
