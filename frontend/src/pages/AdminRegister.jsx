import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useAnimate } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout, { FormError, PasswordField, rise, stagger } from '../components/AuthLayout';
import { shakeIt } from './AdminLogin';
import { errorText, registerAdmin } from '../lib/api';

// 0–4: length, mixed case, digits, symbols
const strength = (p) => (p.length >= 8) + (/[a-z]/.test(p) && /[A-Z]/.test(p)) + /\d/.test(p) + /[^\w\s]/.test(p);
const LEVELS = [
    { label: 'Too weak', color: 'var(--crimson)' },
    { label: 'Weak', color: 'var(--crimson)' },
    { label: 'Fair', color: 'var(--sulphur)' },
    { label: 'Good', color: 'var(--leaf)' },
    { label: 'Strong', color: 'var(--leaf)' },
];

export default function AdminRegister() {
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const excited = useRef(false);
    const [formRef, animate] = useAnimate();
    const navigate = useNavigate();
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const score = strength(form.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        excited.current = true;
        try {
            await registerAdmin(form.username, form.email, form.password);
            toast.success('Account created. Sign in to continue.');
            navigate('/admin');
        } catch (err) {
            setError(errorText(err, 'The account could not be created.'));
            excited.current = false;
            shakeIt(animate, formRef.current);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Create an admin account"
            intro="Admins can add, pause and remove sensors."
            excited={excited}
            footer={<p>Already have an account? <Link to="/admin" className="font-semibold text-ink underline underline-offset-4">Sign in</Link></p>}
        >
            <motion.form ref={formRef} variants={stagger} onSubmit={handleSubmit} className="space-y-5">
                <FormError message={error} />
                <motion.div variants={rise}>
                    <label htmlFor="username" className="field-label">Username</label>
                    <input id="username" autoComplete="username" required minLength={3} value={form.username} onChange={set('username')} className="field" />
                </motion.div>
                <motion.div variants={rise}>
                    <label htmlFor="email" className="field-label">Email</label>
                    <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} className="field" />
                </motion.div>
                <motion.div variants={rise}>
                    <PasswordField label="Password, at least 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" minLength={6} />
                    {form.password && (
                        <div className="mt-2.5" aria-live="polite">
                            <div className="flex gap-1.5" aria-hidden="true">
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
                                        <motion.div className="h-full rounded-full" initial={false}
                                            animate={{ width: i < score ? '100%' : '0%', backgroundColor: LEVELS[score].color }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.04 }} />
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-muted mt-1.5">{LEVELS[score].label} password</p>
                        </div>
                    )}
                </motion.div>
                <motion.div variants={rise}>
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }} className="btn btn-sulphur w-full">
                        {loading ? <><Loader2 className="animate-spin" size={18} /> Creating account</> : 'Create account'}
                    </motion.button>
                </motion.div>
            </motion.form>
        </AuthLayout>
    );
}
