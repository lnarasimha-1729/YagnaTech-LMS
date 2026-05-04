const lessonRepo = require('../repositories/LessonRepository');
const questionRepo = require('../repositories/QuestionRepository');
const submissionRepo = require('../repositories/QuizSubmissionRepository');
const userRepo = require('../repositories/UserRepository');
const { HttpError } = require('../middlewares/error');

const validateDuration = (h, m, s) => {
    h = Number(h || 0); m = Number(m || 0); s = Number(s || 0);
    if (h > 23) return 'Hour must be at most 23';
    if (m > 59) return 'Minute must be at most 59';
    if (s > 59) return 'Second must be at most 59';
    if (h === 0 && m === 0 && s === 0) return 'Duration must be greater than 0';
    return null;
};

// ===== Quiz =====

const createQuiz = async (b) => {
    if (!b.title) throw new HttpError(422, 'Title is required');
    if (!b.section) throw new HttpError(422, 'Section is required');
    if (!b.total_mark || !b.pass_mark || !b.retake) throw new HttpError(422, 'Total mark, pass mark and retake are required');
    if (Number(b.pass_mark) > Number(b.total_mark)) throw new HttpError(422, 'Pass mark must be less than total mark');

    const dErr = validateDuration(b.hour, b.minute, b.second);
    if (dErr) throw new HttpError(422, dErr);

    const dup = await lessonRepo.findOne({ course_id: b.course_id, title: b.title });
    if (dup) throw new HttpError(422, 'Title has been taken.');

    const last = await lessonRepo.findLastSortInCourse(b.course_id);
    const quiz = await lessonRepo.create({
        title: b.title,
        course_id: b.course_id,
        section_id: b.section,
        total_mark: b.total_mark,
        pass_mark: b.pass_mark,
        retake: b.retake,
        description: b.description || null,
        lesson_type: 'quiz',
        status: 1,
        sort: (last ? last.sort : 0) + 1,
        duration: `${b.hour || 0}:${b.minute || 0}:${b.second || 0}`,
    });
    return { message: 'Quiz has been created.', quiz };
};

const updateQuiz = async (id, b) => {
    const quiz = await lessonRepo.findById(id);
    if (!quiz) throw new HttpError(404, 'Quiz not found');

    if (!b.title) throw new HttpError(422, 'Title is required');
    if (!b.section) throw new HttpError(422, 'Section is required');
    if (Number(b.pass_mark) > Number(b.total_mark)) throw new HttpError(422, 'Pass mark must be less than total mark');

    const dErr = validateDuration(b.hour, b.minute, b.second);
    if (dErr) throw new HttpError(422, dErr);

    const dup = await lessonRepo.findOne({ course_id: quiz.course_id, title: b.title });
    if (dup && dup.id !== quiz.id) throw new HttpError(422, 'Title has been taken.');

    await quiz.update({
        title: b.title,
        section_id: b.section,
        total_mark: b.total_mark,
        pass_mark: b.pass_mark,
        retake: b.retake,
        description: b.description || null,
        lesson_type: 'quiz',
        status: 1,
        duration: `${b.hour || 0}:${b.minute || 0}:${b.second || 0}`,
    });
    return { message: 'Quiz has been updated.', quiz };
};

const showQuiz = async (id) => {
    const quiz = await lessonRepo.findOne({ id, lesson_type: 'quiz' });
    if (!quiz) throw new HttpError(404, 'Quiz not found');
    const questions = await questionRepo.findByQuiz(quiz.id);
    return { quiz, questions };
};

// ===== Questions =====

const buildQuestionData = (b) => {
    let answer = null;
    let options = null;
    if (b.type === 'mcq') {
        answer = JSON.stringify(Array.isArray(b.answer) ? b.answer : [b.answer]);
        options = JSON.stringify(b.options || []);
    } else if (b.type === 'fill_blanks') {
        answer = JSON.stringify(Array.isArray(b.answer) ? b.answer : [b.answer]);
    } else if (b.type === 'true_false') {
        answer = String(b.answer);
    }
    return { quiz_id: b.quiz_id, title: b.title, type: b.type, answer, options };
};

const createQuestion = async (b) => {
    if (!b.title) throw new HttpError(422, 'Title is required');
    if (!b.type) throw new HttpError(422, 'Type is required');
    if (b.answer === undefined || b.answer === null || b.answer === '') throw new HttpError(422, 'Answer is required');
    if (b.type === 'mcq' && (!b.options || !b.options.length)) throw new HttpError(422, 'When type is MCQ, options are required.');

    const last = await questionRepo.findLastSort(b.quiz_id);
    const data = buildQuestionData(b);
    data.sort = (last ? last.sort : 0) + 1;
    const question = await questionRepo.create(data);
    return { message: 'Question has been added.', question };
};

const updateQuestion = async (id, b) => {
    const q = await questionRepo.findById(id);
    if (!q) throw new HttpError(404, 'Data not found.');
    if (!b.title) throw new HttpError(422, 'Title is required');
    if (b.type === 'mcq' && (!b.options || !b.options.length)) throw new HttpError(422, 'When type is MCQ, options are required.');
    await q.update(buildQuestionData(b));
    return { message: 'Question has been updated.', question: q };
};

const deleteQuestion = async (id) => {
    const q = await questionRepo.findById(id);
    if (!q) throw new HttpError(404, 'Data not found.');
    await q.destroy();
    return { message: 'Question has been deleted.' };
};

const sortQuestions = async (rawIds) => {
    const arr = Array.isArray(rawIds) ? rawIds : JSON.parse(rawIds);
    for (let i = 0; i < arr.length; i++) {
        await questionRepo.updateSort(arr[i], i + 1);
    }
    return { message: 'Questions has been sorted.' };
};

// ===== Quiz results =====

const participants = async (quiz_id) => {
    const subs = await submissionRepo.findByQuiz(quiz_id);
    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const users = await userRepo.findUsersByIds(userIds);
    return { participants: users };
};

const attempts = async (quiz_id, user_id) => {
    const items = await submissionRepo.findByQuizAndUser(quiz_id, user_id);
    return { attempts: items };
};

const attemptDetail = async (submission_id) => {
    const submission = await submissionRepo.findById(submission_id);
    if (!submission) throw new HttpError(404, 'Submission not found');
    const quiz = await lessonRepo.findById(submission.quiz_id);
    const questions = await questionRepo.findByQuiz(submission.quiz_id);
    return { submission, quiz, questions };
};

module.exports = {
    createQuiz,
    updateQuiz,
    showQuiz,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    sortQuestions,
    participants,
    attempts,
    attemptDetail,
};
