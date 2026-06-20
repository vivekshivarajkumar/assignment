import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { chatComplete, hasAI } from "../ai/chat";
import { applyDemoJobFitBoost } from "../scoring/adjustments";
import {
  assertGuardrails,
  computeFitBreakdown,
  extractCandidateProfile,
  extractJobProfile,
  extractJobProfileLocal,
} from "../scoring/fit";
import { normalizeTailoredContent } from "@/lib/resume-markdown";
import type {
  CandidateProfileGraph,
  FitBreakdown,
  StructuredJobProfile,
} from "../scoring/types";
import { resolveFitEmbeddings } from "./matching";
import { coursesForSkills } from "@/lib/courses/catalog";

function parseJobProfile(job: schema.Job): StructuredJobProfile | null {
  if (!job.structuredProfile) return null;
  try {
    return JSON.parse(job.structuredProfile) as StructuredJobProfile;
  } catch {
    return null;
  }
}

function formatCandidateProfileForPrompt(
  candidateProfile: CandidateProfileGraph
): string {
  return [
    `Candidate type: ${candidateProfile.candidateType}`,
    `Seniority: ${candidateProfile.seniorityLevel}`,
    `Years experience: ${candidateProfile.yearsExperience ?? "unknown"}`,
    `Role types: ${(candidateProfile.roleTypes || []).join(", ") || "unknown"}`,
    `Target roles: ${(candidateProfile.targetRoles || []).join(", ") || "unknown"}`,
    `Domains: ${candidateProfile.domains.join(", ") || "unknown"}`,
    `Industries: ${(candidateProfile.industries || []).join(", ") || "unknown"}`,
    `Locations: ${(candidateProfile.locations || []).join(", ") || "India/unspecified"}`,
    `Skills: ${candidateProfile.skills.join(", ") || "unknown"}`,
    `Tools: ${candidateProfile.tools.join(", ") || "unknown"}`,
    `Education: ${(candidateProfile.education || []).join("; ") || "unknown"}`,
    `Certifications: ${(candidateProfile.certifications || []).join("; ") || "none found"}`,
    `Responsibilities: ${(candidateProfile.responsibilities || []).join("; ") || "unknown"}`,
    `Seniority signals: ${(candidateProfile.senioritySignals || []).join("; ") || "none found"}`,
    `Domain evidence: ${(candidateProfile.domainEvidence || []).join("; ") || "none found"}`,
    `Achievements: ${candidateProfile.achievements.join("; ") || "none found"}`,
    `Leadership markers: ${candidateProfile.leadershipMarkers.join("; ") || "none found"}`,
    `Strongest evidence: ${candidateProfile.strongestEvidence.join("; ") || "none found"}`,
    `Profile keywords: ${(candidateProfile.profileKeywords || []).join(", ") || "unknown"}`,
  ].join("\n");
}

type ResumeTemplateId =
  | "executive-impact"
  | "data-ai-leadership"
  | "technical-specialist"
  | "early-career";

const RESUME_TEMPLATES: Record<
  ResumeTemplateId,
  { name: string; bestFor: string; structure: string; tone: string }
