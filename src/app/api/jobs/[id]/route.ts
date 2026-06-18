import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getLatestResume, getMatchesForResume } from "@/lib/rag/matching";
import { getTailoredResume } from "@/lib/rag/tailor";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const [job] = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const resume = await getLatestResume();
    let matchPercentage: number | null = null;
    let tailored = null;

    if (resume) {
      const matches = await getMatchesForResume(resume.id);
      const match = matches.find((m) => m.jobId === id);
      matchPercentage = match?.matchPercentage ?? null;
      tailored = await getTailoredResume(resume.id, id);
    }

    return NextResponse.json({
      job,
      resumeId: resume?.id ?? null,
      matchPercentage,
      tailoredResume: tailored,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
