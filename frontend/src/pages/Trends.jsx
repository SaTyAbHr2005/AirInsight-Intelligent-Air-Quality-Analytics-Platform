import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import RegionPicker, { useSelectedRegion } from '../components/RegionPicker';
import BreathingCalendar from '../components/BreathingCalendar';
import CountUp from '../components/CountUp';
import { useForecast, useHistory, useLatest } from '../lib/api';
import { BANDS, POLLUTANTS, aqiColor, fmt } from '../lib/aqi';

const RANGES = [
    { hours: 24, label: 'Day' },
    { hours: 72, label: '3 days' },
    { hours: 168, label: 'Week' },
];

const time = (ts, hours) =>
    new Date(ts).toLocaleString([], hours > 24 ? { weekday: 'short', hour: '2-digit' } : { hour: '2-digit', minute: '2-digit' });

function ChartTip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="panel px-3 py-2 text-sm shadow-lg">
            <p className="text-muted mb-1">{label}</p>
            {payload.filter((p) => p.value != null).map((p) => (
                <p key={p.dataKey} className="font-semibold" style={{ color: p.color }}>{p.name}: {fmt(p.value, 1)}</p>
            ))}
        </div>
    );
}

function Segmented({ options, value, onChange, label }) {
    return (
        <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line p-1 text-sm">
            {options.map((o) => (
                <button
                    key={o.value}
                    role="radio"
                    aria-checked={value === o.value}
                    onClick={() => onChange(o.value)}
                    className={`px-3.5 py-1.5 rounded-full font-semibold ${value === o.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export default function Trends() {
    const { region, regions } = useSelectedRegion();
    const [compareId, setCompareId] = useState('');
    const [hours, setHours] = useState(24);
    const [pollutant, setPollutant] = useState('pm25');
    const { data: history = [], isLoading } = useHistory(region?.region_id, hours);
    const { data: week = [] } = useHistory(region?.region_id, 168);
    const { data: other = [] } = useHistory(compareId ? +compareId : null, hours);
    const otherName = regions.find((r) => r.region_id === +compareId)?.region;
    const { data: latest = [] } = useLatest();
    const lead = latest.find((s) => s.region_id === region?.region_id);
    const { data: fc } = useForecast(lead?.sensor_id);

    const series = useMemo(() => {
        const otherBy = Object.fromEntries(other.map((o) => [o.timestamp, o.aqi]));
        const rows = history.map((h) => ({ ...h, time: time(h.timestamp, hours), compare: otherBy[h.timestamp] }));
        if (rows.length && fc?.outlook) {
            rows[rows.length - 1].forecast = rows[rows.length - 1].aqi; // bridge the lines
            fc.outlook.forEach((o) => rows.push({ time: `${time(o.timestamp, hours)} (forecast)`, forecast: o.aqi }));
        }
        return rows;
    }, [history, other, fc, hours]);

    const vals = history.map((h) => h.aqi);
    const peak = vals.length ? Math.max(...vals) : null;
    const low = vals.length ? Math.min(...vals) : null;
    const first = vals[0], last = vals[vals.length - 1];
    const change = vals.length > 1 ? ((last - first) / first) * 100 : null;
    const p = POLLUTANTS.find((x) => x.key === pollutant);
    const ceiling = Math.max(...series.map((r) => Math.max(r.aqi ?? 0, r.forecast ?? 0, r.compare ?? 0)), 0);
    const ticks = [0, 50, 100, 200, 300, 400, 500].filter((t, i, a) => t <= ceiling || a[i - 1] < ceiling);
    const top = ticks[ticks.length - 1];

    return (
        <div className="space-y-8">
            <RegionPicker />

            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl">How {region?.region ?? 'the air'} has been breathing</h1>
                    <p className="text-muted mt-2 max-w-[60ch]">Hourly city average across all sensors, with the model’s six-hour outlook as a dashed line.</p>
                </div>
                <Segmented label="Time range" value={hours} onChange={setHours} options={RANGES.map((r) => ({ value: r.hours, label: r.label }))} />
            </header>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    ['Now', last],
                    ['Peak', peak],
                    ['Lowest', low],
                ].map(([label, v]) => (
                    <div key={label} className="panel p-5">
                        <p className="text-muted font-semibold">{label}</p>
                        <p className="aqi-num font-display text-4xl mt-1" style={{ color: aqiColor(v) }}><CountUp value={v} /></p>
                    </div>
                ))}
                <div className="panel p-5">
                    <p className="text-muted font-semibold">Change over range</p>
                    <p className={`font-display text-4xl mt-1 ${change > 0 ? 'text-crimson' : 'text-leaf'}`}>
                        {change == null ? '—' : `${change > 0 ? '+' : ''}${fmt(change)}%`}
                    </p>
                </div>
            </section>

            <section className="panel p-4 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                        <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-ink rounded" /> {region?.region}</span>
                        <span className="flex items-center gap-2"><span className="h-0.5 w-5 border-t-2 border-dashed border-crimson" /> Forecast</span>
                        {otherName && <span className="flex items-center gap-2"><span className="h-0.5 w-5 bg-sulphur rounded" /> {otherName}</span>}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <span className="text-muted font-semibold">Compare with</span>
                        <select value={compareId} onChange={(e) => setCompareId(e.target.value)} className="field !py-1.5 !w-auto">
                            <option value="">No other city</option>
                            {regions.filter((r) => r.region_id !== region?.region_id).map((r) => <option key={r.region_id} value={r.region_id}>{r.region}</option>)}
                        </select>
                    </label>
                </div>
                <div className="h-[380px]">
                    {isLoading ? (
                        <div className="h-full grid place-items-center text-muted">Reading the archive…</div>
                    ) : (
                        <ResponsiveContainer>
                            <LineChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                {BANDS.map((b, i) => (
                                    <ReferenceArea key={b.name} y1={i ? BANDS[i - 1].max : 0} y2={Math.min(b.max, top)} fill={b.color} fillOpacity={0.08} ifOverflow="hidden" />
                                ))}
                                <CartesianGrid vertical={false} stroke="var(--line)" />
                                <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={40} />
                                <YAxis domain={[0, top]} ticks={ticks} tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip content={<ChartTip />} />
                                <Line type="monotone" dataKey="aqi" name="AQI" stroke="var(--ink)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
                                <Line type="monotone" dataKey="compare" name={otherName ?? 'Compare'} stroke="var(--sulphur)" strokeWidth={2.5} dot={false} isAnimationActive={false} connectNulls />
                                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--crimson)" strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 3 }} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} className="panel p-4 md:p-7">
                <h2 className="text-2xl">Breathing calendar</h2>
                <p className="text-muted text-sm mt-1 mb-5">Every hour of the past week. Vertical stripes are the city’s daily rhythm; hover a square for its reading.</p>
                <BreathingCalendar history={week} />
            </motion.section>

            <section className="panel p-4 md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-2xl">{p.label}</h2>
                        <p className="text-muted text-sm">{p.what}. Dashed line marks the safe limit.</p>
                    </div>
                    <Segmented label="Pollutant" value={pollutant} onChange={setPollutant} options={POLLUTANTS.map((x) => ({ value: x.key, label: x.label }))} />
                </div>
                <div className="h-[260px]">
                    <ResponsiveContainer>
                        <AreaChart data={series.filter((s) => s[pollutant] != null)} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="pollutantFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--sulphur)" stopOpacity={0.55} />
                                    <stop offset="100%" stopColor="var(--sulphur)" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="var(--line)" />
                            <XAxis dataKey="time" tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={40} />
                            <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<ChartTip />} />
                            <ReferenceArea y1={p.safe} y2={p.safe} stroke="var(--crimson)" strokeDasharray="4 4" ifOverflow="extendDomain" />
                            <Area type="monotone" dataKey={pollutant} name={`${p.label} (${p.unit})`} stroke="#b88f1c" strokeWidth={2} fill="url(#pollutantFill)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
}