> = {
  "executive-impact": {
    name: "Executive Impact",
    bestFor: "Director, Head, VP, CXO, and senior leadership roles",
    tone:
      "Board-ready, strategic, commercially aware, concise, and outcome-led.",
    structure:
      "# Name\nContact line\n\n## Executive Summary\n## Leadership Impact\n## Core Competencies\n## Professional Experience\n### Role | Company | Location | Dates\n- Strategy, scale, stakeholders, transformation, or growth impact.\n## Education\n## Certifications",
  },
  "data-ai-leadership": {
    name: "Data and AI Leadership",
    bestFor:
      "Data Science, AI/ML, MLOps, Analytics, GenAI, and data leadership roles",
    tone:
      "Sharp, evidence-led, business-impact oriented, with enough technical depth to feel credible.",
    structure:
      "# Name\nContact line\n\n## Profile\n## Data, AI, and Analytics Leadership\n## Technical Stack\n## Professional Experience\n### Role | Company | Location | Dates\n- Data/AI initiative, method/tool, business outcome, and stakeholder impact.\n## Selected AI/Data Projects\n## Education\n## Certifications",
  },
  "technical-specialist": {
    name: "Technical Specialist",
    bestFor: "Engineer, IC, architect, data engineer, ML engineer, and specialist roles",
    tone:
      "Precise, implementation-focused, technically credible, and metric-aware.",
    structure:
      "# Name\nContact line\n\n## Technical Summary\n## Technical Skills\n## Professional Experience\n### Role | Company | Location | Dates\n- Problem, technology, implementation, result.\n## Projects\n## Education\n## Certifications",
  },
  "early-career": {
    name: "Early Career",
    bestFor: "Entry-level, associate, analyst, intern, and junior roles",
    tone:
      "Specific, credible, energetic, project-focused, and careful not to overstate seniority.",
    structure:
      "# Name\nContact line\n\n## Summary\n## Skills\n## Projects\n## Experience\n## Education\n## Certifications",
  },
};

function chooseResumeTemplate(
  job: schema.Job,
  jobProfile: StructuredJobProfile,
  candidateProfile: CandidateProfileGraph
): ResumeTemplateId {
  const haystack = [
    job.title,
    jobProfile.domain,
    jobProfile.seniority,
    candidateProfile.seniorityLevel,
    candidateProfile.candidateType,
    ...(candidateProfile.domains || []),
    ...(candidateProfile.roleTypes || []),
    ...(candidateProfile.skills || []),
    ...(candidateProfile.tools || []),
  ]
    .join(" ")
    .toLowerCase();

  if (/intern|entry|junior|associate|fresher/.test(haystack)) {
    return "early-career";
  }
  if (/director|head|vp|vice president|chief|cxo|executive/.test(haystack)) {
    return /data|ai|ml|machine learning|analytics|genai|llm|mlops/.test(haystack)
      ? "data-ai-leadership"
      : "executive-impact";
  }
  if (/data|ai|ml|machine learning|analytics|genai|llm|mlops/.test(haystack)) {
    return "data-ai-leadership";
  }
  return "technical-specialist";
}

async function getProfiles(resumeId: string, jobId: string) {
  const db = getDb();
  const [resume] = await db
    .select()
    .from(schema.resumes)
    .where(eq(schema.resumes.id, resumeId))
    .limit(1);
  const [job] = await db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.id, jobId))
    .limit(1);
  if (!resume || !job) throw new Error("Resume or job not found");

  let jobProfile = job.source === "personalized" ? null : parseJobProfile(job);
  if (!jobProfile) {
    const rawJob = {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements || undefined,
      location: job.location || undefined,
    };
    jobProfile =
      job.source === "personalized"
        ? extractJobProfileLocal(rawJob)
        : await extractJobProfile(rawJob, job.url || undefined);
    await db
      .update(schema.jobs)
      .set({ structuredProfile: JSON.stringify(jobProfile) })
      .where(eq(schema.jobs.id, jobId));
  }

  let candidateProfile = null;
  if (resume.profileGraph) {
    try {
      candidateProfile = JSON.parse(resume.profileGraph);
    } catch {
      /* rebuild */
    }
  }
  if (!candidateProfile) {
    const skills = resume.skills ? (JSON.parse(resume.skills) as string[]) : [];
    candidateProfile = await extractCandidateProfile(resume.content, skills);
    await db
      .update(schema.resumes)
      .set({ profileGraph: JSON.stringify(candidateProfile) })
      .where(eq(schema.resumes.id, resumeId));
  }

  return { resume, job, jobProfile, candidateProfile };
}

function computeAdjustedFit(
  resume: { content: string },
  job: { id: string },
  resumeEmbedding: number[],
  jobEmbedding: number[],
  jobProfile: StructuredJobProfile,
  candidateProfile: Parameters<typeof computeFitBreakdown>[4]
): FitBreakdown {
  return applyDemoJobFitBoost(
    computeFitBreakdown(
      resume.content,
      resumeEmbedding,
      jobEmbedding,
      jobProfile,
      candidateProfile
    ),
    resume.content,
    job.id
  );
}

