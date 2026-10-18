import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import StoryScene from '../three/StoryScene';
import Wordmark from '../components/Wordmark';
import { useForecast, useLatest, useRegions } from '../lib/api';
import { aqiColor, band, cigarettes, fmt } from '../lib/aqi';

gsap.registerPlugin(ScrollTrigger);

const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite = typeof window !== 'undefined' && (window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4);

function Chapter({ n, title, children, align = 'left', height = 'min-h-[130vh]' }) {
    const side = align === 'right' ? 'md:ml-auto' : align === 'center' ? 'mx-auto text-center' : '';
    return (
        <section className={`relative ${height} flex items-center px-6 md:px-16`}>
            <div className={`max-w-[34rem] ${side} rounded-3xl bg-[rgb(15_42_32/0.62)] backdrop-blur-md p-7 md:p-9 text-[#eef3e4] ring-1 ring-white/10`}>
                {n && <p className="font-display text-sulphur text-lg mb-3">Chapter {n}</p>}
                <h2 className="text-4xl md:text-5xl leading-[1.05] mb-5">{title}</h2>
                <div className="space-y-4 text-[1.075rem] leading-relaxed text-[#d6e0cf]">{children}</div>
            </div>
        </section>
    );
}

// PM2.5 against a human hair, drawn to scale (70 µm vs 2.5 µm)
function HairScale() {
    return (
        <figure className="mt-6 flex items-end justify-center gap-10" aria-label="A human hair is about 70 micrometres wide; a PM2.5 particle is 2.5">
            <div className="text-center">
                <svg viewBox="0 0 140 140" className="w-36 h-36">
                    <circle cx="70" cy="70" r="68" fill="#c9b48a" opacity="0.85" />
                    <circle cx="70" cy="70" r="68" fill="none" stroke="#f2e6c4" strokeWidth="1" />
                </svg>
                <figcaption className="text-sm mt-2 text-[#c7d3c0]">Human hair, 70 µm</figcaption>
            </div>
            <div className="text-center">
                <svg viewBox="0 0 140 140" className="w-36 h-36">
                    <circle cx="70" cy="70" r="2.4" fill="#ebc03f" />
                </svg>
                <figcaption className="text-sm mt-2 text-[#c7d3c0]">PM2.5, 2.5 µm</figcaption>
            </div>
        </figure>
    );
}

function Ribbon({ regions }) {
    if (!regions?.length) return null;
    return (
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5">
            {regions.map((r) => (
                <li key={r.region_id} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: aqiColor(r.aqi) }} />
                    <span className="flex-1 truncate">{r.region}</span>
                    <span className="font-semibold tabular-nums">{fmt(r.aqi)}</span>
                </li>
            ))}
        </ul>
    );
}

function Outlook({ data }) {
    const pts = data?.outlook;
    if (!pts?.length) return null;
    const vals = pts.map((p) => p.aqi);
    const lo = Math.min(...vals) - 10, hi = Math.max(...vals) + 10;
    const xy = pts.map((p, i) => [10 + (i * 280) / (pts.length - 1), 70 - ((p.aqi - lo) / (hi - lo)) * 55]);
    return (
        <figure className="mt-6">
            <svg viewBox="0 0 300 90" className="w-full" role="img" aria-label="Six-hour AQI outlook">
                <polyline points={xy.map((p) => p.join(',')).join(' ')} fill="none" stroke="#ebc03f" strokeWidth="2.5" strokeLinejoin="round" />
                {xy.map(([x, y], i) => (
                    <g key={i}>
                        <circle cx={x} cy={y} r="4" fill={aqiColor(vals[i])} stroke="#0f2a20" strokeWidth="1.5" />
                        <text x={x} y="88" textAnchor="middle" fontSize="10" fill="#c7d3c0">+{i + 1}h</text>
                    </g>
                ))}
            </svg>
        </figure>
    );
}

