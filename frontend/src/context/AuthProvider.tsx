// context/AuthProvider.tsx
import { useEffect, useState, ReactNode } from "react";
import { login, register, getProfile, logout } from "../api/authApi";
import { login as adminLogin, me as adminMe } from "../admin/api/auth";
import { getToken as getAdminToken } from "../admin/api/client";
import { AuthContext } from "./AuthContext";

// Profile responses come back with different id field names depending on the
// backend (auth-service uses userId, others use id or _id). Pick whichever exists.
const extractUserId = (profile: any): string | number | null =>
  profile?.userId ?? profile?.user_id ?? profile?.id ?? profile?._id ?? null;

// admin-service /auth/me wraps the user as { user: {...} }, while the legacy
// /auth/login on some paths returns the user fields at the top level. Accept
// either shape so the College Admin's college_id flows into AuthContext (and
// from there into ProtectedRoute / AdminLayout) regardless of which call
// hydrated the profile. Without this unwrap, college admins created by root
// were getting collegeId: null and never landing on the College Dashboard.
const normalizeAdminProfile = (raw: any) => {
  const data = raw?.user ?? raw ?? {};
  return {
    userId: String(data.userId ?? data.id ?? data._id ?? ""),
    email: data.email ?? "",
    name: data.name ?? "",
    phone: data.phone ?? "",
    dob: data.dob ?? "",
    gender: data.gender ?? "",
    role: data.role ?? "admin",
    collegeId: data.college_id ?? null,
    orgId: data.org_id ?? null,
    branchId: data.branch_id ?? null,
    yearOfEducation: data.yearOfEducation ?? data.year_of_education ?? undefined,
    yearOfStudy: data.yearOfStudy ?? data.year_of_study ?? undefined,
    programInterested: data.programInterested ?? data.program_interested ?? undefined,
  };
};

interface User {
  userId: string;
  id?: string;
  email: string;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  role: string | null;
  collegeId?: string;
  orgId?: string;
  branchId?: string;
  yearOfEducation?: string;
  yearOfStudy?: number;
  programInterested?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dob?: string;
  gender?: string;
  role?: string;
  // === Academic Information (all optional) ===
  educationLevel?: string;
  branch?: string;
  collegeName?: string;
  graduationYear?: string;
  collegeCode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginUser: (credentials: LoginCredentials) => Promise<User>;
  registerUser: (data: RegisterData) => Promise<void>;
  logoutUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Hydrate from cookie or saved admin token on app load.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getProfile();
        if (cancelled) return;
        setUser(res.data);
        const idForStorage = extractUserId(res.data);
        if (idForStorage) localStorage.setItem("userId", String(idForStorage));
        return;
      } catch {
        if (!getAdminToken()) return;
        try {
          const res = await adminMe();
          if (cancelled) return;
          const profile = normalizeAdminProfile(res);
          setUser(profile);
          const idForStorage = extractUserId(profile);
          if (idForStorage) localStorage.setItem("userId", String(idForStorage));
          // Store the unwrapped user (not the {user: ...} envelope) — that's
          // the shape AdminLayout's getStoredUser() reads to decide whether to
          // show the college-admin sidebar.
          localStorage.setItem("admin_user", JSON.stringify(res?.user ?? res));
        } catch {
          /* not logged in — fine, render the public site */
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual auth check - only call this when needed
  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      setUser(res.data);
      const idForStorage = extractUserId(res.data);
      if (idForStorage) localStorage.setItem("userId", String(idForStorage));
      return;
    } catch (err: unknown) {
      if (getAdminToken()) {
        try {
          const res = await adminMe();
          const profile = normalizeAdminProfile(res);
          setUser(profile);
          const idForStorage = extractUserId(profile);
          if (idForStorage) localStorage.setItem("userId", String(idForStorage));
          // Store the unwrapped user (not the {user: ...} envelope) — that's
          // the shape AdminLayout's getStoredUser() reads to decide whether to
          // show the college-admin sidebar.
          localStorage.setItem("admin_user", JSON.stringify(res?.user ?? res));
          return;
        } catch {
          // swallow and fall through to clear user
        }
      }

      // Silently handle 401 - normal when not logged in
      interface ErrorWithResponse {
        response?: {
          status?: number;
        };
      }

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as ErrorWithResponse).response?.status === "number" &&
        (err as ErrorWithResponse).response?.status !== 401
      ) {
        console.error("Auth check failed:", err);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      await login(credentials);

      // After auth-service login, fetch full profile
      const profileRes = await getProfile();
      const profile = profileRes.data as User;
      setUser(profile);
      const idForStorage = extractUserId(profile);
      if (idForStorage) localStorage.setItem("userId", String(idForStorage));
      return profile;
    } catch (err: unknown) {
      // If auth-service login fails, try admin-service login for root-created admins.
      try {
        const bridge = await adminLogin(credentials.email, credentials.password);
        const profile = normalizeAdminProfile(bridge.user);
        setUser(profile);
        const idForStorage = extractUserId(profile);
        if (idForStorage) localStorage.setItem("userId", String(idForStorage));
        return profile;
      } catch (adminErr) {
        setUser(null);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (data: RegisterData) => {
    try {
      setLoading(true);
      const res = await register(data);
      
      if (!res.data?.user) {
        throw new Error("Registration failed: user data missing");
      }
      
      setUser(res.data.user);
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      setLoading(true);
      await logout();
    } finally {
      setUser(null);
      localStorage.removeItem("userId");
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    loginUser,
    registerUser,
    logoutUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};