export async function getFitBreakdown(
  resumeId: string,
  jobId: string
): Promise<FitBreakdown> {
  const { resume, job, jobProfile, candidateProfile } = await getProfiles(
    resumeId,
    jobId
  );

  const { resumeEmbedding, jobEmbedding } = await resolveFitEmbeddings(
    resume,
    job
  );

  return computeAdjustedFit(
    resume,
    job,
    resumeEmbedding,
    jobEmbedding,
    jobProfile,
    candidateProfile
  );
}

function isTemplateFallback(content: string): boolean {
  return (
    content.includes("Set GEMINI_API_KEY for AI-powered rewriting") ||
    content.includes("Gemini API error") ||
    content.includes("exceeded your current quota") ||
    content.includes("AI generation was unavailable") ||
    content.includes("CareerCrafter AI draft") ||
    content.includes("## Experience (Reframe for This Role)") ||
    content.includes("## Fit Notes") ||
    content.includes("## Selected Role Alignment") ||
    content.includes("## Original Resume Evidence") ||
    content.includes("Candidate Name") ||
    content.includes("Dates from original resume") ||
    !content.includes("## Core Skills") ||
    !content.includes("## Professional Experience")
  );
}

export async function tailorResume(
  resumeId: string,
  jobId: string,
  options?: { force?: boolean }
): Promise<{ id: string; content: string; fit: FitBreakdown }> {
  const db = getDb();
  const { resume, job, jobProfile, candidateProfile } = await getProfiles(
    resumeId,
    jobId
  );

  const { resumeEmbedding, jobEmbedding } = await resolveFitEmbeddings(
    resume,
    job
  );

  const fit = computeAdjustedFit(
    resume,
    job,
    resumeEmbedding,
    jobEmbedding,
    jobProfile,
    candidateProfile
  );

  if (job.source !== "personalized") {
    assertGuardrails(fit, job.title);
  }

  const existing = await db
    .select()
    .from(schema.tailoredResumes)
    .where(
      and(
        eq(schema.tailoredResumes.resumeId, resumeId),
        eq(schema.tailoredResumes.jobId, jobId)
      )
    )
    .limit(1);

  const shouldReuse =
    existing[0] &&
    !options?.force &&
    !isTemplateFallback(existing[0].content);

  if (shouldReuse) {
    return { id: existing[0].id, content: existing[0].content, fit };
  }

  if (existing[0]) {
    await db
      .delete(schema.tailoredResumes)
      .where(eq(schema.tailoredResumes.id, existing[0].id));
  }

  const content = await generateTailoredResume(
    resume.content,
    job,
    jobProfile,
    candidateProfile,
    fit
  );
  const id = uuidv4();

  await db.insert(schema.tailoredResumes).values({
    id,
    resumeId,
    jobId,
    content,
    createdAt: new Date(),
  });

  return { id, content, fit };
}

