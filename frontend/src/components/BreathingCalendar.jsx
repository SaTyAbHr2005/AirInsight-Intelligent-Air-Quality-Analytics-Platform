import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { aqiShade, band, fmt } from '../lib/aqi';

const hourLabel = (h) => new Date(2024, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' });

/**
 * A week of hourly AQI as a day × hour grid. Daily rhythms (rush hours, night-time
 * inversions) show up as vertical stripes, which a line chart hides.
 */
export default function BreathingCalendar({ history }) {
    const [hover, setHover] = useState(null);

    const { days, worstHour, bestHour, lo, hi } = useMemo(() => {
        const byDay = new Map();
        const sums = Array(24).fill(0), counts = Array(24).fill(0);
        for (const r of history) {
            const d = new Date(r.timestamp);
            const key = d.toDateString();
            if (!byDay.has(key)) byDay.set(key, { label: d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }), cells: Array(24).fill(null) });
            byDay.get(key).cells[d.getHours()] = r.aqi;
            sums[d.getHours()] += r.aqi;
            counts[d.getHours()]++;
        }
        const avg = sums.map((s, h) => (counts[h] ? s / counts[h] : null));
        const valid = avg.map((v, h) => [v, h]).filter(([v]) => v != null);
        const worst = valid.reduce((a, b) => (b[0] > a[0] ? b : a), [-1, 0]);
        const best = valid.reduce((a, b) => (b[0] < a[0] ? b : a), [Infinity, 0]);
        const all = history.map((r) => r.aqi);
        return { days: [...byDay.values()].slice(-7), worstHour: worst, bestHour: best, lo: Math.min(...all), hi: Math.max(...all) };
    }, [history]);

    if (!days.length) return null;

    return (
        <div>
            <div className="overflow-x-auto -mx-1 px-1">
                <div className="min-w-[640px]">
                    <div className="grid grid-cols-[4.5rem_repeat(24,1fr)] gap-[3px] text-xs text-muted mb-1.5">
                        <span />
                        {Array.from({ length: 24 }, (_, h) => (
                            <span key={h} className="text-center">{h % 3 === 0 ? hourLabel(h) : ''}</span>
                        ))}
                    </div>
                    {days.map((d, row) => (
                        <div key={d.label} className="grid grid-cols-[4.5rem_repeat(24,1fr)] gap-[3px] mb-[3px] items-center">
                            <span className="text-sm text-muted">{d.label}</span>
                            {d.cells.map((v, h) => (
                                <motion.button
                                    key={h}
                                    type="button"
                                    aria-label={v == null ? `${d.label} ${hourLabel(h)}: no reading` : `${d.label} ${hourLabel(h)}: AQI ${fmt(v)}`}
                                    onMouseEnter={() => v != null && setHover({ day: d.label, h, v })}
                                    onFocus={() => v != null && setHover({ day: d.label, h, v })}
                                    onMouseLeave={() => setHover(null)}
                                    initial={{ opacity: 0, scale: 0.4 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (row * 24 + h) * 0.0025, duration: 0.25 }}
                                    whileHover={{ scale: 1.35, zIndex: 2 }}
                                    className="aspect-square rounded-[4px] relative"
                                    // hue = AQI band, intensity = where the hour sits in this week's range
                                    style={{ background: v == null ? 'var(--line)' : aqiShade(v), opacity: v == null ? 0.4 : 0.35 + 0.65 * ((v - lo) / (hi - lo || 1)) }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <p className="mt-4 min-h-[1.75rem] text-muted" aria-live="polite">
                {hover ? (
                    <><strong className="text-ink">{hover.day}, {hourLabel(hover.h)}:</strong> AQI {fmt(hover.v)}, {band(hover.v)?.name.toLowerCase()}</>
                ) : (
                    <>Over the week, the air is usually worst around <strong className="text-ink">{hourLabel(worstHour[1])}</strong> ({fmt(worstHour[0])}) and cleanest around <strong className="text-ink">{hourLabel(bestHour[1])}</strong> ({fmt(bestHour[0])}).</>
                )}
            </p>
        </div>
    );
}
