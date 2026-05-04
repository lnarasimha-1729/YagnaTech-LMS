import { useState } from 'react';

const API = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4000';

export default function MediaTab({ course, onSave, formId }) {
    const [provider, setProvider] = useState('file');
    const [link, setLink] = useState(course.preview || '');
    const [files, setFiles] = useState({});

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('title', course.title || '');
        fd.append('preview_video_provider', provider);
        if (provider === 'link') fd.append('preview_link', link);
        Object.entries(files).forEach(([k, f]) => f && fd.append(k, f));
        onSave(fd);
    };

    return (
        <form id={formId} onSubmit={submit} encType="multipart/form-data">
            <div className="mb-4">
                <label className="ol-form-label">Thumbnail</label>
                {course.thumbnail && <div className="mb-2"><img src={`${API}/${course.thumbnail}`} alt="" className="max-w-[200px] rounded-ol-8 border border-ebordermuted" /></div>}
                <input className="ol-form-control" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, thumbnail: e.target.files[0] })} />
            </div>
            <div className="mb-4">
                <label className="ol-form-label">Banner</label>
                {course.banner && <div className="mb-2"><img src={`${API}/${course.banner}`} alt="" className="max-w-[320px] rounded-ol-8 border border-ebordermuted" /></div>}
                <input className="ol-form-control" type="file" accept="image/*" onChange={(e) => setFiles({ ...files, banner: e.target.files[0] })} />
            </div>
            <div className="mb-3">
                <div className="grid grid-cols-12 gap-0">
                    <label className="col-span-2 ol-form-label">Preview video source</label>
                    <div className="col-span-10">
                        <select className="ol-form-control" value={provider} onChange={(e) => setProvider(e.target.value)}>
                            <option value="file">File upload</option>
                            <option value="link">Link (YouTube / Vimeo)</option>
                        </select>
                    </div>
                </div>
            </div>
            {provider === 'link' ? (
                <div className="mb-4">
                    <div className="grid grid-cols-12 gap-0">
                        <label className="col-span-2 ol-form-label">Preview URL</label>
                        <div className="col-span-10">
                            <input className="ol-form-control" value={link} onChange={(e) => setLink(e.target.value)} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-4">
                    <div className="grid grid-cols-12 gap-0">
                        <label className="col-span-2 ol-form-label">Preview file</label>
                        <div className="col-span-10">
                            <input className="ol-form-control" type="file" onChange={(e) => setFiles({ ...files, preview: e.target.files[0] })} />
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
}
