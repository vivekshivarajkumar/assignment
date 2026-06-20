import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { getLatestResume } from "@/lib/rag/matching";
import { chatComplete, hasAI } from "@/lib/ai/chat";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;
    const body = await req.json();
    const { answer, questionIndex = 0, history = [] } = body as {
      answer?: string;
      questionIndex?: number;
      history?: { role: string; content: string }[];
    };

    const db = getDb();
    const [job] = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, jobId))
      .limit(1);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const resume = await getLatestResume();
    const resumeExcerpt = resume?.content.slice(0, 2000) || "No resume uploaded";
    const candidateProfile = resume?.profileGraph
      ? safeJson<Record<string, unknown>>(resume.profileGraph)
      : null;
    const profileBlock = candidateProfile
      ? JSON.stringify(candidateProfile, null, 2).slice(0, 2500)
      : "No structured profile available.";

    if (!answer) {
      const firstQuestion = hasAI()
        ? await chatComplete(
            `You conduct adaptive mock interviews. Every question must be personalized to the candidate's resume, profile, domain, role type, seniority, and target job. Return only the interview question, no preamble.`,
            `Role: ${job.title} at ${job.company}
Candidate structured profile: ${profileBlock}
Candidate resume evidence: ${resumeExcerpt}
Ask the first interview question appropriate for this exact candidate, role, domain, and seniority.`
          )
        : `Tell me about your experience relevant to the ${job.title} role at ${job.company}.`;

      return NextResponse.json({
        question: firstQuestion,
        questionIndex: 0,
        done: false,
      });
    }

    const feedback = hasAI()
      ? await chatComplete(
          `You are an empathetic interview coach. Give constructive feedback on content, structure, tone, confidence, seniority fit, and evidence strength. Personalize feedback to the candidate profile and target role. Then ask one follow-up question. Format: ## Feedback\n...\n\n## Next Question\n...`,
          `Role: ${job.title}
Candidate structured profile: ${profileBlock}
Candidate resume evidence: ${resumeExcerpt}
Question ${questionIndex + 1} answered: ${history[history.length - 1]?.content || ""}
Candidate answer: ${answer}`,
          { temperature: 0.4 }
        )
      : `Good start. Try adding a specific metric or outcome.\n\nFollow-up: What was the biggest challenge in that project?`;

    const parts = feedback.split("## Next Question");
    const feedbackText = parts[0]?.replace("## Feedback", "").trim() || feedback;
    const nextQuestion = parts[1]?.trim();
    const done = questionIndex >= 4 || !nextQuestion;

    return NextResponse.json({
      feedback: feedbackText,
      question: nextQuestion || null,
      questionIndex: questionIndex + 1,
      done,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Interview failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

function safeJson<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
