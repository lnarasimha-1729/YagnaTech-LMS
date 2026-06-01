import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../../../api/client';

// Read-only view of the ratings students gave this course. Students submit
// ratings (one-time, after completing the course) from the course player; this
// tab just surfaces them for the admin. Data comes from the same public
// course-details endpoint the student detail page uses, so the aggregate and
// list stay in sync with what learners see.
export default function RateTab({ course }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!course?.slug) { setLoading(false); return; }
        let alive = true;
        setLoading(true);
        setError(null);
        axios
            .get(`${API_BASE}/api/public/course/${course.slug}`, { timeout: 15000 })
            .then((res) => { if (alive) setData(res.data); })
            .catch((e) => { if (alive) setError(e?.response?.data?.error || 'Failed to load ratings'); })
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [course?.slug]);

    if (loading) return <div className="py-10 text-center text-gray">Loading ratings…</div>;
    if (error) return <div className="py-10 text-center text-danger">{error}</div>;

    const reviews = data?.reviews || [];
    const avg = Number(data?.course?.average_rating || 0);
    const count = Number(data?.course?.review_count || 0);
    const stars = Math.round(avg);

    return (
        <div>
            <h6 className="text-[14px] font-semibold text-dark mb-3">Course Ratings</h6>

            <div className="flex items-center gap-3 mb-5">
                <span className="text-[32px] font-bold text-dark leading-none">{avg.toFixed(1)}</span>
                <div>
                    <div className="flex items-center gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <i key={i} className={`fa fa-star text-[14px] ${i < stars ? 'text-amber-400' : 'text-gray-300'}`} />
                        ))}
                    </div>
                    <p className="text-[12px] text-gray m-0 mt-1">
                        Based on {count} rating{count === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            {reviews.length === 0 ? (
                <p className="text-[13px] text-gray">No ratings yet. Students can rate this course after completing it.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {reviews.map((r) => (
                        <div key={r.id} className="border border-border rounded-ol-8 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[14px] font-semibold text-dark">{r.name}</span>
                                <div className="flex items-center gap-1">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <i key={i} className={`fa fa-star text-[12px] ${i < r.rating ? 'text-amber-400' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                            </div>
                            {r.review && <p className="text-[13px] text-gray m-0 mt-2 whitespace-pre-line">{r.review}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
