import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as cheerio from "cheerio";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { chatJSON, hasAI } from "@/lib/ai/chat";
import {
  embedTextLocal,
  extractResumeSearchKeywords,
  extractSkills,
  serializeEmbedding,
} from "@/lib/rag/embeddings";
import {
  extractJobProfileLocal,
} from "@/lib/scoring/fit";
import type { CandidateProfileGraph } from "@/lib/scoring/types";

type DiscoveredJob = {
  title: string;
  company: string;
  url: string | null;
  description: string;
  requirements: string;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  source: "web-search" | "personalized";
};

type PersonalizedSearchPlan = {
  profileSummary: string;
  targetRoles: string[];
  roleTypes: string[];
  coreSkills: string[];
  domainKeywords: string[];
  experienceKeywords: string[];
  seniorityKeywords: string[];
  locationKeywords: string[];
  queries: string[];
};

const INDIA_LOCATIONS = [
  "India",
  "Bengaluru",
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Gurugram",
  "Gurgaon",
  "Noida",
  "Chennai",
  "Remote India",
];

const DATA_SCIENCE_SKILLS = new Set([
  "python",
  "sql",
  "machine learning",
  "data science",
  "data analysis",
  "data analytics",
  "analytics",
  "statistics",
  "pandas",
  "numpy",
  "scikit-learn",
  "sklearn",
  "tensorflow",
  "pytorch",
  "spark",
  "airflow",
  "tableau",
  "power bi",
  "predictive modeling",
  "regression",
  "classification",
  "clustering",
]);

const ENGINEERING_SKILLS = new Set([
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "java",
  "go",
  "docker",
  "kubernetes",
  "terraform",
  "aws",
]);

export async function discoverPersonalizedJobsForResume(
  input: {
    resumeId: string;
    content: string;
    skills?: string[];
    profile?: CandidateProfileGraph;
  },
  options: { useAi: boolean; limit?: number; deadlineMs?: number }
): Promise<{ inserted: number; queries: string[]; keywords: string[] }> {
  const skills = input.skills?.length ? input.skills : extractSkills(input.content);
  const profile = input.profile ?? buildMinimalProfile(input.content, skills);
  const keywords = [
    ...extractResumeSearchKeywords(input.content, skills),
    ...(profile.profileKeywords || []),
    ...(profile.roleTypes || []),
    ...(profile.targetRoles || []),
    ...(profile.domains || []),
  ].filter(Boolean);

  const plan =
    options.useAi && hasAI()
      ? await buildAiSearchPlan(input.content, skills, profile, keywords)
      : buildLocalSearchPlan(skills, profile, keywords);

  const limit = options.limit ?? 6;
  const jobs = await fetchPersonalizedJobResults(
    plan,
    limit,
    options.deadlineMs ?? 8000
  );
  const fallbackJobs = buildPersonalizedFallbackJobs(plan, profile);
  let relevantJobs = jobs
    .filter((job) => isPersonalizedJobCandidate(job, plan, keywords))
    .concat(fallbackJobs)
    .filter(uniqueJobFilter())
    .slice(0, limit);
  if (relevantJobs.length === 0) {
    relevantJobs = buildPersonalizedFallbackJobs(plan, profile).slice(0, limit);
  }

  const created = await Promise.all(
    relevantJobs.map((job) => insertDiscoveredJob(job))
  );
  const inserted = created.filter(Boolean).length;

  return { inserted, queries: plan.queries, keywords: [...new Set(keywords)] };
}

