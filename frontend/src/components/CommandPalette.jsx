import { useEffect } from 'react';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Activity, BookOpen, FlaskConical, LineChart, Map, Moon, Radio, Search, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useRegions } from '../lib/api';
import { aqiColor, band, fmt } from '../lib/aqi';

const PAGES = [
    { to: '/dashboard', label: 'Today', icon: Activity },
    { to: '/trends', label: 'Trends', icon: LineChart },
    { to: '/map', label: 'Map', icon: Map },
    { to: '/prediction', label: 'Prediction lab', icon: FlaskConical },
    { to: '/', label: 'Read the story', icon: BookOpen },
];

const item = 'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer data-[selected=true]:bg-raised data-[selected=true]:text-ink text-muted';

export default function CommandPalette({ open, setOpen }) {
    const navigate = useNavigate();
    const { setRegionId, toggleTheme, isAuthenticated, darkMode } = useAppContext();
    const { data: regions = [] } = useRegions();

    useEffect(() => {
        const onKey = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setOpen]);

    const go = (fn) => () => {
        fn();
        setOpen(false);
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[100] bg-chlorophyll/50 backdrop-blur-sm grid place-items-start justify-center pt-[14vh] px-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setOpen(false)}
                >
                    <motion.div
                        initial={{ y: -12, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: -8, scale: 0.98, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-xl"
                    >
                        <Command label="Jump to a city or page" className="panel bg-surface shadow-2xl overflow-hidden" loop>
                            <div className="flex items-center gap-3 px-4 border-b border-line">
                                <Search size={18} className="text-muted" />
                                <Command.Input autoFocus placeholder="Search cities, pages and actions" className="flex-1 bg-transparent py-4 outline-none text-ink placeholder:text-muted" />
                                <kbd className="text-xs text-muted border border-line rounded-md px-1.5 py-0.5">Esc</kbd>
                            </div>
                            <Command.List className="max-h-[50vh] overflow-y-auto p-2">
                                <Command.Empty className="px-3 py-6 text-center text-muted">Nothing matches that. Try a city name.</Command.Empty>
                                <Command.Group heading="Cities" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:text-muted">
                                    {regions.map((r) => (
                                        <Command.Item key={r.region_id} value={`city ${r.region}`} className={item}
                                            onSelect={go(() => { setRegionId(r.region_id); navigate('/dashboard'); })}>
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: aqiColor(r.aqi) }} />
                                            <span className="flex-1 text-ink font-semibold">{r.region}</span>
                                            <span className="text-sm">{band(r.aqi)?.name}</span>
                                            <span className="tabular-nums font-semibold text-ink w-10 text-right">{fmt(r.aqi)}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                                <Command.Group heading="Pages" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:text-muted">
                                    {PAGES.map(({ to, label, icon: Icon }) => (
                                        <Command.Item key={to} value={`page ${label}`} className={item} onSelect={go(() => navigate(to))}>
                                            <Icon size={16} /> <span className="text-ink">{label}</span>
                                        </Command.Item>
                                    ))}
                                    {isAuthenticated && (
                                        <>
                                            <Command.Item value="page simulator" className={item} onSelect={go(() => navigate('/simulator'))}>
                                                <Radio size={16} /> <span className="text-ink">Simulator</span>
                                            </Command.Item>
                                            <Command.Item value="page manage sensors" className={item} onSelect={go(() => navigate('/admin/dashboard'))}>
                                                <ShieldCheck size={16} /> <span className="text-ink">Manage sensors</span>
                                            </Command.Item>
                                        </>
                                    )}
                                </Command.Group>
                                <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:text-muted">
                                    <Command.Item value="toggle theme night day mode" className={item} onSelect={go(toggleTheme)}>
                                        <Moon size={16} /> <span className="text-ink">Switch to {darkMode ? 'day' : 'night'} mode</span>
                                    </Command.Item>
                                </Command.Group>
                            </Command.List>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
