import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, FlaskConical, LineChart, LogOut, Map, Moon, Radio, ShieldCheck, Sun } from 'lucide-react';
import Wordmark, { Glyph } from './Wordmark';
import { useAppContext } from '../context/AppContext';

const NAV = [
    { to: '/dashboard', label: 'Today', icon: Activity },
    { to: '/trends', label: 'Trends', icon: LineChart },
    { to: '/map', label: 'Map', icon: Map },
    { to: '/prediction', label: 'Prediction lab', icon: FlaskConical },
];

const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold transition-colors ${
        isActive ? 'bg-chlorophyll text-[#eef3e4] dark:bg-sulphur dark:text-chlorophyll' : 'text-muted hover:text-ink hover:bg-raised'
    }`;

export default function Shell() {
    const { darkMode, toggleTheme, isAuthenticated, logout, isSimulating } = useAppContext();
    const { pathname } = useLocation();
    const nav = isAuthenticated ? [...NAV, { to: '/simulator', label: 'Simulator', icon: Radio }] : NAV;

    return (
        <div className="min-h-screen bg-bg text-ink md:grid md:grid-cols-[15rem_1fr]">
            <aside className="hidden md:flex flex-col gap-8 p-6 border-r border-line sticky top-0 h-screen">
                <Wordmark />
                <nav className="flex flex-col gap-1" aria-label="Observatory">
                    {nav.map(({ to, label, icon: Icon }) => (
                        <NavLink key={to} to={to} className={linkClass}>
                            <Icon size={18} /> {label}
                            {to === '/simulator' && isSimulating && <span className="ml-auto h-2 w-2 rounded-full bg-crimson motion-safe:animate-pulse" />}
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto space-y-1">
                    {isAuthenticated ? (
                        <>
                            <NavLink to="/admin/dashboard" className={linkClass}><ShieldCheck size={18} /> Manage sensors</NavLink>
                            <button onClick={logout} className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold text-muted hover:text-ink hover:bg-raised">
                                <LogOut size={18} /> Sign out
                            </button>
                        </>
                    ) : (
                        <NavLink to="/admin" className={linkClass}><ShieldCheck size={18} /> Admin sign in</NavLink>
                    )}
                    <button onClick={toggleTheme} className="w-full flex items-center gap-3 rounded-full px-4 py-2.5 font-semibold text-muted hover:text-ink hover:bg-raised">
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />} {darkMode ? 'Day mode' : 'Night mode'}
                    </button>
                </div>
            </aside>

            {/* mobile: compact top bar + scrolling tabs */}
            <header className="md:hidden sticky top-0 z-40 bg-bg/90 backdrop-blur border-b border-line">
                <div className="flex items-center justify-between px-4 h-14">
                    <Wordmark />
                    <button onClick={toggleTheme} aria-label={darkMode ? 'Switch to day mode' : 'Switch to night mode'} className="p-2 rounded-full hover:bg-raised">
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
                <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm" aria-label="Observatory">
                    {nav.map(({ to, label }) => (
                        <NavLink key={to} to={to} className={(s) => `${linkClass(s)} !py-1.5 whitespace-nowrap`}>{label}</NavLink>
                    ))}
                </nav>
            </header>

            <main className="min-w-0 px-4 md:px-10 py-6 md:py-10">
                <div className="max-w-6xl mx-auto">
                    <Suspense
                        key={pathname}
                        fallback={<div className="h-[60vh] grid place-items-center"><Glyph className="w-10 h-10 motion-safe:animate-pulse" /></div>}
                    >
                        <Outlet />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