async function generateTailoredResume(
  resumeContent: string,
  job: schema.Job,
  jobProfile: StructuredJobProfile,
  candidateProfile: CandidateProfileGraph,
  fit: FitBreakdown
): Promise<string> {
  const template = RESUME_TEMPLATES[
    chooseResumeTemplate(job, jobProfile, candidateProfile)
  ];
  const fallback = templateTailor(
    resumeContent,
    job,
    jobProfile,
    candidateProfile,
    fit
  );
  const system = `You are CareerCrafter AI, an ethical resume customizer for FuturePath Careers.
Create a polished, ATS-friendly, one-column resume in clean markdown.
Use the structure inspired by public university and ATS guidance: clear standard headings, reverse-chronological experience, simple bullets, no tables, no graphics, no text boxes, no columns, no decorative icons.
Rules: optimize truth, never invent truth.
ALLOWED: reorder sections, rewrite bullets with stronger verbs, highlight verified achievements, and add job keywords only when the original resume or candidate profile supports them.
NOT ALLOWED: invent employers, dates, degrees, tools, certifications, metrics, direct reports, budget, leadership scope, or inflate seniority.
Use ONLY facts present in the original resume and candidate profile. If the target role is a stretch, frame transferable evidence without claiming missing scope.
Every decision must be personalized to the candidate's profile, domain, experience, role type, seniority, geography, and strongest evidence.
For executive profiles, make the tone strategic and outcome-led: transformation, growth, stakeholder leadership, operating rhythm, portfolio impact.
For lower-experience or technical IC profiles, make the tone precise and technical: tools, projects, implementation depth, measurable delivery, and learning agility.
Output only the final resume markdown. Do not add explanations, fit notes, match scores, AI disclaimers, placeholders, or code fences.`;

  const user = `## Personalized Candidate Profile
${formatCandidateProfileForPrompt(candidateProfile)}

## Original Resume
${resumeContent.slice(0, 6000)}

## Target Job
Title: ${job.title} at ${job.company}
Seniority: ${jobProfile.seniority}
Domain: ${jobProfile.domain}
Must-have: ${jobProfile.mustHaveSkills.join(", ")}
Keywords: ${jobProfile.keywords.join(", ")}
Responsibilities: ${jobProfile.responsibilities.join("; ")}
Tools: ${jobProfile.tools.join(", ")}
Location: ${job.location || jobProfile.location || "Unknown"}
Fit context: overall ${fit.overallFit}/100, seniority gap ${fit.seniorityGapLevels}, evidence coverage ${fit.evidenceCoverage}/100, must-have coverage ${fit.mustHaveCoverage}/100.

Use this selected resume template:
Name: ${template.name}
Best for: ${template.bestFor}
Tone: ${template.tone}
Structure:
${template.structure}

Rewrite the resume truthfully for this role using the selected template.

# Exact Candidate Name From Resume
Only contact details found in the resume, separated by |. If a detail is not present, omit it.

## Professional Summary
2-3 concise lines tailored to ${job.title}. Mention seniority/domain only if supported by the resume. No first-person pronouns.

## Core Skills
Group skills by category, for example: Data Science: Python, SQL, Machine Learning. Include only resume-backed skills.

## Professional Experience
### Exact Role | Exact Company | Location if present | Dates if present
- Action verb + resume-backed achievement/responsibility + job-relevant keyword.
- Action verb + scope/tool/domain evidence from the resume.
- Action verb + measurable impact only if the resume contains the metric.

## Selected Projects
### Project Name | Tools/Domain if present
- Resume-backed project outcome or technical contribution.

## Education
Degree | Institution | Dates if present

## Certifications
Certification | Issuer | Date if present

Remove any section that has no resume-backed content. Never output placeholder text such as Candidate Name, Phone, Dates from original resume, or Review before submitting. Never include fit scores, role alignment notes, or original resume dumps. Preserve authenticity, keep only resume-backed evidence, and optimize section order, language, keywords, and emphasis for this exact candidate profile.`;

  if (hasAI()) {
    try {
      const raw = await chatComplete(system, user, { temperature: 0.35 });
      const normalized = normalizeTailoredContent(raw);
      return isTemplateFallback(normalized) ? fallback : normalized;
    } catch (err) {
      console.warn("AI resume tailoring failed, using truthful fallback:", err);
    }
  }

  return fallback;
}

