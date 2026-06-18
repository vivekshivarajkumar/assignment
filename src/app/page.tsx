import { ResumeUpload } from "@/components/ResumeUpload";
import { JobLinkForm } from "@/components/JobLinkForm";
import { JobCard } from "@/components/JobCard";
import { PageHeader } from "@/components/PageHeader";
import { getHomePageJobs } from "@/lib/rag/matching";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { resume, jobs, filtered } = await getHomePageJobs();

  const resumeSkills = resume?.skills
    ? (JSON.parse(resume.skills) as string[])
    : [];

  const topMatch = filtered && jobs.length > 0 ? jobs[0] : null;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <PageHeader />

        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_top_right,#8b7bf0,transparent_60%),linear-gradient(135deg,#5b4bd6,#6c5ce7)] px-6 py-9 text-white shadow-[0_30px_70px_-35px_rgba(91,75,214,0.9)] sm:px-10 sm:py-11">
          {/* decorative star glints */}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="currentColor"
            className="pointer-events-none absolute -right-2 top-1/2 h-52 w-52 -translate-y-1/2 text-white/10"
          >
            <path d="M12 2l2.39 6.96L21 11.35l-6.61 2.39L12 21l-2.39-6.96L3 11.35l6.61-2.39L12 2z" />
          </svg>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="currentColor"
            className="pointer-events-none absolute right-40 top-6 h-16 w-16 text-white/10"
          >
            <path d="M12 2l2.39 6.96L21 11.35l-6.61 2.39L12 21l-2.39-6.96L3 11.35l6.61-2.39L12 2z" />
          </svg>

          <div className="relative max-w-2xl">
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              AI career copilot
            </p>
            <h1 className="text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
              Land the role that fits you best
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/85">
              Upload your resume, paste a job, get matched roles and a tailored
              application — ranked by real fit.
            </p>

            {filtered ? (
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-baseline gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur">
                  <span className="font-bold tabular-nums">{jobs.length}</span>
                  <span className="text-white/75">matches</span>
                </span>
                <span className="inline-flex items-baseline gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur">
                  <span className="font-bold tabular-nums">
                    {Math.round(topMatch?.matchPercentage ?? 0)}%
                  </span>
                  <span className="text-white/75">top fit</span>
                </span>
                <span className="inline-flex items-baseline gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium ring-1 ring-white/20 backdrop-blur">
                  <span className="font-bold tabular-nums">
                    {resumeSkills.length}
                  </span>
                  <span className="text-white/75">skills detected</span>
                </span>
              </div>
            ) : (
              <a
                href="#upload"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-accent shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4)] transition-transform hover:-translate-y-0.5"
              >
                Upload your resume
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m13 6 6 6-6 6M5 12h14" />
                </svg>
              </a>
            )}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <section id="upload" className="uber-card scroll-mt-6 p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold text-black">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent">
                1
              </span>
              Upload resume
            </h2>
            <ResumeUpload
              initialResume={
                resume
                  ? {
                      id: resume.id,
                      filename: resume.filename,
                      content: resume.content,
                      skills: resumeSkills,
                      fileType: resume.fileType,
                    }
                  : null
              }
            />
          </section>

          <section className="uber-card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold text-black">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-light text-sm font-bold text-accent">
                2
              </span>
              Paste job requirements to craft your resume
            </h2>
            <JobLinkForm />
          </section>
        </div>

        <section id="your-matches" className="mt-12 scroll-mt-6" key={resume?.id ?? "no-resume"}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-black">
                  {filtered ? "Your matches" : "Open roles"}
                </h2>
                <span className="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-bold text-accent tabular-nums">
                  {jobs.length}
                </span>
              </div>
              <p className="mt-1 text-sm text-uber-gray-500">
                {filtered
                  ? `Ranked by fit against ${resume?.filename}.`
                  : "Upload a resume above to rank these by fit score."}
              </p>
            </div>

            {filtered && topMatch && (
              <div className="inline-flex items-center gap-2 rounded-full bg-uber-green-light px-3.5 py-1.5 text-sm font-medium text-uber-green">
                <span className="h-2 w-2 rounded-full bg-uber-green" />
                Top match {Math.round(topMatch.matchPercentage ?? 0)}% · {topMatch.company}
              </div>
            )}
          </div>

          {jobs.length === 0 ? (
            <p className="text-sm text-uber-gray-500">No jobs yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobs.map((job) => (
                <JobCard key={job.jobId} {...job} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
