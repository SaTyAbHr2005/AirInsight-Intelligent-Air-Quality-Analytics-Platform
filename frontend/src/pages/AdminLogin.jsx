import React, { useState } from 'react';
import { loginAdmin } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Loader2, Lock, User } from 'lucide-react';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await loginAdmin(username, password);
            login(res.data.access_token);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] p-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="glass-card w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-slate-900/50 text-white mb-4 border border-slate-700">
                        <Shield size={32} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Shield</h2>
                    <p className="text-slate-500 text-sm mt-1">Authenticate to access sensor controls</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <User size={18} />
                            </div>
                            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" placeholder="admin" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Lock size={18} />
                            </div>
                            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-4 text-base">
                        {loading ? <Loader2 className="animate-spin" /> : 'Authorize Session'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-6">
                    Don't have clearance? <Link to="/admin/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Request access</Link>
                    <br /><br />
                    <Link to="/" className="hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium">&larr; Return to Public Portal</Link>
                </div>
            </div>
        </div>
    );
}
