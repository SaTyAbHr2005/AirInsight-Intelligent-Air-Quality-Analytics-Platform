import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import AuthLayout, { FormError, PasswordField, rise, stagger } from '../components/AuthLayout';
import { useAppContext } from '../context/AppContext';
import { errorText, loginAdmin } from '../lib/api';

// imperative, so it doesn't interrupt the stagger variants flowing to the fields
export const shakeIt = (animate, el) => animate(el, { x: [0, -12, 11, -8, 6, -3, 0] }, { duration: 0.45 });

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [state, setState] = useState('idle'); // idle | loading | done
    const [error, setError] = useState('');
    const excited = useRef(false);
    const [form, animate] = useAnimate();
    const { login } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setState('loading');
        setError('');
        excited.current = true;
        try {
            const res = await loginAdmin(username, password);
            setState('done');
            setTimeout(() => {
                login(res.data.access_token);
                navigate('/admin/dashboard');
            }, 650);
        } catch (err) {
            const msg = errorText(err, 'Sign-in failed.');
            setError(msg === 'Invalid credentials' ? 'That username and password don’t match.' : msg);
            setState('idle');
            excited.current = false;
            shakeIt(animate, form.current);
        }
    };

    return (
        <AuthLayout
            title="Admin sign in"
            intro="Manage sensors and stage pollution events."
            excited={excited}
            footer={<p>Need an account? <Link to="/admin/register" className="font-semibold text-ink underline underline-offset-4">Create one</Link></p>}
        >
            <motion.form ref={form} variants={stagger} onSubmit={handleSubmit} className="space-y-5">
                <FormError message={error} />
                <motion.div variants={rise}>
                    <label htmlFor="username" className="field-label">Username</label>
                    <input id="username" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)} className="field" />
                </motion.div>
                <motion.div variants={rise}>
                    <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </motion.div>
                <motion.div variants={rise}>
                    <motion.button
                        type="submit" disabled={state !== 'idle'} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                        className={`btn w-full overflow-hidden ${state === 'done' ? 'bg-leaf text-white' : 'btn-sulphur'}`}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span key={state} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="flex items-center gap-2">
                                {state === 'loading' && <><Loader2 className="animate-spin" size={18} /> Checking</>}
                                {state === 'done' && <><Check size={18} /> Welcome back</>}
                                {state === 'idle' && 'Sign in'}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </motion.div>
            </motion.form>
        </AuthLayout>
    );
}
