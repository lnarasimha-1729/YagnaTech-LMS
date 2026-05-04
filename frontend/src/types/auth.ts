export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  name: string;
  phone?: string;  // Make optional
  dob?: string;    // Make optional
  gender?: string; // Make optional
  role?: string;
};

export type User = {
  userId: string;
  id?: string; // Optional for backward compatibility
  email: string;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  role: string | null;
};

export type LoginResponseData = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

export type ProfileUpdateData = {
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
};

export type EducationData = {
  yearOfEducation?: string;
  yearOfStudy?: string;
  programInterested?: string;
};

export type OrgClgBranchData = {
  orgId?: string;
  collegeId?: string;
  branchId?: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};