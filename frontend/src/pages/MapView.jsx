import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '../context/AppContext';
import { fetchPublicSensors, fetchLatestAQI } from '../services/api';
import { Activity } from 'lucide-react';

function fixLeafletIcon() {
    const L = window.L || require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

export default function MapView() {
    const { liveData } = useAppContext();
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fixLeafletIcon(); }, []);

    useEffect(() => {
        const loadMapData = async () => {
            try {
                // Fetch physical sensor locations and radius from backend database
                // This ensures admin portal modifications dynamically sync with the public frontend
                const sensorsRes = await fetchPublicSensors();
                const dbSensors = sensorsRes.data;

                // Always fetch latest global AQI to fallback for sensors that aren't actively pinging in the 50-item liveData array
                let fallbackData = [];
                try {
                    const latestRes = await fetchLatestAQI();
                    fallbackData = latestRes.data || [];
                } catch (e) { }

                // Map live or latest AQI data onto the physical hardware nodes
                const mappedSensors = dbSensors.map(sensor => {
                    let activeNode = liveData.find(d => d.sensor_id === sensor.sensor_id);
                    if (!activeNode) activeNode = fallbackData.find(d => d.sensor_id === sensor.sensor_id);

                    return {
                        ...sensor,
                        aqi: activeNode?.aqi || null,
                        category: activeNode?.category || 'Unknown',
                        pm25: activeNode?.PM2_5 || null,
                        pm10: activeNode?.PM10 || null,
                        timestamp: activeNode?.timestamp ? new Date(activeNode.timestamp).toLocaleString() : 'No recent data'
                    };
                });

                setSensors(mappedSensors);
                setLoading(false);
            } catch (error) {
                console.error("Error loading geospatial map data:", error);
                setLoading(false);
            }
        };

        loadMapData();
        const interval = setInterval(loadMapData, 10000); // 10s auto-refresh sync
        return () => clearInterval(interval);
    }, [liveData]);

    const getColor = (aqi) => {
        if (!aqi) return '#64748b'; // Gray/Offline
        if (aqi > 400) return '#9f1239'; // Maroon (Severe)
        if (aqi > 300) return '#ef4444'; // Red (Very Poor)
        if (aqi > 200) return '#f97316'; // Orange (Poor)
        if (aqi > 100) return '#eab308'; // Yellow (Moderate)
        if (aqi > 50) return '#84cc16';  // Lime (Satisfactory)
        return '#22c55e'; // Green (Good)
    };

    return (
        <div className="space-y-4 animate-in fade-in h-[calc(100vh-140px)] min-h-[500px]">
            <div className="mb-2">
                <h2 className="text-2xl font-bold tracking-tight">Geospatial AQI Map</h2>
                <p className="text-slate-500">Interactive live sensor coordinate mapping securely synchronized with the central smart city node array.</p>
            </div>

            <div className="glass-card overflow-hidden h-full w-full rounded-2xl relative z-0">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-50 backdrop-blur-sm">
                        <Activity className="animate-pulse text-blue-500" size={32} />
                    </div>
                )}

                <MapContainer center={[19.6, 75.8]} zoom={6} className="h-full w-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

                    {sensors.filter(s => s.latitude != null && s.longitude != null).map((sensor, i) => (
                        <React.Fragment key={`sensor-${sensor.sensor_id}-${i}`}>
                            {/* Physical radius <Circle> renders fixed map meters, so zooms authentically scale */}
                            <Circle
                                center={[sensor.latitude, sensor.longitude]}
                                radius={sensor.radius * 1000} // Radius injected by Admin stored in DB (KM -> Meters)
                                pathOptions={{
                                    color: sensor.is_active ? getColor(sensor.aqi) : '#94a3b8',
                                    fillColor: sensor.is_active ? getColor(sensor.aqi) : '#cbd5e1',
                                    fillOpacity: sensor.is_active ? 0.15 : 0.05,
                                    weight: sensor.is_active ? 2 : 1.5,
                                    dashArray: sensor.is_active ? null : '5, 5'
                                }}
                            />

                            <Marker position={[sensor.latitude, sensor.longitude]} opacity={sensor.is_active ? 1 : 0.4}>
                                {/* Hover Tooltip explicitly requesting city AQI */}
                                <Tooltip direction="top" offset={[0, -20]} opacity={0.95} className="custom-tooltip shadow-lg border-none">
                                    <div className="font-sans text-center">
                                        <div className="font-bold text-sm mb-1">{sensor.region}</div>
                                        {sensor.is_active && sensor.aqi ? (
                                            <div className="mt-1 flex items-center justify-center gap-2">
                                                <span className="font-bold rounded-full text-white px-3 py-0.5 shadow-sm" style={{ backgroundColor: getColor(sensor.aqi) }}>
                                                    AQI {sensor.aqi.toFixed(1)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="mt-1 text-xs text-slate-500 italic">Deactivated (Offline)</div>
                                        )}
                                    </div>
                                </Tooltip>

                                {/* Clicable Details Popup */}
                                <Popup className="rounded-lg shadow-xl border-none">
                                    <div className="p-1 font-sans min-w-[200px]">
                                        <h3 className="font-bold text-lg border-b pb-2 mb-3">
                                            {sensor.region} <span className="text-sm font-normal text-slate-500">({sensor.sensor_code})</span>
                                        </h3>
                                        {sensor.is_active && sensor.aqi ? (
                                            <div className="space-y-2 text-sm">
                                                <p className="flex justify-between items-center bg-slate-100 p-2 rounded-lg">
                                                    <span className="text-slate-600 font-medium">Status</span>
                                                    <span className="font-bold text-white px-2 py-0.5 rounded text-xs shadow-sm shadow-black/10" style={{ backgroundColor: getColor(sensor.aqi) }}>{sensor.category}</span>
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <p className="flex flex-col border p-2 rounded-lg"><span className="text-slate-500 text-[10px] uppercase font-bold">AQI Level</span><span className="font-black text-lg">{sensor.aqi.toFixed(1)}</span></p>
                                                    {sensor.pm25 && <p className="flex flex-col border p-2 rounded-lg"><span className="text-slate-500 text-[10px] uppercase font-bold">PM2.5</span><span className="font-black text-lg">{sensor.pm25.toFixed(1)}</span></p>}
                                                </div>
                                                <p className="flex justify-between items-center mt-3 pt-2 border-t">
                                                    <span className="text-slate-500 text-xs">Coverage Radius</span>
                                                    <span className="font-semibold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{sensor.radius} km</span>
                                                </p>
                                                <div className="text-[10px] text-slate-400 text-center mt-2 pt-2">{sensor.timestamp}</div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-100 border border-slate-200 rounded-lg">
                                                <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">System Offline</span>
                                                <span className="text-sm font-medium text-slate-700">Node deactivated by Admin.</span>
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        </React.Fragment>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
