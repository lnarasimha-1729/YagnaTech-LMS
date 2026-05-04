import { useMemo, useState } from 'react';
import { safeObj } from '@/components/course/format';

export default function QuizPlayer({ lesson }) {
    const data = useMemo(() => safeObj(lesson.attachment), [lesson.attachment]);
    const questions = Array.isArray(data.questions) ? data.questions : [];
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    if (questions.length === 0) {
        return <div className="bg-white text-dark p-6">No questions configured for this quiz.</div>;
    }

    const score = submitted
        ? questions.reduce((s, q, i) => s + (answers[i] === q.answer ? 1 : 0), 0)
        : 0;

    const reset = () => { setAnswers({}); setSubmitted(false); };

    return (
        <div className="bg-white text-dark p-6">
            <h3 className="text-[20px] font-semibold mb-4">{lesson.title}</h3>
            <ol className="space-y-5 list-decimal pl-5">
                {questions.map((q, qi) => (
                    <li key={qi}>
                        <p className="font-medium mb-2">{q.q}</p>
                        <div className="space-y-2">
                            {q.options.map((opt, oi) => {
                                const isPicked = answers[qi] === oi;
                                const correct = submitted && oi === q.answer;
                                const wrong = submitted && isPicked && oi !== q.answer;
                                return (
                                    <label
                                        key={oi}
                                        className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-colors ${
                                            correct ? 'border-skin bg-lightgreen' :
                                            wrong ? 'border-danger bg-red-50' :
                                            isPicked ? 'border-skin' : 'border-border hover:border-skin'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${qi}`}
                                            checked={isPicked}
                                            disabled={submitted}
                                            onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                                            className="accent-skin"
                                        />
                                        <span>{opt}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </li>
                ))}
            </ol>
            <div className="mt-6 flex items-center gap-3">
                {!submitted ? (
                    <button
                        type="button"
                        className="ol-btn-primary"
                        disabled={Object.keys(answers).length !== questions.length}
                        onClick={() => setSubmitted(true)}
                    >
                        Submit
                    </button>
                ) : (
                    <>
                        <p className="font-semibold text-dark">
                            Score: {score} / {questions.length}
                        </p>
                        <button type="button" className="ol-btn-outline" onClick={reset}>Try again</button>
                    </>
                )}
            </div>
        </div>
    );
}
