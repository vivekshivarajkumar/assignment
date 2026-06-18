import { cosineSimilarity } from "../rag/embeddings";
import { chatJSON, hasAI } from "../ai/chat";
import type {
  CandidateProfileGraph,
  FitBreakdown,
  StructuredJobProfile,
} from "./types";
import { seniorityIndex } from "./types";

const GUARDRAIL = {
  minRelatedness: 35,
  minEvidenceCoverage: 30,
  minMustHaveCoverage: 25,
  maxSeniorityGap: 2,
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ");
}

function coverageScore(items: string[], haystack: string): number {
  if (items.length === 0) return 70;
  const lower = normalize(haystack);
  const matched = items.filter((item) =>
    lower.includes(normalize(item).trim())
  );
  return Math.round((matched.length / items.length) * 100);
}

function keywordInText(keyword: string, text: string): boolean {
  return normalize(text).includes(normalize(keyword).trim());
}

function textRelatedness(
  resumeContent: string,
  jobProfile: StructuredJobProfile
): number {
  const mustHave = coverageScore(jobProfile.mustHaveSkills, resumeContent);
  const keywords = coverageScore(jobProfile.keywords.slice(0, 8), resumeContent);
  const titleTokens = jobProfile.title
    .split(/[/\s,&-]+/)
    .filter((t) => t.length > 2);
  const titleHits = titleTokens.filter((t) =>
    keywordInText(t, resumeContent)
  ).length;
  const titleBonus =
    titleTokens.length > 0
      ? Math.round((titleHits / titleTokens.length) * 20)
      : 0;

  return Math.round(Math.min(100, mustHave * 0.65 + keywords * 0.25 + titleBonus));
}

export function computeFitBreakdown(
  resumeContent: string,
  resumeEmbedding: number[] | null,
  jobEmbedding: number[] | null,
  jobProfile: StructuredJobProfile,
  candidateProfile: CandidateProfileGraph
): FitBreakdown {
  const textScore = textRelatedness(resumeContent, jobProfile);

  let relatedness = textScore;
  if (
    resumeEmbedding &&
    jobEmbedding &&
    resumeEmbedding.length === jobEmbedding.length
  ) {
    const embeddingScore = Math.round(
      Math.max(0, cosineSimilarity(resumeEmbedding, jobEmbedding)) * 100
    );
    relatedness = Math.max(embeddingScore, textScore);
  }

  const mustHaveCoverage = coverageScore(
    jobProfile.mustHaveSkills,
    resumeContent
  );
  const niceHaveCoverage = coverageScore(
    jobProfile.niceToHaveSkills,
    resumeContent
  );
  const preparedness = Math.round(mustHaveCoverage * 0.7 + niceHaveCoverage * 0.3);

  const allRequirements = [
    ...jobProfile.mustHaveSkills,
    ...jobProfile.responsibilities.slice(0, 5),
  ];
  const evidenceCoverage = coverageScore(allRequirements, resumeContent);

  const atsKeywords = [
    ...jobProfile.keywords,
    ...jobProfile.tools,
    ...jobProfile.mustHaveSkills,
  ];
  const atsFit = coverageScore([...new Set(atsKeywords)], resumeContent);

  const jobSeniorityIdx = seniorityIndex(jobProfile.seniority);
  const candidateSeniorityIdx = seniorityIndex(candidateProfile.seniorityLevel);
  const seniorityGapLevels = Math.abs(jobSeniorityIdx - candidateSeniorityIdx);
  const seniorityFit = Math.max(0, 100 - seniorityGapLevels * 25);

  const domainFit = coverageScore(
    [jobProfile.domain, ...jobProfile.keywords.slice(0, 5)],
    [...candidateProfile.domains, resumeContent].join(" ")
  );

  const authenticityRisk = Math.max(
    0,
    Math.min(
      100,
      100 -
        evidenceCoverage +
        (mustHaveCoverage < 40 ? 20 : 0) +
        (seniorityGapLevels > 1 ? 15 : 0)
    )
  );

  const overallFit = Math.round(
    relatedness * 0.3 +
      preparedness * 0.25 +
      evidenceCoverage * 0.2 +
      atsFit * 0.1 +
      seniorityFit * 0.1 +
      domainFit * 0.05
  );

  const guardrailReasons: string[] = [];
  if (relatedness < GUARDRAIL.minRelatedness) {
    guardrailReasons.push(
      `Relatedness score (${relatedness}) is below ${GUARDRAIL.minRelatedness}.`
    );
  }
  if (evidenceCoverage < GUARDRAIL.minEvidenceCoverage) {
    guardrailReasons.push(
      `Evidence coverage (${evidenceCoverage}%) is below ${GUARDRAIL.minEvidenceCoverage}%.`
    );
  }
  if (mustHaveCoverage < GUARDRAIL.minMustHaveCoverage) {
    guardrailReasons.push(
      `Must-have skill coverage (${mustHaveCoverage}%) is below ${GUARDRAIL.minMustHaveCoverage}%.`
    );
  }
  if (seniorityGapLevels > GUARDRAIL.maxSeniorityGap) {
    guardrailReasons.push(
      `Seniority gap (${seniorityGapLevels} levels) exceeds ${GUARDRAIL.maxSeniorityGap}.`
    );
  }

  const guardrailPassed = guardrailReasons.length === 0;
  const explanation = buildExplanation(
    overallFit,
    relatedness,
    mustHaveCoverage,
    evidenceCoverage,
    guardrailPassed
  );

  return {
    relatedness,
    preparedness,
    evidenceCoverage,
    atsFit,
    seniorityFit,
    domainFit,
    authenticityRisk,
    overallFit,
    mustHaveCoverage,
    seniorityGapLevels,
    guardrailPassed,
    guardrailReason: guardrailReasons.join(" "),
    explanation,
  };
}

