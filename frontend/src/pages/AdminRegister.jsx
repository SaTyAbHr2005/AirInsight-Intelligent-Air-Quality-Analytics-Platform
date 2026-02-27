import React, { useState } from 'react';
import { registerAdmin } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldPlus, Loader2, Lock, User, Mail } from 'lucide-react';

export default function AdminRegister() {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await registerAdmin(formData.username, formData.email, formData.password);
            setSuccess(true);
            setTimeout(() => navigate('/admin'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Username may already exist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b1120] p-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="glass-card w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-purple-900/50 text-white mb-4 border border-indigo-400/50">
                        <ShieldPlus size={32} />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Request Clearance</h2>
                    <p className="text-slate-500 text-sm mt-1">Enroll as a new system administrator</p>
                </div>

                {error && <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium text-center">{error}</div>}
                {success && <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium text-center">Registration successful! Redirecting to login...</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                            <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" placeholder="admin_user_01" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Mail size={18} /></div>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" placeholder="admin@airinsight.io" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400" placeholder="••••••••" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading || success} className="btn-primary w-full py-3 mt-4 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30">
                        {loading ? <Loader2 className="animate-spin cursor-not-allowed" /> : 'Register Administrator'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-6">
                    Already authorized? <Link to="/admin" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">Proceed to Login</Link>
                    <br /><br />
                    <Link to="/" className="hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 font-medium">&larr; Return to Public Portal</Link>
                </div>
            </div>
        </div>
    );
}
