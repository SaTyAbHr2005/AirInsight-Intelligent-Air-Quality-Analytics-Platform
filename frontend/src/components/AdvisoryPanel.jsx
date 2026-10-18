import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Clock, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAdvisory, useProfiles } from '../lib/api';

const SOURCE = {
    gemini: { label: 'Written by Gemini from live readings', icon: Sparkles },
    groq: { label: 'Written by Llama on Groq from live readings', icon: Sparkles },
    rules: { label: 'Standard advisory from CPCB health guidance', icon: ShieldCheck },
};

export function ProfilePicker({ size = 'md' }) {
    const { profile, setProfile } = useAppContext();
    const { data: profiles = [] } = useProfiles();
    return (
        <div role="radiogroup" aria-label="Who is this advice for" className="flex flex-wrap gap-1.5">
            {profiles.map((p) => {
                const on = p.id === profile;
                return (
                    <button key={p.id} role="radio" aria-checked={on} onClick={() => setProfile(p.id)}
                        className={`relative rounded-full border font-semibold transition-colors ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'} ${on ? 'border-transparent text-chlorophyll' : 'border-line text-muted hover:text-ink'}`}>
                        {on && <motion.span layoutId={`profile-pill-${size}`} className="absolute inset-0 rounded-full bg-sulphur" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
                        <span className="relative">{p.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="space-y-3 animate-pulse" aria-label="Writing your advisory">
            <div className="h-7 w-3/4 rounded-lg bg-line" />
            <div className="h-4 w-1/2 rounded bg-line" />
            {[0, 1, 2].map((i) => <div key={i} className="h-4 rounded bg-line" style={{ width: `${85 - i * 12}%` }} />)}
        </div>
    );
}

export default function AdvisoryPanel({ region }) {
    const { profile } = useAppContext();
    const { data, isFetching, isError } = useAdvisory(region?.region_id, profile);
    const src = SOURCE[data?.source] ?? SOURCE.rules;

    return (
        <section className="panel p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl">Your health advisory</h2>
                    <p className="text-muted text-sm mt-1">Pick who it’s for. Advice is rebuilt from {region?.region}’s live readings and forecast.</p>
                </div>
            </div>
            <div className="mt-4"><ProfilePicker /></div>

            <div className="mt-6 min-h-[12rem]" aria-live="polite">
                {isError ? (
                    <p className="text-crimson font-semibold">The advisory couldn’t load. Check that the backend is running, then refresh.</p>
                ) : !data || isFetching ? (
                    <Skeleton />
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div key={`${data.city}-${profile}-${data.aqi}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <p className="font-display text-2xl leading-snug max-w-[40ch]">{data.headline}</p>
                            <p className="text-muted mt-2 max-w-[60ch]">{data.summary}</p>
                            <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
                                {data.actions.map((a, i) => (
                                    <motion.li key={a} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }}
                                        className="flex gap-3 rounded-xl bg-raised/70 border border-line px-4 py-3">
                                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-leaf" />
                                        <span>{a}</span>
                                    </motion.li>
                                ))}
                            </ul>
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {data.best_time && (
                                    <p className="flex gap-3 items-start rounded-xl border border-sulphur/50 bg-sulphur/10 px-4 py-3">
                                        <Clock size={18} className="mt-0.5 shrink-0 text-umber" /> <span><strong>Best time to go out:</strong> {data.best_time}</span>
                                    </p>
                                )}
                                {data.see_doctor_if && (
                                    <p className="flex gap-3 items-start rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3">
                                        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-crimson" /> <span>{data.see_doctor_if}</span>
                                    </p>
                                )}
                            </div>
                            <p className="mt-5 text-xs text-muted flex items-center gap-1.5">
                                <src.icon size={13} /> {src.label}. Not a substitute for medical advice.
                            </p>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </section>
    );
}
