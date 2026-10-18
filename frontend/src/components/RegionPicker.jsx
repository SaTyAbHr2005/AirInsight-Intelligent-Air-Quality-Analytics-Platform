import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useRegions } from '../lib/api';
import { aqiColor, fmt } from '../lib/aqi';

/** Selected region, defaulting to the most polluted one. */
export function useSelectedRegion() {
    const { regionId, setRegionId } = useAppContext();
    const q = useRegions();
    const regions = q.data ?? [];
    const region = regions.find((r) => r.region_id === regionId) ?? regions[0];
    useEffect(() => {
        if (region && region.region_id !== regionId) setRegionId(region.region_id);
    }, [region, regionId, setRegionId]);
    return { region, regions, setRegionId, ...q };
}

// Doubles as the network overview: every city, its colour and its number.
export default function RegionPicker() {
    const { region, regions, setRegionId } = useSelectedRegion();
    return (
        <div role="radiogroup" aria-label="City" className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {regions.map((r) => {
                const on = r.region_id === region?.region_id;
                return (
                    <button
                        key={r.region_id}
                        role="radio"
                        aria-checked={on}
                        onClick={() => setRegionId(r.region_id)}
                        className={`shrink-0 flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                            on ? 'border-ink bg-ink text-bg' : 'border-line hover:border-muted'
                        }`}
                    >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: aqiColor(r.aqi) }} />
                        <span className="font-semibold">{r.region}</span>
                        <span className={on ? 'opacity-80' : 'text-muted'}>{fmt(r.aqi)}</span>
                    </button>
                );
            })}
        </div>
    );
}
