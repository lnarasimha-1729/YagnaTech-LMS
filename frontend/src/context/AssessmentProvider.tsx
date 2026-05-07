import { useState, useEffect, ReactNode } from "react";
import axiosInstance from "../api/axiosInstance";
import { AssessmentContext, AssessmentContextType, Assessment, QuestionSet, Question } from "./AssessmentContext";

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assessmentsRes, questionSetsRes, questionsRes] = await Promise.all([
          axiosInstance.get<Assessment[]>("/assessment/all"),
          axiosInstance.get<QuestionSet[]>("/assessment/question-set/all"),
          axiosInstance.get<Question[]>("/assessment/question/all")
        ]);
        
        setAssessments(assessmentsRes.data);
        setQuestionSets(questionSetsRes.data);
        setQuestions(questionsRes.data);
      } catch (error) {
        console.error("Failed to fetch assessment data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addAssessment = async (data: Partial<Assessment>): Promise<unknown> => {
    return axiosInstance.post("/assessment/add", data);
  };

  const contextValue: AssessmentContextType = {
    assessments,
    questionSets,
    questions,
    loading,
    addAssessment
  };

  return (
    <AssessmentContext.Provider value={contextValue}>
      {children}
    </AssessmentContext.Provider>
  );
};