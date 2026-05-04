/**
 * AdminQuizResult — port of admin/quiz_result/index.blade.php + preview.blade.php.
 * Left column lists participants; right column loads submission attempts as an accordion
 * with per-question correct/wrong indicators and quiz summary.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import NoData from '@/components/common/NoData';
import { useApi } from '@/hooks/useApi';
import { useSettings } from '@/contexts/SettingsContext';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function QuestionBlock({ index, question }) {
  const { translate } = useSettings();
  const userAnswers = Array.isArray(question.user_answer)
    ? question.user_answer
    : question.user_answer != null
      ? [question.user_answer]
      : [];
  const correct = question.is_correct;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-medium inline-flex items-center justify-center">
          {index + 1}
        </span>
        <div
          className="flex-1 text-sm text-gray-800"
          // question titles may contain HTML (blade used {!! !!})
          dangerouslySetInnerHTML={{ __html: question.title || question.question || '' }}
        />
        {correct === true && <i className="fi fi-br-check text-emerald-600" />}
        {correct === false && <i className="fi fi-br-cross-small text-rose-600" />}
      </div>

      {question.type === 'mcq' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-11">
          {(question.options || []).map((opt, oi) => {
            const label = typeof opt === 'string' ? opt : (opt.title || opt.option);
            const checked = userAnswers.includes(label) || opt.is_selected;
            return (
              <label key={oi} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                <input type="checkbox" disabled checked={Boolean(checked)} readOnly />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="flex gap-6 pl-11">
          {['true', 'false'].map((v) => (
            <label key={v} className="flex items-center gap-2 text-sm text-gray-700 capitalize">
              <input
                type="radio"
                disabled
                checked={String(userAnswers[0]).toLowerCase() === v}
                readOnly
              />
              <span>{translate(v === 'true' ? 'True' : 'False')}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'fill_blanks' && (
        <div className="pl-11">
          <input
            type="text"
            disabled
            value={userAnswers.join(', ')}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700"
          />
        </div>
      )}

      <p className="text-sm text-emerald-600 font-semibold capitalize mt-2 pl-11">
        {translate('Answer :')} {question.correct_answer || ''}
      </p>
    </div>
  );
}

export default function AdminQuizResult() {
  const { quizId } = useParams();
  const { translate } = useSettings();
  const { get } = useApi();

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [openAttempt, setOpenAttempt] = useState(null);

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/api/admin/quizzes/${quizId}/participants`);
      const data = res.data || res;
      setParticipants(data.participants || data || []);
    } catch {
      toast.error(translate('Failed to load participants'));
    } finally {
      setLoading(false);
    }
  }, [get, quizId, translate]);

  useEffect(() => { loadParticipants(); }, [loadParticipants]);

  const selectParticipant = async (userId) => {
    setSelectedId(userId);
    setAttempts([]);
    setOpenAttempt(null);
    setLoadingAttempts(true);
    try {
      const res = await get(`/api/admin/quizzes/${quizId}/participants/${userId}/submissions`);
      const data = res.data || res;
      const list = data.submissions || data || [];
      setAttempts(list);
      if (list.length > 0) setOpenAttempt(list[0].id);
    } catch {
      toast.error(translate('Failed to load submissions'));
    } finally {
      setLoadingAttempts(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg mb-4">
        <div className="px-5 py-3">
          <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <i className="fi-rr-settings-sliders" />
            {translate('Quiz Results')}
          </h4>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-lg p-4">
        {participants.length === 0 ? (
          <NoData />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 md:border-r md:border-gray-200 md:pr-4">
              <div className="space-y-1 min-h-[500px]">
                {participants.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectParticipant(p.id)}
                    className={`w-full text-left capitalize text-sm px-3 py-2 rounded-lg transition-colors ${
                      selectedId === p.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3">
              {!selectedId ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  {translate('Select a participant to view their results')}
                </p>
              ) : loadingAttempts ? (
                <LoadingSpinner />
              ) : attempts.length === 0 ? (
                <p className="text-sm text-gray-500 py-8 text-center">
                  {translate('No result available')}
                </p>
              ) : (
                <div className="space-y-2">
                  {attempts.map((attempt, idx) => {
                    const isOpen = openAttempt === attempt.id;
                    const passed =
                      attempt.passed
                      ?? (attempt.obtained_marks != null && attempt.pass_mark != null
                        ? attempt.obtained_marks >= attempt.pass_mark
                        : null);
                    return (
                      <div
                        key={attempt.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenAttempt(isOpen ? null : attempt.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium ${
                            isOpen ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="flex items-center gap-6">
                            <span>{translate('Attempt')} {idx + 1}</span>
                            <span className="text-gray-500 font-normal">
                              {formatDate(attempt.created_at || attempt.submitted_at)}
                            </span>
                          </span>
                          <i className={`fi-rr-angle-${isOpen ? 'up' : 'down'} text-xs`} />
                        </button>

                        {isOpen && (
                          <div className="px-4 py-4 border-t border-gray-100 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-gray-700">
                              <div className="space-y-1">
                                {attempt.duration && (
                                  <p>{translate('Duration :')} {attempt.duration}</p>
                                )}
                                {attempt.total_mark != null && (
                                  <p>{translate('Total Mark :')} {attempt.total_mark}</p>
                                )}
                                {attempt.pass_mark != null && (
                                  <p>{translate('Pass Mark :')} {attempt.pass_mark}</p>
                                )}
                              </div>
                              <div className="space-y-1">
                                {attempt.correct_count != null && (
                                  <p>{translate('Correct Answer :')} {attempt.correct_count}</p>
                                )}
                                {attempt.wrong_count != null && (
                                  <p>{translate('Wrong Answer :')} {attempt.wrong_count}</p>
                                )}
                                {attempt.obtained_marks != null && (
                                  <p>{translate('Obtained marks')} : {attempt.obtained_marks}</p>
                                )}
                                {passed !== null && (
                                  <p>
                                    {translate('Result :')}{' '}
                                    <span className={passed ? 'text-emerald-600' : 'text-rose-600'}>
                                      {passed ? translate('Passed') : translate('Failed')}
                                    </span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {(attempt.questions || []).map((q, qi) => (
                              <QuestionBlock key={qi} index={qi} question={q} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
