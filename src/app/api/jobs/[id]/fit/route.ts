import { NextRequest, NextResponse } from "next/server";
import { getLatestResume } from "@/lib/rag/matching";
import { getFitBreakdown } from "@/lib/rag/tailor";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const resume = await getLatestResume();
    if (!resume) {
      return NextResponse.json({ error: "Upload a resume first" }, { status: 400 });
    }
    const fit = await getFitBreakdown(resume.id, jobId);
    return NextResponse.json(fit);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fit scoring failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
