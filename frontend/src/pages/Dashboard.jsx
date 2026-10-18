import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RegionPicker, { useSelectedRegion } from '../components/RegionPicker';
import ButterflyGauge, { verdict } from '../components/ButterflyGauge';
import { useForecast, useLatest } from '../lib/api';
import { POLLUTANTS, aqiColor, band, cigarettes, dominantSource, fmt } from '../lib/aqi';

const ago = (ts) => {
    if (!ts) return '';
    const m = Math.round((Date.now() - new Date(ts)) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

function Offline({ error }) {
    return (
        <div className="panel p-10 text-center space-y-2">
            <h2 className="text-2xl">The sensors aren’t answering</h2>
            <p className="text-muted">{error ? 'Cannot reach the AirInsight server. Check that the backend is running and VITE_API_URL points to it.' : 'Loading the network…'}</p>
        </div>
    );
}

export default function Dashboard() {
    const { region, isError } = useSelectedRegion();
    const { data: latest = [] } = useLatest();
    const sensors = useMemo(() => latest.filter((s) => s.region_id === region?.region_id), [latest, region]);
    const lead = sensors[0]; // worst sensor in the city
    const { data: fc } = useForecast(lead?.sensor_id);

    // city average of every pollutant
    const avg = useMemo(() => {
        if (!sensors.length) return null;
        const o = {};
        POLLUTANTS.forEach((p) => (o[p.api] = sensors.reduce((s, r) => s + (r[p.api] ?? 0), 0) / sensors.length));
        return o;
    }, [sensors]);

    if (!region) return <Offline error={isError} />;

    const b = band(region.aqi);
    const next = fc?.outlook?.[0];
    const delta = next && lead ? next.aqi - lead.aqi : null;
    const source = dominantSource(avg);
    const cigs = cigarettes(avg?.PM2_5);

    return (
        <div className="space-y-8">
            <RegionPicker />

            <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="panel p-7 md:p-9 relative overflow-hidden">
                    <p className="text-muted font-semibold">
                        {region.region}, {region.active_sensors} sensor{region.active_sensors === 1 ? '' : 's'} reporting, updated {ago(lead?.timestamp)}
                    </p>
                    <div className="mt-4 flex items-end gap-5 flex-wrap">
                        <span className="aqi-num font-display leading-none text-[clamp(5rem,14vw,9.5rem)]" style={{ color: b?.color }}>{fmt(region.aqi)}</span>
                        <div className="pb-4">
                            <p className="text-3xl font-display">{b?.name}</p>
                            <p className="text-muted">Air quality index, city average</p>
                        </div>
                    </div>
                    <p className="mt-6 text-lg max-w-[46ch]">{b?.advice}</p>
                    {/* the band scale, with a marker where this city sits */}
                    <div className="mt-8 relative h-2.5 rounded-full overflow-hidden flex" aria-hidden="true">
                        {['#4e9f63', '#9fc04f', '#e2b53a', '#d4803a', '#c2415d', '#6e2a54'].map((c, i) => (
                            <span key={c} className={i < 2 ? 'flex-[1]' : 'flex-[2]'} style={{ background: c }} />
                        ))}
                    </div>
                    <div className="relative h-4" aria-hidden="true">
                        <span className="absolute -top-1 h-5 w-[3px] rounded bg-ink" style={{ left: `${Math.min(100, ((region.aqi ?? 0) / 500) * 100)}%` }} />
                    </div>
                </div>

                <div className="panel p-6 flex flex-col">
                    <ButterflyGauge aqi={region.aqi} className="h-52 -mt-2" />
                    <p className="font-display text-xl text-center mt-1">{verdict(region.aqi)}</p>
                    <p className="text-muted text-center text-sm mt-1">Its flight speed and colour follow the live AQI.</p>
                </div>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
                <div className="panel p-6">
                    <p className="text-muted font-semibold">Like smoking</p>
                    <p className="font-display text-5xl mt-2">{fmt(cigs, 1)}</p>
                    <p className="text-muted mt-2">cigarettes a day, from the PM2.5 you’d breathe here over 24 hours.</p>
                </div>
                <div className="panel p-6">
                    <p className="text-muted font-semibold">Next hour</p>
                    <p className="aqi-num font-display text-5xl mt-2" style={{ color: aqiColor(next?.aqi) }}>{fmt(next?.aqi)}</p>
                    <p className="text-muted mt-2">
                        {delta == null ? 'Forecast needs six hours of readings.' : `${delta > 0 ? 'Rising' : 'Falling'} by ${fmt(Math.abs(delta), 1)} at ${lead.sensor_code}. `}
                        <Link to="/trends" className="underline underline-offset-4 decoration-line hover:decoration-ink">See the 6-hour outlook</Link>
                    </p>
                </div>
                <div className="panel p-6">
                    <p className="text-muted font-semibold">Main source</p>
                    <p className="font-display text-3xl mt-2 leading-tight">{source?.name ?? '—'}</p>
                    <p className="text-muted mt-2">Estimated from which pollutant sits furthest above its safe limit.</p>
                </div>
            </section>

            <section className="panel p-6 md:p-8">
                <h2 className="text-2xl mb-6">What’s in the air</h2>
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                    {POLLUTANTS.map((p) => {
                        const v = avg?.[p.api];
                        const ratio = v == null ? 0 : v / p.safe;
                        return (
                            <div key={p.key}>
                                <div className="flex items-baseline justify-between gap-4">
                                    <span className="font-semibold text-lg">{p.label}</span>
                                    <span className="tabular-nums"><strong className="text-lg">{fmt(v, 1)}</strong> <span className="text-muted text-sm">{p.unit}</span></span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-line overflow-hidden" aria-hidden="true">
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio * 50)}%`, background: ratio > 1 ? 'var(--crimson)' : 'var(--leaf)' }} />
                                </div>
                                <p className="text-sm text-muted mt-1.5">
                                    {ratio > 1 ? `${fmt(ratio, 1)}× the safe limit. ` : 'Within the safe limit. '}{p.what}.
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="panel p-6 md:p-8">
                <h2 className="text-2xl mb-4">Sensors in {region.region}</h2>
                <ul className="divide-y divide-line">
                    {sensors.map((s) => (
                        <li key={s.sensor_id} className="py-3 flex items-center gap-4">
                            <span className="h-3 w-3 rounded-full" style={{ background: aqiColor(s.aqi) }} />
                            <span className="font-semibold w-24">{s.sensor_code}</span>
                            <span className="text-muted flex-1">{band(s.aqi)?.name}</span>
                            <span className="tabular-nums font-semibold">{fmt(s.aqi)}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
