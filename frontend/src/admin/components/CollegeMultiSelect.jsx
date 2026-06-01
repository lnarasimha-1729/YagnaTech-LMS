import { useEffect, useMemo, useRef, useState } from 'react';
import { useCollege } from '@/hooks/useCollege';
import { listCourses } from '../api/course';

// Reusable college multi-select. Drives the same chips-in-trigger + searchable
// dropdown UI Category uses, so course forms behave identically. Caller owns
// the selection state and submits it as `clgIds[]` on the form.
//
// Props:
//   value     — array of selected clgId strings
//   onChange  — receives the next array
//   required  — when true, shows the red asterisk (validation is the caller's)
//   courseIds — optional array of course ids; when non-empty, the visible
//               college list is narrowed to the INTERSECTION of clg_ids across
//               those courses (i.e. only colleges that offer every selected
//               course). Used by the assessment form where Course is picked
//               first and College scopes by it. Default (empty/undefined)
//               keeps the original "show every college" behavior.
export default function CollegeMultiSelect({
    value = [],
    onChange,
    required = false,
    label = 'Colleges',
    hideLabel = false,
    courseIds = [],
}) {
    const { colleges, loading, error, refresh } = useCollege();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const boxRef = useRef(null);

    // Only load courses when caller actually scopes by them — keeps this
    // component cheap for the dozens of forms that don't use the prop.
    const hasCourseScope = Array.isArray(courseIds) && courseIds.length > 0;
    const [coursesById, setCoursesById] = useState(null);
    useEffect(() => {
        if (!hasCourseScope) { setCoursesById(null); return; }
        let alive = true;
        listCourses({})
            .then((r) => {
                if (!alive) return;
                const rows = Array.isArray(r?.courses?.data) ? r.courses.data : [];
                const map = {};
                rows.forEach((c) => { map[String(c.id)] = c; });
                setCoursesById(map);
            })
            .catch(() => { if (alive) setCoursesById({}); });
        return () => { alive = false; };
    }, [hasCourseScope]);

    // Intersection of clg_ids across the selected courses. Empty set means
    // either courses are still loading or one of the selected courses has no
    // clg_ids — in both cases the dropdown shows zero colleges, which is the
    // honest answer (no college offers all of them).
    const allowedClgIds = useMemo(() => {
        if (!hasCourseScope) return null;
        if (!coursesById) return new Set(); // courses loading — render empty
        let acc = null;
        for (const cid of courseIds) {
            const course = coursesById[String(cid)];
            const ids = new Set((Array.isArray(course?.clg_ids) ? course.clg_ids : []).map(String));
            acc = acc == null ? ids : new Set([...acc].filter((id) => ids.has(id)));
            if (acc.size === 0) break;
        }
        return acc || new Set();
    }, [courseIds, coursesById, hasCourseScope]);

    // Drop selections that fall out of scope when courseIds changes. Skip while
    // the scoping courses are still loading (coursesById null) — otherwise an
    // edit form's preselected clgIds would be wiped against an empty allowed set
    // before the data arrives, losing the saved selection.
    useEffect(() => {
        if (!hasCourseScope || allowedClgIds == null) return;
        if (coursesById == null) return; // courses still loading — keep selection
        if (value.length === 0) return;
        const next = value.filter((id) => allowedClgIds.has(String(id)));
        if (next.length !== value.length) onChange(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedClgIds, coursesById]);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    // Pool the dropdown draws from. With course scope active, narrow to the
    // intersection set before search filtering kicks in.
    const scoped = useMemo(() => {
        if (!hasCourseScope || allowedClgIds == null) return colleges;
        return colleges.filter((c) => allowedClgIds.has(String(c.clgId)));
    }, [colleges, hasCourseScope, allowedClgIds]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return scoped;
        return scoped.filter(
            (c) => c.clgName.toLowerCase().includes(q) || c.clgId.toLowerCase().includes(q),
        );
    }, [scoped, search]);

    const toggle = (clgId) => {
        const next = value.includes(clgId)
            ? value.filter((x) => x !== clgId)
            : [...value, clgId];
        onChange(next);
    };

    return (
        <div>
            {!hideLabel && (
                <label className="ol-form-label">
                    {label}{required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            {loading ? (
                <div className="text-[13px] text-gray">Loading colleges…</div>
            ) : error ? (
                <div className="text-[13px] text-danger">
                    {error}{' '}
                    {refresh && (
                        <button type="button" onClick={() => refresh()} className="text-skin underline ml-1">
                            Retry
                        </button>
                    )}
                </div>
            ) : colleges.length === 0 ? (
                <div className="text-[13px] text-gray">
                    No colleges available. Add a college first.
                </div>
            ) : (
                <div className="relative" ref={boxRef}>
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpen((o) => !o)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setOpen((o) => !o);
                            }
                        }}
                        className="ol-form-control flex flex-wrap items-center gap-1.5 min-h-[42px] cursor-pointer"
                        aria-haspopup="listbox"
                        aria-expanded={open}
                    >
                        {value.length === 0 ? (
                            <span className="text-[14px] text-gray">
                                {hasCourseScope && scoped.length === 0
                                    ? 'No college offers every selected course'
                                    : 'Select colleges…'}
                            </span>
                        ) : (
                            value.map((id) => {
                                const match = colleges.find((c) => c.clgId === id);
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[13px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="truncate max-w-[180px]">
                                            {match ? match.clgName : id}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => toggle(id)}
                                            className="text-emerald-700 hover:text-rose-600 font-bold leading-none"
                                            aria-label={`Remove ${id}`}
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })
                        )}
                        <svg
                            className={`w-4 h-4 ml-auto text-gray transition-transform ${open ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>

                    {open && (
                        <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg">
                            <div className="p-2 border-b">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or ID…"
                                    className="ol-form-control"
                                />
                            </div>
                            <div className="max-h-56 overflow-y-auto divide-y">
                                {filtered.length === 0 ? (
                                    <div className="px-3 py-2 text-[13px] text-gray">No matches.</div>
                                ) : (
                                    filtered.map((c) => (
                                        <label
                                            key={c.clgId}
                                            className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={value.includes(c.clgId)}
                                                onChange={() => toggle(c.clgId)}
                                                className="w-4 h-4 mt-0.5 accent-skin cursor-pointer"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[14px] font-medium text-dark truncate">
                                                    {c.clgName}
                                                </span>
                                                <span className="text-[12px] font-mono text-gray">
                                                    ID: {c.clgId}
                                                </span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
