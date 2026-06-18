import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getLatestResume } from "@/lib/rag/matching";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  const db = getDb();
  let resume = null;

  if (id) {
    const [row] = await db
      .select()
      .from(schema.resumes)
      .where(eq(schema.resumes.id, id))
      .limit(1);
    resume = row ?? null;
  } else {
    resume = await getLatestResume();
  }

  if (!resume || !resume.fileData) {
    return NextResponse.json(
      { error: "No uploaded file for this resume" },
      { status: 404 }
    );
  }

  const buffer = Buffer.from(resume.fileData, "base64");
  const bytes = new Uint8Array(buffer);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": resume.fileType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(resume.filename)}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
