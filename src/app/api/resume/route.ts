import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clearAllResumes } from "@/lib/rag/clear-resume";

export async function DELETE() {
  try {
    await clearAllResumes();
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear resume";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
