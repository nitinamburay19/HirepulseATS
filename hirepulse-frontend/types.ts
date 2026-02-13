export enum UserRole {
  ADMIN = 'ADMINISTRATOR',
  RECRUITER = 'RECRUITER',
  MANAGER = 'HIRING_MANAGER',
  CANDIDATE = 'CANDIDATE',
  GUEST = 'GUEST'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CandidateArtifact {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  status: 'APPLIED' | 'VETTING' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFER' | 'JOINED' | 'REJECTED';
  matchScore: number; // AI Score from 0-100
  appliedDate: string;
  skillDna: string[];
  currentCtc: number;
  expectedCtc: number;
  noticePeriod: number; // days
  totalExp: number;
  aadhaarStatus: 'VERIFIED' | 'PENDING' | 'MISSING';
  panStatus: 'VERIFIED' | 'PENDING' | 'MISSING';
  resumeContent: string;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  hiringManager: string;
  status: 'OPEN' | 'DRAFT' | 'FROZEN' | 'CLOSED';
  applicants: number;
  priority: 'URGENT' | 'NORMAL' | 'LOW';
  postedDate: string;
}

export interface DashboardStats {
  totalCandidates: number;
  activeJobs: number;
  offersReleased: number;
  hiringBudgetUsed: number; // Percentage
}

// Service Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
