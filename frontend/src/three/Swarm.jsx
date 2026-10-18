import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Butterfly from './Butterfly';

const rand = (a, b) => a + Math.random() * (b - a);
const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One butterfly on its own looping path, drawn toward the pointer
function Flier({ excited }) {
    const g = useRef();
    const ctl = useRef({ speed: 1, amp: 1, grey: 0 });
    const [s] = useState(() => ({ a: rand(1.2, 2.8), b: rand(0.6, 1.5), ph: rand(0, 6.28), sp: rand(0.18, 0.4), z: rand(-2, 0.8), size: rand(0.32, 0.5), flap: rand(0.8, 1.25) }));
    const [tmp] = useState(() => ({ goal: new THREE.Vector3(), prev: new THREE.Vector3(), v: new THREE.Vector3() }));

    useFrame(({ clock, pointer, viewport }) => {
        const boost = excited.current ? 2.2 : 1;
        const t = clock.elapsedTime * s.sp * (reduced ? 0.4 : 1) * boost + s.ph;
        const px = (pointer.x * viewport.width) / 2;
        const py = (pointer.y * viewport.height) / 2;
        tmp.goal.set(Math.sin(t) * s.a + px * 0.45, Math.sin(t * 1.7) * s.b + py * 0.45, Math.cos(t) * 1.3 + s.z);
        tmp.prev.copy(g.current.position);
        g.current.position.lerp(tmp.goal, 0.045 * boost);
        tmp.v.subVectors(g.current.position, tmp.prev);
        if (tmp.v.lengthSq() > 1e-8) {
            const cur = g.current.rotation.y;
            const d = THREE.MathUtils.euclideanModulo(Math.atan2(-tmp.v.x, -tmp.v.z) - cur + Math.PI, Math.PI * 2) - Math.PI;
            g.current.rotation.y = cur + d * 0.1;
            g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, 0.6 + tmp.v.y * 8, 0.1);
        }
        ctl.current.speed = s.flap * (reduced ? 0.4 : 1) * boost;
    });

    return (
        <group ref={g} position={[rand(-3, 3), rand(-2, 2), 0]}>
            <Butterfly ctl={ctl} scale={s.size} />
        </group>
    );
}

/** `excited` (a ref) speeds the swarm up, e.g. while a form is submitting. */
export default function Swarm({ count = 7, excited }) {
    const fallback = useRef(false);
    // eventSource on <body>: the swarm notices the cursor anywhere on the page, not only over the canvas
    return (
        <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 6], fov: 45 }} aria-hidden="true" eventSource={document.body} eventPrefix="client">
            <hemisphereLight args={['#fff8e0', '#3e6b45', 1.5]} />
            <directionalLight position={[3, 5, 4]} intensity={1.8} />
            {Array.from({ length: count }, (_, i) => <Flier key={i} excited={excited ?? fallback} />)}
        </Canvas>
    );
}
