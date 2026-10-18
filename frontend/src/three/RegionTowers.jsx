import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { aqiColor, band, fmt } from '../lib/aqi';

// Same projection as the story's beacons, scaled up: real lat/lon → scene x/z
const project = (lat, lon) => [(lon - 76) * 2, -(lat - 19) * 2];
const towerHeight = (aqi) => 0.3 + Math.min(aqi ?? 0, 500) / 95;
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Tower({ region, onSelect, index, hover, setHover }) {
    const pivot = useRef(); // at ground level, so scaling grows the tower upward
    const age = useRef(0);
    const [x, z] = project(region.latitude, region.longitude);
    const height = towerHeight(region.aqi);
    const color = aqiColor(region.aqi);

    useFrame((_, dt) => {
        // staggered rise, then a gentle breathing pulse that is faster in dirtier air
        age.current += dt;
        const grow = Math.min(1, Math.max(0, (age.current - index * 0.09) * 1.4));
        const ease = 1 - Math.pow(1 - grow, 3);
        const pulse = reduced ? 0 : Math.sin(performance.now() / (900 - Math.min(region.aqi ?? 0, 450))) * 0.02;
        pivot.current.scale.set(hover ? 1.18 : 1, Math.max(0.001, ease * (1 + pulse)), hover ? 1.18 : 1);
    });

    return (
        <group position={[x, 0, z]}>
            <group ref={pivot}>
                <mesh
                    position={[0, height / 2, 0]}
                    onPointerOver={(e) => { e.stopPropagation(); setHover(region.region_id); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { setHover(null); document.body.style.cursor = ''; }}
                    onClick={(e) => { e.stopPropagation(); onSelect(region); }}
                >
                    <cylinderGeometry args={[0.32, 0.38, height, 6]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hover ? 0.65 : 0.25} roughness={0.5} />
                </mesh>
            </group>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
                <ringGeometry args={[0.5, 0.56, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

function SensorDot({ s }) {
    const [x, z] = project(s.latitude, s.longitude);
    return (
        <mesh position={[x, 0.03, z]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color={s.is_active ? '#ebc03f' : '#8a9a8f'} />
        </mesh>
    );
}

// Moves plain DOM labels to each tower's projected top every frame (no extra React roots)
function LabelSync({ regions, labels }) {
    const v = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera, size }) => {
        for (const r of regions) {
            const el = labels.current[r.region_id];
            if (!el) continue;
            const [x, z] = project(r.latitude, r.longitude);
            v.set(x, towerHeight(r.aqi) + 0.35, z).project(camera);
            el.style.transform = `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -100%)`;
            el.style.opacity = v.z < 1 ? '1' : '0';
            el.style.zIndex = String(Math.round((1 - v.z) * 10000));
        }
    });
    return null;
}

export default function RegionTowers({ regions, sensors, onSelect, dark }) {
    const [interacted, setInteracted] = useState(false);
    const [hovered, setHovered] = useState(null);
    const labels = useRef({});
    const placed = regions.filter((r) => r.latitude != null);

    return (
        <div className="relative h-full w-full">
            <Canvas camera={{ position: [0, 14, 19], fov: 42 }} dpr={[1, 1.75]} onPointerDown={() => setInteracted(true)}>
                <hemisphereLight args={[dark ? '#cfe3c8' : '#fff8e0', '#3e6b45', dark ? 0.9 : 1.3]} />
                <directionalLight position={[6, 12, 6]} intensity={1.6} />
                <mesh rotation-x={-Math.PI / 2}>
                    <circleGeometry args={[10.5, 64]} />
                    <meshStandardMaterial color={dark ? '#183427' : '#dfe8d2'} roughness={1} />
                </mesh>
                <gridHelper args={[21, 21, dark ? '#2b4a39' : '#c4d1b8', dark ? '#22402f' : '#d2dcc6']} position={[0, 0.005, 0]} />
                {sensors.filter((s) => s.latitude != null).map((s) => <SensorDot key={s.sensor_id} s={s} />)}
                {placed.map((r, i) => (
                    <Tower key={r.region_id} region={r} onSelect={onSelect} index={i} hover={hovered === r.region_id} setHover={setHovered} />
                ))}
                <LabelSync regions={placed} labels={labels} />
                <OrbitControls
                    makeDefault enablePan={false} minDistance={8} maxDistance={32} maxPolarAngle={Math.PI / 2.3}
                    autoRotate={!interacted && !reduced} autoRotateSpeed={0.6} enableDamping
                />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                {placed.map((r) => {
                    const color = aqiColor(r.aqi);
                    const on = hovered === r.region_id;
                    return (
                        <div key={r.region_id} ref={(el) => (labels.current[r.region_id] = el)} className="absolute left-0 top-0 will-change-transform">
                            <div className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg transition-transform origin-bottom ${on ? 'scale-125' : ''}`}
                                style={{ background: 'var(--surface)', color: 'var(--ink)', border: `1.5px solid ${color}` }}>
                                {r.region} <span style={{ color }}>{fmt(r.aqi)}</span>
                                {on && <span className="block text-[10px] text-center opacity-70">{band(r.aqi)?.name}, click to open</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
