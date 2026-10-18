import { Link } from 'react-router-dom';
import Wordmark from './Wordmark';

// Split screen: a quiet form beside a chlorophyll panel with one line of story.
export default function AuthLayout({ title, intro, children, footer }) {
    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-bg text-ink">
            <div className="flex flex-col px-6 md:px-14 py-8">
                <Wordmark />
                <div className="flex-1 flex items-center">
                    <div className="w-full max-w-sm mx-auto lg:mx-0 py-12">
                        <h1 className="text-4xl">{title}</h1>
                        <p className="text-muted mt-2 mb-8">{intro}</p>
                        {children}
                        <div className="mt-8 text-sm text-muted space-y-2">{footer}</div>
                    </div>
                </div>
                <Link to="/" className="text-sm text-muted hover:text-ink">Back to the story</Link>
            </div>
            <div className="hidden lg:flex flex-col justify-end p-14 bg-chlorophyll text-[#eef3e4] relative overflow-hidden">
                <svg viewBox="0 0 400 400" className="absolute -top-10 -right-10 w-[34rem] opacity-90" aria-hidden="true">
                    <path d="M200 200C150 90 70 50 30 90s10 120 170 110z" fill="#ebc03f" />
                    <path d="M200 200C250 90 330 50 370 90s-10 120-170 110z" fill="#ebc03f" />
                    <path d="M200 200c-40 40-100 80-115 120s50 25 115-120zM200 200c40 40 100 80 115 120s-50 25-115-120z" fill="#d9a82a" />
                    <path d="M200 110v190" stroke="#0f2a20" strokeWidth="8" strokeLinecap="round" />
                </svg>
                <p className="font-display text-4xl leading-tight max-w-[18ch] relative">Twenty sensors. Ten cities. One butterfly’s worth of air.</p>
            </div>
        </div>
    );
}