export default function Story() {
    const progress = useRef(0);
    const story = useRef();
    const { data: regions = [] } = useRegions();
    const { data: latest = [] } = useLatest();

    const worst = regions[0];
    const worstSensor = useMemo(() => latest.find((s) => s.region_id === worst?.region_id), [latest, worst]);
    const { data: outlook } = useForecast(worstSensor?.sensor_id);
    const cleanest = regions.length ? regions[regions.length - 1] : null;

    useEffect(() => {
        let lenis;
        const raf = (t) => lenis.raf(t * 1000);
        if (!reduced) {
            lenis = new Lenis({ lerp: 0.09 });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(raf);
            gsap.ticker.lagSmoothing(0);
        }
        const st = ScrollTrigger.create({
            trigger: story.current,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => (progress.current = self.progress),
        });
        // one orchestrated opening: the title settles in (context so StrictMode's re-run reverts cleanly)
        const ctx = gsap.context(() => {
            gsap.from('[data-intro]', { y: 24, opacity: 0, duration: 1.2, ease: 'power3.out', stagger: 0.15, delay: 0.2 });
        }, story);
        return () => {
            ctx.revert();
            st.kill();
            gsap.ticker.remove(raf);
            lenis?.destroy();
        };
    }, []);

    return (
        <div className="bg-[#dbe8c6] text-[#eef3e4]">
            <div className="fixed inset-0 z-0" aria-hidden="true">
                <Canvas dpr={[1, lite ? 1.25 : 1.75]} camera={{ fov: 50, near: 0.1, far: 120, position: [0, 2.3, 6.2] }} gl={{ antialias: !lite, powerPreference: 'high-performance' }}>
                    <Suspense fallback={null}>
                        <StoryScene progress={progress} regions={regions} lite={lite} reduced={reduced} />
                    </Suspense>
                    <AdaptiveDpr pixelated={false} />
                </Canvas>
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(15_42_32/0.45))]" />
            </div>

            <header className="fixed top-3 inset-x-3 md:inset-x-6 z-30 px-4 md:px-5 py-2.5 flex items-center justify-between text-chlorophyll rounded-full bg-[rgb(219_232_198/0.72)] backdrop-blur-md ring-1 ring-chlorophyll/10">
                <Wordmark />
                <nav className="flex items-center gap-2 text-sm font-semibold">
                    <Link to="/map" className="hidden sm:inline-flex px-4 py-2 rounded-full hover:bg-white/40">Map</Link>
                    <Link to="/admin" className="hidden sm:inline-flex px-4 py-2 rounded-full hover:bg-white/40">Admin</Link>
                    <Link to="/dashboard" className="btn btn-sulphur !py-2 !px-4 ring-1 ring-chlorophyll/15"><span className="sm:hidden">Observatory</span><span className="hidden sm:inline">Open the observatory</span></Link>
                </nav>
            </header>

            <main ref={story} className="relative z-10">
                <section className="min-h-[105vh] flex flex-col justify-start px-6 md:px-16 pt-[16vh] bg-[linear-gradient(100deg,rgb(219_232_198/0.92)_0%,rgb(219_232_198/0.6)_38%,transparent_62%)]">
                    <h1 data-intro className="text-chlorophyll text-[clamp(3rem,9vw,8.5rem)] leading-[0.92] max-w-[11ch]">
                        Every breath has a story.
                    </h1>
                    <p data-intro className="mt-6 max-w-[38ch] text-lg md:text-xl text-chlorophyll/85 leading-relaxed">
                        This one starts in a Maharashtra meadow, with a Common Grass Yellow butterfly that weighs less than a raindrop.
                    </p>
                    <p data-intro className="mt-10 text-sm font-semibold text-chlorophyll/70 flex items-center gap-3">
                        <span className="inline-block h-9 w-[1.5px] bg-chlorophyll/50 motion-safe:animate-pulse" /> Scroll to follow it
                    </p>
                </section>

                <Chapter n="I" title="The meadow">
                    <p>
                        A butterfly reads the air with its whole body. It breathes through tiny pores along its sides called spiracles, so whatever drifts on the wind ends up inside it.
                    </p>
                    <p>For a long time, what drifted here was pollen.</p>
                </Chapter>

                <Chapter n="II" title="The haze" align="right">
                    <p>Then came the chimneys, the traffic, the stubble fires and the dust of a thousand building sites.</p>
                    {worst ? (
                        <p className="text-[#eef3e4]">
                            Right now in {worst.region}, the air quality index reads{' '}
                            <strong className="font-display text-2xl px-2.5 py-0.5 rounded-lg text-white" style={{ background: aqiColor(worst.aqi) }}>{fmt(worst.aqi)}</strong>, which counts as {band(worst.aqi)?.name.toLowerCase()}.
                            {worstSensor && <> Breathing it for a day is like smoking about {fmt(cigarettes(worstSensor.PM2_5), 0)} cigarettes.</>}
                        </p>
                    ) : (
                        <p>Across Maharashtra, some cities breathe air rated very poor for weeks at a time.</p>
                    )}
                </Chapter>

                <Chapter n="III" title="Thirty times thinner than a hair" height="min-h-[150vh]">
                    <p>The worst of it is PM2.5: particles small enough to slip past wings, noses and lungs, and on into the blood.</p>
                    <HairScale />
                    <p>The butterfly can’t outfly something it can’t see. Neither can we.</p>
                </Chapter>

                <Chapter n="IV" title="Twenty listeners">
                    <p>
                        So we placed twenty sensors across ten cities, from Ratnagiri on the coast to the coal belt of Chandrapur. Each one reports what it breathes.
                    </p>
                    <Ribbon regions={regions} />
                </Chapter>

                <Chapter n="V" title="Reading the air" align="right">
                    <p>
                        Every fifteen minutes the network checks in. A model trained on nearly a million hourly readings from Indian monitoring stations turns raw pollutants into an AQI. A second model looks six hours ahead.
                    </p>
                    {outlook?.outlook && worst && <p>Here’s what it expects for {worst.region}:</p>}
                    <Outlook data={outlook} />
                </Chapter>

                <Chapter n="VI" title="Clear again" height="min-h-[150vh]">
                    <p>
                        Knowing where the air is worst is how it gets better: which road to close, which plant to inspect, which morning to keep the children inside.
                        {cleanest && <> Today the clearest air is in {cleanest.region}, at {fmt(cleanest.aqi)}.</>}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-3">
                        <Link to="/dashboard" className="btn btn-sulphur">Open the observatory</Link>
                        <Link to="/map" className="btn border border-white/25 text-[#eef3e4] hover:bg-white/10">Explore the map</Link>
                    </div>
                </Chapter>

                <footer className="relative px-6 md:px-16 py-10 text-sm text-[#c7d3c0] bg-chlorophyll/90">
                    Sensor histories replay real CPCB station records, then continue live from the AirInsight model.
                </footer>
            </main>
        </div>
    );
}
