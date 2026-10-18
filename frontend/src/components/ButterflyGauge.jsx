import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import Butterfly from '../three/Butterfly';
import { vitality } from '../lib/aqi';

function Hover({ v }) {
    const g = useRef();
    const ctl = useRef({});
    useFrame(({ clock }) => {
        const t = clock.elapsedTime;
        ctl.current.speed = 0.25 + 0.85 * v;
        ctl.current.amp = 0.15 + 0.85 * v;
        ctl.current.grey = 1 - v;
        // healthy air: lively hovering; bad air: it sinks and barely moves
        g.current.position.y = -0.3 * (1 - v) + Math.sin(t * 1.4) * 0.1 * v;
        g.current.rotation.y = (1 - v) * 1.35 + Math.sin(t * 0.4) * 0.45 * v; // grounded: turned side-on, wings folded
        g.current.rotation.x = -(1 - v) * 0.7;
    });
    return (
        <group ref={g}>
            <Butterfly ctl={ctl} scale={0.6} position={[0, 0, -0.2]} rotation-x={0.95} />
        </group>
    );
}

export const verdict = (aqi) => {
    const v = vitality(aqi);
    if (v > 0.8) return 'A butterfly here would be thriving.';
    if (v > 0.55) return 'A butterfly here would manage, a little slower.';
    if (v > 0.3) return 'A butterfly here would be struggling to stay aloft.';
    return 'A butterfly here would be grounded.';
};

export default function ButterflyGauge({ aqi, className = 'h-48' }) {
    return (
        <div className={className} aria-hidden="true">
            <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 3], fov: 38 }}>
                <hemisphereLight args={['#fff8e0', '#3e6b45', 1.4]} />
                <directionalLight position={[2, 4, 3]} intensity={2} />
                <Suspense fallback={null}>
                    <Hover v={vitality(aqi)} />
                </Suspense>
            </Canvas>
        </div>
    );
}
