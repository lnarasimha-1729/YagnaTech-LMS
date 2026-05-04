import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LessonTypeIcon } from './PlayerLesson';

const PLAY_BASE = '/courses/programs/course-details/play';

export default function PlayerSidebar({ course, currentLessonId, completedIds, lockedIds, progress, completedCount }) {
    const [openSections, setOpenSections] = useState(() => {
        const m = {};
        course.sections.forEach((s) => {
            m[s.id] = s.lessons.some((l) => l.id === currentLessonId);
        });
        if (Object.values(m).every((v) => !v) && course.sections[0]) m[course.sections[0].id] = true;
        return m;
    });

    const toggle = (sid) => setOpenSections((m) => ({ ...m, [sid]: !m[sid] }));

    return (
        <aside className="bg-white border border-gray-200 rounded-xl overflow-hidden text-gray-900 shadow-[0_4px_40px_rgba(0,0,0,0.08)]">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-[15px] font-semibold mb-2 text-gray-900">Course curriculum</h2>
                <p className="text-[12px] text-gray-600 text-center">
                    {progress}% Completed ({completedCount}/{course.lesson_count})
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-skin transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>

            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                {course.sections.map((section) => {
                    const isOpen = openSections[section.id];
                    return (
                        <div key={section.id} className="border-b border-gray-200">
                            <button
                                type="button"
                                onClick={() => toggle(section.id)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-medium text-[14px] text-gray-900">{section.title}</span>
                                <i className={`fa fa-chevron-down text-[12px] text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOpen && (
                                <ul className="bg-gray-50">
                                    {section.lessons.map((lesson) => {
                                        const isCurrent = lesson.id === currentLessonId;
                                        const isCompleted = completedIds.includes(lesson.id);
                                        const isLocked = lockedIds.includes(lesson.id);

                                        return (
                                            <li key={lesson.id}>
                                                <Link
                                                    to={`${PLAY_BASE}/${course.slug}/${lesson.id}`}
                                                    className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                                                        isCurrent ? 'bg-skin/10 text-gray-900 border-l-2 border-skin' :
                                                        isLocked ? 'text-gray-400 cursor-not-allowed pointer-events-none' :
                                                        'text-gray-800 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                                        {isLocked ? (
                                                            <i className="fa fa-lock text-amber-500 text-[14px]" title="Locked" />
                                                        ) : isCompleted ? (
                                                            <span className="w-5 h-5 rounded-full bg-skin flex items-center justify-center" title="Completed">
                                                                <i className="fa fa-check text-white text-[10px]" />
                                                            </span>
                                                        ) : (
                                                            <span className="w-5 h-5 rounded-full border-2 border-gray-300" title="Not watched yet" />
                                                        )}
                                                    </span>
                                                    <span className="flex-1 truncate">{lesson.title}</span>
                                                    {lesson.duration && lesson.duration !== '00:00:00' && (
                                                        <span className="text-[11px] text-gray-500 flex-shrink-0">{lesson.duration}</span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}
