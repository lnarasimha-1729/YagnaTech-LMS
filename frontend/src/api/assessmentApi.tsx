import axiosInstance from './axiosInstance';

// Assessment APIs
export const addAssessment = (assessmentData) => {
  return axiosInstance.post('/assessment/add', assessmentData);
};

import { Assessment } from "@/context/AssessmentContext";

export const getAllAssessments = () => {
  return axiosInstance.get<Assessment[]>("/assessment/all");  // ✅ add generic
};

export const getAssessment = (assessmentId: string) => {
  return axiosInstance.get<Assessment>(`/assessment/${assessmentId}`);
};


export const updateAssessment = (assessmentId, assessmentData) => {
  return axiosInstance.put(`/assessment/${assessmentId}`, assessmentData);
};

export const deleteAssessment = (assessmentId) => {
  return axiosInstance.delete(`/assessment/${assessmentId}`);
};

// QuestionSet APIs
export const addQuestionSet = (questionSetData) => {
  return axiosInstance.post('/assessment/question-set/add', questionSetData);
};

export const getAllQuestionSets = () => {
  return axiosInstance.get('/assessment/question-set/all');
};

export const getQuestionSet = (setId) => {
  return axiosInstance.get(`/assessment/question-set/${setId}`);
};

export const updateQuestionSet = (setId, questionSetData) => {
  return axiosInstance.put(`/assessment/question-set/${setId}`, questionSetData);
};

export const deleteQuestionSet = (setId) => {
  return axiosInstance.delete(`/assessment/question-set/${setId}`);
};

// Question APIs
export const addQuestion = (questionData) => {
  return axiosInstance.post('/assessment/question/add', questionData);
};

export const getAllQuestions = () => {
  return axiosInstance.get('/assessment/question/all');
};

export const getQuestion = (questionId) => {
  return axiosInstance.get(`/assessment/question/${questionId}`);
};

export const updateQuestion = (questionId, questionData) => {
  return axiosInstance.put(`/assessment/question/${questionId}`, questionData);
};

export const deleteQuestion = (questionId) => {
  return axiosInstance.delete(`/assessment/question/${questionId}`);
};