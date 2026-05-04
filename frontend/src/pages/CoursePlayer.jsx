import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlayer, completeLesson, updateLessonProgress } from '@/api/course/courseApi';
import { safeObj } from '@/components/course/format';
import PlayerHeader from '@/components/course/player/PlayerHeader';
import PlayerSidebar from '@/components/course/player/PlayerSidebar';
import PlayerLesson from '@/components/course/player/PlayerLesson';
import PlayerTabs from '@/components/course/player/PlayerTabs';

const PLAY_BASE = '/courses/programs/course-details/play';

export default function CoursePlayer() {
    const { slug, lessonId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [marking, setMarking] = useState(false);
    const shellRef = useRef(null);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError(null);

        // Minimum-visible-time for the skeleton. On localhost getPlayer()
        // can resolve in ~50ms, which is faster than the human eye registers
        // a state change — the skeleton would flicker and the user would
        // perceive an abrupt jump. We hold the skeleton for at least 500ms
        // so the transition feels intentional. If the API takes longer than
        // 500ms, this delay is a no-op (the API is the slow path, not us).
        const MIN_SKELETON_MS = 500;
        const startedAt = Date.now();
        const finish = (fn) => {
            const elapsed = Date.now() - startedAt;
            const wait = Math.max(0, MIN_SKELETON_MS - elapsed);
            setTimeout(() => { if (alive) fn(); }, wait);
        };

        getPlayer(slug, lessonId)
            .then((res) => finish(() => { setData(res); setLoading(false); }))
            .catch((err) => finish(() => {
                if (err?.response?.status === 404) setError('Course not found.');
                else setError(err?.response?.data?.error || 'Failed to load player');
                setLoading(false);
            }));
        return () => { alive = false; };
    }, [slug, lessonId]);

    const onFullscreen = () => {
        const el = shellRef.current || document.documentElement;
        if (!document.fullscreenElement) el.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    const onMarkComplete = async () => {
        if (!data?.lesson || marking) return;
        setMarking(true);
        try {
            await completeLesson(data.course.id, data.lesson.id);
            // Refetch to update progress + locked-state for drip content.
            const fresh = await getPlayer(slug, data.lesson.id);
            setData(fresh);
        } catch (e) {
            console.warn(e);
        } finally {
            setMarking(false);
        }
    };

    // Latest playback time (in seconds) reported by the <video> element. For non-<video>
    // lesson types we fall back to wall-clock elapsed time since the lesson opened.
    const playbackTimeRef = useRef(0);
    const lessonOpenedAtRef = useRef(Date.now());

    const handleTimeUpdate = (t) => { playbackTimeRef.current = Number(t) || 0; };

    // Auto-tick: every 5s, post the latest playback position. The server applies the
    // 30%-of-duration rule and pushes the lesson into completed_lesson when reached.
    useEffect(() => {
        if (!data?.lesson) return;
        const VIDEO_TYPES = ['video-url', 'system-video', 'vimeo-url', 'html5', 'google_drive'];
        const lesson = data.lesson;
        if (!VIDEO_TYPES.includes(lesson.lesson_type)) return;

        playbackTimeRef.current = 0;
        lessonOpenedAtRef.current = Date.now();
        let lastReported = -1;
        let stopped = false;

        const interval = setInterval(async () => {
            if (stopped) return;
            const wallElapsed = Math.floor((Date.now() - lessonOpenedAtRef.current) / 1000);
            const playbackElapsed = Math.floor(playbackTimeRef.current);
            const current = Math.max(playbackElapsed, wallElapsed);
            // Round to nearest 5s tick (server bucket size) and skip duplicates.
            const tick = Math.floor(current / 5) * 5;
            if (tick <= 0 || tick === lastReported) return;
            lastReported = tick;

            try {
                const result = await updateLessonProgress(data.course.id, lesson.id, tick);
                if (result?.is_completed === 1 && !(data.history?.completed_lesson || []).includes(lesson.id)) {
                    const fresh = await getPlayer(slug, lesson.id);
                    if (!stopped) setData(fresh);
                }
            } catch (e) {
                console.warn('progress update failed:', e);
            }
        }, 5000);

        return () => { stopped = true; clearInterval(interval); };
    }, [data?.lesson?.id, slug]);

    const goRelative = (delta) => {
        if (!data) return;
        const flat = data.course.sections.flatMap((s) => s.lessons.map((l) => ({ section: s, lesson: l })));
        const idx = flat.findIndex((x) => x.lesson.id === data.lesson?.id);
        if (idx < 0) return;
        const next = flat[idx + delta];
        if (!next) return;
        navigate(`${PLAY_BASE}/${data.course.slug}/${next.lesson.id}`);
    };

    if (loading && !data) {
        // Fullscreen loading overlay — identical style to CourseDetails'
        // "Loading your course…" overlay, so the user sees one continuous
        // loading state from the click on the previous page through to
        // the player being ready. Min 500ms hold (set in the effect above)
        // ensures it's visibly there even when the API resolves in tens
        // of milliseconds on localhost.
        return (
            <div
                className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm"
                role="status"
                aria-live="polite"
            >
                <div className="w-12 h-12 border-4 border-[#177385] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-gray-700 font-medium">Loading your course…</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="player-shell flex flex-col items-center justify-center min-h-screen p-8 text-center">
                <p className="text-white text-[18px] font-semibold mb-2">{error}</p>
                <button onClick={() => navigate('/courses/programs')} className="ol-btn-primary mt-4">Back to courses</button>
            </div>
        );
    }
    if (!data) return null;

    const { course, lesson, history, locked_lesson_ids: lockedIds = [], progress, completed_lesson_count } = data;
    const completedIds = history.completed_lesson || [];
    const isCurrentLocked = lesson && lockedIds.includes(lesson.id);
    const dripSettings = safeObj(course.drip_content_settings);

    return (
        <div ref={shellRef} className="player-shell flex flex-col">
            <PlayerHeader course={course} onFullscreen={onFullscreen} />

            <section className="flex-1 py-5">
                <div className="player-container grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <PlayerLesson
                            lesson={lesson}
                            course={course}
                            locked={course.enable_drip_content === 1 && isCurrentLocked}
                            lockedMessage={dripSettings.locked_lesson_message}
                            onLessonEnded={onMarkComplete}
                            onTimeUpdate={handleTimeUpdate}
                        />

                        {lesson && !isCurrentLocked && (
                            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                                <div className="flex gap-2">
                                    <button type="button" className="ol-btn-outline" onClick={() => goRelative(-1)}>
                                        <i className="fa fa-arrow-left mr-2" /> Previous
                                    </button>
                                    <button type="button" className="ol-btn-outline" onClick={() => goRelative(1)}>
                                        Next <i className="fa fa-arrow-right ml-2" />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="ol-btn-primary"
                                    onClick={onMarkComplete}
                                    disabled={marking || completedIds.includes(lesson.id)}
                                >
                                    {completedIds.includes(lesson.id)
                                        ? <><i className="fa fa-check mr-2" />Completed</>
                                        : marking ? 'Saving…' : 'Mark as complete'}
                                </button>
                            </div>
                        )}

                        <PlayerTabs
                            course={course}
                            lesson={lesson}
                            progress={progress}
                            completedCount={completed_lesson_count}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <PlayerSidebar
                            course={course}
                            currentLessonId={lesson?.id}
                            completedIds={completedIds}
                            lockedIds={lockedIds}
                            progress={progress}
                            completedCount={completed_lesson_count}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

// Skeleton renders while the player payload is in flight. Mirrors the real
// CoursePlayer shell: dark header bar, large video block, action buttons,
// tab strip, and a lesson list on the right. Tones are picked from the
// existing player theme (slate/zinc-ish on a near-black background) so the
// skeleton blends with the real UI when it swaps in. `animate-pulse` is
// Tailwind's built-in 1.5s opacity wave — no extra CSS or libraries.
function PlayerSkeleton() {
    return (
        <div className="player-shell flex flex-col min-h-screen">
            {/* Header bar — matches PlayerHeader's height/spacing */}
            <header className="player-header">
                <div className="player-container">
                    <div className="player-header-row">
                        <div className="h-6 w-28 rounded bg-white/15 animate-pulse" />
                        <div className="h-5 w-1/3 rounded bg-white/10 animate-pulse hidden md:block" />
                        <div className="flex gap-3">
                            <div className="h-9 w-9 rounded bg-white/10 animate-pulse" />
                            <div className="h-9 w-28 rounded bg-white/10 animate-pulse" />
                        </div>
                    </div>
                </div>
            </header>

            <section className="flex-1 py-5">
                <div className="player-container grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main column: video + actions + tabs */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Video placeholder — 16:9 ratio so it matches the real player area. */}
                        <div className="aspect-video w-full rounded-lg bg-white/10 animate-pulse" />

                        {/* Lesson title line */}
                        <div className="h-6 w-2/3 rounded bg-white/12 animate-pulse" />

                        {/* Prev / Next + Mark complete row */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex gap-2">
                                <div className="h-9 w-24 rounded bg-white/10 animate-pulse" />
                                <div className="h-9 w-24 rounded bg-white/10 animate-pulse" />
                            </div>
                            <div className="h-9 w-40 rounded bg-skin/30 animate-pulse" />
                        </div>

                        {/* Tab strip + body — 3 short lines under the strip */}
                        <div className="space-y-3 pt-2">
                            <div className="flex gap-4 border-b border-white/10 pb-2">
                                {[60, 80, 70, 90].map((w, i) => (
                                    <div key={i} className="h-4 rounded bg-white/12 animate-pulse" style={{ width: w }} />
                                ))}
                            </div>
                            <div className="h-4 w-11/12 rounded bg-white/8 animate-pulse" />
                            <div className="h-4 w-5/6 rounded bg-white/8 animate-pulse" />
                            <div className="h-4 w-4/6 rounded bg-white/8 animate-pulse" />
                        </div>
                    </div>

                    {/* Right column: lesson list (PlayerSidebar) */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg border border-white/10 p-4 space-y-3">
                            <div className="h-5 w-1/2 rounded bg-white/12 animate-pulse" />
                            <div className="h-3 w-1/3 rounded bg-white/8 animate-pulse" />
                            {/* 6 lesson rows: small dot + title + meta */}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 pt-2">
                                    <div className="h-6 w-6 rounded-full bg-white/12 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3.5 rounded bg-white/12 animate-pulse" style={{ width: `${60 + (i * 7) % 30}%` }} />
                                        <div className="h-3 w-1/3 rounded bg-white/8 animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
