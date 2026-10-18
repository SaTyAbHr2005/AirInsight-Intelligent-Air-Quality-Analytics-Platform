import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, RotateCcw, X } from 'lucide-react';
import { Glyph } from './Wordmark';
import { ProfilePicker } from './AdvisoryPanel';
import { useSelectedRegion } from './RegionPicker';
import { useAppContext } from '../context/AppContext';
import { askAssistant, errorText } from '../lib/api';
import { aqiColor, fmt } from '../lib/aqi';

const SUGGESTIONS = (city) => [
    `Is it safe to go for a run in ${city} tonight?`,
    `What's making ${city}'s air bad right now?`,
    'Which city has the cleanest air today?',
    'What mask should I wear, and does a cloth mask help?',
];

// Tiny formatter: "- " lines become a list, **bold** becomes strong. Replies are plain text by prompt.
function Reply({ text }) {
    const blocks = [];
    for (const line of text.split('\n').map((l) => l.trim()).filter(Boolean)) {
        const item = /^[-*•]\s+/.test(line);
        const last = blocks[blocks.length - 1];
        if (item && last?.list) last.items.push(line.replace(/^[-*•]\s+/, ''));
        else if (item) blocks.push({ list: true, items: [line.replace(/^[-*•]\s+/, '')] });
        else blocks.push({ list: false, text: line });
    }
    const rich = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
    return (
        <div className="space-y-2">
            {blocks.map((b, i) =>
                b.list ? (
                    <ul key={i} className="space-y-1">
                        {b.items.map((t, j) => <li key={j} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" />{rich(t)}</li>)}
                    </ul>
                ) : <p key={i}>{rich(b.text)}</p>,
            )}
        </div>
    );
}

function Thinking() {
    return (
        <div className="flex gap-1.5 px-4 py-3" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-2 w-2 rounded-full bg-muted"
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15 }} />
            ))}
        </div>
    );
}

export default function Assistant() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [busy, setBusy] = useState(false);
    const { region } = useSelectedRegion();
    const { profile } = useAppContext();
    const list = useRef();
    const input = useRef();

    useEffect(() => {
        list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
    }, [messages, busy]);

    useEffect(() => {
        if (open) setTimeout(() => input.current?.focus(), 250);
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const send = async (text) => {
        const content = text.trim();
        if (!content || busy || !region) return;
        const next = [...messages, { role: 'user', content }];
        setMessages(next);
        setDraft('');
        setBusy(true);
        try {
            // only role/content go to the API; keep the last 10 turns
            const res = await askAssistant(region.region_id, profile, next.slice(-10).map(({ role, content }) => ({ role, content })));
            setMessages((m) => [...m, { role: 'assistant', content: res.reply, source: res.source }]);
        } catch (e) {
            setMessages((m) => [...m, { role: 'assistant', content: errorText(e, 'Something went wrong. Try again.'), error: true }]);
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <motion.button
                onClick={() => setOpen((o) => !o)}
                aria-label={open ? 'Close the air assistant' : 'Ask the air assistant'}
                aria-expanded={open}
                className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-chlorophyll text-sulphur shadow-xl grid place-items-center ring-4 ring-bg"
                whileHover={{ scale: 1.08, rotate: -6 }} whileTap={{ scale: 0.92 }}
                animate={open ? { rotate: 0 } : { y: [0, -4, 0] }}
                transition={open ? {} : { repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={open ? 'x' : 'b'} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
                        {open ? <X size={22} className="text-[#eef3e4]" /> : <Glyph className="w-8 h-8" />}
                    </motion.span>
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="dialog" aria-label="Air assistant"
                        initial={{ opacity: 0, y: 30, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        style={{ transformOrigin: 'bottom right' }}
                        className="fixed z-50 bottom-24 right-3 left-3 sm:left-auto sm:right-5 sm:w-[25rem] h-[min(36rem,calc(100vh-8rem))] panel !bg-surface shadow-2xl flex flex-col overflow-hidden"
                    >
                        <header className="px-5 pt-4 pb-3 border-b border-line">
                            <div className="flex items-center justify-between">
                                <p className="font-display text-xl">Ask about the air</p>
                                {messages.length > 0 && (
                                    <button onClick={() => setMessages([])} className="text-muted hover:text-ink p-1.5 rounded-full" aria-label="Start a new conversation"><RotateCcw size={16} /></button>
                                )}
                            </div>
                            {region && (
                                <p className="text-sm text-muted mt-0.5 flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ background: aqiColor(region.aqi) }} />
                                    Answering for {region.region}, AQI {fmt(region.aqi)}
                                </p>
                            )}
                            <div className="mt-3"><ProfilePicker size="sm" /></div>
                        </header>

                        <div ref={list} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                            {!messages.length && (
                                <div className="space-y-2">
                                    <p className="text-muted text-sm px-1">Ask anything about today’s air, your health, or the sensor network. Try one of these:</p>
                                    {SUGGESTIONS(region?.region ?? 'your city').map((s, i) => (
                                        <motion.button key={s} onClick={() => send(s)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                                            className="block w-full text-left rounded-xl border border-line px-3.5 py-2.5 text-sm hover:bg-raised hover:border-muted transition-colors">
                                            {s}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {messages.map((m, i) => (
                                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === 'user' ? 'flex justify-end' : ''}>
                                    <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed ${
                                        m.role === 'user' ? 'bg-chlorophyll text-[#eef3e4] rounded-br-md dark:bg-sulphur dark:text-chlorophyll'
                                            : m.error ? 'bg-crimson/10 text-crimson border border-crimson/30 rounded-bl-md' : 'bg-raised border border-line rounded-bl-md'}`}>
                                        {m.role === 'user' ? m.content : <Reply text={m.content} />}
                                    </div>
                                    {m.source && m.source !== 'guard' && <p className="text-[11px] text-muted mt-1 ml-1">{m.source === 'rules' ? 'Standard advisory' : `Answered by ${m.source === 'gemini' ? 'Gemini' : 'Llama on Groq'} from live readings`}</p>}
                                </motion.div>
                            ))}
                            {busy && <div className="bg-raised border border-line rounded-2xl rounded-bl-md w-fit"><Thinking /></div>}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); send(draft); }} className="p-3 border-t border-line flex gap-2">
                            <input ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000}
                                placeholder={region ? `Ask about ${region.region}’s air` : 'Loading the network…'} aria-label="Your question" className="field !rounded-full" />
                            <motion.button type="submit" disabled={!draft.trim() || busy} whileTap={{ scale: 0.9 }} aria-label="Send"
                                className="shrink-0 h-11 w-11 rounded-full bg-sulphur text-chlorophyll grid place-items-center disabled:opacity-40">
                                <ArrowUp size={20} />
                            </motion.button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
