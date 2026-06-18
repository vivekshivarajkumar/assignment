import { NextResponse } from "next/server";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  getLatestResume,
  getMatchesForResume,
} from "@/lib/rag/matching";

export async function GET() {
  try {
    const db = getDb();
    const jobs = await db.select().from(schema.jobs).orderBy(desc(schema.jobs.createdAt));
    const resume = await getLatestResume();

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
