import { PageHeader } from "@/components/PageHeader";
import { InterviewQuestionList } from "@/components/InterviewQuestionList";
import { getOrFetchInsights } from "@/lib/insights/web-search";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InterviewQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();

  const [job] = await db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.id, id))
    .limit(1);

  if (!job) notFound();

  const insights = await getOrFetchInsights(id);

  // Combine the role-specific and most-asked banks into one larger set, deduped.
  const all = Array.from(
    new Set(
      [...insights.interviewQuestions, ...insights.commonQuestions].map((q) =>
        q.trim()
      )
    )
  ).filter(Boolean);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <PageHeader
          backHref={`/jobs/${id}`}
          backLabel="Back to role"
          title="Interview questions"
        />

        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-black">
            {all.length} questions for {job.title}
          </h1>
          <p className="mt-1 text-sm text-uber-gray-500">
            {job.company} · each linked to where you can study it
          </p>
        </div>

        <div className="uber-card p-5 sm:p-6">
          <InterviewQuestionList questions={all} />
        </div>
      </div>
    </main>
  );
}
