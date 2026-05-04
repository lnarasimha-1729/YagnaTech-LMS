import axiosInstance from "./axiosInstance";



// Define TypeScript interfaces
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
  // === Academic Information (all optional) ===
  educationLevel?: string;
  branch?: string;
  collegeName?: string;
  graduationYear?: string;
  collegeCode?: string;
}

// export interface User {
//   userId: string;
//   email: string;
//   name: string;
//   phone: string;
//   dob: string;
//   gender: string;
//   role: string | null;
// }

// In your authApi.ts - Update the User interface
export interface User {
  userId: string;
  email: string;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  role: string | null;
  
  // Add these optional fields
  yearOfEducation?: number;
  yearOfStudy?: number;
  programInterested?: string;
  orgId?: string;
  collegeId?: string;
  branchId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ProfileResponse {
  userId: string;
  email: string;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  role: string | null;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  dob?: string;
  // gender?: string;
}

export interface EducationData {
  yearOfEducation?: number;
  yearOfStudy?: number;
  programInterested?: string;
}

export interface OrgClgBranchData {
  orgId?: string;
  collegeId?: string;
  branchId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Add these interfaces
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// API functions with proper typing and corrected endpoints
export const login = async (data: LoginCredentials) => {
  const res = await axiosInstance.post<LoginResponse>("/auth/login", data);
  return res;
};

export const register = (data: RegisterData) => 
  axiosInstance.post<LoginResponse>("/auth/register", data);

export const getProfile = () => 
  axiosInstance.get<ProfileResponse>("/auth/profile");

export const updateProfile = (data: ProfileUpdateData) => 
  axiosInstance.put<ProfileResponse>("/auth/profile/update", data);

// ✅ FIXED: Correct endpoint paths
export const updateEducation = (data: EducationData) =>
  axiosInstance.put("/auth/profile/update/edu", data); // Changed from "/auth/education"

export const updateOrgClgBranch = (data: OrgClgBranchData) =>
  axiosInstance.put("/auth/profile/update/org-clg-branch", data); // Changed from "/auth/org-clg-branch"

export const updatePreScore = (data: {
  userId: string;
  assessmentId: string;
  preScore: number;
}) => {
  return axiosInstance.put("/auth/profile/prescore", data);
};

export const updatePostScore = (data: {
  userId: string;
  postScore: number;
}) => {
  return axiosInstance.put("/auth/profile/postscore", data);
};




// ✅ FIXED: Changed from PUT to POST to match backend
export const changePassword = (data: ChangePasswordData) =>
  axiosInstance.post("/auth/change-password", data); // Changed from PUT to POST

export const logout = () => 
  axiosInstance.post("/auth/logout");

// ✅ ADD: Refresh token endpoint
export const refreshToken = () =>
  axiosInstance.post<LoginResponse>("/auth/refresh");

// Add these functions
export const forgotPassword = (data: ForgotPasswordData) =>
  axiosInstance.post("/auth/forgot-password", data);

export const resetPassword = (data: ResetPasswordData) =>
  axiosInstance.post("/auth/reset-password", data);