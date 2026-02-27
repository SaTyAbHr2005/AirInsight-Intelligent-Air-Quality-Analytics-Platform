import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, TrendingUp, MapPin, Play, Wind } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../utils/cn';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/prediction', label: 'Prediction', icon: Activity },
    { path: '/trends', label: 'Trends', icon: TrendingUp },
    { path: '/map', label: 'Map View', icon: MapPin },
    { path: '/simulator', label: 'Simulator', icon: Play },
];

export default function Sidebar() {
    const { sidebarOpen } = useAppContext();

    return (
        <div className={cn(
            "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-50 transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-64" : "w-20 hidden md:flex"
        )}>
            <div className="h-16 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
                    <Wind size={28} className="animate-pulse" />
                    {sidebarOpen && <span className="font-bold text-xl tracking-tight leading-none">AirInsight</span>}
                </div>
            </div>

            <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            <Icon size={22} className={cn("shrink-0", sidebarOpen ? "" : "mx-auto")} />
                            {sidebarOpen && <span>{item.label}</span>}

                            {!sidebarOpen && (
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs font-medium text-slate-500">
                {sidebarOpen ? 'v1.0.0 Production' : 'v1.0'}
            </div>
        </div>
    );
}
