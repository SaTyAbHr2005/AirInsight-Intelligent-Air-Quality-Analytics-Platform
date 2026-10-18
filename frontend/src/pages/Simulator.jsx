import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { errorText, predictAQI, useLatest, usePublicSensors, useRegions } from '../lib/api';
import { aqiColor, fmt } from '../lib/aqi';

const KEYS = ['PM2_5', 'PM10', 'NO2', 'CO', 'SO2', 'O3', 'NH3'];

/**
 * Pollution event simulator: pushes readings through the real model and stores them,
 * so the dashboard, map, trends and the landing story all react.
 */
export default function Simulator() {
    const { isSimulating, setIsSimulating, streamLog, setStreamLog } = useAppContext();
    const { data: sensors = [] } = usePublicSensors();
    const { data: latest = [] } = useLatest();
    const { data: regions = [] } = useRegions();
    const qc = useQueryClient();
    const [target, setTarget] = useState('all');
    const [intensity, setIntensity] = useState(1.6);
    const [interval, setIntervalMs] = useState(2500);
    const state = useRef();
    useEffect(() => {
        state.current = { sensors, latest, target, intensity };
    }, [sensors, latest, target, intensity]);

    useEffect(() => {
        if (!isSimulating) return;
        const id = setInterval(async () => {
            const { sensors, latest, target, intensity } = state.current;
            const pool = sensors.filter((s) => s.is_active && (target === 'all' || s.region_id === +target));
            if (!pool.length) return;
            const s = pool[Math.floor(Math.random() * pool.length)];
            const base = latest.find((r) => r.sensor_id === s.sensor_id);
            if (!base) return;
            const now = new Date();
            const payload = { sensor_id: s.sensor_id, hour: now.getHours(), day: now.getDate(), month: now.getMonth() + 1, weekday: (now.getDay() + 6) % 7 };
            KEYS.forEach((k) => (payload[k] = +((base[k] ?? 0) * intensity * (0.9 + Math.random() * 0.2)).toFixed(2)));
            try {
                const res = await predictAQI(payload, true);
                setStreamLog((log) => [{ ...payload, region: s.region, code: s.sensor_code, aqi: res.predicted_AQI, category: res.category, at: now }, ...log].slice(0, 60));
                qc.invalidateQueries();
            } catch (e) {
                toast.error(errorText(e, 'The reading was rejected.'));
                setIsSimulating(false);
            }
        }, interval);
        return () => clearInterval(id);
    }, [isSimulating, interval, qc, setIsSimulating, setStreamLog]);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl md:text-5xl">Pollution event simulator</h1>
                <p className="text-muted mt-2 max-w-[64ch]">
                    Stage a smog event: sensors report scaled versions of their latest readings, scored by the live model and saved. Every page, including the story on the home page, reacts.
                </p>
            </header>

            <section className="panel p-6 md:p-8 grid gap-6 md:grid-cols-[1fr_1fr_1fr_auto] items-end">
                <div>
                    <label htmlFor="target" className="field-label">Where</label>
                    <select id="target" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
                        <option value="all">Every city</option>
                        {regions.map((r) => <option key={r.region_id} value={r.region_id}>{r.region}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="intensity" className="field-label">Intensity: {intensity.toFixed(1)}× current air</label>
                    <input id="intensity" type="range" min="0.3" max="3" step="0.1" value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-[var(--crimson)]" />
                </div>
                <div>
                    <label htmlFor="pace" className="field-label">One reading every {(interval / 1000).toFixed(1)} s</label>
                    <input id="pace" type="range" min="800" max="6000" step="100" value={interval} onChange={(e) => setIntervalMs(+e.target.value)} className="w-full accent-[var(--leaf)]" />
                </div>
                {isSimulating ? (
                    <button onClick={() => setIsSimulating(false)} className="btn bg-crimson text-white"><Square size={16} /> Stop event</button>
                ) : (
                    <button onClick={() => setIsSimulating(true)} className="btn btn-sulphur"><Play size={16} /> Start event</button>
                )}
            </section>

            <section className="panel overflow-hidden">
                <div className="px-6 py-4 border-b border-line flex justify-between items-center">
                    <h2 className="text-xl">Readings sent</h2>
                    <span className="text-muted text-sm">{streamLog.length} this session</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="text-muted">
                            <tr>{['Time', 'Sensor', 'City', 'AQI', 'Band', 'PM2.5', 'PM10'].map((h) => <th key={h} className="px-6 py-3 font-semibold">{h}</th>)}</tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {streamLog.map((r, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-3 text-muted">{r.at.toLocaleTimeString()}</td>
                                    <td className="px-6 py-3 font-semibold">{r.code}</td>
                                    <td className="px-6 py-3">{r.region}</td>
                                    <td className="px-6 py-3 font-bold" style={{ color: aqiColor(r.aqi) }}>{fmt(r.aqi, 1)}</td>
                                    <td className="px-6 py-3">{r.category}</td>
                                    <td className="px-6 py-3">{fmt(r.PM2_5, 1)}</td>
                                    <td className="px-6 py-3">{fmt(r.PM10, 1)}</td>
                                </tr>
                            ))}
                            {!streamLog.length && (
                                <tr><td colSpan="7" className="px-6 py-10 text-center text-muted">Nothing sent yet. Pick a city and start an event.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
