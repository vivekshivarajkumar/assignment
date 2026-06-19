import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { parseResumeFile, parseResumeText } from "@/lib/parse/resume";
import { saveResume, matchResumeToJobs } from "@/lib/rag/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "txt") return "text/plain";
  if (ext === "md") return "text/markdown";
  return "application/octet-stream";
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let filename = "resume.txt";
    let content: string;
    let originalFile: { data: string; type: string } | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const text = form.get("text") as string | null;

      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        filename = file.name;
        content = await parseResumeFile(buffer, filename);
        originalFile = {
          data: buffer.toString("base64"),
          type: file.type || guessMimeType(filename),
        };
      } else if (text) {
        content = await parseResumeText(text);
        filename = "pasted-resume.txt";
      } else {
        return NextResponse.json(
          { error: "Provide a file or paste resume text" },
          { status: 400 }
        );
      }
    } else {
      const body = await req.json();
      if (!body.text) {
        return NextResponse.json({ error: "text is required" }, { status: 400 });
      }
      content = await parseResumeText(body.text);
    }

    const { id, skills } = await saveResume(filename, content, {
      useAi: false,
      file: originalFile,
    });
    const matches = await matchResumeToJobs(id, { useAi: false });

    revalidatePath("/");

    return NextResponse.json({
      resumeId: id,
      filename,
      content,
      fileType: originalFile?.type ?? null,
      skills,
      matchCount: matches.length,
      topMatches: matches.slice(0, 5),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
