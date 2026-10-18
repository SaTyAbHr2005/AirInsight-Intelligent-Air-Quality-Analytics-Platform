// CPCB AQI bands, coloured from the meadow palette: leaf → sulphur → crimson → plum.
export const BANDS = [
    { max: 50, name: 'Good', color: '#4e9f63', risk: 'Low', advice: 'Air is clean. A good day to be outside.' },
    { max: 100, name: 'Satisfactory', color: '#9fc04f', risk: 'Mild', advice: 'Fine for most people. If you have asthma, keep your inhaler close.' },
    { max: 200, name: 'Moderate', color: '#e2b53a', risk: 'Moderate', advice: 'Cut long runs and heavy outdoor work short.' },
    { max: 300, name: 'Poor', color: '#d4803a', risk: 'High', advice: 'Wear an N95 outdoors and skip outdoor exercise.' },
    { max: 400, name: 'Very Poor', color: '#c2415d', risk: 'Very high', advice: 'Stay indoors with windows shut. Run a purifier if you have one.' },
    { max: Infinity, name: 'Severe', color: '#6e2a54', risk: 'Emergency', advice: 'Health emergency. Avoid going outside at all.' },
];

export const band = (aqi) => (aqi == null ? null : BANDS.find((b) => aqi <= b.max));
export const aqiColor = (aqi) => band(aqi)?.color ?? '#8a9a8f';

// Berkeley Earth: 22 µg/m³ of PM2.5 breathed for a day ≈ smoking one cigarette.
export const cigarettes = (pm25) => (pm25 == null ? null : pm25 / 22);

// How a butterfly would cope: 1 = thriving, 0 = grounded.
export const vitality = (aqi) => (aqi == null ? 0.7 : Math.max(0, Math.min(1, 1 - (aqi - 40) / 380)));

export const POLLUTANTS = [
    { key: 'pm25', api: 'PM2_5', label: 'PM2.5', unit: 'µg/m³', safe: 60, what: 'Fine particles from combustion: vehicles, crop and waste burning' },
    { key: 'pm10', api: 'PM10', label: 'PM10', unit: 'µg/m³', safe: 100, what: 'Coarse dust from roads and construction' },
    { key: 'no2', api: 'NO2', label: 'NO₂', unit: 'µg/m³', safe: 80, what: 'Exhaust gas from traffic' },
    { key: 'co', api: 'CO', label: 'CO', unit: 'mg/m³', safe: 2, what: 'Incomplete burning of fuel' },
    { key: 'so2', api: 'SO2', label: 'SO₂', unit: 'µg/m³', safe: 80, what: 'Coal power plants and heavy industry' },
    { key: 'o3', api: 'O3', label: 'O₃', unit: 'µg/m³', safe: 100, what: 'Ground-level ozone, cooked from sunlight and exhaust' },
    { key: 'nh3', api: 'NH3', label: 'NH₃', unit: 'µg/m³', safe: 400, what: 'Fertiliser and livestock' },
];

// Which source is pushing hardest past its own threshold
export const dominantSource = (r) => {
    if (!r) return null;
    const factors = [
        { name: 'Dust and construction', ratio: (r.PM10 ?? 0) / 150 },
        { name: 'Vehicles and biomass burning', ratio: (r.PM2_5 ?? 0) / 60 },
        { name: 'Traffic exhaust', ratio: (r.NO2 ?? 0) / 50 },
        { name: 'Industry', ratio: (r.SO2 ?? 0) / 30 },
    ].sort((a, b) => b.ratio - a.ratio);
    return factors[0].ratio >= 1 ? factors[0] : { name: 'Mixed sources', ratio: factors[0].ratio };
};

export const fmt = (n, d = 0) => (n == null ? '—' : Number(n).toFixed(d));

// Continuous colour along the band scale, for views (heatmaps) where in-band variation matters
const STOPS = [[0, '#4e9f63'], [75, '#9fc04f'], [150, '#e2b53a'], [250, '#d4803a'], [350, '#c2415d'], [450, '#6e2a54'], [550, '#3d1530']];
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const aqiShade = (aqi) => {
    if (aqi == null) return '#8a9a8f';
    const found = STOPS.findIndex(([v]) => v >= aqi);
    const i = found === -1 ? STOPS.length - 1 : Math.max(1, found);
    const [v0, c0] = STOPS[i - 1] ?? STOPS[0];
    const [v1, c1] = STOPS[i] ?? STOPS[STOPS.length - 1];
    const t = Math.min(1, Math.max(0, (aqi - v0) / (v1 - v0 || 1)));
    const [a, b] = [rgb(c0), rgb(c1)];
    return `rgb(${a.map((x, k) => Math.round(x + (b[k] - x) * t)).join(',')})`;
};
