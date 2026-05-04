import { createContext } from "react";

export interface College {
  clgId: string;
  clgName: string;
  // add other college fields as needed
}

export interface Branch {
  branchId: string;
  branchName: string;
}

export interface CollegeContextType {
  colleges: College[];
  branches: Branch[];
  loading: boolean;
  /** null when the last load succeeded; a friendly message when it failed. */
  error?: string | null;
  /** Manually re-trigger the colleges/branches fetch (e.g. from a Retry button). */
  refresh?: () => Promise<void>;
  addCollege: (data: Partial<College>) => Promise<unknown>;
  addBranch: (data: Partial<Branch>) => Promise<unknown>;
}

export const CollegeContext = createContext<CollegeContextType | undefined>(undefined);