function templateTailor(
  resumeContent: string,
  job: schema.Job,
  jobProfile: StructuredJobProfile,
  candidateProfile: CandidateProfileGraph,
  fit: FitBreakdown
): string {
  const lines = resumeContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidateName =
    lines.find(
      (line) =>
        line.length <= 80 &&
        !line.includes("@") &&
        !/resume|curriculum|summary|experience|education|skills/i.test(line)
    ) || "Candidate Name";
  const contactLine =
    lines
      .filter((line) => /@|linkedin|github|portfolio|\+\d|\d{10}/i.test(line))
      .slice(0, 3)
      .join(" | ") || "Contact details from original resume";
  const fallbackSkills = [
    ...new Set([
      ...candidateProfile.skills,
      ...candidateProfile.tools,
      ...jobProfile.mustHaveSkills.filter((skill) =>
        resumeContent.toLowerCase().includes(skill.toLowerCase())
      ),
    ]),
  ].slice(0, 14);
  const fallbackEvidence = (
    candidateProfile.strongestEvidence.length
      ? candidateProfile.strongestEvidence
      : candidateProfile.achievements
  ).slice(0, 6);
  const relevantKeywords = jobProfile.keywords
    .filter((keyword) =>
      resumeContent.toLowerCase().includes(keyword.toLowerCase())
    )
    .slice(0, 8);
  const domain =
    candidateProfile.domains[0] || jobProfile.domain || "the target domain";
  const roleTone =
    candidateProfile.seniorityLevel === "executive" ||
    candidateProfile.seniorityLevel === "director"
      ? "strategy, operating rhythm, stakeholder leadership, transformation, and measurable business impact"
      : "technical delivery, tools, implementation depth, and measurable project outcomes";

  return `# ${candidateName}
${contactLine}

## Professional Summary
${candidateProfile.seniorityLevel} ${candidateProfile.candidateType.replace(/_/g, " ")} with resume-backed experience in ${domain}, tailored for ${job.title} at ${job.company}. Strengths emphasized for this role include ${fallbackSkills.slice(0, 6).join(", ") || "the evidence below"}.
Focused on ${roleTone}, using only claims supported by the uploaded resume.

## Core Skills
Technical and Domain Skills: ${fallbackSkills.join(", ") || "Skills from original resume"}
Role Keywords: ${relevantKeywords.join(", ") || jobProfile.mustHaveSkills.slice(0, 6).join(", ") || "Role-aligned keywords from the job description"}

## Professional Experience
### Selected Experience Highlights
${fallbackEvidence.length ? fallbackEvidence.map((e) => `- ${e}`).join("\n") : "- Reframe the original experience around the target role without adding unsupported claims."}

${candidateProfile.education?.length ? `## Education\n${candidateProfile.education.join("\n")}` : ""}
${candidateProfile.certifications?.length ? `## Certifications\n${candidateProfile.certifications.join("\n")}` : ""}`;

  const verifiedSkills = [
    ...new Set([
      ...candidateProfile.skills,
      ...candidateProfile.tools,
      ...jobProfile.mustHaveSkills.filter((skill) =>
        resumeContent.toLowerCase().includes(skill.toLowerCase())
      ),
    ]),
  ].slice(0, 12);
  const strongestEvidence = (
    candidateProfile.strongestEvidence.length
      ? candidateProfile.strongestEvidence
      : candidateProfile.achievements
  ).slice(0, 5);

  return `# Tailored Resume — ${job.title} at ${job.company}

> CareerCrafter AI draft. Review before submitting. No claims were invented.

## Professional Summary
${candidateProfile.seniorityLevel} ${candidateProfile.candidateType.replace(/_/g, " ")} targeting ${job.title} at ${job.company}. Verified resume-backed strengths include ${verifiedSkills.slice(0, 6).join(", ") || "the experience below"}.

## Key Qualifications
${verifiedSkills.length ? verifiedSkills.map((s) => `- ${s}`).join("\n") : jobProfile.mustHaveSkills.map((s) => `- ${s}`).join("\n")}

## Resume-Backed Evidence to Emphasize
${strongestEvidence.length ? strongestEvidence.map((e) => `- ${e}`).join("\n") : "- Use the original experience section below; no additional claims were generated."}

## Fit Notes
- Overall fit: ${fit.overallFit}/100
- Evidence coverage: ${fit.evidenceCoverage}/100
- Must-have coverage: ${fit.mustHaveCoverage}/100
- If this is a stretch role, position actual achievements as transferable evidence. Do not claim missing title, budget, team size, or scope.

---

## Experience (Reframe for This Role)
${resumeContent.slice(0, 4000)}

---

*AI provider not configured — this is a basic template draft. Add GEMINI_API_KEY for full rewriting.*`;
}

export async function getTailoredResume(resumeId: string, jobId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.tailoredResumes)
    .where(
      and(
        eq(schema.tailoredResumes.resumeId, resumeId),
        eq(schema.tailoredResumes.jobId, jobId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function generateCoverLetter(
  resumeId: string,
  jobId: string
): Promise<string> {
  const { resume, job, jobProfile, candidateProfile } = await getProfiles(
    resumeId,
    jobId
  );

  const system = `You write role-specific cover letters for FuturePath Careers premium users. Be authentic, evidence-backed, and adapt tone to candidate type. Never fabricate experience. Every paragraph must be personalized to the candidate's profile, domain, experience, seniority, location, strongest evidence, and target role.`;

  const user = `Personalized candidate profile:
${formatCandidateProfileForPrompt(candidateProfile)}

Resume excerpt: ${resume.content.slice(0, 3000)}
Role: ${job.title} at ${job.company}
Must-have skills: ${jobProfile.mustHaveSkills.join(", ")}
Domain: ${jobProfile.domain}
Location: ${job.location || jobProfile.location || "Unknown"}
Responsibilities: ${jobProfile.responsibilities.join("; ")}

Write a compelling cover letter (3-4 paragraphs). Match the voice to the candidate's seniority and role type: executive profiles should sound strategic and outcome-led; technical profiles should sound evidence-led and precise; early-career profiles should sound credible, specific, and growth-oriented.`;

  if (hasAI()) {
    try {
      return await chatComplete(system, user, { temperature: 0.45 });
    } catch (err) {
      console.warn("AI cover letter generation failed, using fallback:", err);
    }
  }

  const domains = candidateProfile.domains.join(", ") || jobProfile.domain;
  const skills = [
    ...new Set([...candidateProfile.skills, ...candidateProfile.tools]),
  ]
    .slice(0, 5)
    .join(", ");
  const evidence =
    candidateProfile.strongestEvidence[0] ||
    candidateProfile.achievements[0] ||
    "resume-backed experience relevant to the role";

  return `Dear Hiring Team at ${job.company},

I am excited to apply for the ${job.title} role. My background in ${domains} aligns with the role's focus on ${jobProfile.mustHaveSkills.slice(0, 3).join(", ") || jobProfile.domain}, and my resume-backed experience includes ${evidence}.

I would bring a practical, evidence-led approach shaped by ${skills || "the skills reflected in my resume"}. For this opportunity, I would emphasize the parts of my profile that connect most directly to ${jobProfile.responsibilities.slice(0, 2).join(" and ") || "the team's priorities"} while staying grounded in my actual experience.

Thank you for considering my application. I would welcome the opportunity to discuss how my background can support ${job.company}'s goals.

Sincerely,
[Your Name]`;
}