async function buildAiSearchPlan(
  resumeContent: string,
  skills: string[],
  profile: CandidateProfileGraph,
  keywords: string[]
): Promise<PersonalizedSearchPlan> {
  try {
    const plan = await withTimeout(
      chatJSON<PersonalizedSearchPlan>(
        "You create deeply personalized India-focused job-search queries from a candidate resume. Return valid JSON only. Prefer credible jobs the candidate can apply for now. Do not suggest unrelated roles.",
        `Candidate profile features:
Seniority: ${profile.seniorityLevel}
Years experience: ${profile.yearsExperience ?? "unknown"}
Candidate type: ${profile.candidateType}
Role types: ${(profile.roleTypes || []).join(", ")}
Target roles: ${(profile.targetRoles || []).join(", ")}
Domains: ${profile.domains.join(", ")}
Industries: ${(profile.industries || []).join(", ")}
Locations: ${(profile.locations || []).join(", ")}
Skills: ${skills.join(", ")}
Tools: ${profile.tools.join(", ")}
Education: ${(profile.education || []).join(", ")}
Certifications: ${(profile.certifications || []).join(", ")}
Achievements: ${profile.achievements.join(" | ")}
Strong evidence: ${profile.strongestEvidence.join(" | ")}
Resume excerpt:
${resumeContent.slice(0, 4000)}

Create India-based searches only. Include Bangalore/Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, Gurugram, Noida, Chennai, or Remote India where relevant. If this is a data science profile, prioritize Data Scientist, Machine Learning Engineer, Data Analyst, Analytics Engineer, and Data Engineer roles over frontend/devops roles.

Return JSON:
{
  "profileSummary": "one sentence describing this exact candidate",
  "targetRoles": ["3-6 credible role titles"],
  "roleTypes": ["data science|analytics|ml|data engineering|software|product etc"],
  "coreSkills": ["6-10 strongest resume-backed skills"],
  "domainKeywords": ["2-6 domains or industries"],
  "experienceKeywords": ["years/level/scope keywords"],
  "seniorityKeywords": ["entry|mid|senior|lead etc"],
  "locationKeywords": ["India locations only"],
  "queries": ["5 concise India-focused web job search queries using role + top skills + India location + jobs"]
}`
      ),
      6000
    );
    return normalizeSearchPlan(plan, skills, profile, keywords);
  } catch (err) {
    console.warn("AI job search plan failed, using local plan:", err);
    return buildLocalSearchPlan(skills, profile, keywords);
  }
}

function buildLocalSearchPlan(
  skills: string[],
  profile: CandidateProfileGraph,
  keywords: string[]
): PersonalizedSearchPlan {
  const dataSkillCount = skills.filter((skill) =>
    DATA_SCIENCE_SKILLS.has(skill)
  ).length;
  const engineeringSkillCount = skills.filter((skill) =>
    ENGINEERING_SKILLS.has(skill)
  ).length;

  const targetRoles =
    profile.targetRoles?.length
      ? profile.targetRoles
      : dataSkillCount >= Math.max(2, engineeringSkillCount)
        ? [
            "Data Scientist",
            "Machine Learning Engineer",
            "Data Analyst",
            "Analytics Engineer",
            "Data Engineer",
          ]
        : engineeringSkillCount >= 3
          ? ["Software Engineer", "Full Stack Engineer", "Backend Engineer"]
          : ["Technology Analyst", "Product Analyst", "Business Analyst"];

  const coreSkills = skills
    .filter((skill) =>
      dataSkillCount >= engineeringSkillCount
        ? DATA_SCIENCE_SKILLS.has(skill) || skill === "sql"
        : true
    )
    .slice(0, 10);

  const locationKeywords = profile.locations?.some((loc) =>
    /india|bangalore|bengaluru|hyderabad|pune|mumbai|delhi|gurugram|gurgaon|noida|chennai/i.test(loc)
  )
    ? profile.locations
    : ["India", "Bengaluru", "Hyderabad", "Pune", "Remote India"];

  const domainKeywords = [
    ...(profile.domains || []),
    ...(profile.industries || []),
  ].filter((domain) => domain !== "technology");
  const seniorityKeywords =
    profile.seniorityLevel && profile.seniorityLevel !== "mid"
      ? [profile.seniorityLevel]
      : [];
  const experienceKeywords = profile.yearsExperience
    ? [`${profile.yearsExperience}+ years`]
    : [];

  const queries = targetRoles.slice(0, 5).map((role, index) =>
    [
      role,
      coreSkills.slice(0, 4).join(" "),
      domainKeywords.slice(0, 1).join(" "),
      locationKeywords[index % locationKeywords.length],
      "jobs",
    ]
      .filter(Boolean)
      .join(" ")
  );

  return normalizeSearchPlan(
    {
      profileSummary: `${profile.seniorityLevel} ${targetRoles[0] || "technology"} candidate`,
      targetRoles,
      roleTypes: profile.roleTypes || [],
      coreSkills,
      domainKeywords,
      experienceKeywords,
      seniorityKeywords,
      locationKeywords,
      queries,
    },
    skills,
    profile,
    keywords
  );
}

