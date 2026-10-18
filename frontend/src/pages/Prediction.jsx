import { useEffect, useState } from 'react';
import { predictAQI, errorText } from '../lib/api';
import { POLLUTANTS, band, cigarettes, fmt } from '../lib/aqi';
import ButterflyGauge, { verdict } from '../components/ButterflyGauge';

const MAX = { pm25: 500, pm10: 800, no2: 300, co: 10, so2: 200, o3: 250, nh3: 150 };

// Recognisable Indian air days, roughly sized from CPCB station records
const SCENES = [
    { name: 'Monsoon morning', v: { pm25: 12, pm10: 30, no2: 10, co: 0.3, so2: 5, o3: 20, nh3: 5 }, hour: 7, month: 7 },
    { name: 'Weekday rush hour', v: { pm25: 85, pm10: 160, no2: 75, co: 1.9, so2: 18, o3: 45, nh3: 20 }, hour: 9, month: 11 },
    { name: 'Diwali night', v: { pm25: 320, pm10: 520, no2: 110, co: 4.5, so2: 60, o3: 40, nh3: 45 }, hour: 23, month: 11 },
    { name: 'Coal town in winter', v: { pm25: 240, pm10: 420, no2: 90, co: 3.2, so2: 140, o3: 70, nh3: 60 }, hour: 6, month: 1 },
];

const now = new Date();

export default function Prediction() {
    const [v, setV] = useState(SCENES[1].v);
    const [when, setWhen] = useState({ hour: now.getHours(), month: now.getMonth() + 1 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    // live what-if: debounce the slider, never write to the database
    useEffect(() => {
        const t = setTimeout(async () => {
            try {
                const day = now.getDate();
                const weekday = (now.getDay() + 6) % 7; // Monday = 0, as in training
                const res = await predictAQI({
                    PM2_5: v.pm25, PM10: v.pm10, NO2: v.no2, CO: v.co, SO2: v.so2, O3: v.o3, NH3: v.nh3,
                    hour: when.hour, day, month: when.month, weekday,
                });
                setResult(res);
                setError('');
            } catch (e) {
                setError(errorText(e, 'The model could not score these values.'));
            }
        }, 250);
        return () => clearTimeout(t);
    }, [v, when]);

    const aqi = result?.predicted_AQI;
    const b = band(aqi);

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-4xl md:text-5xl">Prediction lab</h1>
                <p className="text-muted mt-2 max-w-[62ch]">
                    Mix your own air and watch the model score it. Nothing here is saved; it’s a sandbox for asking “what if the traffic doubled?”
                </p>
            </header>

            <div className="flex flex-wrap gap-2">
                {SCENES.map((s) => (
                    <button key={s.name} onClick={() => { setV(s.v); setWhen({ hour: s.hour, month: s.month }); }} className="btn btn-ghost !py-2 text-sm">
                        {s.name}
                    </button>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                <section className="panel p-6 md:p-8 space-y-6">
                    {POLLUTANTS.map((p) => (
                        <div key={p.key}>
                            <div className="flex justify-between items-baseline">
                                <label htmlFor={p.key} className="font-semibold">{p.label}</label>
                                <span className="tabular-nums"><strong>{fmt(v[p.key], p.key === 'co' ? 1 : 0)}</strong> <span className="text-muted text-sm">{p.unit}</span></span>
                            </div>
                            <input id={p.key} type="range" min="0" max={MAX[p.key]} step={p.key === 'co' ? 0.1 : 1} value={v[p.key]}
                                onChange={(e) => setV({ ...v, [p.key]: parseFloat(e.target.value) })}
                                className="w-full mt-2 accent-[var(--leaf)]" />
                        </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label htmlFor="hour" className="field-label">Hour of day</label>
                            <input id="hour" type="number" min="0" max="23" className="field" value={when.hour}
                                onChange={(e) => setWhen({ ...when, hour: Math.min(23, Math.max(0, +e.target.value || 0)) })} />
                        </div>
                        <div>
                            <label htmlFor="month" className="field-label">Month</label>
                            <select id="month" className="field" value={when.month} onChange={(e) => setWhen({ ...when, month: +e.target.value })}>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i + 1}>{new Date(2024, i).toLocaleString([], { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="panel p-6 md:p-8 lg:sticky lg:top-8 self-start" aria-live="polite">
                    <p className="text-muted font-semibold">Predicted AQI</p>
                    <p className="aqi-num font-display text-8xl leading-none mt-2" style={{ color: b?.color }}>{fmt(aqi)}</p>
                    <p className="font-display text-2xl mt-2">{b?.name ?? '…'}</p>
                    {error && <p className="mt-3 text-crimson font-semibold">{error}</p>}
                    <ButterflyGauge aqi={aqi} className="h-44 mt-2" />
                    <p className="font-display text-lg text-center">{verdict(aqi)}</p>
                    <dl className="mt-6 space-y-3 text-sm">
                        <div className="flex justify-between gap-4"><dt className="text-muted">Health risk</dt><dd className="font-semibold">{b?.risk ?? '—'}</dd></div>
                        <div className="flex justify-between gap-4"><dt className="text-muted">Like smoking</dt><dd className="font-semibold">{fmt(cigarettes(v.pm25), 1)} cigarettes a day</dd></div>
                    </dl>
                    <p className="mt-4">{b?.advice}</p>
                </section>
            </div>
        </div>
    );
}