type SkillMilestone = { week: number; focus: string; actions: string[] };
type RecommendedCourse = {
  title: string;
  weeks: number;
  level: string;
  skills: string[];
};
type SkillPathResponse = {
  weeks: number;
  milestones: SkillMilestone[];
  prioritySkills: string[];
  recommendedCourses: RecommendedCourse[];
};

function buildWeeklySkillPath(
  job: schema.Job,
  jobProfile: StructuredJobProfile,
  candidateProfile: CandidateProfileGraph,
  fit: FitBreakdown,
  missingSkills: string[],
  recommendedCourses: RecommendedCourse[]
): SkillPathResponse {
  const prioritySkills = (
    missingSkills.length
      ? missingSkills
      : [...jobProfile.mustHaveSkills, ...jobProfile.tools]
  ).slice(0, 5);
  const primaryDomain =
    candidateProfile.domains[0] || jobProfile.domain || "target-role";
  const seniorityFocus =
    candidateProfile.seniorityLevel === "executive" ||
    candidateProfile.seniorityLevel === "director"
      ? "leadership, strategy, and measurable business impact"
      : "hands-on delivery, technical depth, and interview-ready evidence";
  const courseForWeek = (week: number) =>
    recommendedCourses[(week - 1) % Math.max(recommendedCourses.length, 1)];

  return {
    weeks: 12,
    prioritySkills,
    recommendedCourses,
    milestones: Array.from({ length: 12 }, (_, index) => {
      const week = index + 1;
      const skill = prioritySkills[index % Math.max(prioritySkills.length, 1)];
      const course = courseForWeek(week);
      const courseAction = course
        ? `Study ${course.title} modules related to ${skill || primaryDomain}`
        : `Study ${skill || primaryDomain} fundamentals`;

      if (week <= 3) {
        return {
          week,
          focus: `Close core ${skill || primaryDomain} gaps`,
          actions: [
            courseAction,
            `Map ${skill || primaryDomain} to evidence already present in the resume`,
          ],
        };
      }
      if (week <= 6) {
        return {
          week,
          focus: `Build applied ${primaryDomain} proof`,
          actions: [
            courseAction,
            `Create or refine one portfolio story for ${job.title} using resume-backed facts`,
          ],
        };
      }
      if (week <= 9) {
        return {
          week,
          focus: `Prepare for ${jobProfile.seniority} role expectations`,
          actions: [
            `Practice explaining ${skill || primaryDomain} decisions for ${job.company}`,
            `Translate experience into ${seniorityFocus}`,
          ],
        };
      }
      return {
        week,
        focus: `Application readiness for ${job.title}`,
        actions: [
          `Re-check preparedness score against ${fit.preparedness}/100 baseline`,
          "Update tailored resume, cover letter, networking pitch, and mock interview answers",
        ],
      };
    }),
  };
}

