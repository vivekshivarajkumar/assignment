import { MatchBadge } from "@/components/MatchBadge";
import { TailoredResumePanel } from "@/components/TailoredResumePanel";
import { InsightsPanel } from "@/components/InsightsPanel";
import { PayScaleCard } from "@/components/PayScaleCard";
import { FitScorePanel } from "@/components/FitScorePanel";
import { CareerCopilotPanel } from "@/components/CareerCopilotPanel";
import { PageHeader } from "@/components/PageHeader";
import { IconLocation, IconSalary } from "@/components/icons";
import { jobSourceDomain, faviconUrl } from "@/lib/job-source";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getLatestResume } from "@/lib/rag/matching";
import { getTailoredResume } from "@/lib/rag/tailor";
import { getOrFetchInsights } from "@/lib/insights/web-search";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max!);
}

function readGuardrailPassed(fitBreakdown: string | null): boolean {
  if (!fitBreakdown) return true;
  try {
    const fit = JSON.parse(fitBreakdown) as { guardrailPassed?: boolean };
    return fit.guardrailPassed ?? true;
  } catch {
    return true;
  }
}

export default async function JobDetailPage({
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

  const resume = await getLatestResume();
  let matchPercentage: number | null = null;
  let guardrailPassed = true;

  if (resume) {
    const [match] = await db
      .select()
      .from(schema.jobMatches)
      .where(
        and(
          eq(schema.jobMatches.jobId, id),
          eq(schema.jobMatches.resumeId, resume.id)
        )
      )
      .limit(1);
    matchPercentage = match?.matchPercentage ?? null;
    guardrailPassed = readGuardrailPassed(match?.fitBreakdown ?? null);
  }

  const tailored = resume ? await getTailoredResume(resume.id, id) : null;

  const salary = formatSalary(job.salaryMin, job.salaryMax);

  const insights = await getOrFetchInsights(id).catch(() => null);

  let paySourceDomain: string | undefined;
  if (insights?.sources[0]) {
    try {
      paySourceDomain = new URL(insights.sources[0]).hostname.replace(/^www\./, "");
    } catch {
      paySourceDomain = undefined;
    }
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <PageHeader backHref="/" backLabel="Home" title={job.title} />

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left: the role */}
          <div className="space-y-6">
          <div className="uber-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.08]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={faviconUrl(jobSourceDomain(job.company, job.url))}
                  alt=""
                  width={26}
                  height={26}
                  className="h-[26px] w-[26px]"
                />
              </span>
              <div>
                <p className="font-semibold text-black">{job.company}</p>
                <p className="text-sm text-uber-gray-500">
                  {jobSourceDomain(job.company, job.url)}
                </p>
              </div>
            </div>
            {matchPercentage != null && (
              <MatchBadge percentage={Math.round(matchPercentage)} size="lg" />
            )}
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-uber-gray-600">
            {job.location && (
              <span className="inline-flex items-center gap-1.5">
                <IconLocation />
                {job.location}
              </span>
            )}
            {salary && (
              <span className="inline-flex items-center gap-1.5">
                <IconSalary />
                {salary}
              </span>
            )}
            {job.url && (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-black underline decoration-uber-gray-200 underline-offset-2 hover:decoration-black"
              >
                View original posting
              </a>
            )}
          </div>

          <div className="space-y-6 border-t border-uber-gray-100 pt-8">
            <section>
              <h3 className="mb-3 font-semibold text-black">Description</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-uber-gray-500">
                {job.description}
              </p>
            </section>
            {job.requirements && (
              <section>
                <h3 className="mb-3 font-semibold text-black">Requirements</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-uber-gray-500">
                  {job.requirements}
                </p>
              </section>
            )}
          </div>
          </div>

            <InsightsPanel jobId={id} initialInsights={insights} />
          </div>

          {/* Right: pay, your fit & tools */}
          <div className="space-y-6">
            {insights && (
              <PayScaleCard
                payScale={insights.payScale}
                sourceDomain={paySourceDomain}
              />
            )}
            {resume && <FitScorePanel jobId={id} />}
            <TailoredResumePanel
              jobId={id}
              resumeId={resume?.id ?? null}
              initialContent={tailored?.content}
              guardrailPassed={guardrailPassed}
              jobTitle={job.title}
              company={job.company}
            />
            <CareerCopilotPanel
              jobId={id}
              resumeId={resume?.id ?? null}
              jobTitle={job.title}
              company={job.company}
            />
          </div>
        </div>
      </div>
      </main>
  );
}
