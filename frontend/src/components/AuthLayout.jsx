import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import Wordmark from './Wordmark';

const Swarm = lazy(() => import('../three/Swarm'));

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
export const rise = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

// Field-level error that slides in under the form
export function FormError({ message }) {
    return (
        <AnimatePresence>
            {message && (
                <motion.p
                    role="alert"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-crimson font-semibold overflow-hidden"
                >
                    {message}
                </motion.p>
            )}
        </AnimatePresence>
    );
}

export function PasswordField({ id = 'password', label = 'Password', value, onChange, autoComplete, minLength }) {
    const [show, setShow] = useState(false);
    const [caps, setCaps] = useState(false);
    const onKey = (e) => setCaps(e.getModifierState?.('CapsLock'));
    return (
        <div>
            <label htmlFor={id} className="field-label">{label}</label>
            <div className="relative">
                <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} required minLength={minLength}
                    value={value} onChange={onChange} onKeyUp={onKey} onKeyDown={onKey} className="field pr-11" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted hover:text-ink">
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            <AnimatePresence>
                {caps && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-umber mt-1.5 font-semibold">
                        Caps Lock is on
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}

// Split screen: the form beside a living swarm of butterflies
export default function AuthLayout({ title, intro, children, footer, excited }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-bg text-ink">
            <div className="flex flex-col px-6 md:px-14 py-8 relative z-10">
                <Wordmark />
                <div className="lg:hidden relative h-44 -mx-6 mt-4 rounded-b-3xl bg-chlorophyll overflow-hidden">
                    <Suspense fallback={null}><Swarm count={4} excited={excited} /></Suspense>
                </div>
                <div className="flex-1 flex items-center">
                    <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-sm mx-auto lg:mx-0 py-12">
                        <motion.h1 variants={rise} className="text-4xl">{title}</motion.h1>
                        <motion.p variants={rise} className="text-muted mt-2 mb-8">{intro}</motion.p>
                        {children}
                        <motion.div variants={rise} className="mt-8 text-sm text-muted space-y-2">{footer}</motion.div>
                    </motion.div>
                </div>
                <Link to="/" className="text-sm text-muted hover:text-ink">Back to the story</Link>
            </div>

            <div className="hidden lg:block relative bg-chlorophyll overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgb(235_192_63/0.18),transparent_60%)]" />
                <div className="absolute inset-0">
                    <Suspense fallback={null}><Swarm count={8} excited={excited} /></Suspense>
                </div>
                <motion.p
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute left-12 right-12 bottom-12 font-display text-3xl xl:text-4xl leading-tight max-w-[18ch] text-[#eef3e4] pointer-events-none"
                >
                    Twenty sensors. Ten cities. One butterfly’s worth of air.
                </motion.p>
            </div>
        </div>
    );
}