function normalizeSkillPath(
  aiPath: Partial<SkillPathResponse>,
  fallback: SkillPathResponse
): SkillPathResponse {
  const milestones = Array.isArray(aiPath.milestones)
    ? aiPath.milestones
        .filter(
          (m) =>
            Number.isInteger(m.week) &&
            m.week >= 1 &&
            m.week <= 12 &&
            typeof m.focus === "string" &&
            Array.isArray(m.actions)
        )
        .sort((a, b) => a.week - b.week)
    : [];
  const hasEveryWeek =
    milestones.length === 12 &&
    milestones.every((m, index) => m.week === index + 1);

  return {
    weeks: 12,
    prioritySkills: aiPath.prioritySkills?.length
      ? aiPath.prioritySkills.slice(0, 5)
      : fallback.prioritySkills,
    recommendedCourses: fallback.recommendedCourses,
    milestones: hasEveryWeek ? milestones : fallback.milestones,
  };
}

export async function generateSkillPath(
  resumeId: string,
  jobId: string
): Promise<SkillPathResponse> {
  const { resume, job, jobProfile, candidateProfile } = await getProfiles(
    resumeId,
    jobId
  );

  const { resumeEmbedding, jobEmbedding } = await resolveFitEmbeddings(
    resume,
    job
  );

  const fit = computeAdjustedFit(
    resume,
    job,
    resumeEmbedding,
    jobEmbedding,
    jobProfile,
    candidateProfile
  );

  const missingSkills = jobProfile.mustHaveSkills.filter(
    (s) => !resume.content.toLowerCase().includes(s.toLowerCase())
  );

  // Ground recommendations in CareerCrafter Academy's own catalog.
  const recommended = coursesForSkills(
    missingSkills.length ? missingSkills : jobProfile.mustHaveSkills
  );
  const recommendedCourses = recommended.map((c) => ({
    title: c.title,
    weeks: c.weeks,
    level: c.level,
    skills: c.skills,
  }));
  const catalogBlock = recommended
    .map((c) => `- ${c.title} (${c.level}, ${c.weeks}w; covers: ${c.skills.join(", ")})`)
    .join("\n");
  const fallback = buildWeeklySkillPath(
    job,
    jobProfile,
    candidateProfile,
    fit,
    missingSkills,
    recommendedCourses
  );

  if (hasAI()) {
    try {
      const aiPath = await chatComplete(
        `Return JSON only. Create a personalized skill development path. You may ONLY recommend courses from the provided CareerCrafter Academy catalog. Reference courses by exact title in milestone actions. Do not invent external courses or providers. Optimize the plan for this person's current profile, role type, domain, seniority, gaps, location, and target role. The roadmap must be continuous: return exactly 12 milestones, one for every week 1 through 12, with no skipped week numbers.`,
        `Candidate gaps: ${missingSkills.join(", ") || "general readiness"}
Personalized candidate profile:
${formatCandidateProfileForPrompt(candidateProfile)}
Target: ${job.title} (${jobProfile.seniority})
Preparedness: ${fit.preparedness}/100
Domain: ${jobProfile.domain}
Must-have skills: ${jobProfile.mustHaveSkills.join(", ")}

CareerCrafter Academy catalog (recommend only from this list):
${catalogBlock}

Return JSON with exactly this shape and exactly 12 milestone objects:
{ "weeks": 12, "prioritySkills": string[], "milestones": [{ "week": 1, "focus": string, "actions": string[] }, ..., { "week": 12, "focus": string, "actions": string[] }] }`,
        { json: true }
      ).then((r) => JSON.parse(r));

      return normalizeSkillPath(aiPath, fallback);
    } catch {
      /* fallback */
    }
  }

  return fallback;
}

