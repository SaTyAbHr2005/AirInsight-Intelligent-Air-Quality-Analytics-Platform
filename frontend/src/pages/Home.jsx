import React from 'react';
import { Link } from 'react-router-dom';
import { Wind, Activity, ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 font-sans overflow-x-hidden">
            <nav className="fixed w-full z-50 top-0 border-b border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                            <Wind size={24} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight">AirInsight</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/admin" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Admin Portal</Link>
                        <Link to="/dashboard" className="btn-primary text-sm px-5 py-2">Launch System <ArrowRight size={16} /></Link>
                    </div>
                </div>
            </nav>

            <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/20 dark:bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
                <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold text-sm mb-4 backdrop-blur-md shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                        Real-time IoT Telemetry Active
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                        Next-Gen Intelligence for <br className="hidden lg:block" />
                        <span className="hero-gradient">Global Air Quality</span>
                    </h1>
                    <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Deploy an enterprise-grade sensor network with sub-second latency. Predictive modeling and live geospatial mapping powered by FastAPI and Next-Gen React.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/dashboard" className="btn-primary px-8 py-4 text-lg w-full sm:w-auto shadow-xl shadow-blue-500/30">
                            Open Dashboard Dashboard <ArrowRight size={20} />
                        </Link>
                        <Link to="/admin" className="btn-secondary px-8 py-4 text-lg w-full sm:w-auto">
                            Login to Admin Shield <ShieldCheck size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-white/50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">Built for Extreme Scale</h2>
                        <p className="text-slate-500 max-w-2xl mx-auto">Our architecture is designed to handle millions of hardware sensor events effortlessly while maintaining perfectly fluid 60FPS UI.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass-card p-8 group hover:-translate-y-2 transition-transform duration-500">
                            <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                <Activity size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Predictive AI Engine</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Using advanced Scikit-Learn pipelines running on our Python backend, accurately forecast upcoming pollution spikes hours in advance.</p>
                        </div>
                        <div className="glass-card p-8 group hover:-translate-y-2 transition-transform duration-500 delay-100">
                            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Sub-Millisecond APIs</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Built entirely on FastAPI. Delivering asynchronous, type-checked, blazing fast payloads straight to the Recharts visualizer.</p>
                        </div>
                        <div className="glass-card p-8 group hover:-translate-y-2 transition-transform duration-500 delay-200">
                            <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                <Globe size={28} />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Geospatial Synapse</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Integrated Leaflet mapping plots real-time node coordinates. View interactive radius markers dynamically updating as air quality shifts.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="h-32 flex items-center justify-center border-t border-slate-200 dark:border-slate-800 text-slate-500 font-medium z-10 relative">
                <p>&copy; {new Date().getFullYear()} AirInsight Intelligence. Dedicated for Hackathon Excellence.</p>
            </footer>
        </div>
    );
}
