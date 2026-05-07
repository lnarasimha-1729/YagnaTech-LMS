
// context/AuthContext.ts
import { createContext } from 'react';

// api/authApi.ts - Update the User interface
export interface User {
  userId: string;
  email: string;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  role: string | null;
  
  // Add these optional fields for education and organization data
  yearOfEducation?: number;
  yearOfStudy?: number;
  programInterested?: string;
  orgId?: string;
  collegeId?: string;
  branchId?: string;
  
  // If your backend returns education as an object instead of individual fields:
  education?: {
    yearOfEducation?: number;
    yearOfStudy?: number;
    programInterested?: string;
    orgId?: string;
    collegeId?: string;
    branchId?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dob?: string;
  gender?: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginUser: (credentials: LoginCredentials) => Promise<void>;
  registerUser: (data: RegisterData) => Promise<void>;
  logoutUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);