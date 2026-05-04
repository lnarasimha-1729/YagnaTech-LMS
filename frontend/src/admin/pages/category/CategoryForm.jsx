import { useState } from 'react';

export default function CategoryForm({ initial = {}, parents = [], hiddenParentId, onSubmit }) {
    const [form, setForm] = useState({
        title: initial.title || '',
        icon: initial.icon || '',
        keywords: initial.keywords || '',
        description: initial.description || '',
        parent_id: initial.parent_id ?? 0,
    });
    const [files, setFiles] = useState({});

    const handle = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    const handleFile = (e) => setFiles((s) => ({ ...s, [e.target.name]: e.target.files[0] }));

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        const parentId = hiddenParentId !== undefined ? hiddenParentId : form.parent_id;
        if (parentId) fd.append('parent_id', parentId);
        fd.append('title', form.title);
        fd.append('icon', form.icon);
        fd.append('keywords', form.keywords);
        fd.append('description', form.description);
        if (files.thumbnail) fd.append('thumbnail', files.thumbnail);
        if (files.category_logo) fd.append('category_logo', files.category_logo);
        onSubmit(fd);
    };

    return (
        <form onSubmit={submit} encType="multipart/form-data">
            {hiddenParentId === undefined && parents.length > 0 && (
                <div className="mb-3">
                    <label className="ol-form-label">Parent category</label>
                    <select className="ol-form-control" name="parent_id" value={form.parent_id} onChange={handle}>
                        <option value="0">- Mark it as parent -</option>
                        {parents.map((p) => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                    </select>
                </div>
            )}
            <div className="grid grid-cols-1 gap-0">
                <div className="mb-3">
                    <label className="ol-form-label">Category Name<span className="text-danger ml-1">*</span></label>
                    <input className="ol-form-control" name="title" value={form.title} onChange={handle} placeholder="Enter your category name" required />
                </div>
                <div className="mb-3">
                    <label className="ol-form-label">Pick Your Icon</label>
                    <input className="ol-form-control" name="icon" value={form.icon} onChange={handle} placeholder="Pick your category icon" />
                </div>
                <div className="mb-3">
                    <label className="ol-form-label">Keywords <small className="text-muted font-normal">(optional)</small></label>
                    <input className="ol-form-control" name="keywords" value={form.keywords} onChange={handle} placeholder="Enter your Keywords" />
                </div>
                <div className="mb-3">
                    <label className="ol-form-label">Category Description <small className="text-muted font-normal">(optional)</small></label>
                    <textarea className="ol-form-control" name="description" value={form.description} onChange={handle} rows="4" placeholder="Enter your description" />
                </div>
                <div className="mb-3">
                    <label className="ol-form-label">Thumbnail <small className="text-muted font-normal">(optional)</small></label>
                    <input className="ol-form-control file:mr-3 file:rounded file:border-0 file:bg-lightgreen file:px-3 file:py-1.5 file:text-skin file:text-[13px]" type="file" name="thumbnail" accept="image/*" onChange={handleFile} />
                </div>
                <div className="mb-4">
                    <label className="ol-form-label">Category logo <small className="text-muted font-normal">(optional)</small></label>
                    <input className="ol-form-control file:mr-3 file:rounded file:border-0 file:bg-lightgreen file:px-3 file:py-1.5 file:text-skin file:text-[13px]" type="file" name="category_logo" accept="image/*" onChange={handleFile} />
                </div>
                <div>
                    <button className="ol-btn-primary">Submit</button>
                </div>
            </div>
        </form>
    );
}
