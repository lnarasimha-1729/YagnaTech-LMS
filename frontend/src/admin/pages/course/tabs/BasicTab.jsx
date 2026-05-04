import { useState } from 'react';

export default function BasicTab({ course, categories, onSave, formId }) {
    const [f, setF] = useState({
        title: course.title || '',
        short_description: course.short_description || '',
        description: course.description || '',
        category_id: course.category_id || '',
        level: course.level || 'beginner',
        language: course.language || 'english',
        // The screenshot offers only Active / Private. Treat everything else as the closer of the two.
        status: course.status === 'private' ? 'private' : 'active',
    });
    const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, v));
        fd.append('instructors[]', course.user_id || 1);
        onSave(fd);
    };

    return (
        <form id={formId} onSubmit={submit}>
            <Row label="Course title" required>
                <input
                    className="ol-form-control w-full"
                    value={f.title}
                    onChange={(e) => set('title', e.target.value)}
                    required
                />
            </Row>

            <Row label="Short Description">
                <textarea
                    className="ol-form-control w-full"
                    rows="3"
                    value={f.short_description}
                    onChange={(e) => set('short_description', e.target.value)}
                />
            </Row>

            <Row label="Description">
                <textarea
                    className="ol-form-control w-full"
                    rows="8"
                    value={f.description}
                    onChange={(e) => set('description', e.target.value)}
                />
            </Row>

            <Row label="Category" required>
                <select
                    className="ol-form-control w-full"
                    value={f.category_id}
                    onChange={(e) => set('category_id', e.target.value)}
                    required
                >
                    <option value="">Select</option>
                    {categories.flatMap((p) => [
                        <option key={p.id} value={p.id}>{p.title}</option>,
                        ...(p.childs?.map((c) => <option key={c.id} value={c.id}>-- {c.title}</option>) || []),
                    ])}
                </select>
            </Row>

            <Row label="Course level" required>
                <select
                    className="ol-form-control w-full"
                    value={f.level}
                    onChange={(e) => set('level', e.target.value)}
                    required
                >
                    <option value="everyone">Everyone</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
            </Row>

            <Row label="Made in" required>
                <select
                    className="ol-form-control w-full"
                    value={f.language}
                    onChange={(e) => set('language', e.target.value)}
                    required
                >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="telugu">Telugu</option>
                    <option value="tamil">Tamil</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                </select>
            </Row>

            <Row label="Create as" required>
                <div className="flex items-center gap-6 pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="status"
                            value="active"
                            checked={f.status === 'active'}
                            onChange={() => set('status', 'active')}
                            className="accent-skin"
                        />
                        <span className="text-[14px]">Active</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="status"
                            value="private"
                            checked={f.status === 'private'}
                            onChange={() => set('status', 'private')}
                            className="accent-skin"
                        />
                        <span className="text-[14px]">Private</span>
                    </label>
                </div>
            </Row>
        </form>
    );
}

function Row({ label, required, children }) {
    return (
        <div className="grid grid-cols-12 gap-4 mb-4 items-start">
            <label className="col-span-12 md:col-span-3 ol-form-label pt-2">
                {label}
                {required && <span className="text-danger ml-1">*</span>}
            </label>
            <div className="col-span-12 md:col-span-9">
                {children}
            </div>
        </div>
    );
}
