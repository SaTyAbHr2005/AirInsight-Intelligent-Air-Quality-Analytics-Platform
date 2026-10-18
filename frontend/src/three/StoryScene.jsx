import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Butterfly from './Butterfly';
import { aqiColor } from '../lib/aqi';

const ss = THREE.MathUtils.smoothstep;
const lerp = THREE.MathUtils.lerp;
const rand = (a, b) => a + Math.random() * (b - a);

// Story beats as functions of scroll progress p ∈ [0,1]
export const beats = (p) => ({
    // the sensors arriving thin the haze a little; the finale clears it
    smog: ss(p, 0.16, 0.38) * (1 - 0.45 * ss(p, 0.55, 0.68)) * (1 - ss(p, 0.8, 0.94)),
    fall: ss(p, 0.36, 0.5) * (1 - ss(p, 0.82, 0.9)),
    listen: ss(p, 0.52, 0.64),
});

const C = (h) => new THREE.Color(h);
const PAL = {
    skyClean: C('#dbe8c6'), skySmog: C('#8a7a5a'),
    groundClean: C('#4f8a4a'), groundSmog: C('#5f5a3e'),
    grassBase: C('#2c6a3b'), grassBaseSmog: C('#47452e'),
    grassTip: C('#a8cf6b'), grassTipSmog: C('#8a8156'),
    pollen: C('#f2d36b'), soot: C('#4a3f2e'),
    sunClean: C('#fff1c9'), sunSmog: C('#c9a36b'),
};

/* ---------- grass: one instanced draw call, swaying in a vertex shader ---------- */
function Grass({ count, S }) {
    const ref = useRef();
    const geo = useMemo(() => new THREE.PlaneGeometry(0.07, 0.75, 1, 4).translate(0, 0.375, 0), []);
    const mat = useMemo(
        () =>
            new THREE.ShaderMaterial({
                side: THREE.DoubleSide,
                uniforms: {
                    uTime: { value: 0 }, uDroop: { value: 0 },
                    uBase: { value: PAL.grassBase.clone() }, uTip: { value: PAL.grassTip.clone() },
                    uFog: { value: PAL.skyClean.clone() }, uNear: { value: 8 }, uFar: { value: 40 },
                },
                vertexShader: /* glsl */ `
                    uniform float uTime; uniform float uDroop;
                    varying float vH; varying float vDepth;
                    void main() {
                        vec3 p = position;
                        vH = uv.y;
                        p.x *= 1.0 - vH * 0.9;
                        vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
                        float sway = sin(uTime * 1.7 + w.x * 0.7 + w.z * 0.45) * 0.13 * vH * vH;
                        w.x += sway; w.z += sway * 0.4;
                        w.y -= uDroop * vH * vH * 0.22;
                        vec4 mv = viewMatrix * w;
                        vDepth = -mv.z;
                        gl_Position = projectionMatrix * mv;
                    }`,
                fragmentShader: /* glsl */ `
                    uniform vec3 uBase; uniform vec3 uTip; uniform vec3 uFog;
                    uniform float uNear; uniform float uFar;
                    varying float vH; varying float vDepth;
                    void main() {
                        vec3 col = mix(uBase, uTip, vH);
                        col = mix(col, uFog, smoothstep(uNear, uFar, vDepth));
                        gl_FragColor = vec4(col, 1.0);
                        #include <colorspace_fragment>
                    }`,
            }),
        [],
    );

    useEffect(() => {
        const m = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            m.position.set(rand(-16, 16), 0, rand(-14, 3.2));
            m.rotation.set(rand(-0.15, 0.15), rand(0, Math.PI), rand(-0.15, 0.15));
            m.scale.setScalar(rand(0.55, 1.35));
            m.updateMatrix();
            ref.current.setMatrixAt(i, m.matrix);
        }
        ref.current.instanceMatrix.needsUpdate = true;
    }, [count]);

    useFrame((_, dt) => {
        const u = mat.uniforms;
        u.uTime.value += dt;
        u.uDroop.value = S.smog;
        u.uBase.value.lerpColors(PAL.grassBase, PAL.grassBaseSmog, S.smog);
        u.uTip.value.lerpColors(PAL.grassTip, PAL.grassTipSmog, S.smog);
        u.uFog.value.copy(S.sky);
        u.uNear.value = S.fogNear;
        u.uFar.value = S.fogFar;
    });

    return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />;
}

