import { useEffect, useRef, useState } from 'react';

// Shared Export dropdown (PDF / Print, and optional CSV). PDF + Print both call
// window.print(); the @media print CSS in index.css renders only the element
// marked `print-area` (all columns except those marked `no-print`). Pass onCsv
// to add a "CSV (Excel)" item.
export default function ExportMenu({ onPdf, onPrint, onCsv, align = 'left' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const item = (icon, label, fn) => (
        <li>
            <button
                type="button"
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-dark hover:bg-gray-50"
                onClick={() => { setOpen(false); fn(); }}
            >
                <i className={icon} /> {label}
            </button>
        </li>
    );

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                className="ol-btn-light inline-flex items-center gap-2"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                Export
                <i className="fi-rr-file-export" />
            </button>
            {open && (
                <ul className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-20 mt-1 min-w-[160px] bg-white border border-border rounded-ol-8 shadow-lg py-1 text-[13px]`}>
                    {item('fi-rr-file-pdf', 'PDF', onPdf || (() => window.print()))}
                    {item('fi-rr-print', 'Print', onPrint || (() => window.print()))}
                    {onCsv && item('fi-rr-file-spreadsheet', 'CSV (Excel)', onCsv)}
                </ul>
            )}
        </div>
    );
}