function normalizeSearchPlan(
  plan: PersonalizedSearchPlan,
  skills: string[],
  profile: CandidateProfileGraph,
  keywords: string[]
): PersonalizedSearchPlan {
  const targetRoles = [...new Set(plan.targetRoles || profile.targetRoles || [])]
    .filter(Boolean)
    .slice(0, 6);
  const coreSkills = [...new Set(plan.coreSkills?.length ? plan.coreSkills : skills)]
    .filter(Boolean)
    .slice(0, 10);
  const domainKeywords = [
    ...new Set(plan.domainKeywords?.length ? plan.domainKeywords : profile.domains),
  ].filter(Boolean).slice(0, 6);
  const locationKeywords = [
    ...new Set([
      ...(plan.locationKeywords || []),
      ...(profile.locations || []),
      "India",
    ]),
  ]
    .filter((loc) => INDIA_LOCATIONS.some((indiaLoc) => loc.toLowerCase().includes(indiaLoc.toLowerCase())) || /india/i.test(loc))
    .slice(0, 6);
  const safeLocations = locationKeywords.length
    ? locationKeywords
    : ["India", "Bengaluru", "Hyderabad", "Pune", "Remote India"];
  const fallbackQueries = (targetRoles.length ? targetRoles : keywords.slice(0, 4)).map(
    (role, index) =>
      [role, coreSkills.slice(0, 4).join(" "), safeLocations[index % safeLocations.length], "jobs"]
        .filter(Boolean)
        .join(" ")
  );
  const queries = [...new Set([...(plan.queries || []), ...fallbackQueries])]
    .map((query) => ensureIndiaQuery(query))
    .filter((query) => query.length > 5)
    .slice(0, 6);

  return {
    profileSummary: plan.profileSummary || `${profile.seniorityLevel} candidate`,
    targetRoles,
    roleTypes: [...new Set(plan.roleTypes || profile.roleTypes || [])].slice(0, 6),
    coreSkills,
    domainKeywords,
    experienceKeywords: [...new Set(plan.experienceKeywords || [])].slice(0, 4),
    seniorityKeywords: [...new Set(plan.seniorityKeywords || [])].slice(0, 4),
    locationKeywords: safeLocations,
    queries,
  };
}

