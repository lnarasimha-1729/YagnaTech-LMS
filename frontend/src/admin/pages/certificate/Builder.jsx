import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE } from '../../api/client';
import { getCertificateSettings, updateCertificateBuilder } from '../../api/certificate';
import { DEFAULT_BUILDER_CONTENT } from '../../utils/defaultCertificateTemplate';

/**
 * Certificate builder — port of certificate-module's CertificateBuilder.jsx.
 * Mirrors admin/certificate/builder.blade.php:
 *   - full-page dotted background
 *   - slide-in right sidebar
 *   - Available variable badges + new-element form (text / font / size)
 *   - Drag-to-position + remove on each element
 *   - Save POSTs the canvas DOM HTML back so the renderer keeps working unchanged
 */

const VARIABLES = [
    '{course_duration}', '{instructor_name}', '{student_name}', '{course_title}',
    '{number_of_lesson}', '{qr_code}', '{course_completion_date}',
    '{certificate_download_date}', '{course_level}', '{course_language}',
];

const FONT_FAMILIES = [
    { value: 'auto', label: 'Auto' },
    { value: 'Pinyon Script', label: 'Pinyon Script' },
];

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const rid = () => Math.random().toString(36).slice(2, 10);

export default function CertificateBuilderPage() {
    const nav = useNavigate();
    const [settings, setSettings] = useState(null);
    const [elements, setElements] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [open, setOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [newText, setNewText] = useState('');
    const [newFont, setNewFont] = useState('auto');
    const [newSize, setNewSize] = useState(16);

    const canvasRef = useRef(null);
    const dragRef = useRef(null);

    useEffect(() => {
        const init = (s) => {
            setSettings(s);
            const html = s.certificate_builder_content || DEFAULT_BUILDER_CONTENT;
            const parsed = parseElements(html);
            setElements(parsed.length ? parsed : parseElements(DEFAULT_BUILDER_CONTENT));
        };
        getCertificateSettings()
            .then(init)
            .catch(() => init({ certificate_template: '', certificate_builder_content: DEFAULT_BUILDER_CONTENT }));
    }, []);

    const onPointerDown = (e, el) => {
        if (e.target.classList.contains('remove-item')) return;
        e.preventDefault();
        setActiveId(el.id);
        const rect = canvasRef.current.getBoundingClientRect();
        dragRef.current = {
            id: el.id,
            offsetX: e.clientX - rect.left - el.x,
            offsetY: e.clientY - rect.top - el.y,
        };
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp, { once: true });
    };

    const onPointerMove = (e) => {
        const drag = dragRef.current;
        if (!drag || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(CANVAS_WIDTH - 40, e.clientX - rect.left - drag.offsetX));
        const y = Math.max(0, Math.min(CANVAS_HEIGHT - 20, e.clientY - rect.top - drag.offsetY));
        setElements((els) => els.map((el) => (el.id === drag.id ? { ...el, x, y } : el)));
    };

    const onPointerUp = () => {
        dragRef.current = null;
        document.removeEventListener('pointermove', onPointerMove);
    };

    const addElement = () => {
        const text = newText.trim();
        if (!text) return;
        setElements((els) => [
            ...els,
            { id: rid(), text, font_family: newFont, font_size: Number(newSize) || 16, x: 10, y: 10 },
        ]);
        setNewText('');
        setNewFont('auto');
        setNewSize(16);
    };

    const removeElement = (id) => {
        setElements((els) => els.filter((el) => el.id !== id));
        if (activeId === id) setActiveId(null);
    };

    const insertVariable = (variable) => {
        setNewText((t) => (t ? `${t} ${variable}` : variable));
    };

    const onSave = async () => {
        setSubmitting(true);
        try {
            const html = serializeElements(elements);
            const res = await updateCertificateBuilder(html);
            toast.success(res.success || 'Saved');
            setTimeout(() => nav('/admin/certificate'), 600);
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Save failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (!settings) return <div className="p-6 text-gray">Loading…</div>;

    const templateSrc = settings.certificate_template ? `${API_BASE}/${settings.certificate_template}` : '';

    return (
        <div className="cert-builder-page">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Italianno&family=Pinyon+Script&family=Miss+Fajardose&display=swap" />

            <button
                type="button"
                className="cert-builder-toggle"
                onClick={() => setOpen(true)}
                title="Open elements panel"
                aria-label="Open elements panel"
            >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M4 5C3.44772 5 3 5.44772 3 6C3 6.55228 3.44772 7 4 7H20C20.5523 7 21 6.55228 21 6C21 5.44772 20.5523 5 20 5H4ZM7 12C7 11.4477 7.44772 11 8 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13H8C7.44772 13 7 12.5523 7 12ZM13 18C13 17.4477 13.4477 17 14 17H20C20.5523 17 21 17.4477 21 18C21 18.5523 20.5523 19 20 19H14C13.4477 19 13 18.5523 13 18Z"
                        fill="#000"
                    />
                </svg>
            </button>

            <aside className={`cert-builder-sidebar ${open ? 'open' : ''}`}>
                <div className="cert-builder-sidebar-header">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        title="Close"
                        aria-label="Close panel"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#1f2733' }}
                    >
                        ×
                    </button>
                    <span>Certificate elements</span>
                    <button
                        type="button"
                        onClick={() => nav('/admin/certificate')}
                        style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#169f48', cursor: 'pointer', fontSize: 13 }}
                    >
                        Back
                    </button>
                </div>

                <div className="cert-builder-sidebar-body">
                    <div className="cert-builder-card">
                        <h6 className="cert-builder-card-title">Available Variable Data</h6>
                        <div>
                            {VARIABLES.map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    className="cert-var-badge"
                                    onClick={() => insertVariable(v)}
                                    title="Insert into the new-element textarea"
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="cert-builder-card">
                        <h6 className="cert-builder-card-title">Add a new element</h6>

                        <div style={{ marginBottom: 12 }}>
                            <label className="cert-builder-form-label" htmlFor="cert_elem_content">
                                Enter Text with variable data
                            </label>
                            <textarea
                                id="cert_elem_content"
                                className="cert-builder-form-control"
                                placeholder="Total Lesson:{number_of_lesson}"
                                rows="3"
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label className="cert-builder-form-label">Choice a font-family</label>
                            {FONT_FAMILIES.map((f) => (
                                <div key={f.value} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                    <input
                                        id={`font_family_${f.value}`}
                                        type="radio"
                                        name="font_family"
                                        value={f.value}
                                        checked={newFont === f.value}
                                        onChange={() => setNewFont(f.value)}
                                    />
                                    <label htmlFor={`font_family_${f.value}`} style={{ fontSize: 14, color: '#1f2733', cursor: 'pointer' }}>
                                        {f.label}
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label className="cert-builder-form-label" htmlFor="cert_font_size">Font Size</label>
                            <input
                                id="cert_font_size"
                                type="number"
                                className="cert-builder-form-control"
                                value={newSize}
                                min="8"
                                onChange={(e) => setNewSize(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <button type="button" className="cert-builder-btn-light" onClick={addElement} disabled={!newText.trim()}>
                                Add
                            </button>
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <button type="button" className="cert-builder-btn-primary" onClick={onSave} disabled={submitting}>
                                {submitting ? 'Saving…' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="cert-builder-canvas">
                <div
                    id="certificate-layout-module"
                    ref={canvasRef}
                    className="certificate-layout-module"
                    style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, marginRight: open ? 320 : 0, transition: 'margin-right .25s ease' }}
                    onPointerDown={() => setActiveId(null)}
                >
                    <img
                        className="certificate-template"
                        src={templateSrc}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, pointerEvents: 'none', display: templateSrc ? 'block' : 'none' }}
                    />
                    {elements.map((el) => (
                        <div
                            key={el.id}
                            className={`draggable ${activeId === el.id ? 'is-active' : ''}`}
                            style={renderElementStyle(el)}
                            onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e, el); }}
                        >
                            {renderElementContent(el)}
                            <button
                                type="button"
                                className="remove-item"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => removeElement(el.id)}
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ----------------- (de)serialization -----------------

function renderElementStyle(el) {
    const style = {
        left: el.x,
        top: el.y,
        fontSize: `${el.font_size || 16}px`,
    };
    if (el.font_family && el.font_family !== 'auto') style.fontFamily = `'${el.font_family}', cursive`;
    if (el.color) style.color = el.color;
    if (el.textAlign) style.textAlign = el.textAlign;
    if (el.letterSpacing) style.letterSpacing = el.letterSpacing;
    if (el.fontStyle) style.fontStyle = el.fontStyle;
    if (el.fontWeight) style.fontWeight = el.fontWeight;
    if (el.textTransform) style.textTransform = el.textTransform;
    return style;
}

function renderElementContent(el) {
    if (el.text === '{qr_code}') {
        return (
            <span style={{
                display: 'inline-block', width: 80, height: 80,
                border: '1px dashed #1fb6a6', borderRadius: 6,
                color: '#1fb6a6', fontSize: 11, textAlign: 'center', lineHeight: '80px',
            }}>
                {'{qr_code}'}
            </span>
        );
    }
    return <span>{el.text}</span>;
}

function serializeElements(elements) {
    const inner = elements.map((el) => {
        const styleParts = [
            'position:absolute',
            `left:${el.x}px`,
            `top:${el.y}px`,
            `font-size:${el.font_size || 16}px`,
            (el.font_family && el.font_family !== 'auto') ? `font-family:'${el.font_family}', cursive` : '',
            el.color ? `color:${el.color}` : '',
            el.textAlign ? `text-align:${el.textAlign}` : '',
            el.letterSpacing ? `letter-spacing:${el.letterSpacing}` : '',
            el.fontStyle ? `font-style:${el.fontStyle}` : '',
            el.fontWeight ? `font-weight:${el.fontWeight}` : '',
            el.textTransform ? `text-transform:${el.textTransform}` : '',
        ].filter(Boolean).join(';');
        const safe = String(el.text).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="draggable" style="${styleParts}">${safe}</div>`;
    }).join('');

    return `<div class="certificate-layout-module" style="position:relative;width:${CANVAS_WIDTH}px;height:${CANVAS_HEIGHT}px;background:#fff;font-family:'Roboto',sans-serif;">
    <img class="certificate-template" src="" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;" />
    ${inner}
</div>`;
}

function parseElements(html) {
    if (!html || typeof DOMParser === 'undefined') return [];
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const nodes = doc.querySelectorAll('.certificate-layout-module .draggable');
        const out = [];
        nodes.forEach((n) => {
            const text = n.textContent.trim();
            if (!text) return;
            const style = n.getAttribute('style') || '';
            const get = (k) => {
                const m = style.match(new RegExp(`${k}\\s*:\\s*([^;]+)`));
                return m ? m[1].trim() : null;
            };
            const ff = get('font-family');
            const ffClean = ff ? ff.replace(/['"]/g, '').split(',')[0].trim() : 'auto';
            const fs = parseInt(get('font-size') || '16', 10);
            const left = parseInt(get('left') || '0', 10);
            const top = parseInt(get('top') || '0', 10);
            out.push({
                id: rid(),
                text,
                font_family: ffClean || 'auto',
                font_size: Number.isFinite(fs) ? fs : 16,
                x: left,
                y: top,
                color: get('color') || undefined,
                textAlign: get('text-align') || undefined,
                fontStyle: get('font-style') || undefined,
                fontWeight: get('font-weight') || undefined,
                letterSpacing: get('letter-spacing') || undefined,
                textTransform: get('text-transform') || undefined,
            });
        });
        return out;
    } catch {
        return [];
    }
}
