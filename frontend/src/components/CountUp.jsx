import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

// Rolls from the previous value to the new one, so live updates read as change, not a flicker.
export default function CountUp({ value, decimals = 0, duration = 1.1, className, style }) {
    const el = useRef();
    const from = useRef(0);

    useEffect(() => {
        if (value == null || !el.current) return;
        const controls = animate(from.current, value, {
            duration,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => {
                if (el.current) el.current.textContent = v.toFixed(decimals);
            },
        });
        from.current = value;
        return () => controls.stop();
    }, [value, decimals, duration]);

    return (
        <span ref={el} className={className} style={style}>
            {value == null ? '—' : (0).toFixed(decimals)}
        </span>
    );
}
