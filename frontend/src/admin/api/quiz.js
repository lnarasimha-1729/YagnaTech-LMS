import api from './client';

export const storeQuiz = (data) => api.post('/quiz', data).then((r) => r.data);
export const updateQuiz = (id, data) => api.post(`/quiz/${id}`, data).then((r) => r.data);
export const getQuiz = (id) => api.get(`/quiz/${id}`).then((r) => r.data);

export const storeQuestion = (data) => api.post('/question', data).then((r) => r.data);
export const updateQuestion = (id, data) => api.post(`/question/${id}`, data).then((r) => r.data);
export const deleteQuestion = (id) => api.delete(`/question/${id}`).then((r) => r.data);
export const sortQuestions = (ids) => api.post('/question/sort', { itemJSON: ids }).then((r) => r.data);

export const quizParticipants = (quizId) => api.get(`/quiz/${quizId}/participants`).then((r) => r.data);
export const quizAttempts = (quizId, userId) => api.get(`/quiz/${quizId}/attempts/${userId}`).then((r) => r.data);
export const quizSubmission = (submissionId) => api.get(`/quiz-submission/${submissionId}`).then((r) => r.data);
