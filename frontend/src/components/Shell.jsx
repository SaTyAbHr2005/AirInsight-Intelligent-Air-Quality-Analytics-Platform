import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, FlaskConical, LineChart, LogOut, Map, Moon, Radio, Search, ShieldCheck, Sun } from 'lucide-react';
import Wordmark, { Glyph } from './Wordmark';
import AirParticles from './AirParticles';
import CommandPalette from './CommandPalette';
import Assistant from './Assistant';
import { useSelectedRegion } from './RegionPicker';
import { useAppContext } from '../context/AppContext';

const NAV = [
    { to: '/dashboard', label: 'Today', icon: Activity },
    { to: '/trends', label: 'Trends', icon: LineChart },
    { to: '/map', label: 'Map', icon: Map },
    { to: '/prediction', label: 'Prediction lab', icon: FlaskConical },
];

// Active item gets a pill that slides between links instead of blinking
function NavItem({ to, label, icon: Icon, badge, compact }) {
    return (
        <NavLink to={to} className={`relative flex items-center gap-3 rounded-full font-semibold ${compact ? 'px-3.5 py-1.5 whitespace-nowrap' : 'px-4 py-2.5'}`}>
            {({ isActive }) => (
                <>
                    {isActive && (
                        <motion.span
                            layoutId={compact ? 'nav-pill-m' : 'nav-pill'}
                            className="absolute inset-0 rounded-full bg-chlorophyll dark:bg-sulphur"
                            transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                    )}
                    <span className={`relative flex items-center gap-3 transition-colors ${isActive ? 'text-[#eef3e4] dark:text-chlorophyll' : 'text-muted hover:text-ink'}`}>
                        {!compact && <Icon size={18} />} {label}
                        {badge && <span className="h-2 w-2 rounded-full bg-crimson motion-safe:animate-pulse" />}
                    </span>
                </>
            )}
        </NavLink>
    );
}

const plain = 'w-full flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold text-muted hover:text-ink hover:bg-raised transition-colors';

export default function Shell() {
    const { darkMode, toggleTheme, isAuthenticated, logout, isSimulating } = useAppContext();
    const { region } = useSelectedRegion();
    const { pathname } = useLocation();
    const [palette, setPalette] = useState(false);
    const nav = isAuthenticated ? [...NAV, { to: '/simulator', label: 'Simulator', icon: Radio, badge: isSimulating }] : NAV;

    return (
        <div className="min-h-screen bg-bg text-ink md:grid md:grid-cols-[15rem_1fr] relative">
            {/* the selected city's air, drifting behind every page */}
            <AirParticles aqi={region?.aqi} className="fixed inset-0 z-0" intensity={0.8} />

            <aside className="hidden md:flex flex-col gap-6 p-6 border-r border-line sticky top-0 h-screen z-10 bg-bg/70 backdrop-blur-sm">
                <Wordmark />
                <button onClick={() => setPalette(true)} className="flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm text-muted hover:text-ink hover:border-muted transition-colors">
                    <Search size={15} /> <span className="flex-1 text-left">Jump to…</span>
                    <kbd className="text-xs border border-line rounded px-1">Ctrl K</kbd>
                </button>
                <nav className="flex flex-col gap-1" aria-label="Observatory">
                    {nav.map((n) => <NavItem key={n.to} {...n} />)}
                </nav>
                <div className="mt-auto space-y-1">
                    {isAuthenticated ? (
                        <>
                            <NavItem to="/admin/dashboard" label="Manage sensors" icon={ShieldCheck} />
                            <button onClick={logout} className={plain}><LogOut size={18} /> Sign out</button>
                        </>
                    ) : (
                        <NavItem to="/admin" label="Admin sign in" icon={ShieldCheck} />
                    )}
                    <button onClick={toggleTheme} className={plain}>
                        <motion.span key={darkMode ? 'sun' : 'moon'} initial={{ rotate: -90, scale: 0.5 }} animate={{ rotate: 0, scale: 1 }}>
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </motion.span>
                        {darkMode ? 'Day mode' : 'Night mode'}
                    </button>
                </div>
            </aside>

            <header className="md:hidden sticky top-0 z-40 bg-bg/85 backdrop-blur border-b border-line">
                <div className="flex items-center justify-between px-4 h-14">
                    <Wordmark />
                    <div className="flex">
                        <button onClick={() => setPalette(true)} aria-label="Search cities and pages" className="p-2 rounded-full hover:bg-raised"><Search size={18} /></button>
                        <button onClick={toggleTheme} aria-label={darkMode ? 'Switch to day mode' : 'Switch to night mode'} className="p-2 rounded-full hover:bg-raised">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>
                </div>
                <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm" aria-label="Observatory">
                    {nav.map((n) => <NavItem key={n.to} {...n} compact />)}
                </nav>
            </header>

            <main className="min-w-0 px-4 md:px-10 py-6 md:py-10 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Suspense fallback={<div className="h-[60vh] grid place-items-center"><Glyph className="w-10 h-10 motion-safe:animate-pulse" /></div>}>
                                <Outlet />
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            <CommandPalette open={palette} setOpen={setPalette} />
            <Assistant />
        </div>
    );
}
