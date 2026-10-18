import { Link } from 'react-router-dom';

// A two-stroke butterfly glyph: the same shape as the 3D wings, flattened.
export const Glyph = ({ className = 'w-7 h-7' }) => (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
        <path d="M16 16C12 8 6 5 3 8s1 9 13 8z" fill="var(--sulphur)" />
        <path d="M16 16C20 8 26 5 29 8s-1 9-13 8z" fill="var(--sulphur)" />
        <path d="M16 16c-3 3-8 6-9 9s4 2 9-9zM16 16c3 3 8 6 9 9s-4 2-9-9z" fill="#d9a82a" />
        <path d="M16 9v15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
);

export default function Wordmark({ to = '/', className = '' }) {
    return (
        <Link to={to} className={`inline-flex items-center gap-2 ${className}`}>
            <Glyph />
            <span className="font-display text-xl tracking-tight">AirInsight</span>
        </Link>
    );
}