/* ---------- flowers that lose their colour ---------- */
const FLOWER_COLORS = ['#f28cb1', '#ebc03f', '#ffffff', '#c2415d', '#f6e7a1'].map(C);
const ASH = C('#7d786a');

function Flowers({ count, S }) {
    const ref = useRef();
    const [base] = useState(() => Array.from({ length: count }, () => FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)]));
    const last = useRef(-1);
    const tmp = useMemo(() => new THREE.Color(), []);

    useEffect(() => {
        const m = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            // the first flower is where the butterfly lands
            if (i === 0) m.position.set(0.6, 0.42, 1.0);
            else m.position.set(rand(-12, 12), rand(0.3, 0.6), rand(-10, 3));
            const f = i === 0 ? 1.6 : rand(0.6, 1.1);
            m.scale.set(f, f * 0.4, f); // flat blossoms, not marbles
            m.updateMatrix();
            ref.current.setMatrixAt(i, m.matrix);
        }
        ref.current.instanceMatrix.needsUpdate = true;
    }, [count]);

    useFrame(() => {
        if (Math.abs(S.smog - last.current) < 0.004) return;
        last.current = S.smog;
        for (let i = 0; i < count; i++) ref.current.setColorAt(i, tmp.copy(base[i]).lerp(ASH, S.smog * 0.85));
        ref.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={ref} args={[null, null, count]}>
            <icosahedronGeometry args={[0.07, 1]} />
            <meshStandardMaterial roughness={0.6} />
        </instancedMesh>
    );
}

/* ---------- pollen turning into soot ---------- */
function dotTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

function Particles({ max, S }) {
    const ref = useRef();
    const geo = useMemo(() => {
        const a = new Float32Array(max * 3);
        for (let i = 0; i < max; i++) a.set([rand(-14, 14), rand(0.1, 7), rand(-14, 7)], i * 3);
        return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(a, 3));
    }, [max]);
    const tex = useMemo(() => dotTexture(), []);

    useFrame((_, dt) => {
        const p = ref.current;
        p.rotation.y += dt * (0.015 + S.smog * 0.03);
        p.position.y = Math.sin(performance.now() / 4000) * 0.2;
        geo.setDrawRange(0, Math.floor(lerp(max * 0.12, max, S.smog)));
        p.material.color.lerpColors(PAL.pollen, PAL.soot, S.smog);
        p.material.size = lerp(0.06, 0.2, S.smog);
        p.material.opacity = lerp(0.85, 0.55, S.smog);
    });

    return (
        <points ref={ref} geometry={geo}>
            <pointsMaterial map={tex} transparent depthWrite={false} sizeAttenuation />
        </points>
    );
}

/* ---------- the city rising on the horizon ---------- */
function Skyline({ S }) {
    const ref = useRef();
    const group = useRef();
    const count = 90;
    useEffect(() => {
        const m = new THREE.Object3D();
        for (let i = 0; i < count; i++) {
            const chimney = Math.random() < 0.15;
            const w = chimney ? rand(0.3, 0.5) : rand(0.8, 2.6);
            const h = chimney ? rand(7, 12) : rand(2, 8);
            m.position.set(rand(-34, 34), h / 2, rand(-20, -32));
            m.scale.set(w, h, chimney ? w : rand(0.8, 2.5));
            m.updateMatrix();
            ref.current.setMatrixAt(i, m.matrix);
        }
        ref.current.instanceMatrix.needsUpdate = true;
    }, []);
    useFrame(() => {
        group.current.scale.y = Math.max(0.001, S.smog);
    });
    return (
        <group ref={group}>
            <instancedMesh ref={ref} args={[null, null, count]}>
                <boxGeometry />
                <meshStandardMaterial color="#3a342a" roughness={1} />
            </instancedMesh>
        </group>
    );
}

