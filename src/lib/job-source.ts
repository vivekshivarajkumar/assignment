/** Known employer domains for seeded demo jobs (no URL stored). */
const COMPANY_DOMAINS: Record<string, string> = {
  razorpay: "razorpay.com",
  stripe: "stripe.com",
  openai: "openai.com",
  vercel: "vercel.com",
  datadog: "datadoghq.com",
  hashicorp: "hashicorp.com",
  snowflake: "snowflake.com",
  notion: "notion.so",
  shopify: "shopify.com",
};

/** Resolve the domain a job is sourced from — its posting URL host, else the employer site. */
export function jobSourceDomain(
  company: string,
  url?: string | null
): string {
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  const key = company.trim().toLowerCase();
  if (COMPANY_DOMAINS[key]) return COMPANY_DOMAINS[key];
  const slug = key.replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : "";
}

/** A favicon URL that always resolves (Google falls back to a generic globe). */
export function faviconUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain
  )}&sz=${size}`;
}

/** Distinct interview-prep sources cycled so each question cites a different one. */
export const INTERVIEW_SOURCES: { domain: string; label: string }[] = [
  { domain: "glassdoor.com", label: "Glassdoor" },
  { domain: "levels.fyi", label: "levels.fyi" },
  { domain: "leetcode.com", label: "LeetCode" },
  { domain: "geeksforgeeks.org", label: "GeeksforGeeks" },
  { domain: "interviewing.io", label: "interviewing.io" },
  { domain: "themuse.com", label: "The Muse" },
  { domain: "teamblind.com", label: "Blind" },
];

export function interviewSource(index: number): { domain: string; label: string } {
  return INTERVIEW_SOURCES[index % INTERVIEW_SOURCES.length];
}

/** A search link that lands on the given source for this question. */
export function questionSearchUrl(question: string, domain: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(
    `${question} site:${domain}`
  )}`;
}
