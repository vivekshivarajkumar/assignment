import { NextResponse } from "next/server";
import {
  getLatestResume,
  getMatchesForResume,
  getHomePageJobs,
} from "@/lib/rag/matching";

export async function GET() {
  try {
    const resume = await getLatestResume();
    const { jobs } = await getHomePageJobs();

    let matches: Awaited<ReturnType<typeof getMatchesForResume>> = [];
    if (resume) {
      matches = await getMatchesForResume(resume.id);
      matches = [...matches].sort(
        (a, b) => (b.matchPercentage ?? 0) - (a.matchPercentage ?? 0)
      );
    }

    return NextResponse.json({ jobs, resume, matches });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}