async function fetchPersonalizedJobResults(
  plan: PersonalizedSearchPlan,
  limit: number,
  deadlineMs: number
): Promise<DiscoveredJob[]> {
  const queries = plan.queries.slice(0, 5).map(sanitizeIndiaQuery);
  const search = Promise.all(
    queries.flatMap((query) => [fetchDuckDuckGoJobs(query), fetchRemotiveJobs(query)])
  ).then((groups) => groups.flat());
  const results = await withTimeout(search, deadlineMs).catch(() => []);

  const seen = new Set<string>();
  return results.filter((job) => {
    const key = normalizeKey(job.url || `${job.title}-${job.company}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchDuckDuckGoJobs(query: string): Promise<DiscoveredJob[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(
    `${query} India apply site:greenhouse.io OR site:jobs.lever.co OR site:workable.com OR site:ashbyhq.com OR site:wellfound.com/jobs OR site:cutshort.io/job`
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CareerCrafterAI/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const jobs: DiscoveredJob[] = [];

    $(".result").each((_, el) => {
      const link = $(el).find(".result__a").first();
      const titleText = link.text().replace(/\s+/g, " ").trim();
      const href = resolveDuckDuckGoUrl(link.attr("href") || null);
      const snippet = $(el)
        .find(".result__snippet")
        .text()
        .replace(/\s+/g, " ")
        .trim();
      if (!titleText || !snippet || !href) return;
      const { title, company } = splitSearchTitle(titleText, href);
      jobs.push({
        title,
        company,
        url: href,
        description: snippet,
        requirements: snippet,
        location: inferIndiaLocation(`${titleText} ${snippet}`),
        salaryMin: null,
        salaryMax: null,
        source: "web-search",
      });
    });

    return jobs.filter(isSpecificJobPosting).slice(0, 8);
  } catch {
    return [];
  }
}

async function fetchRemotiveJobs(query: string): Promise<DiscoveredJob[]> {
  try {
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "CareerCrafterAI/1.0",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      jobs?: Array<{
        title?: string;
        company_name?: string;
        url?: string;
        description?: string;
        candidate_required_location?: string;
        salary?: string;
        tags?: string[];
      }>;
    };

    return (data.jobs || [])
      .filter((job) =>
        /india|anywhere|worldwide|remote/i.test(job.candidate_required_location || "")
      )
      .slice(0, 8)
      .map((job) => ({
        title: cleanText(job.title || "Open Role"),
        company: cleanText(job.company_name || "Hiring Company"),
        url: job.url || null,
        description: htmlToText(job.description || "").slice(0, 4000),
        requirements: [...(job.tags || [])].join(", "),
        location: cleanText(job.candidate_required_location || "Remote India"),
        salaryMin: null,
        salaryMax: null,
        source: "web-search" as const,
      }))
      .filter(isSpecificJobPosting);
  } catch {
    return [];
  }
}

function isPersonalizedJobCandidate(
  job: DiscoveredJob,
  plan: PersonalizedSearchPlan,
  keywords: string[]
): boolean {
  const haystack = `${job.title} ${job.company} ${job.description} ${job.requirements} ${job.location}`.toLowerCase();
  const indiaHit = /india|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|gurugram|gurgaon|noida|chennai|remote/i.test(haystack);
  const roleHit = plan.targetRoles.some((role) =>
    haystack.includes(role.toLowerCase())
  );
  const skillHits = plan.coreSkills.filter((skill) =>
    haystack.includes(skill.toLowerCase())
  ).length;
  const keywordHits = keywords.filter((keyword) =>
    haystack.includes(keyword.toLowerCase())
  ).length;
  return indiaHit && (roleHit || skillHits >= 2 || keywordHits >= 2);
}

function isSpecificJobPosting(job: DiscoveredJob): boolean {
  const title = job.title.toLowerCase();
  const company = job.company.toLowerCase();
  const url = job.url?.toLowerCase() || "";
  const genericTitle =
    /\b(job|jobs|vacancies|vacancy|openings|hiring)\b.*\b(india|june|2026|apply)\b/i.test(
      job.title
    ) ||
    /^\d+\s+/.test(job.title) ||
    /\bjobs?\s+(in|near|at)\b/i.test(job.title) ||
    /\bjob vacancies\b/i.test(job.title);
  const genericCompany = [
    "in",
    "india",
    "naukri",
    "naukri.com",
    "linkedin",
    "linkedin india",
    "jobs",
    "hiring company",
  ].includes(company);
  const listingUrl =
    /naukri\.com|linkedin\.com\/jobs\/search|\/jobs\?|\/search|job-vacancies|jobs-in-/i.test(
      url
    );

  return !genericTitle && !genericCompany && !listingUrl && title.length > 4;
}

function buildPersonalizedFallbackJobs(
  plan: PersonalizedSearchPlan,
  profile: CandidateProfileGraph
): DiscoveredJob[] {
  const roleTypes = [
    ...plan.roleTypes,
    ...(profile.roleTypes || []),
    ...profile.domains,
  ]
    .join(" ")
    .toLowerCase();
  const isDataAiProfile =
    /data|analytics|machine learning|mlops|ai|genai|llm/.test(roleTypes) ||
    plan.coreSkills.some((skill) =>
      /python|sql|machine learning|data science|analytics|pandas|numpy|llm|rag|mlops/i.test(
        skill
      )
    );
  const seniority = `${profile.seniorityLevel} ${profile.candidateType}`.toLowerCase();
  const isLeader =
    /director|executive|head|vp|lead|manager/.test(seniority) ||
    plan.targetRoles.some((role) => /director|head|vp|leader|manager/i.test(role));

  const companies = isDataAiProfile
    ? [
        {
          company: "Fractal Analytics",
          url: "https://fractal.ai/careers/",
          location: "Bengaluru, India",
        },
        {
          company: "Tiger Analytics",
          url: "https://www.tigeranalytics.com/careers/",
          location: "Chennai, India",
        },
        {
          company: "Quantiphi",
          url: "https://quantiphi.com/careers/",
          location: "Mumbai, India",
        },
        {
          company: "Tredence",
          url: "https://www.tredence.com/careers",
          location: "Bengaluru, India",
        },
        {
          company: "PhonePe",
          url: "https://www.phonepe.com/careers/",
          location: "Bengaluru, India",
        },
        {
          company: "Flipkart",
          url: "https://www.flipkartcareers.com/",
          location: "Bengaluru, India",
        },
      ]
    : [
        {
          company: "Razorpay",
          url: "https://razorpay.com/jobs/",
          location: "Bengaluru, India",
        },
        {
          company: "Freshworks",
          url: "https://www.freshworks.com/company/careers/",
          location: "Chennai, India",
        },
        {
          company: "Zoho",
          url: "https://www.zoho.com/careers/",
          location: "Chennai, India",
        },
        {
          company: "Swiggy",
          url: "https://careers.swiggy.com/",
          location: "Bengaluru, India",
        },
      ];

  const titles =
    plan.targetRoles.length > 0
      ? plan.targetRoles
      : isDataAiProfile
        ? isLeader
          ? ["Director of Data Science", "Head of AI/ML", "AI Product Leader"]
          : ["Data Scientist", "Machine Learning Engineer", "Data Analyst"]
        : ["Software Engineer", "Product Analyst", "Technology Analyst"];

  const coreSkills = plan.coreSkills.slice(0, 8);
  const domains = [...new Set([...plan.domainKeywords, ...profile.domains])]
    .filter(Boolean)
    .slice(0, 4);
  const evidence = profile.strongestEvidence.slice(0, 3);

  return companies.slice(0, 6).map((company, index) => {
    const title = titles[index % titles.length];
    const seniorityPhrase = isLeader
      ? "own strategy, stakeholder alignment, team direction, and measurable business impact"
      : "deliver hands-on work with measurable project outcomes";
    return {
      title,
      company: company.company,
      url: company.url,
      location: company.location,
      description: `${company.company} target role for a ${profile.seniorityLevel} ${profile.candidateType} profile. This recommendation is personalized for ${domains.join(", ") || "technology"} experience and expects the candidate to ${seniorityPhrase}. Strong fit signals include ${coreSkills.join(", ")}.${evidence.length ? ` Resume evidence: ${evidence.join(" ")}` : ""}`,
      requirements: [
        ...coreSkills,
        ...domains,
        ...titles,
        isLeader ? "leadership" : "hands-on delivery",
        isLeader ? "strategy" : "project execution",
        "India",
      ].join(", "),
      salaryMin: null,
      salaryMax: null,
      source: "personalized" as const,
    };
  });
}

async function insertDiscoveredJob(job: DiscoveredJob): Promise<boolean> {
  const db = getDb();
  const existing = await db
    .select({ id: schema.jobs.id })
    .from(schema.jobs)
    .where(
      job.url
        ? eq(schema.jobs.url, job.url)
        : and(eq(schema.jobs.title, job.title), eq(schema.jobs.company, job.company))
    )
    .limit(1);

  if (existing[0]) return false;

  const jobText = `${job.title} ${job.description} ${job.requirements}`;
  const embedding = embedTextLocal(jobText);
  const structuredProfile = extractJobProfileLocal(job);

  await db.insert(schema.jobs).values({
    id: uuidv4(),
    title: job.title,
    company: job.company,
    url: job.url,
    description: job.description || job.requirements,
    requirements: job.requirements,
    location: job.location,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    source: job.source,
    structuredProfile: JSON.stringify(structuredProfile),
    embedding: serializeEmbedding(embedding),
    createdAt: new Date(),
  });

  return true;
}

function buildMinimalProfile(
  content: string,
  skills: string[]
): CandidateProfileGraph {
  const dataProfile = /data|analytics|machine learning|statistics|python|sql/i.test(content);
  return {
    seniorityLevel: /senior|lead|principal/i.test(content) ? "senior" : "mid",
    yearsExperience: null,
    domains: dataProfile ? ["data science", "analytics"] : ["technology"],
    skills,
    tools: skills,
    roleTypes: dataProfile ? ["data science", "analytics", "machine learning"] : ["technology"],
    targetRoles: dataProfile
      ? ["Data Scientist", "Machine Learning Engineer", "Data Analyst"]
      : [],
    industries: [],
    locations: ["India"],
    education: [],
    certifications: [],
    responsibilities: [],
    senioritySignals: [],
    domainEvidence: [],
    profileKeywords: skills,
    achievements: [],
    leadershipMarkers: [],
    strongestEvidence: [],
    gaps: [],
    candidateType: "domain_specialist",
  };
}

function resolveDuckDuckGoUrl(href: string | null): string | null {
  if (!href) return null;
  try {
    const parsed = new URL(href, "https://duckduckgo.com");
    const uddg = parsed.searchParams.get("uddg");
    return uddg || parsed.toString();
  } catch {
    return null;
  }
}

function splitSearchTitle(raw: string, url: string): { title: string; company: string } {
  const separators = [" - ", " | ", " at "];
  for (const sep of separators) {
    const parts = raw.split(sep).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        title: cleanText(parts[0]).slice(0, 120),
        company: cleanText(parts[parts.length - 1]).slice(0, 80),
      };
    }
  }
  return {
    title: cleanText(raw).slice(0, 120),
    company: inferCompanyFromUrl(url),
  };
}

function inferCompanyFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const parts = host.split(".");
    const name = parts[0] === "jobs" && parts[1] ? parts[1] : parts[0];
    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "Hiring Company";
  }
}

function inferIndiaLocation(text: string): string {
  const hit = INDIA_LOCATIONS.find((loc) =>
    text.toLowerCase().includes(loc.toLowerCase())
  );
  return hit || "India";
}

function htmlToText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style").remove();
  return cleanText($.text());
}

function ensureIndiaQuery(query: string): string {
  const cleaned = sanitizeIndiaQuery(query);
  return /india|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|gurugram|gurgaon|noida|chennai/i.test(cleaned)
    ? cleaned
    : `${cleaned} India`;
}

function sanitizeIndiaQuery(query: string): string {
  return query
    .replace(/\b(?:USA|United States|Atlanta|Athens|New York|San Francisco|California|CA|NY)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function uniqueJobFilter(): (job: DiscoveredJob) => boolean {
  const seen = new Set<string>();
  return (job) => {
    const key = normalizeKey(`${job.title}-${job.company}-${job.url || ""}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Timed out")), ms);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
