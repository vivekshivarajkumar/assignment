import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as cheerio from "cheerio";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { getOpenAI, CHAT_MODEL } from "../openai";

export interface JobInsightsData {
  interviewQuestions: string[];
  commonQuestions: string[];
  payScale: {
    min: number | null;
    max: number | null;
    median: number | null;
    currency: string;
    source: string;
    notes: string;
  };
  sources: string[];
}

const GLASSDOOR_SEARCH = "https://www.glassdoor.com/Search/results.htm?keyword=";
const LEVELS_SEARCH = "https://www.levels.fyi/companies/";

export async function fetchJobInsights(
  job: schema.Job
): Promise<JobInsightsData> {
  const webSnippets = await gatherWebSnippets(job);
  const openai = getOpenAI();

  if (openai) {
    try {
      return await generateInsightsWithAI(job, webSnippets);
    } catch (err) {
      console.warn("AI insights failed:", err);
    }
  }

  return buildFallbackInsights(job, webSnippets);
}

async function gatherWebSnippets(
  job: schema.Job
): Promise<{ text: string; url: string }[]> {
  const snippets: { text: string; url: string }[] = [];
  const query = encodeURIComponent(`${job.title} ${job.company} interview questions salary`);

  const searchUrls = [
    `${GLASSDOOR_SEARCH}${query}`,
    `${LEVELS_SEARCH}${job.company.toLowerCase().replace(/\s+/g, "-")}`,
  ];

  if (job.url) {
    searchUrls.unshift(job.url);
  }

  for (const url of searchUrls.slice(0, 3)) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ResumeMatchBot/1.0)",
          Accept: "text/html",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      $("script, style").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);
      if (text.length > 100) {
        snippets.push({ text, url });
      }
    } catch {
      // skip failed fetches
    }
  }

  return snippets;
}

async function generateInsightsWithAI(
  job: schema.Job,
  snippets: { text: string; url: string }[]
): Promise<JobInsightsData> {
  const openai = getOpenAI()!;

  const snippetBlock = snippets
    .map((s, i) => `[Source ${i + 1}: ${s.url}]\n${s.text.slice(0, 1500)}`)
    .join("\n\n");

  const res = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content: `You analyze job roles and produce interview prep insights. Use web snippets when available; supplement with well-known industry knowledge for the role. Return valid JSON only.`,
      },
      {
        role: "user",
        content: `Job: ${job.title} at ${job.company}
Location: ${job.location || "Unknown"}
Description: ${job.description.slice(0, 2000)}
Requirements: ${job.requirements || "N/A"}
Listed salary: ${job.salaryMin ? `$${job.salaryMin}-$${job.salaryMax}` : "Not listed"}

Web snippets:
${snippetBlock || "No web data fetched."}

Return JSON:
{
  "interviewQuestions": ["5-8 technical/behavioral questions likely for this role"],
  "commonQuestions": ["5-8 frequently asked questions about this role/company"],
  "payScale": {
    "min": number or null,
    "max": number or null,
    "median": number or null,
    "currency": "USD",
    "source": "brief source description",
    "notes": "1-2 sentence context"
  },
  "sources": ["urls used"]
}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const raw = res.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as JobInsightsData;

  return {
    interviewQuestions: parsed.interviewQuestions || [],
    commonQuestions: parsed.commonQuestions || [],
    payScale: parsed.payScale || buildPayScale(job),
    sources: [
      ...(parsed.sources || []),
      ...snippets.map((s) => s.url),
    ].filter((v, i, a) => a.indexOf(v) === i),
  };
}

function buildFallbackInsights(
  job: schema.Job,
  snippets: { text: string; url: string }[]
): JobInsightsData {
  const role = job.title.toLowerCase();
  const interviewQuestions = getRoleInterviewQuestions(role);
  const commonQuestions = [
    `What does a typical day look like for a ${job.title} at ${job.company}?`,
    `What are the growth opportunities for this ${job.title} role?`,
    `How does ${job.company}'s engineering/product culture support this role?`,
    `What metrics define success for this position?`,
    `What is the team structure I'd be joining?`,
    `What are the biggest challenges for this role right now?`,
  ];

  return {
    interviewQuestions,
    commonQuestions,
    payScale: buildPayScale(job),
    sources: snippets.map((s) => s.url),
  };
}