/* ---------- sensors: ten regions placed by their real lat/lon ---------- */
const toScene = (lat, lon) => [(lon - 76) * 1.7, 0, -(lat - 19) * 1.7 - 1];

function Beacon({ region, S }) {
    const pillar = useRef();
    const ring = useRef();
    const color = aqiColor(region.aqi);
    const [x, , z] = toScene(region.latitude, region.longitude);
    const height = 0.35 + Math.min(region.aqi ?? 50, 450) / 260;

    useFrame(({ clock }) => {
        const k = S.listen;
        pillar.current.scale.y = Math.max(0.001, k);
        pillar.current.visible = k > 0.01;
        const t = (clock.elapsedTime * 0.6 + x) % 1;
        ring.current.scale.setScalar(0.2 + t * 1.6 * k);
        ring.current.material.opacity = (1 - t) * 0.8 * k;
    });

    return (
        <group position={[x, 0.02, z]}>
            <group ref={pillar}>
                <mesh position={[0, height / 2, 0]}>
                    <cylinderGeometry args={[0.035, 0.035, height, 8]} />
                    <meshBasicMaterial color={color} toneMapped={false} fog={false} />
                </mesh>
                <mesh position={[0, height, 0]}>
                    <sphereGeometry args={[0.11, 16, 16]} />
                    <meshBasicMaterial color={color} toneMapped={false} fog={false} />
                </mesh>
            </group>
            <mesh ref={ring} rotation-x={-Math.PI / 2}>
                <ringGeometry args={[0.45, 0.5, 48]} />
                <meshBasicMaterial color={color} transparent toneMapped={false} fog={false} />
            </mesh>
        </group>
    );
}

/* ---------- camera keyframes along the story ---------- */
const KEYS = [
    { at: 0.0, pos: [0, 2.3, 6.2], look: [0, 1.1, 0] },
    { at: 0.3, pos: [-0.6, 2.4, 6.6], look: [0, 1.3, -2] },
    { at: 0.48, pos: [1.2, 1.5, 3.0], look: [-0.2, 0.6, 0.9] },
    { at: 0.66, pos: [1.5, 7, 8.5], look: [1.5, 0, -1.5] },
    { at: 0.82, pos: [1.5, 7, 8.5], look: [1.5, 0, -1.5] },
    { at: 1.0, pos: [0, 2.2, 6.2], look: [0, 1.4, 0] },
].map((k) => ({ ...k, pos: new THREE.Vector3(...k.pos), look: new THREE.Vector3(...k.look) }));

function keyframe(p, outPos, outLook) {
    let i = KEYS.findIndex((k) => k.at >= p);
    if (i <= 0) i = 1;
    const a = KEYS[i - 1], b = KEYS[i];
    const t = ss(p, a.at, b.at);
    outPos.lerpVectors(a.pos, b.pos, t);
    outLook.lerpVectors(a.look, b.look, t);
}

