import { useEffect, useMemo, useState } from 'react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLatest, usePublicSensors } from '../lib/api';
import { aqiColor, band, cigarettes, fmt } from '../lib/aqi';

const FILTERS = [
    { value: 'all', label: 'All sensors' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
];

function FlyTo({ target }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo([target.latitude, target.longitude], 10, { duration: 1.2 });
    }, [map, target]);
    return null;
}

export default function MapView() {
    const { data: sensors = [], isLoading } = usePublicSensors();
    const { data: latest = [] } = useLatest();
    const [filter, setFilter] = useState('all');
    const [focus, setFocus] = useState(null);

    const nodes = useMemo(() => {
        const byId = Object.fromEntries(latest.map((r) => [r.sensor_id, r]));
        return sensors
            .filter((s) => s.latitude != null && s.longitude != null)
            .map((s) => ({ ...s, reading: byId[s.sensor_id] }))
            .filter((s) => filter === 'all' || (filter === 'online') === s.is_active)
            .sort((a, b) => (b.reading?.aqi ?? -1) - (a.reading?.aqi ?? -1));
    }, [sensors, latest, filter]);

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl">Where the air is heaviest</h1>
                    <p className="text-muted mt-2">Each circle is a sensor’s coverage area, coloured by its latest reading.</p>
                </div>
                <div role="radiogroup" aria-label="Filter sensors" className="inline-flex rounded-full border border-line p-1 text-sm">
                    {FILTERS.map((f) => (
                        <button key={f.value} role="radio" aria-checked={filter === f.value} onClick={() => setFilter(f.value)}
                            className={`px-3.5 py-1.5 rounded-full font-semibold ${filter === f.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="panel overflow-hidden h-[65vh] min-h-[420px] relative z-0">
                    {isLoading && <div className="absolute inset-0 z-[500] grid place-items-center bg-bg/60 text-muted">Locating sensors…</div>}
                    <MapContainer center={[19.3, 75.9]} zoom={6} className="h-full w-full" scrollWheelZoom>
                        <TileLayer
                            className="journal-tiles"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <FlyTo target={focus} />
                        {nodes.map((s) => {
                            const aqi = s.is_active ? s.reading?.aqi : null;
                            const color = s.is_active ? aqiColor(aqi) : '#8a9a8f';
                            const b = band(aqi);
                            return (
                                <div key={s.sensor_id}>
                                    <Circle center={[s.latitude, s.longitude]} radius={s.radius * 1000}
                                        pathOptions={{ color, fillColor: color, fillOpacity: s.is_active ? 0.16 : 0.04, weight: 1.5, dashArray: s.is_active ? null : '5 5' }} />
                                    <CircleMarker center={[s.latitude, s.longitude]} radius={7}
                                        pathOptions={{ color: '#0f2a20', weight: 2, fillColor: color, fillOpacity: 1 }}>
                                        <Tooltip direction="top" offset={[0, -8]}>
                                            <strong>{s.region}</strong> {s.is_active ? `AQI ${fmt(aqi)}` : 'offline'}
                                        </Tooltip>
                                        <Popup>
                                            <div className="min-w-[220px] space-y-2 font-sans">
                                                <p className="font-display text-xl">{s.region}</p>
                                                <p className="text-sm text-muted !m-0">Sensor {s.sensor_code}, covering {s.radius} km</p>
                                                {s.is_active && b ? (
                                                    <>
                                                        <p className="!m-0 flex items-baseline gap-2">
                                                            <span className="aqi-num font-display text-4xl" style={{ color }}>{fmt(aqi)}</span>
                                                            <span className="font-semibold">{b.name}</span>
                                                        </p>
                                                        <p className="!m-0 text-sm">{b.advice}</p>
                                                        <p className="!m-0 text-sm text-muted">PM2.5 {fmt(s.reading.PM2_5, 1)} µg/m³, about {fmt(cigarettes(s.reading.PM2_5), 1)} cigarettes a day.</p>
                                                    </>
                                                ) : (
                                                    <p className="!m-0 text-sm">An admin has switched this sensor off.</p>
                                                )}
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                </div>
                            );
                        })}
                    </MapContainer>
                </div>

                <aside className="panel p-4 max-h-[65vh] overflow-y-auto">
                    <h2 className="text-xl px-2 pb-2">Ranked by AQI</h2>
                    <ol>
                        {nodes.map((s, i) => (
                            <li key={s.sensor_id}>
                                <button onClick={() => setFocus({ ...s })} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-raised text-left">
                                    <span className="text-muted w-5 text-right tabular-nums">{i + 1}</span>
                                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.is_active ? aqiColor(s.reading?.aqi) : '#8a9a8f' }} />
                                    <span className="flex-1 min-w-0">
                                        <span className="block font-semibold truncate">{s.region}</span>
                                        <span className="block text-xs text-muted">{s.sensor_code}{s.is_active ? '' : ', offline'}</span>
                                    </span>
                                    <span className="tabular-nums font-semibold">{s.is_active ? fmt(s.reading?.aqi) : '—'}</span>
                                </button>
                            </li>
                        ))}
                    </ol>
                </aside>
            </div>
        </div>
    );
}
