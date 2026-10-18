import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { useAppContext } from '../context/AppContext';
import { errorText, loginAdmin } from '../lib/api';

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
            setError(errorText(err, 'Sign-in failed.') === 'Invalid credentials' ? 'That username and password don’t match.' : errorText(err, 'Sign-in failed.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Admin sign in"
            intro="Manage sensors and stage pollution events."
            footer={<p>Need an account? <Link to="/admin/register" className="font-semibold text-ink underline underline-offset-4">Create one</Link></p>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && <p role="alert" className="rounded-xl border border-crimson/40 bg-crimson/10 px-4 py-3 text-crimson font-semibold">{error}</p>}
                <div>
                    <label htmlFor="username" className="field-label">Username</label>
                    <input id="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="field" />
                </div>
                <div>
                    <label htmlFor="password" className="field-label">Password</label>
                    <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
                </div>
                <button type="submit" disabled={loading} className="btn btn-sulphur w-full">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Sign in'}
                </button>
            </form>
        </AuthLayout>
    );
}