export default function StoryScene({ progress, regions = [], lite = false, reduced = false }) {
    const { scene, camera, pointer } = useThree();
    const S = useMemo(() => ({ p: 0, smog: 0, fall: 0, listen: 0, sky: PAL.skyClean.clone(), fogNear: 8, fogFar: 40 }), []);
    const fly = useRef();
    const ctl = useRef({ speed: 1, amp: 1, grey: 0 });
    const ground = useRef();
    const sun = useRef();
    const hemi = useRef();
    const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), lookNow: new THREE.Vector3(0, 1, 0), prev: new THREE.Vector3(), free: new THREE.Vector3() }), []);
    const LAND = useMemo(() => new THREE.Vector3(0.6, 0.5, 1.0), []);

    useEffect(() => {
        scene.background = S.sky;
        scene.fog = new THREE.Fog(S.sky, 8, 40);
    }, [scene, S]);

    useFrame(({ clock }, dt) => {
        const k = 1 - Math.pow(0.001, Math.min(dt, 0.1)); // frame-rate independent damping
        S.p = lerp(S.p, progress.current, k);
        const b = beats(S.p);
        S.smog = b.smog; S.fall = b.fall; S.listen = b.listen;

        S.sky.lerpColors(PAL.skyClean, PAL.skySmog, S.smog);
        S.fogNear = lerp(8, 1.5, S.smog);
        S.fogFar = lerp(42, 13, S.smog);
        scene.fog.color.copy(S.sky);
        scene.fog.near = S.fogNear;
        scene.fog.far = S.fogFar;
        ground.current.color.lerpColors(PAL.groundClean, PAL.groundSmog, S.smog);
        sun.current.intensity = lerp(2.4, 0.7, S.smog);
        sun.current.color.lerpColors(PAL.sunClean, PAL.sunSmog, S.smog);
        hemi.current.intensity = lerp(1.3, 0.7, S.smog);

        // butterfly: free flight ↔ landed on the flower
        const t = clock.elapsedTime * (reduced ? 0.4 : 1);
        // drifts on the right third of the frame, clear of the copy
        tmp.free.set(1.5 + Math.sin(t * 0.5) * 1.1, 1.55 + Math.sin(t * 0.9) * 0.25, 2.2 + Math.cos(t * 0.37) * 0.7);
        tmp.prev.copy(fly.current.position);
        fly.current.position.lerpVectors(tmp.free, LAND, S.fall);
        const v = tmp.prev.sub(fly.current.position).negate();
        if (v.lengthSq() > 1e-7) {
            const cur = fly.current.rotation.y;
            const delta = THREE.MathUtils.euclideanModulo(Math.atan2(-v.x, -v.z) - cur + Math.PI, Math.PI * 2) - Math.PI;
            fly.current.rotation.y = cur + delta * 0.08;
        }
        fly.current.rotation.z = Math.sin(t * 1.3) * 0.15 * (1 - S.fall);
        ctl.current.speed = (reduced ? 0.4 : 1) * lerp(1, 0.25, Math.max(S.smog * 0.6, S.fall));
        ctl.current.amp = 1 - S.fall * 0.9;
        ctl.current.grey = S.smog * 0.75;

        // camera on rails + a little parallax from the pointer
        keyframe(S.p, tmp.pos, tmp.look);
        if (!reduced) {
            tmp.pos.x += pointer.x * 0.25;
            tmp.pos.y += pointer.y * 0.12;
        }
        camera.position.lerp(tmp.pos, k);
        tmp.lookNow.lerp(tmp.look, k);
        camera.lookAt(tmp.lookNow);
    });

    return (
        <>
            <hemisphereLight ref={hemi} args={['#fff8e0', '#3e6b45', 1.3]} />
            <directionalLight ref={sun} position={[6, 9, 4]} intensity={2.4} />

            <mesh rotation-x={-Math.PI / 2} position={[0, 0, -10]}>
                <planeGeometry args={[120, 80]} />
                <meshStandardMaterial ref={ground} roughness={1} />
            </mesh>

            <Grass count={lite ? 2500 : 7000} S={S} />
            <Flowers count={lite ? 90 : 220} S={S} />
            <Particles max={lite ? 1500 : 4000} S={S} />
            <Skyline S={S} />
            {regions.filter((r) => r.latitude != null).map((r) => <Beacon key={r.region_id} region={r} S={S} />)}

            <group ref={fly} position={[0, 1.2, 0]}>
                <Butterfly ctl={ctl} scale={0.55} rotation-x={0.3} />
            </group>
        </>
    );
}
