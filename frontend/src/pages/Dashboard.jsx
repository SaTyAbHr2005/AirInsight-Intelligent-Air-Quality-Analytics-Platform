import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';
import RegionPicker, { useSelectedRegion } from '../components/RegionPicker';
import ButterflyGauge, { verdict } from '../components/ButterflyGauge';
import CountUp from '../components/CountUp';
import AdvisoryPanel from '../components/AdvisoryPanel';
import { useForecast, useLatest } from '../lib/api';
import { POLLUTANTS, aqiColor, band, cigarettes, dominantSource, fmt } from '../lib/aqi';

const ago = (ts) => {
    if (!ts) return '';
    const m = Math.round((Date.now() - new Date(ts)) / 60000);
    return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

const reveal = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

const clock = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric' });

// Now + six forecast hours as growing bars; the cleanest hour gets the sun.
function Outlook({ now, lead, outlook }) {
    if (!outlook?.length) {
        return <p className="text-muted">The forecast needs six hours of readings from this city’s sensors.</p>;
    }
    const hours = [{ hour: 0, aqi: now, timestamp: lead?.timestamp }, ...outlook];
    const best = outlook.reduce((a, b) => (b.aqi < a.aqi ? b : a));
    // scale bars to the spread, not to zero, so a 30-point swing is visible
    const vals = hours.map((h) => h.aqi);
    const lo = Math.min(...vals) - 25, hi = Math.max(...vals);
    const gain = now - best.aqi;
    const worth = Math.max(10, now * 0.06); // smaller dips aren't worth planning around
    return (
        <>
            <div className="flex items-end gap-2 sm:gap-3 h-44 mt-2" role="img" aria-label={`AQI now ${fmt(now)}, lowest in the next six hours ${fmt(best.aqi)} at ${clock(best.timestamp)}`}>
                {hours.map((h, i) => {
                    const isBest = h === best;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <span className={`text-xs tabular-nums ${isBest ? 'font-bold text-ink' : 'text-muted'}`}>{fmt(h.aqi)}</span>
                            <motion.div
                                className="w-full rounded-t-xl relative"
                                style={{ background: aqiColor(h.aqi), opacity: i === 0 ? 1 : 0.82 }}
                                initial={{ height: 0 }}
                                animate={{ height: `${20 + ((h.aqi - lo) / (hi - lo || 1)) * 80}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.06 }}
                            >
                                {isBest && (
                                    <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6, type: 'spring' }}
                                        className="absolute -top-9 left-1/2 -translate-x-1/2 text-sulphur">
                                        <Sun size={22} fill="currentColor" />
                                    </motion.span>
                                )}
                            </motion.div>
                            <span className={`text-xs ${i === 0 ? 'font-bold text-ink' : 'text-muted'}`}>{i === 0 ? 'Now' : `+${h.hour}h`}</span>
                        </div>
                    );
                })}
            </div>
            <p className="mt-5 text-lg">
                {gain > worth ? (
                    <>Best time to step out: <strong>around {clock(best.timestamp)}</strong>, when the air should ease to {fmt(best.aqi)} ({band(best.aqi)?.name.toLowerCase()}).</>
                ) : gain < -worth ? (
                    <>It only gets worse from here. If you need to go out, <strong>go now</strong>.</>
                ) : (
                    <>The air should hold steady near {fmt(now)} for the next six hours.</>
                )}
            </p>
        </>
    );
}

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
                        <CountUp value={region.aqi} className="aqi-num font-display leading-none text-[clamp(5rem,14vw,9.5rem)] transition-colors duration-700" style={{ color: b?.color }} />
                        <div className="pb-4">
                            <p className="text-3xl font-display">{b?.name}</p>
                            <p className="text-muted">Air quality index, city average</p>
                        </div>
                    </div>
                    <p className="mt-6 text-lg max-w-[46ch]">{b?.risk} health risk. Your personal advisory is just below.</p>
                    {/* the band scale, with a marker where this city sits */}
                    <div className="mt-8 relative h-2.5 rounded-full overflow-hidden flex" aria-hidden="true">
                        {['#4e9f63', '#9fc04f', '#e2b53a', '#d4803a', '#c2415d', '#6e2a54'].map((c, i) => (
                            <span key={c} className={i < 2 ? 'flex-[1]' : 'flex-[2]'} style={{ background: c }} />
                        ))}
                    </div>
                    <div className="relative h-4" aria-hidden="true">
                        <motion.span className="absolute -top-1 h-5 w-[3px] rounded bg-ink" initial={{ left: '0%' }} animate={{ left: `${Math.min(100, ((region.aqi ?? 0) / 500) * 100)}%` }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} />
                    </div>
                </div>

                <div className="panel p-6 flex flex-col">
                    <ButterflyGauge aqi={region.aqi} className="h-52 -mt-2" />
                    <p className="font-display text-xl text-center mt-1">{verdict(region.aqi)}</p>
                    <p className="text-muted text-center text-sm mt-1">Its flight speed and colour follow the live AQI.</p>
                </div>
            </section>

            <AdvisoryPanel region={region} />

            <motion.section {...reveal} className="grid gap-6 lg:grid-cols-3">
                <div className="panel p-6 md:p-8 lg:col-span-2">
                    <h2 className="text-2xl">The next six hours</h2>
                    <p className="text-muted text-sm mt-1">Forecast for {lead?.sensor_code ?? 'the worst sensor'}, the most polluted sensor in {region.region}.</p>
                    <Outlook now={lead?.aqi} lead={lead} outlook={fc?.outlook} />
                </div>
                <div className="grid gap-6">
                    <div className="panel p-6">
                        <p className="text-muted font-semibold">Like smoking</p>
                        <p className="font-display text-5xl mt-2"><CountUp value={cigs} decimals={1} /></p>
                        <p className="text-muted mt-2">cigarettes a day, from the PM2.5 you’d breathe here over 24 hours.</p>
                    </div>
                    <div className="panel p-6">
                        <p className="text-muted font-semibold">Main source</p>
                        <p className="font-display text-3xl mt-2 leading-tight">{source?.name ?? '—'}</p>
                        <p className="text-muted mt-2">Estimated from which pollutant sits furthest above its safe limit.</p>
                    </div>
                </div>
            </motion.section>

            <motion.section {...reveal} className="panel p-6 md:p-8">
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
                                    <motion.div className="h-full rounded-full" style={{ background: ratio > 1 ? 'var(--crimson)' : 'var(--leaf)' }}
                                        initial={{ width: 0 }} animate={{ width: `${Math.min(100, ratio * 50)}%` }}
                                        transition={{ type: 'spring', stiffness: 80, damping: 18 }} />
                                </div>
                                <p className="text-sm text-muted mt-1.5">
                                    {ratio > 1 ? `${fmt(ratio, 1)}× the safe limit. ` : 'Within the safe limit. '}{p.what}.
                                </p>
                            </div>
                        );
                    })}
                </div>
            </motion.section>

            <motion.section {...reveal} className="panel p-6 md:p-8">
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
            </motion.section>
        </div>
    );
}