function buildPayScale(job: schema.Job): JobInsightsData["payScale"] {
  if (job.salaryMin && job.salaryMax) {
    return {
      min: job.salaryMin,
      max: job.salaryMax,
      median: Math.round((job.salaryMin + job.salaryMax) / 2),
      currency: "USD",
      source: job.url ? "Job posting" : "Seed data",
      notes: "Salary from job listing or database.",
    };
  }
  return {
    min: null,
    max: null,
    median: null,
    currency: "USD",
    source: "Estimated — set OPENAI_API_KEY for richer data",
    notes: "No salary listed. Add OPENAI_API_KEY to fetch market estimates from web sources.",
  };
}

function getRoleInterviewQuestions(role: string): string[] {
  const base = [
    "Tell me about a challenging project you worked on and your specific contribution.",
    "How do you prioritize when you have multiple deadlines?",
    "Describe a time you disagreed with a teammate. How did you resolve it?",
  ];

  if (role.includes("frontend") || role.includes("full stack")) {
    return [
      ...base,
      "Explain how React reconciliation works.",
      "How do you optimize web performance (Core Web Vitals)?",
      "Walk through how you'd design a component library.",
      "Describe your approach to state management in a large app.",
    ];
  }
  if (role.includes("machine learning") || role.includes("ml")) {
    return [
      ...base,
      "Explain bias-variance tradeoff with an example.",
      "How would you evaluate an LLM/RAG pipeline?",
      "Describe a model you deployed to production and monitoring you used.",
      "How do you handle imbalanced datasets?",
    ];
  }
  if (role.includes("backend") || role.includes("data")) {
    return [
      ...base,
      "Design a rate-limited API for 10M daily requests.",
      "Explain database indexing and when it hurts performance.",
      "How would you debug a production latency spike?",
      "Compare SQL vs NoSQL for a given use case.",
    ];
  }
  if (role.includes("devops") || role.includes("platform")) {
    return [
      ...base,
      "Walk through a CI/CD pipeline you built.",
      "How do you manage secrets in Kubernetes?",
      "Explain your approach to incident response.",
      "Terraform vs CloudFormation — tradeoffs?",
    ];
  }

  return [
    ...base,
    "Why are you interested in this role and company?",
    "What technologies in our stack are you most excited to work with?",
    "Where do you see yourself in 3 years?",
    "What questions do you have for us?",
  ];
}

export async function getOrFetchInsights(
  jobId: string
): Promise<JobInsightsData & { cached: boolean }> {
  const db = getDb();

  const cached = await db
    .select()
    .from(schema.jobInsights)
    .where(eq(schema.jobInsights.jobId, jobId))
    .limit(1);

  if (cached[0]) {
    return {
      interviewQuestions: JSON.parse(cached[0].interviewQuestions || "[]"),
      commonQuestions: JSON.parse(cached[0].commonQuestions || "[]"),
      payScale: JSON.parse(cached[0].payScale || "{}"),
      sources: JSON.parse(cached[0].sources || "[]"),
      cached: true,
    };
  }

  const [job] = await db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.id, jobId))
    .limit(1);

  if (!job) throw new Error("Job not found");

  const insights = await fetchJobInsights(job);

  await db.insert(schema.jobInsights).values({
    id: uuidv4(),
    jobId,
    interviewQuestions: JSON.stringify(insights.interviewQuestions),
    commonQuestions: JSON.stringify(insights.commonQuestions),
    payScale: JSON.stringify(insights.payScale),
    sources: JSON.stringify(insights.sources),
    fetchedAt: new Date(),
  });

  return { ...insights, cached: false };
}

export async function refreshInsights(jobId: string) {
  const db = getDb();
  await db.delete(schema.jobInsights).where(eq(schema.jobInsights.jobId, jobId));
  return getOrFetchInsights(jobId);
}
