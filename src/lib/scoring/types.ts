export interface StructuredJobProfile {
  title: string;
  company: string;
  seniority: string;
  domain: string;
  responsibilities: string[];
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  tools: string[];
  keywords: string[];
  location?: string;
  inferredFields?: string[];
  extractionConfidence: number;
}

export interface CandidateProfileGraph {
  seniorityLevel: string;
  yearsExperience: number | null;
  domains: string[];
  skills: string[];
  tools: string[];
  achievements: string[];
  leadershipMarkers: string[];
  strongestEvidence: string[];
  gaps: string[];
  candidateType:
    | "executive"
    | "mid_senior_manager"
    | "senior_ic"
    | "early_career"
    | "career_switcher"
    | "domain_specialist";
}

export interface FitBreakdown {
  relatedness: number;
  preparedness: number;
  evidenceCoverage: number;
  atsFit: number;
  seniorityFit: number;
  domainFit: number;
  authenticityRisk: number;
  overallFit: number;
  mustHaveCoverage: number;
  seniorityGapLevels: number;
  guardrailPassed: boolean;
  guardrailReason?: string;
  explanation: string;
}

export const SENIORITY_LEVELS = [
  "intern",
  "entry",
  "mid",
  "senior",
  "staff",
  "principal",
  "director",
  "executive",
] as const;

export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

export function seniorityIndex(level: string): number {
  const normalized = level.toLowerCase();
  const idx = SENIORITY_LEVELS.findIndex((s) => normalized.includes(s));
  if (idx >= 0) return idx;
  if (/executive|vp|c-suite|chief/i.test(level)) return 7;
  if (/director|head of/i.test(level)) return 6;
  if (/principal|staff/i.test(level)) return 5;
  if (/senior|sr\./i.test(level)) return 3;
  if (/junior|entry|associate|early/i.test(level)) return 1;
  return 2;
}
