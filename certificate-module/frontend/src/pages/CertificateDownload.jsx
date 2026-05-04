import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { renderCertificate } from '../api/certificate';

export default function CertificateDownload() {
    const { identifier } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const captureRef = useRef(null);
    const previewRef = useRef(null);

    useEffect(() => {
        let alive = true;
        renderCertificate(identifier)
            .then((res) => { if (alive) setData(res); })
            .catch((err) => { if (alive) setError(err?.response?.data?.error || 'Certificate not found'); });
        return () => { alive = false; };
    }, [identifier]);

    // Mirror the Laravel inline JS — scale the preview canvas so it fits the visible area.
    useEffect(() => {
        if (!previewRef.current) return;
        const wrap = previewRef.current;
        const layout = wrap.querySelector('.certificate-layout-module');
        if (!layout) return;
        const wrapWidth = wrap.clientWidth;
        const layoutWidth = layout.clientWidth || 1;
        const scale = ((wrapWidth / layoutWidth) * 100) - 8;
        layout.style.zoom = `${scale}%`;
    }, [data]);

    const onDownload = async () => {
        if (!captureRef.current || busy) return;
        setBusy(true);
        try {
            // Wait a tick to ensure any image inside the certificate fully decoded.
            await new Promise((r) => setTimeout(r, 500));
            const target = captureRef.current.firstElementChild;
            if (!target) return;
            const canvas = await html2canvas(target, {
                allowTaint: true,
                useCORS: true,
                width: target.clientWidth,
                scale: 2,
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'certificate.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } finally {
            setBusy(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="ol-card p-8 text-center max-w-md">
                    <h2 className="text-[18px] font-semibold text-danger mb-2">{error}</h2>
                    <p className="text-muted text-[13px]">The certificate identifier in the URL could not be matched to any record.</p>
                </div>
            </div>
        );
    }
    if (!data) {
        return <div className="min-h-screen flex items-center justify-center text-muted">Loading certificate…</div>;
    }

    return (
        <div>
            {/* Hidden, full-fidelity capture target */}
            <div id="captureCertificate" ref={captureRef} style={{ position: 'absolute', left: '-99999px', top: 0 }}>
                <div dangerouslySetInnerHTML={{ __html: data.html }} />
            </div>

            {/* Visible preview (matches absolute-view in Laravel) */}
            <div className="absolute-view">
                <div ref={previewRef} className="cert-preview-wrap" dangerouslySetInnerHTML={{ __html: data.html }} />
            </div>

            <button type="button" onClick={onDownload} className="download-btn" disabled={busy}>
                {busy ? 'Preparing…' : 'Download'}
            </button>
        </div>
    );
}
