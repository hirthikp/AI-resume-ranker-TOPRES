export enum UserRole {
  MASTER_RECRUITER = "MASTER_RECRUITER",
  RECRUITER = "RECRUITER",
  CANDIDATE = "CANDIDATE",
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  password?: string;
}

export interface Resume {
  id: string;
  candidateId: string;
  candidateName: string;
  content: string;
  fileData?: string;
  fileName?: string;
  uploadDate: string;
  status: "Pending" | "Eligible" | "Ineligible";
  analysis?: DetailedAnalysis;
}

export interface JobDescription {
  title: string;
  content: string;
}

export interface DetailedAnalysis {
  atsScore: number;
  roleFit: number;
  experienceScore: number;
  skillScore: number;
  breakdown: {
    skills: number;
    experience: number;
    projects: number;
    education: number;
    clarity: number;
  };
  matchedSkillsPercent: number;
  missingSkillsPercent: number;
  summary: string;
  pros: string[];
  gaps: string[];
  parameterBreakdown?: string[];
  parameterScores?: Array<{
    name: string;
    score: number;
    weight: number;
    status: "selected" | "not_selected";
  }>;
  cultureLatentVector: string;
  lastUpdated: string;
  interviewQuestions?: {
    technical: string[];
    behavioral: string[];
  };
}

export interface SimilarityAnalysis {
  similarity_percentage: number;
  suspicion_score: number;
  risk_level: "Low" | "Medium" | "High";
  reasons: string[];
  candidatesInvolved?: string[];
}

export interface AnalysisState {
  stage: 1 | 2 | 3 | 4;
  isAnalyzing: boolean;
}
