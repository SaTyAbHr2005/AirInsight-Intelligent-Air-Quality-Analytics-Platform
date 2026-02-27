import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '../context/AppContext';

function fixLeafletIcon() {
    const L = window.L || require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
}

const LOCATIONS = {
    "Mumbai": [19.0760, 72.8777], "Pune": [18.5204, 73.8567],
    "Nagpur": [21.1458, 79.0882], "Nashik": [20.0110, 73.7903],
    "Chandrapur": [19.9535, 79.2961]
};

export default function MapView() {
    const { liveData } = useAppContext();
    const [markers, setMarkers] = useState([]);

    useEffect(() => { fixLeafletIcon(); }, []);

    useEffect(() => {
        const MapNodes = new Map();
        liveData.forEach(node => {
            if (!MapNodes.has(node.region_name) && LOCATIONS[node.region_name]) {
                MapNodes.set(node.region_name, {
                    id: node.sensor_id, name: node.region_name, coords: LOCATIONS[node.region_name],
                    aqi: node.aqi, pm25: node.PM2_5, pm10: node.PM10, time: new Date(node.timestamp).toLocaleString()
                });
            }
        });
        setMarkers(Array.from(MapNodes.values()));
    }, [liveData]);

    const getColor = (aqi) => {
        if (aqi > 200) return '#ef4444';
        if (aqi > 100) return '#f97316';
        if (aqi > 50) return '#eab308';
        return '#22c55e';
    };

    return (
        <div className="space-y-4 animate-in fade-in h-[calc(100vh-140px)] min-h-[500px]">
            <div className="mb-2">
                <h2 className="text-2xl font-bold tracking-tight">Geospatial AQI Map</h2>
                <p className="text-slate-500">Interactive overview of active monitoring stations across Maharashtra.</p>
            </div>

            <div className="glass-card overflow-hidden h-full w-full rounded-2xl relative z-0">
                <MapContainer center={[19.6, 75.8]} zoom={6} className="h-full w-full">
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    {markers.map((loc, i) => (
                        <React.Fragment key={i}>
                            <CircleMarker center={loc.coords} radius={20} pathOptions={{ color: getColor(loc.aqi), fillColor: getColor(loc.aqi), fillOpacity: 0.2 }} />
                            <Marker position={loc.coords}>
                                <Popup className="rounded-lg shadow-xl">
                                    <div className="p-1 font-sans">
                                        <h3 className="font-bold text-lg border-b pb-1 mb-2">{loc.name} Station #{loc.id}</h3>
                                        <div className="space-y-1 text-sm">
                                            <p className="flex justify-between w-40"><span className="text-slate-500">AQI</span><span className="font-bold">{loc.aqi?.toFixed(1)}</span></p>
                                        </div>
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
