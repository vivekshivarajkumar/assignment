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
} from "../scoring/fit";
import { normalizeTailoredContent } from "@/lib/resume-markdown";
import type { FitBreakdown, StructuredJobProfile } from "../scoring/types";
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

  let jobProfile = parseJobProfile(job);
  if (!jobProfile) {
    jobProfile = await extractJobProfile(
      {
        title: job.title,
        company: job.company,
        description: job.description,
        requirements: job.requirements || undefined,
        location: job.location || undefined,
      },
      job.url || undefined
    );
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
  return content.includes("Set GEMINI_API_KEY for AI-powered rewriting");
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

  assertGuardrails(fit, job.title);

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
    candidateProfile
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
  candidateProfile: { candidateType: string; strongestEvidence: string[] }
): Promise<string> {
  const system = `You are CareerCrafter AI, an ethical resume customizer for FuturePath Careers.
Rules: optimize truth, never invent truth.
ALLOWED: reorder sections, rewrite bullets with stronger verbs, highlight verified achievements, add ATS keywords only when evidence exists.
NOT ALLOWED: invent employers, degrees, tools, leadership, or inflate seniority.
Output clean markdown only. Do not wrap the response in code fences.`;

  const user = `## Candidate Profile Type: ${candidateProfile.candidateType}
Strongest evidence: ${candidateProfile.strongestEvidence.join("; ")}

## Original Resume
${resumeContent.slice(0, 6000)}

## Target Job
Title: ${job.title} at ${job.company}
Seniority: ${jobProfile.seniority}
Domain: ${jobProfile.domain}
Must-have: ${jobProfile.mustHaveSkills.join(", ")}
Keywords: ${jobProfile.keywords.join(", ")}

Rewrite the resume truthfully for this role.`;

  if (hasAI()) {
    const raw = await chatComplete(system, user, { temperature: 0.35 });
    return normalizeTailoredContent(raw);
  }

  return templateTailor(resumeContent, job, jobProfile);
}

function templateTailor(
  resumeContent: string,
  job: schema.Job,
  jobProfile: StructuredJobProfile
): string {
  return `# Tailored Resume — ${job.title} at ${job.company}

> CareerCrafter AI draft. Review before submitting. No claims were invented.

## Professional Summary
Candidate targeting ${job.title} at ${job.company}. Verified skills include ${jobProfile.mustHaveSkills.slice(0, 4).join(", ")}.

## Key Qualifications
${jobProfile.mustHaveSkills.map((s) => `- ${s}`).join("\n")}

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

  const system = `You write role-specific cover letters for FuturePath Careers premium users. Be authentic, evidence-backed, and adapt tone to candidate type. Never fabricate experience.`;

  const user = `Candidate type: ${candidateProfile.candidateType}
Resume excerpt: ${resume.content.slice(0, 3000)}
Role: ${job.title} at ${job.company}
Must-have skills: ${jobProfile.mustHaveSkills.join(", ")}
Domain: ${jobProfile.domain}

Write a compelling cover letter (3-4 paragraphs).`;

  if (hasAI()) {
    return chatComplete(system, user, { temperature: 0.45 });
  }

  return `Dear Hiring Team at ${job.company},\n\nI am writing to express my interest in the ${job.title} position. My background in ${candidateProfile.domains.join(", ")} aligns with your requirements including ${jobProfile.mustHaveSkills.slice(0, 3).join(", ")}.\n\n[Review and personalize this draft before sending.]\n\nSincerely,\n[Your Name]`;
}

export async function generateSkillPath(
  resumeId: string,
  jobId: string
): Promise<{
  weeks: number;
  milestones: { week: number; focus: string; actions: string[] }[];
  prioritySkills: string[];
  recommendedCourses: { title: string; weeks: number; level: string; skills: string[] }[];
}> {
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

  if (hasAI()) {
    try {
      const aiPath = await chatComplete(
        `Return JSON only. Create a skill development path. You may ONLY recommend courses from the provided CareerCrafter Academy catalog — reference them by their exact title in the milestone actions. Do not invent external courses or providers.`,
        `Candidate gaps: ${missingSkills.join(", ") || "general readiness"}
Current type: ${candidateProfile.candidateType}
Target: ${job.title} (${jobProfile.seniority})
Preparedness: ${fit.preparedness}/100

CareerCrafter Academy catalog (recommend only from this list):
${catalogBlock}

Return JSON: { "weeks": 12, "prioritySkills": string[], "milestones": [{ "week": number, "focus": string, "actions": string[] }] }`,
        { json: true }
      ).then((r) => JSON.parse(r));

      return { ...aiPath, recommendedCourses };
    } catch {
      /* fallback */
    }
  }

  const primary = recommended.slice(0, 2);
  const advanced = recommended.slice(2, 4);

  return {
    weeks: 12,
    prioritySkills: missingSkills.slice(0, 5),
    recommendedCourses,
    milestones: [
      {
        week: 1,
        focus: "Foundation skills",
        actions: primary.length
          ? primary.map((c) => `Enroll in ${c.title}`)
          : ["Enroll in CareerCrafter Academy: Interview Mastery & Storytelling"],
      },
      {
        week: 4,
        focus: "Build depth",
        actions: [
          ...(advanced.length ? advanced.map((c) => `Complete ${c.title}`) : []),
          `Build a project demonstrating ${jobProfile.domain} skills`,
        ],
      },
      {
        week: 8,
        focus: "Interview prep",
        actions: [
          "Complete CareerCrafter Academy: Interview Mastery & Storytelling",
          "Practice mock interviews",
        ],
      },
      {
        week: 12,
        focus: "Application ready",
        actions: [`Re-assess fit for ${job.title}`, "Apply with tailored materials"],
      },
    ],
  };
}

export async function generateNetworkingMessage(
  resumeId: string,
  jobId: string,
  context: "recruiter" | "hiring_manager" | "alumni" | "referral"
): Promise<string> {
  const { job, candidateProfile } = await getProfiles(
    resumeId,
    jobId
  );

  if (hasAI()) {
    return chatComplete(
      `Draft concise LinkedIn/email outreach. Authentic, not salesy. Under 150 words.`,
      `Context: ${context}
Candidate: ${candidateProfile.seniorityLevel}, ${candidateProfile.candidateType}
Target: ${job.title} at ${job.company}
Top evidence: ${candidateProfile.strongestEvidence.slice(0, 2).join("; ")}`,
      { temperature: 0.5 }
    );
  }

  return `Hi — I'm exploring the ${job.title} role at ${job.company}. My background in ${candidateProfile.domains[0]} includes ${candidateProfile.strongestEvidence[0] || "relevant experience"}. Would love to connect briefly. Thank you!`;
}
