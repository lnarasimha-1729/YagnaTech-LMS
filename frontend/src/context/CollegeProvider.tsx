import { useCallback, useEffect, useRef, useState, ReactNode } from "react";
import axiosInstance from "../api/axiosInstance";
import { CollegeContext, CollegeContextType, College, Branch } from "./CollegeContext";

/**
 * Lazy, resilient colleges/branches loader.
 *
 * Why this is structured the way it is:
 *
 * - The provider sits at the root of App.tsx so any descendant page can read
 *   `colleges` / `branches`. But pages like /login and the public landing
 *   pages don't need this data, and college-service is sometimes down in
 *   dev. Fetching eagerly meant every fresh page load fired a request that
 *   often 503'd and left the console full of errors — pure noise.
 *
 * - We now defer the fetch until something actually reads `colleges` or
 *   `branches`, and we don't infinitely retry: one quiet retry with
 *   backoff handles transient 503s (Bastion's stale "down" cache flips to
 *   "up" within seconds once college-service comes back). After that we
 *   expose the error so consumers can render an actionable message.
 *
 * - `refresh()` is exposed so a UI surface (e.g., the admin form's college
 *   dropdown) can offer a manual retry button without remounting the tree.
 */

const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const CollegeProvider = ({ children }: { children: ReactNode }) => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const [collegesRes, branchesRes] = await Promise.all([
          axiosInstance.get<College[]>("/college/all"),
          axiosInstance.get<Branch[]>("/college/branch/all"),
        ]);
        setColleges(Array.isArray(collegesRes.data) ? collegesRes.data : []);
        setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : []);
        setLoading(false);
        return;
      } catch (err) {
        lastErr = err;
        if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
      }
    }
    // Both attempts failed — record a friendly summary and stop quietly.
    const status =
      typeof lastErr === "object" && lastErr && "response" in lastErr
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lastErr as any).response?.status
        : null;
    setError(
      status === 503
        ? "College service is unavailable. Start backend/college-service and retry."
        : "Failed to load colleges. Check your network and retry."
    );
    setLoading(false);
  }, []);

  // Kick off the load once, on mount. Lazy + idempotent: if the fetch fails
  // it doesn't keep retrying forever, but a consumer can call refresh().
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetchData();
  }, [fetchData]);

  const addCollege = async (data: Partial<College>): Promise<unknown> => {
    const res = await axiosInstance.post("/college/add", data);
    // Optimistically refresh so consumers see the new row without remounting.
    fetchData();
    return res;
  };

  const addBranch = async (data: Partial<Branch>): Promise<unknown> => {
    const res = await axiosInstance.post("/college/branch/add", data);
    fetchData();
    return res;
  };

  const contextValue: CollegeContextType = {
    colleges,
    branches,
    loading,
    error,
    refresh: fetchData,
    addCollege,
    addBranch,
  };

  return (
    <CollegeContext.Provider value={contextValue}>
      {children}
    </CollegeContext.Provider>
  );
};
