import { useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, LogOut, Plus, Power, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import Wordmark from '../components/Wordmark';
import CountUp from '../components/CountUp';
import AirParticles from '../components/AirParticles';
import { useAppContext } from '../context/AppContext';
import { createSensor, deleteSensor, errorText, fetchSensors, updateSensorStatus, useLatest, useRegions } from '../lib/api';
import { aqiColor, fmt } from '../lib/aqi';

const EMPTY = { sensor_code: '', region_id: 1, latitude: '', longitude: '', radius: 20 };

// Click anywhere on the mini-map to drop the sensor there
function Picker({ onPick }) {
    useMapEvents({ click: (e) => onPick(e.latlng) });
    return null;
}

function Recenter({ lat, lon }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lon) map.flyTo([lat, lon], Math.max(map.getZoom(), 8), { duration: 0.8 });
    }, [lat, lon, map]);
    return null;
}

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
                            <div className="col-span-2 h-48 rounded-xl overflow-hidden border border-line relative z-0">
                                <MapContainer center={[19.3, 75.9]} zoom={6} className="h-full w-full cursor-crosshair">
                                    <TileLayer className="journal-tiles" attribution="&copy; OpenStreetMap" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Picker onPick={(p) => {
                                        // the nearest city becomes the sensor's region, so its pollution profile fits
                                        const near = regions.reduce((a, r) => (Math.hypot(r.latitude - p.lat, r.longitude - p.lng) < Math.hypot(a.latitude - p.lat, a.longitude - p.lng) ? r : a), regions[0]);
                                        setForm((f) => ({ ...f, latitude: p.lat.toFixed(4), longitude: p.lng.toFixed(4), region_id: near?.region_id ?? f.region_id }));
                                    }} />
                                    <Recenter lat={+form.latitude} lon={+form.longitude} />
                                    {form.latitude && form.longitude && (
                                        <>
                                            <Circle center={[+form.latitude, +form.longitude]} radius={form.radius * 1000} pathOptions={{ color: '#3f8a5a', fillOpacity: 0.15, weight: 1.5 }} />
                                            <CircleMarker center={[+form.latitude, +form.longitude]} radius={7} pathOptions={{ color: '#0f2a20', weight: 2, fillColor: '#ebc03f', fillOpacity: 1 }} />
                                        </>
                                    )}
                                </MapContainer>
                                <span className="absolute bottom-2 left-2 z-[500] rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold pointer-events-none">Click the map to place the sensor</span>
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
    const stats = useMemo(() => {
        const live = latest.filter((r) => sensors.some((s) => s.sensor_id === r.sensor_id && s.is_active));
        const avg = live.length ? live.reduce((t, r) => t + r.aqi, 0) / live.length : null;
        return { avg, worst: live[0], severe: live.filter((r) => r.aqi > 300).length };
    }, [latest, sensors]);

    return (
        <div className="min-h-screen bg-bg text-ink relative isolate">
            <AirParticles aqi={stats.avg} className="fixed inset-0 -z-10" intensity={0.8} />
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

                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        ['Online', online, `of ${sensors.length} sensors`, null],
                        ['Network average', stats.avg, 'AQI across live sensors', aqiColor(stats.avg)],
                        ['Above 300', stats.severe, 'sensors reading very poor or worse', 'var(--crimson)'],
                        ['Worst right now', stats.worst?.aqi, stats.worst ? `${stats.worst.sensor_code}, ${stats.worst.region}` : '—', aqiColor(stats.worst?.aqi)],
                    ].map(([label, v, sub, color], i) => (
                        <motion.div key={label} className="panel p-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                            <p className="text-muted font-semibold">{label}</p>
                            <p className="aqi-num font-display text-4xl mt-1" style={{ color: color ?? undefined }}><CountUp value={v} /></p>
                            <p className="text-sm text-muted mt-1 truncate">{sub}</p>
                        </motion.div>
                    ))}
                </section>

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
                                    <AnimatePresence initial={false}>
                                    {sensors.map((s, i) => (
                                        <motion.tr key={s.sensor_id} layout className={s.is_active ? '' : 'text-muted'}
                                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0, transition: { delay: Math.min(i, 20) * 0.02 } }}
                                            exit={{ opacity: 0, x: 24, transition: { duration: 0.25 } }}>
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
                                        </motion.tr>
                                    ))}
                                    </AnimatePresence>
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
