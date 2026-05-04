import { useState } from 'react';

export default function SeoTab({ course, onSave, formId }) {
    const [f, setF] = useState({
        meta_title: '', meta_description: '', meta_keywords: '', meta_robot: 'index, follow',
        canonical_url: '', custom_url: '', json_ld: '', og_title: '', og_description: '',
    });
    const [ogImage, setOgImage] = useState(null);
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, v));
        if (ogImage) fd.append('og_image', ogImage);
        onSave(fd);
    };

    return (
        <form id={formId} onSubmit={submit} encType="multipart/form-data">
            <div className="mb-3">
                <label className="ol-form-label">Meta title</label>
                <input className="ol-form-control" value={f.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Meta description</label>
                <textarea className="ol-form-control" rows="3" value={f.meta_description} onChange={(e) => set('meta_description', e.target.value)} />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Meta keywords</label>
                <input className="ol-form-control" value={f.meta_keywords} onChange={(e) => set('meta_keywords', e.target.value)} placeholder="comma separated" />
            </div>
            <div className="mb-3 grid grid-cols-12 gap-3">
                <div className="col-span-6">
                    <label className="ol-form-label">Meta robot</label>
                    <input className="ol-form-control" value={f.meta_robot} onChange={(e) => set('meta_robot', e.target.value)} />
                </div>
                <div className="col-span-6">
                    <label className="ol-form-label">Canonical URL</label>
                    <input className="ol-form-control" value={f.canonical_url} onChange={(e) => set('canonical_url', e.target.value)} />
                </div>
            </div>
            <div className="mb-3">
                <label className="ol-form-label">Custom URL</label>
                <input className="ol-form-control" value={f.custom_url} onChange={(e) => set('custom_url', e.target.value)} />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">JSON-LD</label>
                <textarea className="ol-form-control" rows="3" value={f.json_ld} onChange={(e) => set('json_ld', e.target.value)} />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">OG title</label>
                <input className="ol-form-control" value={f.og_title} onChange={(e) => set('og_title', e.target.value)} />
            </div>
            <div className="mb-3">
                <label className="ol-form-label">OG description</label>
                <textarea className="ol-form-control" rows="3" value={f.og_description} onChange={(e) => set('og_description', e.target.value)} />
            </div>
            <div className="mb-4">
                <label className="ol-form-label">OG image</label>
                <input className="ol-form-control" type="file" accept="image/*" onChange={(e) => setOgImage(e.target.files[0])} />
            </div>
        </form>
    );
}
