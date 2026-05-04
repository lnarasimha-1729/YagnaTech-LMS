import { createContext } from "react";

export interface Assessment {
  preScore: null;
  assessmentId: string;
  type: string;
  setId: string;
  startAt: string | null;
  endAt: string | null;
  score: number;
  timer: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  QuestionSet: QuestionSet;
}


export interface QuestionSet {
  setId: string;
  setName: string;
  category: string;
  questions: string[];
  createdAt: string;
  updatedAt: string;
}


export interface Question {
  quesId: string;
  question: string;
  // add other fields as needed
}

export interface AssessmentContextType {
  assessments: Assessment[];
  questionSets: QuestionSet[];
  questions: Question[];
  loading: boolean;
  addAssessment: (data: Partial<Assessment>) => Promise<unknown>;
}

export const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);