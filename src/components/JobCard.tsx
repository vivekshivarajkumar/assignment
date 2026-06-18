import Link from "next/link";
import { MatchBadge } from "./MatchBadge";
import { IconChevronRight, IconLocation, IconSalary } from "./icons";
import { jobSourceDomain, faviconUrl } from "@/lib/job-source";

interface JobCardProps {
  jobId: string;
  title: string;
  company: string;
  location?: string | null;
  matchPercentage?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  source?: string | null;
  url?: string | null;
}

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max!);
}

export function JobCard({
  jobId,
  title,
  company,
  location,
  matchPercentage,
  salaryMin,
  salaryMax,
  source,
  url,
}: JobCardProps) {
  const salary = formatSalary(salaryMin, salaryMax);
  const domain = jobSourceDomain(company, url);

  return (
    <Link
      href={`/jobs/${jobId}`}
      className="group uber-card-hover flex flex-col p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl(domain)}
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
            />
          </span>
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-semibold leading-snug text-black group-hover:text-accent">
              {title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-uber-gray-500">
              {company}
            </p>
          </div>
        </div>
        {matchPercentage != null && (
          <MatchBadge
            percentage={Math.round(matchPercentage)}
            size="sm"
            showLabel={false}
          />
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-uber-gray-600">
        {location && (
          <span className="inline-flex items-center gap-1">
            <IconLocation className="h-3.5 w-3.5" />
            {location}
          </span>
        )}
        {salary && (
          <span className="inline-flex items-center gap-1">
            <IconSalary className="h-3.5 w-3.5" />
            {salary}
          </span>
        )}
        {source === "user" && (
          <span className="rounded-full bg-uber-green-light px-2.5 py-0.5 font-medium text-uber-green">
            Added by you
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-uber-gray-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-uber-gray-400">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={faviconUrl(domain, 32)} alt="" width={14} height={14} className="h-3.5 w-3.5 rounded-sm" />
          via {domain}
        </span>
        <span className="flex items-center text-sm font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
          View details
          <IconChevronRight className="ml-1 h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
