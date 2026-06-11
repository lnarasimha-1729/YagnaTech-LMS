import { useEffect, useMemo, useState } from 'react';
import CollegeMultiSelect from '../../components/CollegeMultiSelect';
import CourseMultiSelect from '../../components/CourseMultiSelect';
import BatchMultiSelect from '../../components/BatchMultiSelect';
import { listCourses } from '../../api/course';
import { Globe2, GraduationCap, Building2, Rocket, BookOpen, Brain, Briefcase, Award } from 'lucide-react';

// Curated icon set to match the existing public ProgramCard renderer
// (frontend/src/components/programs/ProgramCard.tsx uses lucide-react). The
// stored value is the lucide name; the admin picks from rendered glyphs.
const ICON_OPTIONS = [
    { name: 'Globe2', Icon: Globe2 },
    { name: 'GraduationCap', Icon: GraduationCap },
    { name: 'Building2', Icon: Building2 },
    { name: 'Rocket', Icon: Rocket },
    { name: 'BookOpen', Icon: BookOpen },
    { name: 'Brain', Icon: Brain },
    { name: 'Briefcase', Icon: Briefcase },
    { name: 'Award', Icon: Award },
];

export default function ProgramForm({ initial = {}, onSubmit, submitting = false }) {
    const [form, setForm] = useState({
        title: initial.title || '',
        tagline: initial.tagline || '',
        icon: initial.icon || 'Globe2',
        sort: Number.isFinite(Number(initial.sort)) ? Number(initial.sort) : 0,
        is_active: initial.is_active === undefined ? true : !!initial.is_active,
    });
    const [features, setFeatures] = useState(
        Array.isArray(initial.features) && initial.features.length
            ? initial.features.map(String)
            : [''],
    );
    // Colleges the program is offered at. Multi-select mirrors the Course
    // form so the admin builds programs against the same college pool.
    const [selectedClgIds, setSelectedClgIds] = useState(
        Array.isArray(initial.clg_ids) ? initial.clg_ids.map(String) : [],
    );
    // Courses bundled into the program, scoped PER COLLEGE. Each pick is a
    // { courseId, clgId } pair so a course can be included for one college but
    // not another. Hydrate from course_clg_pairs (new column). For legacy rows
    // that only carry course_ids + clg_ids, seed the cross-product so editing a
    // pre-pairs row keeps every course visible under each of its colleges.
    const [coursePairs, setCoursePairs] = useState(() => {
        const raw = Array.isArray(initial.course_clg_pairs) ? initial.course_clg_pairs : [];
        if (raw.length) {
            return raw
                .map((p) => ({
                    courseId: String(p.courseId ?? p.course_id ?? ''),
                    clgId: String(p.clgId ?? p.clg_id ?? ''),
                }))
                .filter((p) => p.courseId);
        }
        // Legacy fallback: expand course_ids × clg_ids so old programs still
        // render their selections. The dropdown prunes pairs whose course
        // doesn't actually belong to a college once courses load.
        const legacyCourses = Array.isArray(initial.course_ids) && initial.course_ids.length
            ? initial.course_ids.map(String)
            : (initial.course_id ? [String(initial.course_id)] : []);
        const legacyClgs = Array.isArray(initial.clg_ids) ? initial.clg_ids.map(String) : [];
        if (!legacyCourses.length) return [];
        if (!legacyClgs.length) return legacyCourses.map((courseId) => ({ courseId, clgId: '' }));
        return legacyCourses.flatMap((courseId) =>
            legacyClgs.map((clgId) => ({ courseId, clgId })),
        );
    });
    // Batches scoped to selectedClgIds. BatchMultiSelect re-fetches when the
    // college set changes and prunes selections whose college is no longer
    // active, so no extra effect is needed here.
    const [selectedBatchIds, setSelectedBatchIds] = useState(
        Array.isArray(initial.batch_ids) ? initial.batch_ids.map(Number) : [],
    );

    // Pull every course's batch_ids once so we can union them per selection
    // and tell BatchMultiSelect which batches are linked to the chosen courses.
    // Best-effort: a fetch failure leaves the map empty, which falls through
    // to "no narrowing" (admin can still pick freely from the college batches).
    const [coursesById, setCoursesById] = useState({});
    useEffect(() => {
        let alive = true;
        listCourses({})
            .then((r) => {
                if (!alive) return;
                const rows = Array.isArray(r?.courses?.data) ? r.courses.data : [];
                const map = {};
                rows.forEach((c) => { map[String(c.id)] = c; });
                setCoursesById(map);
            })
            .catch(() => { /* best-effort — null map disables course-based narrowing */ });
        return () => { alive = false; };
    }, []);

    // Strict union of batch_ids across the admin's selected courses. Unlike
    // earlier behavior, this NEVER falls back to "all college batches" — the
    // flow is college → course → batch, so batches must come from the courses
    // themselves. Returns an empty Set when no course has batch_ids, which
    // BatchMultiSelect renders as "no batches available".
    // Distinct course ids across the per-college pairs — batch narrowing is
    // course-driven, not college-driven, so we union over the unique courses.
    const selectedCourseIds = useMemo(
        () => Array.from(new Set(coursePairs.map((p) => String(p.courseId)))),
        [coursePairs],
    );

    const allowedBatchIds = useMemo(() => {
        const union = new Set();
        for (const id of selectedCourseIds) {
            const course = coursesById[String(id)];
            const ids = Array.isArray(course?.batch_ids) ? course.batch_ids : [];
            ids.forEach((b) => union.add(Number(b)));
        }
        return union;
    }, [selectedCourseIds, coursesById]);

    const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

    const updateFeature = (i, value) => {
        setFeatures((arr) => arr.map((v, idx) => (idx === i ? value : v)));
    };
    const addFeature = () => setFeatures((arr) => [...arr, '']);
    const removeFeature = (i) => {
        setFeatures((arr) => (arr.length === 1 ? [''] : arr.filter((_, idx) => idx !== i)));
    };

    const submit = (e) => {
        e.preventDefault();
        const cleanedFeatures = features.map((f) => f.trim()).filter(Boolean);
        // Backend service reads `clgIds` (or `clgIds[]`) and dedupes; sending
        // the array directly is fine because the API client posts JSON.
        onSubmit({
            title: form.title.trim(),
            tagline: form.tagline.trim(),
            icon: form.icon,
            sort: Number(form.sort) || 0,
            is_active: form.is_active ? 1 : 0,
            features: cleanedFeatures,
            clgIds: selectedClgIds,
            // Per-college course selection. Backend derives course_ids (the
            // distinct union) from these for back-compat.
            coursePairs: coursePairs
                .filter((p) => p.courseId && p.clgId)
                .map((p) => ({ courseId: Number(p.courseId), clgId: p.clgId })),
            batchIds: selectedBatchIds,
        });
    };

    return (
        <form onSubmit={submit}>
            <div className="mb-3">
                <label className="ol-form-label">
                    Title<span className="text-danger ml-1">*</span>
                </label>
                <input
                    className="ol-form-control"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. AI Frontier Program"
                    required
                />
            </div>

            <div className="mb-3">
                <label className="ol-form-label">Tagline</label>
                <textarea
                    className="ol-form-control"
                    rows="2"
                    value={form.tagline}
                    onChange={(e) => set('tagline', e.target.value)}
                    placeholder="Short one-line description shown under the title"
                />
            </div>

            <div className="mb-3">
                <CollegeMultiSelect
                    value={selectedClgIds}
                    onChange={setSelectedClgIds}
                    required
                />
            </div>

            <div className="mb-3">
                <CourseMultiSelect
                    pairs
                    value={coursePairs}
                    onChange={setCoursePairs}
                    clgIds={selectedClgIds}
                    required
                />
            </div>

            <div className="mb-3">
                <BatchMultiSelect
                    clgIds={selectedClgIds}
                    value={selectedBatchIds}
                    onChange={setSelectedBatchIds}
                    allowedBatchIds={allowedBatchIds}
                    requireCourses
                    hasCourseSelection={selectedCourseIds.length > 0}
                />
            </div>

            <div className="grid grid-cols-12 gap-3 mb-3">
                <div className="col-span-12 md:col-span-8">
                    <label className="ol-form-label">Icon</label>
                    <div className="flex flex-wrap gap-2">
                        {ICON_OPTIONS.map(({ name, Icon }) => {
                            const selected = form.icon === name;
                            return (
                                <button
                                    key={name}
                                    type="button"
                                    title={name}
                                    onClick={() => set('icon', name)}
                                    className={`flex items-center justify-center w-11 h-11 rounded-ol-8 border transition-colors ${
                                        selected
                                            ? 'border-skin bg-lightgreen text-skin'
                                            : 'border-ebordermuted text-gray hover:border-skin hover:text-skin'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[12px] text-gray mt-1">
                        Pick the glyph shown above the program title on the public site.
                    </p>
                </div>
                <div className="col-span-12 md:col-span-4">
                    <label className="ol-form-label">Sort order</label>
                    <input
                        type="number"
                        className="ol-form-control"
                        value={form.sort}
                        onChange={(e) => set('sort', e.target.value)}
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="ol-form-label">Features</label>
                {features.map((value, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                        <input
                            className="ol-form-control flex-1"
                            value={value}
                            onChange={(e) => updateFeature(i, e.target.value)}
                            placeholder={`Feature ${i + 1}`}
                        />
                        <button
                            type="button"
                            className="text-gray hover:text-danger px-2 text-[18px] leading-none"
                            onClick={() => removeFeature(i)}
                            title="Remove"
                            aria-label={`Remove feature ${i + 1}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="ol-btn-light ol-btn-sm"
                    onClick={addFeature}
                >
                    + Add feature
                </button>
            </div>

            <div className="mb-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-4 h-4 accent-skin"
                        checked={form.is_active}
                        onChange={(e) => set('is_active', e.target.checked)}
                    />
                    <span className="text-[14px] text-dark">
                        Active (visible on public Programs page)
                    </span>
                </label>
            </div>

            <div className="text-right">
                <button type="submit" className="ol-btn-primary" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Save program'}
                </button>
            </div>
        </form>
    );
}
