import { NextRequest, NextResponse } from "next/server";
import { tailorResume } from "@/lib/rag/tailor";
import { getLatestResume } from "@/lib/rag/matching";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json().catch(() => ({}));
    let resumeId = body.resumeId as string | undefined;
    const force = Boolean(body.force);

    if (!resumeId) {
      const resume = await getLatestResume();
      if (!resume) {
        return NextResponse.json(
          { error: "Upload a resume first" },
          { status: 400 }
        );
      }
      resumeId = resume.id;
    }

    const result = await tailorResume(resumeId, jobId, { force });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tailoring failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
