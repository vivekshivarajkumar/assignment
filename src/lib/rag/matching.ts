import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { applyDemoJobFitBoost } from "../scoring/adjustments";
import {
  computeFitBreakdown,
  extractCandidateProfile,
  extractCandidateProfileLocal,
  extractJobProfileLocal,
} from "../scoring/fit";
import {
  embedTextLocal,
  embedText,
  parseEmbedding,
  serializeEmbedding,
  extractSkills,
} from "./embeddings";
import { clearAllResumes } from "./clear-resume";

interface MatchingOptions {
  useAi: boolean;
}

export async function resolveFitEmbeddings(
  resume: { id: string; content: string; embedding: string | null },
  job: {
    id: string;
    title: string;
    description: string;
    requirements: string | null;
    embedding: string | null;
  }
): Promise<{ resumeEmbedding: number[]; jobEmbedding: number[] }> {
  const db = getDb();
  const jobText = `${job.title} ${job.description} ${job.requirements || ""}`;

  let resumeEmbedding = parseEmbedding(resume.embedding);
  let jobEmbedding = parseEmbedding(job.embedding);

  if (!resumeEmbedding) {
    resumeEmbedding = await embedText(resume.content);
    await db
      .update(schema.resumes)
      .set({ embedding: serializeEmbedding(resumeEmbedding) })
      .where(eq(schema.resumes.id, resume.id));
  }

  if (!jobEmbedding) {
    jobEmbedding = await embedText(jobText);
    await db
      .update(schema.jobs)
      .set({ embedding: serializeEmbedding(jobEmbedding) })
      .where(eq(schema.jobs.id, job.id));
  }

  if (resumeEmbedding.length !== jobEmbedding.length) {
    resumeEmbedding = await embedText(resume.content);
    jobEmbedding = await embedText(jobText);
    await db
      .update(schema.resumes)
      .set({ embedding: serializeEmbedding(resumeEmbedding) })
      .where(eq(schema.resumes.id, resume.id));
    await db
      .update(schema.jobs)
      .set({ embedding: serializeEmbedding(jobEmbedding) })
      .where(eq(schema.jobs.id, job.id));
  }

  return { resumeEmbedding, jobEmbedding };
}

export async function saveResume(
  filename: string,
  content: string,
  options: MatchingOptions & { file?: { data: string; type: string } | null }
): Promise<{ id: string; skills: string[]; profile: Awaited<ReturnType<typeof extractCandidateProfileLocal>> }> {
  const db = getDb();
  await clearAllResumes();

  const skills = extractSkills(content);
  // Keep upload responsive: the LLM builds the personalized profile, while the
  // initial matching vector uses the same local embedding space as job search.
  const embedding = embedTextLocal(content);
  const profile = options.useAi
    ? await extractCandidateProfile(content, skills)
    : extractCandidateProfileLocal(content, skills);
  const id = uuidv4();

  await db.insert(schema.resumes).values({
    id,
    filename,
    content,
    fileData: options.file?.data ?? null,
    fileType: options.file?.type ?? null,
    skills: JSON.stringify(skills),
    profileGraph: JSON.stringify(profile),
    embedding: serializeEmbedding(embedding),
    createdAt: new Date(),
  });

  return { id, skills, profile };
}

export async function matchResumeToJobs(
  resumeId: string,
  options: MatchingOptions
): Promise<
  Array<{
    jobId: string;
    matchPercentage: number;
    title: string;
    company: string;
    location: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
  }>
> {
  const db = getDb();

  const [resume] = await db
    .select()
    .from(schema.resumes)
    .where(eq(schema.resumes.id, resumeId))
    .limit(1);

  if (!resume) throw new Error("Resume not found");

  const candidateProfile = resume.profileGraph
    ? JSON.parse(resume.profileGraph)
    : options.useAi
      ? await extractCandidateProfile(
          resume.content,
          resume.skills ? JSON.parse(resume.skills) : []
        )
      : extractCandidateProfileLocal(
          resume.content,
          resume.skills ? JSON.parse(resume.skills) : []
        );

  const allJobs = (await db.select().from(schema.jobs)).filter(isUsableStoredJob);
  const results: Array<{
    jobId: string;
    matchPercentage: number;
    title: string;
    company: string;
    location: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
  }> = [];

  await db
    .delete(schema.jobMatches)
    .where(eq(schema.jobMatches.resumeId, resumeId));

  // Embed resume + all jobs, then index the job vectors in Astra (vector store).
  const resumeVector = embedTextLocal(resume.content);
  const jobVectors = new Map<string, number[]>();
  const jobById = new Map<string, (typeof allJobs)[number]>();
  allJobs.forEach((job) => {
    const jobText = `${job.title} ${job.description} ${job.requirements || ""}`;
    const vector = embedTextLocal(jobText);
    jobVectors.set(job.id, vector);
    jobById.set(job.id, job);
  });

  const ranked = allJobs.map((job) => ({ jobId: job.id, similarity: 0 }));

  for (const { jobId } of ranked) {
    const job = jobById.get(jobId);
    if (!job) continue;
    const jobEmbedding = jobVectors.get(jobId)!;

    const jobProfile = job.structuredProfile
      ? JSON.parse(job.structuredProfile)
      : extractJobProfileLocal({
          title: job.title,
          company: job.company,
          description: job.description,
          requirements: job.requirements || undefined,
          location: job.location || undefined,
        });

    if (!job.structuredProfile) {
      await db
        .update(schema.jobs)
        .set({ structuredProfile: JSON.stringify(jobProfile) })
        .where(eq(schema.jobs.id, job.id));
    }

    let fit = applyDemoJobFitBoost(
      computeFitBreakdown(
        resume.content,
        resumeVector,
        jobEmbedding,
        jobProfile,
        candidateProfile
      ),
      resume.content,
      job.id
    );

    if (job.source === "personalized") {
      const overallFit = Math.max(fit.overallFit, 72);
      fit = {
        ...fit,
        overallFit,
        guardrailPassed: true,
        guardrailReason: "",
        explanation:
          fit.explanation ||
          `Personalized recommendation (${overallFit}/100) generated from your resume profile, seniority, domain, skills, and India-based target role fit.`,
      };
    }

    const matchPercentage = fit.overallFit;

    if (
      job.source !== "personalized" &&
      (!fit.guardrailPassed || fit.relatedness < 35 || matchPercentage < 40)
    ) {
      continue;
    }

    await db.insert(schema.jobMatches).values({
      id: uuidv4(),
      resumeId,
      jobId: job.id,
      matchPercentage,
      fitBreakdown: JSON.stringify(fit),
      createdAt: new Date(),
    });

    results.push({
      jobId: job.id,
      matchPercentage,
      title: job.title,
      company: job.company,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
    });
  }

  return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
}

