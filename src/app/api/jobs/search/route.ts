import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getLatestResume, matchResumeToJobs } from "@/lib/rag/matching";
import { discoverPersonalizedJobsForResume } from "@/lib/job-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const resume = await getLatestResume();
    if (!resume) {
      return NextResponse.json(
        { error: "Upload a resume first" },
        { status: 400 }
      );
    }

    const skills = resume.skills ? (JSON.parse(resume.skills) as string[]) : [];
    const profile = resume.profileGraph
      ? JSON.parse(resume.profileGraph)
      : undefined;

    const discovery = await discoverPersonalizedJobsForResume(
      {
        resumeId: resume.id,
        content: resume.content,
        skills,
        profile,
      },
      { useAi: true, limit: 12, deadlineMs: 15000 }
    );
    const matches = await matchResumeToJobs(resume.id, { useAi: true });

    revalidatePath("/");
    revalidatePath("/jobs");

    return NextResponse.json({
      resumeId: resume.id,
      discovery,
      matchCount: matches.length,
      topMatches: matches.slice(0, 5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job search failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