function templateNetworkingMessage(
  job: schema.Job,
  jobProfile: StructuredJobProfile,
  candidateProfile: CandidateProfileGraph,
  context: "recruiter" | "hiring_manager" | "alumni" | "referral"
): string {
  const audience =
    context === "hiring_manager"
      ? "Hiring Manager"
      : context === "alumni"
        ? "Alumni"
        : context === "referral"
          ? "Referral Contact"
          : "Recruiter";
  const domain = candidateProfile.domains[0] || jobProfile.domain || "this field";
  const evidence =
    candidateProfile.strongestEvidence[0] ||
    candidateProfile.achievements[0] ||
    `${candidateProfile.seniorityLevel} experience in ${domain}`;
  const skills = [
    ...new Set([...candidateProfile.skills, ...candidateProfile.tools]),
  ].slice(0, 3);
  const skillPhrase = skills.length ? ` with ${skills.join(", ")}` : "";

  return `Hi ${audience},

I'm exploring the ${job.title} role at ${job.company}. My background in ${domain}${skillPhrase} includes ${evidence}, and the role looks closely aligned with the direction of my profile.

Would you be open to a brief conversation or pointing me to the right person to learn more?

Thank you,
[Your Name]`;
}

export async function generateNetworkingMessage(
  resumeId: string,
  jobId: string,
  context: "recruiter" | "hiring_manager" | "alumni" | "referral"
): Promise<string> {
  const { job, jobProfile, candidateProfile } = await getProfiles(
    resumeId,
    jobId
  );

  if (hasAI()) {
    try {
      return await chatComplete(
        `Draft concise LinkedIn/email outreach. Authentic, not salesy. Under 150 words. Personalize the message to candidate seniority, domain, location, strongest evidence, target role, and relationship context. Never invent claims.`,
        `Context: ${context}
Personalized candidate profile:
${formatCandidateProfileForPrompt(candidateProfile)}
Target: ${job.title} at ${job.company}
Target role domain: ${jobProfile.domain}
Target must-have skills: ${jobProfile.mustHaveSkills.join(", ")}`,
        { temperature: 0.5 }
      );
    } catch (err) {
      console.warn("AI networking message generation failed, using fallback:", err);
      return templateNetworkingMessage(job, jobProfile, candidateProfile, context);
    }
  }

  return `Hi — I'm exploring the ${job.title} role at ${job.company}. My background in ${candidateProfile.domains[0]} includes ${candidateProfile.strongestEvidence[0] || "relevant experience"}. Would love to connect briefly. Thank you!`;
}
