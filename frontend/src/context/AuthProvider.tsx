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
    // Profile photo so the navbar avatar can render it. admin-service returns
    // `photo`; keep instructor/student variants too for the shared navbar.
    photo: data.photo ?? undefined,
    instructorPhoto: data.instructorPhoto ?? undefined,
    studentPhoto: data.studentPhoto ?? undefined,
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
  photo?: string;
  instructorPhoto?: string;
  studentPhoto?: string;
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

  // Hydrate from saved admin token OR auth cookie on app load.
  //
  // IMPORTANT: when an admin_token exists, the ADMIN session is authoritative —
  // resolve it via adminMe() FIRST. Previously getProfile() (the auth-service
  // cookie) was tried first; a stale cookie left over from a prior root-admin
  // login on the same browser would resolve to the ROOT admin's identity even
  // though the person logged in as a college admin/instructor — so the sidebar
  // (from admin_user) was right but the navbar/profile (from user) showed the
  // wrong person.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      // 1. Admin/instructor/college-admin session (admin_token) takes priority.
      if (getAdminToken()) {
        try {
          const res = await adminMe();
          if (cancelled) return;
          const profile = normalizeAdminProfile(res);
          setUser(profile);
          const idForStorage = extractUserId(profile);
          if (idForStorage) localStorage.setItem("userId", String(idForStorage));
          // Store the unwrapped user (the shape AdminLayout.getStoredUser reads).
          localStorage.setItem("admin_user", JSON.stringify(res?.user ?? res));
          return;
        } catch {
          // admin_token invalid/expired — fall through to the auth cookie.
        } finally {
          if (!cancelled && getAdminToken()) setLoading(false);
        }
      }
      // 2. Otherwise, fall back to the auth-service cookie (students etc.).
      try {
        const res = await getProfile();
        if (cancelled) return;
        setUser(res.data);
        const idForStorage = extractUserId(res.data);
        if (idForStorage) localStorage.setItem("userId", String(idForStorage));
      } catch {
        /* not logged in — fine, render the public site */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual auth check - only call this when needed
  const checkAuth = async () => {
    setLoading(true);
    // Admin session (admin_token) is authoritative — resolve it first so a
    // stale auth cookie can't override the logged-in admin's identity.
    if (getAdminToken()) {
      try {
        const res = await adminMe();
        const profile = normalizeAdminProfile(res);
        setUser(profile);
        const idForStorage = extractUserId(profile);
        if (idForStorage) localStorage.setItem("userId", String(idForStorage));
        localStorage.setItem("admin_user", JSON.stringify(res?.user ?? res));
        setLoading(false);
        return;
      } catch {
        // admin_token invalid/expired — fall through to the auth cookie.
      }
    }
    try {
      const res = await getProfile();
      setUser(res.data);
      const idForStorage = extractUserId(res.data);
      if (idForStorage) localStorage.setItem("userId", String(idForStorage));
      return;
    } catch (err: unknown) {

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
      const loginRes = await login(credentials);

      // Persist the access token so axiosInstance's request interceptor can
      // attach it as a Bearer header on subsequent calls. Without this, only
      // the httpOnly cookie carries auth — which works for auth-service but
      // fails for cross-service routes (e.g. college-service /college/all)
      // where Bastion-forwarded cookies don't make it through, producing 401s
      // for the dropdowns on the profile page.
      const accessToken = loginRes.data?.accessToken;
      if (accessToken) localStorage.setItem("accessToken", accessToken);
      const refreshToken = loginRes.data?.refreshToken;
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      // Clear the admin session too, otherwise a stale admin_token/admin_user
      // from a prior login (e.g. root admin) leaks into the next person's
      // session on the same browser.
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
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