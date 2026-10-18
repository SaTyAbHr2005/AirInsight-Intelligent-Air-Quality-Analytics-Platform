import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Wing outline in a 0..1.05 × -0.75..0.6 box; body sits at the origin, forewing points +y.
const U = (x) => x / 1.05;
const V = (y) => (y + 0.75) / 1.35;

function wingGeometry() {
    const fore = new THREE.Shape();
    fore.moveTo(0.02, 0.02);
    fore.bezierCurveTo(0.25, 0.45, 0.7, 0.62, 1.0, 0.55);
    fore.bezierCurveTo(1.05, 0.35, 0.95, 0.12, 0.8, 0.0);
    fore.bezierCurveTo(0.5, -0.06, 0.2, -0.04, 0.02, 0.02);

    const hind = new THREE.Shape();
    hind.moveTo(0.02, -0.02);
    hind.bezierCurveTo(0.35, -0.02, 0.78, -0.12, 0.72, -0.38);
    hind.bezierCurveTo(0.66, -0.66, 0.32, -0.75, 0.12, -0.5);
    hind.bezierCurveTo(0.04, -0.35, 0.0, -0.15, 0.02, -0.02);

    const geo = new THREE.ShapeGeometry([fore, hind], 24);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, U(pos.getX(i)), V(pos.getY(i)));
    return geo;
}

// Common Grass Yellow (Eurema hecabe): sulphur wings, dark forewing border, a few crimson freckles.
function wingTexture() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const px = (u, v) => [u * s, (1 - v) * s];

    const fill = g.createRadialGradient(...px(0, V(0)), 10, ...px(0, V(0)), s * 0.9);
    fill.addColorStop(0, '#f6dc7a');
    fill.addColorStop(0.6, '#ebc03f');
    fill.addColorStop(1, '#d9a82a');
    g.fillStyle = fill;
    g.fillRect(0, 0, s, s);

    // dark forewing border
    g.fillStyle = '#1f1a10';
    g.beginPath();
    g.ellipse(...px(U(1.0), V(0.42)), s * 0.2, s * 0.16, -0.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(...px(U(0.62), V(0.6)), s * 0.22, s * 0.05, -0.15, 0, Math.PI * 2);
    g.fill();

    // veins
    g.strokeStyle = 'rgba(70, 48, 10, 0.35)';
    g.lineWidth = 2;
    const [ox, oy] = px(0, V(0));
    [[1.0, 0.5], [0.95, 0.25], [0.8, 0.05], [0.7, -0.3], [0.5, -0.6], [0.25, -0.6], [0.6, 0.55]].forEach(([x, y]) => {
        g.beginPath();
        g.moveTo(ox, oy);
        g.quadraticCurveTo(...px(U(x * 0.5), V(y * 0.6)), ...px(U(x), V(y)));
        g.stroke();
    });

    // freckles along the hindwing edge
    g.fillStyle = '#c2415d';
    [[0.66, -0.4], [0.55, -0.58], [0.38, -0.66]].forEach(([x, y]) => {
        g.beginPath();
        g.arc(...px(U(x), V(y)), 7, 0, Math.PI * 2);
        g.fill();
    });

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
}

const GREY = new THREE.Color('#8f8a7c');
const WHITE = new THREE.Color('#ffffff');

/**
 * `ctl` is a mutable ref the parent writes to every frame:
 *   speed (flaps/sec multiplier), amp (0 = folded, 1 = full), grey (0..1 soot on wings)
 */
export default function Butterfly({ ctl, ...props }) {
    const geo = useMemo(() => wingGeometry(), []);
    const tex = useMemo(() => wingTexture(), []);
    const mat = useMemo(
        () => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.35, side: THREE.DoubleSide, roughness: 0.65 }),
        [tex],
    );
    const right = useRef();
    const left = useRef();
    const phase = useRef(0);

    useFrame((_, dt) => {
        const c = ctl?.current ?? {};
        const speed = c.speed ?? 1;
        const amp = c.amp ?? 1;
        phase.current += Math.min(dt, 0.05) * 13 * speed;
        // fast downstroke, slower recovery, wings rest slightly raised
        const s = Math.sin(phase.current);
        const a = -(0.35 + amp * (0.95 * s + 0.15 * Math.sin(phase.current * 2)));
        const folded = -1.35 * (1 - amp);
        right.current.rotation.y = a + folded;
        left.current.rotation.y = -(a + folded);
        mat.color.copy(WHITE).lerp(GREY, c.grey ?? 0);
        mat.emissive.copy(mat.color).multiplyScalar(1 - (c.grey ?? 0) * 0.8); // backlit wings still read as sulphur
    });

    return (
        <group {...props}>
            <group rotation-x={-Math.PI / 2}>
                <mesh position={[0, -0.05, 0]}>
                    <capsuleGeometry args={[0.035, 0.42, 4, 8]} />
                    <meshStandardMaterial color="#2a2416" roughness={0.8} />
                </mesh>
                {[-1, 1].map((side) => (
                    <mesh key={side} position={[side * 0.05, 0.3, 0.06]} rotation={[0.5, 0, side * -0.45]}>
                        <cylinderGeometry args={[0.005, 0.005, 0.32, 4]} />
                        <meshStandardMaterial color="#2a2416" />
                    </mesh>
                ))}
                <group ref={right}>
                    <mesh geometry={geo} material={mat} />
                </group>
                <group ref={left} scale-x={-1}>
                    <mesh geometry={geo} material={mat} />
                </group>
            </group>
        </group>
    );
}
