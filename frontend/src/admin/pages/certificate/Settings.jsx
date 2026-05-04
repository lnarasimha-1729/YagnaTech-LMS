import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE } from '../../api/client';
import { getCertificateSettings, uploadCertificateTemplate } from '../../api/certificate';
import { DEFAULT_BUILDER_CONTENT } from '../../utils/defaultCertificateTemplate';

/**
 * Certificate settings page — port of certificate-module's AdminCertificate.jsx.
 * Two-column layout: saved builder preview (left) + template upload form (right).
 *
 * The saved HTML's <img class="certificate-template"> src is patched client-side
 * so the preview reflects the uploaded image even before re-fetch (mirrors the
 * Laravel admin/certificate/index.blade.php inline preg_replace).
 */
export default function CertificateSettingsPage() {
    const [data, setData] = useState(null);
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const previewRef = useRef(null);

    const load = () =>
        getCertificateSettings()
            .then((s) => setData({
                ...s,
                certificate_builder_content: s.certificate_builder_content || DEFAULT_BUILDER_CONTENT,
            }))
            .catch(() => setData({ certificate_template: '', certificate_builder_content: DEFAULT_BUILDER_CONTENT }));

    useEffect(() => { load(); }, []);

    const templateSrc = data?.certificate_template ? `${API_BASE}/${data.certificate_template}` : '';

    const previewHtml = useMemo(() => {
        const html = data?.certificate_builder_content || '';
        return patchTemplateSrc(html, templateSrc);
    }, [data, templateSrc]);

    // Mirror the blade inline JS: zoom = ((wrapWidth / layoutWidth) * 100) - 8.
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
        try {
            const res = await uploadCertificateTemplate(file);
            toast.success(res.success || 'Certificate template has been updated');
            setFile(null);
            await load();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Upload failed');
        } finally {
            setSubmitting(false);
        }
    };

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-skin rounded-full animate-spin mb-3" />
                <p className="text-[14px]">Loading…</p>
            </div>
        );
    }

    return (
        <div>
            <div className="ol-card rounded-ol-8 mb-3">
                <div className="ol-card-body py-12px px-20px my-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[16px] font-semibold text-dark m-0 flex items-center gap-2">
                            <i className="fi-rr-settings-sliders" />
                            Certificate
                        </h4>
                        <Link to="/admin/certificates" className="ol-btn-outline-secondary">
                            View Issued
                        </Link>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <section className="ol-card p-4">
                    <p className="text-[14px] font-medium text-dark mb-3">Certificate template preview</p>
                    <div
                        ref={previewRef}
                        className="bg-white rounded-ol-8 border border-border min-h-[260px] p-3 overflow-hidden"
                        dangerouslySetInnerHTML={{
                            __html: previewHtml || '<p class="text-gray text-center py-8">No template yet — click "Build your certificate" to create one.</p>',
                        }}
                    />
                    <Link to="/admin/certificate/builder" className="ol-btn-primary mt-3 inline-flex">
                        Build your certificate
                    </Link>
                </section>

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
                                <p className="text-gray text-[13px]">No image uploaded yet.</p>
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

// Mirrors blade's preg_replace: rewrites only the certificate-template img.
function patchTemplateSrc(html, newSrc) {
    if (!html || !newSrc) return html;
    return html.replace(
        /(<img[^>]*class=["']certificate-template["'][^>]*src=["'])([^"']*)(["'])/gi,
        `$1${newSrc}$3`
    );
}
