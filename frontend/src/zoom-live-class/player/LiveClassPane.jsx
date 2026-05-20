import { useEffect, useRef, useState } from 'react';
import { listLiveClasses, resolveJoin, syncStatus } from './liveClassApi';

/**
 * Course-player "Live class" tab body. Replaces the inline placeholder in
 * PlayerTabs.jsx via a one-line import swap there.
 *
 * Matches the player tab visual conventions (white card with dark text — the
 * existing PlayerTabs body uses `text-gray-800` on a white card). Polls
 * /:id/status every 60s so the "Live now" badge flips automatically.
 */

const STATUS_POLL_MS = 60_000;

const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const StatusBadge = ({ status }) => {
    if (status === 'live' || status === 'started') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] uppercase font-semibold tracking-wide text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live now
            </span>
        );
    }
    if (status === 'completed' || status === 'finished') {
        return (
            <span className="text-[11px] uppercase tracking-wide text-gray-500">
                Completed
            </span>
        );
    }
    return (
        <span className="text-[11px] uppercase tracking-wide text-gray-600">
            Scheduled
        </span>
    );
};

export default function LiveClassPane({ course }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [joiningId, setJoiningId] = useState(null);
    const aliveRef = useRef(true);

    useEffect(() => {
        if (!course?.id) return undefined;
        aliveRef.current = true;
        setLoading(true);
        setError(null);
        listLiveClasses(course.id)
            .then((res) => { if (aliveRef.current) setItems(res.live_classes || []); })
            .catch((err) => {
                if (!aliveRef.current) return;
                setError(err?.response?.data?.error || 'Failed to load live classes');
            })
            .finally(() => { if (aliveRef.current) setLoading(false); });
        return () => { aliveRef.current = false; };
    }, [course?.id]);

    // Poll status for non-completed classes so the badge flips automatically.
    useEffect(() => {
        if (!items.length) return undefined;
        const trackable = items.filter((c) => c.status !== 'completed' && c.status !== 'finished');
        if (!trackable.length) return undefined;

        let cancelled = false;
        const tick = async () => {
            for (const lc of trackable) {
                try {
                    const r = await syncStatus(lc.id);
                    if (cancelled || !r?.status) continue;
                    setItems((prev) => prev.map((p) => (p.id === lc.id ? { ...p, status: r.status } : p)));
                } catch {
                    // Ignore — schedule-derived status remains.
                }
            }
        };
        tick();
        const handle = setInterval(tick, STATUS_POLL_MS);
        return () => { cancelled = true; clearInterval(handle); };
    }, [items.length]);

    const join = async (id) => {
        if (joiningId) return;
        setJoiningId(id);
        setError(null);
        try {
            const r = await resolveJoin(id);
            if (r.mode === 'redirect') {
                window.open(r.url, '_blank', 'noopener');
            } else if (r.mode === 'web-sdk') {
                window.open(
                    `/courses/programs/course-details/play/${course.slug}/live-class/${id}`,
                    '_blank',
                    'noopener'
                );
            } else {
                setError(r.reason || 'Live class is unavailable.');
            }
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to join the live class.');
        } finally {
            setJoiningId(null);
        }
    };

    if (loading) {
        return <p className="text-gray-500">Loading class schedule…</p>;
    }

    if (error && items.length === 0) {
        return <p className="text-red-600">{error}</p>;
    }

    return (
        <div className="text-gray-800">
            <h6 className="text-gray-700 text-[13px] uppercase tracking-wide mb-3">
                Class Schedules
            </h6>

            {items.length === 0 ? (
                <p className="text-gray-500">
                    No upcoming live classes are scheduled. Live sessions hosted by the
                    instructor will appear here.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead className="text-gray-500">
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2 pr-3">#</th>
                                <th className="text-left py-2 pr-3">Topic</th>
                                <th className="text-left py-2 pr-3">Date &amp; time</th>
                                <th className="text-left py-2 pr-3">Status</th>
                                <th className="text-left py-2 pr-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((lc, i) => {
                                const completed = lc.status === 'completed' || lc.status === 'finished';
                                const disabled = completed || joiningId === lc.id;
                                return (
                                    <tr key={lc.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-2 pr-3 text-gray-500">{i + 1}</td>
                                        <td className="py-2 pr-3">
                                            <div className="text-gray-900">{lc.class_topic}</div>
                                            {lc.host?.name && (
                                                <div className="text-[11px] text-gray-500">{lc.host.name}</div>
                                            )}
                                        </td>
                                        <td className="py-2 pr-3">{fmt(lc.class_date_and_time)}</td>
                                        <td className="py-2 pr-3"><StatusBadge status={lc.status} /></td>
                                        <td className="py-2 pr-3">
                                            <button
                                                type="button"
                                                onClick={() => join(lc.id)}
                                                disabled={disabled}
                                                className="ol-btn-primary inline-flex items-center disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={completed ? 'Class ended' : 'Join now'}
                                            >
                                                <i className="fa fa-video mr-1" />
                                                {joiningId === lc.id ? 'Joining…' : 'Join now'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {error && items.length > 0 && (
                <p className="text-red-600 text-[12px] mt-3">{error}</p>
            )}
        </div>
    );
}
