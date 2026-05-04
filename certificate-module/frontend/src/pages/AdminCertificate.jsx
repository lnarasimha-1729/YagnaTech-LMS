import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api/client';
import { getSettings, uploadTemplate } from '../api/certificate';
import { DEFAULT_BUILDER_CONTENT } from '../utils/defaultTemplate';

// 1:1 port of resources/views/admin/certificate/index.blade.php
//   - Header card with sliders icon + "Certificate" title
//   - Two-column layout (Bootstrap col-md-6 → Tailwind md:grid-cols-2)
//   - Left: saved builder preview, scaled to fit via inline `zoom`
//     (mirrors the inline JS that runs on $(document).ready in the blade)
//   - Right: current template image preview + multipart upload form
//
// The blade's preg_replace that swaps the <img class="certificate-template" src=…>
// in the saved HTML so the preview shows the uploaded image is mirrored client-side
// here via patchTemplateSrc().

export default function AdminCertificate() {
    const [data, setData] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const previewRef = useRef(null);

    // If the backend is unreachable, populate the preview with the same
    // `.draggable` envelope the backend would seed so the page is never blank.
    const load = () =>
        getSettings()
            .then((s) => setData({
                ...s,
                certificate_builder_content: s.certificate_builder_content || DEFAULT_BUILDER_CONTENT,
            }))
            .catch(() => setData({ certificate_builder_content: DEFAULT_BUILDER_CONTENT }));

    useEffect(() => { load(); }, []);

    const templateSrc = data?.certificate_template ? `${API_BASE}/${data.certificate_template}` : '';

    const previewHtml = useMemo(() => {
        const html = data?.certificate_builder_content || '';
        return patchTemplateSrc(html, templateSrc);
    }, [data, templateSrc]);

    // Mirrors the blade's inline JS (lines 78-83):
    //   zoomScaleValue = ((wrapWidth / layoutWidth) * 100) - 8
    // Run after each preview change so the saved 900px canvas fits the panel.
    useEffect(() => {
        if (!previewRef.current) return;
        const wrap = previewRef.current;
        const layout = wrap.querySelector('.certificate-layout-module');
        if (!layout) return;
        const wrapWidth = wrap.clientWidth;
        const layoutWidth = layout.offsetWidth || 1;
        const scale = (wrapWidth / layoutWidth) * 100 - 8;
        layout.style.zoom = `${scale}%`;
    }, [previewHtml]);

    const onUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setSubmitting(true);
        setMessage(null);
        try {
            const res = await uploadTemplate(file);
            setMessage({ kind: 'success', text: res.success || 'Certificate template has been updated' });
            setFile(null);
            await load();
        } catch (err) {
            setMessage({ kind: 'error', text: err?.response?.data?.error || 'Upload failed' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!data) return <div className="text-muted">Loading…</div>;

    return (
        <div>
            {/* Header card (mirrors lines 20-29 of index.blade.php) */}
            <div className="ol-card mb-4">
                <div className="ol-card-body py-4 px-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fa fa-sliders" />
                            Certificate
                        </h4>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`mb-4 ${message.kind === 'success' ? 'alert-success' : 'alert-primary'}`}>
                    {message.text}
                </div>
            )}

            {/* Two columns (mirrors the .row > .col-md-6 layout, lines 31-71) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left card — builder preview */}
                <section className="ol-card p-4">
                    <p className="text-[14px] font-medium text-dark mb-3">Certificate template</p>
                    <div
                        id="certificate_builder_view"
                        ref={previewRef}
                        className="certificate_builder_view bg-white rounded-lg border border-border min-h-[260px] p-3 overflow-hidden"
                        dangerouslySetInnerHTML={{
                            __html:
                                previewHtml ||
                                '<p class="text-muted text-center py-8">No template yet — click "Build your certificate" to create one.</p>',
                        }}
                    />
                    <Link to="/admin/certificate/builder" className="ol-btn-primary mt-3">
                        Build your certificate
                    </Link>
                </section>

                {/* Right card — template upload (mirrors lines 51-70) */}
                <section className="ol-card p-4">
                    <p className="text-[14px] font-medium text-dark mb-3">Certificate template</p>
                    <form onSubmit={onUpload} encType="multipart/form-data">
                        <div className="mb-3">
                            {templateSrc ? (
                                <img
                                    src={templateSrc}
                                    alt=""
                                    className="my-2 rounded border border-border"
                                    style={{ height: 200 }}
                                />
                            ) : (
                                <p className="text-muted text-[13px]">No image uploaded yet.</p>
                            )}
                        </div>
                        <div className="mb-3">
                            <label className="ol-form-label" htmlFor="certificate_template">
                                Upload your certificate template
                            </label>
                            <input
                                id="certificate_template"
                                name="certificate_template"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files[0] || null)}
                                className="ol-form-control"
                            />
                        </div>
                        <button type="submit" className="ol-btn-primary" disabled={submitting || !file}>
                            {submitting ? 'Uploading…' : 'Upload'}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}

// Mirrors the blade's preg_replace (lines 40-44):
//   /(<img[^>]*class=["']certificate-template["'][^>]*src=["'])([^"']*)(["'])/i
function patchTemplateSrc(html, newSrc) {
    if (!html || !newSrc) return html;
    return html.replace(
        /(<img[^>]*class=["']certificate-template["'][^>]*src=["'])([^"']*)(["'])/gi,
        `$1${newSrc}$3`
    );
}
