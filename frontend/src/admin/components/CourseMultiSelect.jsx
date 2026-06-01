import { useEffect, useMemo, useRef, useState } from 'react';
import { listCourses } from '../api/course';
import { useCollege } from '@/hooks/useCollege';

// Multi-select course picker styled like CollegeMultiSelect / BatchMultiSelect:
// a clickable trigger that shows chosen courses as chips (with × to remove),
// plus a popover with a search input and a scrollable checkbox list.
//
// When one or more colleges are selected (`clgIds`), the list is GROUPED by
// college — a course that belongs to several selected colleges is shown under
// each college's header.
//
// Two selection contracts, chosen by the `pairs` prop:
//   pairs=false (default) — legacy flat contract. `value` is an array of course
//     id strings; ticking a course selects it across every college it shows
//     under. Used by AssessmentForm.
//   pairs=true — per-college contract. `value`/`onChange` use { courseId, clgId }
//     pairs so ticking a course under College A does NOT tick it under College
//     B even when both offer it. Used by ProgramForm.
//
// Props:
//   value     — array of course id strings (pairs=false) OR { courseId, clgId }
//               pairs (pairs=true)
//   onChange  — receives the next value in the same shape as `value`
//   pairs     — opt into the per-college pair contract (default false)
//   required  — show the red asterisk on the label (validation is caller's)
//   label     — defaults to 'Courses'
//   hideLabel — render without the internal label
//   clgIds    — optional array of clgId strings; when non-empty, only courses
//               whose clg_ids include at least one of these ids are listed,
//               grouped under each matching college's header
export default function CourseMultiSelect({
    value = [],
    onChange,
    pairs: pairMode = false,
    required = false,
    label = 'Courses',
    hideLabel = false,
    clgIds = [],
}) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const boxRef = useRef(null);

    // clgId → clgName so each row + chip can render "Course — College".
    const { colleges } = useCollege();
    const collegeNameById = useMemo(() => {
        const map = {};
        (colleges || []).forEach((c) => { map[c.clgId] = c.clgName; });
        return map;
    }, [colleges]);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);
        listCourses({})
            .then((r) => {
                if (!alive) return;
                const rows = Array.isArray(r?.courses?.data) ? r.courses.data : [];
                setCourses(rows);
            })
            .catch((e) => {
                if (alive) setError(
                    e?.response?.data?.error || e?.message || 'Failed to load courses',
                );
            })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onDocClick = (e) => {
            if (!boxRef.current) return;
            if (!boxRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    const pairKey = (courseId, clgId) => `${String(courseId)}:${String(clgId ?? '')}`;

    // Internal model is always pairs. In legacy (flat) mode the incoming value
    // is course id strings with no college dimension — those are tracked as a
    // set of selected course ids, and a checkbox is "checked" whenever its
    // course id is selected, regardless of which college group it's rendered in.
    const legacyIds = useMemo(
        () => (pairMode ? null : new Set((Array.isArray(value) ? value : []).map(String))),
        [value, pairMode],
    );

    // Pair-mode value normalised to { courseId:String, clgId:String }.
    const pairs = useMemo(
        () => (pairMode && Array.isArray(value)
            ? value.map((p) => ({ courseId: String(p.courseId), clgId: String(p.clgId ?? '') }))
            : []),
        [value, pairMode],
    );

    const selectedKeys = useMemo(
        () => (pairMode ? new Set(pairs.map((p) => pairKey(p.courseId, p.clgId))) : new Set()),
        [pairs, pairMode],
    );

    // Is a given course+college cell checked? Pair mode keys by both; legacy
    // mode keys only by course id (selection is shared across colleges).
    const isChecked = (courseId, clgId) =>
        pairMode ? selectedKeys.has(pairKey(courseId, clgId)) : legacyIds.has(String(courseId));

    const courseById = useMemo(() => {
        const map = {};
        courses.forEach((c) => { map[String(c.id)] = c; });
        return map;
    }, [courses]);

    // Scope by selected colleges if provided; else show everything.
    const scoped = useMemo(() => {
        if (!Array.isArray(clgIds) || clgIds.length === 0) return courses;
        const selected = new Set(clgIds.map(String));
        return courses.filter((c) => {
            const ids = Array.isArray(c.clg_ids) ? c.clg_ids : [];
            return ids.some((id) => selected.has(String(id)));
        });
    }, [courses, clgIds]);

    // Drop selections that no longer match the current scope. Pair mode prunes
    // by college + course membership; legacy mode prunes by course-in-scope
    // (matching the original flat behavior).
    useEffect(() => {
        if (pairMode) {
            if (pairs.length === 0) return;
            const selected = new Set((Array.isArray(clgIds) ? clgIds : []).map(String));
            const next = pairs.filter((p) => {
                if (selected.size > 0 && !selected.has(p.clgId)) return false;
                const course = courseById[p.courseId];
                if (!course) return true; // courses still loading — keep until known
                const ids = Array.isArray(course.clg_ids) ? course.clg_ids.map(String) : [];
                if (!p.clgId) return selected.size === 0;
                return ids.includes(p.clgId);
            });
            if (next.length !== pairs.length) onChange(next);
        } else {
            if (!legacyIds || legacyIds.size === 0) return;
            // Don't prune while courses are still loading — an edit form's
            // preselected courseIds would be wiped against an empty scope before
            // the list arrives, losing the saved selection.
            if (loading || courses.length === 0) return;
            const inScope = new Set(scoped.map((c) => String(c.id)));
            const next = [...legacyIds].filter((id) => inScope.has(id));
            if (next.length !== legacyIds.size) onChange(next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clgIds, courseById, scoped, loading]);

    const matchesSearch = (course) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return String(course.title || '').toLowerCase().includes(q);
    };

    // Filtered + grouped by college. Each course is emitted under each selected
    // college it belongs to. Group order follows the admin's college-pick order.
    // Search matches the course title OR the college name.
    const groupedFiltered = useMemo(() => {
        const selected = (Array.isArray(clgIds) ? clgIds : []).map(String);
        if (selected.length === 0) return [];
        const q = search.trim().toLowerCase();
        return selected
            .map((clgId) => {
                const clgName = collegeNameById[clgId] || clgId;
                const collegeMatches = clgName.toLowerCase().includes(q);
                const items = scoped.filter((c) => {
                    const ids = Array.isArray(c.clg_ids) ? c.clg_ids.map(String) : [];
                    if (!ids.includes(String(clgId))) return false;
                    return !q || matchesSearch(c) || collegeMatches;
                });
                return { clgId, clgName, items };
            })
            .filter((g) => g.items.length > 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoped, clgIds, collegeNameById, search]);

    // Flat (ungrouped) list used when no college is selected. Picks here carry
    // an empty clgId until the admin scopes by college.
    const flatFiltered = useMemo(() => {
        return scoped.filter(matchesSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scoped, search]);

    const toggle = (courseId, clgId) => {
        if (!pairMode) {
            const s = String(courseId);
            const next = legacyIds.has(s)
                ? [...legacyIds].filter((x) => x !== s)
                : [...legacyIds, s];
            onChange(next);
            return;
        }
        const key = pairKey(courseId, clgId);
        if (selectedKeys.has(key)) {
            onChange(pairs.filter((p) => pairKey(p.courseId, p.clgId) !== key));
        } else {
            onChange([...pairs, { courseId: String(courseId), clgId: String(clgId ?? '') }]);
        }
    };

    // Select/clear every course in one college group at once.
    const toggleGroup = (clgId, items) => {
        if (!pairMode) {
            const groupIds = items.map((c) => String(c.id));
            const allSelected = groupIds.every((id) => legacyIds.has(id));
            if (allSelected) {
                const drop = new Set(groupIds);
                onChange([...legacyIds].filter((id) => !drop.has(id)));
            } else {
                onChange([...new Set([...legacyIds, ...groupIds])]);
            }
            return;
        }
        const groupKeys = items.map((c) => pairKey(c.id, clgId));
        const allSelected = groupKeys.every((k) => selectedKeys.has(k));
        if (allSelected) {
            const drop = new Set(groupKeys);
            onChange(pairs.filter((p) => !drop.has(pairKey(p.courseId, p.clgId))));
        } else {
            const additions = items
                .filter((c) => !selectedKeys.has(pairKey(c.id, clgId)))
                .map((c) => ({ courseId: String(c.id), clgId: String(clgId) }));
            onChange([...pairs, ...additions]);
        }
    };

    const removePair = (courseId, clgId, e) => {
        e.stopPropagation();
        if (!pairMode) {
            const s = String(courseId);
            onChange([...legacyIds].filter((x) => x !== s));
            return;
        }
        const key = pairKey(courseId, clgId);
        onChange(pairs.filter((p) => pairKey(p.courseId, p.clgId) !== key));
    };

    // Chips shown in the trigger. Pair mode shows one chip per course+college;
    // legacy mode shows one chip per course (clgId blank).
    const selectedChips = useMemo(
        () => (pairMode
            ? pairs
            : [...(legacyIds || [])].map((id) => ({ courseId: id, clgId: '' }))),
        [pairMode, pairs, legacyIds],
    );

    const placeholder = clgIds.length > 0 && scoped.length === 0
        ? 'No courses available for the chosen college(s)'
        : 'Select courses…';

    const hasColleges = Array.isArray(clgIds) && clgIds.length > 0;

    return (
        <div>
            {!hideLabel && (
                <label className="ol-form-label">
                    {label}{required && <span className="text-danger ml-1">*</span>}
                </label>
            )}

            {loading ? (
                <div className="text-[13px] text-gray">Loading courses…</div>
            ) : error ? (
                <div className="text-[13px] text-danger">{error}</div>
            ) : courses.length === 0 ? (
                <div className="text-[13px] text-gray">
                    No courses available. Add a course first.
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
                        {selectedChips.length === 0 ? (
                            <span className="text-[14px] text-gray">{placeholder}</span>
                        ) : (
                            selectedChips.map((p) => {
                                const c = courseById[p.courseId];
                                const title = c ? c.title : `#${p.courseId}`;
                                const collegeLabel = p.clgId
                                    ? (collegeNameById[p.clgId] || p.clgId)
                                    : '';
                                return (
                                    <span
                                        key={pairKey(p.courseId, p.clgId)}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[13px]"
                                        onClick={(e) => e.stopPropagation()}
                                        title={collegeLabel ? `${title} · ${collegeLabel}` : title}
                                    >
                                        <span className="truncate max-w-[260px]">
                                            {title}
                                            {collegeLabel && (
                                                <span className="text-emerald-700/80"> — {collegeLabel}</span>
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => removePair(p.courseId, p.clgId, e)}
                                            className="text-emerald-700 hover:text-rose-600 font-bold leading-none"
                                            aria-label={`Remove ${title}`}
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
                                    placeholder="Search by course or college…"
                                    className="ol-form-control"
                                    autoFocus
                                />
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {hasColleges ? (
                                    groupedFiltered.length === 0 ? (
                                        <div className="px-3 py-2 text-[13px] text-gray">No matches.</div>
                                    ) : (
                                        groupedFiltered.map((group) => {
                                            const selectedInGroup = group.items
                                                .filter((c) => isChecked(c.id, group.clgId)).length;
                                            const allSelected = selectedInGroup === group.items.length && group.items.length > 0;
                                            const someSelected = selectedInGroup > 0 && !allSelected;
                                            return (
                                                <div key={group.clgId} className="border-b last:border-b-0">
                                                    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 sticky top-0">
                                                        <div className="text-[12px] font-semibold text-dark truncate" title={group.clgId}>
                                                            {group.clgName}
                                                            <span className="ml-2 text-[11px] font-normal text-gray">
                                                                {selectedInGroup}/{group.items.length}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="text-[12px] text-skin hover:underline whitespace-nowrap"
                                                            onClick={() => toggleGroup(group.clgId, group.items)}
                                                        >
                                                            {allSelected ? 'Clear all' : someSelected ? 'Select rest' : 'Select all'}
                                                        </button>
                                                    </div>
                                                    {group.items.map((c) => {
                                                        const checked = isChecked(c.id, group.clgId);
                                                        return (
                                                            <label
                                                                key={`${group.clgId}:${c.id}`}
                                                                className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={checked}
                                                                    onChange={() => toggle(c.id, group.clgId)}
                                                                    className="w-4 h-4 mt-0.5 accent-skin cursor-pointer"
                                                                />
                                                                <span className="text-[14px] font-medium text-dark truncate">
                                                                    {c.title}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    flatFiltered.length === 0 ? (
                                        <div className="px-3 py-2 text-[13px] text-gray">No matches.</div>
                                    ) : (
                                        <div className="divide-y">
                                            {flatFiltered.map((c) => {
                                                const checked = isChecked(c.id, '');
                                                return (
                                                    <label
                                                        key={c.id}
                                                        className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => toggle(c.id, '')}
                                                            className="w-4 h-4 mt-0.5 accent-skin cursor-pointer"
                                                        />
                                                        <span className="text-[14px] font-medium text-dark truncate">
                                                            {c.title}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {required && <input type="hidden" required value={selectedChips.length ? '1' : ''} readOnly />}
        </div>
    );
}
