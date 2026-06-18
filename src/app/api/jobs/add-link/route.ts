import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { fetchJobFromUrl, validateJobUrl } from "@/lib/parse/job-url";
import { embedTextLocal, serializeEmbedding } from "@/lib/rag/embeddings";
import { matchResumeToJobs, getLatestResume } from "@/lib/rag/matching";
import { extractJobProfileLocal } from "@/lib/scoring/fit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, title, company, description } = body;

    let jobData: {
      title: string;
      company: string;
      description: string;
      requirements: string;
      location: string;
      salaryMin: number | null;
      salaryMax: number | null;
      url: string | null;
    };

    if (url) {
      const validUrl = validateJobUrl(url);
      const parsed = await fetchJobFromUrl(validUrl);
      jobData = { ...parsed, url: validUrl };
    } else if (description && description.trim().length >= 50) {
      jobData = {
        title: (title as string)?.trim() || "Target Role",
        company: (company as string)?.trim() || "Target Company",
        description: description.trim(),
        requirements: body.requirements || description.trim(),
        location: body.location || "",
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        url: null,
      };
    } else if (title && company && description) {
      jobData = {
        title,
        company,
        description,
        requirements: body.requirements || "",
        location: body.location || "",
        salaryMin: body.salaryMin ?? null,
        salaryMax: body.salaryMax ?? null,
        url: null,
      };
    } else {
      return NextResponse.json(
        { error: "Provide a job URL or paste job requirements (50+ characters)" },
        { status: 400 }
      );
    }

    const db = getDb();
    const jobText = `${jobData.title} ${jobData.description} ${jobData.requirements}`;
    const embedding = embedTextLocal(jobText);
    const structuredProfile = extractJobProfileLocal({
      title: jobData.title,
      company: jobData.company,
      description: jobData.description,
      requirements: jobData.requirements,
      location: jobData.location,
    });
    const id = uuidv4();

    await db.insert(schema.jobs).values({
      id,
      title: jobData.title,
      company: jobData.company,
      url: jobData.url,
      description: jobData.description,
      requirements: jobData.requirements,
      location: jobData.location,
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      source: "user",
      structuredProfile: JSON.stringify(structuredProfile),
      embedding: serializeEmbedding(embedding),
      createdAt: new Date(),
    });

    const resume = await getLatestResume();
    let matches: Awaited<ReturnType<typeof matchResumeToJobs>> = [];
    if (resume) {
      matches = await matchResumeToJobs(resume.id, { useAi: false });
    }

    const newMatch = matches.find((m) => m.jobId === id);

    revalidatePath("/");

    return NextResponse.json({
      job: { id, ...jobData, source: "user" },
      matchPercentage: newMatch?.matchPercentage ?? null,
      matches,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add job";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
