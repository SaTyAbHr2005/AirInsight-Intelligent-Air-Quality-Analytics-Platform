import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '../components/AuthLayout';
import { errorText, registerAdmin } from '../lib/api';

export default function AdminRegister() {
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await registerAdmin(form.username, form.email, form.password);
            toast.success('Account created. Sign in to continue.');
            navigate('/admin');
        } catch (err) {
            setError(errorText(err, 'The account could not be created.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create an admin account"
            intro="Admins can add, pause and remove sensors."
            footer={<p>Already have an account? <Link to="/admin" className="font-semibold text-ink underline underline-offset-4">Sign in</Link></p>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <p role="alert" className="rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-crimson font-semibold">{error}</p>}
                <div>
                    <label htmlFor="username" className="field-label">Username</label>
                    <input id="username" autoComplete="username" required minLength={3} value={form.username} onChange={set('username')} className="field" />
                </div>
                <div>
                    <label htmlFor="email" className="field-label">Email</label>
                    <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} className="field" />
                </div>
                <div>
                    <label htmlFor="password" className="field-label">Password, at least 6 characters</label>
                    <input id="password" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={set('password')} className="field" />
                </div>
                <button type="submit" disabled={loading} className="btn btn-sulphur w-full">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create account'}
                </button>
            </form>
        </AuthLayout>
    );
}