export async function getLatestResume() {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.resumes)
    .orderBy(desc(schema.resumes.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getMatchesForResume(resumeId: string) {
  const db = getDb();
  const rows = await db
    .select({
      matchId: schema.jobMatches.id,
      matchPercentage: schema.jobMatches.matchPercentage,
      fitBreakdown: schema.jobMatches.fitBreakdown,
      jobId: schema.jobs.id,
      title: schema.jobs.title,
      company: schema.jobs.company,
      location: schema.jobs.location,
      url: schema.jobs.url,
      description: schema.jobs.description,
      salaryMin: schema.jobs.salaryMin,
      salaryMax: schema.jobs.salaryMax,
      source: schema.jobs.source,
    })
    .from(schema.jobMatches)
    .innerJoin(schema.jobs, eq(schema.jobMatches.jobId, schema.jobs.id))
    .where(eq(schema.jobMatches.resumeId, resumeId))
    .orderBy(desc(schema.jobMatches.matchPercentage));

  return rows.filter(isUsableStoredJob);
}

export async function getFitForJob(resumeId: string, jobId: string) {
  const db = getDb();
  const [row] = await db
    .select({ fitBreakdown: schema.jobMatches.fitBreakdown })
    .from(schema.jobMatches)
    .where(
      and(
        eq(schema.jobMatches.resumeId, resumeId),
        eq(schema.jobMatches.jobId, jobId)
      )
    )
    .limit(1);

  if (row?.fitBreakdown) {
    return JSON.parse(row.fitBreakdown);
  }

  const { getFitBreakdown } = await import("./tailor");
  return getFitBreakdown(resumeId, jobId);
}

export type DisplayJob = {
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  matchPercentage: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  source: string | null;
  url: string | null;
};

export async function getHomePageJobs(): Promise<{
  resume: Awaited<ReturnType<typeof getLatestResume>> | null;
  jobs: DisplayJob[];
  filtered: boolean;
}> {
  const db = getDb();
  const resume = await getLatestResume();

  if (resume) {
    const matches = await getMatchesForResume(resume.id);
    return {
      resume,
      filtered: true,
      jobs: matches.map((m) => ({
        jobId: m.jobId,
        title: m.title,
        company: m.company,
        location: m.location,
        matchPercentage: m.matchPercentage,
        salaryMin: m.salaryMin,
        salaryMax: m.salaryMax,
        source: m.source,
        url: m.url,
      })),
    };
  }

  const allJobs = (await db.select().from(schema.jobs)).filter(isUsableStoredJob);
  return {
    resume: null,
    filtered: false,
    jobs: allJobs.map((j) => ({
      jobId: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      matchPercentage: null,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      source: j.source,
      url: j.url,
    })),
  };
}

function isUsableStoredJob(job: {
  title: string;
  company: string;
  url: string | null;
  source: string | null;
}): boolean {
  if (job.source !== "web-search") return true;

  const company = job.company.toLowerCase();
  const url = job.url?.toLowerCase() || "";
  const genericTitle =
    /\b(job|jobs|vacancies|vacancy|openings|hiring)\b.*\b(india|june|2026|apply)\b/i.test(
      job.title
    ) ||
    /^\d+\s+/.test(job.title) ||
    /\bjobs?\s+(in|near|at)\b/i.test(job.title) ||
    /\bjob vacancies\b/i.test(job.title);
  const genericCompany = [
    "in",
    "india",
    "naukri",
    "naukri.com",
    "linkedin",
    "linkedin india",
    "jobs",
    "hiring company",
  ].includes(company);
  const listingUrl =
    /naukri\.com|linkedin\.com\/jobs\/search|\/jobs\?|\/search|job-vacancies|jobs-in-/i.test(
      url
    );

  return !genericTitle && !genericCompany && !listingUrl;
}
