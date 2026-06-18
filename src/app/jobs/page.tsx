import { JobCard } from "@/components/JobCard";
import { JobLinkForm } from "@/components/JobLinkForm";
import { PageHeader } from "@/components/PageHeader";
import { getHomePageJobs } from "@/lib/rag/matching";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const { jobs } = await getHomePageJobs();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <PageHeader backHref="/" title="Job matches" />

        <div className="mb-8 uber-card p-5">
          <JobLinkForm />
        </div>

        {jobs.length === 0 ? (
          <p className="text-sm text-uber-gray-500">No jobs yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.jobId} {...job} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
