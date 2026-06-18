import { NextRequest, NextResponse } from "next/server";
import { getLatestResume } from "@/lib/rag/matching";
import { generateNetworkingMessage } from "@/lib/rag/tailor";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json().catch(() => ({}));
    let resumeId = body.resumeId as string | undefined;
    const context = (body.context ||
      "recruiter") as "recruiter" | "hiring_manager" | "alumni" | "referral";

    if (!resumeId) {
      const resume = await getLatestResume();
      if (!resume) {
        return NextResponse.json({ error: "Upload a resume first" }, { status: 400 });
      }
      resumeId = resume.id;
    }

    const content = await generateNetworkingMessage(resumeId, jobId, context);
    return NextResponse.json({ content, context });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
