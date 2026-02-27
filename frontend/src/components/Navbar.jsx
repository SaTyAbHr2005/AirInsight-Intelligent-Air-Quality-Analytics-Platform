import React, { useState } from 'react';
import { Menu, Moon, Sun, LogOut, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { toggleTheme, darkMode, toggleSidebar, isAuthenticated, logout } = useAppContext();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 focus:outline-none rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <Menu size={22} />
                </button>
                <Link to="/" className="font-bold text-lg md:text-xl text-slate-800 dark:text-slate-100 hidden sm:block hover:text-blue-600 transition-colors py-1">
                    AirInsight
                </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    System Live
                </div>

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <div className="relative ml-2">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white dark:border-slate-800 focus:outline-none hover:shadow-lg transition-shadow cursor-pointer"
                    >
                        A
                    </button>
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            {isAuthenticated && (
                                <Link to="/admin" className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <Shield size={16} /> Admin Portal
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium"
                            >
                                <LogOut size={16} /> {isAuthenticated ? 'Log Out Admin' : 'Exit App'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
