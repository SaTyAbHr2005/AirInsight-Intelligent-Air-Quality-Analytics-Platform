import { useEffect, useRef } from 'react';
import { aqiColor } from '../lib/aqi';

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The air you're looking at: drifting motes whose density, size and colour follow the AQI.
 * Clean air = a few pollen flecks; severe = a thick, slow soot field.
 * Plain 2D canvas, so it's cheap enough to sit behind every page.
 */
export default function AirParticles({ aqi, className = 'fixed inset-0', intensity = 1 }) {
    const canvas = useRef();
    const target = useRef({ aqi: aqi ?? 60 });
    useEffect(() => {
        target.current.aqi = aqi ?? 60;
    }, [aqi]);

    useEffect(() => {
        const c = canvas.current;
        const ctx = c.getContext('2d');
        const MAX = 220;
        const parts = Array.from({ length: MAX }, () => ({
            x: Math.random(), y: Math.random(), r: Math.random(), s: 0.3 + Math.random() * 0.7, p: Math.random() * Math.PI * 2,
        }));
        let level = target.current.aqi; // eased toward the real value so changes feel like weather
        let raf, w, h, dpr;

        const resize = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = c.clientWidth;
            h = c.clientHeight;
            c.width = w * dpr;
            c.height = h * dpr;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(c);

        const frame = (t) => {
            level += (target.current.aqi - level) * 0.03;
            const k = Math.min(1, Math.max(0, level / 450));
            const n = Math.floor((25 + k * 195) * intensity);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = aqiColor(level);
            for (let i = 0; i < n; i++) {
                const q = parts[i];
                if (!reduced) {
                    q.x += (0.00012 + k * 0.00008) * q.s + Math.sin(t / 3000 + q.p) * 0.00008;
                    q.y += Math.cos(t / 2600 + q.p) * 0.00012 - 0.00004 * (1 - k);
                    if (q.x > 1.02) q.x = -0.02;
                    if (q.y > 1.02) q.y = -0.02;
                    if (q.y < -0.02) q.y = 1.02;
                }
                ctx.globalAlpha = (0.12 + k * 0.28) * (0.4 + q.s * 0.6);
                ctx.beginPath();
                ctx.arc(q.x * w, q.y * h, 0.8 + q.r * (1.2 + k * 3.2), 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [intensity]);

    return <canvas ref={canvas} aria-hidden="true" className={`${className} pointer-events-none w-full h-full`} />;
}