function buildExplanation(
  overall: number,
  relatedness: number,
  mustHave: number,
  evidence: number,
  passed: boolean
): string {
  if (!passed) {
    return `Your profile shows limited alignment with this role (overall fit ${overall}/100). Relatedness is ${relatedness}/100 with ${mustHave}% must-have skill coverage and ${evidence}% evidence coverage. We recommend building adjacent skills before tailoring your resume for this specific job.`;
  }
  if (overall >= 70) {
    return `Strong alignment (${overall}/100). Your background closely matches this role with solid evidence for key requirements. Tailoring can emphasize your strongest verified achievements.`;
  }
  return `Moderate alignment (${overall}/100). You have relevant experience but should strengthen evidence for ${100 - mustHave}% of must-have skills. Tailoring will highlight truthful overlaps only.`;
}

export function assertGuardrails(fit: FitBreakdown, jobTitle: string): void {
  if (fit.guardrailPassed) return;

  throw new Error(
    `I cannot ethically tailor your resume for "${jobTitle}" because ${fit.guardrailReason} ` +
      `I can help you explore adjacent roles, build a skill development path, and prepare for a future application when your profile is stronger.`
  );
}

export async function extractJobProfile(
  raw: {
    title: string;
    company: string;
    description: string;
    requirements?: string;
    location?: string;
  },
  sourceUrl?: string
): Promise<StructuredJobProfile> {
  const fallback = buildFallbackJobProfile(raw);

  if (!hasAI()) return fallback;

  try {
    const result = await chatJSON<StructuredJobProfile>(
      `You extract structured job profiles for a career copilot. Mark inferred fields in inferredFields array. Return valid JSON only. Never fabricate requirements not implied by the text.`,
      `Extract structured job profile from:
Title: ${raw.title}
Company: ${raw.company}
Location: ${raw.location || "Unknown"}
Description: ${raw.description.slice(0, 4000)}
Requirements: ${raw.requirements || "N/A"}
Source: ${sourceUrl || "manual"}

Return JSON:
{
  "title": string,
  "company": string,
  "seniority": string (intern|entry|mid|senior|staff|director|executive),
  "domain": string,
  "responsibilities": string[],
  "mustHaveSkills": string[],
  "niceToHaveSkills": string[],
  "tools": string[],
  "keywords": string[],
  "location": string,
  "inferredFields": string[],
  "extractionConfidence": number 0-100
}`
    );
    return { ...fallback, ...result };
  } catch {
    return fallback;
  }
}

