import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, LogOut, Plus, Power, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import Wordmark from '../components/Wordmark';
import { useAppContext } from '../context/AppContext';
import { createSensor, deleteSensor, errorText, fetchSensors, updateSensorStatus, useLatest, useRegions } from '../lib/api';
import { aqiColor, fmt } from '../lib/aqi';

const EMPTY = { sensor_code: '', region_id: 1, latitude: '', longitude: '', radius: 20 };

function DeployDialog({ open, onClose, regions }) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const qc = useQueryClient();
    const set = (k, parse = (x) => x) => (e) => setForm({ ...form, [k]: parse(e.target.value) });

    // prefill coordinates with the chosen city's centre
    const pickRegion = (e) => {
        const r = regions.find((x) => x.region_id === +e.target.value);
        setForm({ ...form, region_id: +e.target.value, latitude: r?.latitude?.toFixed(4) ?? '', longitude: r?.longitude?.toFixed(4) ?? '' });
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await createSensor({ ...form, latitude: +form.latitude, longitude: +form.longitude, radius: +form.radius });
            toast.success(`Sensor ${form.sensor_code} deployed`);
            qc.invalidateQueries();
            setForm(EMPTY);
            onClose();
        } catch (err) {
            toast.error(errorText(err, 'The sensor could not be deployed.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-50 grid place-items-center bg-chlorophyll/60 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                    <motion.form
                        role="dialog" aria-modal="true" aria-labelledby="deploy-title"
                        onSubmit={submit} onClick={(e) => e.stopPropagation()}
                        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
                        className="panel bg-surface w-full max-w-lg p-7 space-y-5"
                    >
                        <div className="flex justify-between items-center">
                            <h2 id="deploy-title" className="text-2xl">Deploy a sensor</h2>
                            <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-full hover:bg-raised"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="code" className="field-label">Sensor code</label>
                                <input id="code" required className="field" placeholder="PUN003" value={form.sensor_code} onChange={set('sensor_code', (v) => v.toUpperCase())} />
                            </div>
                            <div>
                                <label htmlFor="region" className="field-label">City</label>
                                <select id="region" className="field" value={form.region_id} onChange={pickRegion}>
                                    {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="lat" className="field-label">Latitude</label>
                                <input id="lat" required type="number" step="any" className="field" value={form.latitude} onChange={set('latitude')} />
                            </div>
                            <div>
                                <label htmlFor="lon" className="field-label">Longitude</label>
                                <input id="lon" required type="number" step="any" className="field" value={form.longitude} onChange={set('longitude')} />
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="radius" className="field-label">Coverage radius: {form.radius} km</label>
                                <input id="radius" type="range" min="5" max="60" value={form.radius} onChange={set('radius', Number)} className="w-full accent-[var(--leaf)]" />
                            </div>
                        </div>
                        <p className="text-sm text-muted">The sensor takes on its city’s pollution profile and starts reporting with the next network check-in.</p>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
                            <button type="submit" disabled={saving} className="btn btn-sulphur">{saving ? <Loader2 size={18} className="animate-spin" /> : 'Deploy sensor'}</button>
                        </div>
                    </motion.form>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function AdminDashboard() {
    const { logout } = useAppContext();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [confirming, setConfirming] = useState(null);
    const { data: regions = [] } = useRegions();
    const { data: latest = [] } = useLatest();
    const { data: sensors = [], isLoading, error } = useQuery({ queryKey: ['admin-sensors'], queryFn: fetchSensors });

    useEffect(() => {
        if (error?.response?.status === 401) {
            logout();
            toast.error('Your session expired. Sign in again.');
            navigate('/admin');
        }
    }, [error, logout, navigate]);

    const run = async (fn, ok) => {
        try {
            await fn();
            toast.success(ok);
            qc.invalidateQueries();
        } catch (e) {
            toast.error(errorText(e, 'That change was not saved.'));
        }
    };

    const aqiOf = (id) => latest.find((r) => r.sensor_id === id)?.aqi;
    const online = sensors.filter((s) => s.is_active).length;

    return (
        <div className="min-h-screen bg-bg text-ink">
            <header className="border-b border-line">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                    <Wordmark to="/dashboard" />
                    <div className="flex items-center gap-2">
                        <Link to="/simulator" className="btn btn-ghost !py-2 text-sm">Simulator</Link>
                        <button onClick={() => { logout(); navigate('/'); }} className="btn btn-ghost !py-2 text-sm"><LogOut size={16} /> Sign out</button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 space-y-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl">Sensor network</h1>
                        <p className="text-muted mt-2">{online} of {sensors.length} sensors online.</p>
                    </div>
                    <button onClick={() => setShowAdd(true)} className="btn btn-sulphur"><Plus size={18} /> Deploy a sensor</button>
                </div>

                <section className="panel overflow-hidden">
                    {isLoading ? (
                        <div className="p-16 grid place-items-center"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="text-muted border-b border-line">
                                    <tr>{['Sensor', 'City', 'Latest AQI', 'Location', 'Radius', 'Status', ''].map((h, i) => <th key={i} className="px-6 py-4 font-semibold">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {sensors.map((s) => (
                                        <tr key={s.sensor_id} className={s.is_active ? '' : 'text-muted'}>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold">{s.sensor_code}</span>
                                                {s.source_station && <span className="block text-xs text-muted">History from CPCB {s.source_station}</span>}
                                            </td>
                                            <td className="px-6 py-4">{s.region}</td>
                                            <td className="px-6 py-4 font-semibold" style={{ color: s.is_active ? aqiColor(aqiOf(s.sensor_id)) : undefined }}>{s.is_active ? fmt(aqiOf(s.sensor_id)) : '—'}</td>
                                            <td className="px-6 py-4 tabular-nums text-muted">{fmt(s.latitude, 3)}, {fmt(s.longitude, 3)}</td>
                                            <td className="px-6 py-4">{s.radius} km</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-2 font-semibold">
                                                    <span className={`h-2 w-2 rounded-full ${s.is_active ? 'bg-leaf' : 'bg-muted'}`} />
                                                    {s.is_active ? 'Online' : 'Paused'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => run(() => updateSensorStatus(s.sensor_id, !s.is_active), s.is_active ? `${s.sensor_code} paused` : `${s.sensor_code} back online`)}
                                                        className="btn btn-ghost !px-3 !py-1.5 text-xs"
                                                    >
                                                        <Power size={14} /> {s.is_active ? 'Pause' : 'Resume'}
                                                    </button>
                                                    {confirming === s.sensor_id ? (
                                                        <button
                                                            onClick={() => { setConfirming(null); run(() => deleteSensor(s.sensor_id), `${s.sensor_code} removed with its history`); }}
                                                            onBlur={() => setConfirming(null)}
                                                            autoFocus
                                                            className="btn !px-3 !py-1.5 text-xs bg-crimson text-white"
                                                        >
                                                            Remove sensor and history
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => setConfirming(s.sensor_id)} aria-label={`Remove ${s.sensor_code}`} className="btn btn-ghost !px-2.5 !py-1.5 text-xs hover:text-crimson">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {!sensors.length && (
                                        <tr><td colSpan="7" className="px-6 py-12 text-center text-muted">No sensors yet. Deploy one to start listening.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>

            <DeployDialog open={showAdd} onClose={() => setShowAdd(false)} regions={regions} />
        </div>
    );
}