function buildFallbackJobProfile(raw: {
  title: string;
  company: string;
  description: string;
  requirements?: string;
  location?: string;
}): StructuredJobProfile {
  const text = `${raw.description} ${raw.requirements || ""}`;
  const skills = text
    .match(/\b(?:JavaScript|TypeScript|Python|React|Node|AWS|SQL|Java|Go|Kubernetes|Docker|ML|AI|LLM|RAG)\b/gi)
    ?.map((s) => s.toLowerCase()) ?? [];

  return {
    title: raw.title,
    company: raw.company,
    seniority: /senior|sr/i.test(raw.title)
      ? "senior"
      : /junior|entry|associate/i.test(raw.title)
        ? "entry"
        : "mid",
    domain: "technology",
    responsibilities: raw.description.split(/[.!]\s+/).slice(0, 5),
    mustHaveSkills: [...new Set(skills)].slice(0, 8),
    niceToHaveSkills: [],
    tools: [...new Set(skills)].slice(0, 5),
    keywords: [...new Set(skills)],
    location: raw.location,
    extractionConfidence: 50,
  };
}

export function extractJobProfileLocal(raw: {
  title: string;
  company: string;
  description: string;
  requirements?: string;
  location?: string;
}): StructuredJobProfile {
  return buildFallbackJobProfile(raw);
}

export async function extractCandidateProfile(
  content: string,
  skills: string[]
): Promise<CandidateProfileGraph> {
  const fallback = extractCandidateProfileLocal(content, skills);

  if (!hasAI()) return fallback;

  try {
    const result = await chatJSON<CandidateProfileGraph>(
      `You parse resumes into candidate profile graphs. Only include evidence present in the resume. Return valid JSON.`,
      `Parse this resume:\n${content.slice(0, 5000)}

Return JSON with: seniorityLevel, yearsExperience, domains[], skills[], tools[], achievements[], leadershipMarkers[], strongestEvidence[], gaps[], candidateType (executive|mid_senior_manager|senior_ic|early_career|career_switcher|domain_specialist)`
    );
    return { ...fallback, ...result, skills: result.skills?.length ? result.skills : skills };
  } catch {
    return fallback;
  }
}

export function extractCandidateProfileLocal(
  content: string,
  skills: string[]
): CandidateProfileGraph {
  return {
    seniorityLevel: inferSeniority(content),
    yearsExperience: inferYears(content),
    domains: inferDomains(content),
    skills,
    tools: skills.filter((s) =>
      /react|node|python|aws|docker|sql|java|go/i.test(s)
    ),
    achievements: extractBullets(content).slice(0, 5),
    leadershipMarkers: /lead|manage|mentor|team/i.test(content)
      ? ["team leadership mentioned"]
      : [],
    strongestEvidence: extractBullets(content).slice(0, 3),
    gaps: [],
    candidateType: inferCandidateType(content),
  };
}

function inferSeniority(text: string): string {
  if (/director|vp|chief|executive/i.test(text)) return "executive";
  if (/senior|staff|principal/i.test(text)) return "senior";
  if (/junior|intern|entry|graduate/i.test(text)) return "entry";
  return "mid";
}

function inferYears(text: string): number | null {
  const m = text.match(/(\d+)\+?\s*years?/i);
  return m ? parseInt(m[1], 10) : null;
}

function inferDomains(text: string): string[] {
  const domains: string[] = [];
  if (/fintech|finance|bank/i.test(text)) domains.push("fintech");
  if (/health|medical|pharma/i.test(text)) domains.push("healthcare");
  if (/e-?commerce|retail/i.test(text)) domains.push("e-commerce");
  if (domains.length === 0) domains.push("technology");
  return domains;
}

function inferCandidateType(text: string): CandidateProfileGraph["candidateType"] {
  if (/director|vp|chief|c-suite/i.test(text)) return "executive";
  if (/manager|people lead/i.test(text)) return "mid_senior_manager";
  if (/intern|graduate|entry|junior/i.test(text)) return "early_career";
  if (/transition|switch|pivot/i.test(text)) return "career_switcher";
  if (/senior|staff|principal|architect/i.test(text)) return "senior_ic";
  return "domain_specialist";
}

function extractBullets(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 20)
    .slice(0, 8);
}
